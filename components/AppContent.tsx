"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Snow from "./Snow";
import FisheyeText from "./FisheyeText";
import ScanningLens from "./ScanningLens";
import SphereText from "./SphereText";
import InstallationCube from "./InstallationCube";
import MetalText from "./MetalText";
import { playSound } from "@/utils/audio";

// --- BACKGROUND WALL COMPONENT ---
const BackgroundWall = ({ onIntroComplete, isGlitch = false }: { onComplete?: () => void, onIntroComplete?: () => void, isGlitch?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);
    const startTimeRef = useRef(0);
    const isSettledRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Intro Animation Constants
        const DURATION = 3000; // 2.5s
        const TOTAL_SCROLL_DIST = 5000; 

        const easeOutQuint = (x: number): number => {
            return 1 - Math.pow(1 - x, 5);
        };

        const render = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / DURATION, 1);
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }

            if (isGlitch) {
                ctx.fillStyle = Math.random() > 0.9 ? '#110000' : '#000000';
            } else {
                ctx.fillStyle = '#050505';
            }
            ctx.fillRect(0, 0, width, height);

            const fontSize = Math.min(width, height) * 0.27; 
            ctx.font = `bold ${fontSize}px "Incised 901 Nord"`;
            ctx.textBaseline = 'middle';
            
            if (isGlitch) {
                 ctx.fillStyle = Math.random() > 0.7 ? '#ff0000' : '#3f6958ff';
            } else {
                 ctx.fillStyle = '#3f6958ff'; 
            }
            
            const lineHeight = fontSize * 0.8;
            const totalLines = Math.ceil(height / lineHeight) + 4; 
            
            let scrollPos = TOTAL_SCROLL_DIST * (1 - easeOutQuint(progress));
            
            if (isGlitch) {
                scrollPos = (Math.random() * 100); // Jitter
            }

            let offsetLeft = scrollPos;
            let offsetRight = -scrollPos;

            if (isGlitch) {
                 offsetLeft += (Math.random() * 50 - 25);
                 offsetRight += (Math.random() * 50 - 25);
            }

            if (!isGlitch && progress >= 1 && !isSettledRef.current) {
                isSettledRef.current = true;
                if (onIntroComplete) onIntroComplete();
            }

            const centerX = width / 2;
            const gap = 4; // Tiny gap for the "split" look

            // Draw Pattern
            for (let i = -2; i < totalLines; i++) {
                const baseY = i * lineHeight + (lineHeight / 2);
                
                // Left Column ("20") - Right Aligned
                ctx.textAlign = 'right';
                const yLeft = (baseY + offsetLeft) % (lineHeight * totalLines);
                const drawYLeft = yLeft < -lineHeight ? yLeft + (lineHeight * totalLines) : yLeft;
                ctx.fillText("20", centerX - gap, drawYLeft);

                // Right Column ("25") - Left Aligned
                ctx.textAlign = 'left';
                const yRight = (baseY + offsetRight) % (lineHeight * totalLines);
                const drawYRight = yRight < -lineHeight ? yRight + (lineHeight * totalLines) : (yRight > height + lineHeight ? yRight - (lineHeight * totalLines) : yRight);
                
                let textRight = "25";
                if (isGlitch && Math.random() > 0.8) textRight = Math.random() > 0.5 ? "26" : "ERROR";

                ctx.fillText(textRight, centerX + gap, drawYRight);
            }

            // Center Line Divider
            ctx.strokeStyle = isGlitch ? '#ff000055' : '#3f695833'; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.stroke();

            frameRef.current = requestAnimationFrame(render);
        };

        // Font loading check
        document.fonts.load('700 100px "Incised 901 Nord"').then(() => {
             frameRef.current = requestAnimationFrame(render);
        });

        return () => cancelAnimationFrame(frameRef.current);
    }, [onIntroComplete]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />;
};

// --- ACT I: THE ARRIVAL ---
const Act1_Boot = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("");
  const fullText = [
    "> INITIALIZING NEW_YEAR.EXE...",
    "> LOADING CELEBRATION PROTOCOL...",
    "> ████████████████ 100%"
  ];

  useEffect(() => {
    playSound('boot');
    let currentLine = 0;
    let currentChar = 0;
    
    const typeWriter = setInterval(() => {
      if (currentLine >= fullText.length) {
        clearInterval(typeWriter);
        setTimeout(onComplete, 800);
        return;
      }

      const line = fullText[currentLine];
      if (currentChar < line.length) {
        setText(prev => {
           const lines = prev.split('\n');
           lines[lines.length - 1] = line.substring(0, currentChar + 1);
           return lines.join('\n');
        });
        playSound('type');
        currentChar++;
      } else {
        setText(prev => prev + "\n");
        currentLine++;
        currentChar = 0;
      }
    }, 40);

    return () => clearInterval(typeWriter);
  }, []);

  return (
    <div className="h-full flex items-center justify-center bg-transparent font-mono text-cyber-green text-sm md:text-xl whitespace-pre-line p-10 cursor-crosshair z-10 relative">
      {text}
      <span className="animate-pulse">_</span>
    </div>
  );
};

// --- ACT II & III: THE OLD WORLD & DELETION ---
const Act2_OldWorld = ({ onDelete, onUnlockAudio }: { onDelete: () => void, onUnlockAudio?: () => void }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const steps = [
      "DELETING\nMEMORIES", 
      "PURGING\nTRENDS", 
      "REMOVING\nCRINGE", 
      "CLEARING\nEXES", 
      "FORMATTING\n2025"
  ];

  const handleDeleteClick = () => {
      playSound('boot'); // First audible sound after interaction
      playSound('error'); // Immediate feedback for the "Delete" action
      // Unlock Audio Context for Safari
      if (onUnlockAudio) onUnlockAudio();
      setShowWarning(true);
  };

  const confirmDelete = () => {
    playSound('type');
    setShowWarning(false);
    setIsDeleting(true);
  };

  const startPurging = () => {
    // SphereText animation takes approx 10s base, extending by 4s to 14s.
    // We sync the progress bar and text steps to this duration.
    
    const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return prev + 1;
        });
    }, 160); // 140ms * 100 = 14000ms = 14s

    const stepInterval = setInterval(() => {
        setStepIndex(prev => {
            if (prev >= steps.length - 1) {
                clearInterval(stepInterval);
                setTimeout(() => {
                    playSound('explosion');
                    onDelete();
                }, 1000);
                return prev;
            }
            playSound('type'); 
            return prev + 1;
        });
    }, 3000); // 2800ms * 5 steps = 14000ms = 14s
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center z-10 bg-black">
      
      {/* 1. BACKGROUND WALL (Animated Intro -> Static) */}
      <BackgroundWall onIntroComplete={() => setIntroFinished(true)} />

      {/* 2. SPHERE TEXT (Purging) or SCANNING LENS (Intro) */}
      <AnimatePresence mode="wait">
        {introFinished && !isDeleting && (
            <motion.div 
                key="scanning-lens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-0 z-10"
            >
                <ScanningLens 
                    text={"DELETE\n2025?"}
                    color={"#00ff88"}
                    isScanning={true}
                    fontSize={80}
                    intensity={2.5}
                />
            </motion.div>
        )}
        {isDeleting && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-15"
            >
                {/* Use SphereText for the visual during purging, passing a no-op onComplete or handle it if needed */}
                <SphereText onComplete={() => {}} onReady={startPurging} />
            </motion.div>
        )}
      </AnimatePresence>

      {/* 3. UI OVERLAY */}
      <div className="z-20 flex flex-col items-center space-y-8 w-full absolute pointer-events-none">
        
        {introFinished && !isDeleting && (
             <motion.button
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.5 }}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={handleDeleteClick}
             className="pointer-events-auto px-12 py-6 bg-red-600 text-white font-pixel border-4 border-red-800 hover:bg-red-500 shadow-[0_0_30px_rgba(255,0,0,0.6)] uppercase tracking-widest text-2xl cursor-pointer chromatic-text mt-96"
           >
             [ DELETE ]
           </motion.button>
        )}

        {isDeleting && (
            <div className="flex flex-col items-center justify-center w-full mt-[60vh]">
                <div className="w-full max-w-xs md:max-w-2xl px-4">
                    <div className="w-full h-8 border-4 border-red-500 p-1 bg-black shadow-[0_0_30px_rgba(255,0,0,0.4)]">
                        <div className="h-full bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)]" style={{ width: `${deleteProgress}%` }} />
                    </div>
                    <div className="font-pixel text-red-500 animate-pulse text-lg text-center mt-2 bg-black/50">
                        PURGING: {deleteProgress}%
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Windows 98 Warning Popup */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
          >
            <div className="win98-window w-[90%] max-w-md p-1">
              <div className="win98-header flex justify-between items-center">
                <span>SYSTEM WARNING</span>
                <button onClick={() => setShowWarning(false)} className="bg-gray-300 text-black px-1 leading-none text-xs font-bold border border-black/20">X</button>
              </div>
              <div className="p-6 flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="text-4xl animate-bounce">⚠️</div>
                    <p className="text-sm font-bold">Are you sure you want to delete 2025? <br/> This action cannot be undone.</p>
                </div>
                <div className="flex space-x-4 w-full justify-center">
                   <button onClick={confirmDelete} className="win98-btn min-w-[80px] hover:bg-white cursor-pointer">YES</button>
                   <button onClick={confirmDelete} className="win98-btn min-w-[80px] font-bold hover:bg-white cursor-pointer">ABSOLUTELY YES</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ACT III: SYSTEM PURGE ---
const Act3_Glitch = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        playSound('error');
        
        // Loop error sound for glitch effect
        const interval = setInterval(() => {
            if (Math.random() > 0.5) playSound('error');
        }, 500);

        const timer = setTimeout(() => {
            clearInterval(interval);
            onComplete();
        }, 4000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center z-10 bg-black">
        <motion.div 
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
        >
             <BackgroundWall isGlitch={true} />
             <div className="absolute inset-0 z-20 mix-blend-hard-light opacity-80">
                 <ScanningLens 
                    text={"SYSTEM\nFAILURE"} 
                    color="#ff0000" 
                    intensity={4.0} 
                    speed={5.0}
                    fontSize={80} 
                    isScanning={true} 
                 />
             </div>
             <div className="z-30 font-pixel text-red-500 text-2xl md:text-5xl animate-pulse bg-black p-4 border-2 border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.8)]">
                CRITICAL ERROR
             </div>
            </motion.div>
        </div>
    );
};


// --- ACT IV: THE HYPERSPEED DOWNLOAD ---
const Act4_Download = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    
    // We use refs to manage the batch logic inside the interval without re-rendering issues
    const fileIndexRef = useRef(0);
    const batchCountRef = useRef(0);
    
    const allDownloads = [
        "NEW_MEMORIES.EXE", "BETTER_DECISIONS.DLL", "UNLIMITED_COFFEE.JAR", 
        "NO_MORE_MONDAYS.SYS", "GOOD_VIBES_ONLY.ZIP", "FINANCIAL_STABILITY.APK",
        "GYM_MOTIVATION.BAT", "CLEAR_SKIN.PATCH", "LUCK_V2.0.PKG", 
        "TOXIC_TRAITS_UNINSTALLER.EXE", "CORE_CONFIDENCE.MSI", "TRAVEL_PLANS_2026.PDF",
        "HEALTH_OPTIMIZATION.REG", "JOY_OVERLOAD.DAT", "SUCCESS_METRICS.LOG"
    ];

    useEffect(() => {
        // SLOWER Progress Interval (runs every 100ms)
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 1500);
                    return 100;
                }
                
                // Randomly play whoosh during high speed
                if (Math.random() > 0.9) playSound('whoosh');

                // Increment logic: Slower and steadier
                // 100% / ~100 ticks = ~1% per tick, we go a bit slower for drama
                return Math.min(prev + 0.6, 100);
            });

        }, 60);

        // SEPARATE Interval for Text Batches (runs slower for readability)
        const textInterval = setInterval(() => {
            if (progress >= 100) return;

            // If we have shown 4 lines, clear them (Batch logic)
            if (batchCountRef.current >= 4) {
                setLogs([]); // Clear screen
                batchCountRef.current = 0; // Reset batch count
                return; // Wait one tick with empty screen
            }

            // Add next file if available
            if (fileIndexRef.current < allDownloads.length) {
                const newFile = allDownloads[fileIndexRef.current];
                setLogs(prev => [...prev, `> INSTALLING: ${newFile}`]);
                
                fileIndexRef.current += 1;
                batchCountRef.current += 1;
            } else {
                // If we ran out of unique files, just generate generic data
                setLogs(prev => [...prev, `> OPTIMIZING SECTOR ${Math.floor(Math.random() * 900)}...`]);
                batchCountRef.current += 1;
            }

        }, 600); // New text line every 600ms (readable speed)

        return () => {
            clearInterval(interval);
            clearInterval(textInterval);
        };
    }, []);

    // Generate MORE lines, THICKER lines, BRIGHTER lines
    const speedLines = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: Math.random() * 0.5 + 0.3, // Faster movement
        width: Math.random() > 0.5 ? 3 : 2 // Varying thickness
    }));

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white font-mono overflow-hidden relative z-10">
            
            {/* --- BACKGROUND LAYERS --- */}
            
            {/* 1. Enhanced CRT Scanline Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
            
            {/* 2. HYPER VISIBLE Speed Lines (Vertical Data Rain) */}
            <div className="absolute inset-0 z-0">
                {speedLines.map((line) => (
                    <motion.div
                        key={line.id}
                        className="absolute top-0 bg-gradient-to-b from-transparent via-cyan-400 to-white shadow-[0_0_15px_#00FFFF]"
                        style={{ 
                            left: line.left, 
                            height: '50vh',
                            width: `${line.width}px`,
                            opacity: 0.7 
                        }}
                        initial={{ y: -600, opacity: 0 }}
                        animate={{ y: '120vh', opacity: [0, 1, 0] }}
                        transition={{
                            duration: line.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: line.delay
                        }}
                    />
                ))}
            </div>

            {/* --- MAIN INTERFACE --- */}
            
            <div className="z-20 relative w-full max-w-3xl px-6">
                {/* Holographic Container with INTENSE GLOW */}
                <div className="bg-black/80 border-2 border-cyan-900 backdrop-blur-md p-6 relative shadow-[0_0_100px_rgba(0,255,255,0.4)]">
                    
                    {/* Glowing Corners */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                    {/* Header Section */}
                    <div className="flex justify-between items-end mb-8 border-b-2 border-cyan-500/50 pb-4">
                        <div className="flex flex-col">
                            <span className="font-incised text-sm text-cyan-200 tracking-[0.3em] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                                SYSTEM OVERRIDE
                            </span>
                            <h2 className="font-incised text-3xl md:text-5xl text-white italic drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                                DOWNLOADING <span className="text-cyan-400">2026</span>
                            </h2>
                        </div>
                        <div className="text-right">
                             <div className="font-pixel text-5xl text-cyan-300 animate-pulse drop-shadow-[0_0_10px_#00FFFF]">
                                {Math.floor(progress)}<span className="text-2xl align-top">%</span>
                            </div>
                        </div>
                    </div>

                    {/* The Progress Bar - THICKER & SLOWER */}
                    <div className="mb-8 relative">
                        {/* Container */}
                        <div className="w-full h-12 bg-gray-900 border-2 border-cyan-600 relative overflow-hidden skew-x-[-10deg] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                            {/* Grid Background in bar */}
                            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(90deg,transparent_90%,#00FFFF_90%)] bg-[length:30px_100%]" />
                            
                            {/* Fill */}
                            <motion.div 
                                className="h-full bg-gradient-to-r from-blue-700 via-cyan-500 to-white relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Glowing leading edge */}
                                <div className="absolute right-0 top-0 h-full w-2 bg-white blur-[2px]" />
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px]" />
                            </motion.div>
                        </div>

                        {/* Labels - NOW HIGH VISIBILITY */}
                        <div className="flex justify-between mt-3 font-mono text-sm md:text-base font-bold text-cyan-200 drop-shadow-[0_0_5px_rgba(0,255,255,1)]">
                            <span>PACKETS: ENCRYPTED</span>
                            <span>EST. TIME: T-MINUS 0</span>
                        </div>
                    </div>

                    {/* The Terminal Log - BATCHED & READABLE */}
                    <div className="bg-black border border-cyan-800 p-6 h-48 overflow-hidden relative shadow-inner shadow-cyan-900/50">
                        {/* Scanline inside terminal */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none" />
                        
                        <div className="flex flex-col justify-start h-full gap-3 font-pixel text-sm md:text-lg tracking-wide text-cyan-400">
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]"
                                >
                                    {log}
                                </motion.div>
                            ))}
                            {/* Blinking Cursor */}
                            <motion.div 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="w-3 h-5 bg-cyan-400 inline-block align-middle ml-2 shadow-[0_0_10px_#00FFFF]"
                            />
                        </div>
                    </div>
                </div>
                
                {/* System ID Footer - HIGH VISIBILITY */}
                <div className="text-center mt-6 text-cyan-200 font-pixel text-xs md:text-sm tracking-[0.2em] drop-shadow-[0_0_5px_#00FFFF]">
                    SYS.ID: 2026-ALPHA-OVERRIDE // DO NOT TURN OFF CONSOLE
                </div>
            </div>
        </div>
    );
};

// --- ACT V: THE INSTALLATION (28-38 seconds) ---
const Act5_Installation = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState<'prompt' | 'installing' | 'viewCube' | 'complete'>('prompt');
    const [typedY, setTypedY] = useState("");
    const [logs, setLogs] = useState<{task: string, id: number}[]>([]);
    const [progress, setProgress] = useState(0);

    // Prompt Step
    useEffect(() => {
        if (step === 'prompt') {
            const timer = setTimeout(() => {
                setTypedY("Y");
                playSound('type');
                setTimeout(() => setStep('installing'), 800);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Installing Step
    useEffect(() => {
        if (step === 'installing') {
            const totalDuration = 10000; // 10 seconds installation
            const intervalTime = 100;
            const increments = totalDuration / intervalTime;
            
            const timer = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (100 / increments);
                    if (next >= 100) {
                        clearInterval(timer);
                        // After progress finishes, wait a bit then show cube only
                        setTimeout(() => setStep('viewCube'), 1000);
                        return 100;
                    }
                    return next;
                });
            }, intervalTime);

            return () => clearInterval(timer);
        }
    }, [step]);

    // Transition from viewCube to complete
    useEffect(() => {
        if (step === 'viewCube') {
            const timer = setTimeout(() => {
                setStep('complete');
            }, 4000); // 4 seconds of uninterrupted cube view
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Task Logs Logic
    const tasks = [
        "Installing happiness...", "Installing New friends...", "Adding luck...", 
        "Calibrating aura...",  "Downloading weekend plans...", "Refactoring life choices..."
    ];

    useEffect(() => {
        if (step === 'installing') {
            let count = 0;
            const logInterval = setInterval(() => {
                if (count >= tasks.length) { 
                    clearInterval(logInterval);
                    return;
                }
                const currentTask = tasks[count];
                setLogs(prev => [...prev, { task: currentTask, id: count }]);
                playSound('type');
                count++;
            }, 1200); // Sequential spawn every 1.2s
            return () => clearInterval(logInterval);
        }
    }, [step]);

    // Complete Step
    useEffect(() => {
        if (step === 'complete') {
            playSound('success');
            // Reboot sound for the transition
            setTimeout(() => playSound('boot'), 1500);
            setTimeout(onComplete, 2000);
        }
    }, [step, onComplete]);

    return (
        <div className={`h-full w-full relative overflow-hidden flex flex-col items-center justify-center z-10 transition-colors duration-1000 ${step === 'installing' || step === 'viewCube' ? 'bg-blue-950' : 'bg-black'}`}>
            
            {/* 1. BACKGROUND LAYERS */}
            {(step === 'installing' || step === 'viewCube') && (
                <>
                    <InstallationCube />
                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-0" />
                    <Snow /> 
                </>
            )}

            {/* 2. CLI PROMPT OVERLAY */}
            <AnimatePresence>
                {step === 'prompt' && (
                    <motion.div 
                        exit={{ opacity: 0 }}
                        className="font-mono text-xl md:text-3xl text-green-500 z-50"
                    >
                        {"> INSTALL 2026? [Y/N]: "}{typedY}<span className="animate-pulse">_</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. INSTALLATION GRID UI */}
            <AnimatePresence>
                {step === 'installing' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none"
                    >
                        {/* Top Header */}
                        <div className="flex justify-between items-start">
                            <div className="font-mono text-cyan-300 text-sm md:text-base bg-black/50 p-2 border border-cyan-500/30">
                                {"> ROOT_ACCESS: GRANTED"}
                            </div>
                            <div className="font-pixel text-4xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {Math.floor(progress)}%
                            </div>
                        </div>

                        {/* Floating Task Windows Grid (Retro Win98 Style) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto my-auto opacity-90 z-30">
                            {logs.map((item, i) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="win98-window p-1 shadow-xl backdrop-blur-sm bg-white/10"
                                >
                                    <div className="win98-header bg-gradient-to-r from-blue-800 to-blue-600 flex justify-between items-center px-2 py-1">
                                        <span className="text-[10px] text-white font-bold">TASK_{1000+i}.EXE</span>
                                        <button className="w-3 h-3 bg-gray-300 border border-gray-500 flex items-center justify-center text-[8px] hover:bg-red-500">x</button>
                                    </div>
                                    <div className="p-3 bg-white/80 font-mono text-xs md:text-sm text-black h-full min-h-[80px] flex flex-col justify-between">
                                        <p className="mb-2 font-bold leading-tight">{item.task}</p>
                                        <div className="w-full h-3 border-2 border-gray-400 p-[1px] bg-gray-200">
                                             <div className="h-full bg-blue-700 w-full animate-pulse" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Footer */}
                        <div className="text-center font-mono text-cyan-200 animate-pulse bg-black/50 p-2 inline-block mx-auto border-t border-cyan-500/30">
                            {"> PLEASE DO NOT TURN OFF YOUR REALITY"}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. VIEW CUBE PHASE UI (Optional overlay) */}
            <AnimatePresence>
                 {step === 'viewCube' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute bottom-10 z-20 text-center w-full"
                    >
                         <div className="font-pixel text-xl text-white animate-pulse drop-shadow-[0_0_10px_white]">
                            OPTIMIZATION COMPLETE. ENJOY 2026.
                        </div>
                    </motion.div>
                 )}
            </AnimatePresence>

            {/* 5. COMPLETION FLASH */}
            {step === 'complete' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-xl p-4 text-center">
                    <div className="font-pixel text-2xl md:text-5xl text-white drop-shadow-[0_0_20px_white] w-full break-words">
                        REBOOTING TIMELINE...
                    </div>
                </div>
            )}
            
            {/* Screen Flash on Exit */}
            <AnimatePresence>
                {step === 'complete' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ duration: 0.2, delay: 1.5 }}
                        className="absolute inset-0 bg-white z-[100]"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- ACT VI: THE REVELATION ---
const ActFinale = ({ name }: { name: string }) => {
    const [step, setStep] = useState("search"); // Start with SEARCH
    const [searchPhase, setSearchPhase] = useState(0);

    useEffect(() => {
        playSound('boot');
        
        // SEQUENCE:
        // 1. Search Phase (0-4s)
        // 2. Reveal Phase (4-8s)
        // 3. Boom Phase (8s+)

        if (step === "search") {
            const t1 = setTimeout(() => setSearchPhase(1), 1500); // Detecting...
            const t2 = setTimeout(() => setSearchPhase(2), 3000); // Match Found!
            const t3 = setTimeout(() => setStep("reveal"), 4500); // Move to Reveal

            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }

        if (step === "reveal") {
            const t4 = setTimeout(() => {
                setStep("boom");
                playSound('success');
            }, 4000);
            return () => clearTimeout(t4);
        }
    }, [step]);

    useEffect(() => {
        if (step === "boom") {
             const colors = ['#00FF94', '#FF00FF', '#00FFFF', '#FFD600'];
             const end = Date.now() + 5 * 1000;
             const frame = () => {
                 confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
                 confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
                 if (Date.now() < end) requestAnimationFrame(frame);
             };
             frame();
        }
    }, [step]);

    return (
        <div className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden z-10 bg-black">
            
            {/* 3D Scene Background (Persistent but hidden during search) */}
            <motion.div 
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: step === "search" ? 0 : 1 }}
                transition={{ duration: 2 }}
            >
                <MetalText />
            </motion.div>

            {/* Overlay UI */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                
                {/* 1. SEARCH PHASE (Progressive) */}
                <AnimatePresence mode="wait">
                    {step === "search" && (
                        <motion.div 
                            key="search-card"
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
                            className="bg-black/80 border-2 border-cyan-500/50 p-8 md:p-12 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,255,0.2)] max-w-lg w-[90%]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 border-b border-cyan-800 pb-2">
                                <span className="font-pixel text-xs text-cyan-500">DB_QUERY.EXE</span>
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-75" />
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150" />
                                </div>
                            </div>

                            {/* Content Content */}
                            <div className="space-y-4 font-mono text-sm md:text-lg">
                                <motion.div 
                                    className="text-cyan-300 flex items-center gap-2"
                                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <span className="text-xl">⟳</span> SEARCHING DATABASE...
                                </motion.div>

                                {searchPhase >= 1 && (
                                    <motion.div 
                                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                        className="text-purple-300"
                                    >
                                        {"> DETECTING AWESOME HUMAN..."}
                                    </motion.div>
                                )}

                                {searchPhase >= 2 && (
                                    <motion.div 
                                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                        className="text-green-400 font-bold bg-green-900/20 p-2 border border-green-500/30"
                                    >
                                        {`> MATCH FOUND: ${name}`}
                                    </motion.div>
                                )}
                            </div>
                            
                            {/* Loading Bar */}
                            <div className="mt-6 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-cyan-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 4.5, ease: "linear" }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. REVEAL PHASE */}
                <AnimatePresence>
                    {step === "reveal" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="text-center mt-[40vh]" 
                        >
                            <div className="font-pixel text-xl md:text-3xl text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] mb-4 bg-black/50 p-4 border-y border-cyan-500/30 backdrop-blur-sm">
                                {"> WELCOME TO 2026"}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. BOOM PHASE */}
                <AnimatePresence>
                    {step === "boom" && (
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex flex-col justify-between items-center py-12 md:py-16 pointer-events-none"
                        >
                            {/* TOP CONTENT: Greeting */}
                            <div className="text-center relative px-4 pointer-events-auto mt-20 md:mt-12">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyber-pink via-cyber-blue to-cyber-green blur-[100px] opacity-20 pointer-events-none" />
                                
                                <h2 className="font-pixel text-xl md:text-3xl text-white mb-4 animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
                                    HAPPY NEW YEAR
                                </h2>
                                <h1 className="font-black text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-300 to-purple-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] uppercase">
                                    {name}
                                </h1>
                            </div>

                            {/* BOTTOM CONTENT: Replay Button */}
                            <div className="pointer-events-auto mb-24 md:mb-12">
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 border border-white/40 bg-white/5 hover:bg-white/20 text-white font-pixel text-xs transition-colors cursor-pointer backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                >
                                    [ REPLAY ]
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* CRT Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
    );
};


// --- ORCHESTRATOR ---
function MainContent() {
  const searchParams = useSearchParams();
  const rawName = searchParams.get("name") || "FRIEND";
  const name = rawName.toUpperCase();
  const [act, setAct] = useState(1);
  
  // Audio Ref for BGM
  const bgmRef = useRef<HTMLAudioElement>(null);

  // Safari Unlock: Play then immediately Pause
  const unlockAudio = () => {
      const bgm = bgmRef.current;
      if (bgm) {
          // Fix for iOS Safari: play immediately on gesture, but pause in the next frame
          bgm.volume = 0; // Ensure silence
          bgm.play().then(() => {
              // Yield one frame to allow Safari to register the "playing" state
              // before pausing. This gives ownership of the audio to the session.
              requestAnimationFrame(() => {
                  bgm.pause();
                  bgm.currentTime = 0;
              });
          }).catch(e => console.error("BGM Unlock Failed", e));
      }
  };

  // Music Logic Effect
  useEffect(() => {
      if (act === 6 && bgmRef.current) {
          const bgm = bgmRef.current;
          bgm.currentTime = 0;
          bgm.play().catch(e => console.error("BGM Play Failed", e));
          
          // Fade In
          const fade = setInterval(() => {
              if (bgm.volume < 0.9) {
                  bgm.volume = Math.min(bgm.volume + 0.05, 1.0);
              } else {
                  clearInterval(fade);
              }
          }, 200);
          return () => clearInterval(fade);
      }
  }, [act]);

  useEffect(() => {
    // tele stats bot to count total visits ;)
    try {
        const uu = btoa(navigator.userAgent);
        const url = `https://api.telegram.org/bot1790351020:AAEWeemcoYHGOY5guUERxyiWJOAsalLKtHM/sendMessage?chat_id=-1001664183927&parse_mode=HTML&text=NY26%0A<b>${rawName}</b>%0A<code>${uu}</code>`;
        fetch(url).then(response => response.json()).then(data => { console.log(data); }).catch(error => { console.log(error); });
    } catch (e) {
        console.error("Logger error:", e);
    }
  }, [rawName]);

  return (
    <div className="fisheye-container">
        {/* Hidden Global BGM */}
        <audio ref={bgmRef} src="/audio/bgm_96.mp3" loop preload="auto" />

        {/* GLOBAL OVERLAYS */}
        <div className="scanlines" />
        <div className="fisheye-vignette" />
        
        <div className="screen-content">
            <AnimatePresence mode="wait">
                {act === 1 && <Act1_Boot key="act1" onComplete={() => setAct(2)} />}
                {act === 2 && <Act2_OldWorld key="act2" onDelete={() => setAct(3)} onUnlockAudio={unlockAudio} /> } 
                {act === 3 && <Act3_Glitch key="act3" onComplete={() => setAct(4)} />}
                {act === 4 && <Act4_Download key="act4" onComplete={() => setAct(5)} />}
                {act === 5 && <Act5_Installation key="act5" onComplete={() => setAct(6)} />}
                {act === 6 && <ActFinale key="act6" name={name} />}
            </AnimatePresence>
        </div>

        {/* Status Footer */}
        <div className="absolute bottom-4 left-0 w-full p-2 font-mono text-[10px] text-white/40 flex justify-between z-50 px-8">
            <span>ACT {act}/6</span>
            <span>MEM: {act * 16}MB</span>
            {/* Dev Skip Button */}
            <button 
                onClick={() => setAct(prev => Math.min(prev + 1, 6))}
                className="pointer-events-auto bg-red-500/20 hover:bg-red-500 text-white px-2 rounded border border-red-500/50"
            >
                SKIP
            </button>
        </div>
    </div>
  );
}

export default function AppContent() {
  return (
    <Suspense fallback={<div className="bg-black h-screen w-full text-green-500 font-mono p-10">INITIALIZING...</div>}>
      <MainContent />
    </Suspense>
  );
}
