// src/scenes/City.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { logger } from '../services/logger';
import Character from './Character';
import { supabase } from '../services/supabase';
import type { Character as CharacterType } from '../types';
import DialogueBox from '../components/DialogueBox';
import DialogueSelectionPanel from '../components/DialogueSelectionPanel';

// Preload the character model
useGLTF.preload('/models/character1.glb');

const CoordinateTracker: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  return (
    <div className="fixed top-4 right-4 bg-black/70 text-white p-4 rounded-lg font-mono text-sm">
      <div>X: {position.x.toFixed(2)}</div>
      <div>Y: {position.y.toFixed(2)}</div>
      <div>Z: {position.z.toFixed(2)}</div>
    </div>
  );
};

const GridHelper: React.FC = () => {
  return (
    <>
      <gridHelper args={[100, 100, 'white', 'gray']} />
      <axesHelper args={[5]} />
    </>
  );
};

const PositionMarker: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="red" />
      <Html position={[0, 1, 0]}>
        <div className="bg-black/70 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
          {`${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`}
        </div>
      </Html>
    </mesh>
  );
};

const CityModel: React.FC = () => {
  const { scene } = useGLTF('/models/city.glb');
  
  useEffect(() => {
    logger.info('City model loading attempt', { path: '/models/city.glb' });
  }, []);
  
  return <primitive object={scene} position={[0, 0, 0]} />;
};

const Player: React.FC<{ onMove: (position: THREE.Vector3) => void }> = ({ onMove }) => {
  const { camera } = useThree();
  const moveSpeed = 0.15;
  const rotateSpeed = 0.002;
  const playerRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const rotationRef = useRef({ x: 0, y: Math.PI });
  const isMouseDown = useRef(false);
  
  useEffect(() => {
    playerRef.current.position.set(53, 1.7, 11); // Keep original starting position
    camera.position.copy(playerRef.current.position);
    camera.rotation.set(0, Math.PI, 0);
    
    const handleMouseDown = () => {
      isMouseDown.current = true;
    };
    
    const handleMouseUp = () => {
      isMouseDown.current = false;
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown.current) return;
      
      rotationRef.current.y -= event.movementX * rotateSpeed;
      rotationRef.current.x -= event.movementY * rotateSpeed;
      rotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationRef.current.x));
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera]);
  
  useFrame(() => {
    const rotation = new THREE.Euler(rotationRef.current.x, rotationRef.current.y, 0, 'YXZ');
    playerRef.current.setRotationFromEuler(rotation);
    camera.setRotationFromEuler(rotation);
    
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation);
    right.y = 0;
    right.normalize();
    
    const movement = new THREE.Vector3();
    
    if (keys['keyw'] || keys['arrowup']) movement.add(forward);
    if (keys['keys'] || keys['arrowdown']) movement.sub(forward);
    if (keys['keyd'] || keys['arrowright']) movement.add(right);
    if (keys['keya'] || keys['arrowleft']) movement.sub(right);
    
    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(moveSpeed);
      playerRef.current.position.add(movement);
      camera.position.copy(playerRef.current.position);
      onMove(playerRef.current.position.clone());
    }
  });
  
  return <PositionMarker position={playerRef.current.position} />;
};

const keys: { [key: string]: boolean } = {};

const handleKeyDown = (e: KeyboardEvent) => {
  keys[e.code.toLowerCase()] = true;
};

const handleKeyUp = (e: KeyboardEvent) => {
  keys[e.code.toLowerCase()] = false;
};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

const CityScene: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(53, 1.7, 11));
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [isDialogueActive, setIsDialogueActive] = useState(false);
  const [distanceToCharacter, setDistanceToCharacter] = useState<number>(Infinity);
  const [loadingDialogue, setLoadingDialogue] = useState(false);
  const [dialogueError, setDialogueError] = useState<string | null>(null);
  const [isNpcSpeaking, setIsNpcSpeaking] = useState(false);
  
  // Add new state for dialogue selection
  const [showDialogueSelection, setShowDialogueSelection] = useState(false);
  const [selectedDialogueId, setSelectedDialogueId] = useState<number>(1);

  // Fetch character data
  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching character', { error });
          return;
        }

        if (!data) {
          logger.info('No character found with id 1, using default position and scale');
          setCharacter({
            id: 1,
            name: 'Tom',
            role: 'Teacher',
            position_x: 53,
            position_y: -0.3,
            position_z: 17,
            scale_x: 0.7,
            scale_y: 0.7,
            scale_z: 0.7,
            is_active: true
          } as CharacterType);
          return;
        }

        logger.info('Character data fetched', { characterId: 1, data });
        setCharacter(data);
      } catch (error) {
        logger.error('Failed to fetch character', { error });
        // Fallback character data
        setCharacter({
          id: 1,
          name: 'Tom',
          role: 'Teacher',
          position_x: 53,
          position_y: -0.3,
          position_z: 17,
          scale_x: 0.7,
          scale_y: 0.7,
          scale_z: 0.7,
          is_active: true
        } as CharacterType);
      }
    };

    fetchCharacter();
  }, []);

  // Calculate distance between player and character
  useEffect(() => {
    if (!character) return;

    const characterPosition = new THREE.Vector3(
      character.position_x,
      character.position_y,
      character.position_z
    );

    const checkDistance = () => {
      // Calculate distance only in X and Z (horizontal plane), ignoring Y (height)
      const playerXZ = new THREE.Vector2(playerPosition.x, playerPosition.z);
      const characterXZ = new THREE.Vector2(characterPosition.x, characterPosition.z);
      const horizontalDistance = playerXZ.distanceTo(characterXZ);
      
      setDistanceToCharacter(horizontalDistance);
      
      // Show dialogue selection when close enough (5 units)
      if (horizontalDistance <= 5 && !isDialogueActive && !loadingDialogue && !showDialogueSelection) {
        logger.info('Player is within range of character, showing dialogue selection', { 
          distance: horizontalDistance,
          playerPosition: [playerPosition.x, playerPosition.y, playerPosition.z],
          characterPosition: [characterPosition.x, characterPosition.y, characterPosition.z]
        });
        setShowDialogueSelection(true);
      }
      
      // Auto close panels when player moves away
      if (horizontalDistance > 5 && (isDialogueActive || showDialogueSelection)) {
        if (isDialogueActive) {
          handleCloseDialogue();
        }
        if (showDialogueSelection) {
          setShowDialogueSelection(false);
        }
      }
    };

    checkDistance();
    const interval = setInterval(checkDistance, 500); // Check less frequently to reduce load
    return () => clearInterval(interval);
  }, [playerPosition, character, isDialogueActive, loadingDialogue, showDialogueSelection]);
  
  // Handle dialogue activation with proper error handling
  const handleDialogueActivation = async (characterId: number, dialogueId: number) => {
    if (isDialogueActive || loadingDialogue) return;
    
    setLoadingDialogue(true);
    setDialogueError(null);
    
    try {
      // Check if this character has phrases for the selected dialogue
      const sourceTable = `phrases_${characterId}`;
      
      const { data, error } = await supabase
        .from(sourceTable)
        .select('*')
        .eq('dialogue_id', dialogueId)
        .limit(1);
        
      if (error) {
        logger.error('Error checking dialogue data', { error, table: sourceTable, dialogueId });
        setDialogueError(`No dialogue data found for character ${characterId}, dialogue ${dialogueId}`);
        throw new Error(`Dialogue data error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        logger.warn('No dialogue data found', { characterId, dialogueId, table: sourceTable });
        setDialogueError(`Character ${characterId} has no phrases for dialogue ${dialogueId}`);
        setTimeout(() => setDialogueError(null), 5000);
        return;
      }
      
      // If we get here, data exists so show dialogue
      setSelectedDialogueId(dialogueId);
      setIsDialogueActive(true);
      setShowDialogueSelection(false); // Hide selection panel
      logger.info('Dialogue activated', { characterId, dialogueId });
    } catch (error) {
      logger.error('Failed to activate dialogue', { error, characterId, dialogueId });
    } finally {
      setLoadingDialogue(false);
    }
  };
  
  // Add a console log to track panel visibility
  useEffect(() => {
    console.log('Dialogue selection panel visibility changed:', showDialogueSelection);
    
    // We no longer need to refresh data here as the DialogueSelectionPanel
    // handles its own data fetching now
  }, [showDialogueSelection, character]);

  // Handle dialogue selection
  const handleDialogueSelect = (dialogueId: number) => {
    console.log('Dialogue selected in City component:', dialogueId);
    if (character) {
      handleDialogueActivation(character.id, dialogueId);
    }
  };
  
  // Handle dialogue panel close
  const handleDialogueSelectionClose = () => {
    console.log('Closing dialogue selection panel');
    setShowDialogueSelection(false);
  };
  
  const handleCloseDialogue = () => {
    setIsDialogueActive(false);
    logger.info('Dialogue closed');
    // Show dialogue selection again after dialogue is closed
    setShowDialogueSelection(true);
  };
  
  return (
    <div className="h-screen w-full">
      <Canvas camera={{ fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <GridHelper />
        <CityModel />
        <Player onMove={setPlayerPosition} />
        {character && (
          <Character 
            position={[character.position_x, character.position_y, character.position_z]}
            scale={[character.scale_x, character.scale_y, character.scale_z]}
            onInteract={() => setShowDialogueSelection(true)}
            isSpeaking={isNpcSpeaking}
            isDialogueActive={isDialogueActive || showDialogueSelection}
          />
        )}
      </Canvas>
      
      <CoordinateTracker position={playerPosition} />
      
      {dialogueError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="font-bold mb-1">Error</div>
          <div>{dialogueError}</div>
        </div>
      )}

      {isDialogueActive && character && (
        <DialogueBox
          characterId={character.id}
          onClose={handleCloseDialogue}
          distance={distanceToCharacter}
          onNpcSpeakStart={() => setIsNpcSpeaking(true)}
          onNpcSpeakEnd={() => setIsNpcSpeaking(false)}
          dialogueId={selectedDialogueId}
        />
      )}
      
      {showDialogueSelection && character && !isDialogueActive && (
        <DialogueSelectionPanel
          characterId={character.id}
          onDialogueSelect={handleDialogueSelect}
          onClose={handleDialogueSelectionClose}
        />
      )}
    </div>
  );
};

export default CityScene;