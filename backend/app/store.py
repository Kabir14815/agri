"""MongoDB data access layer."""
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from pymongo import ASCENDING, DESCENDING, ReturnDocument
from pymongo.database import Database

from .mlm import default_mlm_stats
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

LEGACY_DEMO_EMAILS = (
    "demo@kgffarming.com",
    "partner@kgffarming.com",
    "farmer@kgffarming.com",
)

# Used when ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set.
DEFAULT_ADMIN_EMAIL = "admin@kgffarming.com"
DEFAULT_ADMIN_PASSWORD = "KgfAdmin@2026"


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

        self._purge_legacy_demo_accounts()
        self._ensure_default_admin()
        self._ensure_env_admin()

        self._safe_ensure_indexes()

    def _safe_ensure_indexes(self) -> None:
        """Create indexes idempotently — silently skip any that already exist with the same specs."""
        from pymongo.errors import OperationFailure

        def idx(collection, keys, **kwargs):
            try:
                collection.create_index(keys, **kwargs)
            except OperationFailure:
                # Index with a conflicting name or different options already exists — leave it.
                pass

        idx(self.db.users, [("email", ASCENDING)], unique=True)
        idx(self.db.users, [("id", ASCENDING)], unique=True)
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
            "interest_penalties",
        ]:
            idx(self.db[name], [("id", ASCENDING)], unique=True)
        idx(self.db.farm_daily_logs, [("user_id", ASCENDING), ("log_date", ASCENDING)], unique=True)
        idx(self.db.farm_daily_logs, [("log_date", DESCENDING)])
        idx(self.db.farm_daily_logs, [("created_at", ASCENDING)])
        idx(self.db.interest_penalties, [("user_id", ASCENDING), ("log_date", ASCENDING)], unique=True)
        idx(self.db.interest_penalties, [("log_date", DESCENDING)])
        idx(self.db.referral_visits, [("code", ASCENDING)])
        idx(self.db.referral_visits, [("visited_at", DESCENDING)])
        idx(self.db.users, [("sponsor_member_id", ASCENDING)])
        idx(self.db.users, [("mlm.member_id", ASCENDING)])
        idx(self.db.users, [("registered_at", DESCENDING)])
        idx(self.db.wallet_transfers, [("from_user_id", ASCENDING)])
        idx(self.db.wallet_transfers, [("to_user_id", ASCENDING)])
        idx(self.db.wallet_transfers, [("created_at", DESCENDING)])
        idx(self.db.wallet_ledger, [("user_id", ASCENDING), ("id", DESCENDING)])
        idx(self.db.wallet_ledger, [("user_id", ASCENDING), ("wallet", ASCENDING)])
        idx(self.db.deposits, [("user_id", ASCENDING)])
        idx(self.db.deposits, [("status", ASCENDING)])
        idx(self.db.deposits, [("created_at", DESCENDING)])
        idx(self.db.contacts, [("submitted_at", DESCENDING)])
        idx(self.db.help_tickets, [("user_id", ASCENDING), ("status", ASCENDING)])
        idx(self.db.exchange_requests, [("user_id", ASCENDING), ("status", ASCENDING)])

    def _purge_legacy_demo_accounts(self) -> None:
        """Remove hardcoded demo accounts from prior deployments."""
        emails = list(LEGACY_DEMO_EMAILS)
        env_admin = os.environ.get("ADMIN_EMAIL", "").strip().lower()
        if env_admin in emails:
            emails.remove(env_admin)

        demo_users = list(
            self.db.users.find({"email": {"$in": emails}}, {"id": 1, "email": 1})
        )
        if not demo_users:
            return

        user_ids = [int(u["id"]) for u in demo_users]
        self.db.users.delete_many({"email": {"$in": emails}})

        for coll, query in (
            (self.db.wallet_ledger, {"user_id": {"$in": user_ids}}),
            (self.db.deposits, {"user_id": {"$in": user_ids}}),
            (self.db.help_tickets, {"user_id": {"$in": user_ids}}),
            (self.db.farm_daily_logs, {"user_id": {"$in": user_ids}}),
            (self.db.exchange_requests, {"user_id": {"$in": user_ids}}),
            (self.db.interest_penalties, {"user_id": {"$in": user_ids}}),
            (
                self.db.wallet_transfers,
                {
                    "$or": [
                        {"from_user_id": {"$in": user_ids}},
                        {"to_user_id": {"$in": user_ids}},
                    ]
                },
            ),
        ):
            coll.delete_many(query)

        print(f"[seed] Removed {len(user_ids)} legacy demo account(s)")

    def _upsert_admin(
        self,
        email: str,
        password: str,
        *,
        full_name: str = "Administrator",
        sync_password: bool = False,
    ) -> None:
        from .passwords import hash_password, needs_rehash

        email = (email or "").strip().lower()
        password = (password or "").strip()
        if not email or not password:
            return

        existing = self.db.users.find_one({"email": email})
        now = datetime.utcnow().isoformat() + "Z"
        hashed = hash_password(password)

        if existing is None:
            user_id = self._next_id(self.db.users)
            self.db.users.insert_one(
                {
                    "id": user_id,
                    "full_name": full_name,
                    "email": email,
                    "phone": os.environ.get("ADMIN_PHONE", "").strip(),
                    "password": hashed,
                    "role": "admin",
                    "registered_at": now,
                    "amount": 0.0,
                    "country": "India",
                }
            )
            print(f"[seed] Created admin account ({email})")
            return

        patch: Dict[str, Any] = {"role": "admin", "full_name": full_name}
        if (
            sync_password
            or needs_rehash(existing.get("password", ""))
            or existing.get("role") != "admin"
        ):
            patch["password"] = hashed
        self.db.users.update_one({"email": email}, {"$set": patch})

    def _ensure_default_admin(self) -> None:
        """Always keep the built-in admin account ready for /admin/login."""
        self._upsert_admin(
            DEFAULT_ADMIN_EMAIL,
            DEFAULT_ADMIN_PASSWORD,
            full_name=os.environ.get("ADMIN_NAME", "Administrator").strip() or "Administrator",
            sync_password=True,
        )

    def _ensure_env_admin(self) -> None:
        """Optional second admin when both ADMIN_EMAIL and ADMIN_PASSWORD are set."""
        email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
        password = os.environ.get("ADMIN_PASSWORD", "").strip()
        if not email or not password:
            return
        if email == DEFAULT_ADMIN_EMAIL:
            return
        if len(password) < 12:
            print("[seed] WARN: ADMIN_PASSWORD should be at least 12 characters")
        self._upsert_admin(
            email,
            password,
            full_name=os.environ.get("ADMIN_NAME", "Administrator").strip() or "Administrator",
            sync_password=False,
        )

    def _ensure_admin_from_env(self) -> None:
        """Backward-compatible alias — prefer _ensure_default_admin + _ensure_env_admin."""
        self._ensure_default_admin()
        self._ensure_env_admin()

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
        email = (email or "").strip().lower()
        if not email:
            return None
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

    def _ledger_has_income_breakdown(self, user_id: int) -> bool:
        for entry in self.list_wallet_ledger(user_id, "income"):
            if entry.get("direction") != "credit":
                continue
            desc = (entry.get("description") or "").lower()
            if (
                "direct bonus" in desc
                or ("level" in desc and "bonus" in desc)
                or "investment return" in desc
            ):
                return True
        return False

    def _income_totals_from_ledger(self, user_id: int) -> dict:
        direct = 0.0
        level = 0.0
        investment = 0.0
        quarters = [0.0, 0.0, 0.0, 0.0]
        year = datetime.utcnow().year
        for entry in self.list_wallet_ledger(user_id):
            if entry.get("direction") != "credit" or entry.get("wallet") != "income":
                continue
            amt = float(entry.get("amount", 0) or 0)
            desc = (entry.get("description") or "").lower()
            if desc.startswith("direct bonus") or "direct bonus" in desc:
                direct += amt
            elif "level" in desc and "bonus" in desc:
                level += amt
            elif "investment return" in desc:
                investment += amt
            try:
                ts = entry.get("created_at") or ""
                if ts[:4] == str(year):
                    month = int(ts[5:7])
                    q = (month - 1) // 3
                    quarters[q] = round(quarters[q] + amt, 2)
            except (ValueError, IndexError):
                pass
        return {
            "direct_income": round(direct, 2),
            "level_income": round(level, 2),
            "investment_interest_total": round(investment, 2),
            "investment_return_income": round(investment, 2),
            "quarterly_earnings": quarters,
        }

    def _wallet_balance_from_ledger(self, user_id: int, wallet: str) -> float:
        balance = 0.0
        for entry in self.list_wallet_ledger(user_id, wallet):
            amt = float(entry.get("amount", 0) or 0)
            if entry.get("direction") == "credit":
                balance += amt
            else:
                balance -= amt
        return round(balance, 2)

    def _penalty_totals_from_db(self, user_id: int) -> dict:
        rows = list(self.db.interest_penalties.find({"user_id": user_id}))
        total = round(sum(float(r.get("net", 0) or 0) for r in rows), 2)
        return {"penalty_total": total, "missed_days": len(rows)}

    def _reset_daily_income_fields_if_new_day(self, stats: dict) -> dict:
        from .farmer_logs import today_utc

        today = today_utc()
        stats = dict(stats)
        if stats.get("income_stats_date") == today:
            return stats
        stats["income_stats_date"] = today
        stats["direct_income_today"] = 0.0
        stats["level_income_today"] = 0.0
        stats["reward_bonus_today"] = 0.0
        stats["salary_bonus_today"] = 0.0
        stats["repurchase_income_today"] = 0.0
        return stats

    def _team_metrics(self, member_id: str, max_depth: int) -> dict:
        from .referral import member_id_from_user
        from .referral_config import is_active_investor

        direct = self.list_direct_referrals(member_id)
        direct_business = round(sum(float(r.get("amount", 0) or 0) for r in direct), 2)
        direct_active = sum(
            1 for r in direct if is_active_investor(float(r.get("amount", 0) or 0))
        )

        team_business = 0.0
        team_count = 0
        if max_depth > 0:
            queue = [(member_id, 0)]
            seen = set()
            while queue:
                mid, depth = queue.pop(0)
                if mid in seen:
                    continue
                seen.add(mid)
                for child in self.list_direct_referrals(mid):
                    cid = member_id_from_user(child)
                    amt = float(child.get("amount", 0) or 0)
                    team_business += amt
                    team_count += 1
                    if depth + 1 < max_depth:
                        queue.append((cid, depth + 1))

        return {
            "subscribers_count": len(direct),
            "direct_active_users": direct_active,
            "direct_business": direct_business,
            "team_business": round(team_business, 2),
            "team_count": team_count,
        }

    # How many seconds must pass before we re-run the full ledger sync.
    _SYNC_COOLDOWN_SECONDS = 30

    def sync_live_mlm_stats(self, user_id: int, force: bool = False) -> dict:
        """Recompute wallets, team & incomes from MongoDB ledger — keeps dashboard dynamic.

        Skips re-computation if the mlm stats were synced less than _SYNC_COOLDOWN_SECONDS
        ago (i.e. rapid successive dashboard loads won't trigger repeated full scans).
        Pass force=True to bypass the cooldown (e.g. after a deposit approval).
        """
        from .accrual_lock import accrual_snapshot
        from .mlm import default_mlm_stats
        from .referral import member_id_from_user
        from .referral_config import level_open_for_package

        user = self.find_user_by_id(user_id)
        if not user:
            raise KeyError("not_found")

        # Cooldown check — skip full recomputation if recently synced.
        if not force:
            mlm_cached = user.get("mlm") or {}
            last_sync = mlm_cached.get("_last_sync_at")
            if last_sync:
                try:
                    elapsed = (datetime.utcnow() - datetime.fromisoformat(last_sync.rstrip("Z"))).total_seconds()
                    if elapsed < self._SYNC_COOLDOWN_SECONDS:
                        return user  # Return cached data — still fresh enough.
                except (ValueError, TypeError):
                    pass

        amount = float(user.get("amount", 0) or 0)
        stats = dict(user.get("mlm") or default_mlm_stats(user_id, amount))
        accrual_saved = accrual_snapshot(stats)
        stats = self._reset_daily_income_fields_if_new_day(stats)

        member_id = stats.get("member_id") or member_id_from_user(user)
        stats["member_id"] = member_id
        stats["package_amount"] = amount
        stats["investment_principal"] = amount
        stats["level_open"] = level_open_for_package(amount)

        ledger = self._income_totals_from_ledger(user_id)
        stats["direct_income"] = ledger["direct_income"]
        stats["level_income"] = ledger["level_income"]
        stats["investment_interest_total"] = ledger["investment_interest_total"]
        stats["investment_return_income"] = ledger["investment_return_income"]
        stats["quarterly_earnings"] = ledger["quarterly_earnings"]

        stats["income_wallet"] = self._wallet_balance_from_ledger(user_id, "income")
        stats["repurchase_wallet"] = self._wallet_balance_from_ledger(user_id, "repurchase")
        stats["topup_wallet"] = self._wallet_balance_from_ledger(user_id, "topup")

        penalties = self._penalty_totals_from_db(user_id)
        stats["interest_penalty_total"] = penalties["penalty_total"]
        stats["interest_missed_days_total"] = penalties["missed_days"]

        team = self._team_metrics(member_id, stats["level_open"] or 1)
        stats["subscribers_count"] = team["subscribers_count"]
        stats["direct_active_users"] = team["direct_active_users"]
        stats["direct_business"] = team["direct_business"]
        stats["team_business"] = team["team_business"]

        stats.update(accrual_saved)

        stats["total_earning"] = round(
            stats["direct_income"]
            + stats["level_income"]
            + stats["investment_interest_total"]
            + float(stats.get("reward_bonus", 0) or 0)
            + float(stats.get("salary_bonus", 0) or 0)
            + float(stats.get("self_unit_profit", 0) or 0),
            2,
        )

        # income_wallet_progress: % of income wallet vs earning limit cap (dynamic)
        limit_total = max(float(stats.get("earning_limit_total") or 0), amount * 10 if amount else 20_000)
        income_bal = float(stats.get("income_wallet", 0) or 0)
        if limit_total > 0:
            stats["income_wallet_progress"] = min(100, int((income_bal / limit_total) * 100))
        else:
            stats["income_wallet_progress"] = 0

        parts = [user.get("city"), user.get("state")]
        if any(parts):
            stats["location"] = ", ".join(p for p in parts if p)

        # Stamp sync time so the cooldown check above can skip re-computation on rapid hits.
        stats["_last_sync_at"] = datetime.utcnow().isoformat() + "Z"

        self.db.users.update_one(
            {"id": user_id},
            {"$set": {"mlm": stats, "amount": amount}},
        )
        return self.find_user_by_id(user_id)

    def prepare_dashboard_user(self, user_id: int) -> dict:
        """Accrue interest, sync wallets/incomes from ledger, return fresh user row."""
        user = self.accrue_investment_interest(user_id)
        if not user:
            raise KeyError("not_found")
        return user

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

        bonus = round(float(bonus), 2)
        label = "Direct" if level == 1 else f"Level {level}"
        self.add_wallet_entry(
            sponsor["id"],
            "income",
            bonus,
            f"{label} bonus 2% from {from_member_id} ({source})",
            "credit",
        )
        user = self.find_user_by_id(sponsor["id"]) or sponsor
        mlm = dict(user.get("mlm") or default_mlm_stats(sponsor["id"], sponsor.get("amount", 0)))
        mlm = self._reset_daily_income_fields_if_new_day(mlm)
        if level == 1:
            mlm["direct_income_today"] = round(float(mlm.get("direct_income_today", 0)) + bonus, 2)
        else:
            mlm["level_income_today"] = round(float(mlm.get("level_income_today", 0)) + bonus, 2)
        self._set_user_mlm_stats(sponsor["id"], mlm)
        self.sync_live_mlm_stats(sponsor["id"])

    def create_user(self, data: dict) -> dict:
        from .passwords import hash_password

        coll = self.db.users
        user = dict(data)
        user["id"] = self._next_id(coll)
        if user.get("email"):
            user["email"] = str(user["email"]).strip().lower()
        user["amount"] = float(user.get("amount", 0) or 0)
        user["password"] = hash_password(data.get("password", ""))
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
        # Persist the member_id immediately so it's always queryable in the DB.
        from .mlm import member_id_for as _mid_for
        if not user["mlm"].get("member_id"):
            user["mlm"]["member_id"] = _mid_for(user["id"])
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
            self.sync_live_mlm_stats(user_id, force=True)
        return serialized

    def verify_user_password(self, user: dict, plain: str) -> bool:
        from .passwords import verify_password

        return verify_password(plain, user.get("password", ""))

    def upgrade_password_hash(self, user_id: int, plain: str) -> None:
        from .passwords import hash_password, needs_rehash

        user = self.find_user_by_id(user_id)
        if not user or not needs_rehash(user.get("password", "")):
            return
        self.db.users.update_one(
            {"id": user_id}, {"$set": {"password": hash_password(plain)}}
        )

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
        if "password" in payload:
            from .passwords import hash_password

            payload["password"] = hash_password(str(payload["password"]))
        result = self.db.users.find_one_and_update(
            {"id": user_id},
            {"$set": payload},
            return_document=True,
        )
        if not result:
            raise KeyError("not_found")
        return self._serialize(result)

    def admin_set_user_role(self, user_id: int, role: str) -> dict:
        if role not in ("customer", "franchisee", "farmer"):
            raise ValueError("invalid_role")
        user = self.find_user_by_id(user_id)
        if not user:
            raise KeyError("not_found")
        if user.get("role") == "admin":
            raise ValueError("cannot_change_admin")
        result = self.db.users.find_one_and_update(
            {"id": user_id},
            {"$set": {"role": role}},
            return_document=True,
        )
        return self._serialize(result)

    def list_users_public(self) -> List[dict]:
        from .referral import member_id_from_user
        from .mlm import member_id_for

        # Single query — no N+1 per user.
        users = self._serialize_many(self.db.users.find())
        for u in users:
            u.pop("password", None)
            u["member_id"] = member_id_from_user(u)

        # Build lookup maps in one pass to resolve sponsor names and referral counts.
        mid_to_name: dict = {u["member_id"]: u.get("full_name", "") for u in users}
        referral_counts: dict = {}  # sponsor_member_id -> count
        for u in users:
            s = (u.get("sponsor_member_id") or "").strip().upper()
            if s:
                referral_counts[s] = referral_counts.get(s, 0) + 1

        for u in users:
            mid = u["member_id"]
            u["direct_referral_count"] = referral_counts.get(mid, 0)
            sponsor_mid = (u.get("sponsor_member_id") or "").strip().upper()
            u["sponsor_name"] = mid_to_name.get(sponsor_mid) if sponsor_mid else None

        users.sort(key=lambda x: x.get("registered_at") or "", reverse=True)
        return users

    def update_user_amount(self, user_id: int, amount: float) -> dict:
        return self.update_user_mlm(user_id, amount=float(amount))

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
        """Audit trail when admin sets investment directly (does not change balance again).
        Also cancels any outstanding pending deposits so they don't clog the pending queue."""
        now = datetime.utcnow().isoformat() + "Z"
        # Cancel all pending deposits for this user (they are superseded by this manual approval)
        self.db.deposits.update_many(
            {"user_id": user_id, "status": "pending"},
            {"$set": {"status": "cancelled", "reviewed_at": now, "note": "Superseded by admin activation"}},
        )
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
        # Atomically claim the pending deposit — prevents double-approval.
        claimed = self.db.deposits.find_one_and_update(
            {"id": deposit_id, "status": "pending"},
            {"$set": {"status": "processing", "reviewed_at": datetime.utcnow().isoformat() + "Z"}},
            return_document=ReturnDocument.AFTER,
        )
        if not claimed:
            dep = self.find_deposit(deposit_id)
            if not dep:
                raise KeyError("not_found")
            # Already approved/rejected — return current state.
            return self.deposit_public(dep)

        dep = self._serialize(claimed)
        user = self.find_user_by_id(dep["user_id"])
        if not user:
            raise KeyError("not_found")
        dep_amount = float(dep["amount"])
        new_amount = float(user.get("amount", 0) or 0) + dep_amount
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
            from .referral_bonus import distribute_investment_bonus, is_active_investor

            if is_active_investor(new_amount):
                distribute_investment_bonus(
                    self, updated, dep_amount, f"deposit_{deposit_id}"
                )
            self.sync_live_mlm_stats(user["id"], force=True)
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
        from .mlm import resolve_mlm_stats

        return resolve_mlm_stats(user)

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

        old_last = (user.get("mlm") or {}).get("interest_last_accrual_date")
        stats = self._get_user_mlm_stats(user)
        stats, summary = self._run_interest_accrual(stats, user)
        if not summary:
            if float(stats.get("package_amount", 0) or user.get("amount", 0) or 0) > 0:
                self._set_user_mlm_stats(user_id, stats)
            return self.sync_live_mlm_stats(user_id)  # cooldown check inside; OK to call

        if old_last is None:
            lock_query: dict = {
                "id": user_id,
                "$or": [
                    {"mlm.interest_last_accrual_date": {"$exists": False}},
                    {"mlm.interest_last_accrual_date": None},
                ],
            }
        else:
            lock_query = {"id": user_id, "mlm.interest_last_accrual_date": old_last}

        updated = self.db.users.find_one_and_update(
            lock_query,
            {"$set": {"mlm": stats}},
            return_document=ReturnDocument.AFTER,
        )
        if not updated:
            return self.find_user_by_id(user_id)

        user = self._serialize(updated)
        if summary.get("penalty_days"):
            self.record_interest_penalties(
                user, summary["penalty_days"], f"accrual_{user_id}_{summary['days']}"
            )
        if summary["net"] > 0:
            self.add_wallet_entry(
                user_id,
                "income",
                summary["net"],
                (
                    f"Investment return ({summary['credited_days']} day"
                    f"{'s' if summary['credited_days'] != 1 else ''}): "
                    f"gross Rs {summary['gross']:.2f}, TDS Rs {summary['tds']:.2f}, "
                    f"net Rs {summary['net']:.2f}"
                ),
                "credit",
            )
        return self.sync_live_mlm_stats(user_id, force=True)  # new credits posted — must sync

    def _run_interest_accrual(self, stats: dict, user: dict):
        from .investment_interest import accrue_through_today

        def checker(d):
            return self.has_compliant_daily_log(user["id"], d)

        return accrue_through_today(
            stats, float(user.get("amount", 0) or 0), daily_log_checker=checker
        )

    def has_compliant_daily_log(self, user_id: int, log_date) -> bool:
        """True when member uploaded a crop photo for this UTC date.

        A purged image (image_purged_at set) is still considered compliant because
        the photo was genuinely uploaded on that day — purging is a scheduled cleanup.
        An empty/missing image is non-compliant.
        """
        from datetime import date as date_cls

        if isinstance(log_date, date_cls):
            key = log_date.isoformat()
        else:
            key = str(log_date)[:10]
        record = self.get_farm_log_for_date(user_id, key)
        if not record:
            return False
        # Photo is present (not yet purged)
        if record.get("image_data"):
            return True
        # Photo was uploaded and later purged by retention policy — still compliant
        if record.get("image_purged_at") and int(record.get("image_size_bytes", 0) or 0) > 0:
            return True
        return False

    def record_interest_penalties(
        self, user: dict, penalty_days: list, batch_id: str
    ) -> None:
        if not penalty_days:
            return
        from .referral import member_id_from_user

        member_id = member_id_from_user(user)
        now = datetime.utcnow().isoformat() + "Z"
        for row in penalty_days:
            log_date = row["log_date"]
            existing = self.db.interest_penalties.find_one(
                {"user_id": user["id"], "log_date": log_date}
            )
            if existing:
                continue
            self.db.interest_penalties.insert_one(
                {
                    "id": self._next_id(self.db.interest_penalties),
                    "user_id": user["id"],
                    "member_id": member_id,
                    "full_name": user.get("full_name", ""),
                    "log_date": log_date,
                    "gross": row["gross"],
                    "tds": row["tds"],
                    "net": row["net"],
                    "reason": "no_daily_photo",
                    "batch_id": batch_id,
                    "created_at": now,
                }
            )

    def list_interest_penalties_for_user(self, user_id: int, limit: int = 30) -> List[dict]:
        cursor = (
            self.db.interest_penalties.find({"user_id": user_id})
            .sort("log_date", DESCENDING)
            .limit(limit)
        )
        return self._serialize_many(cursor)

    def list_all_interest_penalties(self, limit: int = 300) -> List[dict]:
        cursor = (
            self.db.interest_penalties.find().sort("log_date", DESCENDING).limit(limit)
        )
        return self._serialize_many(cursor)

    def interest_penalty_summary_for_user(self, user_id: int) -> dict:
        rows = list(
            self.db.interest_penalties.find({"user_id": user_id}).sort("log_date", DESCENDING)
        )
        total = round(sum(float(r.get("net", 0) or 0) for r in rows), 2)
        return {"count": len(rows), "total_net": total}

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
        uid = user["id"]
        return {
            "income": self._wallet_balance_from_ledger(uid, "income"),
            "repurchase": self._wallet_balance_from_ledger(uid, "repurchase"),
            "topup": self._wallet_balance_from_ledger(uid, "topup"),
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
        balance = self._wallet_balance_from_ledger(from_user_id, wallet)
        if balance < amount:
            raise ValueError("insufficient_balance")

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
        self.sync_live_mlm_stats(from_user_id)
        self.sync_live_mlm_stats(recipient["id"])
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
        # Atomically claim the pending request — prevents double-approval.
        claimed = self.db.exchange_requests.find_one_and_update(
            {"id": exchange_id, "status": "pending"},
            {"$set": {"status": "processing", "reviewed_at": datetime.utcnow().isoformat() + "Z"}},
            return_document=ReturnDocument.AFTER,
        )
        if not claimed:
            ex = self.find_exchange(exchange_id)
            if not ex:
                raise KeyError("not_found")
            return ex

        ex = self._serialize(claimed)
        user = self.find_user_by_id(ex["user_id"])
        if not user:
            raise KeyError("not_found")
        from_w = ex["from_wallet"]
        to_w = ex["to_wallet"]
        amount = float(ex["amount"])
        if from_w not in self.WALLET_FIELDS or to_w not in self.WALLET_FIELDS:
            self.set_exchange_status(exchange_id, "rejected")
            raise ValueError("invalid_wallet")
        balance = self._wallet_balance_from_ledger(user["id"], from_w)
        if balance < amount:
            self.set_exchange_status(exchange_id, "rejected")
            raise ValueError("insufficient_balance")
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
        self.sync_live_mlm_stats(user["id"], force=True)
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
