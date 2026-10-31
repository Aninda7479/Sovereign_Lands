'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NPCProfile } from '../../../../ai-system/npc-engine/NPCProfiles';
import { npcManager } from '../../../../ai-system/npc-engine/NPCManager';
import {
  createNPCFarmerMesh,
  createNPCKnightMesh,
  createNPCAdvisorMesh,
  createCharacterMesh,
  CharacterJoints,
} from '@/lib/assets/proceduralModels';
import { FloatingSpeechBubble } from './FloatingSpeechBubble';

export interface NPCWorldEntityProps {
  profile: NPCProfile;
  playerPosition?: [number, number, number] | { x: number; y: number; z: number };
  onInteract?: (npcId: string) => void;
  isConversingWithThisNPC?: boolean;
}

/**
 * 3D Living NPC Entity in Sovereign Lands
 * Renders procedural low-poly medieval character mesh with articulated limb animations,
 * 5-meter proximity trigger, and turn-to-face spatial behavior.
 */
export function NPCWorldEntity({
  profile,
  playerPosition,
  onInteract,
  isConversingWithThisNPC = false,
}: NPCWorldEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animTime = useRef<number>(Math.random() * 10);
  const [isInProximity, setIsInProximity] = useState<boolean>(false);
  const [currentBark, setCurrentBark] = useState<string | undefined>(undefined);

  // Retrieve controller from NPCManager
  const controller = useMemo(() => {
    return npcManager.getController(profile.id);
  }, [profile.id]);

  // Create procedural 3D model according to profile type
  const characterMesh = useMemo(() => {
    let mesh: THREE.Group;
    switch (profile.meshType) {
      case 'npc_farmer':
        mesh = createNPCFarmerMesh();
        break;
      case 'npc_knight':
        mesh = createNPCKnightMesh(profile.faction);
        break;
      case 'npc_advisor':
        mesh = createNPCAdvisorMesh(profile.faction);
        break;
      default:
        mesh = createCharacterMesh({ faction: profile.faction });
        break;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, [profile.meshType, profile.faction]);

  // Synchronize conversation state
  useEffect(() => {
    if (controller) {
      controller.setConversing(isConversingWithThisNPC);
    }
  }, [isConversingWithThisNPC, controller]);

  // Listen for 'E' keypress when player is in proximity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.key === 'e' || e.key === 'E') && isInProximity && !isConversingWithThisNPC) {
        onInteract?.(profile.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInProximity, isConversingWithThisNPC, onInteract, profile.id]);

  // Per-frame locomotion and limb animation
  useFrame((_, delta) => {
    if (!groupRef.current || !controller) return;

    // Update spatial roaming controller
    const snapshot = controller.update(delta, playerPosition);

    // Apply 3D world position & yaw rotation
    groupRef.current.position.set(
      snapshot.position[0],
      snapshot.position[1],
      snapshot.position[2]
    );
    groupRef.current.rotation.y = snapshot.rotationY;

    // Proximity trigger (5-meter radius)
    const inRange = snapshot.distanceToPlayer <= 5.0;
    if (inRange !== isInProximity) {
      setIsInProximity(inRange);
    }

    // Update active voice bark
    if (snapshot.activeBark !== currentBark) {
      setCurrentBark(snapshot.activeBark);
    }

    // Limb Articulation & Procedural Animations
    const joints: CharacterJoints | undefined = characterMesh.userData?.joints;
    if (!joints) return;

    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = joints;
    const state = snapshot.behaviorState;

    if (state === 'walking') {
      animTime.current += delta * 9.0;
      const t = animTime.current;
      const swing = Math.sin(t) * 0.65;

      // Arm & leg swing
      leftArm.rotation.x = -swing;
      rightArm.rotation.x = swing;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;

      // Slight head and torso bobbing
      torso.position.y = 0.9 + Math.abs(Math.sin(t * 2)) * 0.04;
      head.rotation.y = Math.sin(t * 0.5) * 0.05;
    } else if (state === 'conversing') {
      animTime.current += delta * 2.5;
      const t = animTime.current;

      // Subtle talking hand gestures and head nodding
      head.rotation.x = Math.sin(t * 2) * 0.06;
      head.rotation.y = Math.sin(t) * 0.04;
      rightArm.rotation.x = -0.3 + Math.sin(t * 1.5) * 0.15;
      leftArm.rotation.x = -0.2 + Math.cos(t * 1.2) * 0.1;

      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      torso.position.y = 0.9 + Math.sin(t * 0.8) * 0.01;
    } else if (state === 'inspecting') {
      animTime.current += delta * 1.8;
      const t = animTime.current;

      // Leaning forward to inspect ground / crops
      head.rotation.x = 0.35 + Math.sin(t) * 0.05;
      torso.rotation.x = 0.15;
      rightArm.rotation.x = -0.4;
      leftArm.rotation.x = -0.2;
    } else if (state === 'warming_hands') {
      animTime.current += delta * 3.0;
      const t = animTime.current;

      // Rubbing hands together
      head.rotation.x = 0.15;
      rightArm.rotation.x = -0.6 + Math.sin(t) * 0.08;
      leftArm.rotation.x = -0.6 - Math.sin(t) * 0.08;
      rightArm.rotation.z = -0.3;
      leftArm.rotation.z = 0.3;
    } else {
      // Idle breathing state
      animTime.current += delta * 2.0;
      const t = animTime.current;

      torso.position.y = 0.9 + Math.sin(t) * 0.015;
      head.rotation.x = Math.sin(t * 0.5) * 0.03;
      head.rotation.y = Math.sin(t * 0.3) * 0.08;
      torso.rotation.x = 0;

      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
      leftArm.rotation.z = 0;
      rightArm.rotation.z = 0;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onInteract?.(profile.id);
  };

  return (
    <group ref={groupRef} onClick={handlePointerDown}>
      {/* 3D Character Mesh */}
      <primitive object={characterMesh} />

      {/* Floating 3D Ambient Bark Bubble */}
      <FloatingSpeechBubble
        text={currentBark}
        visible={!!currentBark && !isConversingWithThisNPC}
        speakerName={profile.name}
        faction={profile.faction}
        position={[0, 2.3, 0]}
      />

      {/* GTA-style [E] Speak Prompt hovering over NPC when player is in range */}
      {isInProximity && !isConversingWithThisNPC && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={10}
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onInteract?.(profile.id);
            }}
            className="group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-400/80 bg-zinc-950/90 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-amber-200"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/30 border border-amber-400 font-mono font-bold text-xs text-amber-300 animate-pulse">
              E
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-xs leading-none">
                Speak with {profile.name}
              </span>
              <span className="text-[9px] text-zinc-400 leading-tight">
                {profile.role}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default NPCWorldEntity;
