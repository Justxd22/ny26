"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Snow from "./Snow";
import FisheyeText from "./FisheyeText";
import ScanningLens from "./ScanningLens";
import SphereText from "./SphereText";
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
const Act2_OldWorld = ({ onDelete }: { onDelete: () => void }) => {
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
      playSound('error');
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
        const timer = setTimeout(() => {
            onComplete();
        }, 4000);
        return () => clearTimeout(timer);
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

// --- ACT V: THE INSTALLATION (Popups) ---
const Act5_Installation = ({ onComplete }: { onComplete: () => void }) => {
    const [popups, setPopups] = useState<{id: number, text: string, x: number, y: number}[]>([]);
    const tasks = [
        "Installing happiness modules...", "Configuring success parameters...", 
        "Updating friendship drivers...", "Optimizing luck algorithms...",
        "Patching bad habits...", "Calibrating aura...", "Deleting cringe..."
    ];

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= tasks.length) {
                clearInterval(interval);
                setTimeout(onComplete, 2000);
                return;
            }
            const x = Math.random() * 40 - 20; 
            const y = Math.random() * 40 - 20;
            
            setPopups(prev => [...prev, { id: i, text: tasks[i], x, y }]);
            playSound('type');
            i++;
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full relative overflow-hidden flex items-center justify-center z-10">
            {/* Popups Grid */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {popups.map((popup) => (
                    <motion.div
                        key={popup.id}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="win98-window p-1 absolute w-64 shadow-xl"
                        style={{ transform: `translate(${popup.x}vw, ${popup.y}vh)` }}
                    >
                        <div className="win98-header">INSTALLER_WIZARD.EXE</div>
                        <div className="p-4 bg-white text-xs text-black font-sans">
                            <p className="mb-2 font-bold">{popup.text}</p>
                            <div className="w-full h-2 bg-gray-200 border inset">
                                <motion.div 
                                    initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.4 }}
                                    className="h-full bg-blue-700" 
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <div className="absolute bottom-10 font-pixel text-white animate-pulse text-center w-full chromatic-text">
                DO NOT TURN OFF YOUR REALITY...
            </div>
        </div>
    );
};

// --- ACT VI, VII, VIII: REVEAL & FINALE ---
const ActFinale = ({ name }: { name: string }) => {
    const [step, setStep] = useState("reveal"); // reveal -> search -> boom

    useEffect(() => {
        playSound('boot');
        // Timeline
        const t1 = setTimeout(() => setStep("search"), 4000); 
        const t2 = setTimeout(() => {
            setStep("boom");
            playSound('success');
        }, 7000);   

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

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
        <div className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden z-10">
            <Snow /> 
            
            {step === "reveal" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center z-10">
                    <h1 className="font-pixel text-6xl md:text-9xl text-white chromatic-text mb-4">
                        2026
                    </h1>
                    <p className="font-mono text-cyber-blue mt-4 tracking-[0.5em] animate-pulse">TIMELINE REBOOTED</p>
                </motion.div>
            )}

            {step === "search" && (
                <motion.div className="z-10 font-mono text-cyber-green text-center space-y-4 bg-black/80 p-8 border border-cyber-green/50">
                    <div className="animate-spin text-4xl">⟳</div>
                    <p>{"> SEARCHING DATABASE..."}</p>
                    <p>{"> DETECTING AWESOME HUMAN..."}</p>
                    <p>{`> MATCH FOUND: ${name}`}</p>
                </motion.div>
            )}

            {step === "boom" && (
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="z-20 text-center relative px-4"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-pink via-cyber-blue to-cyber-green blur-[100px] opacity-20" />
                    
                    <h2 className="font-pixel text-xl md:text-3xl text-white mb-4 animate-bounce">HAPPY NEW YEAR</h2>
                    <h1 className="font-black text-5xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-white via-cyber-blue to-cyber-pink drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] uppercase">
                        {name}
                    </h1>
                    
                    <div className="mt-12 space-y-2 font-mono text-xs md:text-sm text-cyber-yellow bg-black/50 p-4 inline-block backdrop-blur-sm border border-white/10">
                        <p>{"> VIBES: IMMACULATE"}</p>
                        <p>{"> FRIENDSHIP.EXE: RUNNING"}</p>
                        <p>{"> LUCK: MAXIMIZED"}</p>
                        <p>{"> 2026: LEGENDARY MODE"}</p>
                    </div>

                    <div className="mt-16">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 border border-white/40 hover:bg-white/10 text-white font-pixel text-xs transition-colors cursor-pointer"
                        >
                            PRESS START TO REPLAY
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};


// --- ORCHESTRATOR ---
function MainContent() {
  const searchParams = useSearchParams();
  const rawName = searchParams.get("name") || "FRIEND";
  const name = rawName.toUpperCase();
  const [act, setAct] = useState(1);

  return (
    <div className="fisheye-container">
        {/* GLOBAL OVERLAYS */}
        <div className="scanlines" />
        <div className="fisheye-vignette" />
        
        <div className="screen-content">
            <AnimatePresence mode="wait">
                {act === 1 && <Act1_Boot key="act1" onComplete={() => setAct(2)} />}
                {act === 2 && <Act2_OldWorld key="act2" onDelete={() => setAct(3)} /> } 
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
