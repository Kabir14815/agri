"""Referral tree — sponsor links and demo downline data."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .mlm import member_id_for, resolve_mlm_stats

# Demo downline matching reference UI (used when DB has no referrals yet)
DEMO_DOWNLINE: Dict[str, List[Dict[str, Any]]] = {
    "KGF870365": [
        {
            "member_id": "KGF246305",
            "full_name": "AMARJIT SINGH",
            "referral_count": 0,
            "amount": 0,
            "has_downline": False,
        },
        {
            "member_id": "KGF918410",
            "full_name": "SHUBHAM GARG",
            "referral_count": 4,
            "amount": 55_000,
            "has_downline": True,
        },
        {
            "member_id": "KGF552891",
            "full_name": "RAJESH KUMAR",
            "referral_count": 2,
            "amount": 25_000,
            "has_downline": False,
        },
        {
            "member_id": "KGF771204",
            "full_name": "ARUN KUMAR",
            "referral_count": 1,
            "amount": 10_000,
            "has_downline": True,
        },
        {
            "member_id": "KGF334512",
            "full_name": "PRIYA VERMA",
            "referral_count": 0,
            "amount": 5_000,
            "has_downline": False,
        },
        {
            "member_id": "KGF889901",
            "full_name": "VIKRAM SINGH",
            "referral_count": 3,
            "amount": 40_000,
            "has_downline": False,
        },
    ],
    "KGF918410": [
        {
            "member_id": "KGF918411",
            "full_name": "ROHIT SHARMA",
            "referral_count": 0,
            "amount": 10_000,
            "has_downline": False,
        },
        {
            "member_id": "KGF918412",
            "full_name": "NEHA PATEL",
            "referral_count": 1,
            "amount": 15_000,
            "has_downline": False,
        },
        {
            "member_id": "KGF918413",
            "full_name": "AMIT GUPTA",
            "referral_count": 0,
            "amount": 12_000,
            "has_downline": False,
        },
        {
            "member_id": "KGF918414",
            "full_name": "SONIA DEVI",
            "referral_count": 0,
            "amount": 8_000,
            "has_downline": False,
        },
    ],
    "KGF771204": [
        {
            "member_id": "KGF771205",
            "full_name": "MANOJ YADAV",
            "referral_count": 0,
            "amount": 5_000,
            "has_downline": False,
        },
    ],
}


def member_id_from_user(user: dict) -> str:
    stats = resolve_mlm_stats(user)
    return stats.get("member_id") or member_id_for(user["id"])


def user_to_tree_node(user: dict, child_count: int, has_downline: bool) -> dict:
    stats = resolve_mlm_stats(user)
    return {
        "member_id": stats.get("member_id") or member_id_for(user["id"]),
        "full_name": user.get("full_name", ""),
        "referral_count": child_count,
        "amount": float(stats.get("package_amount", user.get("amount", 0)) or 0),
        "has_downline": has_downline,
    }


def get_direct_children(store, member_id: str) -> List[dict]:
    """Load direct referrals from DB or demo data."""
    db_children = store.list_direct_referrals(member_id)
    if db_children:
        nodes = []
        for u in db_children:
            mid = member_id_from_user(u)
            subs = store.list_direct_referrals(mid)
            nodes.append(user_to_tree_node(u, len(subs), len(subs) > 0))
        return nodes

    demo = DEMO_DOWNLINE.get(member_id, [])
    return [dict(c) for c in demo]


def build_referral_tree(
    store,
    viewer: dict,
    target_member_id: Optional[str] = None,
) -> dict:
    viewer_mid = member_id_from_user(viewer)

    if not target_member_id:
        target_member_id = viewer_mid

    # Resolve root user
    root_user = store.find_user_by_member_id(target_member_id)
    if not root_user and target_member_id == viewer_mid:
        root_user = viewer
    if not root_user:
        # Demo-only node (not in users collection)
        root_user = _demo_root_stub(target_member_id)

    children = get_direct_children(store, target_member_id)
    root_node = user_to_tree_node(root_user, len(children), len(children) > 0)
    # Override count for demo root to match reference
    if target_member_id == "KGF870365":
        root_node["referral_count"] = 11
        root_node["amount"] = 100_000
        root_node["full_name"] = root_user.get("full_name") or "SUBHASH JANGRA"

    return {
        "root": root_node,
        "children": children,
    }


def _demo_root_stub(member_id: str) -> dict:
    for children in DEMO_DOWNLINE.values():
        for c in children:
            if c["member_id"] == member_id:
                return {
                    "full_name": c["full_name"],
                    "amount": c["amount"],
                    "mlm": {"member_id": member_id, "package_amount": c["amount"]},
                }
    return {"full_name": member_id, "amount": 0, "mlm": {"member_id": member_id}}


def _is_in_demo_downline(viewer_mid: str, target_mid: str) -> bool:
    if viewer_mid == target_mid:
        return True
    queue = [viewer_mid]
    seen = set()
    while queue:
        mid = queue.pop(0)
        if mid in seen:
            continue
        seen.add(mid)
        for child in DEMO_DOWNLINE.get(mid, []):
            cid = child["member_id"]
            if cid == target_mid:
                return True
            if child.get("has_downline"):
                queue.append(cid)
    return False


def can_view_tree(viewer: dict, target_member_id: str, store) -> bool:
    viewer_mid = member_id_from_user(viewer)
    if target_member_id == viewer_mid:
        return True
    if _is_in_demo_downline(viewer_mid, target_member_id):
        return True
    # DB: target must be descendant
    return store.is_descendant(viewer_mid, target_member_id)
