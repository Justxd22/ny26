"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import { EffectComposer, ChromaticAberration } from "@react-three/postprocessing";
import { useControls, Leva } from "leva"; // Import the GUI hook and component
import * as THREE from "three";
import { Lens } from "./LensEffect";

const gridData = [
  { id: "1A", word: "Deletin",   col: -1, row: -1 },
  { id: "2A", word: "jet2holidy",     col:  0, row: -1 },
  { id: "3A", word: "chat?",    col:  1, row: -1 },
  { id: "1B", word: "Labubu",   col: -1, row:  1 },
  { id: "2B", word: "67",   col:  0, row:  1 },
  { id: "3B", word: "Aura", col:  1, row:  1 },
];

const sequence = ["1A", "2A", "2B", "3A", "1B", "3B"];
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// --- WORD COMPONENT ---
const Word = ({ item, isTarget, config }: { item: any, isTarget: boolean, config: any }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const vec = React.useMemo(() => new THREE.Vector3(), []);
  // Use values from Leva controls
  const phi = degToRad(item.col * config.angleStepX);
  const theta = degToRad(item.row * config.angleStepY * -1); 
  
  const x = config.radius * Math.sin(phi) * Math.cos(theta);
  const y = config.radius * Math.sin(theta);
  const z = config.radius * Math.cos(phi) * Math.cos(theta);

  // Dynamic Font Sizing
  const fontSize = item.word.length > 4 ? config.fontSmall : config.fontBig;

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.rotateY(Math.PI);
    }
  }, [config.radius, config.angleStepX, config.angleStepY]); // Re-orient if config changes


    useFrame(() => {

    if (meshRef.current) {

      // 1. Get real-world position

      meshRef.current.getWorldPosition(vec);



      // 2. Calculate Opacity

      // If Z is positive (front), we want full opacity.

      // If Z is negative (back), we fade it out.

      // smoothstep(min, max, value) returns 0 at min and 1 at max.

      

      // logic: "As Z goes from -2 (back) to 0.5 (front), opacity goes from 0.3 to 1"

      const targetOpacity = THREE.MathUtils.smoothstep(vec.z, -2.0, 0.5);

      

      // Clamp the lowest opacity to 0.2 so it's never fully invisible (per your request)

      // 0.2 = faint ghost, 1.0 = solid

      const finalOpacity = Math.max(targetOpacity, 0.1); 



      // 3. Apply to material

      // We cast to 'any' because R3F Text material types can be tricky

      (meshRef.current.material as any).opacity = finalOpacity;

    }

  });

  return (
    <Text
      ref={meshRef}
      position={[x, y, z]}
      fontSize={fontSize}
      curveRadius={-config.radius}
      font="/font/Incised 901 Nord.ttf"
      anchorX="center" 
      anchorY="middle"
    //   outlineWidth={0.02}
    //   outlineColor={isTarget ? "#00ff88" : "transparent"}
      color={isTarget ? "#ff2323" : "#fff"} 
      fillOpacity={1}
    >
      {item.word}
    </Text>
  );
};

// --- SCENE CONTENT ---
const SceneContent = ({ onComplete, onReady }: { onComplete: () => void, onReady?: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { size } = useThree();
  const isMobile = size.width < 768;
  
  // Use a ref for onComplete to avoid resetting the interval when the parent re-renders
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Use a ref for onReady to ensure we only call it once
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);


  // --- LEVA CONTROLS ---
  // These create the sliders on your screen
  const config = useControls("Sphere Settings", {
    radius: { value: isMobile? 2 : 3, min: 2, max: 10, step: 0.1 },
    angleStepX: { value: isMobile? 90 : 90, min: 10, max: 90, step: 1, label: "H Spacing" },
    angleStepY: { value: 15, min: 10, max: 90, step: 1, label: "V Spacing" },
    fontBig: { value: isMobile? 0.7 : 1.1, min: 0.5, max: 3, step: 0.1 },
    fontSmall: { value: isMobile? 0.4: 0.5, min: 0.1, max: 3, step: 0.1 },
    camZ: { value: 6.5, min: 2, max: 15, step: 0.5, label: "Camera Dist" },
  });

  const lensConfig = useControls("Lens Effect", {
    intensity: { value: 2, min: 0.5, max: 5, step: 0.1 },
    radius: { value: isMobile? 0.25 : 0.65, min: 0.1, max: 1.5, step: 0.05 },
  });

  useEffect(() => {
    // Signal readiness
    if (onReadyRef.current) {
        onReadyRef.current();
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= sequence.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
                if (onCompleteRef.current) onCompleteRef.current();
            }, 1000); // Wait a bit after last word
            return prev;
        }
        return prev + 1;
      });
    }, 1500); // Slightly faster interval
    return () => clearInterval(interval);
  }, []); // Removed onComplete from dependencies

  const targetId = sequence[currentIndex];
  const targetObj = gridData.find((item) => item.id === targetId);

  let rotX = 0;
  let rotY = 0;
  if (targetObj) {
    rotX = -degToRad(targetObj.row * config.angleStepY);
    rotY = -degToRad(targetObj.col * config.angleStepX); 
  }

  return (
    <>
      <Leva hidden />
      <motion.group
        animate={{ rotateX: rotX, rotateY: rotY, z: -config.camZ + 6 }}
        transition={{ duration: 1.2, type: "spring", stiffness: 35, damping: 15 }}
      >
        {gridData.map((item) => (
          <Word 
            key={item.id} 
            item={item} 
            isTarget={item.id === targetId} 
            config={config} 
          />
        ))}
      </motion.group>

      <EffectComposer disableNormalPass multisampling={0}>


        {/* 2. Chromatic Aberration: Simulates speed/lens distortion */}
        <ChromaticAberration 
          // offset controls the blur distance. 
          // values like [0.002, 0.002] are subtle; [0.01, 0.01] are heavy
          offset={new THREE.Vector2(isMobile? 0.004 : 0.002, isMobile? 0.004 : 0.002)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Lens intensity={lensConfig.intensity} radius={lensConfig.radius} />
      </EffectComposer>
    </>
  );
};

export default function SphereText({ onComplete, onReady }: { onComplete: () => void, onReady?: () => void }) {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 80 }}
        gl={{ alpha: true, antialias: false, powerPreference: "default", stencil: false, depth: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
            <SceneContent onComplete={onComplete} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}