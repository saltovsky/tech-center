import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    detail: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    csrf_token: str


class UserRead(ORMModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)

    @model_validator(mode="after")
    def passwords_differ(self) -> "PasswordChange":
        if self.current_password == self.new_password:
            raise ValueError("Новый пароль должен отличаться от текущего")
        return self


class DirectoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class DirectoryRead(ORMModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime


class StatusCreate(DirectoryCreate):
    is_closed: bool = False


class StatusRead(DirectoryRead):
    is_closed: bool


class EmployeeCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    organization_id: uuid.UUID


class EmployeeRead(ORMModel):
    id: uuid.UUID
    full_name: str
    organization_id: uuid.UUID
    organization: DirectoryRead
    created_at: datetime
    updated_at: datetime


class DocumentCreate(BaseModel):
    date: date
    organization_id: uuid.UUID
    employee_id: uuid.UUID
    device_type_id: uuid.UUID
    model: str = Field(min_length=1, max_length=255)
    serial_number: str = Field(min_length=1, max_length=255)
    condition_id: uuid.UUID
    status_id: uuid.UUID


class DocumentRead(ORMModel):
    id: uuid.UUID
    date: date
    organization_id: uuid.UUID
    employee_id: uuid.UUID
    device_type_id: uuid.UUID
    model: str
    serial_number: str
    condition_id: uuid.UUID
    status_id: uuid.UUID
    organization: DirectoryRead
    employee: EmployeeRead
    device_type: DirectoryRead
    condition: DirectoryRead
    status: StatusRead
    created_at: datetime
    updated_at: datetime


class DocumentPage(BaseModel):
    items: list[DocumentRead]
    total: int
    page: int
    size: int
    pages: int


class DuplicateCheck(BaseModel):
    duplicate: bool
    document_id: uuid.UUID | None = None

