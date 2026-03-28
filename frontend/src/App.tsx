 
 
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { ThemeProvider } from '@/components/theme-provider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import LivePipeline from '@/pages/LivePipeline'
import Dashboard from '@/pages/Dashboard'
import Violations from '@/pages/Violations'
import KnowledgeGraph from '@/pages/KnowledgeGraph'
import History from '@/pages/History'
import Chat from '@/pages/Chat'

const RootTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  // Group dashboard routes so they don't trigger root unmounts,
  // allowing DashboardLayout to handle its own internal micro-transitions.
  const getRootKey = (path: string) => {
    if (["/dashboard", "/history", "/violations", "/graph", "/chat"].includes(path)) {
      return "dashboard-app";
    }
    return path;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getRootKey(location.pathname)}>
        {/* Public Routes */}
        <Route path="/" element={<RootTransition><Home /></RootTransition>} />
        <Route path="/login" element={<RootTransition><Login /></RootTransition>} />
        <Route path="/pipeline" element={<RootTransition><LivePipeline /></RootTransition>} />

        {/* Authenticated Dashboard Routes */}
        <Route path="/dashboard" element={<RootTransition><DashboardLayout><Dashboard /></DashboardLayout></RootTransition>} />
        <Route path="/history" element={<RootTransition><DashboardLayout><History /></DashboardLayout></RootTransition>} />
        <Route path="/violations" element={<RootTransition><DashboardLayout><Violations /></DashboardLayout></RootTransition>} />
        <Route path="/graph" element={<RootTransition><DashboardLayout><KnowledgeGraph /></DashboardLayout></RootTransition>} />
        <Route path="/chat" element={<RootTransition><DashboardLayout><Chat /></DashboardLayout></RootTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="auditai-theme">
      <AppProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
