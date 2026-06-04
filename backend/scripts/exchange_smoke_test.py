#!/usr/bin/env python3
"""Smoke test admin exchange approval."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"


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
    login = req(
        "POST",
        "/auth/login",
        {"member_id": "demo@kgffarming.com", "password": "demo1234"},
    )
    token = login["token"]
    wallet = req("GET", "/user/wallet", token=token)
    income = float(wallet["income_wallet"])
    if income < 100:
        raise SystemExit(f"FAIL: demo income balance too low: {income}")
    ex = req(
        "POST",
        "/user/exchange",
        {"from_wallet": "income", "to_wallet": "repurchase", "amount": 100},
        token=token,
    )
    ex_id = ex["exchange"]["id"]
    admin = req(
        "POST",
        "/auth/login",
        {"member_id": "admin@kgffarming.com", "password": "admin1234"},
    )
    approved = req(
        "PATCH",
        f"/admin/exchange/{ex_id}",
        {"status": "approved"},
        token=admin["token"],
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
