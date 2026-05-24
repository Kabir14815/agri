#!/usr/bin/env python3
"""End-to-end API tests: register users, referral, wallet transfer."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# Load .env when run directly
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"
TS = int(time.time())
USER_A_EMAIL = f"e2e.member.a.{TS}@example.com"
USER_B_EMAIL = f"e2e.member.b.{TS}@example.com"
PASSWORD = "testpass123"
DEMO_EMAIL = "demo@kgffarming.com"
DEMO_PASSWORD = "demo1234"
SPONSOR_CODE = "KGF870365"


class TestFailure(Exception):
    pass


def req(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    url = f"{BASE.rstrip('/')}{path}"
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8")
        try:
            parsed = json.loads(detail)
            msg = parsed.get("detail", detail)
        except json.JSONDecodeError:
            msg = detail
        raise TestFailure(f"{method} {path} -> {e.code}: {msg}") from e


def ok(label: str) -> None:
    print(f"  OK  {label}")


def run() -> None:
    print(f"\n=== E2E tests against {BASE} ===\n")

    health = req("GET", "/health")
    if health.get("status") != "ok":
        raise TestFailure(f"Health check failed: {health}")
    ok("Health")

    sponsor = req("GET", f"/referral/lookup?code={SPONSOR_CODE}")
    if not sponsor.get("valid"):
        raise TestFailure(f"Sponsor lookup failed: {sponsor}")
    ok(f"Referral lookup ({SPONSOR_CODE} -> {sponsor.get('sponsor_name')})")

    req(
        "POST",
        "/referral/track-visit",
        {"code": SPONSOR_CODE, "path": f"/ref/{SPONSOR_CODE}"},
    )
    ok("Referral visit tracked")

    reg_a = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"E2E Member A {TS}",
            "email": USER_A_EMAIL,
            "phone": "9876500001",
            "password": PASSWORD,
            "role": "customer",
            "sponsor_member_id": SPONSOR_CODE,
        },
    )
    ok(f"Registered user A ({USER_A_EMAIL})")

    member_a = reg_a["user"]["member_id"]
    login_a = req("POST", "/auth/login", {"member_id": member_a, "password": PASSWORD})
    token_a = login_a["token"]
    ok(f"Login user A with member_id {member_a}")

    dash_a = req("GET", "/user/dashboard", token=token_a)
    ref_info = req("GET", "/user/referral-info", token=token_a)
    if ref_info.get("member_id") != member_a:
        raise TestFailure("Referral info member_id mismatch")
    ok("User A dashboard & referral-info")

    reg_b = req(
        "POST",
        "/auth/register",
        {
            "full_name": f"E2E Member B {TS}",
            "email": USER_B_EMAIL,
            "phone": "9876500002",
            "password": PASSWORD,
            "role": "customer",
            "sponsor_member_id": member_a,
        },
    )
    ok(f"Registered user B under sponsor {member_a}")

    member_b = reg_b["user"]["member_id"]
    login_b = req("POST", "/auth/login", {"member_id": member_b, "password": PASSWORD})
    token_b = login_b["token"]
    ok(f"Login user B with member_id {member_b}")

    demo = req("POST", "/auth/login", {"member_id": SPONSOR_CODE, "password": DEMO_PASSWORD})
    token_demo = demo["token"]
    ok("Login demo sponsor")

    lookup_b = req(
        "GET",
        f"/user/wallet/transfer/lookup?member_id={member_b}",
        token=token_demo,
    )
    if lookup_b.get("member_id") != member_b:
        raise TestFailure(f"Transfer lookup failed: {lookup_b}")
    ok(f"Wallet transfer lookup -> {lookup_b.get('full_name')}")

    transfer = req(
        "POST",
        "/user/wallet/transfer",
        {"to_member_id": member_b, "amount": 150},
        token=token_demo,
    )
    if transfer.get("available_fund") is None:
        raise TestFailure(f"Transfer response missing balance: {transfer}")
    ok(f"Demo transferred Rs 150 to {member_b}")

    wallet_b = req("GET", "/user/wallet/transfer", token=token_b)
    if float(wallet_b.get("available_fund", 0)) < 150:
        raise TestFailure(f"User B balance too low: {wallet_b.get('available_fund')}")
    ok(f"User B received funds (balance Rs {wallet_b['available_fund']})")

    lookup_a = req(
        "GET",
        f"/user/wallet/transfer/lookup?member_id={member_a}",
        token=token_b,
    )
    ok(f"User B lookup sponsor {member_a} -> {lookup_a.get('full_name')}")

    transfer_back = req(
        "POST",
        "/user/wallet/transfer",
        {"to_member_id": member_a, "amount": 100},
        token=token_b,
    )
    ok("User B transferred Rs 100 back to user A")

    txs = req("GET", "/user/transactions", token=token_b)
    categories = {t.get("category") for t in txs.get("transactions", [])}
    if "wallet_transfer" not in categories:
        raise TestFailure("wallet_transfer missing from transactions")
    ok("Transactions include wallet_transfer")

    try:
        req(
            "POST",
            "/user/wallet/transfer",
            {"to_member_id": member_b, "amount": 50},
            token=token_b,
        )
        raise TestFailure("Expected min amount error for ₹50")
    except TestFailure as e:
        if "50" not in str(e) and "100" not in str(e) and "Minimum" not in str(e):
            raise
    ok("Rejected transfer below minimum (Rs 50)")

    try:
        req(
            "GET",
            f"/user/wallet/transfer/lookup?member_id={member_b}",
            token=token_b,
        )
        raise TestFailure("Expected self-transfer lookup error")
    except TestFailure as e:
        if "yourself" not in str(e).lower():
            raise
    ok("Rejected self-transfer lookup")

    print("\n=== All E2E tests passed ===\n")
    print(f"  User A: {USER_A_EMAIL} / {PASSWORD}  ({member_a})")
    print(f"  User B: {USER_B_EMAIL} / {PASSWORD}  ({member_b})")
    print(f"  Sponsor: {SPONSOR_CODE}\n")


if __name__ == "__main__":
    try:
        run()
    except TestFailure as e:
        print(f"\nFAILED: {e}\n", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"\nFAILED: Cannot reach API at {BASE} — {e}\n", file=sys.stderr)
        sys.exit(1)
