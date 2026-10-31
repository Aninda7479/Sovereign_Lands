'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { ParcelEntity, calculateParcelCenter } from '@/lib/world/parcelCoordinates';
import { modelManager, StructureTypeEnum } from '@/lib/assets/modelRegistry';
import { STRUCTURE_BUILD_INFO } from '@/hooks/useBuildingPlacement';
import { Faction } from '@/lib/assets/proceduralModels';

export interface StructureManagerProps {
  parcels: ParcelEntity[];
  playerPosition?: [number, number, number];
  maxViewDistance?: number;
}

/**
 * Instanced Structure Manager for Sovereign Lands.
 * Renders all constructed buildings (Farmsteads, Guard Towers, Stone Walls, Castle Keeps)
 * across the 3D world with Rapier physics colliders and animated windmills.
 */
export function StructureManager({
  parcels,
  playerPosition,
  maxViewDistance = 400,
}: StructureManagerProps) {
  const windmillRotors = useRef<THREE.Group[]>([]);

  // Filter parcels with active structures and compute world placements
  const activeStructures = useMemo(() => {
    windmillRotors.current = [];

    return parcels
      .filter((p) => p.structure > 0 && p.structure <= 10)
      .map((p) => {
        const { centerX, centerZ, centerY } = calculateParcelCenter(p.bounds);
        const faction: Faction = p.kingdom === 'North' ? 'north' : 'south';

        // Retrieve structure 3D model
        const model = modelManager.getStructureByEnum(p.structure, faction) || new THREE.Group();
        const cloned = model.clone();

        // Track windmill rotors for rotation animation using cloned object hierarchy
        if (p.structure === StructureTypeEnum.Farmstead) {
          const rotor = cloned.getObjectByName('WindmillRotor') as THREE.Group | null;
          if (rotor) {
            windmillRotors.current.push(rotor);
          }
        }

        const info = STRUCTURE_BUILD_INFO[p.structure] || {
          width: 8,
          depth: 8,
        };

        return {
          parcelId: p.id,
          structureType: p.structure,
          position: [centerX, centerY, centerZ] as [number, number, number],
          model: cloned,
          width: info.width,
          depth: info.depth,
        };
      });
  }, [parcels]);

  // View-distance LOD filtering relative to player
  const visibleStructures = useMemo(() => {
    if (!playerPosition) return activeStructures;
    const px = Array.isArray(playerPosition) ? playerPosition[0] : (playerPosition as any).x;
    const pz = Array.isArray(playerPosition) ? playerPosition[2] : (playerPosition as any).z;

    return activeStructures.filter((s) => {
      const [sx, , sz] = s.position;
      const distSq = (sx - px) * (sx - px) + (sz - pz) * (sz - pz);
      return distSq <= maxViewDistance * maxViewDistance;
    });
  }, [activeStructures, playerPosition, maxViewDistance]);

  // Animate windmill rotors
  useFrame((_, delta) => {
    for (const rotor of windmillRotors.current) {
      if (rotor && rotor.rotation) {
        rotor.rotation.z += delta * 1.5;
      }
    }
  });

  return (
    <group name="StructureManager_Root">
      {visibleStructures.map(({ parcelId, structureType, position, model, width, depth }) => (
        <RigidBody
          key={`structure_body_${parcelId}`}
          type="fixed"
          colliders={false}
          position={position}
          name={`Structure_${parcelId}_Type_${structureType}`}
        >
          {/* Rapier Physics Box Collider matching building footprint */}
          <CuboidCollider
            args={[width * 0.45, 4.0, depth * 0.45]}
            position={[0, 4.0, 0]}
          />

          {/* 3D Visual Mesh */}
          <primitive object={model} />
        </RigidBody>
      ))}
    </group>
  );
}

export default StructureManager;
