"""
Fallback sample data used when Gemini API fails or returns unparseable JSON.
Ensures the demo always works even under network issues.
"""

SAMPLE_TRANSACTIONS = [
    {"id": 1, "date": "2024-01-15", "amount": 99999,   "type": "DEBIT",  "description": "Vendor payment",        "party": "ABC Enterprises", "category": "GST"},
    {"id": 2, "date": "2024-01-20", "amount": 150000,  "type": "DEBIT",  "description": "Raw material purchase",  "party": "PQR Suppliers",   "category": "ITC"},
    {"id": 3, "date": "2024-02-01", "amount": 25000,   "type": "DEBIT",  "description": "Staff party expenses",   "party": "Hotel Grand",     "category": "Other"},
    {"id": 4, "date": "2024-02-10", "amount": 200000,  "type": "DEBIT",  "description": "Equipment purchase",     "party": "Tech Vendors",    "category": "ITC"},
    {"id": 5, "date": "2024-03-01", "amount": 1000000, "type": "DEBIT",  "description": "Round number payment",   "party": "Mystery Vendor",  "category": "Other"},
    {"id": 6, "date": "2024-03-10", "amount": 50000,   "type": "CREDIT", "description": "Client payment",         "party": "XYZ Corp",        "category": "GST"},
    {"id": 7, "date": "2024-03-15", "amount": 75000,   "type": "DEBIT",  "description": "Consulting fees",        "party": "Freelancer",      "category": "GST"},
    {"id": 8, "date": "2024-03-20", "amount": 30000,   "type": "DEBIT",  "description": "Club membership",        "party": "Business Club",   "category": "Other"},
]

SAMPLE_RULES = [
    {"id": 1, "description": "GSTR-1 vs GSTR-3B Mismatch",   "condition": "Sales in GSTR-1 do not match GSTR-3B",              "severity": "HIGH",   "category": "GST"},
    {"id": 2, "description": "Excess ITC Claim",              "condition": "ITC claimed exceeds GSTR-2B available amount",       "severity": "HIGH",   "category": "ITC"},
    {"id": 3, "description": "Blocked Credit Section 17(5)",  "condition": "ITC on food, entertainment or personal expenses",    "severity": "HIGH",   "category": "ITC"},
    {"id": 4, "description": "Round Number Transaction",       "condition": "Exact round amounts are a fraud risk signal",       "severity": "MEDIUM", "category": "Fraud"},
    {"id": 5, "description": "Late GST Return Filing",         "condition": "Returns filed after due date incur penalty",        "severity": "LOW",    "category": "Filing"},
    {"id": 6, "description": "Missing e-Invoice IRN",          "condition": "B2B invoice above threshold without IRN number",   "severity": "HIGH",   "category": "Invoice"},
    {"id": 7, "description": "RCM Non-Compliance",             "condition": "GST not self-assessed on reverse charge items",    "severity": "MEDIUM", "category": "GST"},
]

SAMPLE_VIOLATIONS = [
    {
        "transaction_id": 1,
        "rule_id": 4,
        "reason": "₹99,999 is a suspicious near-round number — commonly used to stay below ₹1,00,000 reporting thresholds",
        "severity": "MEDIUM",
        "estimated_penalty": 15000,
        "recommendation": "Provide original invoice and delivery confirmation to prove legitimate business purpose"
    },
    {
        "transaction_id": 3,
        "rule_id": 3,
        "reason": "Staff party expenses at Hotel Grand are blocked credits under Section 17(5) of CGST Act — ITC cannot be claimed on food and entertainment",
        "severity": "HIGH",
        "estimated_penalty": 4500,
        "recommendation": "Reverse the ITC claim of ₹4,500 (18% GST on ₹25,000) in your next GSTR-3B filing immediately"
    },
    {
        "transaction_id": 5,
        "rule_id": 4,
        "reason": "₹10,00,000 exact round number payment to 'Mystery Vendor' — highest risk fraud signal requiring full documentation",
        "severity": "HIGH",
        "estimated_penalty": 100000,
        "recommendation": "Provide complete tax invoice with GSTIN, delivery challan, bank transfer proof, and signed agreement"
    },
    {
        "transaction_id": 8,
        "rule_id": 3,
        "reason": "Club membership fees are blocked credits under Section 17(5) — ITC on club or gym memberships is explicitly disallowed",
        "severity": "MEDIUM",
        "estimated_penalty": 5400,
        "recommendation": "Reverse ITC of ₹5,400 (18% on ₹30,000) in GSTR-3B. Club memberships are non-business expenses."
    },
]