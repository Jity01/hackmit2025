#!/usr/bin/env python3
# minimal api: POST /record (blocking), GET /status
# deps: pip install flask

from flask import Flask, request, jsonify
from backend.recorder import record_seconds, status
from backend.services.drive import GoogleDrive
from backend.storage.cloud import CloudStorage

app = Flask(__name__)
drive = GoogleDrive()
cloud = CloudStorage()

@app.get("/status")
def get_status():
    return jsonify(status())

@app.post("/record")
def record():
    data = request.get_json(force=True, silent=True) or {}
    try:
        seconds = data.get("seconds")  # required
        output = data.get("output")    # optional path
        # optional knobs if you want them (safe defaults otherwise)
        fps = int(data.get("fps", 30))
        cursor = bool(data.get("cursor", False))
        device_index = data.get("device_index")  # int or None
        device_index = int(device_index) if device_index is not None else None
        crf = int(data.get("crf", 23))
        preset = data.get("preset", "veryfast")

        res = record_seconds(
            seconds,
            output,
            fps=fps,
            cursor=cursor,
            device_index=device_index,
            crf=crf,
            preset=preset,
        )
        code = 200 if res.get("ok") else 500
        return jsonify(res), code
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except RuntimeError as e:
        return jsonify(error=str(e)), 500
    except Exception as e:
        return jsonify(error=f"unexpected: {e.__class__.__name__}: {e}"), 500


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="127.0.0.1", port=port, debug=False)
