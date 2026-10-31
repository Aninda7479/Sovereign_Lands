'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterJoints } from '@/lib/assets/proceduralModels';

export type LocomotionState = 'idle' | 'walk' | 'run' | 'jump' | 'fall';

export interface CharacterAnimationProps {
  characterGroup: THREE.Group | null;
  speed: number | React.MutableRefObject<number>;
  isSprinting: boolean;
  isGrounded: boolean | React.MutableRefObject<boolean>;
  verticalVelocity: number | React.MutableRefObject<number>;
}

/**
 * Procedural Animation Controller for Sovereign Lands 3D Medieval Characters.
 * Seamlessly drives limb articulation (swinging, bobbing, breathing) based on
 * physics states: idle -> walk -> run -> jump -> fall.
 */
export function CharacterAnimation({
  characterGroup,
  speed,
  isSprinting,
  isGrounded,
  verticalVelocity,
}: CharacterAnimationProps) {
  const animTime = useRef(0);
  const currentState = useRef<LocomotionState>('idle');

  useFrame((_, delta) => {
    if (!characterGroup) return;

    const currentSpeed =
      speed && typeof speed === 'object' && 'current' in speed ? speed.current : (speed as number);
    const currentGrounded =
      isGrounded && typeof isGrounded === 'object' && 'current' in isGrounded
        ? isGrounded.current
        : (isGrounded as boolean);
    const currentVertVel =
      verticalVelocity && typeof verticalVelocity === 'object' && 'current' in verticalVelocity
        ? verticalVelocity.current
        : (verticalVelocity as number);

    // Determine active locomotion state inside frame loop
    let state: LocomotionState = 'idle';
    if (!currentGrounded) {
      state = currentVertVel > 0.5 ? 'jump' : 'fall';
    } else if (currentSpeed > 0.3) {
      state = isSprinting && currentSpeed > 5.0 ? 'run' : 'walk';
    } else {
      state = 'idle';
    }
    currentState.current = state;

    const joints: CharacterJoints | undefined = characterGroup.userData?.joints;
    if (!joints) return;

    // Advance animation clock
    const speedMultiplier = state === 'run' ? 14 : state === 'walk' ? 9 : 2.0;
    animTime.current += delta * speedMultiplier;
    const t = animTime.current;

    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = joints;

    if (state === 'walk' || state === 'run') {
      const swingMagnitude = state === 'run' ? 0.95 : 0.65;
      const armSwing = Math.sin(t) * swingMagnitude;
      const legSwing = Math.sin(t) * swingMagnitude;

      // Legs swing in opposite phases
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, legSwing, 0.3);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -legSwing, 0.3);

      // Arms swing in counter-phase to legs (left arm forward when left leg back)
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -armSwing * 0.8, 0.3);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, armSwing * 0.8, 0.3);

      // Subtle outward arm angle for athletic posture
      leftArm.rotation.z = -0.15;
      rightArm.rotation.z = 0.15;

      // Torso vertical bounce on footsteps
      const bounce = Math.abs(Math.sin(t)) * (state === 'run' ? 0.08 : 0.04);
      torso.position.y = 0.9 + bounce;

      // Slight torso twist
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, Math.sin(t) * 0.08, 0.2);
      head.rotation.y = -torso.rotation.y * 0.5; // Head stays focused forward

    } else if (state === 'jump') {
      // Tuck legs slightly upward, arms flared back for balance
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, -0.4, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -0.2, 0.2);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.6, 0.2);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.6, 0.2);
      torso.position.y = 0.9;
      torso.rotation.y = 0;

    } else if (state === 'fall') {
      // Airborne descent pose
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0.2, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0.3, 0.2);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.4, 0.2);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.4, 0.2);
      torso.position.y = 0.9;
      torso.rotation.y = 0;

    } else {
      // Idle Breathing & subtle weight shift
      const breath = Math.sin(t) * 0.02;
      const weightShift = Math.sin(t * 0.3) * 0.03;
      torso.position.y = THREE.MathUtils.lerp(torso.position.y, 0.9 + breath, 0.1);
      torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, weightShift, 0.08); // Subtle hip shift
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, Math.sin(t * 0.25) * 0.04, 0.1);

      // Head scanning the horizon slowly
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, Math.sin(t * 0.7) * 0.02, 0.1);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(t * 0.3) * 0.06, 0.08);

      // Return limbs to natural relaxed heroic rest
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, Math.sin(t * 0.5) * 0.03, 0.15);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -Math.sin(t * 0.5) * 0.03, 0.15);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.08, 0.15);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.08, 0.15);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, weightShift * 0.5, 0.15);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -weightShift * 0.5, 0.15);
    }
  });

  return null;
}

export default CharacterAnimation;
