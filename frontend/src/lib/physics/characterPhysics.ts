import * as THREE from 'three';

/**
 * Sovereign Lands - 3D Character Locomotion & Rapier Physics Parameters
 * Tuned for responsive, snappy GTA-style third-person locomotion.
 */

export const PHYSICS_CONFIG = {
  // Movement Speeds (m/s)
  walkSpeed: 5.2,
  sprintSpeed: 9.36, // 1.8x walk speed
  backwardSpeedMultiplier: 0.7,
  strafeSpeedMultiplier: 0.85,

  // Jumping & Airborne Physics
  jumpImpulse: 7.2,
  airControlFactor: 0.35,
  maxFallSpeed: -28.0,
  gravity: -24.0,

  // Capsule Collider Dimensions (Total height: 1.8m)
  capsuleRadius: 0.35,
  capsuleHalfHeight: 0.55,

  // Rotation & Camera Steering
  rotationSpeed: 12.0, // Radians per second for smooth turning toward velocity
  slopeMaxAngle: 45, // Max climbable slope in degrees

  // Ground Detection Raycast
  groundCheckDistance: 0.95, // Raycast down from capsule center
};

/**
 * Computes world movement direction and target rotation angle relative to camera yaw.
 * Pressing W always runs in the direction the camera is facing.
 */
export function calculateCameraRelativeMovement(
  forward: boolean,
  backward: boolean,
  left: boolean,
  right: boolean,
  cameraYaw: number
): {
  moveDirection: THREE.Vector3;
  hasInput: boolean;
  targetAngle: number;
} {
  const moveDirection = new THREE.Vector3(0, 0, 0);

  let inputZ = 0;
  let inputX = 0;

  if (forward) inputZ += 1;
  if (backward) inputZ -= 1;
  if (left) inputX -= 1;
  if (right) inputX += 1;

  const hasInput = inputX !== 0 || inputZ !== 0;

  if (!hasInput) {
    return {
      moveDirection,
      hasInput: false,
      targetAngle: 0,
    };
  }

  // Calculate local angle relative to forward (0 rad = forward, PI/2 = right, -PI/2 = left, PI = backward)
  const inputAngle = Math.atan2(inputX, inputZ);

  // Combine with camera horizontal yaw angle
  const targetAngle = cameraYaw + inputAngle;

  // Compute world space movement vector
  moveDirection.set(Math.sin(targetAngle), 0, Math.cos(targetAngle)).normalize();

  return {
    moveDirection,
    hasInput: true,
    targetAngle,
  };
}

/**
 * Smoothly interpolates an angle handling the 360-degree radian wrap-around.
 */
export function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * Math.min(1, Math.max(0, t));
}

/**
 * Raycast helper to determine if character is firmly grounded on terrain or structures.
 */
export function checkGrounded(
  rayHitDistance: number | null,
  threshold = PHYSICS_CONFIG.groundCheckDistance
): boolean {
  if (rayHitDistance === null || rayHitDistance === undefined) return false;
  return rayHitDistance <= threshold;
}
