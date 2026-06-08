"""Signed session tokens for authenticated API access."""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time

DEFAULT_TTL_DAYS = 30

DEFAULT_AUTH_SECRET = "kgf-farm-auth-7f3a9c2e1b8d4f6a0e5c9d2b7a1f4e8c"

_INSECURE_SECRETS = frozenset(
    {
        "",
        "change-me-in-production",
        "change-me-to-a-long-random-secret",
        "kgf-dev-auth-secret-set-AUTH_SECRET-in-env",
    }
)

_warned_default_secret = False


def _is_production() -> bool:
    return os.getenv("RENDER") == "true" or os.getenv("ENV", "").lower() == "production"


def _secret() -> bytes:
    global _warned_default_secret
    key = os.getenv("AUTH_SECRET") or os.getenv("JWT_SECRET") or ""
    if key in _INSECURE_SECRETS:
        if _is_production():
            key = DEFAULT_AUTH_SECRET
            if not _warned_default_secret:
                print(
                    "[auth] AUTH_SECRET not set — using built-in default. "
                    "Set AUTH_SECRET in production for stronger security."
                )
                _warned_default_secret = True
        else:
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
