import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History as HistoryIcon, FileText, ArrowRight, Activity, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { PixelCanvas } from "@/components/ui/pixel-canvas";

interface HistoryItem {
    id: number;
    filename: string;
    created_at: string;
    transactions_count: number;
    violations_count: number;
    critical_count: number;
    health_score: number | null;
}

export default function History() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const { documentId, setDocumentId, setAuditResults, setHasUploadedData } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.getUserHistory(auth.currentUser.uid);
                if (res.success) {
                    setHistory(res.history);
                }
            } catch (err) {
                console.error("Failed to fetch user history:", err);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchHistory();
            } else {
                setHistory([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLoadAudit = async (docId: number) => {
        setLoadingId(docId);
        try {
            const auditData = await api.getAuditDetails(docId);
            if (auditData.success) {
                setDocumentId(docId);
                setAuditResults(auditData);
                setHasUploadedData(true);
                navigate("/violations");
            }
        } catch (err) {
            console.error("Failed to fetch detailed audit metadata", err);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteDocument = async (e: React.MouseEvent, docId: number) => {
        e.stopPropagation();
        if (!auth.currentUser) return;
        if (!window.confirm("Are you sure you want to permanently delete this audit document?")) return;

        try {
            await api.deleteAuditDocument(docId, auth.currentUser.uid);
            setHistory(prev => prev.filter(item => item.id !== docId));
            if (docId === documentId) {
                setHasUploadedData(false);
            }
        } catch (err) {
            console.error("Failed to delete document", err);
        }
    };

    const handleClearHistory = async () => {
        if (!auth.currentUser) return;
        if (!window.confirm("WARNING: Are you sure you want to clear ALL past audits? This cannot be undone.")) return;

        try {
            await api.clearUserHistory(auth.currentUser.uid);
            setHistory([]);
            setHasUploadedData(false);
        } catch (err) {
            console.error("Failed to clear history", err);
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-8 xl:p-12 mb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-on-surface tracking-tight mb-2 flex items-center gap-3">
                        <HistoryIcon className="w-8 h-8 text-primary" />
                        Past Audits
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl">
                        Review your previously uploaded documents and reload past compliance results into the live dashboard.
                    </p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="px-4 py-2 rounded-full border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
                    >
                        <Trash2 className="w-4 h-4" /> Clear All History
                    </button>
                )}
            </div>

            {loading ? (
                <div className="w-full flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : history.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 border border-outline-variant/30">
                    <FileText className="w-16 h-16 text-outline-variant mb-2" />
                    <h3 className="text-2xl font-bold text-on-surface font-headline">No Audits Found</h3>
                    <p className="text-on-surface-variant max-w-md">
                        {auth.currentUser
                            ? "You haven't uploaded any documents for auditing yet. Head over to the dashboard to start your first analysis."
                            : "Please Sign In to view your private document history."}
                    </p>
                    <Link to="/dashboard" className="px-6 py-3 mt-4 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 transition-colors">
                        Go to Overview <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            key={item.id}
                            className={cn(
                                "group relative glass-card rounded-2xl p-6 border border-outline-variant/30 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block",
                                loadingId === item.id && "animate-pulse ring-2 ring-primary"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteDocument(e, item.id)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface/50 border border-outline-variant/30 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 z-10 block"
                                title="Delete Document"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold font-headline text-on-surface">
                                            {item.health_score ? Math.round(item.health_score) : "--"}<span className="text-sm font-medium text-on-surface-variant">/100</span>
                                        </div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Health Score</p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold font-headline text-on-surface truncate mb-1 pr-6" title={item.filename}>
                                    {item.filename}
                                </h3>
                                <p className="text-xs text-on-surface-variant/80 font-medium tracking-wide mb-6">
                                    Processed {new Date(item.created_at).toLocaleDateString()}
                                </p>

                                <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                                    <div className="bg-surface/50 rounded-lg p-2 border border-outline-variant/20">
                                        <span className="block text-lg font-bold text-blue-400">{item.transactions_count}</span>
                                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Rows</span>
                                    </div>
                                    <div className="bg-surface/50 rounded-lg p-2 border border-outline-variant/20">
                                        <span className="block text-lg font-bold text-red-500">{item.critical_count}</span>
                                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Critical</span>
                                    </div>
                                    <div className="bg-surface/50 rounded-lg p-2 border border-outline-variant/20">
                                        <span className="block text-lg font-bold text-orange-400">{item.violations_count}</span>
                                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Anomalies</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleLoadAudit(item.id)}
                                disabled={loadingId !== null}
                                className="w-full py-2.5 rounded-xl border border-outline-variant/50 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-foreground/5 text-on-surface transition-colors relative z-0"
                            >
                                {loadingId === item.id ? (
                                    <>Loading Context <div className="w-3 h-3 rounded-full border-2 border-on-surface border-t-transparent animate-spin ml-2"></div></>
                                ) : (
                                    <>Load into Dashboard <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" /></>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
