from fastapi import APIRouter, Depends, HTTPException  # pyre-ignore[21]
from pydantic import BaseModel
from sqlalchemy.orm import Session  # pyre-ignore[21]
from agents.explain_agent import run as explain  # pyre-ignore[21]
from db.database import get_db, AuditReport, Violation, Rule, Transaction, Document  # pyre-ignore[21]

router = APIRouter()


@router.post("/chat")
async def chat(payload: dict, db: Session = Depends(get_db)):
    """
    POST /api/chat
    Accepts a user question alongside a document_id or context.
    Returns a highly accurate answer powered by deep database context.
    """
    question = payload.get("question", "").strip()
    context  = payload.get("context", "")
    document_id = payload.get("document_id")

    if not question:
        return {"answer": "Please ask a question about your audit report.", "success": False}

    # If the client did not provide a document_id, automatically attach to the user's most recently audited document!
    if not document_id:
        try:
            latest_doc = db.query(Document).order_by(Document.id.desc()).first()
            if latest_doc:
                document_id = latest_doc.id
        except Exception as e:
            print(f"⚠️ Error fetching latest document for chat context: {e}")

    if document_id:
        try:
            violations = db.query(Violation).filter(Violation.document_id == document_id).all()
            if violations:
                context = f"Audit Report Context for Document ID: {document_id}\n\nDiscovered Violations:\n"
                for v in violations:
                    txn = db.query(Transaction).filter(Transaction.id == v.transaction_id).first()
                    rule = db.query(Rule).filter(Rule.id == v.rule_id).first()
                    
                    txn_str = f"Txn amount ₹{txn.amount} on {txn.date} to party '{txn.party}'" if txn else f"Txn ID {v.transaction_id}"
                    rule_str = rule.description if rule else "Specific Rule Violation"
                    
                    context += f"- [{v.severity} SEVERITY] Rule broken: {rule_str}. Context: {txn_str}. Reason: {v.reason}. Est. Penalty: ₹{v.estimated_penalty}. Next steps: {v.recommendation}\n"
        except Exception as e:
            print(f"⚠️ Error fetching context from DB for chat: {e}")

    answer = explain(question, context)
    return {"answer": answer, "success": True}