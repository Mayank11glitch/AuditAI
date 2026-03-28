import os
import google.generativeai as genai
from dotenv import load_dotenv  # pyre-ignore[21]
from utils.ai_helpers import safe_json  # pyre-ignore[21]
from utils.sample_data import SAMPLE_RULES  # pyre-ignore[21]

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.5-flash")


async def run(text: str) -> list:
    """
    Agent 2 — Rule Extraction Agent
    Reads the official GST rules document and extracts compliance rules dynamically.
    """
    print("\n" + "="*60)
    print("🤖 [AGENT 2: RULE ENGINE] - Extracting Compliance Rules...")
    print("="*60 + "\n", flush=True)
    
    rule_doc_path = os.path.join(os.path.dirname(__file__), "..", "data", "gst_rules_2026.txt")
    try:
        with open(rule_doc_path, "r", encoding="utf-8") as f:
            doc_text = f.read()
    except Exception as e:
        print(f"   ❌ Agent 2 error reading rules document: {e} — using sample data")
        return SAMPLE_RULES

    prompt = f"""
You are a financial compliance expert for Indian businesses.
Extract the Top 15 most critical GST compliance rules from the comprehensive document below.
Make sure to include a balanced mix of HIGH, MEDIUM, and LOW severity rules to provide comprehensive coverage.
Do NOT return more than 15 rules. It is critical that the output array contains exactly 15 or fewer items to ensure fast processing.

Return ONLY a valid JSON array. No explanation. No markdown fences. Just the array.

Every item in the array must have EXACTLY these fields:
- id         (integer, start from 1, increment by 1)
- description(string, brief name of the rule)
- condition  (string, the specific logic/check for the rule)
- severity   (string, one of: "HIGH", "MEDIUM", "LOW")
- category   (string, e.g. "GST", "ITC", "Fraud", "Invoice", "Filing")

Document text:
{doc_text}

Return ONLY the JSON array starting with [ and ending with ]:
"""

    try:
        response = await _model.generate_content_async(
            prompt,
            generation_config={
                "temperature": 0.0,
                "response_mime_type": "application/json"
            }
        )
        result = safe_json(str(response.text or ""))

        if result and len(result) > 0:
            print(f"   ✅ Extracted {len(result)} rules from document")
            return result
        else:
            print("   ⚠️  Gemini returned empty — using sample data")
            return SAMPLE_RULES

    except Exception as e:
        print(f"   ❌ Agent 2 error: {e} — using sample data")
        return SAMPLE_RULES