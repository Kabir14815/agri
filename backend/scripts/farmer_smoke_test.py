#!/usr/bin/env python3
"""Smoke test farmer login, dashboard, and daily log upload."""
from __future__ import annotations

import io
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"
FARMER_EMAIL = "farmer@kgffarming.com"
FARMER_PASSWORD = "farmer1234"


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    sys.exit(1)


def json_req(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    url = f"{BASE.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        try:
            msg = json.loads(detail).get("detail", detail)
        except json.JSONDecodeError:
            msg = detail
        fail(f"{method} {path} -> {e.code}: {msg}")


def multipart_log(token: str, watered: bool) -> dict:
  # minimal 1x1 JPEG
    jpeg = bytes.fromhex(
        "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707"
        "070909080a0c141d0c0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c"
        "231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b"
        "0c180d0d1832211c1c213221213232323232323232323232323232323232323232"
        "323232323232323232323232323232323232323232323232323232ffc000110800"
        "01000103011100021100031101ffc4001500010100000000000000000000000000"
        "0008ffc40014100100000000000000000000000000000000ffda000c0301000211"
        "03001100003f80ffd9"
    )
    boundary = "----FarmerSmokeTest"
    body = []
    body.append(f"--{boundary}\r\n".encode())
    body.append(b'Content-Disposition: form-data; name="watered"\r\n\r\n')
    body.append(b"true\r\n" if watered else b"false\r\n")
    body.append(f"--{boundary}\r\n".encode())
    body.append(b'Content-Disposition: form-data; name="note"\r\n\r\n')
    body.append(b"smoke test\r\n")
    body.append(f"--{boundary}\r\n".encode())
    body.append(
        b'Content-Disposition: form-data; name="photo"; filename="field.jpg"\r\n'
    )
    body.append(b"Content-Type: image/jpeg\r\n\r\n")
    body.append(jpeg)
    body.append(f"\r\n--{boundary}--\r\n".encode())
    payload = b"".join(body)
    url = f"{BASE.rstrip('/')}/farmer/daily-log"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        fail(f"POST /farmer/daily-log -> {e.code}: {detail}")


def main() -> None:
    print(f"\n=== Farmer smoke test: {BASE} ===\n")

    health = json_req("GET", "/health")
    if health.get("status") != "ok":
        fail(f"health: {health}")
    print("OK  health")

    login = json_req(
        "POST",
        "/auth/login",
        {"member_id": FARMER_EMAIL, "password": FARMER_PASSWORD},
    )
    if login.get("user", {}).get("role") != "farmer":
        fail(f"expected farmer role, got: {login.get('user')}")
    token = login["token"]
    print(f"OK  farmer login ({login['user'].get('member_id')})")

    dash = json_req("GET", "/farmer/dashboard", token=token)
    if "profile" not in dash:
        fail(f"dashboard missing profile: {dash}")
    print("OK  farmer dashboard")

    log = multipart_log(token, watered=True)
    if not log.get("success"):
        fail(f"daily log failed: {log}")
    print("OK  daily log upload")

    dash2 = json_req("GET", "/farmer/dashboard", token=token)
    if not dash2.get("today"):
        fail("today log not returned after upload")
    print("OK  today log present")

    member_login = json_req(
        "POST",
        "/auth/login",
        {"member_id": FARMER_EMAIL, "password": FARMER_PASSWORD},
    )
    if member_login.get("user", {}).get("role") != "farmer":
        fail("login role mismatch")
    print("OK  farmer role in login payload")

    print("\nAll farmer smoke tests passed.\n")


if __name__ == "__main__":
    main()
