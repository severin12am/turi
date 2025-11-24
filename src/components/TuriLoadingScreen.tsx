import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface TuriLoadingScreenProps {
  onLoadingComplete: () => void;
  minimumLoadTime?: number; // Minimum time to show loading screen (ms)
}

// Turi's 3D Model Component for Loading Screen
const TuriModel: React.FC<{ isMovingAway: boolean }> = ({ isMovingAway }) => {
  const { scene } = useGLTF('/models/helper-robot.glb');
  const modelRef = React.useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (modelRef.current) {
      // Position and scale Turi appropriately
      modelRef.current.rotation.y = Math.PI * 1.55;
      modelRef.current.position.set(0, -0.5, 0);
    }
  }, []);
  
  // Animate Turi moving to the side when loading completes
  useEffect(() => {
    if (isMovingAway && modelRef.current) {
      const startTime = Date.now();
      const duration = 800; // 800ms animation
      const startX = 0;
      const endX = -5; // Move to the left
      
      const animate = () => {
        if (!modelRef.current) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic function for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        
        modelRef.current.position.x = startX + (endX - startX) * eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [isMovingAway]);
  
  return (
    <group ref={modelRef} scale={[1.5, 1.5, 1.5]}>
      <primitive object={scene.clone()} />
    </group>
  );
};

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = ({ 
  onLoadingComplete,
  minimumLoadTime = 2000 
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [isMovingAway, setIsMovingAway] = useState(false);

  useEffect(() => {
    // Minimum load time + fade out
    const timer = setTimeout(() => {
      setIsMovingAway(true); // Start moving Turi away
      setTimeout(() => {
        setFadeOut(true);
        // Wait for fade animation to complete before calling onLoadingComplete
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }, 300); // Small delay before starting fade
    }, minimumLoadTime);

    return () => {
      clearTimeout(timer);
    };
  }, [onLoadingComplete, minimumLoadTime]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center w-full">
        {/* Turi's 3D Model */}
        <div className="w-96 h-96 mb-4">
          <Canvas
            camera={{ position: [0, 0, 4], fov: 45 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            {/* Brighter lighting to make Turi visible */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <directionalLight position={[-5, 5, 5]} intensity={1} />
            <pointLight position={[0, 5, 3]} intensity={1.2} color="#a78bfa" />
            <pointLight position={[0, -2, 2]} intensity={0.5} color="#818cf8" />
            <React.Suspense fallback={null}>
              <TuriModel isMovingAway={isMovingAway} />
            </React.Suspense>
          </Canvas>
        </div>

        {/* Loading text - centered */}
        <div className="text-center space-y-6">
          <p className="text-indigo-200 text-xl font-medium">
            Preparing your language learning journey...
          </p>

          {/* Loading bar */}
          <div className="w-80 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-loading-bar"></div>
          </div>
        </div>
      </div>

      {/* Add custom animation for loading bar */}
      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 0%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Preload the model to ensure it appears quickly
useGLTF.preload('/models/helper-robot.glb');

export default TuriLoadingScreen;

