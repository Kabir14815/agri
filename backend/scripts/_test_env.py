"""Shared credentials for integration test scripts."""
from __future__ import annotations

import os
import sys


def require_admin_creds() -> tuple[str, str]:
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "").strip()
    if not email or not password:
        print(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to run integration tests.",
            file=sys.stderr,
        )
        sys.exit(2)
    return email, password
