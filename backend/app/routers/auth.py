import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.audit import add_audit
from app.config import get_settings
from app.dependencies import DB, CurrentUser, verify_csrf
from app.models import User
from app.rate_limit import limiter
from app.schemas import (
    LoginRequest,
    Message,
    PasswordChange,
    TokenResponse,
    UserCreate,
    UserRead,
)
from app.security import (
    create_token,
    decode_token,
    generate_csrf_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Авторизация"])
settings = get_settings()


def set_session_cookies(response: Response, refresh_token: str, csrf_token: str) -> None:
    max_age = settings.refresh_token_days * 86400
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/api/auth",
    )
    response.set_cookie(
        "csrf_token",
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie("refresh_token", path="/api/auth")
    response.delete_cookie("csrf_token", path="/")


def token_response(user: User, response: Response) -> TokenResponse:
    csrf_token = generate_csrf_token()
    refresh_token = create_token(user.id, user.token_version, "refresh")
    set_session_cookies(response, refresh_token, csrf_token)
    return TokenResponse(
        access_token=create_token(user.id, user.token_version, "access"),
        expires_in=settings.access_token_minutes * 60,
        csrf_token=csrf_token,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(payload: LoginRequest, response: Response, request: Request, db: DB) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    return token_response(user, response)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(verify_csrf)],
)
async def refresh(request: Request, response: Response, db: DB) -> TokenResponse:
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh-токен отсутствует")
    try:
        payload = decode_token(token, "refresh")
        user_id = uuid.UUID(str(payload["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError) as exc:
        clear_session_cookies(response)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительная сессия") from exc
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active or user.token_version != payload["ver"]:
        clear_session_cookies(response)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Сессия завершена")
    return token_response(user, response)


@router.post("/logout", response_model=Message, dependencies=[Depends(verify_csrf)])
async def logout(response: Response, user: CurrentUser, db: DB) -> Message:
    user.token_version += 1
    await db.commit()
    clear_session_cookies(response)
    return Message(detail="Вы вышли из системы")


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> User:
    return user


@router.get("/users", response_model=list[UserRead])
async def list_users(_: CurrentUser, db: DB) -> list[User]:
    return list(
        (
            await db.scalars(
                select(User).where(User.is_active.is_(True)).order_by(User.email)
            )
        ).all()
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, _: CurrentUser, db: DB) -> User:
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь уже существует") from exc
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", response_model=Message)
async def delete_user(user_id: uuid.UUID, current_user: CurrentUser, db: DB) -> Message:
    active_user_ids = list(
        (
            await db.scalars(
                select(User.id)
                .where(User.is_active.is_(True))
                .order_by(User.id)
                .with_for_update()
            )
        ).all()
    )
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    if user.id == current_user.id:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Нельзя удалить собственную учётную запись",
        )
    if len(active_user_ids) <= 1:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Нельзя удалить последнего активного администратора",
        )

    user.is_active = False
    user.token_version += 1
    add_audit(
        db,
        current_user,
        "delete",
        "user",
        user.id,
        {"email": user.email, "mode": "deactivate"},
    )
    await db.commit()
    return Message(detail="Пользователь удалён")


@router.post("/change-password", response_model=Message)
async def change_password(payload: PasswordChange, user: CurrentUser, db: DB) -> Message:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Текущий пароль указан неверно")
    user.password_hash = hash_password(payload.new_password)
    user.token_version += 1
    await db.commit()
    return Message(detail="Пароль изменён. Выполните вход снова")
