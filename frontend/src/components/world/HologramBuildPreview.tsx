'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StructureTypeEnum, modelManager } from '@/lib/assets/modelRegistry';
import { STRUCTURE_BUILD_INFO } from '@/hooks/useBuildingPlacement';

export interface HologramBuildPreviewProps {
  active: boolean;
  structureType: StructureTypeEnum;
  position: [number, number, number];
  isValid: boolean;
  validationError?: string | null;
}

/**
 * In-world 3D holographic ghost preview for GTA/Rust style construction.
 * Renders glowing translucent hologram (Green for valid/affordable, Red for invalid/obstructed)
 * with animated scanline pulse and ground projection footprint.
 */
export function HologramBuildPreview({
  active,
  structureType,
  position,
  isValid,
}: HologramBuildPreviewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const hologramColor = isValid ? '#22c55e' : '#ef4444';
  const emissiveColor = isValid ? '#16a34a' : '#dc2626';

  // Instantiate model mesh with holographic translucent material
  const hologramObject = useMemo(() => {
    const rawModel = modelManager.getStructureByEnum(structureType) || new THREE.Group();
    const cloned = rawModel.clone();

    // Replace all materials with glowing translucent hologram
    const holoMat = new THREE.MeshStandardMaterial({
      color: hologramColor,
      emissive: emissiveColor,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.65,
      wireframe: false,
      roughness: 0.3,
    });

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = holoMat;
      }
    });

    return cloned;
  }, [structureType, hologramColor, emissiveColor]);

  const structureInfo = STRUCTURE_BUILD_INFO[structureType] || {
    width: 10,
    depth: 10,
  };

  // Subtle pulsing scanline animation
  useFrame(({ clock }) => {
    if (!active || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.65 + Math.sin(t * 5.0) * 0.12;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) mat.opacity = pulse;
      }
    });

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={position} name="HologramBuildPreview">
      {/* 3D Holographic Structure Mesh */}
      <primitive object={hologramObject} />

      {/* Ground Projection Footprint Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <planeGeometry args={[structureInfo.width, structureInfo.depth]} />
        <meshBasicMaterial
          color={hologramColor}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ground Projection Boundary Perimeter Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry
          args={[
            Math.max(structureInfo.width, structureInfo.depth) * 0.6,
            Math.max(structureInfo.width, structureInfo.depth) * 0.6 + 0.3,
            32,
          ]}
        />
        <meshBasicMaterial color={hologramColor} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

export default HologramBuildPreview;
