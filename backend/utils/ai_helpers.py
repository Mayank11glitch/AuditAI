import json
import re


def safe_json(text: str) -> list:
    """
    Safely parse a JSON array from an AI response.
    Strips markdown fences, handles whitespace, returns [] on failure.
    """
    if not text:
        return []
    try:
        # Remove markdown code fences if present
        clean = re.sub(r"```json|```", "", text).strip()
        # Find the first [ and last ] to extract array
        start = clean.find("[")
        end   = clean.rfind("]")
        if start != -1 and end != -1 and end > start:
            clean = clean[start:end + 1]  # pyre-ignore
        result = json.loads(clean)
        return result if isinstance(result, list) else []
    except Exception as e:
        print(f"⚠️  JSON parse failed: {e}")
        print(f"   Raw response (first 300 chars): {text[:300]}")  # pyre-ignore
        return []


def format_inr(amount: float) -> str:
    """Format a number as Indian Rupee string e.g. ₹1,23,456"""
    try:
        return f"₹{int(amount):,}"
    except Exception:
        return f"₹{amount}"


def truncate(text: str, max_chars: int = 6000) -> str:
    """Truncate text to avoid exceeding Gemini context in prompts"""
    return text[:max_chars] if len(text) > max_chars else text  # pyre-ignore


def severity_color(severity: str) -> str:
    """Return a hex color for a severity level"""
    return {"HIGH": "#dc2626", "MEDIUM": "#ca8a04", "LOW": "#16a34a"}.get(severity, "#6b7280")