"""Daily investment return: 10% per month gross, 1% TDS on interest.

Missing daily crop photo → that day's interest is not credited (penalty tracked separately).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Callable, Dict, Optional

MONTHLY_GROSS_RATE = 0.10
TDS_ON_INTEREST_RATE = 0.01
DAYS_PER_MONTH = 30
MAX_CATCHUP_DAYS = 90


def investment_principal(stats: dict, user_amount: float = 0) -> float:
    return float(
        stats.get("investment_principal")
        or stats.get("package_amount")
        or user_amount
        or 0
    )


def daily_interest_breakdown(principal: float) -> Dict[str, float]:
    if principal <= 0:
        return {"gross": 0.0, "tds": 0.0, "net": 0.0}
    gross = round(principal * MONTHLY_GROSS_RATE / DAYS_PER_MONTH, 4)
    tds = round(gross * TDS_ON_INTEREST_RATE, 4)
    net = round(gross - tds, 4)
    return {"gross": gross, "tds": tds, "net": net}


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def initialize_accrual_fields(stats: dict, principal: float, on_date: Optional[date] = None) -> dict:
    today = on_date or datetime.utcnow().date()
    stats = dict(stats)
    stats["investment_principal"] = float(principal)
    if principal > 0 and not stats.get("interest_accrual_start"):
        stats["interest_accrual_start"] = today.isoformat()
        stats["interest_last_accrual_date"] = (today - timedelta(days=1)).isoformat()
    stats.setdefault("investment_interest_total", 0.0)
    stats.setdefault("investment_tds_total", 0.0)
    stats.setdefault("investment_interest_gross_total", 0.0)
    stats.setdefault("investment_interest_today", 0.0)
    stats.setdefault("investment_tds_today", 0.0)
    stats.setdefault("interest_penalty_total", 0.0)
    stats.setdefault("interest_penalty_today", 0.0)
    stats.setdefault("interest_missed_days_total", 0)
    return stats


def _apply_today_display(
    stats: dict,
    principal: float,
    today: date,
    daily_log_checker: Optional[Callable[[date], bool]],
) -> dict:
    daily = daily_interest_breakdown(principal)
    compliant = daily_log_checker is None or daily_log_checker(today)
    if compliant:
        stats["investment_interest_today"] = round(daily["net"], 2)
        stats["investment_tds_today"] = round(daily["tds"], 2)
        stats["interest_penalty_today"] = 0.0
    else:
        stats["investment_interest_today"] = 0.0
        stats["investment_tds_today"] = 0.0
        stats["interest_penalty_today"] = round(daily["net"], 2)
    return stats


def accrue_through_today(
    stats: dict,
    user_amount: float = 0,
    today: Optional[date] = None,
    daily_log_checker: Optional[Callable[[date], bool]] = None,
) -> tuple[dict, Optional[Dict[str, Any]]]:
    """
    Accrue missing daily interest up to today (UTC).
    Each day requires a daily crop photo or that day's net interest is penalized (not credited).
    Returns (updated_stats, accrual_summary or None if nothing accrued).
    """
    today = today or datetime.utcnow().date()
    principal = investment_principal(stats, user_amount)
    stats = initialize_accrual_fields(stats, principal, today)

    if principal <= 0:
        stats["interest_penalty_today"] = 0.0
        return stats, None

    last = _parse_date(stats.get("interest_last_accrual_date"))
    if last is None:
        start = _parse_date(stats.get("interest_accrual_start")) or today
        last = start - timedelta(days=1)
        stats["interest_last_accrual_date"] = last.isoformat()

    if last >= today:
        stats = _apply_today_display(stats, principal, today, daily_log_checker)
        return stats, None

    # Finalize through yesterday only — members have all of today to upload a photo.
    accrual_end = today - timedelta(days=1)
    if last >= accrual_end:
        stats = _apply_today_display(stats, principal, today, daily_log_checker)
        return stats, None

    days = min((accrual_end - last).days, MAX_CATCHUP_DAYS)
    if days <= 0:
        stats = _apply_today_display(stats, principal, today, daily_log_checker)
        return stats, None

    daily = daily_interest_breakdown(principal)
    total_gross = 0.0
    total_tds = 0.0
    total_net = 0.0
    penalty_gross = 0.0
    penalty_tds = 0.0
    penalty_net = 0.0
    missed_days = 0
    penalty_days: list[dict] = []

    for offset in range(1, days + 1):
        accrual_date = last + timedelta(days=offset)
        compliant = daily_log_checker is None or daily_log_checker(accrual_date)
        if compliant:
            total_gross += daily["gross"]
            total_tds += daily["tds"]
            total_net += daily["net"]
        else:
            missed_days += 1
            penalty_gross += daily["gross"]
            penalty_tds += daily["tds"]
            penalty_net += daily["net"]
            penalty_days.append(
                {
                    "log_date": accrual_date.isoformat(),
                    "gross": round(daily["gross"], 4),
                    "tds": round(daily["tds"], 4),
                    "net": round(daily["net"], 4),
                }
            )

    total_gross = round(total_gross, 2)
    total_tds = round(total_tds, 2)
    total_net = round(total_net, 2)
    penalty_gross = round(penalty_gross, 2)
    penalty_tds = round(penalty_tds, 2)
    penalty_net = round(penalty_net, 2)

    stats["interest_last_accrual_date"] = accrual_end.isoformat()
    stats["investment_principal"] = principal
    stats["investment_interest_gross_total"] = round(
        float(stats.get("investment_interest_gross_total", 0)) + total_gross, 2
    )
    stats["investment_tds_total"] = round(
        float(stats.get("investment_tds_total", 0)) + total_tds, 2
    )
    stats["investment_interest_total"] = round(
        float(stats.get("investment_interest_total", 0)) + total_net, 2
    )
    stats["investment_return_income"] = stats["investment_interest_total"]
    stats["interest_penalty_total"] = round(
        float(stats.get("interest_penalty_total", 0)) + penalty_net, 2
    )
    stats["interest_missed_days_total"] = int(
        stats.get("interest_missed_days_total", 0) or 0
    ) + missed_days

    stats = _apply_today_display(stats, principal, today, daily_log_checker)

    income_wallet = float(stats.get("income_wallet", 0) or 0)
    stats["income_wallet"] = round(income_wallet + total_net, 2)
    stats["total_earning"] = round(float(stats.get("total_earning", 0) or 0) + total_net, 2)

    return stats, {
        "days": days,
        "credited_days": days - missed_days,
        "missed_days": missed_days,
        "principal": principal,
        "gross": total_gross,
        "tds": total_tds,
        "net": total_net,
        "penalty_gross": penalty_gross,
        "penalty_tds": penalty_tds,
        "penalty_net": penalty_net,
        "penalty_days": penalty_days,
        "daily_gross": daily["gross"],
        "daily_tds": daily["tds"],
        "daily_net": daily["net"],
    }


def investment_summary(stats: dict, user_amount: float = 0) -> Dict[str, Any]:
    principal = investment_principal(stats, user_amount)
    daily = daily_interest_breakdown(principal)
    monthly_gross = round(principal * MONTHLY_GROSS_RATE, 2)
    monthly_tds = round(monthly_gross * TDS_ON_INTEREST_RATE, 2)
    monthly_net = round(monthly_gross - monthly_tds, 2)
    return {
        "principal": principal,
        "monthly_gross_rate_percent": round(MONTHLY_GROSS_RATE * 100, 2),
        "tds_on_interest_percent": round(TDS_ON_INTEREST_RATE * 100, 2),
        "monthly_gross": monthly_gross,
        "monthly_tds": monthly_tds,
        "monthly_net": monthly_net,
        "daily_gross": daily["gross"],
        "daily_tds": daily["tds"],
        "daily_net": daily["net"],
        "total_interest_net": float(stats.get("investment_interest_total", 0) or 0),
        "total_tds": float(stats.get("investment_tds_total", 0) or 0),
        "interest_today_net": float(stats.get("investment_interest_today", 0) or 0),
        "tds_today": float(stats.get("investment_tds_today", 0) or 0),
        "penalty_total": float(stats.get("interest_penalty_total", 0) or 0),
        "penalty_today": float(stats.get("interest_penalty_today", 0) or 0),
        "missed_days_total": int(stats.get("interest_missed_days_total", 0) or 0),
        "last_accrual_date": stats.get("interest_last_accrual_date"),
    }
