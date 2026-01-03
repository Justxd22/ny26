"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const CubeFace = ({ position, rotation, text, color }: any) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Glowing Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 2.2, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} wireframe />
      </mesh>
      
      {/* Glassy Surface */}
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshPhysicalMaterial 
            color="#000020" 
            roughness={0.1} 
            metalness={0.9} 
            transmission={0.5} 
            thickness={1}
            transparent
            opacity={0.8}
        />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={1}
        font="/font/Incised 901 Nord.ttf"
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const RotatingCube = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef}>
        <CubeFace position={[0, 0, 1.1]} rotation={[0, 0, 0]} text="2" color="#00ffff" />
        <CubeFace position={[0, 0, -1.1]} rotation={[0, Math.PI, 0]} text="6" color="#ff00ff" />
        <CubeFace position={[1.1, 0, 0]} rotation={[0, Math.PI / 2, 0]} text="0" color="#00ff00" />
        <CubeFace position={[-1.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]} text="2" color="#ffff00" />
        <CubeFace position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]} text="NY" color="#ffffff" />
        <CubeFace position={[0, -1.1, 0]} rotation={[Math.PI / 2, 0, 0]} text="26" color="#ffffff" />
    </group>
  );
};

const OrbitingParticles = () => {
    const count = 100;
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const mesh = useRef<THREE.InstancedMesh>(null);

    useFrame((state) => {
        if (!mesh.current) return;
        
        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color="#ffd700" toneMapped={false} />
        </instancedMesh>
    );
};

const SceneContent = () => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
            
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <RotatingCube />
            </Float>

            <OrbitingParticles />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={12} size={4} speed={0.4} opacity={0.5} color="#00ffff" />

            <EffectComposer disableNormalPass multisampling={0}>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            </EffectComposer>
        </>
    );
};


export default function InstallationCube() {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 100 }} 
        gl={{ 
            alpha: false, 
            antialias: true, // Re-enable for mobile quality
            powerPreference: "high-performance", // Try high-perf to force better GPU usage
            stencil: false, 
            depth: true,
            logarithmicDepthBuffer: true // Fix Z-fighting/Flickering
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
            <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
