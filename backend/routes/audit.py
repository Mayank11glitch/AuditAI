# pyre-ignore-all-errors
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks  # pyre-ignore[21]
from sqlalchemy.orm import Session  # pyre-ignore[21]
from db.database import get_db, Document, AuditReport, Transaction, Rule, Violation  # pyre-ignore[21]
import agents.document_agent as document_agent  # pyre-ignore[21]
import agents.rule_agent as rule_agent  # pyre-ignore[21]
import agents.validator_agent as validator_agent  # pyre-ignore[21]
import engines.graph_engine as graph_engine  # pyre-ignore[21]
import engines.priority_engine as priority_engine  # pyre-ignore[21]
import engines.score_engine as score_engine  # pyre-ignore[21]

router = APIRouter()


@router.post("/audit")
async def run_audit(
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    POST /api/audit
    Runs the full 4-agent AI pipeline on the extracted document text.
    Saves results to PostgreSQL.
    Returns: transactions, rules, violations, health_score,
             priority_fixes, knowledge_graph, summary
    """
    doc_id = payload.get("document_id")
    text   = payload.get("extracted_text", "")

    if not text.strip():
        return {"success": False, "error": "No text provided for audit"}

    try:
        # ── Run the 4-agent pipeline (Agents 1 & 2 in parallel) ──
        transactions, rules = await asyncio.gather(
            document_agent.run(text),
            rule_agent.run(text),
        )
        violations = await validator_agent.run(transactions, rules)

        # ── Run the 3 intelligence engines ───────────────────
        health = score_engine.calculate(violations)
        fixes  = priority_engine.rank(violations, rules)
        graph  = graph_engine.build(transactions, rules, violations)

        # ── Save everything to DB ─────────────────────────────
        if doc_id:
            # Save transactions
            for t in transactions[:50]:
                try:
                    db.add(Transaction(  # pyre-ignore
                        document_id = doc_id,
                        date        = str(t.get("date", "")),
                        amount      = float(t.get("amount", 0) or 0),
                        type        = t.get("type", ""),
                        description = t.get("description", ""),
                        party       = t.get("party", ""),
                        category    = t.get("category", "Other"),
                    ))
                except Exception as e:
                    print(f"   ⚠️  Could not save transaction: {e}")

            # Save rules
            for r in rules:
                try:
                    db.add(Rule(  # pyre-ignore
                        document_id = doc_id,
                        description = r.get("description", ""),
                        condition   = r.get("condition", ""),
                        severity    = r.get("severity", "LOW"),
                        category    = r.get("category", "GST"),
                    ))
                except Exception as e:
                    print(f"   ⚠️  Could not save rule: {e}")

            # Save violations
            for v in violations:
                try:
                    db.add(Violation(  # pyre-ignore
                        document_id       = doc_id,
                        transaction_id    = int(v.get("transaction_id", 0) or 0),
                        rule_id           = int(v.get("rule_id", 0) or 0),
                        reason            = v.get("reason", ""),
                        severity          = v.get("severity", "LOW"),
                        estimated_penalty = float(v.get("estimated_penalty", 0) or 0),
                        recommendation    = v.get("recommendation", ""),
                    ))
                except Exception as e:
                    print(f"   ⚠️  Could not save violation: {e}")

            # Save audit report
            try:
                db.add(AuditReport(  # pyre-ignore
                    document_id  = doc_id,
                    health_score = health["overall"],
                    gst_score    = health["gst_adherence"],
                    itc_score    = health["itc_accuracy"],
                    fraud_score  = health["fraud_risk"],
                    doc_score    = health["doc_quality"],
                ))
            except Exception as e:
                print(f"   ⚠️  Could not save report: {e}")

            db.commit()

        # ── Build summary ─────────────────────────────────────
        high   = len([v for v in violations if v.get("severity") == "HIGH"])
        medium = len([v for v in violations if v.get("severity") == "MEDIUM"])
        low    = len([v for v in violations if v.get("severity") == "LOW"])
        total_penalty = sum(float(v.get("estimated_penalty", 0) or 0) for v in violations)

        print(f"\n✅ Audit complete!")
        print(f"   Transactions: {len(transactions)}")
        print(f"   Violations:   {len(violations)} (HIGH:{high} MEDIUM:{medium} LOW:{low})")
        print(f"   Health Score: {health['overall']}/100")
        print(f"   Total Risk:   ₹{total_penalty:,.0f}\n")

        return {
            "success":       True,
            "document_id":   doc_id,
            "transactions":  transactions,
            "rules":         rules,
            "violations":    violations,
            "health_score":  health,
            "priority_fixes":fixes,
            "knowledge_graph": graph,
            "summary": {
                "total_transactions": len(transactions),
                "total_violations":   len(violations),
                "high":               high,
                "medium":             medium,
                "low":                low,
                "total_penalty":      total_penalty,
            }
        }

    except Exception as e:
        print(f"❌ Audit pipeline error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}