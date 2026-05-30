"""Referral tree — sponsor links and optional demo downline for showcase account."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .mlm import member_id_for, resolve_mlm_stats
from .referral_config import REFERRAL_TREE_MAX_LEVELS

DEMO_ROOT_MEMBER_ID = "KGF870365"
DEMO_ROOT_EMAIL = "demo@kgffarming.com"

# Demo downline for showcase account only (when no real referrals in DB)
DEMO_DOWNLINE: Dict[str, List[Dict[str, Any]]] = {
    "KGF870365": [
        {
            "member_id": "KGF246305",
            "full_name": "AMARJIT SINGH",
            "referral_count": 0,
            "amount": 250_000,
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


def normalize_member_id(member_id: Optional[str]) -> str:
    return (member_id or "").strip().upper()


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
        "user_id": user.get("id"),
    }


def is_demo_showcase_user(user: dict) -> bool:
    return user.get("email") == DEMO_ROOT_EMAIL


def get_direct_children(store, member_id: str) -> List[dict]:
    """Direct referrals from DB; demo sample only for showcase nodes with no DB rows."""
    member_id = normalize_member_id(member_id)
    db_children = store.list_direct_referrals(member_id)
    if db_children:
        nodes = []
        for u in db_children:
            mid = member_id_from_user(u)
            subs = store.list_direct_referrals(mid)
            nodes.append(user_to_tree_node(u, len(subs), len(subs) > 0))
        return nodes

    if member_id in DEMO_DOWNLINE:
        return [dict(c) for c in DEMO_DOWNLINE[member_id]]
    return []


def _attach_nested_children(
    store,
    nodes: List[dict],
    depth: int,
    max_depth: int,
) -> None:
    if depth >= max_depth:
        for node in nodes:
            node["children"] = []
        return
    for node in nodes:
        mid = normalize_member_id(node.get("member_id"))
        kids = get_direct_children(store, mid)
        node["children"] = kids
        node["has_downline"] = len(kids) > 0
        if kids:
            _attach_nested_children(store, kids, depth + 1, max_depth)


def build_referral_tree(
    store,
    viewer: dict,
    target_member_id: Optional[str] = None,
    max_depth: int = REFERRAL_TREE_MAX_LEVELS,
) -> dict:
    target_member_id = normalize_member_id(target_member_id) or member_id_from_user(viewer)
    max_depth = max(1, min(int(max_depth), REFERRAL_TREE_MAX_LEVELS))

    root_user = store.find_user_by_member_id(target_member_id)
    if not root_user and target_member_id == member_id_from_user(viewer):
        root_user = viewer
    if not root_user:
        root_user = _demo_root_stub(target_member_id)

    children = get_direct_children(store, target_member_id)
    _attach_nested_children(store, children, 1, max_depth)
    root_node = user_to_tree_node(root_user, len(children), len(children) > 0)
    root_node["level"] = 0
    root_node["children"] = children

    # Showcase UI for demo account when no real referrals exist yet
    if (
        target_member_id == DEMO_ROOT_MEMBER_ID
        and is_demo_showcase_user(viewer)
        and not store.list_direct_referrals(DEMO_ROOT_MEMBER_ID)
    ):
        root_node["referral_count"] = 11
        root_node["amount"] = 250_000
        root_node["full_name"] = root_user.get("full_name") or "SUBHASH JANGRA"

    return {
        "root": root_node,
        "children": children,
        "max_depth": REFERRAL_TREE_MAX_LEVELS,
        "bonus_levels": 5,
        "bonus_rate_percent": 2,
    }


def _demo_root_stub(member_id: str) -> dict:
    member_id = normalize_member_id(member_id)
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
    viewer_mid = normalize_member_id(viewer_mid)
    target_mid = normalize_member_id(target_mid)
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
    target_member_id = normalize_member_id(target_member_id)
    if target_member_id == viewer_mid:
        return True
    if is_demo_showcase_user(viewer) and _is_in_demo_downline(viewer_mid, target_member_id):
        return True
    return store.is_descendant(viewer_mid, target_member_id)
