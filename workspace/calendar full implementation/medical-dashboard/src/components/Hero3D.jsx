import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';

// If WebGL is unavailable (or the remote HDR environment fails to load), the
// 3D canvas must degrade to a static card instead of crashing the dashboard.
class CanvasErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // Swallow WebGL errors; the fallback card below keeps the page usable.
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-red-500/10 to-blue-500/10">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
            3D preview unavailable on this device
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const HeartModel = () => {
  const mesh = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Pulsing logic
    const pulse = 1 + Math.sin(time * 4) * 0.05; // 4 rad/s ~ 80 bpm sync
    mesh.current.scale.set(pulse, pulse, pulse);
    mesh.current.rotation.y += 0.005;
  });

  return (
    <group>
      {/* Main stylized heart shape using a distorted sphere */}
      <Sphere ref={mesh} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#ef4444"
          speed={3}
          distort={0.4}
          radius={1}
          roughness={0.2}
          metalness={0.8}
          emissive="#7f1d1d"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Sub-elements for detail */}
      <Sphere args={[0.4, 32, 32]} position={[0.5, 0.8, 0.2]}>
        <meshStandardMaterial color="#b91c1c" roughness={0.1} />
      </Sphere>
      <Sphere args={[0.3, 32, 32]} position={[-0.3, 0.9, -0.1]}>
        <meshStandardMaterial color="#dc2626" roughness={0.1} />
      </Sphere>
    </group>
  );
};

const ECGLine = () => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center opacity-40">
      <svg width="100%" height="200" viewBox="0 0 1000 200" className="w-full">
        <motion.path
          d="M0,100 L100,100 L120,80 L140,120 L160,20 L180,180 L200,100 L300,100 L320,80 L340,120 L360,20 L380,180 L400,100 L500,100 L520,80 L540,120 L560,20 L580,180 L600,100 L700,100 L720,80 L740,120 L760,20 L780,180 L800,100 L900,100 L920,80 L940,120 L960,20 L980,180 L1000,100"
          fill="transparent"
          stroke="#EF4444"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0, 1, 0],
            x: [0, -1000]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </svg>
    </div>
  );
};

const Hero3D = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative h-[450px] w-full rounded-3xl overflow-hidden glass glass-light dark:glass-dark group"
    >
      <div className="absolute top-6 left-8 z-20">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Cardiac Dynamics
        </h2>
        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Real-time myocardial simulation</p>
      </div>

      <ECGLine />

      <CanvasErrorBoundary>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />

          {/* Environment fetches a remote HDR and suspends; without Suspense the
              whole dashboard would hang on a blank screen. */}
          <Suspense fallback={null}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <HeartModel />
            </Float>

            <Environment preset="city" />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </CanvasErrorBoundary>

      <div className="absolute bottom-6 right-8 z-20 flex gap-4">
        <div className="glass glass-light dark:glass-dark px-4 py-2 rounded-xl text-xs font-medium">
          <span className="text-textSecondary-light dark:text-textSecondary-dark mr-2">BPM:</span>
          <span className="text-accent-red font-bold">120</span>
        </div>
        <div className="glass glass-light dark:glass-dark px-4 py-2 rounded-xl text-xs font-medium">
          <span className="text-textSecondary-light dark:text-textSecondary-dark mr-2">STRESS:</span>
          <span className="text-accent-cyan font-bold">NORMAL</span>
        </div>
      </div>
    </motion.section>
  );
};

export default Hero3D;
