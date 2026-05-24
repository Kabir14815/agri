"""MLM dashboard business logic — ranks, wallets, income calculations."""
from __future__ import annotations

from copy import deepcopy
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

DEMO_MLM_BY_EMAIL: Dict[str, Dict[str, Any]] = {
    "demo@kgffarming.com": {
        "member_id": "KGF870365",
        "package_amount": 100_000,
        "main_leg_business": 410_000,
        "rest_leg_business": 620_000,
        "self_unit_profit": 25_666.41,
        "direct_income": 13_600,
        "level_income": 15_949.876,
        "reward_bonus": 5_000,
        "salary_bonus": 0,
        "total_earning": 60_216.286,
        "level_open": 5,
        "subscribers_count": 5,
        "income_wallet": 7_896.59,
        "repurchase_wallet": 1_082.67,
        "topup_wallet": 0,
        "income_wallet_progress": 70,
        "direct_income_today": 0,
        "level_income_today": 345.551,
        "reward_bonus_today": 0,
        "salary_bonus_today": 0,
        "repurchase_income_today": 0,
        "earning_limit_total": 80_000,
        "earning_limit_pending": 15_000,
        "earning_limit_cross": 2_000,
        "team_business": 1_030_000,
        "direct_business": 620_000,
        "direct_active_users": 5,
        "quarterly_earnings": [12_000, 18_500, 14_200, 15_516.286],
        "location": "India",
    },
    "partner@kgffarming.com": {
        "member_id": "KGF870366",
        "package_amount": 50_000,
        "main_leg_business": 180_000,
        "rest_leg_business": 220_000,
        "self_unit_profit": 8_200,
        "direct_income": 4_500,
        "level_income": 3_100,
        "reward_bonus": 1_000,
        "salary_bonus": 0,
        "total_earning": 16_800,
        "level_open": 3,
        "subscribers_count": 3,
        "income_wallet": 2_450,
        "repurchase_wallet": 320,
        "topup_wallet": 500,
        "income_wallet_progress": 45,
        "direct_income_today": 120,
        "level_income_today": 85.5,
        "reward_bonus_today": 0,
        "salary_bonus_today": 0,
        "repurchase_income_today": 0,
        "earning_limit_total": 25_000,
        "earning_limit_pending": 8_000,
        "earning_limit_cross": 0,
        "team_business": 400_000,
        "direct_business": 150_000,
        "direct_active_users": 3,
        "quarterly_earnings": [3_200, 4_100, 4_500, 5_000],
        "location": "India",
    },
}


def member_id_for(user_id: int) -> str:
    return f"KGF{870_000 + int(user_id)}"


def default_mlm_stats(user_id: int, package_amount: float = 0) -> Dict[str, Any]:
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
        "level_open": 1 if pkg >= 10_000 else 0,
        "subscribers_count": 1 if pkg else 0,
        "income_wallet": float(package_amount or 0),
        "repurchase_wallet": 0,
        "topup_wallet": 0,
        "income_wallet_progress": min(100, int((pkg / 100_000) * 70)) if pkg else 0,
        "direct_income_today": 0,
        "level_income_today": 0,
        "reward_bonus_today": 0,
        "salary_bonus_today": 0,
        "repurchase_income_today": 0,
        "earning_limit_total": max(20_000, pkg * 2) if pkg else 20_000,
        "earning_limit_pending": max(0, pkg * 0.3) if pkg else 15_000,
        "earning_limit_cross": 0,
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
    }


def resolve_mlm_stats(user: dict) -> Dict[str, Any]:
    email = user.get("email", "")
    if email in DEMO_MLM_BY_EMAIL:
        stats = deepcopy(DEMO_MLM_BY_EMAIL[email])
    elif user.get("mlm"):
        stats = deepcopy(user["mlm"])
    else:
        stats = default_mlm_stats(user["id"], user.get("amount", 0))

    stats.setdefault("member_id", member_id_for(user["id"]))
    stats.setdefault("package_amount", float(user.get("amount", 0) or 0))
    stats.setdefault("income_wallet", float(user.get("amount", 0) or 0))
    if not stats.get("location"):
        parts = [user.get("city"), user.get("state")]
        stats["location"] = ", ".join(p for p in parts if p) or "India"
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


def build_dashboard_payload(user: dict, site_base: str = "https://kgffarmingindia.com") -> dict:
    from .investment_interest import investment_summary

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
            "label": "Investment Return (10% p.m.)",
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
            "label": "Investment Return Today (net)",
            "value": float(stats.get("investment_interest_today", 0) or 0),
        },
        {
            "label": "TDS on Interest Today (1%)",
            "value": float(stats.get("investment_tds_today", 0) or 0),
        },
        {"label": "Direct Income Today", "value": stats["direct_income_today"]},
        {"label": "Level Income Today", "value": stats["level_income_today"]},
        {"label": "Reward Bonus Today", "value": stats["reward_bonus_today"]},
        {"label": "Salary Bonus Today", "value": stats["salary_bonus_today"]},
        {"label": "Repurchase Income Today", "value": stats["repurchase_income_today"]},
    ]
    max_today = max((t["value"] for t in today_incomes), default=1) or 1
    for item in today_incomes:
        item["percent"] = round((item["value"] / max_today) * 100, 1) if max_today else 0

    limit_total = float(stats["earning_limit_total"])
    limit_pending = float(stats["earning_limit_pending"])
    limit_cross = float(stats["earning_limit_cross"])
    limit_used = max(0, limit_total - limit_pending - limit_cross)

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
    }
