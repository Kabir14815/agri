#!/usr/bin/env python3
"""Smoke test member daily crop log, signed auth, and dashboard sync."""
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


def _tiny_jpeg() -> bytes:
    try:
        import io

        from PIL import Image

        img = Image.new("RGB", (32, 32), color=(34, 120, 66))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
    except ImportError:
        import base64

        return base64.b64decode(
            "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEhIVFhUVFRUVFRUVFRUWFhUV"
            "FRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICUtLS0t"
            "LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQED"
            "EQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEB"
            "AQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCf"
            "AAH/2Q=="
        )


def multipart_log(token: str, watered: bool) -> dict:
    jpeg = _tiny_jpeg()
    boundary = "----DailyLogSmokeTest"
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
    url = f"{BASE.rstrip('/')}/user/daily-log"
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
        fail(f"POST /user/daily-log -> {e.code}: {detail}")


def main() -> None:
    admin_email, admin_password = require_admin_creds()
    print(f"\n=== Daily log smoke test: {BASE} ===\n")

    health = json_req("GET", "/health")
    if health.get("status") != "ok":
        fail(f"health: {health}")
    print("OK  health")

    reg = json_req(
        "POST",
        "/auth/register",
        {
            "full_name": f"Daily Log Member {TS}",
            "email": f"dailylog.{TS}@example.com",
            "phone": "9876512500",
            "password": PASSWORD,
            "role": "customer",
        },
    )
    member_mid = reg["user"]["member_id"]
    member_uid = reg["user"]["id"]

    admin = json_req(
        "POST",
        "/auth/login",
        {"member_id": admin_email, "password": admin_password},
    )
    json_req(
        "PATCH",
        f"/admin/users/{member_uid}/mlm",
        {"amount": INVEST},
        token=admin["token"],
    )

    login = json_req(
        "POST",
        "/auth/login",
        {"member_id": member_mid, "password": PASSWORD},
    )
    token = login.get("token")
    user = login.get("user") or {}
    if not token or not user.get("member_id"):
        fail(f"login failed: {login}")
    print("OK  signed session token")
    print(f"OK  member login ({user.get('member_id')})")

    dash = json_req("GET", "/user/dashboard", token=token)
    if not dash.get("computed_at"):
        print("WARN  dashboard missing computed_at")
    if "daily_log" not in dash:
        fail(f"dashboard missing daily_log: {list(dash.keys())}")
    print("OK  dashboard with daily_log section")

    log_status = json_req("GET", "/user/daily-log", token=token)
    if "compliance" not in log_status:
        fail(f"daily-log status missing compliance: {log_status}")
    print("OK  daily-log status endpoint")

    upload = multipart_log(token, watered=True)
    if not upload.get("success"):
        fail(f"daily log upload failed: {upload}")
    print("OK  daily log upload")

    dash2 = json_req("GET", "/user/dashboard", token=token)
    if not dash2.get("daily_log", {}).get("submitted_today"):
        fail("submitted_today not true after upload")
    print("OK  dashboard reflects submitted photo")

    incomes = json_req("GET", "/user/incomes", token=token)
    if "investment" not in incomes:
        fail(f"incomes missing investment block: {incomes}")
    print("OK  incomes endpoint")

    print("\nAll daily log smoke tests passed.\n")


if __name__ == "__main__":
    main()
