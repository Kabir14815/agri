"""MongoDB data access layer."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

from .mlm import DEMO_MLM_BY_EMAIL, default_mlm_stats
from .data import (
    ACHIEVERS,
    BLOG_POSTS,
    CATEGORIES,
    COMPANY,
    FAQS,
    PRODUCTS,
    PROJECTS,
    SERVICES,
    TESTIMONIALS,
)

COLLECTIONS = {
    "products": "products",
    "services": "services",
    "faqs": "faqs",
    "testimonials": "testimonials",
    "blog": "blog_posts",
    "achievers": "achievers",
}

DEMO_USERS = [
    {
        "full_name": "Demo Customer",
        "email": "demo@kgffarming.com",
        "phone": "9999999999",
        "password": "demo1234",
        "role": "customer",
        "address": "Demo address, Jind",
        "city": "Jind",
        "state": "Haryana",
        "pincode": "126102",
        "amount": 12500.0,
    },
    {
        "full_name": "Demo Franchisee",
        "email": "partner@kgffarming.com",
        "phone": "9888888888",
        "password": "partner1234",
        "role": "franchisee",
        "address": "Demo address, Jind",
        "city": "Jind",
        "state": "Haryana",
        "pincode": "126102",
        "amount": 45800.0,
    },
    {
        "full_name": "Admin",
        "email": "admin@kgffarming.com",
        "phone": "9000000000",
        "password": "admin1234",
        "role": "admin",
        "address": "Head office, Jind",
        "city": "Jind",
        "state": "Haryana",
        "pincode": "126102",
        "amount": 0.0,
    },
]


class MongoStore:
    def __init__(self, db: Database) -> None:
        self.db = db

    def _coll(self, key: str):
        name = COLLECTIONS.get(key, key)
        return self.db[name]

    def _next_id(self, collection) -> int:
        doc = collection.find_one(sort=[("id", DESCENDING)], projection={"id": 1})
        return (int(doc["id"]) if doc else 0) + 1

    def _serialize(self, doc: Optional[dict]) -> Optional[dict]:
        if doc is None:
            return None
        out = dict(doc)
        out.pop("_id", None)
        return out

    def _serialize_many(self, docs) -> List[dict]:
        return [self._serialize(d) for d in docs]

    # ----------------------------- Seed ------------------------------------

    def seed(self) -> None:
        now = datetime.utcnow().isoformat() + "Z"

        if self.db.products.count_documents({}) == 0:
            self.db.products.insert_many(PRODUCTS)

        if self.db.services.count_documents({}) == 0:
            self.db.services.insert_many(SERVICES)

        if self.db.faqs.count_documents({}) == 0:
            self.db.faqs.insert_many(FAQS)

        if self.db.testimonials.count_documents({}) == 0:
            self.db.testimonials.insert_many(TESTIMONIALS)

        if self.db.projects.count_documents({}) == 0:
            self.db.projects.insert_many(PROJECTS)

        if self.db.achievers.count_documents({}) == 0:
            self.db.achievers.insert_many(ACHIEVERS)

        if self.db.blog_posts.count_documents({}) == 0:
            self.db.blog_posts.insert_many(BLOG_POSTS)

        self.db.settings.update_one(
            {"_id": "company"},
            {"$set": {"_id": "company", **COMPANY}},
            upsert=True,
        )
        self.db.settings.update_one(
            {"_id": "categories"},
            {"$set": {"_id": "categories", "items": CATEGORIES}},
            upsert=True,
        )

        for demo in DEMO_USERS:
            if self.db.users.find_one({"email": demo["email"]}) is None:
                user = {**demo, "registered_at": now}
                user["id"] = self._next_id(self.db.users)
                if demo["email"] in DEMO_MLM_BY_EMAIL:
                    user["mlm"] = DEMO_MLM_BY_EMAIL[demo["email"]]
                self.db.users.insert_one(user)

        self.db.users.create_index([("email", ASCENDING)], unique=True)
        self.db.users.create_index([("id", ASCENDING)], unique=True)
        for name in list(COLLECTIONS.values()) + ["projects", "contacts"]:
            self.db[name].create_index([("id", ASCENDING)], unique=True)

    # ----------------------------- Public reads ----------------------------

    def get_company(self) -> dict:
        doc = self.db.settings.find_one({"_id": "company"})
        if not doc:
            return dict(COMPANY)
        return {k: v for k, v in doc.items() if k != "_id"}

    def get_categories(self) -> List[str]:
        doc = self.db.settings.find_one({"_id": "categories"})
        if doc and doc.get("items"):
            return list(doc["items"])
        return list(CATEGORIES)

    def list_products(self, category: Optional[str] = None) -> List[dict]:
        query: Dict[str, Any] = {}
        if category and category.upper() != "ALL":
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        return self._serialize_many(self.db.products.find(query).sort("id", ASCENDING))

    def find_by_id(self, collection_key: str, item_id: int) -> dict:
        coll = self._coll(collection_key) if collection_key in COLLECTIONS else self.db[collection_key]
        doc = coll.find_one({"id": item_id})
        if not doc:
            raise KeyError("not_found")
        return self._serialize(doc)

    def list_all(self, collection_key: str) -> List[dict]:
        if collection_key == "projects":
            coll = self.db.projects
        else:
            coll = self._coll(collection_key)
        return self._serialize_many(coll.find().sort("id", ASCENDING))

    # ----------------------------- Users & contacts ------------------------

    def find_user_by_email(self, email: str) -> Optional[dict]:
        return self._serialize(self.db.users.find_one({"email": email}))

    def find_user_by_id(self, user_id: int) -> Optional[dict]:
        return self._serialize(self.db.users.find_one({"id": user_id}))

    def create_user(self, data: dict) -> dict:
        coll = self.db.users
        user = dict(data)
        user["id"] = self._next_id(coll)
        user["amount"] = float(user.get("amount", 0) or 0)
        user["registered_at"] = datetime.utcnow().isoformat() + "Z"
        user["mlm"] = default_mlm_stats(user["id"], user["amount"])
        coll.insert_one(user)
        return self._serialize(user)

    def list_users_public(self) -> List[dict]:
        users = self._serialize_many(self.db.users.find())
        for u in users:
            u.pop("password", None)
        users.sort(key=lambda x: x.get("registered_at") or "", reverse=True)
        return users

    def update_user_amount(self, user_id: int, amount: float) -> dict:
        result = self.db.users.find_one_and_update(
            {"id": user_id},
            {"$set": {"amount": float(amount)}},
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self._serialize(result)

    def delete_user(self, user_id: int) -> None:
        result = self.db.users.delete_one({"id": user_id})
        if result.deleted_count == 0:
            raise KeyError("not_found")

    def create_contact(self, data: dict) -> dict:
        record = dict(data)
        record["id"] = self._next_id(self.db.contacts)
        record["submitted_at"] = datetime.utcnow().isoformat() + "Z"
        self.db.contacts.insert_one(record)
        return self._serialize(record)

    def list_contacts(self) -> List[dict]:
        return self._serialize_many(
            self.db.contacts.find().sort("submitted_at", DESCENDING)
        )

    def delete_contact(self, item_id: int) -> None:
        result = self.db.contacts.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise KeyError("not_found")

    # ----------------------------- Admin CRUD ------------------------------

    def create_item(self, collection_key: str, data: dict) -> dict:
        coll = self._coll(collection_key)
        record = dict(data)
        record["id"] = self._next_id(coll)
        coll.insert_one(record)
        return self._serialize(record)

    def update_item(self, collection_key: str, item_id: int, data: dict) -> dict:
        coll = self._coll(collection_key)
        existing = coll.find_one({"id": item_id})
        if not existing:
            raise KeyError("not_found")
        coll.update_one({"id": item_id}, {"$set": dict(data)})
        return self.find_by_id(collection_key, item_id)

    def delete_item(self, collection_key: str, item_id: int) -> None:
        coll = self._coll(collection_key)
        result = coll.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise KeyError("not_found")

    def count(self, collection_key: str) -> int:
        if collection_key == "users":
            return self.db.users.count_documents({})
        if collection_key == "contacts":
            return self.db.contacts.count_documents({})
        if collection_key == "blog":
            return self.db.blog_posts.count_documents({})
        if collection_key in COLLECTIONS:
            return self._coll(collection_key).count_documents({})
        return self.db[collection_key].count_documents({})
