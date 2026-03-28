import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Filter, Download, Search, AlertCircle, AlertTriangle, CheckCircle, ChevronRight, Activity, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

// Mock Data representing A3 Validator Agent output
const mockViolations = [
    { id: "TXN-8921", date: "2023-11-20", description: "Uncategorized Wire Transfer to Offshore Entity", rule: "AML Policy 4.2", severity: "HIGH", amount: "$45,000" },
    { id: "TXN-8914", date: "2023-11-19", description: "Missing Receipt for Entertainment Expense", rule: "T&E Policy 2.1", severity: "MEDIUM", amount: "$1,250" },
    { id: "TXN-8902", date: "2023-11-18", description: "Duplicate Invoice Payment Detected", rule: "AP Control 1.4", severity: "HIGH", amount: "$8,500" },
    { id: "TXN-8899", date: "2023-11-15", description: "Standard Office Supply Purchase", rule: "Procurement 1.0", severity: "LOW", amount: "$340" },
    { id: "TXN-8871", date: "2023-11-12", description: "Contractor Payment Missing W-9", rule: "Vendor Onboarding 3.3", severity: "MEDIUM", amount: "$3,000" },
    { id: "TXN-8865", date: "2023-11-10", description: "Monthly Software Subscription", rule: "IT Procurement 2.0", severity: "LOW", amount: "$120" },
    { id: "TXN-8850", date: "2023-11-05", description: "Cash Withdrawal Without Justification", rule: "Cash Management 5.1", severity: "HIGH", amount: "$5,000" },
];

export default function Violations() {
    const { hasUploadedData, auditResults } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string | null>(null);
    const [selectedViolation, setSelectedViolation] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const exportToCSV = () => {
        if (!filteredViolations.length) return;
        const headers = ["Transaction ID", "Date", "Description", "Rule", "Amount", "Severity"];
        const rows = filteredViolations.map((v: any) => [v.id, v.date, `"${v.description}"`, `"${v.rule}"`, v.amount, v.severity]);
        const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "audit_violations.csv";
        a.click();
    };

    const realViolations = (auditResults?.violations || []).map((v: any, index: number) => ({
        id: v.transaction_id ? `TXN-${v.transaction_id}` : `ERR-${index}`,
        date: "2024 (Auto-detected)",
        description: v.reason || "Unknown violation reason",
        rule: v.rule_id ? `Rule #${v.rule_id}` : "System Policy",
        severity: v.severity || "MEDIUM",
        amount: v.estimated_penalty ? `₹${Number(v.estimated_penalty).toLocaleString()}` : "₹0"
    }));

    const dataToUse = hasUploadedData ? realViolations : mockViolations;

    // Severity counts — prefer score engine's pre-computed breakdown if available
    const severityCounts = hasUploadedData && auditResults?.health_score?.severity_counts
        ? auditResults.health_score.severity_counts
        : {
            HIGH:   dataToUse.filter((v: any) => v.severity === "HIGH").length,
            MEDIUM: dataToUse.filter((v: any) => v.severity === "MEDIUM").length,
            LOW:    dataToUse.filter((v: any) => v.severity === "LOW").length,
        };

    const filteredViolations = dataToUse.filter((v: any) => {
        const matchesSearch =
            v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter ? v.severity === severityFilter : true;
        return matchesSearch && matchesSeverity;
    });

    const totalPages = Math.max(1, Math.ceil(filteredViolations.length / ITEMS_PER_PAGE));
    // Reset to page 1 whenever filter or search changes
    React.useEffect(() => { setCurrentPage(1); }, [searchTerm, severityFilter]);
    const pagedViolations = filteredViolations.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wider">
                        <AlertCircle className="w-3 h-3" /> HIGH
                    </div>
                );
            case 'MEDIUM':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wider">
                        <AlertTriangle className="w-3 h-3" /> MEDIUM
                    </div>
                );
            case 'LOW':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-wider">
                        <CheckCircle className="w-3 h-3" /> LOW
                    </div>
                );
            default:
                return null;
        }
    };

    const filterBtnStyle =
        severityFilter === 'HIGH'   ? 'text-red-400 border-red-500/40 bg-red-500/10' :
        severityFilter === 'MEDIUM' ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
        severityFilter === 'LOW'    ? 'text-green-400 border-green-500/40 bg-green-500/10' :
        'text-on-surface-variant hover:text-foreground';

    return (
        <div className="w-full h-full p-4 md:p-8 xl:p-12 mb-20 max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-on-surface tracking-tight mb-2">
                        Violation Dashboard
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl">
                        Review all compliance anomalies flagged by the Validator Agent across your recently uploaded datasets.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const order = [null, 'HIGH', 'MEDIUM', 'LOW'] as const;
                            const nextIndex = (order.indexOf(severityFilter as any) + 1) % order.length;
                            setSeverityFilter(order[nextIndex]);
                        }}
                        className={cn("glass-button px-4 py-2 flex items-center gap-2 text-sm font-semibold border transition-colors", filterBtnStyle)}
                    >
                        <Filter className="w-4 h-4" />
                        {severityFilter ? `Filter: ${severityFilter}` : 'Filter'}
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="glass-button px-4 py-2 flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-foreground"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── Severity Summary Stat Cards (clickable filters) ── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {/* HIGH */}
                <button
                    id="severity-card-high"
                    onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? null : 'HIGH')}
                    className={cn(
                        "glass-card rounded-2xl p-4 border flex items-center gap-4 transition-all cursor-pointer group text-left",
                        severityFilter === 'HIGH'
                            ? "border-red-500/60 bg-red-500/15 shadow-lg"
                            : "border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5"
                    )}
                >
                    <div className="w-11 h-11 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/30 group-hover:scale-110 transition-transform flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-red-400/70 font-semibold">High Risk</p>
                        <p className="text-3xl font-bold text-red-400 font-headline leading-none mt-0.5">{severityCounts.HIGH}</p>
                    </div>
                </button>

                {/* MEDIUM */}
                <button
                    id="severity-card-medium"
                    onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? null : 'MEDIUM')}
                    className={cn(
                        "glass-card rounded-2xl p-4 border flex items-center gap-4 transition-all cursor-pointer group text-left",
                        severityFilter === 'MEDIUM'
                            ? "border-yellow-500/60 bg-yellow-500/15 shadow-lg"
                            : "border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5"
                    )}
                >
                    <div className="w-11 h-11 rounded-full bg-yellow-500/15 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-yellow-400/70 font-semibold">Medium Risk</p>
                        <p className="text-3xl font-bold text-yellow-400 font-headline leading-none mt-0.5">{severityCounts.MEDIUM}</p>
                    </div>
                </button>

                {/* LOW */}
                <button
                    id="severity-card-low"
                    onClick={() => setSeverityFilter(severityFilter === 'LOW' ? null : 'LOW')}
                    className={cn(
                        "glass-card rounded-2xl p-4 border flex items-center gap-4 transition-all cursor-pointer group text-left",
                        severityFilter === 'LOW'
                            ? "border-green-500/60 bg-green-500/15 shadow-lg"
                            : "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5"
                    )}
                >
                    <div className="w-11 h-11 rounded-full bg-green-500/15 flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-green-400/70 font-semibold">Low Risk</p>
                        <p className="text-3xl font-bold text-green-400 font-headline leading-none mt-0.5">{severityCounts.LOW}</p>
                    </div>
                </button>
            </div>

            {/* ── Main Table Card ── */}
            <div className="glass-card glass-border rounded-2xl border border-outline-variant/30 overflow-hidden flex flex-col relative min-h-[500px]">
                {/* Table Toolbar */}
                <div className={cn("p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface/30 transition-all duration-700", !hasUploadedData && "opacity-20 pointer-events-none blur-sm select-none")}>
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            type="text"
                            placeholder="Search transactions or descriptions..."
                            className="w-full bg-surface-variant/30 border border-outline-variant/40 rounded-xl py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                        <span>Showing {filteredViolations.length} records</span>
                        {severityFilter && (
                            <button
                                onClick={() => setSeverityFilter(null)}
                                className="flex items-center gap-1 text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors"
                            >
                                <X className="w-3 h-3" /> Clear filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className={cn("overflow-x-auto w-full flex-grow transition-all duration-700", !hasUploadedData && "opacity-20 pointer-events-none blur-sm select-none")}>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Violated Rule</th>
                                <th className="px-6 py-4">Penalty</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                        {pagedViolations.map((v: any) => (
                                <tr
                                    key={v.id}
                                    onClick={() => setSelectedViolation(v)}
                                    className="hover:bg-white/[0.025] transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-on-surface">{v.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{v.date}</td>
                                    <td className="px-6 py-4 text-sm text-on-surface max-w-xs truncate">{v.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{v.rule}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-on-surface">{v.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getSeverityBadge(v.severity)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-on-surface-variant group-hover:text-primary transition-colors">
                                        <ChevronRight className="w-5 h-5 ml-auto" />
                                    </td>
                                </tr>
                            ))}
                            {pagedViolations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                        {searchTerm
                                            ? `No records found matching "${searchTerm}"`
                                            : severityFilter
                                            ? `No ${severityFilter} severity violations found.`
                                            : "No violations found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className={cn("p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface/30 transition-all duration-700", !hasUploadedData && "opacity-20 pointer-events-none blur-sm select-none")}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "w-8 h-8 rounded-lg font-semibold text-sm transition-colors",
                                    page === currentPage
                                        ? "bg-primary text-primary-foreground"
                                        : "text-on-surface-variant hover:text-on-surface hover:bg-foreground/5"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>

                {/* Empty State Overlay */}
                {!hasUploadedData && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center space-y-4 bg-surface/10 backdrop-blur-[2px]">
                        <div className="w-20 h-20 rounded-full bg-outline-variant/10 flex items-center justify-center border border-outline-variant/20 shadow-2xl">
                            <ShieldAlert className="w-10 h-10 text-outline-variant opacity-50" />
                        </div>
                        <div className="glass-card px-8 py-6 rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md">
                            <p className="text-xl font-bold font-headline text-on-surface mb-2">No Active Violations</p>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                                Your violation queue is empty. Upload a financial dataset in the Dashboard to run the Validator Agent and detect anomalies.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal — rendered via portal so it covers full viewport incl. navbar */}
            {selectedViolation && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-md p-4 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedViolation(null); }}
                >
                    <div className="glass-card rounded-2xl w-full max-w-lg border border-outline-variant/50 shadow-lg my-auto flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-start bg-surface-variant/20 flex-shrink-0 rounded-t-2xl">
                            <div>
                                <h2 className="text-2xl font-bold font-headline text-on-surface mb-1 font-mono">{selectedViolation.id}</h2>
                                <p className="text-sm text-on-surface-variant font-semibold bg-surface/50 px-2 py-0.5 rounded w-fit">{selectedViolation.rule}</p>
                            </div>
                            <button
                                onClick={() => setSelectedViolation(null)}
                                className="w-8 h-8 rounded-full bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:text-foreground hover:bg-surface-variant transition-colors flex-shrink-0 ml-4"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Scrollable body */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Description</p>
                                <p className="text-base text-on-surface leading-relaxed">{selectedViolation.description}</p>
                            </div>
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Severity</p>
                                    {getSeverityBadge(selectedViolation.severity)}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Total Penalty</p>
                                    <p className="text-lg font-bold text-on-surface">{selectedViolation.amount}</p>
                                </div>
                            </div>
                            {auditResults?.violations?.find((v: any) => `TXN-${v.transaction_id}` === selectedViolation.id)?.recommendation && (
                                <div className="pt-2">
                                    <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-2 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary" /> AI Recommendation
                                    </p>
                                    <p className="text-sm text-on-surface leading-relaxed p-4 bg-primary/10 border border-primary/30 rounded-xl text-primary-light shadow-inner shadow-primary/5">
                                        {auditResults.violations.find((v: any) => `TXN-${v.transaction_id}` === selectedViolation.id).recommendation}
                                    </p>
                                </div>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="p-4 border-t border-outline-variant/30 bg-surface/30 flex justify-end flex-shrink-0 rounded-b-2xl">
                            <button
                                onClick={() => setSelectedViolation(null)}
                                className="px-6 py-2 rounded-full bg-surface-variant hover:bg-surface hover:text-foreground text-on-surface text-sm font-semibold transition-colors border border-outline-variant/50"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
