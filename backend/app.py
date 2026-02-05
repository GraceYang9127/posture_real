from flask import Flask, request, jsonify, Response
from queue import Queue
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
import boto3
import uuid
import tempfile
import subprocess
import sys
import json
import threading
from datetime import datetime

sys.stdout.reconfigure(line_buffering=True)
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# ---------- GLOBALS ----------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AWS_BUCKET = os.getenv("AWS_BUCKET_NAME")

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))

analysis_events = {}

# ---------- DOWNLOAD URL ----------
@app.route("/api/download-url", methods=["POST", "OPTIONS"])
def create_download_url():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json or {}
    user_id = data.get("userId")
    object_key = data.get("key")

    if not user_id or not object_key:
        return jsonify({"error": "Missing userId or key"}), 400

    allowed_prefixes = [
        f"videos/{user_id}/",
        f"analysis/{user_id}/",
    ]

    if not any(object_key.startswith(p) for p in allowed_prefixes):
        return jsonify({"error": "Unauthorized"}), 403

    download_url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": AWS_BUCKET,
            "Key": object_key,
        },
        ExpiresIn=600,
    )

    return jsonify({ "downloadUrl": download_url })


# ---------- UPLOAD URL ----------
@app.route("/api/upload-url", methods=["POST"])
def create_upload_url():
    data = request.json or {}
    user_id = data.get("userId")
    filename = data.get("filename")
    content_type = data.get("contentType")

    if not user_id or not filename or not content_type:
        return jsonify({"error": "Missing fields"}), 400

    video_id = str(uuid.uuid4())
    object_key = f"videos/{user_id}/{video_id}_{filename}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": AWS_BUCKET,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=600,
    )

    return jsonify({
        "uploadUrl": upload_url,
        "objectKey": object_key,
    })


# ---------- BACKGROUND ANALYSIS ----------
def run_analysis_async(user_id, s3_key, instrument, title):
    try:
        local_video = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.mp4")
        local_json = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.json")

        s3.download_file(AWS_BUCKET, s3_key, local_video)

        script_path = os.path.join(
            os.path.dirname(__file__),
            "analysis",
            "analyze_video.py",
        )

        subprocess.run(
            [sys.executable, script_path, local_video, instrument, local_json],
            check=True,
        )

        video_id = s3_key.split("/")[-1].split("_")[0]
        analysis_key = f"analysis/{user_id}/{video_id}.json"

        with open(local_json, "r") as f:
            analysis = json.load(f)

        analysis.update({
            "title": title or "Untitled Video",
            "videoKey": s3_key,
            "analysisKey": analysis_key,
            "created_at": datetime.utcnow().isoformat(),
        })

        with open(local_json, "w") as f:
            json.dump(analysis, f, indent=2)

        s3.upload_file(
            local_json,
            AWS_BUCKET,
            analysis_key,
            ExtraArgs={"ContentType": "application/json"},
        )

        q = analysis_events.setdefault(user_id, Queue())
        q.put({
            "type": "analysis_complete",
            "videoKey": s3_key,
            "analysisKey": analysis_key,
            "title": analysis["title"],
        })

        print("✅ Analysis complete:", analysis_key)

    except Exception as e:
        print("❌ Background analysis failed:", e)


# ---------- START ANALYSIS ----------
@app.route("/api/analyze-after-upload", methods=["POST"])
def analyze_after_upload():
    data = request.json or {}
    user_id = data.get("userId")
    s3_key = data.get("s3Key")
    instrument = data.get("instrument", "unknown")
    title = data.get("videoTitle", "Untitled Video")

    if not user_id or not s3_key:
        return jsonify({"error": "Missing fields"}), 400

    threading.Thread(
        target=run_analysis_async,
        args=(user_id, s3_key, instrument, title),
        daemon=True,
    ).start()

    return jsonify({"status": "analysis_started"}), 202


# ---------- HISTORY ----------
@app.route("/api/history", methods=["POST"])
def history():
    data = request.json or {}
    user_id = data.get("userId")
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    resp = s3.list_objects_v2(
        Bucket=AWS_BUCKET,
        Prefix=f"analysis/{user_id}/",
    )

    rows = []
    for obj in resp.get("Contents", []):
        key = obj["Key"]
        if not key.endswith(".json"):
            continue

        analysis = json.loads(
            s3.get_object(Bucket=AWS_BUCKET, Key=key)["Body"].read()
        )

        rows.append({
            "title": analysis.get("title"),
            "videoKey": analysis.get("videoKey"),
            "analysisKey": key,
            "createdAt": analysis.get("created_at"),
            "instrument": analysis.get("instrument"),
            "overallScore": analysis.get("overall_score"),
            "poseCoverage": (analysis.get("metrics") or {}).get("pose_coverage"),
        })

    rows.sort(key=lambda r: r["createdAt"] or "", reverse=True)
    return jsonify(rows)


# ---------- SSE STREAM ----------
@app.route("/api/analysis-events/<user_id>")
def analysis_events_stream(user_id):
    q = analysis_events.setdefault(user_id, Queue())

    def stream():
        while True:
            event = q.get()
            yield f"data: {json.dumps(event)}\n\n"

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    app.run(debug=True)
