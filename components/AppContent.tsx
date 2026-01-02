"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Snow from "./Snow";
import FisheyeText from "./FisheyeText";
import ScanningLens from "./ScanningLens";
import { playSound } from "@/utils/audio";

// --- BACKGROUND WALL COMPONENT ---
const BackgroundWall = ({ onIntroComplete }: { onComplete?: () => void, onIntroComplete?: () => void }) => {
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
        // Total pixels to scroll during the animation. 
        // Making it a multiple of lineHeight ensures alignment if we were linear, 
        // but since we settle to 0 offset, it naturally aligns.
        const TOTAL_SCROLL_DIST = 5000; 

        // Easing function: easeOutQuint for fast start, smooth stop
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

            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            const fontSize = Math.min(width, height) * 0.27; 
            ctx.font = `bold ${fontSize}px "Incised 901 Nord"`;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#3f6958ff'; 
            
            const lineHeight = fontSize * 0.8;
            const totalLines = Math.ceil(height / lineHeight) + 4; 
            
            const scrollPos = TOTAL_SCROLL_DIST * (1 - easeOutQuint(progress));
            let offsetLeft = scrollPos;
            let offsetRight = -scrollPos;

            if (progress >= 1 && !isSettledRef.current) {
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
                ctx.fillText("25", centerX + gap, drawYRight);
            }

            // Center Line Divider
            ctx.strokeStyle = '#3f695833'; // Make divider very subtle
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
    
    const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return prev + 1;
        });
    }, 40);

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
    }, 1200); 
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center z-10 bg-black">
      
      {/* 1. BACKGROUND WALL (Animated Intro -> Static) */}
      <BackgroundWall onIntroComplete={() => setIntroFinished(true)} />

      {/* 2. SCANNING LENS (Distorted Foreground) - Only show after intro */}
      <AnimatePresence>
        {introFinished && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10"
            >
                <ScanningLens 
                    text={isDeleting ? steps[stepIndex] : "DELETE\n2025?"}
                    color={isDeleting ? "#ef4444" : "#00ff88"}
                    isScanning={true}
                    fontSize={100} 
                    intensity={2.5}
                />
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

// --- ACT IV: THE HYPERSPEED DOWNLOAD ---
const Act4_Download = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [currentDownload, setCurrentDownload] = useState("INITIALIZING...");
    
    const downloads = [
        "NEW_MEMORIES.EXE", "BETTER_DECISIONS.DLL", "UNLIMITED_COFFEE.JAR", 
        "NO_MORE_MONDAYS.SYS", "GOOD_VIBES_ONLY.ZIP", "FINANCIAL_STABILITY.APK",
        "GYM_MOTIVATION.BAT", "CLEAR_SKIN.PATCH", "LUCK_V2.0.PKG"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    playSound('success');
                    setTimeout(onComplete, 1000);
                    return 100;
                }
                
                if (Math.random() > 0.7) {
                    setCurrentDownload(downloads[Math.floor(Math.random() * downloads.length)]);
                    playSound('type');
                }
                
                return Math.min(p + 1.5, 100);
            });
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-transparent text-white font-mono overflow-hidden relative z-10">
            {/* Hyperspeed Tunnel Effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentDownload}
                        initial={{ scale: 0, opacity: 0, z: -500 }}
                        animate={{ scale: 1, opacity: 1, z: 0 }}
                        exit={{ scale: 3, opacity: 0, z: 200 }}
                        transition={{ duration: 0.5, ease: "easeIn" }}
                        className="absolute w-full flex justify-center"
                    >
                        <FisheyeText 
                            text={currentDownload} 
                            color="#00FFFF" 
                            intensity={3.0} 
                            fontSize={100}
                            rotation={Math.sin(Date.now() / 1000) * 10} 
                            className="w-[120%] h-auto"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Central Progress */}
            <div className="z-20 flex flex-col items-center bg-black/90 p-8 border-4 border-cyber-green shadow-[0_0_50px_rgba(0,255,148,0.5)]">
                <div className="font-pixel text-2xl md:text-4xl text-cyber-green mb-8 animate-pulse text-center">
                    INSTALLING 2026...
                </div>
                <div className="w-72 md:w-96 h-10 border-4 border-cyber-green p-1">
                    <div className="h-full bg-cyber-green shadow-[0_0_20px_#00FF94]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 font-mono text-cyber-green text-xl text-center">
                    {progress}% COMPLETE
                </div>
            </div>
            
            {/* Background Stream Lines to simulate speed */}
             <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white animate-ping" />
                <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white animate-ping" />
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
                {act === 2 && <Act2_OldWorld key="act2" onDelete={() => setAct(4)} /> } 
                {act === 4 && <Act4_Download key="act4" onComplete={() => setAct(5)} />}
                {act === 5 && <Act5_Installation key="act5" onComplete={() => setAct(6)} />}
                {act === 6 && <ActFinale key="act6" name={name} />}
            </AnimatePresence>
        </div>

        {/* Status Footer */}
        <div className="absolute bottom-4 left-0 w-full p-2 font-mono text-[10px] text-white/40 flex justify-between z-50 px-8">
            <span>ACT {act}/6</span>
            <span>MEM: {act * 16}MB</span>
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
