import React, { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Environment, Sparkles, Float, Grid, OrbitControls, useHelper } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useControls, button } from "leva";

const Metal2026 = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Center>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text3D
          ref={meshRef}
          font="/font/helvetiker_bold.typeface.json"
          size={5}
          height={1.5}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.15}
          bevelSize={0.1}
          bevelOffset={0}
          bevelSegments={5}
        >
          2026
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={1.0}
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.5}
            reflectivity={1.0}
          />
        </Text3D>
      </Float>
    </Center>
  );
};

const InfiniteGrid = () => {
    return (
        <group position={[0, -3, 0]}>
             {/* Main Grid */}
             <Grid
                renderOrder={-1}
                position={[0, 0, 0]}
                infiniteGrid
                cellSize={1}
                cellThickness={0.6}
                sectionSize={5}
                sectionThickness={1.5}
                cellColor="#00ffff"
                sectionColor="#ff00ff"
                fadeDistance={50}
                fadeStrength={1}
            />
            {/* Floor Glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial color="#000020" transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

const SceneContent = ({ rotateSpeed, fov, camPos }: { rotateSpeed: number, fov: number, camPos: [number, number, number] }) => {
    const { camera } = useThree();
    
    // Update FOV dynamically
    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        }
    }, [fov, camera]);

    // Update Camera Position dynamically (only when Leva values change)
    useEffect(() => {
        camera.position.set(...camPos);
    }, [camPos, camera]);

    const { light1Intensity, light1Pos, light2Intensity, light2Pos, envIntensity, showHelpers } = useControls("Lights", {
        light1Intensity: { value: 20, min: 0, max: 20, step: 0.1 },
        light1Pos: { value: [-16, 5, 15], step: 1 },
        light2Intensity: { value: 20, min: 0, max: 20, step: 0.1 },
        light2Pos: { value: [-3, 0, 16], step: 1 },
        envIntensity: { value: 0.4, min: 0, max: 5, step: 0.1 },
        showHelpers: true
    });

    // Camera Logger
    useControls("Camera Debug", {
        "Log Position": button(() => {
            console.log("Current Camera Position:", [
                Number(camera.position.x.toFixed(2)), 
                Number(camera.position.y.toFixed(2)), 
                Number(camera.position.z.toFixed(2))
            ]);
            console.log("Current FOV:", camera.fov);
        })
    });

    const light1Ref = useRef<THREE.PointLight>(null);
    const light2Ref = useRef<THREE.PointLight>(null);

    useHelper(showHelpers && light1Ref, THREE.PointLightHelper, 1, "cyan");
    useHelper(showHelpers && light2Ref, THREE.PointLightHelper, 1, "magenta");

    return (
        <>
            <Metal2026 />
            <InfiniteGrid />
            
            <OrbitControls autoRotate autoRotateSpeed={rotateSpeed} enableZoom={true} enablePan={false} />

            {/* Particles */}
            <Sparkles count={150} scale={20} size={6} speed={0.4} opacity={0.6} color="#ffd700" />
            <Sparkles count={100} scale={15} size={4} speed={0.8} opacity={0.4} color="#ffffff" />

            {/* Premium Lighting / Reflections */}
            <Environment preset="studio" environmentIntensity={envIntensity} />
            <ambientLight intensity={0.2} />
            
            {/* Point Lights with Refs */}
            <pointLight ref={light1Ref} position={light1Pos} intensity={light1Intensity} color="#00ffff" />
            <pointLight ref={light2Ref} position={light2Pos} intensity={light2Intensity} color="#ff00ff" />

            {/* Post Processing */}
            <EffectComposer disableNormalPass multisampling={0}>
                <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
            </EffectComposer>
        </>
    );
};

export default function MetalText() {
  // Simple check for mobile to adjust default camera distance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const { camX, camY, camZ, fov, rotateSpeed } = useControls("Metal Scene", {
    camX: { value: 0, min: -50, max: 50, step: 0.5 },
    camY: { value: 10, min: -50, max: 50, step: 0.5 },
    camZ: { value: isMobile ? 35 : 20, min: 10, max: 100, step: 1 },
    fov: { value: 45, min: 20, max: 100, step: 1 },
    rotateSpeed: { value: 5, min: 0, max: 5, step: 0.1 }
  });

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas
        camera={{ position: [camX, camY, camZ], fov: 45 }} // Initial FOV
        gl={{ alpha: false, antialias: false, powerPreference: "default", stencil: false, depth: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#050505']} />
        <Suspense fallback={null}>
            <SceneContent rotateSpeed={rotateSpeed} fov={fov} camPos={[camX, camY, camZ]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
