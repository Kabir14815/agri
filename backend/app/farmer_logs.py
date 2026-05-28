"""Farmer daily crop logs — image retention and cleanup."""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

IMAGE_RETENTION_DAYS = int(os.environ.get("FARM_LOG_IMAGE_RETENTION_DAYS", "14"))


def today_utc() -> str:
    return datetime.utcnow().date().isoformat()


def log_public(record: dict, *, include_image: bool = False) -> dict:
    out = {
        "id": record["id"],
        "user_id": record["user_id"],
        "member_id": record.get("member_id"),
        "farmer_name": record.get("farmer_name"),
        "log_date": record.get("log_date"),
        "watered": bool(record.get("watered")),
        "note": record.get("note") or "",
        "has_image": bool(record.get("image_data")),
        "image_purged": bool(record.get("image_purged_at")),
        "image_size_kb": round((record.get("image_size_bytes") or 0) / 1024, 1),
        "created_at": record.get("created_at"),
        "image_purged_at": record.get("image_purged_at"),
    }
    if include_image and record.get("image_data"):
        mime = record.get("image_mime") or "image/jpeg"
        out["image_data_url"] = f"data:{mime};base64,{record['image_data']}"
    return out


def purge_old_images(store: Any) -> int:
    """Remove image blobs older than retention; keep metadata."""
    cutoff = (datetime.utcnow() - timedelta(days=IMAGE_RETENTION_DAYS)).isoformat() + "Z"
    now = datetime.utcnow().isoformat() + "Z"
    result = store.db.farm_daily_logs.update_many(
        {
            "created_at": {"$lt": cutoff},
            "image_data": {"$ne": ""},
            "image_purged_at": None,
        },
        {
            "$set": {
                "image_data": "",
                "image_purged_at": now,
            }
        },
    )
    return int(result.modified_count)
