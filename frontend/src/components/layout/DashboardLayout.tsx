import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, AlertTriangle, Network, MessageSquare, LogOut, Settings, Menu, X, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChat } from "@/components/ui/ai-chat";
import { MenuVertical } from "@/components/ui/menu-vertical";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { HeroWave } from "@/components/ui/ai-input-hero";
import { ThemeToggle } from "@/components/theme-toggle";

const SidebarItem = ({ icon: Icon, label, href, active, gradient, iconColor }: any) => (
  <Link
    to={href}
    className={cn(
      "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden group mb-2 cursor-pointer",
      active ? "bg-foreground/5 border border-foreground/10" : "hover:bg-foreground/5 transparent"
    )}
  >
    {active && (
      <div
        className="absolute inset-0 opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{ background: gradient }}
      ></div>
    )}
    <div className={cn(
      "flex items-center justify-center relative z-10 transition-colors duration-300",
      active ? iconColor : "text-on-surface-variant group-hover:text-on-surface"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <span className={cn(
      "font-medium text-sm z-10 transition-colors duration-300",
      active ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"
    )}>
      {label}
    </span>
  </Link>
);

// Pages that should show the top nav bar (hero-section-1 pattern)
// Excludes: chat (has its own feel), home, login
const TOPBAR_PAGES = ["/dashboard", "/history", "/violations", "/graph", "/chat"];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const showTopBar = TOPBAR_PAGES.includes(location.pathname);

  // Initialize smooth scroll loop & close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);

    if (!scrollRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: contentRef.current,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1.2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Snap to top and recalculate dimensions on route change
    lenis.resize();

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);

  const navigation = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard", gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)", iconColor: "text-blue-400" },
    { icon: Archive, label: "Past Audits", href: "/history", gradient: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(202,138,4,0.06) 50%, rgba(161,98,7,0) 100%)", iconColor: "text-yellow-400" },
    { icon: AlertTriangle, label: "Violations", href: "/violations", gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)", iconColor: "text-red-400" },
    { icon: Network, label: "Knowledge Graph", href: "/graph", gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)", iconColor: "text-purple-400" },
    { icon: MessageSquare, label: "AI Chatbot", href: "/chat", gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)", iconColor: "text-green-400" },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-background text-on-background font-body overflow-hidden selection:bg-primary selection:text-on-primary-container relative">

      {/* ── Ambient Wave Background — fixed full-screen, purely decorative ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ filter: 'brightness(1.8)' }}>
        <HeroWave
          showContent={false}
          showNavbar={false}
          style={{ opacity: 0.65 }}
        />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — only shown on chat page or as legacy nav on md+ */}
      <aside className={cn(
        "w-64 border-r border-outline-variant/30 bg-surface/90 backdrop-blur-xl flex flex-col h-full absolute md:relative z-50 shadow-lg transition-transform duration-300 left-0 top-0",
        // On desktop: hide sidebar for top-nav pages, only show for chat
        showTopBar ? "hidden" : "hidden md:flex",
        // Mobile: show when toggled
        isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-1.5 flex items-center justify-center font-headline font-bold text-xl w-8 h-8">
              A
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-on-surface">AuditAI</span>
          </div>
          <button
            className="md:hidden text-on-surface-variant hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-2 py-4 flex-grow overflow-y-auto mt-2">
          <p className="px-4 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest mb-4">Core Pipeline</p>
          <div className="space-y-1">
            {navigation.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                active={location.pathname === item.href || (location.pathname === '/' && item.href === '/dashboard')}
              />
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/30 hidden md:flex flex-col gap-2">
          <ThemeToggle />
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors rounded-xl hover:bg-foreground/5">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

        {/* ── Hero-Section-1 style Top Navbar (Dashboard/History/Violations/Graph) ── */}
        {showTopBar && (
          <DashboardTopBar
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
          />
        )}

        {/* Mobile Header for Chat page (no top nav) */}
        {!showTopBar && (
          <header className="md:hidden h-16 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 z-20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-md p-1 flex items-center justify-center font-headline font-bold text-lg w-7 h-7">A</div>
              <span className="font-headline font-bold text-on-surface">AuditAI</span>
            </div>
            <button
              className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-foreground/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>
        )}

        {/* Scrollable Content Container with Page Transitions */}
        <div
          ref={scrollRef}
          id="dashboard-scroll-area"
          className="flex-1 overflow-y-auto overflow-x-hidden w-full relative z-10 flex flex-col"
        >
          <div ref={contentRef} className="flex-1 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1 w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Global Floating AI Chatbot */}
        <AIChat />
      </main>
    </div>
  );
}
