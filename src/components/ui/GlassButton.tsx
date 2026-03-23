"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  glow = false,
  ...props
}: GlassButtonProps) {
  const variants = {
    primary: "bg-cyber-blue/80 text-white hover:bg-cyber-blue border-transparent",
    secondary: "bg-cyber-purple/80 text-white hover:bg-cyber-purple border-transparent",
    outline: "bg-transparent border-white/20 text-white hover:bg-white/10",
    ghost: "bg-transparent border-transparent text-white/70 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5",
    lg: "px-8 py-3.5 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl border font-medium transition-all duration-200 backdrop-blur-md flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        glow && variant === 'primary' && "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
        glow && variant === 'secondary' && "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
