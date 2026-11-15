"""Cleanup temporary validation data.

This script deletes the temporary administrator, worker, assignment, follow-ups,
content, and audit logs created during validation. It preserves all permanent
patient data and the existing database schema.

The IDs, emails and passwords are taken from the validation state file stored
in the temporary opencode directory.
"""

import json
import sys
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.models.audit_log import AdminAuditLog
from app.models.follow_up import FollowUp
from app.models.health_content import HealthContent
from app.models.user import User
from app.models.assignment import WorkerPatientAssignment

STATE_FILE = Path(
    "C:/Users/avina/AppData/Local/Temp/opencode/sahaaya_validation_state.json"
)
def load_state() -> dict:
    if not STATE_FILE.is_file():
        print(f"State file not found: {STATE_FILE}")
        return {}
    with STATE_FILE.open() as f:
        return json.load(f)
def cleanup() -> None:
    state = load_state()
    if not state:
        print("No validation state; nothing to clean up.")
        return

    admin_id = state.get("admin_id")
    worker_id = state.get("worker_id")
    content_id = state.get("content_id")
    follow_up_ids = state.get("follow_up_ids", [])
    assignment_id = state.get("assignment_id")

    with SessionLocal() as db:
        # Delete admin audit logs created by the validation admin (actor_id = admin_id)
        admin_audit_count = db.query(AdminAuditLog).filter(
            AdminAuditLog.administrator_id == admin_id
        ).delete(synchronize_session=False)
        print(f"Deleted {admin_audit_count} admin audit logs for admin {admin_id}.")

        # Delete follow-ups (cascade will also delete on worker/patient delete, but we delete early)
        follow_up_count = db.query(FollowUp).filter(
            FollowUp.id.in_(follow_up_ids)
        ).delete(synchronize_session=False)
        print(f"Deleted {follow_up_count} follow-up records.")

        # Delete assignment (cascade from worker delete)
        assignment = db.query(WorkerPatientAssignment).get(assignment_id)
        if assignment:
            db.delete(assignment)
            print(f"Deleted assignment {assignment_id}.")

        # Delete health content authored by the validation worker
        health_content = db.query(HealthContent).get(content_id)
        if health_content:
            db.delete(health_content)
            print(f"Deleted health content {content_id}.")

        # Delete the validation worker (cascade deletes its assignments, follow-ups, content)
        worker = db.query(User).get(worker_id)
        if worker:
            db.delete(worker)
            print(f"Deleted worker {worker_id}.")

        # Delete the validation administrator (sets administrator_id to null in audit logs)
        admin = db.query(User).get(admin_id)
        if admin:
            db.delete(admin)
            print(f"Deleted administrator {admin_id}.")

        try:
            db.commit()
            print("All validation data cleaned up successfully.")
        except SQLAlchemyError as exc:
            db.rollback()
            print(f"Error during cleanup: {exc}")
            raise

    # Remove the state file
    try:
        STATE_FILE.unlink()
        print(f"Removed state file: {STATE_FILE}")
    except Exception as exc:
        print(f"Could not remove state file: {exc}")
if __name__ == "__main__":
    cleanup()