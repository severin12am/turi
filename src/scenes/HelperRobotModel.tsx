import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { logger } from '../services/logger';
import { ThreeEvent } from '@react-three/fiber';

interface HelperRobotModelProps {
  path: string;
  onClick?: () => void;
  onModelReady?: () => void; // Called when 3D model is actually loaded
}

// Track app start time for absolute timestamps
const appStartTime = typeof performance !== 'undefined' ? performance.now() : 0;

const HelperRobotModel: React.FC<HelperRobotModelProps> = ({ path, onClick, onModelReady }) => {
  const renderTime = performance.now();
  console.log(`🤖 [${Math.round(renderTime)}ms] HelperRobotModel RENDER started`);
  
  const loadStart = performance.now();
  const { scene } = useGLTF(path);
  const loadTime = performance.now() - loadStart;
  
  console.log(`🤖 [${Math.round(performance.now())}ms] useGLTF returned in ${loadTime.toFixed(1)}ms (cached: ${loadTime < 10})`);
  
  const robotRef = useRef<THREE.Group>(null);
  const { isHelperRobotOpen } = useStore();
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    const effectTime = performance.now();
    console.log(`🤖 [${Math.round(effectTime)}ms] HelperRobotModel useEffect RUNNING (${Math.round(effectTime - renderTime)}ms after render)`);
    
    if (robotRef.current) {
      // Rotate the robot 180 degrees to face the user
      robotRef.current.rotation.y = Math.PI * 1.55;
      
      // Make the model interactive by setting userData
      robotRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.userData.clickable = true;
        }
      });
    }
    
    logger.info('Helper robot model loaded', { path, loadTime });
    
    // Signal that model is truly ready
    if (onModelReady) {
      console.log(`🤖 [${Math.round(performance.now())}ms] Calling onModelReady callback`);
      onModelReady();
    }
  }, [path, onModelReady]);
  
  useFrame((state, delta) => {
    if (robotRef.current) {
      // Vertical floating motion
      robotRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.1;
      
      // Horizontal swaying motion when dialog is open
      if (isHelperRobotOpen) {
        // Create a smooth side-to-side motion
        robotRef.current.position.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
        
        // Add a slight tilt in the opposite direction of movement for natural feel
        robotRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      } else {
        // Reset position and rotation when closed
        robotRef.current.position.z = THREE.MathUtils.lerp(robotRef.current.position.z, 0, delta * 2);
        robotRef.current.rotation.x = THREE.MathUtils.lerp(robotRef.current.rotation.x, 0, delta * 2);
      }
      
      // Add a slight glow effect when hovered
      if (hovered) {
        robotRef.current.scale.setScalar(2.1); // Scale up slightly when hovered
      } else {
        robotRef.current.scale.setScalar(2.0); // Reset to normal size
      }
    }
  });
  
  // Consolidated click handler that ensures the click event is properly triggered
  const handleInteraction = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    
    // Make sure the event doesn't bubble up
    if (e.object) {
      e.object.userData.interacted = true;
    }
    
    // Always execute the onClick handler if provided
    if (onClick) {
      logger.info('Helper robot 3D model clicked directly');
      onClick();
    }
  };
  
  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  
  return (
    <group ref={robotRef} dispose={null} scale={[2, 2, 2]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {scene && (
        <primitive 
          object={scene} 
          onClick={handleInteraction}
          onPointerDown={handleInteraction}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          userData={{ interactable: true }}
        />
      )}
    </group>
  );
};

export default HelperRobotModel;