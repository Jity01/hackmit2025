#!/usr/bin/env python3
from flask import Flask, request, jsonify
from recorder import record_seconds, status

app = Flask(__name__)

@app.get("/status")
def get_status():
    return jsonify(status())

@app.post("/record")
def record():
    data = request.get_json(force=True, silent=True) or {}
    try:
        seconds = data.get("seconds")
        if seconds is None:
            return jsonify(error="seconds is required"), 400

        # optional knobs
        fps = int(data.get("fps", 30))
        cursor = bool(data.get("cursor", False))
        device_index = data.get("device_index")
        device_index = int(device_index) if device_index is not None else None
        crf = int(data.get("crf", 23))
        preset = data.get("preset", "veryfast")

        # gcs options (optional)
        bucket = data.get("bucket", "kb")
        gcs_prefix = data.get("gcs_prefix", "screen_recordings/")

        # NOTE: 'output' is ignored now (no local files)
        res = record_seconds(
            int(seconds),
            bucket=bucket,
            gcs_prefix=gcs_prefix,
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

@app.post("/authenticate_drive")
def authenticate_drive():
    return jsonify(ok=False, error="not implemented"), 501

@app.post("/upload")
def upload():
    return jsonify(ok=False, error="not implemented"), 501

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="127.0.0.1", port=port, debug=False)
