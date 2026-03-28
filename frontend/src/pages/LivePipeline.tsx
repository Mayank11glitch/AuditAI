 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle2, 
  Loader2, ShieldAlert, Bot, Activity, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShinyButton } from "@/components/ui/shiny-button";


type Stage = 'idle' | 'parsing' | 'extracting' | 'validating' | 'explaining' | 'complete';

const PipelineStep = ({ 
  activeStage, 
  targetStage, 
  title, 
  icon: Icon 
}: { 
  activeStage: Stage, 
  targetStage: Stage, 
  title: string, 
  icon: any 
}) => {
  const stages = ['idle', 'parsing', 'extracting', 'validating', 'explaining', 'complete'];
  const activeIndex = stages.indexOf(activeStage);
  const targetIndex = stages.indexOf(targetStage);
  
  const isPast = activeIndex > targetIndex;
  const isCurrent = activeStage === targetStage;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 rounded-3xl ghost-border transition-all duration-500 relative overflow-hidden",
      isCurrent ? "bg-surface-container-high border-primary/50 shadow-lg scale-105 z-10" : 
      isPast ? "bg-surface-container border-tertiary/20" : "bg-surface-container-lowest border-outline-variant/10 opacity-70"
    )}>
      {/* Glow effect for current active */}
      {isCurrent && <div className="absolute inset-0 bg-primary/5"></div>}
      
      {isCurrent ? (
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4 relative z-10" />
      ) : isPast ? (
        <CheckCircle2 className="w-10 h-10 text-tertiary mb-4 relative z-10" />
      ) : (
        <Icon className="w-10 h-10 text-on-surface-variant mb-4 relative z-10" />
      )}
      <span className={cn(
        "text-sm font-headline font-semibold text-center relative z-10", 
        isCurrent ? "text-primary dark:text-blue-300" : isPast ? "text-on-surface" : "text-on-surface-variant"
      )}>{title}</span>
    </div>
  );
};

export default function LivePipeline() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('idle');
  const [logs, setLogs] = useState<{ id: string; msg: string; type: string }[]>([]);

  // Simulation logic
  useEffect(() => {
    if (stage === 'idle' || stage === 'complete') return;

    let timeout: ReturnType<typeof setTimeout>;

    const addLog = (msg: string, type: 'info' | 'success' | 'warning' | 'error') => {
      setLogs(prev => [...prev, { id: Math.random().toString(), msg, type }]);
    };

    const runSimulation = async () => {
      if (stage === 'parsing') {
        setTimeout(() => addLog("Initializing OCR neural net on sample invoice...", "info"), 500);
        setTimeout(() => addLog("Extracting tabular data from page 1...", "info"), 1500);
        setTimeout(() => addLog("Extracted: Vendor GSTIN, Date, Total Amount.", "success"), 2500);
        timeout = setTimeout(() => setStage('extracting'), 3500);
      } 
      else if (stage === 'extracting') {
        setTimeout(() => addLog("Normalizing date formats to ISO 8601.", "info"), 500);
        setTimeout(() => addLog("Mapping vendor ID against ledger database.", "info"), 1500);
        setTimeout(() => addLog("Transactions categorised.", "success"), 2500);
        timeout = setTimeout(() => setStage('validating'), 3500);
      }
      else if (stage === 'validating') {
        setTimeout(() => addLog("Cross-referencing vendor GSTIN against live database.", "info"), 500);
        setTimeout(() => addLog("Validating TDS thresholds for service category.", "info"), 1500);
        setTimeout(() => addLog("[WARNING] Total value exceeds section 194C limit. TDS not deducted.", "error"), 2500);
        timeout = setTimeout(() => setStage('explaining'), 3500);
      }
      else if (stage === 'explaining') {
        setTimeout(() => addLog("Generating natural language reasoning for findings...", "info"), 500);
        setTimeout(() => addLog("Audit report drafted successfully.", "success"), 2000);
        timeout = setTimeout(() => setStage('complete'), 3000);
      }
    };

    runSimulation();

    return () => clearTimeout(timeout);
  }, [stage]);

  const handleStart = () => {
    setLogs([]);
    setStage('parsing');
  };



  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary selection:text-on-primary-container relative overflow-x-hidden">
      
      {/* Background Gradients from Home.tsx */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-tertiary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="fixed top-4 w-full z-50 flex justify-center px-4 md:px-6 pointer-events-none">
          <nav className="flex items-center justify-between lg:justify-between w-full max-w-6xl pointer-events-auto bg-surface/50 backdrop-blur-md rounded-2xl px-6 py-3 border border-outline-variant/20 shadow-lg">
              <div className="flex items-center gap-4">
                  <span className="text-xl font-bold tracking-tight text-blue-400 font-headline">AuditAI</span>
                  <div className="w-px h-6 bg-outline-variant/30"></div>
                  <span className="text-sm font-label uppercase tracking-widest text-on-surface-variant hidden md:block">Interactive Pipeline Demo</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="rounded-full flex items-center gap-2 hover:bg-surface-variant">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
              </Button>
          </nav>
      </div>

      {/* Main Content */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center max-w-6xl mx-auto z-10 w-full mb-12">
        <div className="text-center w-full max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high ghost-border mb-6">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Live Audit Simulation</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight mb-6">
            Watch AI do the <span className="text-gradient">heavy lifting.</span>
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto text-lg mb-8 font-light leading-relaxed">
            Experience our 4-agent compliance pipeline in real-time. Drop a sample document below to see how fast we catch errors.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {stage === 'idle' ? (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="w-full max-w-2xl glass-card rounded-3xl p-10 md:p-16 border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors group cursor-pointer"
                onClick={handleStart}
              >
                <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none text-center">
                  <div className="w-24 h-24 rounded-full bg-surface shadow-inner flex items-center justify-center mb-2 border border-outline-variant/30 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <UploadCloud className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold font-headline text-on-surface">Drop Document Here</h3>
                  <p className="text-on-surface-variant text-lg">or click anywhere to inject a sample invoice</p>
                  
                  <div className="flex gap-2 pt-4 justify-center">
                    <span className="px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 text-sm font-semibold text-on-surface shadow-sm">
                        invoice_A92.pdf
                    </span>
                  </div>
                  <div className="mt-8 pointer-events-auto">
                    <ShinyButton onClick={() => handleStart()}>
                      Run Sample Demo
                    </ShinyButton>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <PipelineStep activeStage={stage} targetStage="parsing" title="Document Parser" icon={FileText} />
                  <PipelineStep activeStage={stage} targetStage="extracting" title="Rule Extraction" icon={Activity} />
                  <PipelineStep activeStage={stage} targetStage="validating" title="Compliance Validator" icon={ShieldAlert} />
                  <PipelineStep activeStage={stage} targetStage="explaining" title="Explanation Agent" icon={Bot} />
                </div>
                
                {/* Processing Log View */}
                <div className="glass-card rounded-3xl p-8 ghost-border relative overflow-hidden text-left shadow-2xl">
                  {/* Glowing header bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
                  
                  <div className="flex justify-between items-end mb-6 border-b border-outline-variant/10 pb-4">
                      <h3 className="text-on-surface font-headline font-bold text-xl flex items-center gap-3">
                        <Activity className="w-5 h-5 text-primary" />
                        {stage === 'complete' ? "SYSTEM AUDIT LOGS" : "LIVE PIPELINE FEED"}
                      </h3>
                      {stage !== 'complete' && (
                         <span className="text-xs font-label uppercase tracking-widest text-primary animate-pulse flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary"></div> Processing
                         </span>
                      )}
                  </div>
                  
                  <div className="h-64 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                    <AnimatePresence>
                      {logs.map(log => (
                        <motion.div 
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/5 transition-colors hover:bg-surface-container"
                        >
                          <span className="text-xs font-mono text-on-surface-variant/50 shrink-0 mt-0.5 w-[70px]">
                            {new Date().toISOString().substring(11, 19)}
                          </span>
                          
                          <div className="flex-1">
                             <span className={cn(
                                "text-sm md:text-base font-medium",
                                log.type === 'error' ? "text-error" :
                                log.type === 'warning' ? "text-orange-400" :
                                log.type === 'success' ? "text-tertiary" : "text-on-surface"
                             )}>
                               {log.msg}
                             </span>
                          </div>
                          
                          {log.type === 'error' && <ShieldAlert className="w-5 h-5 text-error shrink-0" />}
                          {log.type === 'success' && <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0" />}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Final CTA */}
                {stage === 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 glass-card rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-error-container bg-error-container/5 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-error/5 to-transparent pointer-events-none"></div>
                    <div className="flex-1 relative z-10 flex flex-col text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <span className="material-symbols-outlined text-4xl text-error">warning</span>
                            <h3 className="text-3xl font-bold font-headline text-on-surface">Action Required</h3>
                        </div>
                        <p className="text-on-surface-variant text-lg">
                            We found <span className="text-error font-bold tracking-wide">1 CRITICAL ANOMALY</span> regarding TDS deduction thresholds that require your immediate attention to avoid penalties.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 shrink-0 relative z-10">
                      <Button onClick={() => setStage('idle')} variant="ghost" className="rounded-full !px-8 hover:bg-surface-container font-semibold">Cancel</Button>
                      <ShinyButton onClick={() => navigate('/login')} className="!px-8">
                         <span className="flex items-center gap-2">Sign Up For Report <ArrowRight className="w-4 h-4"/></span>
                      </ShinyButton>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
