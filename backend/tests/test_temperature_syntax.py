import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Say hello deterministically.",
        config=types.GenerateContentConfig(
            temperature=0.0
        )
    )
    print("SUCCESS:", response.text)
except Exception as e:
    print("ERROR:", e)
