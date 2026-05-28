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
    {
        "full_name": "Demo Farmer",
        "email": "farmer@kgffarming.com",
        "phone": "9876543210",
        "password": "farmer1234",
        "role": "farmer",
        "address": "Village plot, Jind",
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
            existing = self.db.users.find_one({"email": demo["email"]})
            demo_mlm = DEMO_MLM_BY_EMAIL.get(demo["email"])
            if existing is None:
                user = {**demo, "registered_at": now}
                user["id"] = self._next_id(self.db.users)
                if demo_mlm:
                    user["mlm"] = dict(demo_mlm)
                elif demo.get("role") != "admin":
                    user["mlm"] = default_mlm_stats(user["id"], user.get("amount", 0))
                self.db.users.insert_one(user)
            elif demo_mlm:
                # Keep demo referral codes stable (e.g. KGF870365) after deploys
                self.db.users.update_one(
                    {"email": demo["email"]},
                    {"$set": {"mlm": dict(demo_mlm)}},
                )

        self.db.users.create_index([("email", ASCENDING)], unique=True)
        self.db.users.create_index([("id", ASCENDING)], unique=True)
        for name in list(COLLECTIONS.values()) + [
            "projects",
            "contacts",
            "deposits",
            "wallet_ledger",
            "help_tickets",
            "exchange_requests",
            "wallet_transfers",
            "referral_visits",
            "farm_daily_logs",
        ]:
            self.db[name].create_index([("id", ASCENDING)], unique=True)
        self.db.farm_daily_logs.create_index(
            [("user_id", ASCENDING), ("log_date", ASCENDING)], unique=True
        )
        self.db.farm_daily_logs.create_index([("log_date", DESCENDING)])
        self.db.farm_daily_logs.create_index([("created_at", ASCENDING)])
        self.db.referral_visits.create_index([("code", ASCENDING)])
        self.db.referral_visits.create_index([("visited_at", DESCENDING)])
        self.db.users.create_index([("sponsor_member_id", ASCENDING)])
        self.db.users.create_index([("mlm.member_id", ASCENDING)])
        self.db.wallet_transfers.create_index([("from_user_id", ASCENDING)])
        self.db.wallet_transfers.create_index([("to_user_id", ASCENDING)])
        self.db.wallet_transfers.create_index([("created_at", DESCENDING)])

    # ----------------------------- Referral tracking -----------------------

    def lookup_referral_code(self, code: str) -> Optional[dict]:
        from .referral import normalize_member_id

        member_id = normalize_member_id(code)
        if not member_id:
            return None
        sponsor = self.find_user_by_member_id(member_id)
        if not sponsor:
            return None
        return {
            "valid": True,
            "member_id": member_id,
            "sponsor_name": sponsor.get("full_name"),
            "sponsor_user_id": sponsor["id"],
        }

    def track_referral_visit(self, code: str, path: str = "") -> dict:
        from .referral import normalize_member_id

        member_id = normalize_member_id(code)
        lookup = self.lookup_referral_code(member_id)
        if not lookup:
            raise KeyError("invalid")
        record = {
            "id": self._next_id(self.db.referral_visits),
            "code": member_id,
            "sponsor_user_id": lookup["sponsor_user_id"],
            "sponsor_name": lookup["sponsor_name"],
            "path": path or "",
            "visited_at": datetime.utcnow().isoformat() + "Z",
        }
        self.db.referral_visits.insert_one(record)
        return self._serialize(record)

    def count_referral_visits(self, code: str) -> int:
        from .referral import normalize_member_id

        return self.db.referral_visits.count_documents(
            {"code": normalize_member_id(code)}
        )

    def list_referral_visits(self, limit: int = 200) -> List[dict]:
        return self._serialize_many(
            self.db.referral_visits.find()
            .sort("id", DESCENDING)
            .limit(limit)
        )

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

    def find_user_by_member_id(self, member_id: str) -> Optional[dict]:
        from .referral import normalize_member_id

        member_id = normalize_member_id(member_id)
        if not member_id:
            return None
        u = self.db.users.find_one({"mlm.member_id": member_id})
        if u:
            return self._serialize(u)
        try:
            num = int(str(member_id).replace("KGF", "").strip())
            if num >= 870_000:
                return self.find_user_by_id(num - 870_000)
        except (ValueError, TypeError):
            pass
        return None

    def list_direct_referrals(self, sponsor_member_id: str) -> List[dict]:
        from .referral import normalize_member_id

        sponsor_member_id = normalize_member_id(sponsor_member_id)
        if not sponsor_member_id:
            return []
        cursor = self.db.users.find({"sponsor_member_id": sponsor_member_id}).sort(
            "id", ASCENDING
        )
        return self._serialize_many(cursor)

    def is_descendant(
        self,
        ancestor_member_id: str,
        target_member_id: str,
        max_depth: int = 24,
    ) -> bool:
        if ancestor_member_id == target_member_id:
            return True
        queue = [(ancestor_member_id, 0)]
        seen = set()
        while queue:
            mid, depth = queue.pop(0)
            if mid in seen:
                continue
            seen.add(mid)
            if depth >= max_depth:
                continue
            for child in self.list_direct_referrals(mid):
                cid = (child.get("mlm") or {}).get("member_id")
                if not cid:
                    from .mlm import member_id_for
                    cid = member_id_for(child["id"])
                if cid == target_member_id:
                    return True
                queue.append((cid, depth + 1))
        return False

    def credit_referral_bonus(
        self,
        sponsor: dict,
        bonus: float,
        *,
        level: int,
        from_member_id: str,
        from_amount: float,
        source: str,
    ) -> None:
        from .mlm import default_mlm_stats

        mlm = dict(sponsor.get("mlm") or default_mlm_stats(sponsor["id"], sponsor.get("amount", 0)))
        bonus = round(float(bonus), 2)
        mlm["income_wallet"] = round(float(mlm.get("income_wallet", 0)) + bonus, 2)
        mlm["total_earning"] = round(float(mlm.get("total_earning", 0)) + bonus, 2)
        if level == 1:
            mlm["direct_income"] = round(float(mlm.get("direct_income", 0)) + bonus, 2)
            mlm["direct_income_today"] = round(float(mlm.get("direct_income_today", 0)) + bonus, 2)
            mlm["direct_business"] = round(float(mlm.get("direct_business", 0)) + float(from_amount), 2)
        else:
            mlm["level_income"] = round(float(mlm.get("level_income", 0)) + bonus, 2)
            mlm["level_income_today"] = round(float(mlm.get("level_income_today", 0)) + bonus, 2)
        mlm["team_business"] = round(float(mlm.get("team_business", 0)) + float(from_amount), 2)
        self.db.users.update_one({"id": sponsor["id"]}, {"$set": {"mlm": mlm}})
        label = "Direct" if level == 1 else f"Level {level}"
        self.add_wallet_entry(
            sponsor["id"],
            "income",
            bonus,
            f"{label} bonus 2% from {from_member_id} ({source})",
            "credit",
        )

    def create_user(self, data: dict) -> dict:
        coll = self.db.users
        user = dict(data)
        user["id"] = self._next_id(coll)
        user["amount"] = float(user.get("amount", 0) or 0)
        user["registered_at"] = datetime.utcnow().isoformat() + "Z"
        user.setdefault("country", data.get("country") or "India")
        user.setdefault("gst_no", "")
        user.setdefault("nominee_name", "")
        user.setdefault("nominee_relation", "")
        user.setdefault("bank", {
            "account_holder": user.get("full_name", ""),
            "bank_name": "",
            "account_number": "",
            "ifsc": "",
        })
        user["mlm"] = default_mlm_stats(user["id"], user["amount"])
        from .referral import member_id_from_user, normalize_member_id

        sponsor = normalize_member_id(data.get("sponsor_member_id"))
        if sponsor:
            sponsor_user = self.find_user_by_member_id(sponsor)
            if not sponsor_user:
                raise ValueError("invalid_sponsor")
            new_mid = user["mlm"]["member_id"]
            if sponsor == new_mid:
                raise ValueError("invalid_sponsor")
            user["sponsor_member_id"] = sponsor
        coll.insert_one(user)
        created = self._serialize(user)
        if sponsor:
            self._increment_sponsor_stats(sponsor)
        if float(user.get("amount", 0) or 0) >= 250_000:
            from .referral_bonus import distribute_investment_bonus

            fresh = self.find_user_by_id(user["id"])
            if fresh:
                distribute_investment_bonus(self, fresh, float(user["amount"]), "registration")
        return created

    def _increment_sponsor_stats(self, sponsor_member_id: str) -> None:
        sponsor = self.find_user_by_member_id(sponsor_member_id)
        if not sponsor:
            return
        mlm = dict(sponsor.get("mlm") or default_mlm_stats(sponsor["id"], sponsor.get("amount", 0)))
        mlm["subscribers_count"] = int(mlm.get("subscribers_count", 0) or 0) + 1
        mlm["direct_active_users"] = int(mlm.get("direct_active_users", 0) or 0) + 1
        self.db.users.update_one({"id": sponsor["id"]}, {"$set": {"mlm": mlm}})

    def update_user_mlm(
        self,
        user_id: int,
        sponsor_member_id: Optional[str] = None,
        amount: Optional[float] = None,
    ) -> dict:
        from .referral import member_id_from_user, normalize_member_id

        user = self.find_user_by_id(user_id)
        if not user:
            raise KeyError("not_found")
        payload: Dict[str, Any] = {}
        if sponsor_member_id is not None:
            sponsor = normalize_member_id(sponsor_member_id)
            if sponsor:
                if sponsor == member_id_from_user(user):
                    raise ValueError("cannot_sponsor_self")
                if not self.find_user_by_member_id(sponsor):
                    raise ValueError("invalid_sponsor")
            payload["sponsor_member_id"] = sponsor or None
        old_amount = float(user.get("amount", 0) or 0)
        delta = 0.0
        if amount is not None:
            amt = float(amount)
            if amt > 0 and amt < 250_000:
                raise ValueError("min_investment")
            delta = max(0.0, amt - old_amount)
            payload["amount"] = amt
            mlm = dict(user.get("mlm") or default_mlm_stats(user_id, amt))
            mlm["package_amount"] = amt
            from .investment_interest import initialize_accrual_fields
            from .referral_bonus import level_open_for_package

            mlm = initialize_accrual_fields(mlm, amt)
            mlm["level_open"] = level_open_for_package(amt)
            payload["mlm"] = mlm
        if not payload:
            raise ValueError("no_fields")
        result = self.db.users.find_one_and_update(
            {"id": user_id},
            {"$set": payload},
            return_document=True,
        )
        serialized = self._serialize(result)
        if delta > 0 and serialized:
            from .referral_bonus import distribute_investment_bonus

            distribute_investment_bonus(self, serialized, delta, "package_update")
        return serialized

    def update_user(self, user_id: int, updates: dict) -> dict:
        allowed = {
            "full_name",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
            "country",
            "gst_no",
            "nominee_name",
            "nominee_relation",
            "bank",
            "password",
        }
        payload = {k: v for k, v in updates.items() if k in allowed}
        if not payload:
            raise ValueError("No valid fields to update")
        result = self.db.users.find_one_and_update(
            {"id": user_id},
            {"$set": payload},
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self._serialize(result)

    def list_users_public(self) -> List[dict]:
        from .referral import member_id_from_user

        users = self._serialize_many(self.db.users.find())
        for u in users:
            u.pop("password", None)
            mid = member_id_from_user(u)
            u["member_id"] = mid
            u["direct_referral_count"] = len(self.list_direct_referrals(mid))
            sponsor_mid = (u.get("sponsor_member_id") or "").strip().upper()
            if sponsor_mid:
                sponsor = self.find_user_by_member_id(sponsor_mid)
                u["sponsor_name"] = sponsor.get("full_name") if sponsor else None
            else:
                u["sponsor_name"] = None
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

    # ----------------------------- Deposits & wallet ledger ----------------

    def create_deposit_request(
        self,
        user_id: int,
        amount: float,
        payment_mode: str = "",
        transaction_number: str = "",
        note: str = "",
        receipt_filename: Optional[str] = None,
        receipt_data: Optional[str] = None,
    ) -> dict:
        user = self.find_user_by_id(user_id)
        if user:
            from .referral_bonus import validate_first_deposit_amount

            validate_first_deposit_amount(user, amount)
        record = {
            "id": self._next_id(self.db.deposits),
            "user_id": user_id,
            "amount": float(amount),
            "payment_mode": payment_mode or "",
            "transaction_number": transaction_number or "",
            "status": "pending",
            "note": note or "",
            "receipt_filename": receipt_filename or "",
            "receipt_data": receipt_data or "",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "reviewed_at": None,
        }
        self.db.deposits.insert_one(record)
        return self.deposit_public(record)

    def deposit_public(self, record: dict) -> dict:
        """Strip large receipt payload from API responses."""
        data = self._serialize(record)
        if data.get("receipt_data"):
            data["has_receipt"] = True
        else:
            data["has_receipt"] = False
        data.pop("receipt_data", None)
        return data

    def list_deposits_for_user(self, user_id: int) -> List[dict]:
        return [
            self.deposit_public(d)
            for d in self.db.deposits.find({"user_id": user_id}).sort("id", DESCENDING)
        ]

    def list_all_deposits(self) -> List[dict]:
        return [self.deposit_public(d) for d in self.db.deposits.find().sort("id", DESCENDING)]

    def record_admin_deposit(
        self,
        user_id: int,
        amount: float,
        note: str = "",
        payment_mode: str = "Admin activation",
    ) -> dict:
        """Audit trail when admin sets investment directly (does not change balance again)."""
        now = datetime.utcnow().isoformat() + "Z"
        dep_id = self._next_id(self.db.deposits)
        record = {
            "id": dep_id,
            "user_id": user_id,
            "amount": float(amount),
            "payment_mode": payment_mode,
            "transaction_number": f"ADMIN-{user_id}-{dep_id}",
            "status": "approved",
            "note": note or "Approved from admin users panel",
            "receipt_filename": "",
            "receipt_data": "",
            "created_at": now,
            "reviewed_at": now,
            "source": "admin_manual",
        }
        self.db.deposits.insert_one(record)
        return self.deposit_public(record)

    def find_deposit(self, deposit_id: int) -> Optional[dict]:
        return self._serialize(self.db.deposits.find_one({"id": deposit_id}))

    def set_deposit_status(self, deposit_id: int, status: str) -> dict:
        result = self.db.deposits.find_one_and_update(
            {"id": deposit_id},
            {
                "$set": {
                    "status": status,
                    "reviewed_at": datetime.utcnow().isoformat() + "Z",
                }
            },
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self.deposit_public(result)

    def approve_deposit(self, deposit_id: int) -> dict:
        dep = self.find_deposit(deposit_id)
        if not dep:
            raise KeyError("not_found")
        if dep["status"] != "pending":
            return self.deposit_public(dep)
        user = self.find_user_by_id(dep["user_id"])
        if not user:
            raise KeyError("not_found")
        dep_amount = float(dep["amount"])
        new_amount = float(user.get("amount", 0) or 0) + dep_amount
        if new_amount > 0 and new_amount < 250_000:
            raise ValueError("min_investment")
        mlm = dict(user.get("mlm") or default_mlm_stats(user["id"], new_amount))
        mlm["package_amount"] = new_amount
        from .investment_interest import initialize_accrual_fields
        from .referral_bonus import level_open_for_package

        mlm = initialize_accrual_fields(mlm, new_amount)
        mlm["level_open"] = level_open_for_package(new_amount)
        self.db.users.update_one(
            {"id": user["id"]},
            {"$set": {"amount": new_amount, "mlm": mlm}},
        )
        self.add_wallet_entry(
            user["id"],
            "topup",
            dep_amount,
            f"Deposit approved #{deposit_id}",
            "credit",
        )
        updated = self.find_user_by_id(user["id"])
        if updated:
            from .referral_bonus import distribute_investment_bonus

            distribute_investment_bonus(
                self, updated, dep_amount, f"deposit_{deposit_id}"
            )
        return self.set_deposit_status(deposit_id, "approved")

    def add_wallet_entry(
        self,
        user_id: int,
        wallet: str,
        amount: float,
        description: str,
        direction: str = "credit",
    ) -> dict:
        record = {
            "id": self._next_id(self.db.wallet_ledger),
            "user_id": user_id,
            "wallet": wallet,
            "amount": float(amount),
            "direction": direction,
            "description": description,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        self.db.wallet_ledger.insert_one(record)
        return self._serialize(record)

    def list_wallet_ledger(self, user_id: int, wallet: Optional[str] = None) -> List[dict]:
        query: Dict[str, Any] = {"user_id": user_id}
        if wallet:
            query["wallet"] = wallet
        return self._serialize_many(
            self.db.wallet_ledger.find(query).sort("id", DESCENDING)
        )

    def get_user_referral_summary(self, user_id: int) -> dict:
        user = self.find_user_by_id(user_id)
        if not user:
            raise KeyError("not_found")
        from .referral import member_id_from_user, normalize_member_id

        member_id = member_id_from_user(user)
        sponsor_mid = normalize_member_id(user.get("sponsor_member_id"))
        sponsor_user = self.find_user_by_member_id(sponsor_mid) if sponsor_mid else None
        db_direct = self.list_direct_referrals(member_id)
        referrals = [
            {
                "id": r["id"],
                "full_name": r.get("full_name"),
                "email": r.get("email"),
                "member_id": member_id_from_user(r),
                "amount": float(r.get("amount", 0) or 0),
                "registered_at": r.get("registered_at"),
            }
            for r in db_direct
        ]
        return {
            "member_id": member_id,
            "sponsor_member_id": sponsor_mid or None,
            "sponsor_name": sponsor_user.get("full_name") if sponsor_user else None,
            "direct_count": len(referrals),
            "referrals": referrals,
        }

    # ----------------------------- Help desk & exchange --------------------

    WALLET_FIELDS = {
        "income": "income_wallet",
        "repurchase": "repurchase_wallet",
        "topup": "topup_wallet",
    }
    MIN_WALLET_TRANSFER = 100.0

    def _get_user_mlm_stats(self, user: dict) -> dict:
        if user.get("mlm") and isinstance(user["mlm"], dict):
            return dict(user["mlm"])
        email = user.get("email", "")
        if email in DEMO_MLM_BY_EMAIL:
            return dict(DEMO_MLM_BY_EMAIL[email])
        return default_mlm_stats(user["id"], user.get("amount", 0))

    def _set_user_mlm_stats(self, user_id: int, stats: dict) -> None:
        self.db.users.update_one({"id": user_id}, {"$set": {"mlm": stats}})

    def _wallet_balance(self, stats: dict, wallet: str) -> float:
        field = self.WALLET_FIELDS.get(wallet)
        if not field:
            return 0.0
        return float(stats.get(field, 0) or 0)

    def accrue_investment_interest(self, user_id: int) -> Optional[dict]:
        """Credit daily investment return (10% p.m. gross, 1% TDS on interest)."""
        user = self.find_user_by_id(user_id)
        if not user:
            return None

        stats = self._get_user_mlm_stats(user)
        stats, summary = self._run_interest_accrual(stats, user)
        if not summary:
            if float(stats.get("package_amount", 0) or user.get("amount", 0) or 0) > 0:
                self._set_user_mlm_stats(user_id, stats)
            return self.find_user_by_id(user_id)

        self._set_user_mlm_stats(user_id, stats)
        days = summary["days"]
        self.add_wallet_entry(
            user_id,
            "income",
            summary["net"],
            (
                f"Investment return ({days} day{'s' if days != 1 else ''}): "
                f"gross Rs {summary['gross']:.2f}, TDS Rs {summary['tds']:.2f}, "
                f"net Rs {summary['net']:.2f}"
            ),
            "credit",
        )
        return self.find_user_by_id(user_id)

    def _run_interest_accrual(self, stats: dict, user: dict):
        from .investment_interest import accrue_through_today

        return accrue_through_today(stats, float(user.get("amount", 0) or 0))

    def create_help_ticket(self, user_id: int, subject: str, message: str) -> dict:
        record = {
            "id": self._next_id(self.db.help_tickets),
            "user_id": user_id,
            "subject": subject.strip(),
            "message": message.strip(),
            "status": "open",
            "admin_reply": "",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
        self.db.help_tickets.insert_one(record)
        return self._serialize(record)

    def list_help_tickets_for_user(self, user_id: int) -> List[dict]:
        return self._serialize_many(
            self.db.help_tickets.find({"user_id": user_id}).sort("id", DESCENDING)
        )

    def list_all_help_tickets(self) -> List[dict]:
        return self._serialize_many(
            self.db.help_tickets.find().sort("id", DESCENDING)
        )

    def find_help_ticket(self, ticket_id: int) -> Optional[dict]:
        return self._serialize(self.db.help_tickets.find_one({"id": ticket_id}))

    def reply_help_ticket(self, ticket_id: int, admin_reply: str, status: str = "answered") -> dict:
        result = self.db.help_tickets.find_one_and_update(
            {"id": ticket_id},
            {
                "$set": {
                    "admin_reply": admin_reply.strip(),
                    "status": status,
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }
            },
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self._serialize(result)

    def create_exchange_request(
        self, user_id: int, from_wallet: str, to_wallet: str, amount: float
    ) -> dict:
        record = {
            "id": self._next_id(self.db.exchange_requests),
            "user_id": user_id,
            "from_wallet": from_wallet,
            "to_wallet": to_wallet,
            "amount": float(amount),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "reviewed_at": None,
        }
        self.db.exchange_requests.insert_one(record)
        return self._serialize(record)

    def list_exchanges_for_user(self, user_id: int) -> List[dict]:
        return self._serialize_many(
            self.db.exchange_requests.find({"user_id": user_id}).sort("id", DESCENDING)
        )

    def list_all_exchanges(self) -> List[dict]:
        return self._serialize_many(
            self.db.exchange_requests.find().sort("id", DESCENDING)
        )

    def find_exchange(self, exchange_id: int) -> Optional[dict]:
        return self._serialize(self.db.exchange_requests.find_one({"id": exchange_id}))

    def set_exchange_status(self, exchange_id: int, status: str) -> dict:
        result = self.db.exchange_requests.find_one_and_update(
            {"id": exchange_id},
            {
                "$set": {
                    "status": status,
                    "reviewed_at": datetime.utcnow().isoformat() + "Z",
                }
            },
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self._serialize(result)

    def _user_mlm_wallets(self, user: dict) -> Dict[str, float]:
        stats = self._get_user_mlm_stats(user)
        return {
            "income": self._wallet_balance(stats, "income"),
            "repurchase": self._wallet_balance(stats, "repurchase"),
            "topup": self._wallet_balance(stats, "topup"),
            "_stats": stats,
        }

    def lookup_member_for_transfer(self, member_id: str) -> Optional[dict]:
        from .referral import member_id_from_user, normalize_member_id

        mid = normalize_member_id(member_id)
        user = self.find_user_by_member_id(mid)
        if not user:
            return None
        return {
            "member_id": member_id_from_user(user),
            "full_name": user.get("full_name"),
            "user_id": user["id"],
        }

    def transfer_wallet_funds(
        self,
        from_user_id: int,
        to_member_id: str,
        amount: float,
        wallet: str = "income",
    ) -> dict:
        from .referral import member_id_from_user, normalize_member_id

        amount = round(float(amount), 2)
        if amount < self.MIN_WALLET_TRANSFER:
            raise ValueError("min_amount")
        if wallet not in self.WALLET_FIELDS:
            raise ValueError("invalid_wallet")

        sender = self.find_user_by_id(from_user_id)
        if not sender:
            raise KeyError("not_found")

        to_mid = normalize_member_id(to_member_id)
        recipient = self.find_user_by_member_id(to_mid)
        if not recipient:
            raise ValueError("recipient_not_found")
        if recipient["id"] == from_user_id:
            raise ValueError("cannot_transfer_self")

        sender_mid = member_id_from_user(sender)
        sender_stats = self._get_user_mlm_stats(sender)
        field = self.WALLET_FIELDS[wallet]
        balance = self._wallet_balance(sender_stats, wallet)
        if balance < amount:
            raise ValueError("insufficient_balance")

        recipient_stats = self._get_user_mlm_stats(recipient)
        sender_stats[field] = round(balance - amount, 2)
        recipient_stats[field] = round(self._wallet_balance(recipient_stats, wallet) + amount, 2)

        self._set_user_mlm_stats(from_user_id, sender_stats)
        self._set_user_mlm_stats(recipient["id"], recipient_stats)

        record = {
            "id": self._next_id(self.db.wallet_transfers),
            "from_user_id": from_user_id,
            "to_user_id": recipient["id"],
            "from_member_id": sender_mid,
            "to_member_id": to_mid,
            "to_name": recipient.get("full_name") or "",
            "from_name": sender.get("full_name") or "",
            "amount": amount,
            "wallet": wallet,
            "status": "completed",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        self.db.wallet_transfers.insert_one(record)

        self.add_wallet_entry(
            from_user_id,
            wallet,
            amount,
            f"Transfer to {to_mid} ({recipient.get('full_name', '')})",
            "debit",
        )
        self.add_wallet_entry(
            recipient["id"],
            wallet,
            amount,
            f"Transfer from {sender_mid} ({sender.get('full_name', '')})",
            "credit",
        )
        return self._serialize(record)

    def list_wallet_transfers_for_user(self, user_id: int) -> List[dict]:
        return self._serialize_many(
            self.db.wallet_transfers.find(
                {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]}
            ).sort("id", DESCENDING)
        )

    def list_all_wallet_transfers(self) -> List[dict]:
        return self._serialize_many(
            self.db.wallet_transfers.find().sort("id", DESCENDING)
        )

    def approve_exchange(self, exchange_id: int) -> dict:
        ex = self.find_exchange(exchange_id)
        if not ex:
            raise KeyError("not_found")
        if ex["status"] != "pending":
            return ex
        user = self.find_user_by_id(ex["user_id"])
        if not user:
            raise KeyError("not_found")
        from_w = ex["from_wallet"]
        to_w = ex["to_wallet"]
        amount = float(ex["amount"])
        wallets = self._user_mlm_wallets(user)
        if wallets[from_w] < amount:
            raise ValueError("insufficient_balance")
        stats = wallets["_stats"]
        from_field = self.WALLET_FIELDS[from_w]
        to_field = self.WALLET_FIELDS[to_w]
        stats[from_field] = round(wallets[from_w] - amount, 2)
        stats[to_field] = round(wallets[to_w] + amount, 2)
        self._set_user_mlm_stats(user["id"], stats)
        self.add_wallet_entry(
            user["id"],
            from_w,
            amount,
            f"Exchange to {to_w} #{exchange_id}",
            "debit",
        )
        self.add_wallet_entry(
            user["id"],
            to_w,
            amount,
            f"Exchange from {from_w} #{exchange_id}",
            "credit",
        )
        return self.set_exchange_status(exchange_id, "approved")

    # ----------------------------- Farmer daily logs -----------------------

    def upsert_farm_daily_log(
        self,
        user: dict,
        watered: bool,
        image_b64: Optional[str] = None,
        image_mime: Optional[str] = None,
        image_size: Optional[int] = None,
        note: str = "",
        log_date: Optional[str] = None,
    ) -> dict:
        from .farmer_logs import today_utc
        from .referral import member_id_from_user

        log_date = log_date or today_utc()
        now = datetime.utcnow().isoformat() + "Z"
        existing = self.db.farm_daily_logs.find_one(
            {"user_id": user["id"], "log_date": log_date}
        )
        base = {
            "user_id": user["id"],
            "member_id": member_id_from_user(user),
            "farmer_name": user.get("full_name", ""),
            "log_date": log_date,
            "watered": bool(watered),
            "note": (note or "").strip(),
            "updated_at": now,
        }
        if image_b64 is not None:
            base.update(
                {
                    "image_data": image_b64,
                    "image_mime": image_mime or "image/jpeg",
                    "image_size_bytes": int(image_size or 0),
                    "image_purged_at": None,
                }
            )
        if existing:
            self.db.farm_daily_logs.update_one(
                {"id": existing["id"]},
                {"$set": base},
            )
            doc = self.db.farm_daily_logs.find_one({"id": existing["id"]})
        else:
            if image_b64 is None:
                raise ValueError("photo_required")
            record = {
                "id": self._next_id(self.db.farm_daily_logs),
                **base,
                "image_data": image_b64,
                "image_mime": image_mime or "image/jpeg",
                "image_size_bytes": int(image_size or 0),
                "image_purged_at": None,
                "created_at": now,
            }
            self.db.farm_daily_logs.insert_one(record)
            doc = record
        return self._serialize(doc)

    def get_farm_log_for_date(self, user_id: int, log_date: str) -> Optional[dict]:
        return self._serialize(
            self.db.farm_daily_logs.find_one({"user_id": user_id, "log_date": log_date})
        )

    def get_farm_log_by_id(self, log_id: int) -> Optional[dict]:
        return self._serialize(self.db.farm_daily_logs.find_one({"id": log_id}))

    def list_farm_logs_for_user(self, user_id: int, limit: int = 60) -> List[dict]:
        cursor = (
            self.db.farm_daily_logs.find({"user_id": user_id})
            .sort("log_date", DESCENDING)
            .limit(limit)
        )
        return self._serialize_many(cursor)

    def list_all_farm_logs(self, limit: int = 200) -> List[dict]:
        cursor = self.db.farm_daily_logs.find().sort("log_date", DESCENDING).limit(limit)
        return self._serialize_many(cursor)

    def list_user_transactions(self, user_id: int) -> List[dict]:
        rows: List[dict] = []
        for dep in self.list_deposits_for_user(user_id):
            rows.append(
                {
                    "id": f"dep-{dep['id']}",
                    "ref_id": dep["id"],
                    "category": "deposit",
                    "amount": float(dep["amount"]),
                    "direction": "credit",
                    "status": dep["status"],
                    "description": f"Deposit request #{dep['id']}",
                    "created_at": dep["created_at"],
                }
            )
        for entry in self.list_wallet_ledger(user_id):
            rows.append(
                {
                    "id": f"led-{entry['id']}",
                    "ref_id": entry["id"],
                    "category": "wallet",
                    "amount": float(entry["amount"]),
                    "direction": entry.get("direction", "credit"),
                    "status": "completed",
                    "description": entry.get("description", ""),
                    "wallet": entry.get("wallet"),
                    "created_at": entry["created_at"],
                }
            )
        for ex in self.list_exchanges_for_user(user_id):
            rows.append(
                {
                    "id": f"ex-{ex['id']}",
                    "ref_id": ex["id"],
                    "category": "exchange",
                    "amount": float(ex["amount"]),
                    "direction": "transfer",
                    "status": ex["status"],
                    "description": f"Exchange {ex['from_wallet']} → {ex['to_wallet']}",
                    "created_at": ex["created_at"],
                }
            )
        for tr in self.list_wallet_transfers_for_user(user_id):
            outgoing = tr["from_user_id"] == user_id
            peer = tr["to_member_id"] if outgoing else tr["from_member_id"]
            peer_name = tr["to_name"] if outgoing else tr.get("from_name", "")
            rows.append(
                {
                    "id": f"wtr-{tr['id']}",
                    "ref_id": tr["id"],
                    "category": "wallet_transfer",
                    "amount": float(tr["amount"]),
                    "direction": "debit" if outgoing else "credit",
                    "status": tr.get("status", "completed"),
                    "description": (
                        f"Sent to {peer} ({peer_name})"
                        if outgoing
                        else f"Received from {peer} ({peer_name})"
                    ),
                    "wallet": tr.get("wallet"),
                    "created_at": tr["created_at"],
                }
            )
        rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        return rows

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
