"""Referral plan constants — no imports from referral/referral_bonus (avoids circular deps)."""
from __future__ import annotations

MIN_INVESTMENT = 250_000.0
REFERRAL_TREE_MAX_LEVELS = 24
DIRECT_BONUS_RATE = 0.02
DIRECT_BONUS_LEVELS = 5

# Cumulative package → genealogy levels unlocked (max 24)
# 2.5L → 5 | +2.5L → 12 (+7) | +2.5L → 19 (+7) | +2.5L → 24 (+5)
LEVEL_UNLOCK_TIERS = (
    (250_000, 5),
    (500_000, 12),
    (750_000, 19),
    (1_000_000, 24),
)


def is_active_investor(package_amount: float) -> bool:
    return float(package_amount or 0) >= MIN_INVESTMENT


def level_open_for_package(package_amount: float) -> int:
    pkg = float(package_amount or 0)
    open_levels = 0
    for threshold, levels in LEVEL_UNLOCK_TIERS:
        if pkg >= threshold:
            open_levels = levels
    return open_levels


def next_level_unlock_amount(current_package: float) -> float | None:
    """Amount needed to reach the next tier (None if already at max)."""
    pkg = float(current_package or 0)
    for threshold, _levels in LEVEL_UNLOCK_TIERS:
        if pkg < threshold:
            return threshold
    return None
