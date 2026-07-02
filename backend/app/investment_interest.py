"""Daily rental income: 10% per month gross, 2% TDS on rental income.

Missing daily crop photo → that day's income is not credited (penalty tracked separately).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Callable, Dict, Optional

MONTHLY_GROSS_RATE = 0.10
TDS_ON_INTEREST_RATE = 0.02
DAYS_PER_MONTH = 30
MAX_CATCHUP_DAYS = 90
INTEREST_CAP_MULTIPLIER = 10  # max lifetime net interest = 10× principal (e.g. ₹2.5L → ₹25L)


def interest_earning_cap(principal: float) -> float:
    if principal <= 0:
        return 0.0
    return round(principal * INTEREST_CAP_MULTIPLIER, 2)


def interest_earned_so_far(stats: dict) -> float:
    return float(stats.get("investment_interest_total", 0) or 0)


def interest_remaining_cap(stats: dict, principal: float) -> float:
    return max(0.0, interest_earning_cap(principal) - interest_earned_so_far(stats))


def _cap_daily_credit(
    stats: dict, principal: float, gross: float, tds: float, net: float
) -> tuple[float, float, float]:
    """Scale a day's interest so lifetime net never exceeds 10× principal."""
    remaining = interest_remaining_cap(stats, principal)
    if remaining <= 0 or net <= 0:
        return 0.0, 0.0, 0.0
    if net <= remaining:
        return gross, tds, net
    ratio = remaining / net
    return (
        round(gross * ratio, 4),
        round(tds * ratio, 4),
        round(remaining, 4),
    )


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
    # TDS is 2% of total investment principal, prorated daily
    tds = round(principal * TDS_ON_INTEREST_RATE / DAYS_PER_MONTH, 4)
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
        # Interest starts the day AFTER admin approval — set last accrual to today
        # so the first daily credit runs tomorrow onwards.
        stats["interest_last_accrual_date"] = today.isoformat()
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
    if compliant and interest_remaining_cap(stats, principal) > 0:
        gross, tds, net = _cap_daily_credit(
            stats, principal, daily["gross"], daily["tds"], daily["net"]
        )
        stats["investment_interest_today"] = round(net, 2)
        stats["investment_tds_today"] = round(tds, 2)
        stats["interest_penalty_today"] = 0.0
    else:
        stats["investment_interest_today"] = 0.0
        stats["investment_tds_today"] = 0.0
        stats["interest_penalty_today"] = (
            round(daily["net"], 2) if not compliant else 0.0
        )
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
    base_earned = interest_earned_so_far(stats)

    cap_reached = False
    for offset in range(1, days + 1):
        if cap_reached:
            break
        accrual_date = last + timedelta(days=offset)
        compliant = daily_log_checker is None or daily_log_checker(accrual_date)
        if compliant:
            scratch = {**stats, "investment_interest_total": base_earned + total_net}
            gross, tds, net = _cap_daily_credit(
                scratch, principal, daily["gross"], daily["tds"], daily["net"]
            )
            if net <= 0:
                cap_reached = True
                break
            total_gross += gross
            total_tds += tds
            total_net += net
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
    # TDS is 2% of total investment principal
    monthly_tds = round(principal * TDS_ON_INTEREST_RATE, 2)
    monthly_net = round(monthly_gross - monthly_tds, 2)
    cap = interest_earning_cap(principal)
    earned = interest_earned_so_far(stats)
    remaining = interest_remaining_cap(stats, principal)
    return {
        "principal": principal,
        "monthly_gross_rate_percent": round(MONTHLY_GROSS_RATE * 100, 2),
        "tds_on_interest_percent": round(TDS_ON_INTEREST_RATE * 100, 2),
        "interest_cap_net": cap,
        "interest_remaining_net": round(remaining, 2),
        "interest_cap_reached": remaining <= 0 and principal > 0,
        "interest_cap_multiplier": INTEREST_CAP_MULTIPLIER,
        "monthly_gross": monthly_gross,
        "monthly_tds": monthly_tds,
        "monthly_net": monthly_net,
        "daily_gross": daily["gross"],
        "daily_tds": daily["tds"],
        "daily_net": daily["net"],
        "total_interest_net": earned,
        "total_tds": float(stats.get("investment_tds_total", 0) or 0),
        "interest_today_net": float(stats.get("investment_interest_today", 0) or 0),
        "tds_today": float(stats.get("investment_tds_today", 0) or 0),
        "penalty_total": float(stats.get("interest_penalty_total", 0) or 0),
        "penalty_today": float(stats.get("interest_penalty_today", 0) or 0),
        "missed_days_total": int(stats.get("interest_missed_days_total", 0) or 0),
        "last_accrual_date": stats.get("interest_last_accrual_date"),
    }
