"""Referral tree — sponsor links and downline from MongoDB."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .mlm import member_id_for, resolve_mlm_stats
from .referral_config import REFERRAL_TREE_MAX_LEVELS


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


def get_direct_children(store, member_id: str) -> List[dict]:
    """Direct referrals from the database."""
    member_id = normalize_member_id(member_id)
    db_children = store.list_direct_referrals(member_id)
    nodes = []
    for u in db_children:
        mid = member_id_from_user(u)
        subs = store.list_direct_referrals(mid)
        nodes.append(user_to_tree_node(u, len(subs), len(subs) > 0))
    return nodes


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
    max_depth: Optional[int] = None,
) -> dict:
    viewer_stats = resolve_mlm_stats(viewer)
    levels_open = int(viewer_stats.get("level_open") or 0)
    if max_depth is None:
        max_depth = max(1, levels_open) if levels_open else 1
    target_member_id = normalize_member_id(target_member_id) or member_id_from_user(viewer)
    max_depth = max(1, min(int(max_depth), REFERRAL_TREE_MAX_LEVELS))

    root_user = store.find_user_by_member_id(target_member_id)
    if not root_user and target_member_id == member_id_from_user(viewer):
        root_user = viewer
    if not root_user:
        raise ValueError("member_not_found")

    children = get_direct_children(store, target_member_id)
    _attach_nested_children(store, children, 1, max_depth)
    root_node = user_to_tree_node(root_user, len(children), len(children) > 0)
    root_node["level"] = 0
    root_node["children"] = children

    return {
        "root": root_node,
        "children": children,
        "levels_open": levels_open,
        "max_depth": max_depth,
        "tree_levels_max": REFERRAL_TREE_MAX_LEVELS,
        "bonus_levels": 5,
        "bonus_rate_percent": 2,
        "viewer_member_id": member_id_from_user(viewer),
    }


def can_view_tree(viewer: dict, target_member_id: str, store) -> bool:
    viewer_mid = member_id_from_user(viewer)
    target_member_id = normalize_member_id(target_member_id)
    if target_member_id == viewer_mid:
        return True
    return store.is_descendant(viewer_mid, target_member_id)
