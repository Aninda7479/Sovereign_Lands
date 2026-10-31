'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

import { useCharacterControls } from '@/hooks/useCharacterControls';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import {
  PHYSICS_CONFIG,
  calculateCameraRelativeMovement,
  lerpAngle,
} from '@/lib/physics/characterPhysics';
import { createCharacterMesh } from '@/lib/assets/proceduralModels';
import { CharacterAnimation } from './CharacterAnimation';
import { ThirdPersonCamera } from './ThirdPersonCamera';

export interface PlayerControllerProps {
  initialPosition?: [number, number, number];
  initialRotation?: number;
  faction?: 'north' | 'south' | 'neutral';
  isPointerLockDisabled?: boolean;
  onPositionChange?: (position: [number, number, number]) => void;
  onParcelAction?: (action: 'interact' | 'build' | 'buy') => void;
}

/**
 * Main GTA-style 3D Player Character Controller with Rapier Physics.
 * Handles continuous WASD movement relative to camera forward, jumping, sprinting,
 * mesh rotation, procedural limb animation, and over-the-shoulder third-person camera.
 */
export function PlayerController({
  initialPosition = [0, 2.0, 0],
  initialRotation = 0,
  faction = 'north',
  isPointerLockDisabled = false,
  onPositionChange,
  onParcelAction,
}: PlayerControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);

  // Input Controls Hook
  const { controls } = useCharacterControls();
  const { statBoosts } = usePlayerProgression();

  // Character Mesh Instance
  const characterGroup = useMemo(() => {
    return createCharacterMesh({ faction, isPlayer: true });
  }, [faction]);

  // Player State (Decoupled with refs to ensure 0 React re-renders during 60 FPS locomotion)
  const playerPositionRef = useRef<THREE.Vector3>(
    new THREE.Vector3(...initialPosition)
  );
  const characterSpeedRef = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(true);
  const verticalVelocityRef = useRef<number>(0);

  // Camera Horizontal Yaw tracking
  const cameraYawRef = useRef(0);
  const currentRotationY = useRef(initialRotation);
  const lastEmitPos = useRef(new THREE.Vector3());
  const lastEmitTime = useRef(0);

  // Listen to single-press action triggers
  useEffect(() => {
    if (controls.interact) onParcelAction?.('interact');
    if (controls.build) onParcelAction?.('build');
    if (controls.buy) onParcelAction?.('buy');
  }, [controls.interact, controls.build, controls.buy, onParcelAction]);

  // Main Physics & Locomotion Update Loop
  useFrame((_, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    // 1. Current Physics Translation & Velocity
    const translation = rb.translation();
    const linvel = rb.linvel();
    playerPositionRef.current.set(translation.x, translation.y, translation.z);
    verticalVelocityRef.current = linvel.y;

    // Ground check: character grounded if Y velocity is nearly 0 or small downward
    const grounded = Math.abs(linvel.y) < 0.35;
    isGroundedRef.current = grounded;

    // 2. Camera-Relative Locomotion
    const { moveDirection, hasInput, targetAngle } = calculateCameraRelativeMovement(
      controls.forward,
      controls.backward,
      controls.left,
      controls.right,
      cameraYawRef.current
    );

    // Calculate target speed with equipped gear and potion perks
    const speedMultiplier = 1 + (statBoosts?.movementSpeedPct || 0) / 100;
    const baseSpeed =
      (controls.sprint ? PHYSICS_CONFIG.sprintSpeed : PHYSICS_CONFIG.walkSpeed) * speedMultiplier;
    const currentHorizontalSpeed = hasInput ? baseSpeed : 0;
    characterSpeedRef.current = currentHorizontalSpeed;

    // Apply Velocity to Rapier RigidBody
    let targetVelX = linvel.x;
    let targetVelZ = linvel.z;
    let targetVelY = linvel.y;

    if (hasInput) {
      targetVelX = moveDirection.x * baseSpeed;
      targetVelZ = moveDirection.z * baseSpeed;

      // Smoothly steer visual mesh toward movement direction
      currentRotationY.current = lerpAngle(
        currentRotationY.current,
        targetAngle,
        delta * PHYSICS_CONFIG.rotationSpeed
      );
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = currentRotationY.current;
      }
    } else {
      // Natural deceleration / ground friction damping
      targetVelX = THREE.MathUtils.lerp(linvel.x, 0, delta * 12);
      targetVelZ = THREE.MathUtils.lerp(linvel.z, 0, delta * 12);
    }

    // 3. Jump Impulse
    if (controls.jump && grounded) {
      targetVelY = PHYSICS_CONFIG.jumpImpulse;
    }

    // Apply computed velocity to dynamic capsule
    rb.setLinvel({ x: targetVelX, y: targetVelY, z: targetVelZ }, true);

    // 4. Notify position listeners with smart throttling to prevent React reconciliation lag
    const currentPos = playerPositionRef.current;
    const distFromLastEmit = currentPos.distanceTo(lastEmitPos.current);
    const now = performance.now();

    // High-frequency vanilla DOM broadcast for minimap & compass (0ms React lag)
    if (distFromLastEmit > 0.25) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sovereign-player-move', {
            detail: [currentPos.x, currentPos.y, currentPos.z],
          })
        );
      }
    }

    // Throttle React state tree updates to at most once every 300ms, or when stopping
    if (
      (now - lastEmitTime.current > 300 && distFromLastEmit > 1.2) ||
      (!hasInput && distFromLastEmit > 0.4)
    ) {
      lastEmitTime.current = now;
      lastEmitPos.current.copy(currentPos);
      onPositionChange?.([currentPos.x, currentPos.y, currentPos.z]);
    }
  });

  return (
    <>
      {/* GTA-style Over-the-Shoulder Third-Person Camera */}
      <ThirdPersonCamera
        targetPosition={playerPositionRef}
        isSprinting={controls.sprint}
        isPointerLockDisabled={isPointerLockDisabled}
        onCameraYawChange={(yaw) => {
          cameraYawRef.current = yaw;
        }}
      />

      {/* Rapier Physics Dynamic Capsule RigidBody */}
      <RigidBody
        ref={rigidBodyRef}
        position={initialPosition}
        type="dynamic"
        colliders={false}
        enabledRotations={[false, false, false]}
        linearDamping={0.4}
        mass={80}
      >
        {/* Upright Capsule Collider matching 1.8m character height */}
        <CapsuleCollider
          args={[PHYSICS_CONFIG.capsuleHalfHeight, PHYSICS_CONFIG.capsuleRadius]}
          position={[0, PHYSICS_CONFIG.capsuleHalfHeight + PHYSICS_CONFIG.capsuleRadius, 0]}
        />

        {/* 3D Visual Mesh Container */}
        <group ref={meshGroupRef}>
          <primitive object={characterGroup} />
        </group>
      </RigidBody>

      {/* Procedural Character Animation Driver */}
      <CharacterAnimation
        characterGroup={characterGroup}
        speed={characterSpeedRef}
        isSprinting={controls.sprint}
        isGrounded={isGroundedRef}
        verticalVelocity={verticalVelocityRef}
      />
    </>
  );
}

export default PlayerController;
