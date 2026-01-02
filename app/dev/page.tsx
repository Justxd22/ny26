"use client";

import React, { useState } from 'react';
import FisheyeText from '@/components/FisheyeText';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevPlayground() {
  const [text, setText] = useState("DELETING\nMEMORIES");
  const [intensity, setIntensity] = useState(2.5);
  const [fontSize, setFontSize] = useState(180);
  const [color, setColor] = useState("#ef4444");
  const [showAnimation, setShowAnimation] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  const triggerAnim = () => setAnimKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* PREVIEW AREA */}
        <div className="flex-1 border-2 border-white/20 relative min-h-[500px] flex items-center justify-center overflow-hidden bg-[#050505]">
          <div className="absolute top-4 left-4 text-[10px] text-white/40">PREVIEW_WINDOW</div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              initial={{ scale: 0.2, opacity: 0, rotate: -15, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
              exit={{ scale: 3, opacity: 0, rotate: 10, filter: "blur(20px)" }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full flex justify-center"
            >
              <FisheyeText 
                text={text}
                intensity={intensity}
                fontSize={fontSize}
                color={color}
                className="w-full"
              />
            </motion.div>
          </AnimatePresence>

          <button 
            onClick={triggerAnim}
            className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs border border-white/20"
          >
            RE-TRIGGER ANIMATION
          </button>
        </div>

        {/* CONTROLS AREA */}
        <div className="w-full md:w-80 space-y-6 bg-white/5 p-6 border border-white/10">
          <h1 className="font-pixel text-xl text-cyber-green mb-4 underline">TUNER_v1.0</h1>
          
          <div className="space-y-2">
            <label className="text-xs uppercase text-white/60">Text (use \n for newline)</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-black border border-white/20 p-2 text-sm text-cyber-blue focus:border-cyber-blue outline-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="uppercase text-white/60">Intensity</label>
              <span>{intensity.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="1" max="5" step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full accent-cyber-green"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="uppercase text-white/60">Font Size</label>
              <span>{fontSize}px</span>
            </div>
            <input 
              type="range" min="20" max="400" step="5"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-cyber-blue"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase text-white/60">Color</label>
            <div className="flex gap-2 flex-wrap">
              {["#ef4444", "#00FF94", "#00FFFF", "#FF00FF", "#FFD600", "#FFFFFF"].map(c => (
                <button 
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[10px] text-white/30">
            <p>1. Adjust sliders to find the look.</p>
            <p>2. Copy the values.</p>
            <p>3. Update components/AppContent.tsx</p>
          </div>
        </div>

      </div>
    </div>
  );
}
