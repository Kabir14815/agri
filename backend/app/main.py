"""KGF Farming FastAPI backend."""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Header, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from .database import close_database, get_database
from .mlm import build_dashboard_payload, default_mlm_stats
from .profile_utils import enrich_user_defaults, user_profile_payload
from .referral import build_referral_tree, can_view_tree, member_id_from_user
from .store import MongoStore

# ----------------------------- Schemas -----------------------------------


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    subject: Optional[str] = Field(default=None, max_length=120)
    message: str = Field(..., min_length=5, max_length=2000)


class ReferralTrackIn(BaseModel):
    code: str = Field(..., min_length=3, max_length=20)
    path: Optional[str] = Field(default="", max_length=300)


class RegisterPayload(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=20)
    password: str = Field(..., min_length=6, max_length=80)
    role: str = Field(default="customer")
    address: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=60)
    state: Optional[str] = Field(default=None, max_length=60)
    pincode: Optional[str] = Field(default=None, max_length=10)
    country: Optional[str] = Field(default="India", max_length=60)
    sponsor_member_id: Optional[str] = Field(default=None, max_length=20)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    phone: Optional[str] = Field(default=None, min_length=6, max_length=20)
    address: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=60)
    state: Optional[str] = Field(default=None, max_length=60)
    pincode: Optional[str] = Field(default=None, max_length=10)
    country: Optional[str] = Field(default=None, max_length=60)
    gst_no: Optional[str] = Field(default=None, max_length=20)
    nominee_name: Optional[str] = Field(default=None, max_length=80)
    nominee_relation: Optional[str] = Field(default=None, max_length=40)


class BankUpdate(BaseModel):
    account_holder: str = Field(..., min_length=2, max_length=80)
    bank_name: str = Field(..., min_length=2, max_length=80)
    account_number: str = Field(..., min_length=6, max_length=24)
    ifsc: str = Field(..., min_length=8, max_length=16)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=6, max_length=80)
    new_password: str = Field(..., min_length=6, max_length=80)


class LoginPayload(BaseModel):
    member_id: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=80)


class UserAmountUpdate(BaseModel):
    amount: float = Field(..., ge=0)


class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0)
    payment_mode: str = Field(..., min_length=2, max_length=40)
    transaction_number: str = Field(..., min_length=3, max_length=80)
    note: Optional[str] = Field(default="", max_length=200)


DEPOSIT_PAYMENT_MODES = (
    "UPI",
    "Bank Transfer",
    "NEFT",
    "RTGS",
    "IMPS",
    "Cash",
    "Other",
)


class DepositStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected|cancelled)$")


class AdminUserMlmUpdate(BaseModel):
    sponsor_member_id: Optional[str] = Field(default=None, max_length=20)
    amount: Optional[float] = Field(default=None, ge=0)


class AdminUserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(customer|franchisee|farmer)$")


class AdminRecordDepositIn(BaseModel):
    amount: float = Field(..., gt=0)
    note: str = Field(default="", max_length=200)
    payment_mode: str = Field(default="Admin activation", max_length=60)


class HelpTicketIn(BaseModel):
    subject: str = Field(..., min_length=3, max_length=120)
    message: str = Field(..., min_length=10, max_length=2000)


class HelpTicketReply(BaseModel):
    admin_reply: str = Field(..., min_length=1, max_length=2000)
    status: str = Field(default="answered", pattern="^(answered|closed)$")


class ExchangeRequestIn(BaseModel):
    from_wallet: str = Field(..., pattern="^(income|repurchase|topup)$")
    to_wallet: str = Field(..., pattern="^(income|repurchase|topup)$")
    amount: float = Field(..., gt=0)


class WalletTransferIn(BaseModel):
    to_member_id: str = Field(..., min_length=3, max_length=24)
    amount: float = Field(..., ge=100)
    wallet: str = Field(default="income", pattern="^(income|repurchase|topup)$")


class ExchangeStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")


class ProductIn(BaseModel):
    name: str
    category: str
    price: float
    original_price: float
    discount: int = 0
    image: str = ""
    description: str = ""


class ServiceIn(BaseModel):
    number: str
    title: str
    subtitle: str
    description: str
    image: str = ""


class FaqIn(BaseModel):
    question: str
    answer: str


class TestimonialIn(BaseModel):
    name: str
    role: str
    message: str
    avatar: str = ""


class BlogIn(BaseModel):
    title: str
    excerpt: str
    image: str = ""
    date: str = ""
    author: str = "KGF Team"


class AchieverIn(BaseModel):
    name: str
    title: str
    location: str
    avatar: str = ""


def _cors_origins() -> List[str]:
    raw = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    from .farmer_logs import purge_old_images

    db = get_database()
    store = MongoStore(db)
    store.seed()
    try:
        purged = purge_old_images(store)
        if purged:
            print(f"[farm_logs] Purged images from {purged} old daily log(s)")
    except Exception as exc:
        print(f"[farm_logs] Cleanup skipped: {exc}")
    app.state.store = store
    yield
    close_database()


app = FastAPI(
    title="KGF Farming API",
    description="Backend API for the Kamauput Growth Farming Pvt Ltd. website clone.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------ Helpers ----------------------------------


def get_store() -> MongoStore:
    return app.state.store


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Item not found")


def _find(store: MongoStore, collection: str, item_id: int) -> dict:
    try:
        return store.find_by_id(collection, item_id)
    except KeyError:
        raise _not_found() from None


def _user_from_token(store: MongoStore, token: str) -> Optional[dict]:
    from .auth_tokens import parse_session_token

    uid = parse_session_token(token)
    if uid is None:
        return None
    return store.find_user_by_id(uid)


def _public_user(u: dict) -> dict:
    data = {k: v for k, v in u.items() if k != "password"}
    if "amount" not in data:
        data["amount"] = 0.0
    data["member_id"] = member_id_from_user(u)
    if u.get("sponsor_member_id"):
        data["sponsor_member_id"] = u["sponsor_member_id"]
    return data


def _farmer_profile(u: dict) -> dict:
    return {
        "id": u["id"],
        "full_name": u["full_name"],
        "email": u.get("email"),
        "phone": u.get("phone"),
        "member_id": member_id_from_user(u),
        "role": "farmer",
        "city": u.get("city"),
        "state": u.get("state"),
        "address": u.get("address"),
    }


def _user_dashboard_payload(u: dict, store: MongoStore) -> dict:
    user = store.prepare_dashboard_user(u["id"])
    return build_dashboard_payload(user, store=store)


def _login_user_payload(u: dict, store: MongoStore) -> dict:
    from .referral import member_id_from_user

    role = u.get("role", "customer")
    if role == "admin":
        return {
            "id": u["id"],
            "full_name": u["full_name"],
            "email": u["email"],
            "role": "admin",
        }
    if role == "farmer":
        return {
            "id": u["id"],
            "full_name": u["full_name"],
            "email": u.get("email"),
            "phone": u.get("phone"),
            "role": "farmer",
            "member_id": member_id_from_user(u),
        }
    return _user_dashboard_payload(u, store)


def _bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def require_user(
    authorization: Optional[str] = Header(default=None),
    store: MongoStore = Depends(get_store),
) -> dict:
    user = _user_from_token(store, _bearer_token(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if user.get("role") == "admin":
        raise HTTPException(
            status_code=403, detail="Use the admin panel for admin accounts"
        )
    return user


def require_farmer(
    authorization: Optional[str] = Header(default=None),
    store: MongoStore = Depends(get_store),
) -> dict:
    user = _user_from_token(store, _bearer_token(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if user.get("role") != "farmer":
        raise HTTPException(status_code=403, detail="Farmer access only")
    return user


def require_admin(
    authorization: Optional[str] = Header(default=None),
    store: MongoStore = Depends(get_store),
) -> dict:
    user = _user_from_token(store, _bearer_token(authorization))
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ------------------------------ Public API -------------------------------


@app.get("/api/health")
def health(store: MongoStore = Depends(get_store)):
    return {
        "status": "ok",
        "database": "mongodb",
        "users": store.count("users"),
    }


@app.get("/api/company")
def get_company(store: MongoStore = Depends(get_store)):
    return store.get_company()


@app.get("/api/products")
def list_products(category: Optional[str] = None, store: MongoStore = Depends(get_store)):
    return store.list_products(category)


@app.get("/api/products/{product_id}")
def get_product(product_id: int, store: MongoStore = Depends(get_store)):
    return _find(store, "products", product_id)


@app.get("/api/categories")
def list_categories(store: MongoStore = Depends(get_store)):
    return store.get_categories()


@app.get("/api/services")
def list_services(store: MongoStore = Depends(get_store)):
    return store.list_all("services")


@app.get("/api/faqs")
def list_faqs(store: MongoStore = Depends(get_store)):
    return store.list_all("faqs")


@app.get("/api/testimonials")
def list_testimonials(store: MongoStore = Depends(get_store)):
    return store.list_all("testimonials")


@app.get("/api/projects")
def list_projects(store: MongoStore = Depends(get_store)):
    return store.list_all("projects")


@app.get("/api/achievers")
def list_achievers(store: MongoStore = Depends(get_store)):
    return store.list_all("achievers")


@app.get("/api/blog")
def list_blog(store: MongoStore = Depends(get_store)):
    return store.list_all("blog")


@app.get("/api/blog/{post_id}")
def get_blog(post_id: int, store: MongoStore = Depends(get_store)):
    return _find(store, "blog", post_id)


@app.get("/api/referral/lookup")
def referral_lookup(code: str, store: MongoStore = Depends(get_store)):
    from .referral import normalize_member_id

    result = store.lookup_referral_code(normalize_member_id(code))
    if not result:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return result


@app.post("/api/referral/track-visit", status_code=status.HTTP_201_CREATED)
def referral_track_visit(
    payload: ReferralTrackIn, store: MongoStore = Depends(get_store)
):
    from .referral import normalize_member_id

    try:
        visit = store.track_referral_visit(
            normalize_member_id(payload.code), payload.path or ""
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Invalid referral code") from None
    return {"success": True, "visit": visit}


@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(payload: ContactMessage, store: MongoStore = Depends(get_store)):
    record = store.create_contact(payload.model_dump())
    return {
        "success": True,
        "message": "Thanks! We'll get in touch with you soon.",
        "id": record["id"],
    }


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, store: MongoStore = Depends(get_store)):
    email = str(payload.email).strip().lower()
    if store.find_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email already registered")
    data = payload.model_dump()
    data["email"] = email
    if data.get("role") not in ("customer", "franchisee"):
        data["role"] = "customer"
    if data.get("sponsor_member_id"):
        from .referral import normalize_member_id

        data["sponsor_member_id"] = normalize_member_id(data["sponsor_member_id"])
    try:
        user = store.create_user(data)
    except ValueError as exc:
        code = str(exc)
        if code == "invalid_sponsor":
            raise HTTPException(
                status_code=400,
                detail="Invalid sponsor member ID. Check the referral link.",
            ) from exc
        raise HTTPException(status_code=400, detail="Registration failed") from exc
    return {
        "success": True,
        "message": "Registration successful",
        "user": _public_user(user),
    }


@app.post("/api/auth/login")
def login(
    payload: LoginPayload, store: MongoStore = Depends(get_store)
):
    from .referral import normalize_member_id

    login_id = payload.member_id.strip()
    if "@" in login_id:
        u = store.find_user_by_email(login_id.lower())
    else:
        u = store.find_user_by_member_id(normalize_member_id(login_id))
    if u and store.verify_user_password(u, payload.password):
        store.upgrade_password_hash(u["id"], payload.password)
        from .auth_tokens import create_session_token

        return {
            "success": True,
            "token": create_session_token(u["id"]),
            "user": _login_user_payload(u, store),
        }
    raise HTTPException(status_code=401, detail="Invalid member ID or password")


async def _read_upload_bytes(upload: Optional[UploadFile]) -> bytes:
    if not upload or not upload.filename:
        raise HTTPException(status_code=400, detail="Photo is required")
    raw = await upload.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Photo file is empty")
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 12MB)")
    return raw


@app.get("/api/farmer/dashboard")
def farmer_dashboard(
    farmer: dict = Depends(require_farmer),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import log_public, today_utc

    today = today_utc()
    today_log = store.get_farm_log_for_date(farmer["id"], today)
    history = store.list_farm_logs_for_user(farmer["id"], limit=30)
    return {
        "profile": _farmer_profile(farmer),
        "today": log_public(today_log, include_image=True) if today_log else None,
        "history": [log_public(h) for h in history],
        "log_date": today,
    }


@app.post("/api/farmer/daily-log", status_code=status.HTTP_201_CREATED)
async def farmer_submit_daily_log(
    watered: bool = Form(...),
    note: str = Form(default=""),
    photo: Optional[UploadFile] = File(default=None),
    farmer: dict = Depends(require_farmer),
    store: MongoStore = Depends(get_store),
):
    from .image_compress import compress_image_bytes
    from .farmer_logs import log_public, today_utc

    b64 = mime = None
    size = None
    if photo and photo.filename:
        raw = await _read_upload_bytes(photo)
        try:
            b64, mime, size = compress_image_bytes(raw)
        except ValueError as exc:
            if str(exc) == "invalid_image":
                raise HTTPException(status_code=400, detail="Invalid image file") from exc
            raise HTTPException(status_code=400, detail="Could not process image") from exc
    elif not store.get_farm_log_for_date(farmer["id"], today_utc()):
        raise HTTPException(status_code=400, detail="Photo is required for your first log today")

    try:
        record = store.upsert_farm_daily_log(
            farmer,
            watered=watered,
            image_b64=b64,
            image_mime=mime,
            image_size=size,
            note=note,
        )
    except ValueError as exc:
        if str(exc) == "photo_required":
            raise HTTPException(status_code=400, detail="Photo is required") from exc
        raise HTTPException(status_code=500, detail="Unexpected error saving log") from exc
    return {
        "success": True,
        "log": log_public(record, include_image=True),
        "message": "Daily farm log saved.",
    }


@app.get("/api/farmer/daily-log/{log_id}/image")
def farmer_log_image(
    log_id: int,
    farmer: dict = Depends(require_farmer),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import log_public

    record = store.get_farm_log_by_id(log_id)
    if not record or record["user_id"] != farmer["id"]:
        raise _not_found()
    if not record.get("image_data"):
        raise HTTPException(status_code=410, detail="Image removed after retention period")
    return log_public(record, include_image=True)


async def _submit_daily_log_for_user(
    user: dict,
    store: MongoStore,
    watered: bool,
    note: str,
    photo: Optional[UploadFile],
) -> dict:
    from .image_compress import compress_image_bytes
    from .farmer_logs import log_public, today_utc

    b64 = mime = None
    size = None
    if photo and photo.filename:
        raw = await _read_upload_bytes(photo)
        try:
            b64, mime, size = compress_image_bytes(raw)
        except ValueError as exc:
            if str(exc) == "invalid_image":
                raise HTTPException(status_code=400, detail="Invalid image file") from exc
            raise HTTPException(status_code=400, detail="Could not process image") from exc
    elif not store.get_farm_log_for_date(user["id"], today_utc()):
        raise HTTPException(status_code=400, detail="Photo is required for your first log today")

    try:
        record = store.upsert_farm_daily_log(
            user,
            watered=watered,
            image_b64=b64,
            image_mime=mime,
            image_size=size,
            note=note,
        )
    except ValueError as exc:
        if str(exc) == "photo_required":
            raise HTTPException(status_code=400, detail="Photo is required") from exc
        raise HTTPException(status_code=500, detail="Unexpected error saving log") from exc
    return {
        "success": True,
        "log": log_public(record, include_image=True),
        "message": "Daily crop log saved.",
    }


@app.get("/api/user/daily-log")
def user_daily_log_status(
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import log_public, today_utc

    refreshed = store.prepare_dashboard_user(user["id"])
    today = today_utc()
    today_log = store.get_farm_log_for_date(refreshed["id"], today)
    history = store.list_farm_logs_for_user(refreshed["id"], limit=30)
    penalties = store.list_interest_penalties_for_user(refreshed["id"], limit=30)
    dash = build_dashboard_payload(refreshed, store=store)
    return {
        "log_date": today,
        "today": log_public(today_log, include_image=True) if today_log else None,
        "history": [log_public(h) for h in history],
        "penalties": penalties,
        "compliance": dash.get("daily_log", {}),
    }


@app.post("/api/user/daily-log", status_code=status.HTTP_201_CREATED)
async def user_submit_daily_log(
    watered: bool = Form(...),
    note: str = Form(default=""),
    photo: Optional[UploadFile] = File(default=None),
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    return await _submit_daily_log_for_user(user, store, watered, note, photo)


@app.get("/api/user/daily-log/{log_id}/image")
def user_daily_log_image(
    log_id: int,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import log_public

    record = store.get_farm_log_by_id(log_id)
    if not record or record["user_id"] != user["id"]:
        raise _not_found()
    if not record.get("image_data"):
        raise HTTPException(status_code=410, detail="Image removed after retention period")
    return log_public(record, include_image=True)


@app.get("/api/admin/farmer-logs")
def admin_farmer_logs(
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import log_public

    rows = []
    for rec in store.list_all_farm_logs(limit=300):
        include = bool(rec.get("image_data"))
        rows.append(log_public(rec, include_image=include))
    return {"logs": rows}


@app.post("/api/admin/farmer-logs/purge-images")
def admin_purge_farmer_images(
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    from .farmer_logs import purge_old_images

    count = purge_old_images(store)
    return {"success": True, "purged": count}


@app.get("/api/admin/interest-penalties")
def admin_interest_penalties(
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    return {"penalties": store.list_all_interest_penalties(limit=300)}


@app.get("/api/user/dashboard")
def user_dashboard(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    return _user_dashboard_payload(user, store)


@app.post("/api/user/notifications/{notification_id}/dismiss")
def user_dismiss_notification(
    notification_id: int,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    try:
        note = store.dismiss_user_notification(user["id"], notification_id)
    except KeyError:
        raise _not_found() from None
    return {"success": True, "notification": note}


def _profile_for_user(user: dict, store: MongoStore) -> dict:
    merged = enrich_user_defaults(dict(user))
    profile = user_profile_payload(merged)
    dash = build_dashboard_payload(merged, store=store)
    profile["member_id"] = dash["member_id"]
    profile["rank"] = dash["rank"]
    return profile


@app.get("/api/user/profile")
def user_profile(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    return _profile_for_user(user, store)


@app.patch("/api/user/profile")
def user_profile_update(
    payload: ProfileUpdate,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        updated = store.update_user(user["id"], data)
    except KeyError:
        raise _not_found() from None
    return {"success": True, "profile": _profile_for_user(updated, store)}


@app.patch("/api/user/bank")
def user_bank_update(
    payload: BankUpdate,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    try:
        updated = store.update_user(user["id"], {"bank": payload.model_dump()})
    except KeyError:
        raise _not_found() from None
    return {"success": True, "profile": _profile_for_user(updated, store)}


@app.patch("/api/user/password")
def user_password_change(
    payload: PasswordChange,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    if not store.verify_user_password(user, payload.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    try:
        store.update_user(user["id"], {"password": payload.new_password})
    except KeyError:
        raise _not_found() from None
    return {"success": True, "message": "Password updated successfully"}


@app.post("/api/user/pan-card")
async def user_upload_pan(
    pan_number: str = Form(...),
    image: Optional[UploadFile] = File(None),
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    from .image_compress import compress_image_bytes, image_data_url

    pan = pan_number.strip().upper()
    if not pan:
        raise HTTPException(status_code=400, detail="PAN number is required")

    update: dict = {
        "pan_card.pan_number": pan,
        "pan_card.status": "pending",
        "pan_card.uploaded_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    }

    if image and image.filename:
        raw = await image.read()
        if raw:
            if len(raw) > 5_000_000:
                raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
            try:
                b64, mime, _ = compress_image_bytes(raw, max_edge=1600, quality=80)
                update["pan_card.image_data"] = image_data_url(mime, b64)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        updated = store.update_user_dot_notation(user["id"], update)
    except KeyError:
        raise _not_found() from None
    return {"success": True, "profile": _profile_for_user(updated, store)}


@app.get("/api/user/pan-card/image")
def user_pan_image(
    user: dict = Depends(require_user),
):
    pan = (user.get("pan_card") or {})
    data = pan.get("image_data")
    if not data:
        raise HTTPException(status_code=404, detail="No PAN image uploaded")
    return {"data_url": data}


@app.get("/api/user/referral-tree")
def user_referral_tree(
    member_id: Optional[str] = None,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    target = (member_id or "").strip().upper() or None
    if target and not can_view_tree(user, target, store):
        raise HTTPException(status_code=403, detail="You cannot view this member's tree")
    user = store.prepare_dashboard_user(user["id"])
    try:
        tree = build_referral_tree(store, user, target)
    except ValueError:
        raise HTTPException(status_code=404, detail="Member not found") from None
    tree["viewer_member_id"] = member_id_from_user(user)
    return tree


@app.get("/api/user/deposits")
def user_deposits(user: dict = Depends(require_user), store: MongoStore = Depends(get_store)):
    store.prepare_dashboard_user(user["id"])
    return {"deposits": store.list_deposits_for_user(user["id"])}


async def _read_receipt_upload(receipt: Optional[UploadFile]) -> tuple[Optional[str], Optional[str]]:
    if not receipt or not receipt.filename:
        return None, None
    raw = await receipt.read()
    if not raw:
        return None, None
    if len(raw) > 2_500_000:
        raise HTTPException(status_code=400, detail="Receipt file too large (max 2.5MB)")
    import base64

    mime = receipt.content_type or "application/octet-stream"
    encoded = base64.b64encode(raw).decode("ascii")
    return receipt.filename, f"data:{mime};base64,{encoded}"


@app.get("/api/user/deposit-modes")
def user_deposit_modes():
    from .referral_config import MIN_INVESTMENT

    return {
        "modes": list(DEPOSIT_PAYMENT_MODES),
        "min_investment": MIN_INVESTMENT,
        "min_investment_label": "₹2,50,000",
    }


@app.post("/api/user/deposits", status_code=status.HTTP_201_CREATED)
async def user_create_deposit(
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
    payment_mode: str = Form(...),
    amount: float = Form(...),
    transaction_number: str = Form(...),
    receipt: Optional[UploadFile] = File(None),
):
    mode = payment_mode.strip()
    if mode not in DEPOSIT_PAYMENT_MODES:
        raise HTTPException(status_code=400, detail="Invalid payment mode")
    txn = transaction_number.strip()
    if not txn:
        raise HTTPException(status_code=400, detail="Transaction number is required")
    if float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    try:
        from .referral_bonus import validate_first_deposit_amount

        validate_first_deposit_amount(user, float(amount))
    except ValueError as exc:
        if str(exc) == "min_investment":
            raise HTTPException(
                status_code=400,
                detail="Minimum investment is ₹2,50,000 for your first package",
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    filename, data = await _read_receipt_upload(receipt)
    try:
        dep = store.create_deposit_request(
            user["id"],
            float(amount),
            payment_mode=mode,
            transaction_number=txn,
            note=txn,
            receipt_filename=filename,
            receipt_data=data,
        )
    except ValueError as exc:
        if str(exc) == "min_investment":
            raise HTTPException(
                status_code=400,
                detail="Minimum investment is ₹2,50,000 for your first package",
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"success": True, "deposit": dep}


@app.post("/api/user/deposits/json", status_code=status.HTTP_201_CREATED)
def user_create_deposit_json(
    payload: DepositRequest,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    if payload.payment_mode not in DEPOSIT_PAYMENT_MODES:
        raise HTTPException(status_code=400, detail="Invalid payment mode")
    try:
        from .referral_bonus import validate_first_deposit_amount

        validate_first_deposit_amount(user, float(payload.amount))
    except ValueError as exc:
        if str(exc) == "min_investment":
            raise HTTPException(
                status_code=400,
                detail="Minimum investment is ₹2,50,000 for your first package",
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        dep = store.create_deposit_request(
            user["id"],
            payload.amount,
            payment_mode=payload.payment_mode,
            transaction_number=payload.transaction_number.strip(),
            note=payload.note or payload.transaction_number,
        )
    except ValueError as exc:
        if str(exc) == "min_investment":
            raise HTTPException(
                status_code=400,
                detail="Minimum investment is ₹2,50,000 for your first package",
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"success": True, "deposit": dep}


@app.get("/api/user/wallet")
def user_wallet(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    user = store.prepare_dashboard_user(user["id"])
    dash = build_dashboard_payload(user, store=store)
    return {
        "income_wallet": dash["income_wallet"],
        "repurchase_wallet": dash["repurchase_wallet"],
        "topup_wallet": dash["topup_wallet"],
        "amount": dash["amount"],
        "income_wallet_progress": dash["income_wallet_progress"],
        "today_incomes": dash["today_incomes"],
        "incomes": dash["incomes"],
    }


@app.get("/api/user/wallet/statement")
def user_wallet_statement(
    wallet: Optional[str] = None,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    store.prepare_dashboard_user(user["id"])
    entries = store.list_wallet_ledger(user["id"], wallet)
    return {"entries": entries}


@app.get("/api/user/wallet/transfer")
def user_wallet_transfer_info(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    user = store.prepare_dashboard_user(user["id"])
    wallets = store._user_mlm_wallets(user)
    return {
        "available_fund": wallets["income"],
        "min_amount": store.MIN_WALLET_TRANSFER,
        "wallet": "income",
        "transfers": store.list_wallet_transfers_for_user(user["id"]),
    }


@app.get("/api/user/wallet/transfer/lookup")
def user_wallet_transfer_lookup(
    member_id: str,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    from .referral import normalize_member_id

    mid = normalize_member_id(member_id)
    if not mid:
        raise HTTPException(status_code=400, detail="Enter a valid member ID")
    lookup = store.lookup_member_for_transfer(mid)
    if not lookup:
        raise HTTPException(status_code=404, detail="Member ID not found")
    if lookup["user_id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot transfer to yourself")
    return lookup


@app.post("/api/user/wallet/transfer", status_code=201)
def user_wallet_transfer(
    payload: WalletTransferIn,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    try:
        transfer = store.transfer_wallet_funds(
            user["id"],
            payload.to_member_id,
            payload.amount,
            wallet=payload.wallet,
        )
    except ValueError as exc:
        code = str(exc)
        messages = {
            "min_amount": f"Minimum transfer amount is ₹{store.MIN_WALLET_TRANSFER:.0f}",
            "invalid_wallet": "Invalid wallet type",
            "recipient_not_found": "Recipient member ID not found",
            "cannot_transfer_self": "You cannot transfer to yourself",
            "insufficient_balance": "Insufficient available fund",
        }
        raise HTTPException(
            status_code=400, detail=messages.get(code, "Transfer failed")
        ) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="User not found") from exc
    refreshed = store.prepare_dashboard_user(user["id"])
    wallets = store._user_mlm_wallets(refreshed)
    return {
        "success": True,
        "transfer": transfer,
        "available_fund": wallets["income"],
    }


@app.get("/api/user/activate")
def user_activate_status(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    user = store.prepare_dashboard_user(user["id"])
    dash = build_dashboard_payload(user, store=store)
    active = float(dash.get("package_amount", 0) or 0) > 0
    return {
        "active": active,
        "package_amount": dash["package_amount"],
        "rank": dash["rank"],
        "member_id": dash["member_id"],
    }


@app.get("/api/user/incomes")
def user_incomes(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    user = store.prepare_dashboard_user(user["id"])
    dash = build_dashboard_payload(user, store=store)
    return {
        "incomes": dash["incomes"],
        "today_incomes": dash["today_incomes"],
        "total_earning": dash["total_earning"],
        "quarterly_earnings": dash["quarterly_earnings"],
        "earning_limits": dash["earning_limits"],
        "investment": dash.get("investment"),
        "daily_log": dash.get("daily_log"),
    }


@app.get("/api/user/transactions")
def user_transactions(user: dict = Depends(require_user), store: MongoStore = Depends(get_store)):
    store.prepare_dashboard_user(user["id"])
    return {"transactions": store.list_user_transactions(user["id"])}


@app.get("/api/user/exchange")
def user_list_exchange(user: dict = Depends(require_user), store: MongoStore = Depends(get_store)):
    refreshed = store.prepare_dashboard_user(user["id"])
    wallets = store._user_mlm_wallets(refreshed)
    return {
        "wallets": {
            "income": wallets["income"],
            "repurchase": wallets["repurchase"],
            "topup": wallets["topup"],
        },
        "requests": store.list_exchanges_for_user(user["id"]),
    }


@app.post("/api/user/exchange", status_code=201)
def user_create_exchange(
    payload: ExchangeRequestIn,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    if payload.from_wallet == payload.to_wallet:
        raise HTTPException(status_code=400, detail="Source and destination must differ")
    wallets = store._user_mlm_wallets(user)
    if wallets[payload.from_wallet] < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance in source wallet")
    ex = store.create_exchange_request(
        user["id"], payload.from_wallet, payload.to_wallet, payload.amount
    )
    return {"success": True, "exchange": ex}


@app.get("/api/user/help-desk")
def user_help_desk(user: dict = Depends(require_user), store: MongoStore = Depends(get_store)):
    return {
        "tickets": store.list_help_tickets_for_user(user["id"]),
        "faqs": store.list_all("faqs"),
    }


@app.post("/api/user/help-desk", status_code=201)
def user_create_help_ticket(
    payload: HelpTicketIn,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    ticket = store.create_help_ticket(user["id"], payload.subject, payload.message)
    return {"success": True, "ticket": ticket}


@app.get("/api/user/referral-info")
def user_referral_info(
    user: dict = Depends(require_user), store: MongoStore = Depends(get_store)
):
    user = store.prepare_dashboard_user(user["id"]) or user
    dash = build_dashboard_payload(user, store=store)
    return {
        "member_id": dash["member_id"],
        "referral_link": dash["referral_link"],
        "full_name": user["full_name"],
    }


# ------------------------------ Admin API --------------------------------


@app.get("/api/admin/me")
def admin_me(admin: dict = Depends(require_admin)):
    return {
        "id": admin["id"],
        "full_name": admin["full_name"],
        "email": admin["email"],
        "role": admin["role"],
    }


@app.get("/api/admin/stats")
def admin_stats(admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)):
    """Fetch all admin counts in parallel using a single $facet aggregation per collection."""
    # Simple counts from content collections (one query each via estimated count).
    content = {
        "products": store.db.products.estimated_document_count(),
        "services": store.db.services.estimated_document_count(),
        "blog_posts": store.db.blog.estimated_document_count(),
        "achievers": store.db.achievers.estimated_document_count(),
        "testimonials": store.db.testimonials.estimated_document_count(),
        "faqs": store.db.faqs.estimated_document_count(),
        "users": store.db.users.estimated_document_count(),
        "contacts": store.db.contacts.estimated_document_count(),
        "wallet_transfers": store.db.wallet_transfers.estimated_document_count(),
        "referral_visits": store.db.referral_visits.estimated_document_count(),
    }
    # Batch status-specific counts with $facet — one round trip for deposits & tickets.
    dep_pipeline = [{"$facet": {
        "all": [{"$count": "n"}],
        "pending": [{"$match": {"status": "pending"}}, {"$count": "n"}],
    }}]
    dep_result = list(store.db.deposits.aggregate(dep_pipeline))
    dep = dep_result[0] if dep_result else {}

    exc_pipeline = [{"$facet": {
        "all": [{"$count": "n"}],
        "pending": [{"$match": {"status": "pending"}}, {"$count": "n"}],
    }}]
    exc_result = list(store.db.exchange_requests.aggregate(exc_pipeline))
    exc = exc_result[0] if exc_result else {}

    hlp_pipeline = [{"$facet": {
        "all": [{"$count": "n"}],
        "open": [{"$match": {"status": "open"}}, {"$count": "n"}],
    }}]
    hlp_result = list(store.db.help_tickets.aggregate(hlp_pipeline))
    hlp = hlp_result[0] if hlp_result else {}

    return {
        **content,
        "deposits": (dep.get("all") or [{}])[0].get("n", 0),
        "deposits_pending": (dep.get("pending") or [{}])[0].get("n", 0),
        "exchange_requests": (exc.get("all") or [{}])[0].get("n", 0),
        "exchange_pending": (exc.get("pending") or [{}])[0].get("n", 0),
        "help_tickets": (hlp.get("all") or [{}])[0].get("n", 0),
        "help_tickets_open": (hlp.get("open") or [{}])[0].get("n", 0),
    }


@app.get("/api/admin/contacts")
def admin_contacts(admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)):
    return store.list_contacts()


@app.delete("/api/admin/contacts/{item_id}")
def admin_delete_contact(
    item_id: int, admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    try:
        store.delete_contact(item_id)
    except KeyError:
        raise _not_found() from None
    return {"success": True}


@app.get("/api/admin/users")
def admin_users(admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)):
    return store.list_users_public()


@app.get("/api/admin/users/{user_id}")
def admin_user_detail(
    user_id: int, admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    u = store.find_user_by_id(user_id)
    if not u:
        raise _not_found()
    return _public_user(u)


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(
    user_id: int, admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You can't delete your own account")
    try:
        store.delete_user(user_id)
    except KeyError:
        raise _not_found() from None
    return {"success": True}


@app.patch("/api/admin/users/{user_id}/amount")
def admin_update_user_amount(
    user_id: int,
    payload: UserAmountUpdate,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    u = store.find_user_by_id(user_id)
    if not u:
        raise _not_found()
    if u.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot change admin wallet amount")
    try:
        updated = store.update_user_amount(user_id, payload.amount)
    except KeyError:
        raise _not_found() from None
    return _public_user(updated)


@app.patch("/api/admin/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    try:
        updated = store.admin_set_user_role(user_id, payload.role)
    except KeyError:
        raise _not_found() from None
    except ValueError as exc:
        if str(exc) == "cannot_change_admin":
            raise HTTPException(status_code=400, detail="Cannot change admin role") from exc
        raise HTTPException(status_code=400, detail="Invalid role") from exc
    return _public_user(updated)


@app.get("/api/admin/deposits")
def admin_list_deposits(admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)):
    items = store.list_all_deposits()
    # Build user lookup in one query instead of N queries.
    user_ids = list({d["user_id"] for d in items})
    user_map = {}
    if user_ids:
        for u in store._serialize_many(store.db.users.find({"id": {"$in": user_ids}})):
            user_map[u["id"]] = u
    out = []
    for d in items:
        u = user_map.get(d["user_id"])
        out.append(
            {
                **d,
                "user_name": u.get("full_name") if u else "Unknown",
                "user_email": u.get("email") if u else "",
            }
        )
    return {"deposits": out}


@app.post("/api/admin/users/{user_id}/record-deposit", status_code=201)
def admin_record_deposit(
    user_id: int,
    payload: AdminRecordDepositIn,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    if not store.find_user_by_id(user_id):
        raise _not_found()
    dep = store.record_admin_deposit(
        user_id,
        payload.amount,
        note=payload.note,
        payment_mode=payload.payment_mode,
    )
    u = store.find_user_by_id(user_id)
    return {
        "success": True,
        "deposit": {
            **dep,
            "user_name": u.get("full_name") if u else "Unknown",
            "user_email": u.get("email") if u else "",
        },
    }


@app.get("/api/admin/deposits/{deposit_id}/receipt")
def admin_deposit_receipt(
    deposit_id: int,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    dep = store.find_deposit(deposit_id)
    if not dep:
        raise _not_found()
    if not dep.get("receipt_data"):
        raise HTTPException(status_code=404, detail="No receipt uploaded")
    return {
        "filename": dep.get("receipt_filename") or "receipt",
        "data_url": dep["receipt_data"],
    }


@app.patch("/api/admin/deposits/{deposit_id}")
def admin_update_deposit(
    deposit_id: int,
    payload: DepositStatusUpdate,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    try:
        if payload.status == "approved":
            dep = store.approve_deposit(deposit_id)
        else:
            dep = store.set_deposit_status(deposit_id, payload.status)
    except KeyError:
        raise _not_found() from None
    return {"success": True, "deposit": dep}


@app.get("/api/admin/users/{user_id}/dashboard")
def admin_user_dashboard(
    user_id: int,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    """Return full dashboard payload for a user — wallets, interest, daily log status."""
    u = store.find_user_by_id(user_id)
    if not u:
        raise _not_found()
    try:
        refreshed = store.prepare_dashboard_user(user_id)
    except Exception:
        refreshed = u
    dash = build_dashboard_payload(refreshed, store=store)
    # Include recent daily logs (last 7) with image status
    from .farmer_logs import log_public, today_utc
    today = today_utc()
    today_log = store.get_farm_log_for_date(user_id, today)
    history = store.list_farm_logs_for_user(user_id, limit=7)
    deposits = store.list_deposits_for_user(user_id)
    dash["recent_logs"] = [log_public(h) for h in history]
    dash["today_log"] = log_public(today_log, include_image=True) if today_log else None
    dash["deposits"] = deposits
    return dash


@app.get("/api/admin/users/{user_id}/referrals")
def admin_user_referrals(
    user_id: int,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    try:
        return store.get_user_referral_summary(user_id)
    except KeyError:
        raise _not_found() from None


@app.get("/api/admin/users/{user_id}/referral-tree")
def admin_user_referral_tree(
    user_id: int,
    member_id: Optional[str] = None,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    u = store.find_user_by_id(user_id)
    if not u:
        raise _not_found()
    from .referral import build_referral_tree

    target = member_id or member_id_from_user(u)
    try:
        return build_referral_tree(store, u, target)
    except ValueError:
        raise _not_found() from None


@app.patch("/api/admin/users/{user_id}/mlm")
def admin_update_user_mlm(
    user_id: int,
    payload: AdminUserMlmUpdate,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    if not store.find_user_by_id(user_id):
        raise _not_found()
    try:
        updated = store.update_user_mlm(
            user_id,
            sponsor_member_id=payload.sponsor_member_id,
            amount=payload.amount,
        )
    except KeyError:
        raise _not_found() from None
    except ValueError as exc:
        code = str(exc)
        if code == "invalid_sponsor":
            raise HTTPException(status_code=400, detail="Invalid sponsor member ID") from exc
        if code == "cannot_sponsor_self":
            raise HTTPException(status_code=400, detail="Member cannot sponsor themselves") from exc
        if code == "min_investment":
            raise HTTPException(
                status_code=400,
                detail="Minimum investment package is ₹2,50,000",
            ) from exc
        raise HTTPException(status_code=400, detail="No fields to update") from exc
    return _public_user(updated)


@app.get("/api/admin/referrals")
def admin_referrals_overview(
    admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    users = store.list_users_public()
    rows = []
    for u in users:
        if u.get("role") == "admin":
            continue
        mid = u.get("member_id")
        rows.append(
            {
                "user_id": u["id"],
                "member_id": mid,
                "full_name": u.get("full_name"),
                "email": u.get("email"),
                "sponsor_member_id": u.get("sponsor_member_id"),
                "sponsor_name": u.get("sponsor_name"),
                "direct_referral_count": u.get("direct_referral_count", 0),
                "link_visits": store.count_referral_visits(mid) if mid else 0,
                "referral_link": f"/ref/{mid}" if mid else "",
                "amount": u.get("amount", 0),
                "registered_at": u.get("registered_at"),
            }
        )
    return rows


@app.get("/api/admin/referral-visits")
def admin_referral_visits(
    admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    return store.list_referral_visits()


@app.get("/api/admin/help-desk")
def admin_list_help_tickets(
    admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    items = store.list_all_help_tickets()
    out = []
    for t in items:
        u = store.find_user_by_id(t["user_id"])
        out.append(
            {
                **t,
                "user_name": u.get("full_name") if u else "Unknown",
                "user_email": u.get("email") if u else "",
            }
        )
    return out


@app.patch("/api/admin/help-desk/{ticket_id}")
def admin_reply_help_ticket(
    ticket_id: int,
    payload: HelpTicketReply,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    try:
        ticket = store.reply_help_ticket(ticket_id, payload.admin_reply, payload.status)
    except KeyError:
        raise _not_found() from None
    return {"success": True, "ticket": ticket}


@app.get("/api/admin/exchange")
def admin_list_exchanges(
    admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    items = store.list_all_exchanges()
    out = []
    for ex in items:
        u = store.find_user_by_id(ex["user_id"])
        out.append(
            {
                **ex,
                "user_name": u.get("full_name") if u else "Unknown",
                "user_email": u.get("email") if u else "",
            }
        )
    return out


@app.patch("/api/admin/exchange/{exchange_id}")
def admin_update_exchange(
    exchange_id: int,
    payload: ExchangeStatusUpdate,
    admin: dict = Depends(require_admin),
    store: MongoStore = Depends(get_store),
):
    try:
        if payload.status == "approved":
            ex = store.approve_exchange(exchange_id)
        else:
            ex = store.set_exchange_status(exchange_id, "rejected")
    except KeyError:
        raise _not_found() from None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"success": True, "exchange": ex}


@app.get("/api/admin/wallet-transfers")
def admin_list_wallet_transfers(
    admin: dict = Depends(require_admin), store: MongoStore = Depends(get_store)
):
    return store.list_all_wallet_transfers()


# ---------- Generic CRUD endpoints ----------


def _crud_endpoints(prefix: str, schema: type[BaseModel]) -> None:
    @app.post(f"/api/admin/{prefix}", status_code=201)
    def _create(
        payload: schema,
        admin: dict = Depends(require_admin),
        store: MongoStore = Depends(get_store),
    ):
        return store.create_item(prefix, payload.model_dump())

    @app.put(f"/api/admin/{prefix}/{{item_id}}")
    def _update(
        item_id: int,
        payload: schema,
        admin: dict = Depends(require_admin),
        store: MongoStore = Depends(get_store),
    ):
        try:
            return store.update_item(prefix, item_id, payload.model_dump())
        except KeyError:
            raise _not_found() from None

    @app.delete(f"/api/admin/{prefix}/{{item_id}}")
    def _delete_(
        item_id: int,
        admin: dict = Depends(require_admin),
        store: MongoStore = Depends(get_store),
    ):
        try:
            store.delete_item(prefix, item_id)
        except KeyError:
            raise _not_found() from None
        return {"success": True}

    _create.__name__ = f"admin_create_{prefix}"
    _update.__name__ = f"admin_update_{prefix}"
    _delete_.__name__ = f"admin_delete_{prefix}"


_crud_endpoints("products", ProductIn)
_crud_endpoints("services", ServiceIn)
_crud_endpoints("faqs", FaqIn)
_crud_endpoints("testimonials", TestimonialIn)
_crud_endpoints("blog", BlogIn)
_crud_endpoints("achievers", AchieverIn)
