from typing import Any

def rank(violations: list[Any], rules: list[Any]) -> list[Any]:
    """
    Ranks violations by financial impact and returns the top 5 priority fixes.
    Ordered by estimated_penalty (highest first).
    Includes urgency label, exact fix steps, and penalty amount.
    """
    if not violations:
        return []

    # Sort by estimated penalty descending
    sorted_violations = sorted(
        violations,
        key=lambda v: float(v.get("estimated_penalty", 0)),
        reverse=True
    )

    fixes: list[Any] = []
    for i, v in enumerate(sorted_violations[:5], start=1):  # pyre-ignore
        rule: Any = next((r for r in rules if isinstance(r, dict) and isinstance(v, dict) and r.get("id") == v.get("rule_id")), {})
        sev  = v.get("severity", "LOW") if isinstance(v, dict) else "LOW"

        urgency = {
            "HIGH":   "URGENT",
            "MEDIUM": "THIS WEEK",
            "LOW":    "THIS MONTH",
        }.get(sev, "THIS MONTH")

        fixes.append({
            "rank":              i,
            "urgency":           urgency,
            "issue":             rule.get("description", "Compliance Violation"),
            "reason":            v.get("reason", ""),
            "recommendation":    v.get("recommendation", "Consult your Chartered Accountant"),
            "estimated_penalty": v.get("estimated_penalty", 0),
            "severity":          sev,
            "transaction_id":    v.get("transaction_id"),
            "rule_id":           v.get("rule_id"),
        })

    return fixes