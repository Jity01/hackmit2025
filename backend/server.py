#!/usr/bin/env python3
from flask import Flask, Response, stream_with_context, jsonify, request
from services.drive import GoogleDrive
from storage.cloud import CloudStorage
from services.recorder import record_seconds, status
from services.canvas_extract import extract_and_upload
import os

app = Flask(__name__)
drive = GoogleDrive("")
cloud = CloudStorage()

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

        fps = int(data.get("fps", 30))
        cursor = bool(data.get("cursor", False))
        device_index = data.get("device_index")
        device_index = int(device_index) if device_index is not None else None
        crf = int(data.get("crf", 23))
        preset = data.get("preset", "veryfast")

        bucket = data.get("bucket", os.getenv("KB_BUCKET", "kb"))
        gcs_prefix = data.get("gcs_prefix", "screen_recordings/")

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

@app.post("/canvas/extract")
def canvas_extract():
    data = request.get_json(force=True, silent=True) or {}
    base_url = (data.get("baseUrl") or data.get("base_url") or "").strip()
    access_token = (data.get("accessToken") or data.get("access_token") or "").strip()
    if not base_url or not access_token:
        return jsonify(ok=False, error="baseUrl and accessToken are required"), 400

    bucket = data.get("bucket") or os.getenv("KB_BUCKET", "kb")
    prefix = data.get("prefix") or "course_data/"

    try:
        out = extract_and_upload(base_url, access_token, bucket=bucket, prefix=prefix)
        return jsonify(out), 200
    except PermissionError as e:
        return jsonify(ok=False, error=str(e)), 401
    except Exception as e:
        return jsonify(ok=False, error=f"{e.__class__.__name__}: {e}"), 500

@app.post("/authenticate_drive")
def authenticate_drive():
    try:
        drive.authenticate()
        return jsonify({"authenticated": True}), 200
    except Exception as e:
        return jsonify(error=f"unexpected: {e.__class__.__name__}: {e}"), 500

@app.post("/migrate")
def migrate():
    """migrates all google drive files into cloud storage"""
    filestream_dicts = drive.get_all_files_with_paths()
    cloud.migrate_files(filestream_dicts)
    return jsonify(ok=False, error="not implemented"), 501

@app.post('/vault/directory')
def get_pwd():
    """
    Return folders and files in the present working directory
    """
    try:
        file_folder_dict = cloud.list_files_in_directory()
        return jsonify(file_folder_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.post("/vault/list")
def vault_list():
    """
    list immediate children under a prefix ('' = root).
    returns folders with item counts and files.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        path = (data.get("path") or "").lstrip("/")
        if path and not path.endswith("/"):
            path += "/"

        listing = cloud.list_files_in_directory(path)  # {"files":[...], "folders":[...]}

        # build folder objects with counts of direct children
        folders = []
        for raw in listing.get("folders", []):
            name = raw.rstrip("/").split("/")[-1]
            child_prefix = f"{path}{raw.rstrip('/')}/"
            child_listing = cloud.list_files_in_directory(child_prefix)
            count = len(child_listing.get("files", [])) + len(child_listing.get("folders", []))
            folders.append({"name": name, "path": child_prefix, "count": count})

        files = [{"name": f.split("/")[-1], "path": f"{path}{f}"} for f in listing.get("files", [])]

        return jsonify({"ok": True, "path": path, "folders": folders, "files": files}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.get("/vault/preview")
def vault_preview():
    path = (request.args.get("path") or "").lstrip("/")
    if not path:
        return jsonify({"ok": False, "error": "path is required"}), 400
    try:
        fh, mime, filename = cloud.open_stream(path)

        def generate(chunk=1024 * 512):
            with fh:
                while True:
                    data = fh.read(chunk)
                    if not data:
                        break
                    yield data

        resp = Response(stream_with_context(generate()), mimetype=mime)
        resp.headers["Content-Disposition"] = f'inline; filename="{filename}"'  # <-- no download
        resp.headers["Cache-Control"] = "no-store"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Accept-Ranges"] = "bytes"  # helps video seeking
        return resp
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="127.0.0.1", port=port, debug=False)
