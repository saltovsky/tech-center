import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import Condition, DeviceType, DocumentStatus, User
from app.rate_limit import limiter
from app.routers import auth, directories, documents
from app.security import hash_password

settings = get_settings()
class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps(
            {
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            },
            ensure_ascii=False,
        )


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)


async def seed_defaults() -> None:
    async with SessionLocal() as db:
        if await db.scalar(select(User.id).limit(1)) is None:
            db.add(
                User(
                    email=str(settings.initial_admin_email).lower(),
                    password_hash=hash_password(settings.initial_admin_password),
                )
            )
        defaults = (
            (Condition, ["Новый", "БУ"]),
            (DeviceType, ["Ноутбук", "Планшет", "Смартфон"]),
        )
        for model, names in defaults:
            existing = set((await db.scalars(select(model.name))).all())
            db.add_all([model(name=name) for name in names if name not in existing])
        existing_statuses = set((await db.scalars(select(DocumentStatus.name))).all())
        if "У сотрудника" not in existing_statuses:
            db.add(DocumentStatus(name="У сотрудника", is_closed=False))
        if "Закрыт" not in existing_statuses:
            db.add(DocumentStatus(name="Закрыт", is_closed=True))
        await db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await seed_defaults()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception) -> JSONResponse:
    logging.getLogger("app").exception("Unhandled application error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка сервера"})


@app.get("/health", tags=["Система"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(directories.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
