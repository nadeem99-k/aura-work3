"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  ArrowUpRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    activeLinks: 0,
    totalSnapshots: 0,
    recentActivity: [] as any[]
  });

  useEffect(() => {
    // Fetch stats from local API
    const fetchStats = async () => {
      try {
        const linksRes = await fetch('/api/links');
        const links = await linksRes.json();
        
        const snapshotsRes = await fetch('/api/snapshots');
        const snapshots = await snapshotsRes.json();
        
        setStats({
          activeLinks: links.length,
          totalSnapshots: snapshots.length,
          recentActivity: snapshots.slice(-5).reverse()
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Systems Overview</h1>
        <p className="text-white/50">Real-time status of your monitoring network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Links" 
          value={stats.activeLinks} 
          icon={<LinkIcon className="text-cyber-blue" />}
          trend="+2 today"
        />
        <StatCard 
          title="Total Snapshots" 
          value={stats.totalSnapshots} 
          icon={<ImageIcon className="text-cyber-purple" />}
          trend="+12 this hour"
        />
        <StatCard 
          title="System Status" 
          value="Online" 
          icon={<Activity className="text-green-400" />}
          trend="0.2ms latency"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-cyber-blue" />
              Recent Intelligence
            </h2>
            <Link href="/dashboard/results">
              <GlassButton variant="ghost" size="sm">View All Results</GlassButton>
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                No snapshots captured yet. Generate a link to start monitoring.
              </div>
            ) : (
              stats.recentActivity.map((activity, i) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <img src={activity.imageData} alt="Snapshot" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Snapshot from Link ID: {activity.linkId}</p>
                    <p className="text-xs text-white/30">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                  <Link href={`/dashboard/results?linkId=${activity.linkId}`}>
                    <ArrowUpRight size={18} className="text-white/20 group-hover:text-cyber-blue transition-colors" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <div className="space-y-6">
          <GlassCard className="bg-gradient-to-br from-cyber-blue/10 to-transparent border-cyber-blue/20">
            <h3 className="text-lg font-bold mb-4">Quick Deploy</h3>
            <p className="text-sm text-white/60 mb-6">Instantly create a new monitoring link with default settings.</p>
            <Link href="/dashboard/links">
              <GlassButton variant="primary" className="w-full" glow>
                New Link Tool
                <ExternalLink size={16} />
              </GlassButton>
            </Link>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-bold mb-4">Storage Usage</h3>
            <div className="w-full bg-white/5 rounded-full h-2 mb-2">
              <div className="bg-cyber-blue h-full rounded-full w-[15%]" />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest">
              <span>0.4 MB Used</span>
              <span>100 MB Limit</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <GlassCard hover className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/50">{title}</p>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <p className="text-xs text-cyber-blue font-medium">{trend}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
