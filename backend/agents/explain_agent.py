from groq import Groq  # pyre-ignore[21]
import os
from dotenv import load_dotenv  # pyre-ignore[21]

load_dotenv(override=True)
_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def run(question: str, context: str) -> str:
    """
    Agent 4 — Explain Agent
    Answers GST compliance questions using real audit context from the DB.
    """

    has_context = bool(context and context.strip())

    system_prompt = """You are AuditAI — a senior Indian GST compliance auditor and advisor.

STRICT RULES:
1. NEVER use generic filler phrases like "Based on the Validator Agent's rule engine" or "this results in a HIGH severity penalty risk". These are BANNED. Speak directly and specifically.
2. If you have audit data in the context, you MUST refer to the EXACT transaction amounts, party names, rule descriptions, penalty amounts, and severities from the data. Do not paraphrase vaguely.
3. If there is NO relevant data in the context for the user's question, say so honestly and answer using your GST expertise.
4. If the question is COMPLETELY unrelated to GST, tax, or auditing — politely decline.
5. Keep answers concise, structured, and actionable. Use bullet points. Max 5-6 bullets per answer.
6. Use **bold** for important values (e.g., **₹45,000**, **HIGH severity**, **Section 17(5)**).
7. End with ONE specific next step the user should take.
8. Do NOT repeat information. Every sentence must add new value.
"""

    if has_context:
        system_prompt += f"\n\n--- LIVE AUDIT DATA ---\n{context[:5000]}\n--- END AUDIT DATA ---"
    else:
        system_prompt += "\n\n[No audit document has been uploaded yet. Answer based on general GST expertise only.]"

    try:
        response = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=500,
            temperature=0.5
        )

        return str(response.choices[0].message.content or "")

    except Exception as e:
        print(f"⚠️ Explain agent error: {e}")
        return "⚠️ AI service temporarily unavailable. Please try again in a moment. In the meantime, focus on resolving HIGH severity violations to reduce your financial risk exposure."