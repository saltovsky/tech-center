import io
import math
import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from openpyxl import Workbook
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.audit import add_audit
from app.dependencies import DB, CurrentUser
from app.models import Condition, DeviceType, Document, DocumentStatus, Employee, Organization
from app.schemas import DocumentCreate, DocumentPage, DocumentRead, DuplicateCheck

router = APIRouter(prefix="/documents", tags=["Документы"])

RELATIONS = (
    selectinload(Document.organization),
    selectinload(Document.employee).selectinload(Employee.organization),
    selectinload(Document.device_type),
    selectinload(Document.condition),
    selectinload(Document.status),
)
SORT_FIELDS = {
    "date": Document.date,
    "organization": Organization.name,
    "employee": Employee.full_name,
    "device_type": DeviceType.name,
    "model": Document.model,
    "serial_number": Document.serial_number,
    "condition": Condition.name,
    "status": DocumentStatus.name,
    "created_at": Document.created_at,
}


def base_query():
    return (
        select(Document)
        .join(Document.organization)
        .join(Document.employee)
        .join(Document.device_type)
        .join(Document.condition)
        .join(Document.status)
        .options(*RELATIONS)
    )


def count_query():
    return (
        select(func.count())
        .select_from(Document)
        .join(Document.organization)
        .join(Document.employee)
        .join(Document.device_type)
        .join(Document.condition)
        .join(Document.status)
    )


def search_expression(value: str):
    escaped = (
        value.strip()
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    pattern = f"%{escaped}%"
    return or_(
        Organization.name.ilike(pattern, escape="\\"),
        Employee.full_name.ilike(pattern, escape="\\"),
        DeviceType.name.ilike(pattern, escape="\\"),
        Document.model.ilike(pattern, escape="\\"),
        Document.serial_number.ilike(pattern, escape="\\"),
        Condition.name.ilike(pattern, escape="\\"),
        DocumentStatus.name.ilike(pattern, escape="\\"),
    )


async def validate_document(payload: DocumentCreate, db: DB) -> None:
    employee = await db.get(Employee, payload.employee_id)
    if employee is None or employee.organization_id != payload.organization_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Сотрудник не принадлежит выбранной организации",
        )
    checks = (
        (Organization, payload.organization_id, "Организация"),
        (DeviceType, payload.device_type_id, "Вид техники"),
        (Condition, payload.condition_id, "Состояние"),
        (DocumentStatus, payload.status_id, "Статус"),
    )
    for model, item_id, label in checks:
        if await db.get(model, item_id) is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{label} не найден")


@router.get("", response_model=DocumentPage)
async def list_documents(
    _: CurrentUser,
    db: DB,
    status_id: uuid.UUID | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="date"),
    order: Literal["asc", "desc"] = "desc",
    search: str | None = Query(default=None, max_length=255),
) -> DocumentPage:
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Недопустимое поле сортировки")
    stmt = base_query()
    count_stmt = count_query()
    if status_id:
        stmt = stmt.where(Document.status_id == status_id)
        count_stmt = count_stmt.where(Document.status_id == status_id)
    if search and search.strip():
        condition = search_expression(search)
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)
    total = int((await db.scalar(count_stmt)) or 0)
    direction = asc if order == "asc" else desc
    items = (
        await db.scalars(
            stmt.order_by(direction(SORT_FIELDS[sort_by]), desc(Document.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
    ).unique().all()
    return DocumentPage(
        items=list(items),
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )


@router.get("/check-serial", response_model=DuplicateCheck)
async def check_serial(
    serial_number: str,
    status_id: uuid.UUID,
    _: CurrentUser,
    db: DB,
    exclude_id: uuid.UUID | None = None,
) -> DuplicateCheck:
    stmt = select(Document.id).where(
        func.lower(Document.serial_number) == serial_number.strip().lower(),
        Document.status_id == status_id,
    )
    if exclude_id:
        stmt = stmt.where(Document.id != exclude_id)
    match = await db.scalar(stmt.limit(1))
    return DuplicateCheck(duplicate=match is not None, document_id=match)


@router.get("/export.xlsx")
async def export_documents(
    _: CurrentUser,
    db: DB,
    status_id: uuid.UUID | None = None,
    search: str | None = Query(default=None, max_length=255),
) -> Response:
    stmt = base_query().order_by(desc(Document.date))
    if status_id:
        stmt = stmt.where(Document.status_id == status_id)
    if search and search.strip():
        stmt = stmt.where(search_expression(search))
    documents = (await db.scalars(stmt)).unique().all()
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Журнал выдачи"
    sheet.append(
        ["Дата", "Организация", "Сотрудник", "Вид техники", "Модель", "Серийный номер", "Состояние", "Статус"]
    )
    for item in documents:
        sheet.append(
            [
                item.date,
                item.organization.name,
                item.employee.full_name,
                item.device_type.name,
                item.model,
                item.serial_number,
                item.condition.name,
                item.status.name,
            ]
        )
    sheet.freeze_panes = "A2"
    for column in sheet.columns:
        letter = column[0].column_letter
        sheet.column_dimensions[letter].width = min(
            45, max(12, max(len(str(cell.value or "")) for cell in column) + 2)
        )
    output = io.BytesIO()
    workbook.save(output)
    return Response(
        output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="documents.xlsx"'},
    )


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def create_document(payload: DocumentCreate, user: CurrentUser, db: DB) -> Document:
    await validate_document(payload, db)
    document = Document(id=uuid.uuid4(), **payload.model_dump(), created_by=user.id)
    document.model = document.model.strip()
    document.serial_number = document.serial_number.strip()
    db.add(document)
    add_audit(db, user, "create", "document", document.id, payload.model_dump())
    await db.commit()
    return await get_document(document.id, user, db)


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(document_id: uuid.UUID, _: CurrentUser, db: DB) -> Document:
    document = await db.scalar(base_query().where(Document.id == document_id))
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    return document


@router.put("/{document_id}", response_model=DocumentRead)
async def update_document(
    document_id: uuid.UUID, payload: DocumentCreate, user: CurrentUser, db: DB
) -> Document:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    await validate_document(payload, db)
    for field, value in payload.model_dump().items():
        setattr(document, field, value.strip() if isinstance(value, str) else value)
    add_audit(db, user, "update", "document", document.id, payload.model_dump())
    await db.commit()
    return await get_document(document.id, user, db)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: uuid.UUID, user: CurrentUser, db: DB) -> None:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    add_audit(db, user, "delete", "document", document.id)
    await db.delete(document)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Документ не может быть удалён") from exc
