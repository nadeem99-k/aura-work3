"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Camera,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('aura-session');
    if (!session) {
      router.push('/login');
    } else {
      setUsername(session);
    }
  }, [router]);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Link Generator', href: '/dashboard/links', icon: LinkIcon },
    { name: 'Results Gallery', href: '/dashboard/results', icon: ImageIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('aura-session');
    router.push('/login');
  };

  if (!username) return null;

  return (
    <div className="flex min-h-screen bg-[#030712] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-3xl flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-cyber-blue/20 flex items-center justify-center border border-cyber-blue/30">
              <Camera className="w-6 h-6 text-cyber-blue" />
            </div>
            <span className="font-bold text-xl tracking-tight">Aura <span className="text-cyber-blue text-glow-blue">Vision</span></span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20" 
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-cyber-blue" : "group-hover:text-white")} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyber-blue to-cyber-purple flex items-center justify-center text-xs font-bold">
              {username[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{username}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Operator</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 border border-transparent"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 min-h-screen relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyber-purple/5 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
