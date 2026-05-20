"""MongoDB connection for KGF Farming API."""
import os
from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database

_client: Optional[MongoClient] = None
_db: Optional[Database] = None

DB_NAME = os.environ.get("MONGODB_DB_NAME", "kgf_farming")


def get_database() -> Database:
    global _client, _db
    if _db is not None:
        return _db

    uri = os.environ.get("MONGODB_URI", "").strip()
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is not set. Add it to backend/.env or Render environment variables."
        )

    _client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    _client.admin.command("ping")
    _db = _client[DB_NAME]
    return _db


def close_database() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
