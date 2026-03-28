import React, { useState, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface SignInCard2Props {
  onContinueAsGuest?: () => void;
  onSuccess?: () => void;
}

export function SignInCard2({ onContinueAsGuest, onSuccess }: SignInCard2Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'rotateX(0deg) rotateY(0deg) translateZ(0px)' });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHovered || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

    const rotateX = -y * 20;
    const rotateY = x * 20;

    setTiltStyle({ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)` });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({ transform: 'rotateX(0deg) rotateY(0deg) translateZ(0px)' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg('');

    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setTimeout(() => {
        onSuccess?.();
      }, 500); // Small 500ms delay for smooth UX transition
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
      setErrorMsg(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-[100dvh] w-screen bg-background relative flex items-center justify-center m-0 text-foreground overflow-hidden font-body">
      <style>{`
        /* Noise texture overlay */
        .noise-bg {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            background-size: 200px 200px;
        }

        /* Perspective for 3D card */
        .perspective-container { perspective: 1500px; }
        .tilt-card { transition: transform 0.1s ease-out; transform-style: preserve-3d; will-change: transform; }

        /* Form input enhancements */
        .input-highlight { transition: opacity 0.3s ease; opacity: 0; z-index: -1; }
        .input-group:focus-within .input-highlight { opacity: 1; }
        .input-group:focus-within .lucide { color: white; }
        .input-group:focus-within input { background-color: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }

        /* Animations */
        @keyframes box-glow {
            0%, 100% { box-shadow: 0 0 10px 2px rgba(255,255,255,0.03); opacity: 0.2; }
            50% { box-shadow: 0 0 15px 5px rgba(255,255,255,0.05); opacity: 0.4; }
        }

        @keyframes travel-x {
            0% { left: -50%; opacity: 0.3; filter: blur(1px); }
            50% { top: auto; opacity: 0.7; filter: blur(2.5px); }
            100% { left: 100%; opacity: 0.3; filter: blur(1px); }
        }
        
        @keyframes travel-y {
            0% { top: -50%; opacity: 0.3; filter: blur(1px); }
            50% { opacity: 0.7; filter: blur(2.5px); }
            100% { top: 100%; opacity: 0.3; filter: blur(1px); }
        }

        @keyframes travel-x-reverse {
            0% { right: -50%; opacity: 0.3; filter: blur(1px); }
            50% { right: 25%; opacity: 0.7; filter: blur(2.5px); }
            100% { right: 100%; opacity: 0.3; filter: blur(1px); }
        }
        
        @keyframes travel-y-reverse {
            0% { bottom: -50%; opacity: 0.3; filter: blur(1px); }
            50% { bottom: 25%; opacity: 0.7; filter: blur(2.5px); }
            100% { bottom: 100%; opacity: 0.3; filter: blur(1px); }
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .anim-box-glow { animation: box-glow 4s infinite alternate ease-in-out; }
        .beam-top { animation: travel-x 2.5s infinite ease-in-out; }
        .beam-right { animation: travel-y 2.5s infinite ease-in-out 0.6s; }
        .beam-bottom { animation: travel-x-reverse 2.5s infinite ease-in-out 1.2s; }
        .beam-left { animation: travel-y-reverse 2.5s infinite ease-in-out 1.8s; }
        .btn-shimmer { animation: shimmer 2s infinite ease-in-out; }
        .loading-spinner { animation: spin 1s linear infinite; }
      `}</style>

      {/* Video Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-110">
          <source src="/hero-desktop.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay to ensure good contrast with the glass card */}
      <div className="absolute inset-0 bg-background/10 z-0 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10 perspective-container">
          {/* 3D Card */}
          <div 
            ref={cardRef}
            style={tiltStyle}
            className="relative tilt-card group" 
            onMouseMove={handleMouseMove} 
            onMouseLeave={handleMouseLeave} 
            onMouseEnter={() => setIsHovered(true)}
          >
              {/* Card Box Glow (Hover) */}
              <div className="absolute -inset-[1px] rounded-[2rem] opacity-0 group-hover:opacity-70 transition-opacity duration-700 anim-box-glow pointer-events-none"></div>

              {/* Traveling Light Beams */}
              <div className="absolute -inset-[1px] rounded-[2rem] overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70 beam-top"></div>
                  <div className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70 beam-right"></div>
                  <div className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70 beam-bottom"></div>
                  <div className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70 beam-left"></div>
                  
                  {/* Corner glow dots */}
                  <div className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px] animate-pulse pointer-events-none"></div>
                  <div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px] animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>
              </div>

              {/* Card Border Glow */}
              <div className="absolute -inset-[0.5px] rounded-[2rem] bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none"></div>

              {/* Glass Content Surface */}
              <div className="relative bg-background/40 backdrop-blur-xl rounded-[2rem] p-8 border border-foreground/5 shadow-2xl overflow-hidden">
                  {/* Subtle grid pattern inside */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>

                  {/* Logo & Heading */}
                  <div className="text-center space-y-1 mb-8 relative z-10">
                      <div className="mx-auto w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center relative overflow-hidden mb-4 bg-foreground/5 transition-transform hover:scale-105 duration-300">
                          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">A</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
                      </div>
                      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                      </h1>
                      <p className="text-foreground/60 text-xs">
                        {isLogin ? 'Sign in to your professional workspace' : 'Start your free compliance trial'}
                      </p>
                  </div>

                  {/* Form */}
                  <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
                      
                      {/* Email Input */}
                      <div className="input-group relative rounded-xl transition-transform duration-300 hover:scale-[1.01] focus-within:scale-[1.02] focus-within:z-10 group/input">
                          <div className="absolute -inset-[0.5px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-xl opacity-0 group-hover/input:opacity-100 transition-all duration-300 pointer-events-none"></div>
                          <div className="relative flex items-center overflow-hidden rounded-xl bg-foreground/5 border border-transparent">
                              <Mail className="absolute left-4 w-4 h-4 text-foreground/40 transition-colors duration-300" />
                              <input 
                                type="email" 
                                placeholder="Email address" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent text-foreground placeholder:text-foreground/30 h-12 pl-12 pr-4 outline-none text-sm z-10" 
                              />
                              <div className="input-highlight absolute inset-0 bg-foreground/5 rounded-xl"></div>
                          </div>
                      </div>

                      {/* Password Input */}
                      <div className="input-group relative rounded-xl transition-transform duration-300 hover:scale-[1.01] focus-within:scale-[1.02] focus-within:z-10 group/input">
                          <div className="absolute -inset-[0.5px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-xl opacity-0 group-hover/input:opacity-100 transition-all duration-300 pointer-events-none"></div>
                          <div className="relative flex items-center overflow-hidden rounded-xl bg-foreground/5 border border-transparent">
                              <Lock className="absolute left-4 w-4 h-4 text-foreground/40 transition-colors duration-300" />
                              <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Password" 
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent text-foreground placeholder:text-foreground/30 h-12 pl-12 pr-12 outline-none text-sm z-10" 
                              />
                              
                              {/* Toggle Visibility */}
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 z-20 focus:outline-none flex transition-colors text-foreground/40 hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <div className="input-highlight absolute inset-0 bg-foreground/5 rounded-xl"></div>
                          </div>
                      </div>

                      {/* Confirm Password (Sign Up Only) */}
                      {!isLogin && (
                        <div className="input-group relative rounded-xl transition-transform duration-300 hover:scale-[1.01] focus-within:scale-[1.02] focus-within:z-10 group/input">
                            <div className="absolute -inset-[0.5px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-xl opacity-0 group-hover/input:opacity-100 transition-all duration-300 pointer-events-none"></div>
                            <div className="relative flex items-center overflow-hidden rounded-xl bg-foreground/5 border border-transparent">
                                <Lock className="absolute left-4 w-4 h-4 text-foreground/40 transition-colors duration-300" />
                                <input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm password" 
                                  required
                                  minLength={6}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="w-full bg-transparent text-foreground placeholder:text-foreground/30 h-12 pl-12 pr-12 outline-none text-sm z-10" 
                                />
                                <div className="input-highlight absolute inset-0 bg-foreground/5 rounded-xl"></div>
                            </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {errorMsg && (
                        <p className="text-red-400 text-xs text-center font-medium mt-1">{errorMsg}</p>
                      )}

                      {/* Options */}
                      <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2 relative group/rem">
                              <div className="relative flex items-center justify-center w-4 h-4">
                                  <input type="checkbox" className="appearance-none h-4 w-4 rounded border border-foreground/20 bg-foreground/5 checked:bg-white transition-all duration-200 peer cursor-pointer" />
                                  <svg className="w-3 h-3 text-black absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                              <label className="text-xs text-foreground/60 group-hover/rem:text-foreground/90 transition-colors duration-200 cursor-pointer">Remember me</label>
                          </div>
                          {isLogin && (
                            <a href="#" className="text-xs text-foreground/60 hover:text-foreground transition-colors duration-200">Forgot password?</a>
                          )}
                      </div>

                      {/* Submit Button */}
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className={cn(
                          "w-full relative group/button mt-6 pt-2 block",
                          isLoading && "pointer-events-none"
                        )}
                      >
                          {/* Button Glow */}
                          <div className="absolute inset-0 bg-foreground/20 rounded-xl blur-lg opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative overflow-hidden bg-white text-black font-semibold h-12 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] duration-300 flex items-center justify-center outline-none">
                              {/* Loading Text */}
                              {isLoading ? (
                                <span className="relative z-10 flex items-center justify-center">
                                  <div className="w-5 h-5 border-[3px] border-black/80 border-t-transparent rounded-full loading-spinner"></div>
                                </span>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent opacity-0 z-0"></div>
                                  <span className="relative z-10 flex items-center justify-center gap-2 text-[15px]">
                                      {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                                  </span>
                                </>
                              )}
                          </div>
                      </button>

                      {/* Divider */}
                      <div className="relative py-4 flex items-center opacity-80 animate-pulse">
                          <div className="flex-grow border-t border-foreground/10"></div>
                          <span className="mx-4 text-xs tracking-widest text-foreground/40 uppercase">or</span>
                          <div className="flex-grow border-t border-foreground/10"></div>
                      </div>

                      {/* Guest Sign In */}
                      {onContinueAsGuest && (
                        <button 
                          type="button" 
                          onClick={onContinueAsGuest}
                          className="w-full relative group/guest"
                        >
                            <div className="absolute inset-0 bg-foreground/5 rounded-xl blur opacity-0 group-hover/guest:opacity-70 transition-opacity duration-300"></div>
                            <div className="relative overflow-hidden bg-foreground/5 text-foreground/80 font-medium h-12 rounded-xl border border-foreground/10 group-hover/guest:border-foreground/20 hover:text-foreground transition-all duration-300 flex items-center justify-center gap-3">
                                <span className="text-sm">Continue as Guest</span>
                            </div>
                        </button>
                      )}

                      {/* Sign up toggle */}
                      <p className="text-center text-xs text-foreground/60 mt-6 pb-2">
                          {isLogin ? "Don't have an account?" : "Already have an account?"} 
                          <button 
                            type="button" 
                            onClick={() => setIsLogin(!isLogin)} 
                            className="text-foreground font-medium hover:text-foreground/80 transition-colors underline decoration-white/30 underline-offset-4 ml-1"
                          >
                            {isLogin ? 'Sign up' : 'Sign in'}
                          </button>
                      </p>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
}
