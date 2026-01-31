from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
import boto3
import uuid

load_dotenv()  

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

s3 = boto3.client(
    "s3", 
    region_name=os.getenv("AWS_REGION"),
)

#Uploading a video to s3
@app.route("/api/upload-url", methods=["POST"])
def create_upload_url():
    data = request.json or {}
    filename = data.get("filename")
    content_type = data.get("contentType")

    if not filename or not content_type:
        return jsonify({"error": "Missing filename or contentType"}), 400
    
    object_key = f"videos/{uuid.uuid4()}_{filename}"
    presigned_url = s3.generate_presigned_url(
        "put_object", 
        Params={
            "Bucket": os.getenv("AWS_BUCKET_NAME"),
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=600
    )

    return jsonify({
        "uploadUrl": presigned_url, 
        "objectKey": object_key,
    })

#test
@app.route('/test-cors')
def test_cors():
    return jsonify({"message": "CORS is working!"})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    messages = data.get('messages')

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model":"llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 300
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        print("PI status:", response.status_code)
        print("PI response:", response.text)

        if response.status_code != 200:
            return jsonify({
                "error": "Groq API error",
                "details": response.text
            }), 500

        response_json = response.json()

        # 🔐 Defensive parsing (THIS is the fix)
        if (
            "choices" not in response_json or
            not response_json["choices"] or
            "message" not in response_json["choices"][0] or
            "content" not in response_json["choices"][0]["message"]
        ):
            return jsonify({
                "error": "Invalid response format from Groq",
                "raw": response_json
            }), 500

        content = response_json["choices"][0]["message"]["content"]

        return jsonify({"reply": content})

    except Exception as e:
        print("Server error:", str(e))
        return jsonify({"error": "Server exception", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
