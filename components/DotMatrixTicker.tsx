"use client";

import { motion } from "framer-motion";

interface DotMatrixTickerProps {
  text: string;
  className?: string;
  speed?: number;
}

export default function DotMatrixTicker({ text, className = "", speed = 10 }: DotMatrixTickerProps) {
  return (
    <div className={`overflow-hidden whitespace-nowrap border-y border-white/20 py-2 ${className}`}>
      <motion.div
        className="inline-block"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <span className="font-pixel text-4xl mx-4 text-cyber-green uppercase tracking-tighter">
          {text} • {text} • {text} • {text} • {text} • {text} • {text} • {text}
        </span>
        <span className="font-pixel text-4xl mx-4 text-cyber-green uppercase tracking-tighter">
          {text} • {text} • {text} • {text} • {text} • {text} • {text} • {text}
        </span>
      </motion.div>
    </div>
  );
}
