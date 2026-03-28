 
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  FileSearch,
  BarChart3,
  BrainCircuit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring' as const, bounce: 0.3, duration: 1.2 },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

/* ------------------------------------------------------------------ */
/*  Feature pills shown on the left panel                              */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: FileSearch,
    title: 'Instant Document Parsing',
    desc: 'Upload PDFs, CSVs & Excel — structured data in seconds.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Violation Detection',
    desc: 'Cross-check every transaction against GST and other regulatory rules.',
  },
  {
    icon: BrainCircuit,
    title: 'Actionable AI Insights',
    desc: 'Human-readable explanations and priority-ranked fix recommendations.',
  },
]

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // --- Replace with your real auth call via src/services/api.ts ---
    try {
      await new Promise((r) => setTimeout(r, 1500)) // simulate network
      // e.g. const res = await api.post('/auth/login', { email, password })
      window.location.href = '/dashboard'
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* ---- Decorative background blobs ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* ===== LEFT PANEL — branding & features (hidden on mobile) ===== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary/[0.03] p-12 lg:flex xl:p-16"
      >
        {/* Top: logo */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2">
          <ShieldCheck className="size-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">AuditAI</span>
        </motion.div>

        {/* Middle: feature list */}
        <div className="space-y-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i + 1}
              className="flex items-start gap-4"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom: testimonial / social proof */}
        <motion.blockquote
          variants={fadeUp}
          custom={5}
          className="border-l-2 border-primary/30 pl-4 text-sm italic text-muted-foreground"
        >
          "AuditAI cut our quarterly compliance review from 3 weeks to under 2
          hours. The violation dashboard alone paid for itself."
          <footer className="mt-2 not-italic font-medium text-foreground">
            — CFO, Fortune 500 FinTech
          </footer>
        </motion.blockquote>

        {/* Decorative gradient line */}
        <div
          aria-hidden
          className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-border to-transparent"
        />
      </motion.div>

      {/* ===== RIGHT PANEL — login card ===== */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 1.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <ShieldCheck className="size-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">AuditAI</span>
          </div>

          <Card className="border-border/60 shadow-xl shadow-black/5">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue auditing
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ---- Email ---- */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* ---- Password ---- */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#forgot"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ---- Error message ---- */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.p>
                )}

                {/* ---- Submit ---- */}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* ---- Divider ---- */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </div>

              {/* ---- Social login buttons ---- */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" className="gap-2">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" className="gap-2">
                  <svg
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a
                  href="#signup"
                  className="font-medium text-primary hover:underline"
                >
                  Create one
                </a>
              </p>
            </CardFooter>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#terms" className="underline hover:text-foreground">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </div>
    </div>
  )
}
