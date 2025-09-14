#!/usr/bin/env python3
# mac full-screen recorder (avfoundation) as a small library
# deps: pip install pyobjc ; brew install ffmpeg

import os, shutil, subprocess
from datetime import datetime
from typing import Optional, Dict, Any
from AppKit import NSScreen

_last_result: Optional[Dict[str, Any]] = None  # for /status

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
    return best_i  # ns index → avfoundation device = 1 + this

def _ensure_dir(path: str) -> str:
    d = os.path.dirname(os.path.abspath(path)) or "."
    os.makedirs(d, exist_ok=True)
    return path

def record_seconds(
    seconds: int,
    output: Optional[str] = None,
    *,
    fps: int = 30,
    cursor: bool = False,
    device_index: Optional[int] = None,
    crf: int = 23,
    preset: str = "veryfast",
) -> Dict[str, Any]:
    """blocking: records full screen for `seconds`, returns result dict"""
    global _last_result

    if seconds is None or int(seconds) <= 0:
        raise ValueError("seconds must be a positive integer")
    seconds = int(seconds)

    if not ffmpeg_path():
        raise RuntimeError("ffmpeg not found (try: brew install ffmpeg)")

    if device_index is None:
        device_index = 1 + _pick_largest_screen_index()

    if not output:
        output = f"fullrec_{datetime.now().strftime('%Y%m%d-%H%M%S')}.mp4"
    output = _ensure_dir(output)

    cmd = ["ffmpeg", "-y", "-hide_banner", "-nostdin",
           "-f", "avfoundation", "-framerate", str(fps)]
    if cursor:
        cmd += ["-capture_cursor", "1", "-capture_mouse_clicks", "1"]
    cmd += ["-i", f"{device_index}:none",
            "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-t", str(seconds),
            output]

    # run quietly and wait
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    size = os.path.getsize(output) if os.path.exists(output) else 0

    _last_result = {
        "ok": (res.returncode == 0 and size > 0),
        "returncode": res.returncode,
        "output": output,
        "seconds": seconds,
        "device_index": device_index,
        "fps": fps,
        "cursor": cursor,
        "size_bytes": size,
        "ended_at": datetime.utcnow().isoformat() + "Z",
    }
    return dict(_last_result)

def status() -> Dict[str, Any]:
    return {
        "ok": True,
        "ffmpeg": bool(ffmpeg_path()),
        "last_result": _last_result,
    }
