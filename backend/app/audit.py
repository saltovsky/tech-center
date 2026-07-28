import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog, User


def add_audit(
    db: AsyncSession,
    user: User,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    details: dict[str, object] | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=json.dumps(details, ensure_ascii=False, default=str) if details else None,
        )
    )

