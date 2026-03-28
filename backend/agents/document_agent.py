import google.generativeai as genai
import json, os, re
from dotenv import load_dotenv  # pyre-ignore[21]
from utils.ai_helpers import safe_json  # pyre-ignore[21]
from utils.sample_data import SAMPLE_TRANSACTIONS  # pyre-ignore[21]

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.5-flash")


async def run(text: str) -> list:
    """
    Agent 1 — Document Agent
    Reads the uploaded financial document and extracts all transactions.
    Returns a list of transaction dicts.
    """
    print("\n" + "="*60)
    print("🤖 [AGENT 1: DOCUMENT PARSER] - Analyzing Document...")
    print("="*60 + "\n", flush=True)

    prompt = f"""
You are a financial document parser for Indian businesses.
Extract ALL financial transactions from the document below. Do NOT duplicate transactions; extract each unique transaction only ONCE.

Return ONLY a valid JSON array. No explanation. No markdown fences. Just the array.

Every item in the array must have EXACTLY these fields:
- id         (integer, start from 1, increment by 1)
- date       (string, any format found in document)
- amount     (number, in INR, no currency symbols)
- type       (string, exactly "DEBIT" or "CREDIT")
- description(string, what the transaction is for)
- party      (string, vendor or customer name, use "Unknown" if not found)
- category   (string, one of: "GST", "ITC", "Payment", "Receipt", "Other")

Document text:
{text}

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
            # Deduplicate transactions (LLMs sometimes hallucinates duplicates)
            seen = set()
            deduped = []
            for item in result:
                if not isinstance(item, dict):
                    continue
                # Create a unique signature ignoring 'id' which might differ
                sig = (
                    item.get("date"),
                    item.get("amount"),
                    item.get("type"),
                    item.get("description"),
                    item.get("party")
                )
                if sig not in seen:
                    seen.add(sig)
                    deduped.append(item)
            
            # Re-index ids correctly
            for idx, item in enumerate(deduped):
                item["id"] = idx + 1
            
            result = deduped
            print(f"   ✅ Extracted {len(result)} unique transactions")
            return result
        else:
            print("   ⚠️  Gemini returned empty — using sample data")
            return SAMPLE_TRANSACTIONS

    except Exception as e:
        print(f"   ❌ Agent 1 error: {e} — using sample data")
        return SAMPLE_TRANSACTIONS