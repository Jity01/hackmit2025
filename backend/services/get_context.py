#!/usr/bin/env python3
# summarize all pdfs under a gcs prefix using openai; concat into one string
# env: OPENAI_KEY (or OPENAI_API_KEY)

import os
from tempfile import SpooledTemporaryFile
from typing import Iterable, List
from dotenv import load_dotenv
from openai import OpenAI
from storage.cloud import CloudStorage

# ---------- helpers ----------
def _join(a: str, b: str) -> str:
    if not a:
        return b
    return a + b if a.endswith("/") else a + "/" + b

def iter_all_paths(cloud: CloudStorage, prefix: str = "") -> Iterable[str]:
    listing = cloud.list_files_in_directory(prefix)
    for name in listing.get("files", []):
        yield _join(prefix, name)
    for folder in listing.get("folders", []):
        sub = _join(prefix, folder)
        if not sub.endswith("/"):
            sub += "/"
        yield from iter_all_paths(cloud, sub)

def _copy_stream_to_spooled(fh, max_mem_mb=64):
    """copy a file-like into a SpooledTemporaryFile (no disk unless big)"""
    out = SpooledTemporaryFile(max_size=max_mem_mb * 1024 * 1024, mode="w+b")
    while True:
        chunk = fh.read(1024 * 1024)
        if not chunk:
            break
        out.write(chunk)
    out.seek(0)
    return out

# ---------- openai summarization ----------
SYS_PROMPT = (
    "you are a precise study-notes writer. read the attached pdf and produce a terse summary "
    "optimized for recall. include: title (if obvious), 6–12 bullet points with key facts, "
    "definitions/terms, formulas/equations, and any deadlines/dates. "
    "omit boilerplate and navigation. keep it under ~180 words. write plain text bullets."
)

def _responses_summarize_file(client: OpenAI, file_id: str, file_path_label: str) -> str:
    """use the responses api with a file attachment"""
    prompt = f"summarize this document. file path: {file_path_label}"
    r = client.responses.create(
        model="gpt-4o-mini",
        instructions=SYS_PROMPT,
        input=[{
            "role": "user",
            "content": [
                {"type": "input_text", "text": prompt},
                {"type": "input_file", "file_id": file_id},
            ],
        }],
        temperature=0.2,
    )

    # robust text extraction across sdk versions
    text = getattr(r, "output_text", None)
    if not text:
        try:
            parts = []
            for msg in getattr(r, "output", []) or []:
                for c in getattr(msg, "content", []) or []:
                    t = getattr(c, "text", None) or (c.get("text") if isinstance(c, dict) else None)
                    if t:
                        parts.append(t)
            text = "\n".join(parts)
        except Exception:
            text = ""
    print("text", text)
    return (text or "").strip()

def _chat_summarize_text(client: OpenAI, text: str, file_path_label: str) -> str:
    """fallback: summarize extracted text via chat completions"""
    snippet = text if len(text) < 120_000 else text[:120_000]
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYS_PROMPT},
            {"role": "user", "content": f"file path: {file_path_label}\n\n{snippet}"}
        ],
        temperature=0.2,
    )
    return (r.choices[0].message.content or "").strip()

def _extract_text_locally(fh) -> str:
    """lightweight local extraction for fallback"""
    try:
        from pdfminer.high_level import extract_text_to_fp
        from io import StringIO
        buf = StringIO()
        fh.seek(0)
        extract_text_to_fp(fh, buf, laparams=None)
        return buf.getvalue()
    except Exception:
        try:
            import PyPDF2
            fh.seek(0)
            reader = PyPDF2.PdfReader(fh)
            return "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception:
            return ""

# ---------- public entry ----------
def build_context(prefix: str = "") -> str:
    """
    walks gcs under `prefix`, summarizes every pdf with openai, concatenates, returns string
    """
    load_dotenv()
    api_key = os.getenv("OPENAI_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("set OPENAI_KEY")

    client = OpenAI(api_key=api_key)
    cloud = CloudStorage()

    summaries: List[str] = []
    path_generator = iter_all_paths(cloud, prefix)

    for i in range(1):
        path = next(path_generator)
        low = path.lower()
        if not low.endswith(".pdf"):
            continue

        # stream from gcs
        try:
            fh, _, _ = getattr(cloud, "open_stream")(path)  # preferred
        except AttributeError:
            fh, _, _ = cloud.preview_file(path)            # fallback

        try:
            # upload to openai files for native doc reading
            spool = _copy_stream_to_spooled(fh)
            spool.seek(0)

            # IMPORTANT: give the upload a real filename with .pdf (and content-type)
            filename = os.path.basename(path) or "document.pdf"
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"

            file_obj = client.files.create(
                file=(filename, spool, "application/pdf"),
                purpose="assistants",
            )

            try:
                summary = _responses_summarize_file(client, file_obj.id, path)
                if not summary:
                    # fallback: local extract + chat summarize
                    spool.seek(0)
                    txt = _extract_text_locally(spool)
                    summary = _chat_summarize_text(client, txt, path) if txt.strip() else ""
            finally:
                try:
                    client.files.delete(file_id=file_obj.id)
                except Exception:
                    pass
                try:
                    spool.close()
                except Exception:
                    pass
        finally:
            try:
                fh.close()
            except Exception:
                pass

        if summary:
            summaries.append(f"[{os.path.basename(path)}]\n{summary}")

    return "\n\n".join(summaries)

if __name__ == "__main__":
    print(build_context(prefix=""))
