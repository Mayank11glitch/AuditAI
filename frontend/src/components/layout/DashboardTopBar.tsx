import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, AlertTriangle, Network, Archive,
    LogOut, Menu, X, ShieldCheck, ChevronRight, MessageSquare, Moon, Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'


const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Past Audits', href: '/history', icon: Archive },
    { name: 'Violations', href: '/violations', icon: AlertTriangle },
    { name: 'Knowledge Graph', href: '/graph', icon: Network },
]

interface DashboardTopBarProps {
    onMobileMenuToggle?: () => void
    isMobileMenuOpen?: boolean
}

export function DashboardTopBar({ onMobileMenuToggle, isMobileMenuOpen }: DashboardTopBarProps) {
    const location = useLocation()

    const [isScrolled, setIsScrolled] = React.useState(false)
    const [menuState, setMenuState] = React.useState(false)

    React.useEffect(() => {
        const el = document.getElementById('dashboard-scroll-area')
        const handleScroll = () => setIsScrolled((el?.scrollTop ?? 0) > 40)
        el?.addEventListener('scroll', handleScroll)
        // fallback to window scroll
        window.addEventListener('scroll', handleScroll)
        return () => {
            el?.removeEventListener('scroll', handleScroll)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])


    return (
        <header className="relative z-30 w-full flex-shrink-0">
            <nav
                data-state={menuState ? 'active' : undefined}
                className="w-full px-4 pt-3 pb-1 group"
            >
                <div
                    className={cn(
                        'mx-auto transition-all duration-300 ease-in-out',
                        isScrolled
                            ? 'max-w-5xl bg-surface/70 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-lg px-5 py-2'
                            : 'max-w-full px-2 py-1'
                    )}
                >
                    <div className="relative flex items-center justify-between gap-4">

                        {/* ── Logo + Brand ── */}
                        <Link to="/dashboard" aria-label="Dashboard home" className="flex items-center gap-2.5 flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                            </div>
                            <span className={cn(
                                "font-headline font-bold tracking-tight text-on-surface transition-all duration-300",
                                isScrolled ? "text-base" : "text-lg"
                            )}>
                                AuditAI
                            </span>
                        </Link>

                        {/* ── Desktop Nav Links (center) ── */}
                        <div className="absolute inset-0 m-auto hidden size-fit lg:flex items-center">
                            <ul className="flex gap-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                                                    isActive
                                                        ? 'bg-foreground/10 text-on-surface border border-foreground/10'
                                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-foreground/5'
                                                )}
                                            >
                                                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "")} />
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        {/* ── Right Side ── */}
                        <div className="flex items-center gap-2 flex-shrink-0">

                            <div className="hidden sm:block mr-2">
                                <ThemeToggle />
                            </div>

                            {/* AI Chatbot link */}
                            <Link
                                to="/chat"
                                className={cn(
                                    'relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                                    location.pathname === '/chat'
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'text-on-surface-variant hover:text-green-400 hover:bg-green-500/10'
                                )}
                                title="AI Chatbot"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {/* Online pulse dot */}
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            </Link>

                            {/* Current page breadcrumb on scroll */}
                            {isScrolled && (
                                <div className="hidden md:flex items-center gap-1 text-xs text-on-surface-variant">
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="capitalize font-medium">
                                        {navItems.find(n => n.href === location.pathname)?.name ?? 'Dashboard'}
                                    </span>
                                </div>
                            )}

                            {/* Sign Out */}
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "hidden sm:inline-flex gap-1.5 text-on-surface-variant hover:text-on-surface rounded-lg text-sm",
                                    isScrolled ? "lg:hidden" : ""
                                )}
                            >
                                <Link to="/">
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </Link>
                            </Button>

                            {/* Upload CTA — shown on scroll when condensed */}
                            <Button
                                asChild
                                size="sm"
                                className={cn(
                                    "rounded-lg text-xs px-3 gap-1.5 bg-primary/90 hover:bg-primary transition-all",
                                    isScrolled ? "lg:inline-flex" : "hidden lg:hidden"
                                )}
                            >
                                <Link to="/dashboard">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Run Audit</span>
                                </Link>
                            </Button>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => { setMenuState(!menuState); onMobileMenuToggle?.() }}
                                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                                className="lg:hidden relative z-20 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-foreground/5 transition-colors"
                            >
                                <Menu className={cn(
                                    "w-5 h-5 transition-all duration-200",
                                    (isMobileMenuOpen || menuState) ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100"
                                )} />
                                <X className={cn(
                                    "w-5 h-5 transition-all duration-200",
                                    (isMobileMenuOpen || menuState) ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"
                                )} />
                            </button>
                        </div>
                    </div>

                    {/* ── Mobile dropdown nav ── */}
                    <div className={cn(
                        "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
                        menuState ? "max-h-[400px] opacity-100 pb-4 pt-3" : "max-h-0 opacity-0"
                    )}>
                        <ul className="flex flex-col gap-1 border-t border-outline-variant/20 pt-3">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.href
                                return (
                                    <li key={item.href}>
                                        <Link
                                            to={item.href}
                                            onClick={() => setMenuState(false)}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-foreground/10 text-on-surface border border-foreground/10'
                                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-foreground/5'
                                            )}
                                        >
                                            <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                            <li className="pt-2 border-t border-outline-variant/20 mt-1">
                                <Link
                                    to="/"
                                    onClick={() => setMenuState(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-foreground/5 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    )
}
