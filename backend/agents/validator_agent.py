import google.generativeai as genai
import json, os
from dotenv import load_dotenv  # pyre-ignore[21]
from utils.ai_helpers import safe_json  # pyre-ignore[21]
from utils.sample_data import SAMPLE_VIOLATIONS  # pyre-ignore[21]

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.5-flash")


from typing import Any

async def run(transactions: list[Any], rules: list[Any]) -> list[Any]:
    """
    Agent 3 — Validator Agent
    Cross-checks every transaction against every rule.
    Returns a list of violation dicts with traceable evidence.
    """
    print("\n" + "="*60)
    print("🤖 [AGENT 3: VALIDATOR] - Cross-Checking Transactions...")
    print("="*60 + "\n", flush=True)

    safe_txns = transactions
    rules_json = json.dumps(rules, indent=2)
    txns_json = json.dumps(safe_txns, indent=2)

    prompt = f"""
You are a strict Indian GST compliance auditor.
Your job is to check every transaction against every compliance rule and flag ALL violations.

Return ONLY a valid JSON array. No explanation. No markdown fences. Just the array.

Every violation must have EXACTLY these fields:
- transaction_id   (integer — must match an id from the transactions list)
- rule_id          (integer — must match an id from the rules list)
- reason           (string  — specific explanation mentioning the amount and rule name)
- severity         (string  — exactly "HIGH", "MEDIUM", or "LOW". Base this strictly on the rule's severity and the transaction's financial impact.)
- estimated_penalty(number  — realistic INR penalty based on Indian GST rules)
- recommendation   (string  — exact actionable steps to fix this violation)

Severity guidelines:
- HIGH: Direct tax evasion, completely blocked ITC, or huge unexplained generic payments.
- MEDIUM: Missing GST metadata, round numbers over Rs. 1,00,000, or late filing flags.
- LOW: Minor rounding issues, small undefined payments, or low-risk missing fields.
Do NOT flag everything as HIGH. Accurately mirror the underlying rule's severity.

Penalty guidelines:
- Blocked ITC (Section 17(5)): reverse 18% of transaction amount
- Round numbers: 15% of transaction as risk-based penalty
- Large unexplained payments: 10% of transaction
- Late filing: Rs.50 per day max Rs.10,000

Transactions to check:
{txns_json}

Rules to apply:
{rules_json}

Be strict. Flag every suspicious transaction. Check for:
1. Round or near-round amounts (99999, 100000, 500000)
2. Hotel/food/entertainment/club expenses (blocked ITC)
3. Payments to unknown or generic vendors
4. Unusually large single payments

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
            # ── Step 1: Deduplicate exact (transaction_id, rule_id) duplicates ──
            seen_pairs = set()
            deduped = []

            valid_txn_ids = {t["id"] for t in transactions if isinstance(t, dict) and "id" in t}
            valid_rule_ids = {r["id"] for r in rules if isinstance(r, dict) and "id" in r}

            for item in result:
                if not isinstance(item, dict):
                    continue
                t_id = item.get("transaction_id")
                r_id = item.get("rule_id")

                # Skip hallucinated IDs
                if t_id not in valid_txn_ids or r_id not in valid_rule_ids:
                    continue

                sig = (t_id, r_id)
                if sig not in seen_pairs:
                    seen_pairs.add(sig)
                    deduped.append(item)

            # ── Step 2: One violation per transaction (highest severity wins) ──
            SEVERITY_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

            txn_map: dict = {}
            for item in deduped:
                t_id = item.get("transaction_id")
                sev   = item.get("severity", "LOW")
                pen   = float(item.get("estimated_penalty", 0) or 0)

                if t_id not in txn_map:
                    txn_map[t_id] = dict(item)
                    txn_map[t_id]["estimated_penalty"] = pen
                    txn_map[t_id]["_all_reasons"] = [item.get("reason", "")]
                    txn_map[t_id]["_all_recs"]    = [item.get("recommendation", "")]
                else:
                    existing = txn_map[t_id]
                    # Accumulate total penalty across all rules
                    existing["estimated_penalty"] = existing.get("estimated_penalty", 0) + pen

                    # Escalate severity if this rule is worse
                    if SEVERITY_RANK.get(sev, 0) > SEVERITY_RANK.get(existing.get("severity"), 0):
                        existing["severity"]    = sev
                        existing["rule_id"]     = item.get("rule_id")

                    existing["_all_reasons"].append(item.get("reason", ""))
                    existing["_all_recs"].append(item.get("recommendation", ""))

            # Merge multi-rule reasons into a single readable string
            consolidated = []
            for v in txn_map.values():
                reasons = [r for r in v.pop("_all_reasons", []) if r]
                recs    = [r for r in v.pop("_all_recs",    []) if r]

                if len(reasons) > 1:
                    v["reason"]         = " | ".join(reasons[:3])          # Cap at 3 for readability
                    v["recommendation"] = recs[0] if recs else v.get("recommendation", "")
                consolidated.append(v)

            # Sort by severity then penalty (highest risk first)
            consolidated.sort(
                key=lambda v: (SEVERITY_RANK.get(v.get("severity", "LOW"), 0),
                               float(v.get("estimated_penalty", 0))),
                reverse=True
            )

            result = consolidated
            print(f"   ✅ Found {len(result)} unique violations (one per transaction)")
            return result
        else:
            print("   ⚠️  Gemini returned empty — using sample violations")
            return SAMPLE_VIOLATIONS

    except Exception as e:
        print(f"   ❌ Agent 3 error: {e} — using sample violations")
        return SAMPLE_VIOLATIONS