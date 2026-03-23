"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, ShieldCheck, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    // Simple session logic: store username in localStorage as "session"
    localStorage.setItem('aura-session', username);
    
    // Simulate a bit of loading for "premium" feel
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      {/* Animated Background Gradients */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyber-blue blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyber-purple blur-[120px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4 backdrop-blur-xl">
            <Camera className="w-8 h-8 text-cyber-blue" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Aura <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple text-glow-blue">Vision</span>
          </h1>
          <p className="text-white/50">Management & Monitoring Suite</p>
        </div>

        <GlassCard className="border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white/70 ml-1">
                Operator Identity
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyber-blue/50 focus:border-cyber-blue/50 transition-all"
                  required
                />
              </div>
            </div>

            <GlassButton 
              type="submit" 
              className="w-full" 
              variant="primary" 
              glow 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Initializing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} />
                  Access Dashboard
                </div>
              )}
            </GlassButton>
          </form>
        </GlassCard>

        <p className="text-center mt-8 text-white/30 text-xs tracking-widest uppercase">
          Secure Terminal v1.0.4
        </p>
      </motion.div>
    </div>
  );
}
