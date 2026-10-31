import * as THREE from 'three';

/**
 * Sovereign Lands - 3D Character Locomotion & Rapier Physics Parameters
 * Tuned for responsive, snappy GTA-style third-person locomotion.
 */

export const PHYSICS_CONFIG = {
  // Movement Speeds (m/s) - calibrated for realistic kingdom scale and journey time
  walkSpeed: 3.8,
  sprintSpeed: 7.2, // ~1.9x walk speed
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

  // Camera horizontal vectors:
  // Camera sits behind player at (sin(yaw)*dist, ..., cos(yaw)*dist) looking at player.
  // Therefore, forward (view direction) points in (-sin(yaw), 0, -cos(yaw)).
  // Right direction points in (cos(yaw), 0, -sin(yaw)).
  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);

  const camForward = new THREE.Vector3(-sinY, 0, -cosY);
  const camRight = new THREE.Vector3(cosY, 0, -sinY);

  if (forward) moveDirection.add(camForward);
  if (backward) moveDirection.sub(camForward);
  if (right) moveDirection.add(camRight);
  if (left) moveDirection.sub(camRight);

  const hasInput = moveDirection.lengthSq() > 0.0001;

  if (!hasInput) {
    return {
      moveDirection: new THREE.Vector3(0, 0, 0),
      hasInput: false,
      targetAngle: 0,
    };
  }

  moveDirection.normalize();

  // The 3D character mesh model faces +Z by default.
  // To rotate the character to face moveDirection (dx, 0, dz):
  const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);

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
