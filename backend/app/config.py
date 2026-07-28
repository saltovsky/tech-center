from functools import lru_cache
from typing import Annotated

from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Tech Center API"
    environment: str = "production"
    database_url: str = "postgresql+asyncpg://tech_center:change-me@db:5432/tech_center"
    jwt_secret: str = Field(min_length=32)
    access_token_minutes: int = Field(default=15, ge=5, le=60)
    refresh_token_days: int = Field(default=7, ge=1, le=30)
    initial_admin_email: EmailStr = "admin@example.com"
    initial_admin_password: str = Field(min_length=12)
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:8080",
        "http://localhost:5173",
    ]
    cookie_secure: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
