"""User profile helpers."""
from typing import Any, Dict

from .mlm import member_id_for, resolve_mlm_stats


def default_profile_fields(user_id: int) -> Dict[str, Any]:
    return {
        "country": "India",
        "gst_no": "",
        "nominee_name": "",
        "nominee_relation": "",
        "bank_account_name": "",
        "bank_name": "",
        "bank_account_number": "",
        "bank_ifsc": "",
    }


def profile_payload(user: dict) -> dict:
    stats = resolve_mlm_stats(user)
    return {
        "id": user["id"],
        "member_id": stats.get("member_id") or member_id_for(user["id"]),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "address": user.get("address") or "",
        "city": user.get("city") or "",
        "state": user.get("state") or "",
        "pincode": user.get("pincode") or "",
        "country": user.get("country") or "India",
        "gst_no": user.get("gst_no") or "",
        "nominee_name": user.get("nominee_name") or "",
        "nominee_relation": user.get("nominee_relation") or "",
        "bank_account_name": user.get("bank_account_name") or "",
        "bank_name": user.get("bank_name") or "",
        "bank_account_number": user.get("bank_account_number") or "",
        "bank_ifsc": user.get("bank_ifsc") or "",
        "role": user.get("role", "customer"),
        "registered_at": user.get("registered_at"),
    }
