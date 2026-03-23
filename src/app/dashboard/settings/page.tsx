"use client";

import React from 'react';
import { Settings, Shield, Bell, Database, Cpu } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-white/50">Configure your monitoring nodes and dashboard preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="text-cyber-blue" />
            <h2 className="text-xl font-bold">Security Protocols</h2>
          </div>
          
          <div className="space-y-4">
            <ToggleSetting 
              title="End-to-End Encryption" 
              description="Encrypt all snapshot data before transmission."
              active={true}
            />
            <ToggleSetting 
              title="Auto-Destruct Records" 
              description="Automatically wipe results after 24 hours."
              active={false}
            />
            <ToggleSetting 
              title="Stealth Mode" 
              description="Hide capture indicators on target devices."
              active={true}
            />
          </div>
        </GlassCard>

        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Cpu className="text-cyber-purple" />
            <h2 className="text-xl font-bold">Node Performance</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Capture Interval (seconds)</label>
              <div className="flex items-center gap-4">
                <input type="range" min="1" max="60" defaultValue="3" className="flex-1 accent-cyber-blue" />
                <span className="text-cyber-blue font-bold w-8">3s</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Image Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map((quality) => (
                  <button key={quality} className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition-all",
                    quality === 'Medium' ? "bg-cyber-blue/20 border-cyber-blue/40 text-cyber-blue" : "bg-white/5 border-white/5 text-white/40"
                  )}>
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex justify-end gap-4">
        <GlassButton variant="ghost">Reset to Defaults</GlassButton>
        <GlassButton variant="primary" glow>Save Configuration</GlassButton>
      </div>
    </div>
  );
}

function ToggleSetting({ title, description, active }: any) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="space-y-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-white/40">{description}</p>
      </div>
      <div className={cn(
        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
        active ? "bg-cyber-blue" : "bg-white/10"
      )}>
        <div className={cn(
          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
          active ? "left-6" : "left-1"
        )} />
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
