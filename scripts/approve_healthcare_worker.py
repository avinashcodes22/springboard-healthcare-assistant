"""Approve a registered healthcare worker account.

This operator-only command is the authorized approval process for
healthcare-worker accounts. It must be run by a trusted administrator
with access to the server environment.

Usage:
    .venv\\Scripts\\python.exe scripts\\approve_healthcare_worker.py \
        --email worker@example.org
"""

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.services.worker_approval import (
    WorkerApprovalError,
    set_worker_approval,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Approve or revoke a healthcare worker account."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Email address of the healthcare worker account.",
    )
    parser.add_argument(
        "--revoke",
        action="store_true",
        help="Deactivate and unapprove the account instead.",
    )

    args = parser.parse_args()
    approved = not args.revoke

    try:
        with SessionLocal() as db:
            user = set_worker_approval(db, args.email, approved)
    except WorkerApprovalError as exc:
        print(str(exc))
        return 1

    action = "approved" if approved else "revoked"
    print(f"Healthcare worker account {action}: {user.email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
