#!/usr/bin/env python3
"""Test 2% upline bonus (5 levels), min investment, and 24-level tree API."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://agri-n5jz.onrender.com/api"
TS = int(time.time())
ADMIN_EMAIL = "admin@kgffarming.com"
ADMIN_PASSWORD = "admin1234"
INVEST = 250_000
PASSWORD = "testpass123"


def req(method, path, body=None, token=None):
    url = f"{BASE.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=120) as resp:
        return json.loads(resp.read().decode() or "{}")


def fail(msg):
    print(f"FAIL: {msg}")
    sys.exit(1)


def direct_income(dash):
    for inc in dash.get("incomes", []):
        if inc.get("key") == "direct_income":
            return float(inc.get("value", 0))
    return 0.0


def main():
    print(f"\n=== Referral bonus tests: {BASE} ===\n")

    modes = req("GET", "/user/deposit-modes")
    if modes.get("min_investment") != 250000:
        fail(f"min_investment expected 250000, got {modes.get('min_investment')}")
    print("OK  deposit min ₹2.5L in API")

    admin = req("POST", "/auth/login", {"member_id": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    admin_token = admin["token"]

    reg_s = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"Sponsor {TS}",
            "email": f"sponsor.bonus.{TS}@example.com",
            "phone": "9876512300",
            "password": PASSWORD,
            "role": "customer",
        },
    )
    sponsor_id = reg_s["user"]["id"]
    sponsor_mid = reg_s["user"]["member_id"]
    print(f"OK  sponsor {sponsor_mid}")

    req("PATCH", f"/admin/users/{sponsor_id}/mlm", {"amount": INVEST}, token=admin_token)

    login_s = req("POST", "/auth/login", {"member_id": sponsor_mid, "password": PASSWORD})
    token_s = login_s["token"]
    before = direct_income(req("GET", "/user/dashboard", token=token_s))

    reg_c = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"Child {TS}",
            "email": f"child.bonus.{TS}@example.com",
            "phone": "9876512301",
            "password": PASSWORD,
            "role": "customer",
            "sponsor_member_id": sponsor_mid,
        },
    )
    child_id = reg_c["user"]["id"]
    child_mid = reg_c["user"]["member_id"]
    print(f"OK  child {child_mid} under {sponsor_mid}")

    try:
        req("PATCH", f"/admin/users/{child_id}/mlm", {"amount": 100000}, token=admin_token)
        fail("Expected min investment error for ₹100000")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "2,50,000" not in body and "250" not in body:
            fail(f"Unexpected error for low amount: {body}")
    print("OK  rejected package below ₹2.5L")

    req("PATCH", f"/admin/users/{child_id}/mlm", {"amount": INVEST}, token=admin_token)
    print(f"OK  activated child with ₹{INVEST}")

    after = direct_income(req("GET", "/user/dashboard", token=token_s))
    expected = round(INVEST * 0.02, 2)
    gained = round(after - before, 2)
    if gained < expected - 0.01:
        fail(f"Sponsor direct income should increase by ~{expected}, gained {gained}")
    print(f"OK  sponsor direct bonus ₹{gained} (expected ~₹{expected})")

    tree = req("GET", f"/user/referral-tree?member_id={sponsor_mid}", token=token_s)
    if tree.get("max_depth") != 24:
        fail(f"tree max_depth should be 24, got {tree.get('max_depth')}")
    print("OK  referral tree reports 24 levels")

    print("\nAll referral bonus tests passed.\n")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        fail(e.read().decode())
    except urllib.error.URLError as e:
        fail(str(e))
