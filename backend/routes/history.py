from fastapi import APIRouter, Depends, HTTPException  # pyre-ignore[21]
from sqlalchemy.orm import Session  # pyre-ignore[21]
from db.database import get_db, Document, AuditReport, Transaction, Rule, Violation  # pyre-ignore[21]
import engines.graph_engine as graph_engine
import engines.priority_engine as priority_engine
import engines.score_engine as score_engine

router = APIRouter()

@router.get("/history/{user_id}")
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    """
    Fetch all past uploaded documents and their basic audit report summary for a specific user.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
        
    docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()
    
    history_list = []
    for doc in docs:
        report = db.query(AuditReport).filter(AuditReport.document_id == doc.id).first()
        transactions_count = db.query(Transaction).filter(Transaction.document_id == doc.id).count()
        violations_count = db.query(Violation).filter(Violation.document_id == doc.id).count()
        critical_count = db.query(Violation).filter(Violation.document_id == doc.id, Violation.severity.in_(["HIGH", "CRITICAL"])).count()
        
        history_list.append({
            "id": doc.id,
            "filename": doc.filename,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "transactions_count": transactions_count,
            "violations_count": violations_count,
            "critical_count": critical_count,
            "health_score": report.health_score if report else None,
        })
        
    return {"success": True, "history": history_list}

@router.get("/history/details/{document_id}")
def get_audit_details(document_id: int, db: Session = Depends(get_db)):
    """
    Fetch the full audit result payload for a specific document_id, 
    reconstructing the shape so the dashboard can display it perfectly.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Fetch all DB records
    transactions_db = db.query(Transaction).filter(Transaction.document_id == document_id).all()
    rules_db = db.query(Rule).filter(Rule.document_id == document_id).all()
    violations_db = db.query(Violation).filter(Violation.document_id == document_id).all()
    report_db = db.query(AuditReport).filter(AuditReport.document_id == document_id).first()
    
    # Convert DB objects back to dicts so engines and frontend can process them via JSON
    transactions = [
        {
            "id": t.id,
            "date": t.date,
            "amount": t.amount,
            "type": t.type,
            "description": t.description,
            "party": t.party,
            "category": t.category
        } for t in transactions_db
    ]
    
    rules = [
        {
            "id": r.id,
            "description": r.description,
            "condition": r.condition,
            "severity": r.severity,
            "category": r.category
        } for r in rules_db
    ]
    
    violations = [
        {
            "transaction_id": v.transaction_id,
            "rule_id": v.rule_id,
            "reason": v.reason,
            "severity": v.severity,
            "estimated_penalty": v.estimated_penalty,
            "recommendation": v.recommendation
        } for v in violations_db
    ]

    # Re-build health score map to match what frontend expects
    if report_db:
        health = {
            "overall": report_db.health_score,
            "gst_adherence": report_db.gst_score,
            "itc_accuracy": report_db.itc_score,
            "fraud_risk": report_db.fraud_score,
            "doc_quality": report_db.doc_score
        }
    else:
        health = score_engine.calculate(violations)

    fixes = priority_engine.rank(violations, rules)
    graph = graph_engine.build(transactions, rules, violations)

    high = len([v for v in violations if v["severity"] == "HIGH"])
    medium = len([v for v in violations if v["severity"] == "MEDIUM"])
    low = len([v for v in violations if v["severity"] == "LOW"])
    total_penalty = sum(v["estimated_penalty"] for v in violations)

    return {
        "success": True,
        "document_id": document_id,
        "filename": doc.filename,
        "transactions": transactions,
        "rules": rules,
        "violations": violations,
        "health_score": health,
        "priority_fixes": fixes,
        "knowledge_graph": graph,
        "summary": {
            "total_transactions": len(transactions),
            "total_violations": len(violations),
            "high": high,
            "medium": medium,
            "low": low,
            "total_penalty": total_penalty,
        }
    }


@router.delete("/history/clear/{user_id}")
def clear_user_history(user_id: str, db: Session = Depends(get_db)):
    """Deletes all past documents and audits for a user."""
    docs = db.query(Document).filter(Document.user_id == user_id).all()
    if not docs:
        return {"success": True, "message": "Nothing to clear"}
        
    for doc in docs:
        db.query(Transaction).filter(Transaction.document_id == doc.id).delete()
        db.query(Rule).filter(Rule.document_id == doc.id).delete()
        db.query(Violation).filter(Violation.document_id == doc.id).delete()
        db.query(AuditReport).filter(AuditReport.document_id == doc.id).delete()
        db.delete(doc)
    
    db.commit()
    return {"success": True, "message": "History cleared"}


@router.delete("/history/document/{document_id}")
def delete_document(document_id: int, user_id: str, db: Session = Depends(get_db)):
    """Deletes a specific document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    db.query(Transaction).filter(Transaction.document_id == doc.id).delete()
    db.query(Rule).filter(Rule.document_id == doc.id).delete()
    db.query(Violation).filter(Violation.document_id == doc.id).delete()
    db.query(AuditReport).filter(AuditReport.document_id == doc.id).delete()
    db.delete(doc)
    
    db.commit()
    return {"success": True, "message": "Document deleted"}
