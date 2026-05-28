"""Referral direct bonus — 2% up to 5 upline levels on qualifying investment."""
from __future__ import annotations

from typing import Any, Dict, List

from .referral import member_id_from_user, normalize_member_id

MIN_INVESTMENT = 250_000.0
REFERRAL_TREE_MAX_LEVELS = 24
DIRECT_BONUS_RATE = 0.02
DIRECT_BONUS_LEVELS = 5


def is_active_investor(package_amount: float) -> bool:
    return float(package_amount or 0) >= MIN_INVESTMENT


def validate_first_deposit_amount(user: dict, deposit_amount: float) -> None:
    """First package must be at least MIN_INVESTMENT."""
    pkg = float(user.get("amount", 0) or 0)
    amt = float(deposit_amount)
    if pkg >= MIN_INVESTMENT:
        return
    if amt < MIN_INVESTMENT:
        raise ValueError("min_investment")


def get_upline_chain(store: Any, user: dict, max_levels: int = DIRECT_BONUS_LEVELS) -> List[dict]:
    chain: List[dict] = []
    current = user
    for _ in range(max_levels):
        sponsor_mid = normalize_member_id(current.get("sponsor_member_id"))
        if not sponsor_mid:
            break
        sponsor = store.find_user_by_member_id(sponsor_mid)
        if not sponsor or sponsor.get("role") in ("admin", "farmer"):
            break
        chain.append(sponsor)
        current = sponsor
    return chain


def distribute_investment_bonus(
    store: Any,
    investor: dict,
    investment_amount: float,
    source: str = "investment",
) -> List[Dict[str, Any]]:
    """
    Pay 2% of investment_amount to each upline (levels 1–5).
    Each new child/branch investment triggers its own upline chain.
    """
    amount = round(float(investment_amount or 0), 2)
    if amount <= 0:
        return []

    pkg = float(investor.get("amount", 0) or 0)
    stats = investor.get("mlm") or {}
    pkg = max(pkg, float(stats.get("package_amount", 0) or 0))
    if not is_active_investor(pkg):
        return []

    investor_mid = member_id_from_user(investor)
    payouts: List[Dict[str, Any]] = []

    for level, sponsor in enumerate(get_upline_chain(store, investor), start=1):
        bonus = round(amount * DIRECT_BONUS_RATE, 2)
        if bonus <= 0:
            continue
        store.credit_referral_bonus(
            sponsor,
            bonus,
            level=level,
            from_member_id=investor_mid,
            from_amount=amount,
            source=source,
        )
        payouts.append(
            {
                "level": level,
                "sponsor_member_id": member_id_from_user(sponsor),
                "bonus": bonus,
            }
        )
    return payouts


def level_open_for_package(package_amount: float) -> int:
    if is_active_investor(package_amount):
        return REFERRAL_TREE_MAX_LEVELS
    return 0
