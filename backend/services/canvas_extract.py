# services/canvas_extract.py
from datetime import datetime
import os, re, tempfile
from typing import Any, Dict, Iterable, List, Tuple
from services.canvas_client import CanvasClient
from services.data_extractor import CanvasDataExtractor
from storage.cloud import CloudStorage

PDF_CTS = {
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "applications/vnd.pdf",
    "text/pdf",
    "text/x-pdf",
}

def _is_pdf(meta: Dict[str, Any]) -> bool:
    ct = (meta.get("content-type") or meta.get("content_type") or "").lower()
    name = (meta.get("display_name") or meta.get("filename") or meta.get("name") or "")
    return (ct in PDF_CTS) or name.lower().endswith(".pdf")

def _safe_name(s: str) -> str:
    s = (s or "").strip().replace(" ", "_")
    return re.sub(r"[^A-Za-z0-9._-]+", "", s) or "file.pdf"

def _download_pdf(session, url: str) -> str:
    with session.get(url, stream=True, allow_redirects=True, timeout=60) as r:
        r.raise_for_status()
        fd, path = tempfile.mkstemp(prefix="kb_pdf_", suffix=".pdf")
        with os.fdopen(fd, "wb") as out:
            for chunk in r.iter_content(1024 * 1024):
                if chunk:
                    out.write(chunk)
        return path

def _pdf_candidates_from_manifest(manifest: Dict[str, Any], client: CanvasClient) -> Iterable[Tuple[str, str, str]]:
    """
    yield (course_id, filename, url)
    priority: per-course files; then generic scan for .pdf links anywhere in course data
    """
    courses = manifest.get("courses_list") or []
    courses_data = manifest.get("courses_data") or {}

    # 1) per-course files (most reliable)
    for c in courses:
        cid = str(c.get("id"))
        files = (courses_data.get(cid, {}) or {}).get("files") or []
        for f in files:
            if f.get("locked_for_user") or f.get("locked"):
                continue
            if not _is_pdf(f):
                continue
            url = f.get("url") or f.get("download_url") or f.get("href")
            if not url:
                fid = f.get("id")
                if not fid:
                    continue
                # canonical fallback
                url = f"{client.base_url}/api/v1/files/{fid}/?download=1"
            name = _safe_name(f.get("display_name") or f.get("filename") or f"file_{f.get('id','')}.pdf")
            yield (cid, name, url)

    # 2) fallback: scan all course_data objects for .pdf-looking links
    def walk(obj: Any, cid="misc"):
        if isinstance(obj, dict):
            for k in ("url", "download_url", "html_url", "href"):
                v = obj.get(k)
                if isinstance(v, str) and ".pdf" in v.lower():
                    name = _safe_name(obj.get("display_name") or obj.get("filename") or "file.pdf")
                    yield (str(cid), name, v)
            for v in obj.values():
                yield from walk(v, cid)
        elif isinstance(obj, list):
            for it in obj:
                yield from walk(it, cid)

    for cid, data in courses_data.items():
        yield from walk(data, cid)

def extract_and_upload(base_url: str, access_token: str, *, bucket: str = "kb", prefix: str = "course_data/"):
    """
    pull canvas data, find *all* pdf links, upload each as its own object in GCS.
    returns summary; no json manifest saved.
    """
    client = CanvasClient(base_url, (access_token or "").strip())
    manifest = CanvasDataExtractor(client).extract_all_data()

    cs = CloudStorage(bucket)
    uploaded: List[str] = []
    seen: set[str] = set()

    for cid, name, url in _pdf_candidates_from_manifest(manifest, client):
        if not url or url in seen:
            continue
        seen.add(url)

        tmp = None
        try:
            tmp = _download_pdf(client.session, url)
            # keep flat under course_data/, prefix filenames with course id to avoid collisions
            dest = f"{prefix.rstrip('/')}/{cid}_{name}"
            with open(tmp, "rb") as fh:
                cs.upload_file(fh, dest, "application/pdf")
            uploaded.append(dest)
        except Exception:
            # skip failures; keep going
            pass
        finally:
            if tmp:
                try: os.remove(tmp)
                except Exception: pass

    return {"ok": True, "pdfs_uploaded": len(uploaded), "prefix": prefix.rstrip("/")}
