import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Download, RefreshCcw, ArrowLeft, Image as ImageIcon, Sparkles, Wand2, CheckCircle2 } from 'lucide-react';
import { templates, FrameTemplate } from './frames';

type AppState = 'home' | 'select' | 'capture' | 'processing' | 'result';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<FrameTemplate | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [timerDuration, setTimerDuration] = useState(3);
  
  const webcamRef = useRef<Webcam>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const capturedPhotosCount = (photosArray: (string | null)[]) => {
    return photosArray.filter(p => p !== null).length;
  };

  // Helper to init capture sequence
  const startCaptureSequence = () => {
    if (!selectedTemplate) return;
    setAppState('capture');
    setPhotos(Array(selectedTemplate.photoCount).fill(null));
    setCurrentPhotoIndex(0);
    setIsCapturing(false);
    setCountdown(null);
    setIsCameraReady(false);
  };

  const handleStartPhoto = useCallback(() => {
    if (isCapturing || countdown !== null) return;
    
    if (timerDuration === 0) {
      takePhoto();
    } else {
      setCountdown(timerDuration);
    }
  }, [isCapturing, countdown, timerDuration]);

  const takePhoto = useCallback(() => {
    setIsCapturing(true);
    const imageSrc = webcamRef.current?.getScreenshot();
    
    if (imageSrc) {
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[currentPhotoIndex] = imageSrc;
        return newPhotos;
      });

      setTimeout(() => {
        setIsCapturing(false);
        setCountdown(null);
        
        if (currentPhotoIndex < (selectedTemplate?.photoCount || 0) - 1) {
          setCurrentPhotoIndex(prev => prev + 1);
        } else {
          setAppState('processing');
          setTimeout(() => setAppState('result'), 2000);
        }
      }, 500);
    } else {
       setIsCapturing(false);
    }
  }, [currentPhotoIndex, selectedTemplate]);

  // Handle Countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) takePhoto();
      return;
    };
    
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, takePhoto]);


  const handleDownload = async () => {
    if (resultRef.current) {
      try {
        const canvas = await html2canvas(resultRef.current, {
           scale: 2, // High quality
           useCORS: true,
           backgroundColor: null
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `photobooth-${Date.now()}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error("Error downloading image", error);
        alert("Failed to save image. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen text-[#1e293b] selection:bg-indigo-500/20 pb-12 overflow-x-hidden pt-6" style={{ background: 'radial-gradient(circle at 10% 10%, #fbc2eb 0%, #a6c1ee 100%)' }}>
      
      {/* Decorative background blur objects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[120px]" 
         />
         <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-300/20 rounded-full blur-[120px]" 
         />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-[80px] flex items-center justify-between px-8 mb-6 glass-panel mx-4 lg:mx-8 mt-0 sticky top-6 z-50 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[20px] sm:text-[24px] font-[900] tracking-tighter text-indigo-700 uppercase">
            PHOTOBOOTH TRE-PAGIA
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-1 bg-white/40 rounded-full text-xs font-black uppercase text-indigo-600 tracking-wider">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
           Live Studio
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {/* State: HOME */}
          {appState === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
               <motion.div 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-32 h-32 mb-12 rounded-[2rem] bg-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative"
               >
                 <div className="absolute inset-0 bg-indigo-600/5 blur-xl rounded-full animate-pulse" />
                 <Camera className="w-14 h-14 text-indigo-600 relative z-10" strokeWidth={2.5} />
               </motion.div>

               <motion.h2 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-7xl md:text-[140px] font-black tracking-[calc(-0.04em)] text-slate-900 leading-[0.85] mb-8"
               >
                 ABADIKAN<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">MOMEN MU.</span>
               </motion.h2>

               <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 font-extrabold tracking-[0.4em] uppercase mb-14 text-sm md:text-lg opacity-60"
               >
                 Digital Experience / Jakarta 2025
               </motion.p>

               <motion.button
                 whileHover={{ scale: 1.05, y: -5 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setAppState('select')}
                 className="group relative bg-indigo-600 text-white px-16 py-7 rounded-full font-black text-2xl shadow-[0_30px_60px_rgba(79,70,229,0.4)] transition-all flex items-center gap-4 overflow-hidden"
               >
                 <span className="relative z-10">Start Your Booth</span>
                 <Wand2 className="relative z-10 w-7 h-7" />
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               </motion.button>
            </motion.div>
          )}

          {/* State: SELECT */}
          {appState === 'select' && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full"
            >
              <div className="text-center mb-16">
                <motion.h2 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="text-5xl font-black mb-4 text-slate-900 tracking-tight"
                >
                  Choose Your Aesthetic
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-slate-500 font-bold uppercase tracking-widest text-sm"
                >
                  Premium Hand-crafted Frame Templates
                </motion.p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {templates.map((template, idx) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.05) }}
                    whileHover={{ y: -12 }}
                    onClick={() => {
                      setSelectedTemplate(template);
                      startCaptureSequence();
                    }}
                    className="group relative flex flex-col items-center bg-white/60 backdrop-blur-xl border border-white/50 rounded-[40px] overflow-hidden hover:border-indigo-400 hover:shadow-[0_40px_80px_rgba(79,70,229,0.15)] transition-all text-left w-full focus:outline-none shadow-none"
                  >
                    <div className="w-full bg-slate-50/50 p-6 flex items-start justify-center relative overflow-hidden h-[400px]">
                      <div className="scale-[0.8] origin-top transition-transform group-hover:scale-[0.85] duration-700 pointer-events-none filter drop-shadow-2xl">
                         {template.render(Array(template.photoCount).fill(null), true)}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    <div className="p-8 w-full border-t border-white/40 bg-white/40 backdrop-blur-md flex flex-col gap-1">
                       <span className="font-black text-xl text-slate-800 tracking-tight">{template.name}</span>
                       <div className="flex items-center justify-between mt-2">
                         <div className="px-3 py-1 bg-indigo-100/80 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5"/> {template.photoCount} Shots Layout
                         </div>
                       </div>
                    </div>
                    
                    {/* Hover Glow */}
                    <div className="absolute -inset-[2px] rounded-[42px] border-4 border-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* State: CAPTURE */}
          {appState === 'capture' && selectedTemplate && (
            <motion.div 
              key="capture"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-6xl mx-auto flex flex-col min-h-[70vh]"
            >
              <header className="flex items-center justify-between mb-8 w-full bg-white/40 backdrop-blur-md p-4 rounded-[28px] border border-white/40">
                <button 
                  onClick={() => setAppState('select')}
                  className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-indigo-50 transition-all font-black text-sm text-slate-700 uppercase tracking-wider shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Abort
                </button>
                <div className="flex items-center gap-6">
                   <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Ready to capture</span>
                      <span className="text-lg font-black text-slate-800">{selectedTemplate.name}</span>
                   </div>
                   <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                </div>
              </header>

              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start mt-4">
                 {/* Left: Camera Control Area */}
                 <div className="w-full lg:col-span-7 flex flex-col items-center">
                    <div className="relative w-full rounded-[48px] overflow-hidden bg-slate-950 aspect-[4/3] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-[12px] border-white ring-1 ring-slate-200">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored={isMirrored}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user", width: 1280, height: 960 }}
                        onUserMedia={() => setIsCameraReady(true)}
                        className="w-full h-full object-cover"
                      />

                      {/* Capturing Flash Overlay */}
                      <AnimatePresence>
                        {isCapturing && (
                          <motion.div 
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white z-50 pointer-events-none" 
                          />
                        )}
                      </AnimatePresence>

                      {/* Countdown Overlay */}
                      <AnimatePresence mode="wait">
                        {countdown !== null && countdown > 0 && (
                          <motion.div 
                            key="countdown"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-40 bg-indigo-900/10 backdrop-blur-[2px]"
                          >
                              <motion.span 
                                key={countdown}
                                initial={{ scale: 0.2, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                className="text-[180px] font-black text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)] font-mono italic"
                              >
                                {countdown}
                              </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {!isCameraReady && (
                         <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-30">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                              className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full mb-6" 
                            />
                            <span className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Initializing Lens</span>
                         </div>
                      )}

                      {/* Photo progress dots */}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3 z-30 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                         {Array.from({ length: selectedTemplate.photoCount }).map((_, i) => (
                           <div 
                             key={i} 
                             className={cn(
                               "w-3 h-3 rounded-full transition-all duration-700",
                               i < currentPhotoIndex ? "bg-green-400 shadow-[0_0_15px_#4ade80]" : 
                               i === currentPhotoIndex ? "bg-white scale-125 shadow-[0_0_20px_rgba(255,255,255,1)]" : "bg-white/20"
                             )}
                           />
                         ))}
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl px-4 justify-center">
                       {/* UI Controls Card */}
                       <div className="flex-1 flex items-center justify-between bg-white/70 backdrop-blur-xl px-8 py-5 rounded-[32px] shadow-xl border border-white/50">
                          <div className="flex flex-col gap-2">
                             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Shot Timer</span>
                             <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100/50">
                               {[0, 3, 5, 10].map(d => (
                                 <button 
                                   key={d}
                                   onClick={() => setTimerDuration(d)}
                                   className={cn(
                                     "px-5 py-2.5 rounded-xl font-bold text-xs transition-all",
                                     timerDuration === d ? "bg-indigo-600 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-700"
                                   )}
                                 >
                                   {d === 0 ? "OFF" : `${d}s`}
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="h-10 w-px bg-slate-200/50 mx-4" />

                          <button 
                             onClick={() => setIsMirrored(!isMirrored)}
                             className={cn(
                               "flex flex-col items-center justify-center p-3 rounded-2xl font-bold transition-all group shrink-0 w-24",
                               isMirrored ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200" : "bg-slate-50 text-slate-400"
                             )}
                          >
                             <RefreshCcw className={cn("w-6 h-6 mb-1 transition-transform duration-700 ease-out", isMirrored ? "rotate-180" : "")} />
                             <span className="text-[9px] font-black uppercase tracking-tighter">Flip View</span>
                          </button>
                       </div>

                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={handleStartPhoto}
                         disabled={countdown !== null || !isCameraReady}
                         className={cn(
                           "relative flex items-center justify-center p-1 rounded-full aspect-square w-28 group transition-all shrink-0",
                           (countdown !== null || !isCameraReady) ? "opacity-30 grayscale cursor-not-allowed" : "hover:shadow-[0_20px_40px_rgba(79,70,229,0.3)]"
                         )}
                       >
                         <div className="absolute inset-0 bg-indigo-600 rounded-full transition-transform group-hover:scale-110" />
                         <div className="relative w-full h-full rounded-full border-4 border-white/50 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-white" strokeWidth={2.5} />
                         </div>
                       </motion.button>
                    </div>
                 </div>
                 
                 {/* Right: Preview Area */}
                 <div className="w-full lg:col-span-5 flex flex-col items-center sticky top-32">
                    <motion.div 
                      key="preview-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-white/40 backdrop-blur-3xl rounded-[48px] p-8 lg:p-10 border border-white/60 shadow-2xl relative overflow-hidden"
                    >
                       <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600 opacity-60"></div>
                       
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Layout Preview</h3>
                          </div>
                          {capturedPhotosCount(photos) > 0 && (
                             <span className="px-4 py-1.5 bg-indigo-100 rounded-full text-[9px] font-black text-indigo-700 uppercase tracking-widest animate-in fade-in zoom-in">
                                Shot {capturedPhotosCount(photos)} / {selectedTemplate.photoCount}
                             </span>
                          )}
                       </div>
                       
                       <div className="flex justify-center transition-all duration-700 filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden rounded-2xl">
                          <div className="scale-[0.55] sm:scale-[0.7] lg:scale-[0.75] xl:scale-[0.8] origin-top transition-transform duration-1000">
                              {selectedTemplate.render(photos, true)}
                          </div>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-slate-200/30 text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Tre-Pagi Studio / Realtime Feed</p>
                       </div>
                    </motion.div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* State: PROCESSING */}
          {appState === 'processing' && (
             <motion.div 
               key="processing"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center min-h-[60vh]"
             >
                <motion.div 
                   animate={{ 
                     scale: [1, 1.2, 1],
                     rotate: [0, 180, 360]
                   }}
                   transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                   className="w-24 h-24 border-[8px] border-indigo-100 border-t-indigo-600 rounded-full mb-12 shadow-2xl"
                />
                <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Developing Your Memories</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">High Resolution Rendering in progress...</p>
             </motion.div>
          )}

          {/* State: RESULT */}
          {appState === 'result' && selectedTemplate && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-12">
                 <div className="inline-flex items-center gap-3 px-6 py-2 bg-green-100 rounded-full text-green-700 font-black uppercase text-xs tracking-widest mb-6 border border-green-200">
                    <CheckCircle2 className="w-4 h-4" /> Perfect Shot Captured
                 </div>
                 <h2 className="text-6xl font-[900] text-slate-900 tracking-[calc(-0.04em)] leading-none">Voilà! Your Moment.</h2>
              </div>
              
              <div className="grid lg:grid-cols-12 gap-12 w-full items-start max-w-6xl">
                 <div className="lg:col-span-8 flex justify-center">
                    <motion.div 
                      initial={{ scale: 0.9, rotate: -2 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.3 }}
                      className="relative group cursor-zoom-in"
                    >
                       <div ref={resultRef} className="shadow-[0_60px_120px_rgba(0,0,0,0.3)] ring-1 ring-slate-100 bg-white">
                          {selectedTemplate.render(photos, false)}
                       </div>
                       
                       {/* Subtle texture overlay on final output */}
                       <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-black group-hover:opacity-0 transition-opacity" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/60-lines.png")' }}></div>
                    </motion.div>
                 </div>

                 <div className="lg:col-span-4 flex flex-col gap-6 sticky top-[120px]">
                    <div className="bg-white/60 backdrop-blur-2xl p-10 rounded-[48px] border border-white shadow-2xl flex flex-col gap-8">
                       <div className="flex flex-col gap-2">
                          <h3 className="text-slate-800 font-black text-2xl tracking-tight">Save & Share</h3>
                          <p className="text-slate-500 text-sm font-medium">Export in ultra 4K resolution equivalent for printing.</p>
                       </div>

                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={handleDownload}
                         className="flex items-center justify-center gap-4 bg-indigo-600 text-white px-10 py-6 rounded-full font-black text-xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all hover:bg-indigo-700"
                       >
                         <Download className="w-6 h-6" /> Download Still
                       </motion.button>

                       <button
                         onClick={() => {
                           setPhotos(Array(selectedTemplate.photoCount).fill(null));
                           setCurrentPhotoIndex(0);
                           setAppState('select');
                         }}
                         className="flex items-center justify-center gap-3 px-8 py-5 rounded-full border-2 border-slate-200 text-slate-600 transition-all font-black text-lg hover:bg-slate-50 uppercase tracking-wider"
                       >
                         <RefreshCcw className="w-5 h-5" /> New Session
                       </button>

                       <div className="pt-6 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                            Captured via Tre-Pagi Photobooth Engine<br/>
                            Ver 2.0 / Studio Build
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
