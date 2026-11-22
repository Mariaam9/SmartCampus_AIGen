import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

response = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": "Bonjour ! Présente-toi brièvement en français."}
        ],
        "temperature": 0.3,
        "max_tokens": 200
    },
    timeout=60
)

print("Status:", response.status_code)
print(response.json())