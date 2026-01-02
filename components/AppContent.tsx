"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { Text, Float, Stars, PerspectiveCamera } from "@react-three/drei";
import confetti from "canvas-confetti";
import Snow from "./Snow";
import FisheyeText from "./FisheyeText";
import { playSound } from "@/utils/audio";

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
    
    // Progress Bar Logic
    const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return prev + 1;
        });
    }, 40);

    // Step Logic
    // Show each text for ~800ms
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
            playSound('type'); // Sound on text switch
            return prev + 1;
        });
    }, 1200); // Slower switch to let the user read
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center z-10">
      {/* 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Suspense fallback={null}>
            <Float speed={5} rotationIntensity={isDeleting ? 2 : 0.2} floatIntensity={0.5} floatingRange={[-0.5, 0.5]}>
                <Text
                    fontSize={isDeleting ? 3 : 5}
                    color={isDeleting ? "#ff0000" : "#d4aa00"} 
                    anchorX="center"
                    anchorY="middle"
                >
                    {isDeleting ? "CORRUPTED" : "2025"}
                    <meshStandardMaterial 
                        color={isDeleting ? "red" : "#c0c0c0"} 
                        emissive={isDeleting ? "red" : "black"}
                        emissiveIntensity={isDeleting ? 3 : 0}
                        wireframe={isDeleting}
                    />
                </Text>
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="z-10 flex flex-col items-center space-y-8 w-full">
        {!isDeleting && (
             <motion.button
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={handleDeleteClick}
             className="px-8 py-4 bg-red-600 text-white font-pixel border-4 border-red-800 hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] uppercase tracking-widest text-xl cursor-pointer chromatic-text"
           >
             [ DELETE 2025.OLD ]
           </motion.button>
        )}

        {isDeleting && (
            <div className="flex flex-col items-center justify-center space-y-8 w-full absolute inset-0 bg-black/90 z-50">
                <div className="flex-1 flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={stepIndex} // Key change triggers animation
                            initial={{ scale: 0.2, opacity: 0, rotate: -15, filter: "blur(10px)" }}
                            animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                            exit={{ scale: 3, opacity: 0, rotate: 10, filter: "blur(20px)" }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className="w-full flex justify-center"
                        >
                            <FisheyeText 
                                text={steps[stepIndex]} 
                                color="#ef4444" 
                                intensity={2.5} 
                                fontSize={180} 
                                className="w-full max-w-5xl"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                <div className="w-full max-w-2xl px-8 pb-20">
                    <div className="w-full h-12 border-4 border-red-500 p-2 bg-black shadow-[0_0_30px_rgba(255,0,0,0.4)]">
                        <div className="h-full bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)]" style={{ width: `${deleteProgress}%` }} />
                    </div>
                    <div className="font-pixel text-red-500 animate-pulse text-2xl text-center mt-4">
                        SYSTEM PURGE: {deleteProgress}%
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
                
                // Switch download text occasionally
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
            // Random positions for chaos
            const x = Math.random() * 40 - 20; // -20% to 20% center offset
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
                {act === 2 && <Act2_OldWorld key="act2" onDelete={() => setAct(4)} />}
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
