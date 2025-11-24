import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload the model immediately so it appears right away
useGLTF.preload('/models/helper-robot.glb');

interface TuriLoadingScreenProps {
  onLoadingComplete: () => void;
  minimumLoadTime?: number;
  shouldMoveAway?: boolean; // Control when Turi should move away
}

// Turi's 3D Model Component for Loading Screen
const TuriModel: React.FC<{ shouldMoveAway: boolean }> = ({ shouldMoveAway }) => {
  const { scene } = useGLTF('/models/helper-robot.glb');
  const modelRef = React.useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (modelRef.current) {
      // Position and scale Turi appropriately - match HelperRobot scaling
      modelRef.current.rotation.y = Math.PI * 1.55;
      modelRef.current.position.set(0, 0, 0);
      modelRef.current.scale.set(2, 2, 2); // Match HelperRobotModel scale
    }
  }, []);
  
  // Animate Turi moving to the side when shouldMoveAway is true
  useEffect(() => {
    if (shouldMoveAway && modelRef.current) {
      const startTime = Date.now();
      const duration = 1000; // 1 second smooth animation
      const startX = 0;
      const endX = -8; // Move further to the left
      
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
  }, [shouldMoveAway]);
  
  return (
    <group ref={modelRef}>
      <primitive object={scene.clone()} />
    </group>
  );
};

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = ({ 
  onLoadingComplete,
  minimumLoadTime = 2000,
  shouldMoveAway = false
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    // When shouldMoveAway is triggered, start the exit animation
    if (shouldMoveAway) {
      // Wait for Turi to move, then fade out
      const timer = setTimeout(() => {
        setFadeOut(true);
        // Wait for fade animation to complete before hiding completely
        setTimeout(() => {
          setShouldHide(true);
          onLoadingComplete();
        }, 500);
      }, 1200); // Give time for move animation to complete
      
      return () => clearTimeout(timer);
    }
  }, [shouldMoveAway, onLoadingComplete]);
  
  // Completely hide the component after animation
  if (shouldHide) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center w-full">
        {/* Turi's 3D Model - Match HelperRobot size and position */}
        <div className="w-96 h-96 mb-2">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            {/* Match HelperRobot lighting exactly for consistent appearance */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <React.Suspense fallback={null}>
              <TuriModel shouldMoveAway={shouldMoveAway} />
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

export default TuriLoadingScreen;

