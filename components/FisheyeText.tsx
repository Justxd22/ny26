"use client";

import React, { useEffect, useRef } from 'react';

interface FisheyeTextProps {
  text: string;
  intensity?: number; // 1.0 to 4.0
  fontSize?: number;
  color?: string;
  className?: string;
  rotation?: number;
}

const FisheyeText = ({ 
  text, 
  intensity = 2.5, 
  fontSize = 120, 
  color = '#00ff88', 
  className = "",
  rotation = 0
}: FisheyeTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Canvas dimensions
    const width = 1000; // Wider canvas to prevent clipping
    const height = 800; // Taller for multi-line
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `100%`;
    canvas.style.height = `auto`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create text on temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.clearRect(0, 0, width, height);
    tempCtx.fillStyle = color;
    // Use the Silkscreen font we loaded globally, or fallback
    tempCtx.font = `bold ${fontSize}px, monospace`; 
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';

    // MULTI-LINE SUPPORT
    const lines = text.split('\\n'); // Handle escaped newlines if passed as string
    const actualLines = lines.length > 1 ? lines : text.split('\n');
    
    const lineHeight = fontSize * 1.1;
    const totalTextHeight = actualLines.length * lineHeight;
    const startY = (height / 2) - (totalTextHeight / 2) + (lineHeight / 2);

    actualLines.forEach((line, index) => {
      tempCtx.fillText(line.trim(), width / 2, startY + (index * lineHeight));
    });

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const outputData = ctx.createImageData(width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    const data = imageData.data;
    const outData = outputData.data;

    // Apply fisheye distortion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const angle = Math.atan2(dy, dx) + (rotation * Math.PI / 180);
        const normalizedDist = distance / maxRadius;
        
        // The core fisheye math: distort distance based on intensity
        const distortedDist = Math.pow(normalizedDist, intensity) * maxRadius;

        const srcX = Math.round(centerX + Math.cos(angle) * distortedDist);
        const srcY = Math.round(centerY + Math.sin(angle) * distortedDist);

        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIndex = (srcY * width + srcX) * 4;
          const destIndex = (y * width + x) * 4;

          outData[destIndex] = data[srcIndex];
          outData[destIndex + 1] = data[srcIndex + 1];
          outData[destIndex + 2] = data[srcIndex + 2];
          outData[destIndex + 3] = data[srcIndex + 3];
        }
      }
    }

    ctx.putImageData(outputData, 0, 0);

  }, [text, intensity, rotation, fontSize, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`pointer-events-none ${className}`}
    />
  );
};

export default FisheyeText;