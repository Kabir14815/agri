"""KGF Farming FastAPI backend."""
from typing import List, Optional
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from .data import (
    PRODUCTS,
    CATEGORIES,
    SERVICES,
    FAQS,
    TESTIMONIALS,
    PROJECTS,
    ACHIEVERS,
    BLOG_POSTS,
    COMPANY,
)

app = FastAPI(
    title="KGF Farming API",
    description="Backend API for the Kamauput Growth Farming Pvt Ltd. website clone.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=80)


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


# --------------------------- In-memory state -----------------------------

_contacts: List[dict] = []
_users: List[dict] = []


DEMO_USERS = [
    {
        "full_name": "Demo Customer",
        "email": "demo@kgffarming.com",
        "phone": "9999999999",
        "password": "demo1234",
        "role": "customer",
    },
    {
        "full_name": "Demo Franchisee",
        "email": "partner@kgffarming.com",
        "phone": "9888888888",
        "password": "partner1234",
        "role": "franchisee",
    },
    {
        "full_name": "Admin",
        "email": "admin@kgffarming.com",
        "phone": "9000000000",
        "password": "admin1234",
        "role": "admin",
    },
]


@app.on_event("startup")
def seed_demo_users() -> None:
    """Seed demo accounts so the UI is usable out of the box."""
    for demo in DEMO_USERS:
        if not any(u["email"] == demo["email"] for u in _users):
            user = {**demo, "id": len(_users) + 1}
            _users.append(user)


# ------------------------------ Helpers ----------------------------------

def _next_id(items: List[dict]) -> int:
    return (max((i["id"] for i in items), default=0) + 1)


def _find(items: List[dict], item_id: int) -> dict:
    for i in items:
        if i["id"] == item_id:
            return i
    raise HTTPException(status_code=404, detail="Item not found")


def _delete(items: List[dict], item_id: int) -> None:
    obj = _find(items, item_id)
    items.remove(obj)


def _user_from_token(token: str) -> Optional[dict]:
    # Tokens look like: demo-token-<user_id>
    if not token or not token.startswith("demo-token-"):
        return None
    try:
        uid = int(token.rsplit("-", 1)[1])
    except (ValueError, IndexError):
        return None
    return next((u for u in _users if u["id"] == uid), None)


def require_admin(authorization: Optional[str] = Header(default=None)) -> dict:
    """Dependency that checks for `Authorization: Bearer <token>` from an admin."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user = _user_from_token(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ------------------------------ Public API -------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/company")
def get_company():
    return COMPANY


@app.get("/api/products")
def list_products(category: Optional[str] = None):
    if category and category.upper() != "ALL":
        return [p for p in PRODUCTS if p["category"].upper() == category.upper()]
    return PRODUCTS


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    return _find(PRODUCTS, product_id)


@app.get("/api/categories")
def list_categories():
    return CATEGORIES


@app.get("/api/services")
def list_services():
    return SERVICES


@app.get("/api/faqs")
def list_faqs():
    return FAQS


@app.get("/api/testimonials")
def list_testimonials():
    return TESTIMONIALS


@app.get("/api/projects")
def list_projects():
    return PROJECTS


@app.get("/api/achievers")
def list_achievers():
    return ACHIEVERS


@app.get("/api/blog")
def list_blog():
    return BLOG_POSTS


@app.get("/api/blog/{post_id}")
def get_blog(post_id: int):
    return _find(BLOG_POSTS, post_id)


@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(payload: ContactMessage):
    record = payload.model_dump()
    record["id"] = _next_id(_contacts)
    record["submitted_at"] = datetime.utcnow().isoformat() + "Z"
    _contacts.append(record)
    return {"success": True, "message": "Thanks! We'll get in touch with you soon.", "id": record["id"]}


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload):
    if any(u["email"] == payload.email for u in _users):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = payload.model_dump()
    user["id"] = _next_id(_users)
    _users.append(user)
    return {
        "success": True,
        "message": "Registration successful",
        "user": {"id": user["id"], "full_name": user["full_name"], "email": user["email"], "role": user["role"]},
    }


@app.post("/api/auth/login")
def login(payload: LoginPayload):
    for u in _users:
        if u["email"] == payload.email and u["password"] == payload.password:
            return {
                "success": True,
                "token": f"demo-token-{u['id']}",
                "user": {"id": u["id"], "full_name": u["full_name"], "email": u["email"], "role": u["role"]},
            }
    raise HTTPException(status_code=401, detail="Invalid email or password")


# ------------------------------ Admin API --------------------------------

@app.get("/api/admin/me")
def admin_me(admin: dict = Depends(require_admin)):
    return {"id": admin["id"], "full_name": admin["full_name"], "email": admin["email"], "role": admin["role"]}


@app.get("/api/admin/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    return {
        "products": len(PRODUCTS),
        "services": len(SERVICES),
        "blog_posts": len(BLOG_POSTS),
        "achievers": len(ACHIEVERS),
        "testimonials": len(TESTIMONIALS),
        "faqs": len(FAQS),
        "users": len(_users),
        "contacts": len(_contacts),
    }


@app.get("/api/admin/contacts")
def admin_contacts(admin: dict = Depends(require_admin)):
    return list(reversed(_contacts))


@app.delete("/api/admin/contacts/{item_id}")
def admin_delete_contact(item_id: int, admin: dict = Depends(require_admin)):
    _delete(_contacts, item_id)
    return {"success": True}


@app.get("/api/admin/users")
def admin_users(admin: dict = Depends(require_admin)):
    return [
        {k: v for k, v in u.items() if k != "password"}
        for u in _users
    ]


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You can't delete your own account")
    _delete(_users, user_id)
    return {"success": True}


# ---------- Generic CRUD endpoints ----------

def _crud_endpoints(prefix: str, store: List[dict], schema: type[BaseModel]) -> None:
    @app.post(f"/api/admin/{prefix}", status_code=201)
    def _create(payload: schema, admin: dict = Depends(require_admin)):
        record = payload.model_dump()
        record["id"] = _next_id(store)
        store.append(record)
        return record

    @app.put(f"/api/admin/{prefix}/{{item_id}}")
    def _update(item_id: int, payload: schema, admin: dict = Depends(require_admin)):
        obj = _find(store, item_id)
        obj.update(payload.model_dump())
        return obj

    @app.delete(f"/api/admin/{prefix}/{{item_id}}")
    def _delete_(item_id: int, admin: dict = Depends(require_admin)):
        _delete(store, item_id)
        return {"success": True}

    _create.__name__ = f"admin_create_{prefix}"
    _update.__name__ = f"admin_update_{prefix}"
    _delete_.__name__ = f"admin_delete_{prefix}"


_crud_endpoints("products", PRODUCTS, ProductIn)
_crud_endpoints("services", SERVICES, ServiceIn)
_crud_endpoints("faqs", FAQS, FaqIn)
_crud_endpoints("testimonials", TESTIMONIALS, TestimonialIn)
_crud_endpoints("blog", BLOG_POSTS, BlogIn)
_crud_endpoints("achievers", ACHIEVERS, AchieverIn)
