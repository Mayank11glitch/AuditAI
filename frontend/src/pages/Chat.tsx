import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { Bot, AlertCircle, FileText, ShieldCheck, Sparkles, Command, SendIcon, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { api } from "@/lib/api";
import { HeroWave } from "@/components/ui/ai-input-hero";
import { TypingAnimation } from "@/components/ui/typing-animation";

// --- Custom Hooks & Subcomponents ---
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
                        "flex min-h-[45px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
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

// --- Main Page Component ---
export default function Chat() {
    const { documentId } = useAppContext();
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Hello! I'm your Explanation Agent powered by Llama 3. Ask me about any flagged transaction or compliance rule from your audit." }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Command Palette Logic
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 45, maxHeight: 150 });

    const commandSuggestions = [
        { icon: <AlertCircle className="w-5 h-5" />, label: "Explain Flag", description: "Why was a transaction flagged?", prefix: "/explain" },
        { icon: <ShieldCheck className="w-5 h-5" />, label: "Check Rules", description: "Verify against core GST rules", prefix: "/rules" },
        { icon: <FileText className="w-5 h-5" />, label: "Summarize", description: "Summarize the current audit report", prefix: "/summary" },
        { icon: <Sparkles className="w-5 h-5" />, label: "Optimize", description: "Suggest compliance improvements", prefix: "/optimize" },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

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
            // Real API Call
            const res = await api.askChatbot(userMsg, documentId);
            setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: "Error communicating with Explanation Agent. Please ensure the backend server is running." }]);
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
                    setValue(commandSuggestions[activeSuggestion].prefix + ' ');
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
            {/* HeroWave Background - Global for the Chat Page */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <HeroWave 
                    showNavbar={false} 
                    showContent={false} 
                    className="w-full h-full" 
                    style={{ opacity: 1.0 }}
                />
            </div>
            <div className="absolute inset-0 w-full flex flex-col px-2 md:px-0 py-2 md:py-2 max-w-5xl mx-auto z-10 overflow-hidden text-foreground">

                {/* Glassy Chat Container */}
                <div className="flex-1 relative bg-background/10 rounded-3xl flex flex-col overflow-hidden shadow-lg backdrop-blur-3xl border border-foreground/10 lab-bg">

                <div className="relative z-10 p-5 border-b border-foreground/[0.05] flex items-center justify-between bg-foreground/[0.02] flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <TypingAnimation
                                as="h3"
                                className="font-extrabold font-headline tracking-wide text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 drop-shadow-lg leading-none pb-1 overflow-visible"
                                duration={50}
                            >
                                Explanation Agent
                            </TypingAnimation>
                            <div className="flex items-center gap-2 align-middle mt-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 drop-shadow-lg animate-pulse"></span>
                                <span className="text-[11px] font-bold text-foreground/40 tracking-widest uppercase">A4 Llama-70B Connected</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Messages Area */}
                <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/10">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <Sparkles className="w-12 h-12 text-blue-400 mb-2" />
                            <h2 className="text-xl font-headline font-semibold">How can I help today?</h2>
                            <p className="text-sm text-foreground/50">Type a command or ask a question about the audit.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={idx}
                                className={cn(
                                    "flex flex-col max-w-[90%] md:max-w-[75%]",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div className={cn(
                                    "px-5 py-3.5 md:py-4 md:px-6 rounded-[24px] text-[15px] leading-relaxed shadow-lg backdrop-blur-md whitespace-pre-wrap",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-foreground rounded-br-sm border border-blue-500/40"
                                        : "bg-foreground/[0.04] text-foreground/90 border border-foreground/10 rounded-bl-sm"
                                )}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))
                    )}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mr-auto flex flex-col items-start max-w-[85%]">
                            <div className="px-5 py-4 rounded-[24px] rounded-bl-sm bg-foreground/[0.04] border border-foreground/10 flex items-center gap-3">
                                <span className="text-[11px] text-blue-400 font-bold tracking-widest uppercase">Thinking</span>
                                <TypingDots />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area (Animated Style) */}
                <div className="relative z-20 p-2 md:p-4 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent pt-4">
                    <motion.div className="relative max-w-4xl mx-auto backdrop-blur-3xl bg-foreground/[0.03] rounded-3xl border border-foreground/10 shadow-2xl">

                        {/* Command Palette Overlay */}
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div
                                    ref={commandPaletteRef}
                                    className="absolute left-2 right-2 bottom-full mb-3 backdrop-blur-2xl bg-surface/95 rounded-2xl z-50 shadow-2xl border border-foreground/10 overflow-hidden"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-2">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer",
                                                    activeSuggestion === index ? "bg-blue-500/20 text-foreground" : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground/90"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex flex-shrink-0 items-center justify-center text-blue-400">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-[14px]">{suggestion.label}</div>
                                                    <div className="text-[13px] text-foreground/40">{suggestion.description}</div>
                                                </div>
                                                <div className="text-foreground/30 font-mono text-xs tracking-wider font-bold bg-foreground/5 px-2.5 py-1.5 rounded-md">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Box */}
                        <div className="p-2 flex flex-col">
                            <div className="px-2 pt-2">
                                <Textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a command or ask a question..."
                                    className="w-full px-2 py-2 resize-none bg-transparent border-none text-foreground/90 text-base focus:outline-none placeholder:text-foreground/30"
                                    style={{ overflow: "hidden" }}
                                    showRing={false}
                                />
                            </div>

                            {/* Input Toolbar */}
                            <div className="p-2 mt-1 flex items-center justify-between border-t border-foreground/[0.05]">
                                <div className="flex items-center gap-2 pl-2">
                                    <motion.button
                                        type="button"
                                        data-command-button
                                        onClick={(e) => { e.stopPropagation(); setShowCommandPalette(prev => !prev); }}
                                        whileTap={{ scale: 0.94 }}
                                        className={cn(
                                            "p-2.5 text-foreground/40 hover:text-foreground/90 rounded-xl transition-colors bg-foreground/5 hover:bg-foreground/10",
                                            showCommandPalette && "bg-foreground/15 text-foreground"
                                        )}
                                        title="Use Commands (/)"
                                    >
                                        <Command className="w-4 h-4" />
                                    </motion.button>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={isTyping || !value.trim()}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50",
                                        value.trim() ? "bg-blue-600 text-foreground shadow-blue-500/20" : "bg-foreground/5 text-foreground/30"
                                    )}
                                >
                                    {isTyping ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                                    <span>Send</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    </>
);
}
