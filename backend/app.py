from flask import Flask, request, jsonify
import requests
import os


app = Flask(__name__)


GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@app.route('/get_blurb', methods=['POST'])
def get_blurb():
   data = request.json
   instrument = data.get('instrument', '')


   prompt = f"Give a short, helpful paragraph about the correct posture and how to correctly play the {instrument}."


   headers = {
       "Authorization": f"Bearer {GROQ_API_KEY}",
       "Content-Type": "application/json"
   }


   payload = {
       "model": "mixtral-8x7b-32768",
       "messages": [
           {"role": "user", "content": prompt}
       ],
       "temperature": 0.7,
       "max_tokens": 150
   }


   response = requests.post(
       "https://api.groq.com/openai/v1/chat/completions",
       headers=headers,
       json=payload
   )


   if response.status_code == 200:
       content = response.json()['choices'][0]['message']['content']
       return jsonify({'blurb': content})
   else:
       return jsonify({'error': 'API call failed', 'details': response.text}), 500


if __name__ == '__main__':
   app.run(debug=True)
