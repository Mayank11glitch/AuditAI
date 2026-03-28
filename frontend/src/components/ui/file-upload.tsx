import React, { useState, useCallback } from "react";
import { UploadCloud, FileType, CheckCircle, X, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { PixelCanvas } from "@/components/ui/pixel-canvas";


export function FileUpload({ onUploadComplete }: { onUploadComplete?: (file: File, auditResults: any, documentId: number) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const allowedTypes = ["application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFile = (selectedFile: File) => {
        if (!allowedTypes.includes(selectedFile.type)) {
            setErrorMessage("Only PDF, CSV, and XLS/XLSX files are supported.");
            return false;
        }
        if (selectedFile.size > maxSizeBytes) {
            setErrorMessage("File exceeds the 10MB limit.");
            return false;
        }
        return true;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setErrorMessage("");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const selectedFile = e.dataTransfer.files[0];
            if (validateFile(selectedFile)) {
                startUpload(selectedFile);
            } else {
                setUploadState('error');
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMessage("");
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                startUpload(selectedFile);
            } else {
                setUploadState('error');
            }
        }
    };

    const startUpload = async (selectedFile: File) => {
        setFile(selectedFile);
        setUploadState('uploading');

        try {
            const { api } = await import("@/lib/api");
            const { auth } = await import("@/lib/firebase");
            const res = await api.uploadDocument(selectedFile, auth.currentUser?.uid);

            if (res.success) {
                const auditRes = await api.runAuditPipeline(res.document_id, res.extracted_text);
                setUploadState('success');
                if (onUploadComplete) onUploadComplete(selectedFile, auditRes, res.document_id);
            } else {
                console.error(res.error);
                setErrorMessage(res.error || "Upload failed");
                setUploadState('error');
            }
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || "An error occurred during upload.");
            setUploadState('error');
        }
    };

    const resetUpload = () => {
        setFile(null);
        setUploadState('idle');
        setErrorMessage("");
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
        if (fileType.includes("csv") || fileType.includes("excel") || fileType.includes("spreadsheet")) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        return <FileType className="w-8 h-8 text-blue-500" />;
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
                {uploadState === 'idle' || uploadState === 'error' ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                            "relative group glass-card rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden border border-foreground/5",
                            isDragging ? "bg-foreground/5 shadow-lg ring-1 ring-white/20" : "hover:bg-foreground/[0.02]"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Subtle grid pattern inside */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
                        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-foreground/5 shadow-inner flex items-center justify-center mb-2 border border-foreground/10 group-hover:scale-110 group-hover:bg-foreground/10 transition-all duration-500 ease-out">
                                <UploadCloud className="w-10 h-10 text-foreground transition-transform duration-300" />
                            </div>
                            <h3 className="text-2xl font-bold font-headline text-foreground">Upload Documents</h3>
                            <p className="text-foreground/60 max-w-sm text-sm">Drag and drop your financial documents here to initiate the AI compliance pipeline.</p>

                            <div className="flex items-center gap-2 pt-4">
                                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">PDF</span>
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">CSV</span>
                                <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground/70 text-xs font-semibold border border-foreground/20">XLS</span>
                            </div>

                            {uploadState === 'error' && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="pt-6 relative">
                                <input
                                    type="file"
                                    id="fileUpload"
                                    className="hidden"
                                    accept=".pdf,.csv,.xls,.xlsx"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className="btn-53"
                                >
                                    <div className="original">Browse Files</div>
                                    <div className="letters">
                                        <span>B</span>
                                        <span>r</span>
                                        <span>o</span>
                                        <span>w</span>
                                        <span>s</span>
                                        <span>e</span>
                                        <span>&nbsp;</span>
                                        <span>F</span>
                                        <span>i</span>
                                        <span>l</span>
                                        <span>e</span>
                                        <span>s</span>
                                    </div>
                                </label>
                            </div>
                            <p className="text-xs text-foreground/40 mt-4">Max file size: 10MB</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="uploading-success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col items-center"
                    >
                        <PixelCanvas gap={8} speed={25} colors={uploadState === 'uploading' ? ["#3b82f6", "#60a5fa", "#93c5fd"] : ["#22c55e", "#4ade80", "#86efac"]} variant="icon" noFocus />
                        {uploadState === 'uploading' && <div className="absolute top-0 left-0 h-1 w-full bg-surface-variant overflow-hidden z-20"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} className="h-full bg-primary"></motion.div></div>}

                        <div className="flex flex-col items-center justify-center text-center space-y-6 pt-4">
                            <div className="relative">
                                {uploadState === 'uploading' ? (
                                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary border-t-transparent animate-spin">
                                        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center animate-none">
                                            {file && getFileIcon(file.type)}
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border 2 border-green-500/30">
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold font-headline text-on-surface">
                                    {uploadState === 'uploading' ? "Processing via AI Pipeline..." : "Analysis Complete"}
                                </h3>
                                <p className="text-on-surface-variant text-sm">
                                    {file?.name} ({(file?.size! / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>

                            {uploadState === 'uploading' ? (
                                <div className="w-full max-w-xs space-y-3 pt-4 text-sm text-left">
                                    <div className="flex items-center gap-3 text-on-surface"><Loader2 className="w-4 h-4 animate-spin text-primary" /> <span>A1: Document Parser (Gemini)</span></div>
                                    <div className="flex items-center gap-3 text-on-surface-variant opacity-70"><Loader2 className="w-4 h-4 text-transparent" /> <span>A2: Rule Extraction Agent</span></div>
                                    <div className="flex items-center gap-3 text-on-surface-variant opacity-70"><Loader2 className="w-4 h-4 text-transparent" /> <span>A3: Validator Agent</span></div>
                                </div>
                            ) : (
                                <div className="pt-4 flex gap-4 w-full justify-center">
                                    <button onClick={resetUpload} className="px-6 py-2 rounded-full border border-outline-variant/50 hover:bg-foreground/5 transition-colors text-sm font-semibold">Upload Another</button>
                                    <Link to="/violations" className="px-6 py-2 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground transition-colors text-sm font-semibold flex items-center gap-2">View Dashboard <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Temporary inline icon for mapping layout issues if needed
const ArrowRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
