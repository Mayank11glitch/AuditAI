 
 
// ─── AuditAI Frontend Type Definitions ────────────────────────────
// Central file for all shared TypeScript interfaces and types.
// Import from here instead of using inline `any` wherever possible.

// ── API Response Types ─────────────────────────────────────────────

export interface UploadResponse {
  success: boolean;
  document_id: number;
  extracted_text: string;
  error?: string;
}

export interface Violation {
  transaction_id: string | number;
  reason: string;
  rule_id: string | number;
  severity: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  estimated_penalty?: number;
  recommendation?: string;
}

export interface HealthScore {
  overall: number;
  breakdown?: Record<string, number>;
}

export interface AuditSummary {
  total_transactions: number;
  total_violations: number;
  high: number;
  medium: number;
  low: number;
}

export interface GraphNode {
  id: string;
  type: "transaction" | "rule" | "entity";
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
  markerEnd?: Record<string, unknown>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AuditResults {
  success: boolean;
  health_score: HealthScore;
  violations: Violation[];
  summary: AuditSummary;
  transactions?: unknown[];
  knowledge_graph?: KnowledgeGraph;
}

// ── App Context Types ──────────────────────────────────────────────

export interface AppContextType {
  hasUploadedData: boolean;
  setHasUploadedData: (v: boolean) => void;
  documentId: number | null;
  setDocumentId: (id: number) => void;
  auditResults: AuditResults | null;
  setAuditResults: (results: AuditResults) => void;
}

// ── UI Types ───────────────────────────────────────────────────────

export type Severity = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}
