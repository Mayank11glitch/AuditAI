import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Database, AlertCircle, FileText, User, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

// --- Custom Nodes ---

// Entity Node (e.g. Vendor, Employee)
const EntityNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface/80 backdrop-blur-md shadow-lg min-w-[150px] transition-all duration-300",
      selected ? "border-blue-500 shadow-lg bg-blue-500/10" : "hover:border-blue-500/50"
    )}>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          {data.type === 'vendor' ? <Database className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">{data.type}</p>
          <p className="text-sm font-bold text-on-surface whitespace-nowrap">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

// Transaction Node
const TransactionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "px-5 py-4 rounded-xl border border-outline-variant/30 bg-surface/90 backdrop-blur-xl shadow-xl min-w-[200px] transition-all duration-300 relative overflow-hidden group",
      selected ? "border-purple-500 shadow-lg bg-purple-500/5" : "hover:border-purple-500/50 hover:shadow-lg"
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-purple-500 !border-2 !border-surface" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-purple-500 !border-2 !border-surface" />
      <div className="flex items-start gap-4 relative z-10 p-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-purple-400/80 uppercase tracking-widest mb-0.5">Transaction</p>
          <p className="text-sm font-semibold text-on-surface leading-tight mb-2 max-w-[150px] whitespace-normal break-words">
            {data.label.includes('|') ? data.label.split('|')[1]?.trim() : data.label}
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold">{data.label.includes('|') ? data.label.split('|')[0]?.trim() : "DATE"}</span>
            <p className="text-lg font-headline font-bold text-on-surface">{data.amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rule/Violation Node
const RuleNode = ({ data, selected }: NodeProps) => {
  const isHighSeverity = data.severity === 'HIGH' || data.severity === 'CRITICAL';

  return (
    <div className={cn(
      `px-5 py-4 rounded-xl border bg-surface/90 backdrop-blur-xl shadow-xl min-w-[240px] max-w-[300px] transition-all duration-300 relative overflow-hidden group`,
      isHighSeverity ? "border-red-500/40" : "border-yellow-500/40",
      selected && isHighSeverity ? "border-red-500 shadow-lg bg-red-500/5" : "",
      selected && !isHighSeverity ? "border-yellow-500 shadow-lg bg-yellow-500/5" : "",
      !selected && isHighSeverity ? "hover:border-red-500/60 hover:shadow-lg" : "",
      !selected && !isHighSeverity ? "hover:border-yellow-500/60 hover:shadow-lg" : ""
    )}>
      <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", isHighSeverity ? "bg-red-500 group-hover:bg-red-400" : "bg-yellow-500 group-hover:bg-yellow-400")}></div>
      <Handle type="target" position={Position.Left} className={cn("!w-2 !h-2 !border-2 !border-surface", isHighSeverity ? "!bg-red-500" : "!bg-yellow-500")} />
      <div className="flex items-start gap-4 relative z-10 pl-2">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shadow-inner flex-shrink-0", isHighSeverity ? "bg-gradient-to-br from-red-500/20 to-red-500/5 text-red-500 border-red-500/20" : "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 text-yellow-500 border-yellow-500/20")}>
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", isHighSeverity ? "text-red-400" : "text-yellow-400")}>Violated Rule</p>
          </div>
          <p className="text-sm font-semibold text-on-surface leading-snug whitespace-normal break-words">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
  transaction: TransactionNode,
  rule: RuleNode,
};

// --- Mock Data ---
const initialNodes = [
  // Entities
  { id: 'e1', type: 'entity', position: { x: 250, y: 50 }, data: { label: 'Offshore Tech LLC', type: 'vendor' } },
  { id: 'e2', type: 'entity', position: { x: 600, y: 50 }, data: { label: 'John Doe', type: 'employee' } },

  // Transactions
  { id: 't1', type: 'transaction', position: { x: 250, y: 200 }, data: { label: 'Wire Transfer TXN-8921', amount: '$45,000' } },
  { id: 't2', type: 'transaction', position: { x: 450, y: 200 }, data: { label: 'Consulting Fee TXN-8950', amount: '$12,500' } },
  { id: 't3', type: 'transaction', position: { x: 700, y: 200 }, data: { label: 'Travel Expense TXN-8914', amount: '$1,250' } },

  // Rules / Violations
  { id: 'r1', type: 'rule', position: { x: 350, y: 350 }, data: { label: 'AML Policy 4.2: Unregistered Offshore Entity' } },
  { id: 'r2', type: 'rule', position: { x: 700, y: 350 }, data: { label: 'T&E Policy 2.1: Missing Receipt for Entertainment' } },
];

const initialEdges: Edge[] = [
  // entity -> transaction
  { id: 'e1-t1', source: 'e1', target: 't1', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 } },
  { id: 'e1-t2', source: 'e1', target: 't2', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 } },
  { id: 'e2-t3', source: 'e2', target: 't3', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 } },

  // transaction -> rule
  { id: 't1-r1', source: 't1', target: 'r1', animated: true, style: { stroke: '#f87171', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' } },
  { id: 't2-r1', source: 't2', target: 'r1', animated: true, style: { stroke: '#f87171', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' } },
  { id: 't3-r2', source: 't3', target: 'r2', animated: true, style: { stroke: '#f87171', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' } },
];

export default function KnowledgeGraph() {
  const { hasUploadedData, auditResults } = useAppContext();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (hasUploadedData && auditResults && auditResults.knowledge_graph) {
      setNodes(auditResults.knowledge_graph.nodes || []);
      setEdges(auditResults.knowledge_graph.edges || []);
    }
  }, [hasUploadedData, auditResults, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="w-full h-full p-4 md:p-8 xl:p-12 mb-20 max-w-7xl mx-auto flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-on-surface tracking-tight mb-2 flex items-center gap-3">
            <Network className="w-8 h-8 text-purple-500" />
            Compliance Database Graph
          </h1>
          <p className="text-on-surface-variant max-w-2xl">Visual mapping of transactions tied to vendors and employees, identifying patterns triggering rules defined in the Policy Library.</p>
        </div>
      </div>

      <div className="relative flex-grow glass-card glass-border rounded-2xl border border-outline-variant/30 overflow-hidden z-10 w-full" style={{ height: '700px' }}>
        <div className="absolute top-4 left-4 z-20 glass-card bg-surface/80 backdrop-blur-md border border-outline-variant/30 px-4 py-3 rounded-xl flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/80"></div> Entities</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500/80"></div> Transactions</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/80"></div> Violations</div>
        </div>

        <div className={cn("w-full h-full transition-all duration-1000", !hasUploadedData && "opacity-20 grayscale pointer-events-none blur-sm select-none")}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
          >
            <Background color="#ffffff" gap={20} size={1} />
            <Controls className="bg-surface/80 backdrop-blur-md border-outline-variant/30 fill-on-surface text-on-surface" />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'entity') return '#3b82f6';
                if (n.type === 'transaction') return '#a855f7';
                return '#ef4444';
              }}
              maskColor="rgba(0, 0, 0, 0.4)"
              className="bg-surface/80 backdrop-blur-md border border-outline-variant/30 rounded-xl"
            />
          </ReactFlow>
        </div>

        {!hasUploadedData && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center space-y-4 bg-surface/10 backdrop-blur-[2px]">
            <div className="w-20 h-20 rounded-full bg-outline-variant/10 flex items-center justify-center border border-outline-variant/20 shadow-2xl">
              <Network className="w-10 h-10 text-outline-variant opacity-50" />
            </div>
            <div className="glass-card px-8 py-6 rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md">
              <p className="text-xl font-bold font-headline text-on-surface mb-2">Network Awaiting Data</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">The Knowledge Graph requires extracted entities and transactions to build logical mappings. Upload a document to generate the compliance graph.</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-72 glass-card bg-surface/90 backdrop-blur-xl border border-outline-variant/50 rounded-xl shadow-lg z-20 flex flex-col overflow-hidden"
            >
              <div className={cn(
                "p-4 border-b border-outline-variant/30 flex items-center justify-between",
                selectedNode.type === 'rule' ? "bg-red-500/10" : selectedNode.type === 'transaction' ? "bg-purple-500/10" : "bg-blue-500/10"
              )}>
                <h3 className="font-headline font-bold text-on-surface tracking-wide">{selectedNode.data.label}</h3>
                <button onClick={() => setSelectedNode(null)} className="text-on-surface-variant hover:text-foreground transition-colors">
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                {selectedNode.type === 'transaction' && (
                  <>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-semibold">Amount</p>
                      <p className="text-lg font-bold text-purple-400">{selectedNode.data.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-semibold mb-1">Status</p>
                      <span className="px-2.5 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-bold w-fit">FLAGGED FOR AUDIT</span>
                    </div>
                  </>
                )}
                {selectedNode.type === 'rule' && (
                  <>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-semibold">Severity</p>
                      <p className="text-sm font-bold text-red-500">{selectedNode.data.severity || 'HIGH / CRITICAL'}</p>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/30">
                      <p className="text-xs text-on-surface-variant uppercase font-semibold mb-2">AI Recommendation</p>
                      <p className="text-sm text-primary-light bg-primary/10 border border-primary/20 p-3 rounded-xl leading-snug">{selectedNode.data.recommendation || 'Immediately review this compliance requirement and adjust internal protocols.'}</p>
                    </div>
                  </>
                )}
                {selectedNode.type === 'entity' && (
                  <>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-semibold">Type</p>
                      <p className="text-sm font-bold text-blue-400">{selectedNode.data.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-semibold mb-1">Risk Score</p>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full w-[85%]"></div>
                      </div>
                      <p className="text-right text-xs text-red-400 mt-1 font-bold">85 / 100</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
