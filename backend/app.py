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
    data = request.json
    print("Received data:", data.get('messages', []))  # Debugging 
    messages = data.get('messages', [])

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 300
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=payload
    )
    
    #debugging
    print("PI status:", response.status_code
          )
    print("PI response:", response.text)

    if response.status_code == 200:
        content = response.json()['choices'][0]['message']['content']
        return jsonify({'reply': content})
    else:
        return jsonify({'error': 'API call failed', 'details': response.text}), 500


if __name__ == '__main__':
    app.run(debug=True)
