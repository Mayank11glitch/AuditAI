def calculate(violations: list) -> dict:
    """
    Calculates the Financial Health Score (0-100) from a list of violations.
    Since each transaction now generates exactly ONE violation (the worst severity),
    the penalty per violation is larger to reflect real-world risk.

    Deduction table (per transaction-level violation):
      HIGH   → -20 pts  (direct tax evasion / blocked ITC)
      MEDIUM → -10 pts  (missing metadata / suspicious round numbers)
      LOW    →  -4 pts  (minor issues / low-risk missing fields)

    Sub-scores reflect specific compliance domains.
    severity_counts is included for frontend badge rendering.
    """
    if not violations:
        return {
            "overall":        100,
            "gst_adherence":  100,
            "itc_accuracy":   100,
            "fraud_risk":     100,
            "doc_quality":    100,
            "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
        }

    high_v   = [v for v in violations if str(v.get("severity", "")).upper() == "HIGH"]
    medium_v = [v for v in violations if str(v.get("severity", "")).upper() == "MEDIUM"]
    low_v    = [v for v in violations if str(v.get("severity", "")).upper() == "LOW"]

    # Penalty per violation — larger now that we deduplicate to one per transaction
    H_PEN, M_PEN, L_PEN = 20, 10, 4

    penalty = len(high_v) * H_PEN + len(medium_v) * M_PEN + len(low_v) * L_PEN
    overall = max(0, 100 - penalty)

    # ── Sub-score helpers ─────────────────────────────────────────────────────
    def has(v, *keywords) -> bool:
        text = (v.get("reason", "") + " " + v.get("recommendation", "")).lower()
        return any(k in text for k in keywords)

    gst_v   = [v for v in violations if has(v, "gst", "gstr", "filing", "return", "invoice")]
    itc_v   = [v for v in violations if has(v, "itc", "input tax", "credit", "section 17", "blocked")]
    fraud_v = [v for v in violations if has(v, "round", "fraud", "suspicious", "mystery", "unknown", "unexplained")]
    doc_v   = [v for v in violations if has(v, "missing", "incomplete", "no gstin", "unverified", "not found")]

    def sub_penalty(subset: list) -> float:
        return (
            len([v for v in subset if str(v.get("severity","")).upper() == "HIGH"])   * H_PEN +
            len([v for v in subset if str(v.get("severity","")).upper() == "MEDIUM"]) * M_PEN +
            len([v for v in subset if str(v.get("severity","")).upper() == "LOW"])    * L_PEN
        )

    return {
        "overall":        round(overall, 1),
        "gst_adherence":  round(max(0, 100 - sub_penalty(gst_v)),   1),
        "itc_accuracy":   round(max(0, 100 - sub_penalty(itc_v)),   1),
        "fraud_risk":     round(max(0, 100 - sub_penalty(fraud_v)),  1),
        "doc_quality":    round(max(0, 100 - sub_penalty(doc_v)),    1),
        "severity_counts": {
            "HIGH":   len(high_v),
            "MEDIUM": len(medium_v),
            "LOW":    len(low_v),
        },
    }