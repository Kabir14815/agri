#!/usr/bin/env python3
"""Smoke test admin exchange approval."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from _test_env import require_admin_creds

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"
TS = int(time.time())
PASSWORD = "testpass123"
INVEST = 250_000


def req(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    url = f"{BASE.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as resp:
        return json.loads(resp.read().decode() or "{}")


def main() -> None:
    admin_email, admin_password = require_admin_creds()

    sponsor = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"Exchange Sponsor {TS}",
            "email": f"exchange.sponsor.{TS}@example.com",
            "phone": "9876512400",
            "password": PASSWORD,
            "role": "customer",
        },
    )
    sponsor_mid = sponsor["user"]["member_id"]
    sponsor_id = sponsor["user"]["id"]

    member = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"Exchange Member {TS}",
            "email": f"exchange.member.{TS}@example.com",
            "phone": "9876512401",
            "password": PASSWORD,
            "role": "customer",
            "sponsor_member_id": sponsor_mid,
        },
    )
    member_id = member["user"]["id"]

    admin = req(
        "POST",
        "/auth/login",
        {"member_id": admin_email, "password": admin_password},
    )
    admin_token = admin["token"]
    req("PATCH", f"/admin/users/{member_id}/mlm", {"amount": INVEST}, token=admin_token)

    login = req(
        "POST",
        "/auth/login",
        {"member_id": sponsor_mid, "password": PASSWORD},
    )
    token = login["token"]
    wallet = req("GET", "/user/wallet", token=token)
    income = float(wallet["income_wallet"])
    if income < 100:
        raise SystemExit(f"FAIL: sponsor income balance too low: {income}")
    ex = req(
        "POST",
        "/user/exchange",
        {"from_wallet": "income", "to_wallet": "repurchase", "amount": 100},
        token=token,
    )
    ex_id = ex["exchange"]["id"]
    approved = req(
        "PATCH",
        f"/admin/exchange/{ex_id}",
        {"status": "approved"},
        token=admin_token,
    )
    if approved.get("exchange", {}).get("status") != "approved":
        raise SystemExit(f"FAIL: not approved: {approved}")
    wallet2 = req("GET", "/user/wallet", token=token)
    if float(wallet2["income_wallet"]) > income - 100:
        raise SystemExit("FAIL: income wallet not debited")
    print("OK  exchange approval flow")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print(f"FAIL: {e.code} {e.read().decode()}")
        sys.exit(1)
