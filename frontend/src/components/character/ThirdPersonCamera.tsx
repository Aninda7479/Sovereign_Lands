'use client';

import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ThirdPersonCameraProps {
  targetPosition: THREE.Vector3;
  isSprinting?: boolean;
  defaultDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  sensitivity?: number;
  isPointerLockDisabled?: boolean;
  onCameraYawChange?: (yaw: number) => void;
}

/**
 * GTA-style over-the-shoulder orbit follow camera.
 * Smoothly tracks the player character, responds to mouse orbit, performs raycast collision avoidance,
 * and dynamically shifts FOV during sprint.
 */
export function ThirdPersonCamera({
  targetPosition,
  isSprinting = false,
  defaultDistance = 5.2,
  minDistance = 1.6,
  maxDistance = 10.0,
  sensitivity = 0.0022,
  isPointerLockDisabled = false,
  onCameraYawChange,
}: ThirdPersonCameraProps) {
  const { camera, gl, scene } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0.25); // Slight top-down angle
  const distance = useRef(defaultDistance);
  const isPointerLocked = useRef(false);
  const isMouseDown = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const currentCamPos = useRef(new THREE.Vector3(0, 5, 10));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.4, 0));
  const raycaster = useRef(new THREE.Raycaster());

  // Release pointer lock immediately if pointer lock is disabled (e.g. pause/settings menu open)
  useEffect(() => {
    if (isPointerLockDisabled) {
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      isPointerLocked.current = false;
      isMouseDown.current = false;
    }
  }, [isPointerLockDisabled]);

  // Mouse Orbit Listeners & Pointer Lock
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      // If pointer lock is disabled (menu open), don't lock pointer
      if (isPointerLockDisabled) return;

      if (e.button === 0 || e.button === 2) {
        isMouseDown.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
      // Request pointer lock on click if not already locked
      if (!document.pointerLockElement) {
        canvas.requestPointerLock?.();
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPointerLockDisabled) return;

      if (isPointerLocked.current) {
        yaw.current -= e.movementX * sensitivity;
        pitch.current -= e.movementY * sensitivity;

        // Clamp pitch so camera cannot flip upside down or clip under feet
        pitch.current = Math.max(-0.25, Math.min(1.2, pitch.current));

        onCameraYawChange?.(yaw.current);
      } else if (isMouseDown.current) {
        // Drag without pointer lock fallback
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };

        yaw.current -= deltaX * sensitivity;
        pitch.current -= deltaY * sensitivity;
        pitch.current = Math.max(-0.25, Math.min(1.2, pitch.current));

        onCameraYawChange?.(yaw.current);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isPointerLockDisabled) return;
      distance.current += e.deltaY * 0.005;
      distance.current = Math.max(minDistance, Math.min(maxDistance, distance.current));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl, sensitivity, minDistance, maxDistance, isPointerLockDisabled, onCameraYawChange]);

  // Frame Update Loop: Camera Position, Smoothing, Collision Raycast, and Dynamic FOV
  useFrame((_, delta) => {
    // Player target focus point (upper torso / head at Y = 1.4)
    const focusPoint = targetPosition.clone().add(new THREE.Vector3(0, 1.4, 0));

    // Dynamic FOV shift during sprint (60 -> 70 deg)
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = isSprinting ? 69 : 60;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 6);
      camera.updateProjectionMatrix();
    }

    // Calculate ideal spherical orbit offset
    const currentDist = distance.current;
    const horizontalDist = currentDist * Math.cos(pitch.current);
    const verticalDist = currentDist * Math.sin(pitch.current);

    // GTA-style slight right-shoulder offset
    const shoulderOffset = new THREE.Vector3(
      Math.cos(yaw.current) * 0.45,
      0,
      -Math.sin(yaw.current) * 0.45
    );

    const idealOffset = new THREE.Vector3(
      Math.sin(yaw.current) * horizontalDist,
      verticalDist,
      Math.cos(yaw.current) * horizontalDist
    ).add(shoulderOffset);

    let finalCamPos = focusPoint.clone().add(idealOffset);

    // Camera Collision Avoidance (Raycast from focusPoint to idealCamPos)
    const rayDir = finalCamPos.clone().sub(focusPoint).normalize();
    const maxRayDist = finalCamPos.distanceTo(focusPoint);

    raycaster.current.set(focusPoint, rayDir);
    raycaster.current.far = maxRayDist;

    // Check intersecting objects in scene (excluding player and helper beacons)
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    for (const hit of intersects) {
      if (
        hit.distance < maxRayDist &&
        hit.object.type === 'Mesh' &&
        !hit.object.name.includes('Character') &&
        !hit.object.name.includes('Hero') &&
        !hit.object.name.includes('Beacon')
      ) {
        // Pull camera closer to prevent clipping through walls
        const safeDist = Math.max(minDistance, hit.distance - 0.25);
        finalCamPos = focusPoint.clone().add(rayDir.multiplyScalar(safeDist));
        break;
      }
    }

    // Smooth Lerp Camera Lag
    currentCamPos.current.lerp(finalCamPos, delta * 12);
    currentLookAt.current.lerp(focusPoint, delta * 15);

    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export default ThirdPersonCamera;
