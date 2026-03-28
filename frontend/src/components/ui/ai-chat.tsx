import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { 
    MessageSquare, X, SendIcon, Bot, FileText, 
    ShieldCheck, AlertCircle, Sparkles, Command, LoaderIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

// --- Custom Hooks & Subcomponents from AnimatedAIChat ---

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }
            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) textarea.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    containerClassName?: string;
    showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, showRing = true, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        return (
            <div className={cn("relative", containerClassName)}>
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "transition-all duration-200 ease-in-out",
                        "placeholder:text-foreground/40",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
                        className
                    )}
                    ref={ref}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </div>
        )
    }
);
Textarea.displayName = "Textarea";

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: "easeInOut" }}
                    style={{ boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)" }}
                />
            ))}
        </div>
    );
}

// Render AI response: convert markdown-style bullets and **bold** to JSX
function parseAIResponse(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        // Bullet points
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ");
        const content = isBullet ? trimmed.slice(2) : trimmed;
        // Inline bold
        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="font-semibold text-foreground/95">{part.slice(2, -2)}</strong>
                : part
        );
        if (isBullet) {
            return <div key={i} className="flex gap-2 mt-1"><span className="text-blue-400 mt-0.5 flex-shrink-0">•</span><span>{parts}</span></div>;
        }
        return <div key={i} className={i === 0 ? "" : "mt-1"}>{parts}</div>;
    });
}

// --- Main Chat Widget Component ---
export function AIChat() {
    const { documentId } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    
    // Existing Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Hello! I'm AuditAI — your GST compliance expert. Ask me about any flagged transaction, rule violation, or compliance question." }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // New Animated Chat State
    const [value, setValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 45,
        maxHeight: 120,
    });

    const commandSuggestions = [
        { icon: <AlertCircle className="w-4 h-4" />, label: "Explain Flag", description: "Why was this flagged?", prefix: "/explain" },
        { icon: <ShieldCheck className="w-4 h-4" />, label: "Check Rules", description: "Verify against GST rules", prefix: "/rules" },
        { icon: <FileText className="w-4 h-4" />, label: "Summarize", description: "Summarize the audit report", prefix: "/summary" },
        { icon: <Sparkles className="w-4 h-4" />, label: "Optimize", description: "Suggest compliance improvements", prefix: "/optimize" },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Command palette visibility logic
    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            const matchIndex = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value));
            setActiveSuggestion(matchIndex >= 0 ? matchIndex : -1);
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            if (commandPaletteRef.current && !commandPaletteRef.current.contains(target) && !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = async () => {
        if (!value.trim() || isTyping) return;

        const userMsg = value.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setValue("");
        adjustHeight(true);
        setShowCommandPalette(false);
        setIsTyping(true);

        try {
            const res = await fetch("http://localhost:8001/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: userMsg,
                    document_id: documentId ?? undefined,
                }),
            });
            const data = await res.json();
            const answer = data.answer || "Sorry, I couldn't get a response. Please try again.";
            setMessages(prev => [...prev, { role: 'ai', content: answer }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "⚠️ Could not reach the AI service. Make sure the backend is running at port 8001."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => prev < commandSuggestions.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => prev > 0 ? prev - 1 : commandSuggestions.length - 1);
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selected = commandSuggestions[activeSuggestion];
                    setValue(selected.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const selectCommandSuggestion = (index: number) => {
        setValue(commandSuggestions[index].prefix + ' ');
        setShowCommandPalette(false);
        textareaRef.current?.focus();
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-foreground shadow-lg flex items-center justify-center z-50 hover:bg-blue-500 transition-colors"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.2 }}
                        className="fixed bottom-6 right-6 w-[350px] sm:w-[420px] h-[600px] rounded-3xl flex flex-col z-50 overflow-hidden shadow-lg border border-foreground/10 bg-background lab-bg"
                    >
                        {/* Animated Background Glows */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-pulse delay-700" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 p-4 border-b border-foreground/[0.05] flex items-center justify-between bg-foreground/[0.02] backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground/90 text-sm tracking-wide">Explanation Agent</h3>
                                    <div className="flex items-center gap-1.5 align-middle">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 drop-shadow-lg"></span>
                                        <span className="text-[10px] font-medium text-foreground/50 tracking-wider uppercase">Llama 3</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-foreground/40 hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat History Area */}
                        <div
                            ref={scrollRef}
                            className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                    <Sparkles className="w-8 h-8 text-blue-400" />
                                    <p className="text-sm text-foreground/70">Type a command or ask a question</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx}
                                        className={cn(
                                            "flex flex-col max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md",
                                            msg.role === 'user'
                                                ? "bg-blue-600/90 text-foreground rounded-br-sm border border-blue-500/50"
                                                : "bg-foreground/[0.05] text-foreground/90 border border-foreground/10 rounded-bl-sm"
                                        )}>
                                            {msg.role === 'ai' ? parseAIResponse(msg.content) : msg.content}
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {isTyping && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mr-auto flex flex-col items-start max-w-[85%]"
                                >
                                    <div className="px-4 py-4 rounded-2xl rounded-bl-sm bg-foreground/[0.03] border border-foreground/10 flex items-center gap-2">
                                        <span className="text-xs text-blue-400 mr-1.5 font-medium tracking-widest uppercase">Agent</span>
                                        <TypingDots />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area (Animated Chat Style) */}
                        <div className="relative z-20 p-4 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent pt-6">
                            <motion.div 
                                className="relative backdrop-blur-2xl bg-foreground/[0.03] rounded-2xl border border-foreground/10 shadow-2xl"
                                initial={{ scale: 0.98 }}
                                animate={{ scale: 1 }}
                            >
                                <AnimatePresence>
                                    {showCommandPalette && (
                                        <motion.div 
                                            ref={commandPaletteRef}
                                            className="absolute left-2 right-2 bottom-full mb-2 backdrop-blur-xl bg-background/95 rounded-xl z-50 shadow-2xl border border-foreground/10 overflow-hidden"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <div className="py-1.5">
                                                {commandSuggestions.map((suggestion, index) => (
                                                    <motion.div
                                                        key={suggestion.prefix}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                            activeSuggestion === index 
                                                                ? "bg-blue-500/20 text-foreground" 
                                                                : "text-foreground/70 hover:bg-foreground/5"
                                                        )}
                                                        onClick={() => selectCommandSuggestion(index)}
                                                    >
                                                        <div className="w-6 h-6 rounded-md bg-foreground/5 flex flex-shrink-0 items-center justify-center text-blue-400">
                                                            {suggestion.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-[13px]">{suggestion.label}</div>
                                                            <div className="text-foreground/40">{suggestion.description}</div>
                                                        </div>
                                                        <div className="text-foreground/30 font-mono tracking-wider font-semibold bg-foreground/5 px-2 py-1 rounded">
                                                            {suggestion.prefix}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="p-3 pb-1">
                                    <Textarea
                                        ref={textareaRef}
                                        value={value}
                                        onChange={(e) => {
                                            setValue(e.target.value);
                                            adjustHeight();
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask about a violation or use /..."
                                        containerClassName="w-full"
                                        className={cn(
                                            "w-full px-2 py-1.5 resize-none bg-transparent border-none text-foreground/90 text-[15px] focus:outline-none placeholder:text-foreground/30",
                                        )}
                                        style={{ overflow: "hidden" }}
                                        showRing={false}
                                    />
                                </div>

                                <div className="p-2 pt-0 flex items-center justify-between">
                                    <div className="flex items-center gap-1 pl-1">
                                        <motion.button
                                            type="button"
                                            data-command-button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCommandPalette(prev => !prev);
                                            }}
                                            whileTap={{ scale: 0.94 }}
                                            className={cn(
                                                "p-2 text-foreground/40 hover:text-foreground/90 rounded-lg transition-colors relative group",
                                                showCommandPalette && "bg-foreground/10 text-foreground/90"
                                            )}
                                            title="Use Commands (/)"
                                        >
                                            <Command className="w-4 h-4" />
                                            <span className="sr-only">Commands</span>
                                        </motion.button>
                                    </div>
                                    
                                    <motion.button
                                        type="button"
                                        onClick={handleSendMessage}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={isTyping || !value.trim()}
                                        className={cn(
                                            "p-2 rounded-xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50",
                                            value.trim() ? "bg-blue-600 text-foreground" : "bg-foreground/5 text-foreground/30"
                                        )}
                                    >
                                        {isTyping ? (
                                            <LoaderIcon className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <SendIcon className="w-4 h-4" />
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
