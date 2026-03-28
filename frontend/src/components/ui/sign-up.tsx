import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
import { ArrowRight, Mail, Lock, Eye, EyeOff, X, AlertCircle, PartyPopper, Loader, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { AnimatePresence, motion, useInView, type Variants, type Transition } from "framer-motion";
import { PixelCanvas } from "@/components/ui/pixel-canvas";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// --- CONFETTI LOGIC ---
import type { ReactNode } from "react"
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti"
import confetti from "canvas-confetti"

type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null

const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      if (instanceRef.current) return
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
    } else {
      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- TEXT LOOP ---
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) { clearInterval(timer); return current; }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={transition}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- FEATURE CARD ---
const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="flex items-start gap-4 group"
  >
    <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] border border-foreground/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-on-surface mb-1">{title}</h4>
      <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// --- MODAL STEPS ---
const modalSteps = [
  { message: "Verifying credentials...", icon: <Loader className="w-10 h-10 text-primary animate-spin" /> },
  { message: "Securing your session...", icon: <Loader className="w-10 h-10 text-primary animate-spin" /> },
  { message: "Almost there...", icon: <Loader className="w-10 h-10 text-primary animate-spin" /> },
  { message: "Welcome aboard!", icon: <PartyPopper className="w-10 h-10 text-green-500" /> },
];
const TEXT_LOOP_INTERVAL = 1.5;

// --- MAIN COMPONENT ---
interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onContinueAsGuest?: () => void;
  onSuccess?: () => void;
}

export const AuthComponent = ({ brandName = "AuditAI", onContinueAsGuest, onSuccess }: AuthComponentProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success'>('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const confettiRef = useRef<ConfettiRef>(null);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      fire({ ...defaults, particleCount: 50, origin: { x: 0, y: 1 }, angle: 60 });
      fire({ ...defaults, particleCount: 50, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalStatus !== 'closed') return;

    if (!email || password.length < 6) {
      setModalErrorMessage("Please fill all fields correctly.");
      setModalStatus('error');
      return;
    }
    if (authMode === 'register' && password !== confirmPassword) {
      setModalErrorMessage("Passwords do not match!");
      setModalStatus('error');
      return;
    }

    setModalStatus('loading');
    const startTime = Date.now();
    const totalDuration = (modalSteps.length - 1) * TEXT_LOOP_INTERVAL * 1000;

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, totalDuration - elapsed);

      setTimeout(() => {
        fireSideCanons();
        setModalStatus('success');
        setTimeout(() => {
          onSuccess?.() || onContinueAsGuest?.();
        }, 2500);
      }, remainingTime);

    } catch (error: any) {
      let errorMessage = "An error occurred during authentication.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Your password is too weak.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email.";
      }

      const elapsed = Date.now() - startTime;
      const minErrorWait = 1000;
      setTimeout(() => {
        setModalErrorMessage(errorMessage);
        setModalStatus('error');
      }, Math.max(0, minErrorWait - elapsed));
    }
  };

  useEffect(() => { if (modalStatus === 'success') fireSideCanons(); }, [modalStatus]);

  return (
    <div className="bg-background text-on-background font-body min-h-[100dvh] w-screen flex selection:bg-primary selection:text-on-primary-container overflow-hidden">
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 30px rgba(30,30,30,1) inset !important; -webkit-text-fill-color: #fff !important; }
        input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
      `}</style>

      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />

      {/* --- STATUS MODAL --- */}
      <AnimatePresence>
        {modalStatus !== 'closed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-5 mx-4 border border-foreground/[0.08]">
              {(modalStatus === 'error' || modalStatus === 'success') && <button onClick={() => { setModalStatus('closed'); setModalErrorMessage(''); }} className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-foreground transition-colors rounded-full hover:bg-foreground/5"><X className="w-5 h-5" /></button>}
              {modalStatus === 'error' && <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                <p className="text-base font-semibold text-on-surface text-center">{modalErrorMessage}</p>
                <button onClick={() => { setModalStatus('closed'); setModalErrorMessage(''); }} className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-sm transition-colors mt-2">Try Again</button>
              </>}
              {modalStatus === 'loading' &&
                <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd>
                  {modalSteps.slice(0, -1).map((step, i) =>
                    <div key={i} className="flex flex-col items-center gap-4">{step.icon}<p className="text-base font-semibold text-on-surface">{step.message}</p></div>
                  )}
                </TextLoop>
              }
              {modalStatus === 'success' &&
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">{modalSteps[modalSteps.length - 1].icon}</div>
                  <p className="text-base font-semibold text-on-surface">{modalSteps[modalSteps.length - 1].message}</p>
                </div>
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LEFT PANEL — BRANDING ==================== */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden flex-col justify-between p-12">
        {/* Ambient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-primary/15 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-tertiary/10 rounded-full blur-[140px]" />
          <PixelCanvas gap={10} speed={20} colors={["#3b82f6", "#60a5fa", "#1e3a5f"]} variant="default" noFocus />
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/"}>
          <div className="bg-primary text-primary-foreground rounded-xl p-2 font-headline font-bold text-xl w-10 h-10 flex items-center justify-center">A</div>
          <span className="text-xl font-bold font-headline text-on-surface tracking-tight">{brandName}</span>
        </motion.div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/[0.05] border border-foreground/[0.08] mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg" />
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">AI-Powered Platform</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.1] mb-6">
              Financial audits,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-tertiary">reimagined by AI.</span>
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed max-w-md mb-12">
              Multi-agent neural pipeline for instant GST verification, compliance analysis, and penalty detection — all automated.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-6">
            <FeatureCard icon={ShieldCheck} title="99.9% Accuracy" description="Neural OCR and AI extractors deliver near-perfect data fidelity from any document format." delay={0.4} />
            <FeatureCard icon={Zap} title="Real-time Processing" description="4-agent pipeline processes invoices, statements, and receipts in under 3 seconds." delay={0.5} />
            <FeatureCard icon={BarChart3} title="Smart Compliance" description="Continuous rule monitoring against the latest GST mandates and regulatory requirements." delay={0.6} />
          </div>
        </div>

        {/* Footer */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="relative z-10 text-xs text-on-surface-variant/50 font-label uppercase tracking-[0.15em]">
          © 2024 AuditAI Technologies Pvt Ltd
        </motion.p>
      </div>

      {/* ==================== RIGHT PANEL — AUTH FORM ==================== */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center relative min-h-[100dvh] px-6">
        {/* Subtle glow */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/3 w-[25rem] h-[25rem] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2 z-20 cursor-pointer" onClick={() => window.location.href = "/"}>
          <div className="bg-primary text-primary-foreground rounded-lg p-1.5 font-headline font-bold text-lg w-8 h-8 flex items-center justify-center">A</div>
          <span className="text-lg font-bold font-headline text-on-surface">{brandName}</span>
        </div>

        <fieldset disabled={modalStatus !== 'closed'} className="relative z-10 w-full max-w-[380px]">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.06] mb-10">
              {(['login', 'register'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setConfirmPassword(''); }}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 capitalize",
                    authMode === mode
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-foreground/[0.04]"
                  )}
                >
                  {mode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Title */}
            <AnimatePresence mode="wait">
              <motion.div key={authMode} initial={{ opacity: 0, x: authMode === 'login' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: authMode === 'login' ? 20 : -20 }} transition={{ duration: 0.25 }} className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">
                  {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-sm text-on-surface-variant">
                  {authMode === 'login' ? 'Enter your credentials to access the audit dashboard.' : 'Set up your account to start AI-powered compliance auditing.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50 group-focus-within:text-primary transition-colors z-10" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50 group-focus-within:text-primary transition-colors z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors z-10">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              <AnimatePresence>
                {authMode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50 group-focus-within:text-primary transition-colors z-10" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors z-10">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot password link (login only) */}
              {authMode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-primary hover:text-primary-light transition-colors font-medium">Forgot password?</button>
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 mt-2"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-on-surface-variant/50 font-medium">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Guest button */}
              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="w-full py-3 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] hover:bg-white/[0.07] text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  Continue as Guest
                </button>
              )}
            </form>

            {/* Bottom text */}
            <p className="text-center text-[11px] text-on-surface-variant/40 mt-8 leading-relaxed">
              By continuing, you agree to our <span className="text-on-surface-variant/60 hover:text-primary cursor-pointer transition-colors">Terms of Service</span> and <span className="text-on-surface-variant/60 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
            </p>
          </motion.div>
        </fieldset>
      </div>
    </div>
  );
};
