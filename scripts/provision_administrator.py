"""Provision a new SAHAAYA administrator account.

This controlled operator command creates a new administrator account. It
never promotes an existing patient or healthcare-worker account.

Usage:
    .venv\\Scripts\\python.exe scripts\\provision_administrator.py \
        --email admin@example.org --full-name "System Administrator"
"""

import argparse
import getpass
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.services.admin_provisioning import (
    AdminProvisioningError,
    provision_administrator,
)


def read_password(password_env: str | None) -> str:
    if password_env:
        password = os.environ.get(password_env)
        if not password:
            raise AdminProvisioningError(
                f"Environment variable {password_env} is not set"
            )
        return password

    password = getpass.getpass("Administrator password: ")
    confirmation = getpass.getpass("Confirm administrator password: ")
    if password != confirmation:
        raise AdminProvisioningError("Passwords do not match")
    return password


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Provision a new administrator account."
    )
    parser.add_argument("--email", required=True)
    parser.add_argument("--full-name", required=True)
    parser.add_argument("--phone", default=None)
    parser.add_argument("--language", default="en")
    parser.add_argument(
        "--password-env",
        default=None,
        help="Read the password from this environment variable instead of prompting.",
    )
    args = parser.parse_args()

    try:
        password = read_password(args.password_env)
        with SessionLocal() as db:
            user = provision_administrator(
                db,
                full_name=args.full_name,
                email=args.email,
                phone=args.phone,
                password=password,
                preferred_language=args.language,
            )
    except (AdminProvisioningError, ValueError) as exc:
        print(str(exc))
        return 1

    print(f"Administrator account created: {user.email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
