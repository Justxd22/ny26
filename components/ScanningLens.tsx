"use client";

import React, { useEffect, useRef, useState } from 'react';

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
  // Config from user
  const glowIntensity = 50;
  const animationSpeed = 1.0; // 1.0 = normal speed
  const lineSpacing = 1.2;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const animationStateRef = useRef({
    startTime: 0,
    currentLine: 0,
    phase: 'scan' // 'scan' or 'jump'
  });

  const [lensX, setLensX] = useState(400);
  const [lensY, setLensY] = useState(225);

  // Render the scene (background + text)
  const renderScene = (sceneCtx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear (Transparent)
    sceneCtx.clearRect(0, 0, width, height);

    // Calculate text positions for each line
    const lines = text.split('\n');
    const actualLines = lines.length > 1 ? lines : text.split('\n');

    const lineHeight = fontSize * lineSpacing;
    const totalHeight = lineHeight * actualLines.length;
    const startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2);

    // Draw text with multi-layer glow effect
    sceneCtx.font = `bold ${fontSize}px "Silkscreen", Arial, sans-serif`;
    sceneCtx.textAlign = 'center';
    sceneCtx.textBaseline = 'middle';

    actualLines.forEach((line, index) => {
      const y = startY + (index * lineHeight);

      // Outer glow layers (multiple passes for stronger glow)
      for (let i = 0; i < 3; i++) {
        sceneCtx.shadowColor = color;
        sceneCtx.shadowBlur = glowIntensity + (i * 10);
        sceneCtx.fillStyle = color;
        sceneCtx.globalAlpha = 0.3;
        sceneCtx.fillText(line.toLowerCase(), width / 2, y);
      }

      // Inner bright glow
      sceneCtx.shadowColor = color;
      sceneCtx.shadowBlur = glowIntensity / 2;
      sceneCtx.globalAlpha = 0.8;
      sceneCtx.fillStyle = color;
      sceneCtx.fillText(line.toLowerCase(), width / 2, y);

      // Main text (solid)
      sceneCtx.shadowBlur = 0;
      sceneCtx.globalAlpha = 1;
      sceneCtx.fillStyle = color;
      sceneCtx.fillText(line.toLowerCase(), width / 2, y);
    });

    sceneCtx.shadowColor = 'transparent';
    sceneCtx.shadowBlur = 0;
  };

  // Calculate text line positions and bounds
  const getLinePositions = (width: number, height: number) => {
    const lines = text.split('\n');
    const actualLines = lines.length > 1 ? lines : text.split('\n');

    const lineHeight = fontSize * lineSpacing;
    const totalHeight = lineHeight * actualLines.length;
    const startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];

    tempCtx.font = `bold ${fontSize}px "Silkscreen", Arial, sans-serif`;

    return actualLines.map((line, index) => {
      const y = startY + (index * lineHeight);
      const metrics = tempCtx.measureText(line.toLowerCase());
      const textWidth = metrics.width;
      const startX = (width / 2) - (textWidth / 2);
      const endX = (width / 2) + (textWidth / 2);

      return { startX, endX, y, text: line };
    });
  };

  // Apply fisheye lens effect with moving center
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
    };
    resize();
    window.addEventListener('resize', resize);

    // Render loop
    const render = () => {
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Render the scene first
        renderScene(sceneCtx, width, height);

        // Get scene image data
        const sceneData = sceneCtx.getImageData(0, 0, width, height);
        const outputData = ctx.createImageData(width, height);

        const centerX = lensX;
        const centerY = lensY;
        const lensRadius = 220; // Slightly bigger for mobile impact

        // Apply fisheye distortion
        // Optimization: Limit loop to lens area
        const startY = Math.max(0, Math.floor(centerY - lensRadius));
        const endY = Math.min(height, Math.ceil(centerY + lensRadius));
        const startX = Math.max(0, Math.floor(centerX - lensRadius));
        const endX = Math.min(width, Math.ceil(centerX + lensRadius));

        // Copy full scene first (background/non-distorted parts)
        outputData.data.set(sceneData.data);

        // Overwrite distorted area
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < lensRadius) {
                    const normalizedDist = distance / lensRadius;
                    const distortedDist = Math.pow(normalizedDist, intensity) * lensRadius;
                    const angle = Math.atan2(dy, dx);

                    const srcX = Math.round(centerX + Math.cos(angle) * distortedDist);
                    const srcY = Math.round(centerY + Math.sin(angle) * distortedDist);

                    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                        const srcIndex = (srcY * width + srcX) * 4;
                        const destIndex = (y * width + x) * 4;

                        outputData.data[destIndex] = sceneData.data[srcIndex];
                        outputData.data[destIndex + 1] = sceneData.data[srcIndex + 1];
                        outputData.data[destIndex + 2] = sceneData.data[srcIndex + 2];
                        outputData.data[destIndex + 3] = sceneData.data[srcIndex + 3];
                    }
                }
            }
        }

        ctx.putImageData(outputData, 0, 0);
    };

    render(); // Initial draw

    // Animation Loop
    if (isScanning) {
      const animate = () => {
        const width = canvas.width;
        const height = canvas.height;
        const linePositions = getLinePositions(width, height);

        if (linePositions.length === 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const now = Date.now();
        const state = animationStateRef.current;

        if (state.startTime === 0) {
          state.startTime = now;
        }

        const elapsed = (now - state.startTime) * animationSpeed / 1000; // seconds
        const currentLine = linePositions[state.currentLine % linePositions.length];

        if (state.phase === 'scan') {
          // Scan across the line
          const scanDuration = 2; // 2 seconds per line
          const progress = Math.min(elapsed / scanDuration, 1);

          // Ease in-out
          const eased = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const newX = currentLine.startX + (currentLine.endX - currentLine.startX) * eased;
          setLensX(newX);
          setLensY(currentLine.y);

          if (progress >= 1) {
            state.phase = 'jump';
            state.startTime = now;
          }
        } else if (state.phase === 'jump') {
          // Fast jump to next line
          const jumpDuration = 0.3; 
          const progress = Math.min(elapsed / jumpDuration, 1);

          const nextLineIndex = (state.currentLine + 1) % linePositions.length;
          const nextLine = linePositions[nextLineIndex];

          // Quick elastic easing
          const eased = progress < 0.5
            ? 8 * progress * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;

          const targetX = nextLine.startX;
          const targetY = nextLine.y;

          // Interpolate jump
          setLensX(currentLine.endX + (targetX - currentLine.endX) * eased);
          setLensY(currentLine.y + (targetY - currentLine.y) * eased);

          if (progress >= 1) {
            state.currentLine = nextLineIndex;
            state.phase = 'scan';
            state.startTime = now;
          }
        }

        render(); // Draw with new coords
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [text, intensity, lensX, lensY, fontSize, color, lineSpacing, animationSpeed, isScanning]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full block absolute inset-0 pointer-events-none ${className}`}
    />
  );
};

export default ScanningLens;