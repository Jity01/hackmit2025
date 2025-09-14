import os, re, shutil, subprocess, mimetypes, tempfile
from datetime import datetime
from typing import Optional, Dict, Any
from AppKit import NSScreen
from storage.cloud import CloudStorage  # your existing wrapper

_last_result: Optional[Dict[str, Any]] = None

def ffmpeg_path() -> Optional[str]:
    return shutil.which("ffmpeg")

def _pick_largest_screen_index() -> int:
    best_i, best_area = 0, -1
    for i, s in enumerate(NSScreen.screens()):
        f = s.frame()
        scale = s.backingScaleFactor()
        area = f.size.width * f.size.height * scale * scale
        if area > best_area:
            best_i, best_area = i, area
    return best_i

def _avf_screen_device_for_ns_index(ns_idx: int) -> Optional[int]:
    p = subprocess.run(
        ["ffmpeg", "-f", "avfoundation", "-list_devices", "true", "-i", ""],
        capture_output=True, text=True
    )
    txt = (p.stderr or "") + (p.stdout or "")
    matches = re.findall(r"\[(\d+)\]\s+Capture screen\s+(\d+)", txt)
    for dev_idx, label_idx in matches:
        if int(label_idx) == int(ns_idx):
            return int(dev_idx)
    return int(matches[0][0]) if matches else None

# ---- upload via your working wrapper, then delete local ----
def _upload_to_gcs(local_path: str, *, bucket: str, prefix: str) -> str:
    cs = CloudStorage()
    basename = os.path.basename(local_path)
    dest = f"{prefix.rstrip('/')}/{basename}"
    mime = mimetypes.guess_type(local_path)[0] or "video/mp4"
    with open(local_path, "rb") as f:
        file_dict = {'stream': f, 'name': basename, 'mimeType': mime, 'full_path': dest, 'folder_path': f"{prefix.rstrip('/')}/"}
        cs.upload_file(file_dict)
    return dest

def record_seconds(
    seconds: int,
    output: Optional[str] = None,         # accepted but ignored (back compat)
    *,
    bucket: str = "kb",
    gcs_prefix: str = "screen_recordings/",
    fps: int = 30,
    cursor: bool = False,
    device_index: Optional[int] = None,
    crf: int = 23,
    preset: str = "veryfast",
) -> Dict[str, Any]:
    """record to a temp file, upload to gcs, then delete the temp file."""
    global _last_result
    if seconds is None or int(seconds) <= 0:
        raise ValueError("seconds must be a positive integer")
    seconds = int(seconds)
    if not ffmpeg_path():
        raise RuntimeError("ffmpeg not found (try: brew install ffmpeg)")

    if device_index is None:
        ns_idx = _pick_largest_screen_index()
        mapped = _avf_screen_device_for_ns_index(ns_idx)
        device_index = mapped if mapped is not None else 1

    # temp file path in /tmp
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    tmp = tempfile.NamedTemporaryFile(prefix=f"fullrec_{ts}_", suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.close()

    cmd = ["ffmpeg", "-y", "-hide_banner", "-nostdin",
           "-f", "avfoundation", "-framerate", str(fps)]
    if cursor:
        cmd += ["-capture_cursor", "1", "-capture_mouse_clicks", "1"]
    cmd += ["-i", f"{device_index}:none",
            "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-t", str(seconds),
            tmp_path]

    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    ok_local = (res.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0)

    gcs_path, gcs_ok, gcs_error = None, False, None
    size_bytes = os.path.getsize(tmp_path) if os.path.exists(tmp_path) else 0
    if ok_local:
        try:
            gcs_path = _upload_to_gcs(tmp_path, bucket=bucket, prefix=gcs_prefix)
            gcs_ok = True
        except Exception as e:
            gcs_error = f"{e.__class__.__name__}: {e}"
    # always delete local unless explicitly kept for debugging
    if os.environ.get("KB_KEEP_LOCAL", "0") != "1":
        try: os.remove(tmp_path)
        except Exception: pass

    _last_result = {
        "ok": bool(ok_local and gcs_ok),
        "returncode": res.returncode,
        "local_path": None,                # deleted
        "gcs_path": gcs_path,
        "seconds": seconds,
        "device_index": device_index,
        "fps": fps,
        "cursor": cursor,
        "size_bytes": size_bytes,
        "gcs_ok": gcs_ok,
        "gcs_error": gcs_error,
        "stderr_tail": "\n".join((res.stderr or "").splitlines()[-10:]),
        "ended_at": datetime.utcnow().isoformat() + "Z",
    }
    return dict(_last_result)

def status() -> Dict[str, Any]:
    return {"ok": True, "ffmpeg": bool(ffmpeg_path()), "last_result": _last_result}
