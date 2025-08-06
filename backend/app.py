from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()  

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
