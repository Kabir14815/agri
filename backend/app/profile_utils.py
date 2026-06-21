"""User profile serialization and defaults."""
from typing import Any, Dict, Optional

from .mlm import member_id_for


def default_bank() -> Dict[str, str]:
    return {
        "account_holder": "",
        "bank_name": "",
        "account_number": "",
        "ifsc": "",
    }


def enrich_user_defaults(user: dict) -> dict:
    """Ensure profile fields exist on user document."""
    user.setdefault("country", "India")
    user.setdefault("gst_no", "")
    user.setdefault("nominee_name", "")
    user.setdefault("nominee_relation", "")
    if not user.get("bank"):
        user["bank"] = default_bank()
    return user


def user_profile_payload(user: dict) -> Dict[str, Any]:
    u = enrich_user_defaults(dict(user))
    pan = u.get("pan_card") or {}
    return {
        "id": u["id"],
        "member_id": u.get("mlm", {}).get("member_id") if isinstance(u.get("mlm"), dict) else member_id_for(u["id"]),
        "full_name": u.get("full_name", ""),
        "email": u.get("email", ""),
        "phone": u.get("phone", ""),
        "address": u.get("address", ""),
        "city": u.get("city", ""),
        "state": u.get("state", ""),
        "pincode": u.get("pincode", ""),
        "country": u.get("country", "India"),
        "gst_no": u.get("gst_no", ""),
        "nominee_name": u.get("nominee_name", ""),
        "nominee_relation": u.get("nominee_relation", ""),
        "bank": dict(u.get("bank") or default_bank()),
        "role": u.get("role", "customer"),
        "registered_at": u.get("registered_at"),
        "pan_card": {
            "pan_number": pan.get("pan_number", ""),
            "status": pan.get("status", "not_uploaded"),  # not_uploaded | pending | verified
            "uploaded_at": pan.get("uploaded_at"),
            "has_image": bool(pan.get("image_data")),
        },
    }


