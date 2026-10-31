'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

import { useCharacterControls } from '@/hooks/useCharacterControls';
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

  // Character Mesh Instance
  const characterGroup = useMemo(() => {
    return createCharacterMesh({ faction, isPlayer: true });
  }, [faction]);

  // Player State
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(...initialPosition)
  );
  const [characterSpeed, setCharacterSpeed] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);
  const [verticalVelocity, setVerticalVelocity] = useState(0);

  // Camera Horizontal Yaw tracking
  const cameraYawRef = useRef(0);
  const currentRotationY = useRef(initialRotation);
  const lastEmitPos = useRef(new THREE.Vector3());

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
    const currentPos = new THREE.Vector3(translation.x, translation.y, translation.z);
    setPlayerPosition(currentPos);
    setVerticalVelocity(linvel.y);

    // Ground check: character grounded if Y velocity is nearly 0 or small downward
    const grounded = Math.abs(linvel.y) < 0.35;
    setIsGrounded(grounded);

    // 2. Camera-Relative Locomotion
    const { moveDirection, hasInput, targetAngle } = calculateCameraRelativeMovement(
      controls.forward,
      controls.backward,
      controls.left,
      controls.right,
      cameraYawRef.current
    );

    // Calculate target speed
    const baseSpeed = controls.sprint ? PHYSICS_CONFIG.sprintSpeed : PHYSICS_CONFIG.walkSpeed;
    const currentHorizontalSpeed = hasInput ? baseSpeed : 0;
    setCharacterSpeed(currentHorizontalSpeed);

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

    // 4. Notify position listeners periodically (if moved more than 0.1m)
    if (currentPos.distanceTo(lastEmitPos.current) > 0.1) {
      lastEmitPos.current.copy(currentPos);
      onPositionChange?.([currentPos.x, currentPos.y, currentPos.z]);
    }
  });

  return (
    <>
      {/* GTA-style Over-the-Shoulder Third-Person Camera */}
      <ThirdPersonCamera
        targetPosition={playerPosition}
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
        speed={characterSpeed}
        isSprinting={controls.sprint}
        isGrounded={isGrounded}
        verticalVelocity={verticalVelocity}
      />
    </>
  );
}

export default PlayerController;
