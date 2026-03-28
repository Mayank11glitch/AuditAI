import { useRef } from "react";

import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ShinyButton } from "@/components/ui/shiny-button";
import { useAppContext } from "@/context/AppContext";
import { Component as HorizonHero } from "@/components/ui/horizon-hero-section";



export default function Home() {
    const navigate = useNavigate();
    const { auditResults, hasUploadedData } = useAppContext();
    const containerRef = useRef<HTMLDivElement>(null);

    // Raw scroll progress for the entire page
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    // Smooth the scroll progress with spring physics for cinematic, inertial scrolling
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.001
    });

    // Each section gets a different parallax depth (higher = moves more = feels closer)
    // Using numeric pixel values so spring damping can interpolate correctly
    const yHero      = useTransform(smoothProgress, [0, 1], [0,  -120]);
    const yPipeline  = useTransform(smoothProgress, [0, 1], [0,  -70]);
    const yHealth    = useTransform(smoothProgress, [0, 1], [0,  -40]);
    const yStats     = useTransform(smoothProgress, [0, 1], [0,  -20]);
    const yFooter    = useTransform(smoothProgress, [0, 1], [0,    0]);


    const healthScore = hasUploadedData && auditResults?.health_score?.overall != null
        ? Math.round(auditResults.health_score.overall) : null;
    const circumference = 880;
    const strokeDashoffset = healthScore != null ? circumference * (1 - healthScore / 100) : circumference * 0.15;
    const statusLabel = healthScore != null
        ? (healthScore >= 80 ? "Optimal Status" : healthScore >= 50 ? "Needs Attention" : "Critical Risk")
        : "No Data Yet";
    const statusColor = healthScore != null
        ? (healthScore >= 80 ? "text-tertiary" : healthScore >= 50 ? "text-yellow-400" : "text-red-500")
        : "text-on-surface-variant";

    return (
        <div ref={containerRef} className="dark bg-background text-on-background font-body selection:bg-primary selection:text-on-primary-container relative">
            {/* 3D Horizon Hero Section — fastest parallax layer */}
            <motion.div style={{ y: yHero }}>
                <HorizonHero />
            </motion.div>

            {/* Multi-Agent AI Pipeline — mid-speed parallax */}
            <motion.div style={{ y: yPipeline }}>
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-3xl font-headline font-bold mb-4">Multi-Agent AI Pipeline</h2>
                    <div className="w-20 h-1 bg-tertiary rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Agent 1: Document Parsing */}
                    <div className="md:col-span-8 glass-card rounded-3xl p-8 ghost-border relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-surface-container-highest">
                            <span className="material-symbols-outlined text-8xl opacity-10">description</span>
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-10 h-10 bg-primary-container/20 flex items-center justify-center rounded-lg border border-primary/30">
                                    <span className="material-symbols-outlined text-primary">data_object</span>
                                </div>
                                <h3 className="text-2xl font-headline font-semibold">Document Parsing Agent</h3>
                            </div>
                            <p className="text-on-surface-variant text-lg mb-8 max-w-md">
                                Neural OCR and computer vision layers extract high-fidelity data from unstructured receipts,
                                invoices, and bank statements with 99.9% accuracy.
                            </p>
                            <div className="mt-auto grid grid-cols-2 gap-4">
                                <div className="bg-surface-container-lowest p-4 rounded-xl">
                                    <p className="text-xs text-on-surface-variant uppercase mb-1">Processing Rate</p>
                                    <p className="text-2xl font-headline text-tertiary">420 Docs/Min</p>
                                </div>
                                <div className="bg-surface-container-lowest p-4 rounded-xl">
                                    <p className="text-xs text-on-surface-variant uppercase mb-1">Confidence Score</p>
                                    <p className="text-2xl font-headline text-primary">High Accuracy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Agent 2: Transaction Extraction */}
                    <div
                        className="md:col-span-4 bg-surface-container-low rounded-3xl p-8 ghost-border flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-secondary-container/30 flex items-center justify-center rounded-2xl mb-6">
                                <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
                            </div>
                            <h3 className="text-xl font-headline font-semibold mb-3">Transaction Extraction</h3>
                            <p className="text-on-surface-variant text-sm leading-relaxed">
                                Automatic categorization of cash flows into ledger-ready entities, grouping by merchant, tax
                                code, and department.
                            </p>
                        </div>
                        <div className="mt-8 space-y-2">
                            <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full bg-secondary w-2/3"></div>
                            </div>
                            <p className="text-[10px] text-on-surface-variant font-label tracking-widest text-right">ORGANIZING
                                FLOWS...</p>
                        </div>
                    </div>
                    {/* Agent 3: Compliance Validator */}
                    <div
                        className="md:col-span-5 bg-surface-container-high rounded-3xl p-8 ghost-border border-l-4 border-l-tertiary">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-tertiary">gavel</span>
                            <h3 className="text-xl font-headline font-semibold">Compliance Validator</h3>
                        </div>
                        <p className="text-on-surface-variant mb-6">
                            Cross-checking every entry against the latest GST/Regulatory mandates. Detecting anomalies in tax
                            computation before they hit the portal.
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest">
                                <span className="text-sm">GST Rule #42a</span>
                                <span
                                    className="px-2 py-1 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold">VERIFIED</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest">
                                <span className="text-sm">TDS Compliance</span>
                                <span
                                    className="px-2 py-1 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold">VERIFIED</span>
                            </div>
                        </div>
                    </div>
                    {/* Agent 4: Explanation Agent */}
                    <div className="md:col-span-7 glass-card rounded-3xl p-8 ghost-border">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary">chat_bubble_outline</span>
                            <h3 className="text-xl font-headline font-semibold text-primary">Explanation Agent</h3>
                        </div>
                        <div
                            className="bg-surface-container-lowest/50 p-6 rounded-2xl border border-outline-variant/10 italic text-on-surface mb-6 relative">
                            <span
                                className="material-symbols-outlined absolute -top-3 -left-3 text-primary text-3xl">format_quote</span>
                            "The discrepancy in the Q3 ledger is due to an unlinked Input Tax Credit from Invoice #8821. I
                            recommend immediate reconciliation to prevent a ₹15,000 fine."
                        </div>
                        <div className="flex items-center gap-4">
                            <img className="w-10 h-10 rounded-full object-cover border border-primary"
                                alt="professional woman in executive attire looking at laptop screen with a serious yet confident expression"
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop" />
                            <div>
                                <p className="text-xs font-label text-on-surface font-bold">Insight Delivery</p>
                                <p className="text-[10px] text-on-surface-variant">Natural Language Audit Report Generated</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            </motion.div>

            {/* Financial Health Score — slower parallax */}
            <motion.div style={{ y: yHealth }}>
            <section className="py-24 bg-surface-container-lowest relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl font-headline font-bold mb-6">Real-time <span className="text-tertiary">Violation
                            Detection</span></h2>
                        <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
                            Our platform monitors your financial health 24/7. Don't wait for year-end reviews to find errors.
                            Detect and resolve compliance drift as it happens.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-tertiary mt-1">check_circle</span>
                                <div>
                                    <p className="font-headline font-semibold">Zero-Latency Scanning</p>
                                    <p className="text-sm text-on-surface-variant">Continuous monitoring of all inbound and outbound
                                        transactions.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-tertiary mt-1">check_circle</span>
                                <div>
                                    <p className="font-headline font-semibold">Drift Analysis</p>
                                    <p className="text-sm text-on-surface-variant">AI identifies pattern shifts that suggest
                                        potential audit triggers.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="relative flex justify-center">
                        {/* Trust Gauge Component */}
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle className="text-surface-container-high" cx="160" cy="160" fill="transparent" r="140"
                                    stroke="currentColor" strokeWidth="20" />
                                <circle cx="160" cy="160" fill="transparent" r="140" stroke="url(#gradient-tertiary)"
                                    strokeDasharray="880" strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="20" />
                                <defs>
                                    <linearGradient id="gradient-tertiary" x1="0%" x2="100%" y1="0%" y2="0%">
                                        <stop offset="0%" stopColor="#4cd7f6" />
                                        <stop offset="100%" stopColor="#009eb9" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">Health
                                    Score</p>
                                <p className="text-6xl font-headline font-extrabold text-on-surface">{healthScore != null ? healthScore : "--"}</p>
                                <p className={`text-sm font-headline mt-1 ${statusColor}`}>{statusLabel}</p>
                            </div>
                            {/* Traceability Thread Decor */}
                            <div className="absolute -bottom-10 -right-10 glass-card p-4 rounded-xl ghost-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-error"></span>
                                    <p className="text-[10px] font-bold uppercase text-error">Warning</p>
                                </div>
                                <p className="text-xs font-body">GST Mismatch in Vendor #A92</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            </motion.div>

            {/* Statistics — very slow parallax */}
            <motion.div style={{ y: yStats }}>
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <p className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">90%</p>
                        <p className="text-sm text-on-surface-variant uppercase tracking-widest">Cost Reduction</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">10x</p>
                        <p className="text-sm text-on-surface-variant uppercase tracking-widest">Audit Speed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">0.0%</p>
                        <p className="text-sm text-on-surface-variant uppercase tracking-widest">Human Error</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">12k+</p>
                        <p className="text-sm text-on-surface-variant uppercase tracking-widest">MSMEs Secured</p>
                    </div>
                </div>
            </section>
            </motion.div>

            {/* Footer — no parallax, anchored */}
            <motion.div style={{ y: yFooter }}>
            <footer className="bg-surface-container-lowest pt-20 pb-10 px-6 border-t border-outline-variant/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-20">
                        <div className="max-w-md">
                            <h3 className="text-3xl font-headline font-bold mb-4">Secure your <span className="text-gradient">Financial
                                Future</span> today.</h3>
                            <p className="text-on-surface-variant mb-6">Stop risking penalties and wasting manpower on manual
                                compliance logs. Experience the power of the Luminal Auditor.</p>
                            <div className="flex gap-4">
                                <ShinyButton onClick={() => navigate('/pipeline')}>Run Live Pipeline Demo</ShinyButton>
                                <ShinyButton onClick={() => navigate('/login')}>Explore Open Dashboard</ShinyButton>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <p className="font-headline font-bold mb-4 text-on-surface">Platform</p>
                                <ul className="space-y-2 text-on-surface-variant text-sm">
                                    <li><a className="hover:text-primary transition-colors" href="#">AI Pipeline</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">API Access</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-headline font-bold mb-4 text-on-surface">Company</p>
                                <ul className="space-y-2 text-on-surface-variant text-sm">
                                    <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">Case Studies</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div
                        className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-outline-variant/10 gap-6">
                        <span className="text-xl font-bold tracking-tight text-blue-400 font-headline">AuditAI</span>
                        <p className="text-xs text-on-surface-variant font-label uppercase tracking-[0.2em]">© 2024 AuditAI
                            Technologies Pvt Ltd. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span
                                className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">public</span>
                            <span
                                className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">chat</span>
                            <span
                                className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">mail</span>
                        </div>
                    </div>
                </div>
            </footer>
            </motion.div>
        </div>
    )
}
