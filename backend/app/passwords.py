"""Password hashing (PBKDF2) — plain-text passwords are migrated on successful login."""
from __future__ import annotations

import hashlib
import hmac
import secrets

_PREFIX = "$pbkdf2$"


def hash_password(plain: str) -> str:
    plain = plain or ""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 120_000)
    return f"{_PREFIX}{salt}${digest.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    plain = plain or ""
    stored = stored or ""
    if stored.startswith(_PREFIX):
        try:
            _, salt, hexd = stored.split("$", 3)[1:]
            digest = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 120_000)
            return hmac.compare_digest(digest.hex(), hexd)
        except (ValueError, IndexError):
            return False
    return hmac.compare_digest(plain, stored)


def needs_rehash(stored: str) -> bool:
    return not (stored or "").startswith(_PREFIX)
