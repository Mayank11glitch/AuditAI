import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    models = client.models.list()
    # Or actually the new SDK might not have .list() directly, let's just try generating content with gemini-2.0-flash
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Hello"
    )
    print("gemini-2.0-flash works:", response.text)
except Exception as e:
    print("Error with gemini-2.0-flash:", e)

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Hello"
    )
    print("gemini-2.0-flash works:", response.text)
except Exception as e:
    print("Error with gemini-2.0-flash:", e)

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello"
    )
    print("gemini-2.5-flash works:", response.text)
except Exception as e:
    print("Error with gemini-2.5-flash:", e)

