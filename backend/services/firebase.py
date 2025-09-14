# pip install firebase-admin
import os
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "/Users/jity/Desktop/hackmit2025/backend/services/service-account.json"))
    firebase_admin.initialize_app(cred)
db = firestore.client()
COL = "companies"

def add_row(data: dict, doc_id: str | None = None) -> str:
    """add one row (document) to companies; returns doc id"""
    ref = db.collection(COL).document(doc_id) if doc_id else db.collection(COL).document()
    ref.set(data)
    return ref.id

def get_all_rows() -> list[dict]:
    """get all rows (documents) from companies"""
    return [{"id": d.id, **d.to_dict()} for d in db.collection(COL).stream()]


# # try:
# #     add_row({"name":"google","description":"search engine","permitted":True})
# # except PermissionError as e:
# #     print("permission error:", e)

# import json, os, pathlib
# p=os.getenv("FIREBASE","/Users/jity/Desktop/hackmit2025/backend/services/service-account.json")
# j=json.load(open(p))
# assert j.get("type")=="service_account", f"bad key type: {j.get('type')}"
# assert "private_key" in j and "PRIVATE KEY" in j["private_key"], "missing/garbled private_key"
# print("ok key for project:", j["project_id"], "email:", j["client_email"])
