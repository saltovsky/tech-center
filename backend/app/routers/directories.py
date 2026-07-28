import uuid
from collections.abc import Sequence
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.audit import add_audit
from app.dependencies import DB, CurrentUser
from app.models import Condition, DeviceType, DocumentStatus, Employee, Organization
from app.schemas import (
    DirectoryCreate,
    DirectoryRead,
    EmployeeCreate,
    EmployeeRead,
    StatusCreate,
    StatusRead,
)

router = APIRouter(tags=["Справочники"])


async def commit_or_conflict(db: DB, message: str) -> None:
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, message) from exc


def register_simple_routes(
    path: str,
    model: type[Organization] | type[DeviceType] | type[Condition],
    entity_name: str,
) -> None:
    async def list_items(_: CurrentUser, db: DB) -> Sequence[Any]:
        return (await db.scalars(select(model).order_by(model.name))).all()

    async def create_item(
        payload: DirectoryCreate, user: CurrentUser, db: DB
    ) -> Any:
        item = model(id=uuid.uuid4(), name=payload.name.strip())
        db.add(item)
        add_audit(db, user, "create", entity_name, item.id, {"name": item.name})
        await commit_or_conflict(db, "Запись с таким названием уже существует")
        await db.refresh(item)
        return item

    async def get_item(item_id: uuid.UUID, _: CurrentUser, db: DB) -> Any:
        item = await db.get(model, item_id)
        if item is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Запись не найдена")
        return item

    async def update_item(
        item_id: uuid.UUID, payload: DirectoryCreate, user: CurrentUser, db: DB
    ) -> Any:
        item = await db.get(model, item_id)
        if item is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Запись не найдена")
        item.name = payload.name.strip()
        add_audit(db, user, "update", entity_name, item.id, {"name": item.name})
        await commit_or_conflict(db, "Запись с таким названием уже существует")
        await db.refresh(item)
        return item

    async def delete_item(item_id: uuid.UUID, user: CurrentUser, db: DB) -> None:
        item = await db.get(model, item_id)
        if item is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Запись не найдена")
        add_audit(db, user, "delete", entity_name, item.id, {"name": item.name})
        await db.delete(item)
        await commit_or_conflict(db, "Запись используется и не может быть удалена")

    router.add_api_route(path, list_items, methods=["GET"], response_model=list[DirectoryRead])
    router.add_api_route(
        path,
        create_item,
        methods=["POST"],
        response_model=DirectoryRead,
        status_code=status.HTTP_201_CREATED,
    )
    router.add_api_route(f"{path}/{{item_id}}", get_item, methods=["GET"], response_model=DirectoryRead)
    router.add_api_route(
        f"{path}/{{item_id}}", update_item, methods=["PUT"], response_model=DirectoryRead
    )
    router.add_api_route(
        f"{path}/{{item_id}}", delete_item, methods=["DELETE"], status_code=status.HTTP_204_NO_CONTENT
    )


register_simple_routes("/organizations", Organization, "organization")
register_simple_routes("/device-types", DeviceType, "device_type")
register_simple_routes("/conditions", Condition, "condition")


@router.get("/employees", response_model=list[EmployeeRead])
async def list_employees(
    _: CurrentUser,
    db: DB,
    organization_id: uuid.UUID | None = None,
    search: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=100, ge=1, le=500),
) -> Sequence[Employee]:
    stmt = select(Employee).options(selectinload(Employee.organization)).order_by(Employee.full_name)
    if organization_id:
        stmt = stmt.where(Employee.organization_id == organization_id)
    if search:
        stmt = stmt.where(Employee.full_name.ilike(f"%{search.strip()}%"))
    return (await db.scalars(stmt.limit(limit))).all()


@router.post("/employees", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
async def create_employee(payload: EmployeeCreate, user: CurrentUser, db: DB) -> Employee:
    if await db.get(Organization, payload.organization_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Организация не найдена")
    employee = Employee(
        id=uuid.uuid4(),
        full_name=payload.full_name.strip(),
        organization_id=payload.organization_id,
    )
    db.add(employee)
    add_audit(db, user, "create", "employee", employee.id, payload.model_dump())
    await commit_or_conflict(db, "Такой сотрудник уже существует в организации")
    return (
        await db.scalar(
            select(Employee)
            .where(Employee.id == employee.id)
            .options(selectinload(Employee.organization))
        )
    )


@router.get("/employees/{item_id}", response_model=EmployeeRead)
async def get_employee(item_id: uuid.UUID, _: CurrentUser, db: DB) -> Employee:
    employee = await db.scalar(
        select(Employee).where(Employee.id == item_id).options(selectinload(Employee.organization))
    )
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    return employee


@router.put("/employees/{item_id}", response_model=EmployeeRead)
async def update_employee(
    item_id: uuid.UUID, payload: EmployeeCreate, user: CurrentUser, db: DB
) -> Employee:
    employee = await db.get(Employee, item_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    if await db.get(Organization, payload.organization_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Организация не найдена")
    employee.full_name = payload.full_name.strip()
    employee.organization_id = payload.organization_id
    add_audit(db, user, "update", "employee", employee.id, payload.model_dump())
    await commit_or_conflict(db, "Такой сотрудник уже существует в организации")
    return await get_employee(item_id, user, db)


@router.delete("/employees/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(item_id: uuid.UUID, user: CurrentUser, db: DB) -> None:
    employee = await db.get(Employee, item_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    add_audit(db, user, "delete", "employee", employee.id, {"name": employee.full_name})
    await db.delete(employee)
    await commit_or_conflict(db, "Сотрудник используется в документах и не может быть удалён")


@router.get("/document-statuses", response_model=list[StatusRead])
async def list_statuses(_: CurrentUser, db: DB) -> Sequence[DocumentStatus]:
    return (await db.scalars(select(DocumentStatus).order_by(DocumentStatus.name))).all()


@router.post("/document-statuses", response_model=StatusRead, status_code=status.HTTP_201_CREATED)
async def create_status(payload: StatusCreate, user: CurrentUser, db: DB) -> DocumentStatus:
    item = DocumentStatus(
        id=uuid.uuid4(), name=payload.name.strip(), is_closed=payload.is_closed
    )
    db.add(item)
    add_audit(db, user, "create", "document_status", item.id, payload.model_dump())
    await commit_or_conflict(db, "Статус с таким названием уже существует")
    await db.refresh(item)
    return item


@router.put("/document-statuses/{item_id}", response_model=StatusRead)
async def update_status(
    item_id: uuid.UUID, payload: StatusCreate, user: CurrentUser, db: DB
) -> DocumentStatus:
    item = await db.get(DocumentStatus, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Статус не найден")
    item.name, item.is_closed = payload.name.strip(), payload.is_closed
    add_audit(db, user, "update", "document_status", item.id, payload.model_dump())
    await commit_or_conflict(db, "Статус с таким названием уже существует")
    await db.refresh(item)
    return item


@router.get("/document-statuses/{item_id}", response_model=StatusRead)
async def get_status(item_id: uuid.UUID, _: CurrentUser, db: DB) -> DocumentStatus:
    item = await db.get(DocumentStatus, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Статус не найден")
    return item


@router.delete("/document-statuses/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_status(item_id: uuid.UUID, user: CurrentUser, db: DB) -> None:
    item = await db.get(DocumentStatus, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Статус не найден")
    add_audit(db, user, "delete", "document_status", item.id, {"name": item.name})
    await db.delete(item)
    await commit_or_conflict(db, "Статус используется в документах и не может быть удалён")
