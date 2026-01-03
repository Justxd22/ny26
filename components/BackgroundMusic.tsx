"use client";

import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Start Music Immediately on Mount
    audio.volume = 0;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Audio play failed (autoplay restriction):", error);
        });
    }

    // Smooth fade to max volume
    const fadeToMax = setInterval(() => {
        if (audio.volume < 0.9) {
            audio.volume = Math.min(audio.volume + 0.05, 1.0);
        } else {
            clearInterval(fadeToMax);
        }
    }, 200);

    return () => clearInterval(fadeToMax);
  }, []);

  return (
    <audio 
      ref={audioRef} 
      src="/audio/bgm_96.mp3" 
      loop 
      preload="auto"
    />
  );
}
