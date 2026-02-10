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
from advice import generate_advice
from ml.inference import predict_posture

sys.stdout.reconfigure(line_buffering=True)
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# ---------- GLOBALS ----------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AWS_BUCKET = os.getenv("AWS_BUCKET_NAME")

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))

analysis_events = {}

# ---------- CHAT (Groq) ----------
# Communication between frontend and Groq API
@app.route("/chat", methods=["POST", "OPTIONS"])
@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    # CORS Preflight
    if request.method == "OPTIONS":
        return "", 200
    
    # Validate API Key
    if not GROQ_API_KEY:
        return jsonify({"error": "Missing GROQ_API_KEY in backend .env"}), 500
    data = request.get_json(silent=True) or {}
    messages = data.get("messages")

    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({"error": "messages must be a non-empty list"}), 400
    # External API config (Groq-compatible OpenAI endpoint)
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "messages": messages,
        "temperature": 0.4,
    }

    try:
        # synch API call, with protection for timeout
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        if not r.ok:
            return jsonify({"error": "Groq request failed", "details": r.text}), 500
        # Extract generated response from LLM
        out = r.json()
        reply = out["choices"][0]["message"]["content"]
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": "Chat server error", "details": str(e)}), 500


# ---------- DOWNLOAD URL ----------
@app.route("/api/download-url", methods=["POST", "OPTIONS"])
def create_download_url():
    """
    Issues a presigned download URL for S3 objects

    Ensures: 
    - Users can only access their own videos and analyses
    - Frontend downloads files directly from S3
    - Backend remains stateless
    """
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
    """
    Issues a short-lived presigned S3 upload URL

    Backend: 
    - Validates request metadata
    - Determines correct S3 object path
    - Never recieves the file directly
    """
    data = request.json or {}
    user_id = data.get("userId")
    filename = data.get("filename")
    content_type = data.get("contentType")

    if not user_id or not filename or not content_type:
        return jsonify({"error": "Missing fields"}), 400
    #generate unique Id for video
    video_id = str(uuid.uuid4())
    #Store videos in user-scoped namespaces
    object_key = f"videos/{user_id}/{video_id}_{filename}"
    # Presigned URL allows client to PUT directly into S3
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
    """
    Background worker that 
    - Downloads video from S3
    - Runs pose + ML analysis
    - Stores results back in S3
    """
    try:
        # Create temporary local paths for processing
        local_video = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.mp4")
        local_json = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.json")

        # Download uploaded video from S3
        s3.download_file(AWS_BUCKET, s3_key, local_video)

        # Run analysis script (pose extraction)
        script_path = os.path.join(
            os.path.dirname(__file__),
            "analysis",
            "analyze_video.py",
        )

        subprocess.run(
            [sys.executable, script_path, local_video, instrument, local_json],
            check=True,
        )

        # Derive analysis storage key
        video_id = s3_key.split("/")[-1].split("_")[0]
        analysis_key = f"analysis/{user_id}/{video_id}.json"

        # Load analysis output
        with open(local_json, "r") as f:
            analysis = json.load(f)
        
        # ---- ML prediction (supplementary) ----
        try:
            analysis["ml"] = predict_posture(analysis["feature_vector"])
        except Exception as e:
            print("[ML] Prediction failed:", e)
            analysis["ml"] = {
                "error": "ml_prediction_failed"
            }


        # ---- Generate personalized advice (CORRECT ORDER) ----
        metrics = analysis.get("metrics", {})
        analysis["advice"] = generate_advice(metrics)

        # Attach metadata for downstream use
        analysis.update({
            "title": title or "Untitled Video",
            "videoKey": s3_key,
            "analysisKey": analysis_key,
            "instrument": instrument,
            "created_at": datetime.utcnow().isoformat(),
        })

        # ---- Save updated JSON ----
        with open(local_json, "w") as f:
            json.dump(analysis, f, indent=2)

        # ---- Upload analysis ----
        s3.upload_file(
            local_json,
            AWS_BUCKET,
            analysis_key,
            ExtraArgs={"ContentType": "application/json"},
        )

        # ---- Notify SSE listeners ----
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
    """
    Triggered after a successful S3 upload

    This endpoint: 
    - Records metadata (no video data)
    - Launches analysis asynchronously
    - Returns immediately, to not block frontend
    """
    data = request.json or {}
    user_id = data.get("userId")
    s3_key = data.get("s3Key")
    instrument = data.get("instrument", "unknown")
    title = data.get("videoTitle", "Untitled Video")

    if not user_id or not s3_key:
        return jsonify({"error": "Missing fields"}), 400
    # Run analysis in a background thread
    threading.Thread(
        target=run_analysis_async,
        args=(user_id, s3_key, instrument, title),
        daemon=True,
    ).start()
    # Respond immediately so frontend remains responsive
    return jsonify({"status": "analysis_started"}), 202


# ---------- HISTORY ----------
@app.route("/api/history", methods=["POST"])
def history():
    """
    Returns a user's analysis hsitory

    - Lists analysis JSON file in S3
    - Extracts lightweight metadata only
    - Avoids sending large files to the client
    """
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
            "mlLabel": analysis.get("ml", {}).get("label"),
            "mlConfidence": analysis.get("ml", {}).get("confidence"),

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

# ---------- DELETE VIDEO + ANALYSIS ----------
@app.route("/api/delete-video", methods=["POST"])
def delete_video():
    data = request.get_json()
    user_id = data.get("userId")
    video_id = data.get("videoId")

    if not user_id or not video_id:
        return jsonify({"error": "Missing userId or videoId"}), 400

    s3 = boto3.client("s3")

    video_key = f"videos/{user_id}/{video_id}.mp4"
    analysis_key = f"analysis/{user_id}/{video_id}.json"

    try:
        s3.delete_object(Bucket=AWS_BUCKET, Key=video_key)
        s3.delete_object(Bucket=AWS_BUCKET, Key=analysis_key)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
