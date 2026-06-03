"""Fields produced by daily accrual that must not be overwritten by ledger sync."""
from __future__ import annotations

ACCRUAL_DISPLAY_KEYS = (
    "interest_last_accrual_date",
    "interest_accrual_start",
    "investment_interest_today",
    "investment_tds_today",
    "interest_penalty_today",
    "investment_interest_gross_total",
    "investment_tds_total",
    "investment_principal",
)


def accrual_snapshot(stats: dict) -> dict:
    return {k: stats.get(k) for k in ACCRUAL_DISPLAY_KEYS if stats.get(k) is not None}
