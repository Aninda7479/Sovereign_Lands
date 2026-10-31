'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ParcelEntity, getTerrainHeight } from '@/lib/world/parcelCoordinates';
import { createBoundaryPillarModel, BoundaryPillarType } from '@/lib/assets/proceduralModels';

export interface ParcelBoundaryRendererProps {
  parcels: ParcelEntity[];
  connectedPlayerAddress?: string;
  selectedParcelId?: number | null;
  onSelectParcel?: (parcel: ParcelEntity) => void;
}

/**
 * Renders glowing 3D parcel boundaries on the landscape:
 * - 4 Corner Boundary Pillars with hovering beacon crystals.
 * - Glowing perimeter perimeter lines conforming to terrain contours.
 * - Color codes: Blue (North), Red (South), Gold (Player-owned), White pulse (Unclaimed).
 */
export function ParcelBoundaryRenderer({
  parcels,
  connectedPlayerAddress,
  selectedParcelId,
}: ParcelBoundaryRendererProps) {
  // Compute corner pillar placements & boundary line ribbons for all parcels
  const renderedParcels = useMemo(() => {
    return parcels.map((parcel) => {
      const { minX, minZ, maxX, maxZ } = parcel.bounds;

      const isOwnedByPlayer =
        Boolean(connectedPlayerAddress) &&
        Boolean(parcel.owner) &&
        parcel.owner.toLowerCase() === connectedPlayerAddress?.toLowerCase();

      const isUnclaimed =
        !parcel.owner ||
        parcel.owner === '0x0000000000000000000000000000000000000000' ||
        parcel.owner === '';

      let pillarType: BoundaryPillarType = 'north';
      let colorHex = '#38bdf8'; // North Cyan

      if (isOwnedByPlayer) {
        pillarType = 'player';
        colorHex = '#facc15'; // Golden Domain
      } else if (isUnclaimed) {
        pillarType = 'unclaimed';
        colorHex = '#e2e8f0'; // Faint White
      } else if (parcel.kingdom === 'South') {
        pillarType = 'south';
        colorHex = '#ef4444'; // South Crimson
      }

      // Compute terrain elevation at the 4 corners
      const y1 = getTerrainHeight(minX, minZ);
      const y2 = getTerrainHeight(maxX, minZ);
      const y3 = getTerrainHeight(maxX, maxZ);
      const y4 = getTerrainHeight(minX, maxZ);

      const corners: Array<[number, number, number]> = [
        [minX, y1, minZ],
        [maxX, y2, minZ],
        [maxX, y3, maxZ],
        [minX, y4, maxZ],
      ];

      // Build closed loop line geometry connecting the 4 corners
      const linePositions = new Float32Array([
        minX, y1 + 0.15, minZ,   maxX, y2 + 0.15, minZ,
        maxX, y2 + 0.15, minZ,   maxX, y3 + 0.15, maxZ,
        maxX, y3 + 0.15, maxZ,   minX, y4 + 0.15, maxZ,
        minX, y4 + 0.15, maxZ,   minX, y1 + 0.15, minZ,
      ]);

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      return {
        parcel,
        pillarType,
        colorHex,
        corners,
        lineGeo,
        isSelected: parcel.id === selectedParcelId,
      };
    });
  }, [parcels, connectedPlayerAddress, selectedParcelId]);

  return (
    <group name="ParcelBoundaryRenderer_Root">
      {renderedParcels.map(({ parcel, pillarType, colorHex, corners, lineGeo, isSelected }) => (
        <group key={`parcel_boundary_${parcel.id}`} name={`Parcel_${parcel.id}_Boundary`}>
          {/* 4 Corner Rune Boundary Pillars */}
          {corners.map((pos, cIdx) => (
            <group key={`corner_${parcel.id}_${cIdx}`} position={pos}>
              <primitive object={createBoundaryPillarModel(pillarType, 3.2)} />
            </group>
          ))}

          {/* Glowing Ground Perimeter Lines */}
          <lineSegments geometry={lineGeo}>
            <lineBasicMaterial
              color={isSelected ? '#ffffff' : colorHex}
              linewidth={isSelected ? 3 : 2}
              transparent
              opacity={isSelected ? 1.0 : 0.75}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

export default ParcelBoundaryRenderer;
