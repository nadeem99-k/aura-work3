"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Download, 
  Trash2, 
  Filter, 
  Calendar, 
  Clock, 
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import { Snapshot, CaptureLink } from '@/lib/storage';
import { motion } from 'framer-motion';

function ResultsContent() {
  const searchParams = useSearchParams();
  const initialLinkId = searchParams.get('linkId');
  
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [links, setLinks] = useState<CaptureLink[]>([]);
  const [filterId, setFilterId] = useState<string>(initialLinkId || 'all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      const linksRes = await fetch('/api/links');
      const linksData = await linksRes.json();
      setLinks(linksData);

      const snapshotsRes = await fetch('/api/snapshots');
      const snapshotsData = await snapshotsRes.json();
      setSnapshots(snapshotsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredSnapshots = filterId === 'all' 
    ? snapshots 
    : snapshots.filter(s => s.linkId === filterId);

  const handleDelete = async (linkId?: string) => {
    if (!confirm('Are you sure you want to clear these results?')) return;
    
    try {
      const url = linkId ? `/api/snapshots?linkId=${linkId}` : '/api/snapshots';
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `aura-snapshot-${name}.jpg`;
    link.click();
  };

  const downloadAll = () => {
    filteredSnapshots.forEach((s, i) => {
      setTimeout(() => {
        downloadImage(s.imageData, `${s.linkId}-${s.timestamp}`);
      }, i * 100);
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Intelligence Gallery</h1>
          <p className="text-white/50">Stored visual data from all active deployments.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <GlassButton variant="outline" size="sm" onClick={() => handleDelete(filterId === 'all' ? undefined : filterId)} className="text-red-400 border-red-400/20 hover:bg-red-400/5">
            <Trash2 size={16} />
            Clear Results
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={downloadAll} disabled={filteredSnapshots.length === 0} glow>
            <Download size={16} />
            Download All
          </GlassButton>
        </div>
      </div>

      <GlassCard className="p-4 border-white/5 bg-white/[0.02]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mr-2">
            <Filter size={16} />
            Filter by Link:
          </div>
          <button
            onClick={() => setFilterId('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all border",
              filterId === 'all' 
                ? "bg-cyber-blue text-white border-cyber-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                : "bg-white/5 text-white/50 border-white/5 hover:border-white/10"
            )}
          >
            All Sources
          </button>
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => setFilterId(link.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all border max-w-[150px] truncate",
                filterId === link.id 
                  ? "bg-cyber-blue text-white border-cyber-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  : "bg-white/5 text-white/50 border-white/5 hover:border-white/10"
              )}
            >
              {link.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <RefreshCw size={40} className="text-cyber-blue animate-spin" />
        </div>
      ) : filteredSnapshots.length === 0 ? (
        <div className="h-[400px] flex flex-col items-center justify-center text-white/20 border border-dashed border-white/10 rounded-3xl">
          <ImageIcon size={64} className="mb-4 opacity-10" />
          <p className="text-xl font-medium">No snapshots archived</p>
          <p className="text-sm">Initiate a link and wait for data capture.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSnapshots.slice().reverse().map((snapshot) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={snapshot.id}
              className="group relative"
            >
              <GlassCard className="p-2 overflow-hidden border-white/5 hover:border-white/20 transition-all">
                <div className="aspect-square rounded-xl overflow-hidden bg-black relative">
                  <img 
                    src={snapshot.imageData} 
                    alt="Captured at source" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <div className="flex gap-2 w-full">
                        <GlassButton 
                          variant="primary" 
                          size="sm" 
                          className="flex-1 py-2"
                          onClick={() => downloadImage(snapshot.imageData, `${snapshot.linkId}-${snapshot.timestamp}`)}
                        >
                          <Download size={14} />
                        </GlassButton>
                        <GlassButton 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 py-2 text-red-400 border-red-400/20"
                          onClick={async () => {
                            const res = await fetch(`/api/snapshots?id=${snapshot.id}`, { method: 'DELETE' });
                            if (res.ok) fetchData();
                          }}
                        >
                          <Trash2 size={14} />
                        </GlassButton>
                     </div>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyber-blue font-bold uppercase tracking-widest">
                      ID: {snapshot.linkId}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Clock size={10} />
                      {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/30 truncate">
                    <Calendar size={10} />
                    {new Date(snapshot.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsGalleryPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <RefreshCw size={40} className="text-cyber-blue animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
