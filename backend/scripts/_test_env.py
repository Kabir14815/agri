"""Shared credentials for integration test scripts."""
from __future__ import annotations

import os


def require_admin_creds() -> tuple[str, str]:
    try:
        from app.store import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD
    except ImportError:
        from backend.app.store import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD

    email = os.environ.get("ADMIN_EMAIL", "").strip().lower() or DEFAULT_ADMIN_EMAIL
    password = os.environ.get("ADMIN_PASSWORD", "").strip() or DEFAULT_ADMIN_PASSWORD
    return email, password
