"""MLM dashboard business logic — ranks, wallets, income calculations."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, List, Optional

# Rank tiers: incremental business required per leg (cumulative for achievement)
RANK_TIERS: List[Dict[str, Any]] = [
    {
        "rank": "STAR",
        "power_increment": 250_000,
        "rest_increment": 250_000,
        "reward": "Smart Phone / ₹5000",
        "salary_amount": 1000,
        "total_months": 10,
        "capping": 20_000,
    },
    {
        "rank": "SUPERSTAR",
        "power_increment": 500_000,
        "rest_increment": 500_000,
        "reward": "Smart Tab / ₹10000",
        "salary_amount": 2000,
        "total_months": 10,
        "capping": 30_000,
    },
    {
        "rank": "PEARL",
        "power_increment": 1_000_000,
        "rest_increment": 1_000_000,
        "reward": "Laptop / ₹20000",
        "salary_amount": 3500,
        "total_months": 10,
        "capping": 40_000,
    },
    {
        "rank": "SILVER",
        "power_increment": 2_000_000,
        "rest_increment": 2_000_000,
        "reward": "Pulsar Bike / ₹50000",
        "salary_amount": 5000,
        "total_months": 10,
        "capping": 70_000,
    },
    {
        "rank": "GOLD",
        "power_increment": 5_000_000,
        "rest_increment": 5_000_000,
        "reward": "Alto Car / ₹250,000",
        "salary_amount": 10_000,
        "total_months": 15,
        "capping": 250_000,
    },
    {
        "rank": "PLATINUM",
        "power_increment": 10_000_000,
        "rest_increment": 10_000_000,
        "reward": "Swift Car / ₹500,000",
        "salary_amount": 20_000,
        "total_months": 15,
        "capping": 500_000,
    },
    {
        "rank": "DIAMOND",
        "power_increment": 20_000_000,
        "rest_increment": 20_000_000,
        "reward": "Brezza Car / ₹1,000,000",
        "salary_amount": 25_000,
        "total_months": 20,
        "capping": 1_000_000,
    },
    {
        "rank": "ROYAL DIAMOND",
        "power_increment": 50_000_000,
        "rest_increment": 50_000_000,
        "reward": "Fortuner Car / ₹2,100,000",
        "salary_amount": 75_000,
        "total_months": 20,
        "capping": 2_100_000,
    },
    {
        "rank": "BLUE DIAMOND",
        "power_increment": 100_000_000,
        "rest_increment": 100_000_000,
        "reward": "Mercedes Car / ₹3,500,000",
        "salary_amount": 100_000,
        "total_months": 25,
        "capping": 3_500_000,
    },
    {
        "rank": "ENTERPRENEUR",
        "power_increment": 200_000_000,
        "rest_increment": 200_000_000,
        "reward": "BMW Car / ₹6,500,000",
        "salary_amount": 240_000,
        "total_months": 25,
        "capping": 8_500_000,
    },
    {
        "rank": "CHAIRMAN",
        "power_increment": 500_000_000,
        "rest_increment": 500_000_000,
        "reward": "Range Rover / ₹15,000,000",
        "salary_amount": 250_000,
        "total_months": 40,
        "capping": 15_000_000,
    },
    {
        "rank": "VICE PRESIDENT",
        "power_increment": 1_000_000_000,
        "rest_increment": 1_000_000_000,
        "reward": "Farm House + Bangla / ₹30,000,000",
        "salary_amount": 500_000,
        "total_months": 40,
        "capping": 30_000_000,
    },
]

def member_id_for(user_id: int) -> str:
    return f"KGF{870_000 + int(user_id)}"


def default_mlm_stats(user_id: int, package_amount: float = 0) -> Dict[str, Any]:
    from .referral_config import level_open_for_package

    pkg = float(package_amount or 0)
    base = pkg * 0.6 if pkg else 0
    return {
        "member_id": member_id_for(user_id),
        "package_amount": pkg,
        "main_leg_business": base,
        "rest_leg_business": base * 1.2 if base else 0,
        "self_unit_profit": round(pkg * 0.12, 2) if pkg else 0,
        "direct_income": round(pkg * 0.08, 2) if pkg else 0,
        "level_income": round(pkg * 0.05, 2) if pkg else 0,
        "reward_bonus": 0,
        "salary_bonus": 0,
        "total_earning": round(pkg * 0.25, 2) if pkg else 0,
        "level_open": level_open_for_package(pkg),
        "subscribers_count": 1 if pkg else 0,
        "income_wallet": 0.0,          # wallets start empty — ledger is source of truth
        "repurchase_wallet": 0.0,
        "topup_wallet": 0.0,
        "income_wallet_progress": 0,
        "direct_income_today": 0,
        "level_income_today": 0,
        "reward_bonus_today": 0,
        "salary_bonus_today": 0,
        "repurchase_income_today": 0,
        "earning_limit_total": round(pkg * 10, 2) if pkg else 0.0,   # 10× principal; 0 if inactive
        "earning_limit_pending": 0.0,   # synced to income_wallet in sync_live_mlm_stats
        "earning_limit_cross": 0.0,
        "team_business": base * 2 if base else 0,
        "direct_business": base if base else 0,
        "direct_active_users": 1 if pkg else 0,
        "quarterly_earnings": [0, 0, 0, round(pkg * 0.25, 2) if pkg else 0],
        "location": "India",
        "investment_principal": pkg,
        "investment_interest_total": 0.0,
        "investment_tds_total": 0.0,
        "investment_interest_gross_total": 0.0,
        "investment_interest_today": 0.0,
        "investment_tds_today": 0.0,
        "investment_return_income": 0.0,
        "interest_penalty_total": 0.0,
        "interest_penalty_today": 0.0,
        "interest_missed_days_total": 0,
        "income_stats_date": None,
    }


def resolve_mlm_stats(user: dict) -> Dict[str, Any]:
    """Always prefer live MongoDB mlm stats; never replace with hardcoded demo snapshots."""
    pkg_amount = float(user.get("amount", 0) or 0)
    if user.get("mlm") and isinstance(user["mlm"], dict):
        stats = deepcopy(user["mlm"])
    else:
        stats = default_mlm_stats(user["id"], pkg_amount)

    stats.setdefault("member_id", member_id_for(user["id"]))
    stats["package_amount"] = pkg_amount
    if not stats.get("income_wallet") and pkg_amount:
        stats.setdefault("income_wallet", pkg_amount)
    if not stats.get("location"):
        parts = [user.get("city"), user.get("state")]
        stats["location"] = ", ".join(p for p in parts if p) or "India"
    from .referral_config import (
        DIRECT_BONUS_LEVELS,
        DIRECT_BONUS_RATE,
        MIN_INVESTMENT,
        REFERRAL_TREE_MAX_LEVELS,
        level_open_for_package,
        next_level_unlock_amount,
    )

    pkg_amt = float(stats.get("package_amount", 0) or 0)
    stats["level_open"] = level_open_for_package(pkg_amt)
    stats["referral_plan"] = {
        "tree_levels": REFERRAL_TREE_MAX_LEVELS,
        "bonus_levels": DIRECT_BONUS_LEVELS,
        "bonus_rate_percent": DIRECT_BONUS_RATE * 100,
        "min_investment": MIN_INVESTMENT,
        "next_unlock_amount": next_level_unlock_amount(pkg_amt),
        "level_tiers": [
            {"amount": t[0], "levels_open": t[1]} for t in (
                (250_000, 5),
                (500_000, 12),
                (750_000, 19),
                (1_000_000, 24),
            )
        ],
    }
    return stats


def compute_ranks(main_leg: float, rest_leg: float) -> List[Dict[str, Any]]:
    cumulative_power = 0
    cumulative_rest = 0
    current_rank: Optional[str] = None
    rows: List[Dict[str, Any]] = []

    for idx, tier in enumerate(RANK_TIERS):
        cumulative_power += tier["power_increment"]
        cumulative_rest += tier["rest_increment"]
        achieved = main_leg >= cumulative_power and rest_leg >= cumulative_rest
        if achieved:
            current_rank = tier["rank"]

        salary = tier["salary_amount"]
        months = tier["total_months"]
        rows.append(
            {
                "sr": idx + 1,
                "rank": tier["rank"],
                "required_power": tier["power_increment"],
                "required_rest": tier["rest_increment"],
                "required_power_cumulative": cumulative_power,
                "required_rest_cumulative": cumulative_rest,
                "is_next_increment": idx > 0,
                "reward": tier["reward"],
                "salary_amount": salary,
                "total_months": months,
                "total_amount": salary * months,
                "capping": tier["capping"],
                "status": "achieved" if achieved else "pending",
            }
        )

    return rows, current_rank or "MEMBER"


def build_dashboard_payload(
    user: dict, site_base: str = "https://kgffarmingindia.com", store=None
) -> dict:
    from .investment_interest import investment_summary, investment_principal
    from .farmer_logs import log_public, today_utc

    computed_at = datetime.utcnow().isoformat() + "Z"
    stats = resolve_mlm_stats(user)
    main_leg = float(stats["main_leg_business"])
    rest_leg = float(stats["rest_leg_business"])
    ranks, active_rank = compute_ranks(main_leg, rest_leg)

    member_id = stats["member_id"]
    referral_link = f"{site_base.rstrip('/')}/ref/{member_id}"

    investment_return = float(
        stats.get("investment_return_income") or stats.get("investment_interest_total") or 0
    )
    incomes = [
        {"key": "self_unit_profit", "label": "Self Unit Profit", "value": stats["self_unit_profit"]},
        {"key": "direct_income", "label": "Direct Income", "value": stats["direct_income"]},
        {"key": "level_income", "label": "Level Income", "value": stats["level_income"]},
        {
            "key": "investment_return",
            "label": "Rental Income (10% p.m.)",
            "value": investment_return,
        },
        {"key": "reward_bonus", "label": "Reward Bonus", "value": stats["reward_bonus"]},
        {"key": "salary_bonus", "label": "Salary Bonus", "value": stats["salary_bonus"]},
    ]
    max_income = max((i["value"] for i in incomes), default=1) or 1
    for item in incomes:
        item["percent"] = round((item["value"] / max_income) * 100, 1)

    today_incomes = [
        {
            "label": "Rental Income Today (net)",
            "value": float(stats.get("investment_interest_today", 0) or 0),
        },
        {
            "label": "TDS on Rental Income Today (2%)",
            "value": float(stats.get("investment_tds_today", 0) or 0),
        },
        {"label": "Direct Income Today", "value": stats["direct_income_today"]},
        {"label": "Level Income Today", "value": stats["level_income_today"]},
        {"label": "Reward Bonus Today", "value": stats["reward_bonus_today"]},
        {"label": "Salary Bonus Today", "value": stats["salary_bonus_today"]},
        {"label": "Repurchase Income Today", "value": stats["repurchase_income_today"]},
    ]
    penalty_today = float(stats.get("interest_penalty_today", 0) or 0)
    if penalty_today > 0:
        today_incomes.insert(
            0,
            {
                "label": "Rental income cut today (no photo)",
                "value": penalty_today,
            },
        )
    max_today = max((t["value"] for t in today_incomes), default=1) or 1
    for item in today_incomes:
        item["percent"] = round((item["value"] / max_today) * 100, 1) if max_today else 0

    limit_total = float(stats["earning_limit_total"])
    limit_pending = float(stats["earning_limit_pending"])
    limit_cross = float(stats["earning_limit_cross"])
    limit_used = max(0, limit_total - limit_pending - limit_cross)

    principal = investment_principal(stats, float(user.get("amount", 0) or 0))
    today_key = today_utc()
    today_log = (
        store.get_farm_log_for_date(user["id"], today_key) if store else None
    )
    submitted_today = bool(
        today_log
        and (
            today_log.get("image_data")
            or int(today_log.get("image_size_bytes", 0) or 0) > 0
        )
    )
    recent_penalties = (
        store.list_interest_penalties_for_user(user["id"], 14) if store else []
    )

    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user.get("role", "customer"),
        "amount": float(user.get("amount", 0) or 0),
        "member_id": member_id,
        "rank": active_rank,
        "package_amount": float(stats["package_amount"]),
        "main_leg_business": main_leg,
        "rest_leg_business": rest_leg,
        "location": stats.get("location", "India"),
        "referral_link": referral_link,
        "total_earning": float(stats["total_earning"]),
        "level_open": int(stats["level_open"]),
        "referral_plan": stats.get("referral_plan", {}),
        "subscribers_count": int(stats["subscribers_count"]),
        "incomes": incomes,
        "today_incomes": today_incomes,
        "income_wallet": float(stats["income_wallet"]),
        "repurchase_wallet": float(stats["repurchase_wallet"]),
        "topup_wallet": float(stats["topup_wallet"]),
        "income_wallet_progress": int(stats["income_wallet_progress"]),
        "quarterly_earnings": stats["quarterly_earnings"],
        "earning_limits": {
            "total": limit_total,
            "pending": limit_pending,
            "cross": limit_cross,
            "used": limit_used,
        },
        "team_business": float(stats["team_business"]),
        "direct_business": float(stats["direct_business"]),
        "direct_active_users": int(stats["direct_active_users"]),
        "ranks": ranks,
        "investment": investment_summary(stats, float(user.get("amount", 0) or 0)),
        "daily_log": {
            "log_date": today_key,
            "requires_photo": principal > 0,
            "submitted_today": submitted_today,
            "today": log_public(today_log, include_image=True) if today_log else None,
            "penalty_total": float(stats.get("interest_penalty_total", 0) or 0),
            "penalty_today": float(stats.get("interest_penalty_today", 0) or 0),
            "missed_days_total": int(stats.get("interest_missed_days_total", 0) or 0),
            "recent_penalties": recent_penalties,
        },
        "computed_at": computed_at,
        "notifications": (
            store.list_user_notifications(user["id"]) if store else []
        ),
    }
