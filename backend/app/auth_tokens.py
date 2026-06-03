"""Signed session tokens — prevents forging user IDs via predictable demo-token-{id}."""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time

DEFAULT_TTL_DAYS = 30


def _secret() -> bytes:
    key = os.getenv("AUTH_SECRET") or os.getenv("JWT_SECRET") or ""
    if not key or key == "change-me-in-production":
        # Dev fallback only — set AUTH_SECRET on Render for production.
        key = "kgf-dev-auth-secret-set-AUTH_SECRET-in-env"
    return key.encode()


def create_session_token(user_id: int, ttl_days: int = DEFAULT_TTL_DAYS) -> str:
    exp = int(time.time()) + ttl_days * 86400
    payload = f"{user_id}:{exp}"
    sig = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def parse_session_token(token: str) -> int | None:
    if not token:
        return None
    try:
        pad = "=" * (-len(token) % 4)
        raw = base64.urlsafe_b64decode(token + pad).decode()
        user_id_s, exp_s, sig = raw.rsplit(":", 2)
        payload = f"{user_id_s}:{exp_s}"
        expected = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        if int(exp_s) < time.time():
            return None
        uid = int(user_id_s)
        return uid if uid > 0 else None
    except (ValueError, UnicodeDecodeError):
        return None
