"""KGF Farming FastAPI backend."""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from .database import close_database, get_database
from .mlm import build_dashboard_payload, default_mlm_stats
from .profile_utils import DEMO_PROFILE_OVERRIDES, user_profile_payload
from .referral import build_referral_tree, can_view_tree, member_id_from_user
from .store import MongoStore

# ----------------------------- Schemas -----------------------------------


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    subject: Optional[str] = Field(default=None, max_length=120)
    message: str = Field(..., min_length=5, max_length=2000)


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
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=80)


class UserAmountUpdate(BaseModel):
    amount: float = Field(..., ge=0)


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
    db = get_database()
    store = MongoStore(db)
    store.seed()
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
    if not token or not token.startswith("demo-token-"):
        return None
    try:
        uid = int(token.rsplit("-", 1)[1])
    except (ValueError, IndexError):
        return None
    return store.find_user_by_id(uid)


def _public_user(u: dict) -> dict:
    data = {k: v for k, v in u.items() if k != "password"}
    if "amount" not in data:
        data["amount"] = 0.0
    return data


def _user_dashboard_payload(u: dict) -> dict:
    return build_dashboard_payload(u)


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
    if store.find_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = store.create_user(payload.model_dump())
    return {
        "success": True,
        "message": "Registration successful",
        "user": _public_user(user),
    }


@app.post("/api/auth/login")
def login(payload: LoginPayload, store: MongoStore = Depends(get_store)):
    u = store.find_user_by_email(payload.email)
    if u and u.get("password") == payload.password:
        return {
            "success": True,
            "token": f"demo-token-{u['id']}",
            "user": _user_dashboard_payload(u),
        }
    raise HTTPException(status_code=401, detail="Invalid email or password")


@app.get("/api/user/dashboard")
def user_dashboard(user: dict = Depends(require_user)):
    return _user_dashboard_payload(user)


def _profile_for_user(user: dict) -> dict:
    merged = dict(user)
    overrides = DEMO_PROFILE_OVERRIDES.get(user.get("email", ""))
    if overrides:
        for key, val in overrides.items():
            if key == "bank":
                merged["bank"] = {**(merged.get("bank") or {}), **val}
            else:
                merged[key] = val
    profile = user_profile_payload(merged)
    dash = build_dashboard_payload(merged)
    profile["member_id"] = dash["member_id"]
    profile["rank"] = dash["rank"]
    return profile


@app.get("/api/user/profile")
def user_profile(user: dict = Depends(require_user)):
    return _profile_for_user(user)


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
    return {"success": True, "profile": _profile_for_user(updated)}


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
    return {"success": True, "profile": _profile_for_user(updated)}


@app.patch("/api/user/password")
def user_password_change(
    payload: PasswordChange,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    if user.get("password") != payload.current_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    try:
        store.update_user(user["id"], {"password": payload.new_password})
    except KeyError:
        raise _not_found() from None
    return {"success": True, "message": "Password updated successfully"}


@app.get("/api/user/referral-tree")
def user_referral_tree(
    member_id: Optional[str] = None,
    user: dict = Depends(require_user),
    store: MongoStore = Depends(get_store),
):
    target = (member_id or "").strip().upper() or None
    if target and not can_view_tree(user, target, store):
        raise HTTPException(status_code=403, detail="You cannot view this member's tree")
    tree = build_referral_tree(store, user, target)
    tree["viewer_member_id"] = member_id_from_user(user)
    return tree


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
    return {
        "products": store.count("products"),
        "services": store.count("services"),
        "blog_posts": store.count("blog"),
        "achievers": store.count("achievers"),
        "testimonials": store.count("testimonials"),
        "faqs": store.count("faqs"),
        "users": store.count("users"),
        "contacts": store.count("contacts"),
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
