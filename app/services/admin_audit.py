from sqlalchemy.orm import Session

from app.models import AdminAuditLog


def record_admin_action(
    db: Session,
    administrator_id: int,
    action: str,
    target_type: str,
    target_id: int | None = None,
    detail: str | None = None,
) -> AdminAuditLog:
    """Stage an audit entry for an administrator action.

    The caller is responsible for committing the surrounding transaction so
    the action and its audit entry succeed or fail together.
    """
    entry = AdminAuditLog(
        administrator_id=administrator_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(entry)
    return entry
