
import React from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { PixelCanvas } from "@/components/ui/pixel-canvas";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

export default function Dashboard() {
    const { hasUploadedData, setHasUploadedData, setDocumentId, setAuditResults, auditResults } = useAppContext();

    const handleUploadComplete = (file: File, results: any, docId: number) => {
        console.log("File thoroughly analyzed by pipeline: ", file.name);
        setDocumentId(docId);
        setAuditResults(results); // Must save FULL response, not just summary
        setHasUploadedData(true);
    };

    return (
        <div className="w-full h-full p-4 md:p-8 xl:p-12 mb-20 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-on-surface tracking-tight mb-2">Audit Dashboard</h1>
                    <p className="text-on-surface-variant max-w-2xl">Upload your company's financial documents or review recent compliance audits powered by the 4-agent Gemini pipeline.</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-card glass-border rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Health Score</p>
                            <p className="text-2xl font-bold text-on-surface font-headline">
                                {hasUploadedData && auditResults?.health_score ? Math.round(auditResults.health_score.overall) : "--"}
                                <span className="text-sm font-medium text-on-surface-variant">/100</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Upload Zone */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                            <FileUpload onUploadComplete={handleUploadComplete} />
                        </motion.div>
                    </section>

                    {/* Quick Stats Grid */}
                    <section className={cn("grid grid-cols-1 sm:grid-cols-3 gap-6 transition-opacity duration-700", !hasUploadedData && "opacity-50 grayscale pointer-events-none")}>
                        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group">
                            <PixelCanvas gap={6} speed={30} colors={["#3b82f6", "#60a5fa", "#93c5fd"]} variant="default" noFocus />
                            <Activity className="w-6 h-6 text-blue-400 mb-2 relative z-10" />
                            <p className="text-sm font-semibold text-on-surface-variant relative z-10">Transactions Parsed</p>
                            <p className="text-3xl font-bold font-headline text-on-surface relative z-10">{hasUploadedData ? auditResults?.transactions?.length ?? auditResults?.summary?.total_transactions ?? "0" : "0"}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group">
                            <PixelCanvas gap={6} speed={30} colors={["#ef4444", "#f87171", "#fca5a5"]} variant="default" noFocus />
                            <ShieldAlert className="w-6 h-6 text-red-500 mb-2 relative z-10" />
                            <p className="text-sm font-semibold text-on-surface-variant relative z-10">Critical Violations</p>
                            <p className="text-3xl font-bold font-headline text-on-surface relative z-10">{hasUploadedData ? auditResults?.summary?.high ?? "0" : "0"}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group">
                            <PixelCanvas gap={6} speed={30} colors={["#22c55e", "#4ade80", "#86efac"]} variant="default" noFocus />
                            <ShieldCheck className="w-6 h-6 text-green-500 mb-2 relative z-10" />
                            <p className="text-sm font-semibold text-on-surface-variant relative z-10">Total Violations</p>
                            <p className="text-3xl font-bold font-headline text-on-surface relative z-10">{hasUploadedData ? auditResults?.violations?.length ?? auditResults?.summary?.total_violations ?? "0" : "0"}</p>
                        </div>
                    </section>
                </div>

                {/* Side Panel: Recent Audits Activity Log */}
                <div className="lg:col-span-1">
                    <div className="glass-card glass-border rounded-3xl p-6 h-full flex flex-col border border-outline-variant/30">
                        <h3 className="text-lg font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
                            Recent Activity Log
                        </h3>

                        <div className="flex-1 space-y-6">
                            {!hasUploadedData ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                    <Activity className="w-10 h-10 text-outline-variant mb-2" />
                                    <p className="text-sm font-medium text-on-surface-variant">Awaiting Next Audit</p>
                                    <p className="text-xs text-on-surface-variant/70">Upload a financial document or invoice to automatically trigger the verification pipeline.</p>
                                </div>
                            ) : (
                                // Mapping Live Violation Activity items
                                (auditResults?.violations || []).slice(0, 6).map((v: any, idx: number, arr: any[]) => {
                                    const sev = v.severity || "MEDIUM";
                                    let color = "text-yellow-400";
                                    if (sev === "HIGH" || sev === "CRITICAL") color = "text-red-500";
                                    else if (sev === "LOW") color = "text-green-400";

                                    const title = v.reason || (v.transaction_id ? `Violation on TXN ${v.transaction_id}` : "Compliance Anomaly Detected");
                                    const status = `Rule #${v.rule_id} (${sev})`;

                                    return (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shadow-lg transition-colors", sev === "HIGH" ? "bg-red-500" : "bg-primary")}></div>
                                                {idx !== arr.length - 1 && <div className="w-[1px] h-full bg-outline-variant/30 mt-2 group-hover:bg-outline-variant/60 transition-colors"></div>}
                                            </div>
                                            <div className="pb-4 flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-on-surface truncate pr-2" title={title}>{title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-on-surface-variant font-medium">{v.transaction_id ? `TXN: ${v.transaction_id}` : "Recently"}</span>
                                                    <span className="text-[10px] text-outline-variant">•</span>
                                                    <span className={cn("text-xs font-bold tracking-wide", color)}>{status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <Link to="/violations" className="block w-full text-center py-3 text-sm font-semibold text-primary hover:text-primary-light transition-colors mt-4 bg-primary/5 hover:bg-primary/10 rounded-xl">View All Logs</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
