import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 transition-all duration-300",
        hover && "hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
}
