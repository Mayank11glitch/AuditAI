import os
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from routes.upload import router as upload_router
from routes.audit  import router as audit_router
from routes.chat   import router as chat_router
from routes.history import router as history_router

app = FastAPI(
    title="AuditAI Backend",
    description="AI-powered financial compliance platform for Indian MSMEs",
    version="1.0.0"
)

# ── CORS — allow React dev server and production URLs ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routes under /api prefix ─────────────────────
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(audit_router,  prefix="/api", tags=["Audit"])
app.include_router(chat_router,   prefix="/api", tags=["Chat"])
app.include_router(history_router, prefix="/api", tags=["History"])


@app.on_event("startup")
async def startup():
    create_tables()
    print("\n🚀 AuditAI backend is running!")
    print("   API docs: http://localhost:8001/docs\n")


@app.get("/")
def root():
    return {
        "status":  "AuditAI running ✅",
        "version": "1.0.0",
        "docs":    "http://localhost:8001/docs"
    }


@app.get("/health")
def health():
    return {"healthy": True}