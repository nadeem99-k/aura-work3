'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppChannel = () => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {/* Tooltip-style message */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl animate-bounce-slow pointer-events-auto group cursor-pointer hover:bg-white/10 transition-all duration-300">
        <a 
          href="https://whatsapp.com/channel/0029Vb7x2fNATRSsiwgQrF3N" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 no-underline"
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Official Channel</span>
            <span className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">Join NK_TEAM✅</span>
          </div>
          <div className="bg-green-500/20 p-2 rounded-xl border border-green-500/30 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
        </a>
      </div>
      
      {/* Ambient Glow */}
      <div className="absolute -z-10 w-32 h-32 bg-green-500/10 blur-[60px] rounded-full pointer-events-none" />
    </div>
  );
};

export default WhatsAppChannel;
