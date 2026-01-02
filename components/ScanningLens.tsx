"use client";

import React, { useEffect, useRef } from 'react';

interface ScanningLensProps {
  text?: string;
  intensity?: number;
  fontSize?: number;
  color?: string;
  className?: string;
  isScanning?: boolean;
}

const ScanningLens = ({
  text = "DELETE\n2025?",
  intensity = 2.5,
  fontSize = 120,
  color = '#00ff88',
  className = "",
  isScanning = true
}: ScanningLensProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Lens state
  const lensState = useRef({
    x: 0,
    y: 0,
    lastTime: 0,
  });

  const renderScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear with transparency
    ctx.clearRect(0, 0, width, height);

    // Draw Overlay Text
    const lines = text.split('\n');
    const overlayLines = lines.length > 1 ? lines : text.split('\n');
    const overlayFontSize = fontSize;
    
    ctx.font = `bold ${overlayFontSize}px "Silkscreen", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const overlayLineHeight = overlayFontSize * 1.1;
    const totalOverlayHeight = overlayLines.length * overlayLineHeight;
    const startY = (height / 2) - (totalOverlayHeight / 2) + (overlayLineHeight / 2);

    overlayLines.forEach((line, index) => {
        const y = startY + (index * overlayLineHeight);
        
        // Add Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillText(line, width / 2, y);
        
        // Solid pass
        ctx.shadowBlur = 0;
        ctx.fillText(line, width / 2, y);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!sceneCanvasRef.current) {
        sceneCanvasRef.current = document.createElement('canvas');
    }
    const sceneCanvas = sceneCanvasRef.current;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sceneCtx = sceneCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || !sceneCtx) return;

    const resize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        sceneCanvas.width = rect.width;
        sceneCanvas.height = rect.height;
        
        lensState.current.x = rect.width / 2;
        lensState.current.y = rect.height / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (timestamp: number) => {
        if (!lensState.current.lastTime) lensState.current.lastTime = timestamp;
        
        const width = canvas.width;
        const height = canvas.height;

        // Clear main canvas for transparency
        ctx.clearRect(0, 0, width, height);

        // Update Lens Position
        if (isScanning) {
            const time = timestamp / 1000;
            // Scan across the text area mainly
            lensState.current.x = (width / 2) + Math.sin(time * 2.0) * (width * 0.3);
            lensState.current.y = (height / 2) + Math.cos(time * 1.5) * (height * 0.15);
        }

        // Render Text to Scene Buffer
        renderScene(sceneCtx, width, height);

        // Apply Fisheye
        const imageData = sceneCtx.getImageData(0, 0, width, height);
        const outputData = ctx.createImageData(width, height);
        const data = imageData.data;
        const out = outputData.data;
        
        const lensX = lensState.current.x;
        const lensY = lensState.current.y;
        const lensRadius = 250; // Radius of effect

        for (let y = 0; y < height; y++) {
            // Optimization: Skip rows far from lens if we want, but simple loop is robust
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // If pixel is empty in source, skip math?
                // No, because distortion might pull a non-empty pixel INTO an empty space.
                // However, we are writing TO output. 
                // We map OUTPUT(x,y) -> SOURCE(srcX, srcY).
                
                const dx = x - lensX;
                const dy = y - lensY;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < lensRadius * lensRadius) {
                    const dist = Math.sqrt(distSq);
                    const normDist = dist / lensRadius;
                    // Ease out distortion
                    const distort = Math.pow(normDist, intensity) * lensRadius;
                    
                    const angle = Math.atan2(dy, dx);
                    const srcX = Math.round(lensX + Math.cos(angle) * distort);
                    const srcY = Math.round(lensY + Math.sin(angle) * distort);
                    
                    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                        const srcIdx = (srcY * width + srcX) * 4;
                        out[idx] = data[srcIdx];
                        out[idx+1] = data[srcIdx+1];
                        out[idx+2] = data[srcIdx+2];
                        out[idx+3] = data[srcIdx+3];
                    } 
                } else {
                    // Copy original
                    out[idx] = data[idx];
                    out[idx+1] = data[idx+1];
                    out[idx+2] = data[idx+2];
                    out[idx+3] = data[idx+3];
                }
            }
        }
        
        ctx.putImageData(outputData, 0, 0);
        
        // Optional: Debug Lens position
        // ctx.fillStyle = 'red';
        // ctx.fillRect(lensX, lensY, 5, 5);

        animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [text, intensity, fontSize, color, isScanning]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full block absolute inset-0 pointer-events-none ${className}`}
    />
  );
};

export default ScanningLens;