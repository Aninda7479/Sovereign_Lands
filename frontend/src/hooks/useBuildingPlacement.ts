'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ParcelEntity,
  isStructureWithinBounds,
  snapToGrid,
  getTerrainHeight,
} from '@/lib/world/parcelCoordinates';
import { StructureTypeEnum } from '@/lib/assets/modelRegistry';

export interface StructureBuildCost {
  type: StructureTypeEnum;
  name: string;
  goldCost: number;
  width: number;
  depth: number;
  description: string;
}

export const STRUCTURE_BUILD_INFO: Record<number, StructureBuildCost> = {
  [StructureTypeEnum.Farmstead]: {
    type: StructureTypeEnum.Farmstead,
    name: 'Farmstead',
    goldCost: 50,
    width: 16.0,
    depth: 16.0,
    description: '+5 Gold/min passive income (10% kingdom tithe)',
  },
  [StructureTypeEnum.GuardTower]: {
    type: StructureTypeEnum.GuardTower,
    name: 'Guard Tower',
    goldCost: 80,
    width: 5.2,
    depth: 5.2,
    description: '+8 Kingdom Defense against rival sieges',
  },
  [StructureTypeEnum.StoneWall]: {
    type: StructureTypeEnum.StoneWall,
    name: 'Stone Wall',
    goldCost: 60,
    width: 10.0,
    depth: 2.6,
    description: '+6 Kingdom Defense barricade',
  },
  [StructureTypeEnum.CastleKeep]: {
    type: StructureTypeEnum.CastleKeep,
    name: 'Castle Keep',
    goldCost: 150,
    width: 16.0,
    depth: 16.0,
    description: '+10 Attack, +5 Defense citadel fortress',
  },
};

export interface UseBuildingPlacementProps {
  currentParcel: ParcelEntity | null;
  playerGold: number;
  connectedPlayerAddress?: string;
  onExecuteBuild?: (parcelId: number, structureType: number) => Promise<void> | void;
}

/**
 * Building placement state machine for GTA / Rust style in-world construction.
 * Snaps holographic preview to grid, verifies boundaries and gold, and triggers transactions.
 */
export function useBuildingPlacement({
  currentParcel,
  playerGold,
  connectedPlayerAddress,
  onExecuteBuild,
}: UseBuildingPlacementProps) {
  const [isBuildModeActive, setIsBuildModeActive] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<StructureTypeEnum>(
    StructureTypeEnum.Farmstead
  );
  const [ghostCoords, setGhostCoords] = useState<[number, number]>([0, 0]);

  // Toggle building mode (e.g. key [C])
  const toggleBuildMode = useCallback(() => {
    setIsBuildModeActive((prev) => !prev);
  }, []);

  const selectStructure = useCallback((type: StructureTypeEnum) => {
    setSelectedStructure(type);
  }, []);

  // Update aiming cursor / placement position
  const updateAimPosition = useCallback((rawX: number, rawZ: number) => {
    const snappedX = snapToGrid(rawX, 2.0);
    const snappedZ = snapToGrid(rawZ, 2.0);
    setGhostCoords([snappedX, snappedZ]);
  }, []);

  // Validation
  const validation = useMemo(() => {
    const info = STRUCTURE_BUILD_INFO[selectedStructure];
    if (!info) {
      return { isValid: false, reason: 'Invalid structure type' };
    }

    if (!currentParcel) {
      return { isValid: false, reason: 'Must be standing on an owned parcel to build' };
    }

    // Verify ownership
    const isOwner =
      Boolean(connectedPlayerAddress) &&
      Boolean(currentParcel.owner) &&
      currentParcel.owner.toLowerCase() === connectedPlayerAddress?.toLowerCase();

    if (!isOwner) {
      return { isValid: false, reason: 'You do not own this territory' };
    }

    // Verify gold balance
    if (playerGold < info.goldCost) {
      return {
        isValid: false,
        reason: `Insufficient gold: Need ${info.goldCost}g, have ${playerGold}g`,
      };
    }

    // Check bounds containment
    const [gx, gz] = ghostCoords;
    const fits = isStructureWithinBounds(gx, gz, info.width, info.depth, currentParcel.bounds);
    if (!fits) {
      return { isValid: false, reason: 'Placement extends outside parcel boundaries' };
    }

    return { isValid: true, reason: null };
  }, [selectedStructure, currentParcel, connectedPlayerAddress, playerGold, ghostCoords]);

  // Compute 3D position (with ground elevation)
  const ghostPosition: [number, number, number] = useMemo(() => {
    const [x, z] = ghostCoords;
    const y = getTerrainHeight(x, z);
    return [x, y, z];
  }, [ghostCoords]);

  // Confirm build placement
  const confirmPlacement = useCallback(async () => {
    if (!validation.isValid || !currentParcel) return;
    await onExecuteBuild?.(currentParcel.id, selectedStructure);
    setIsBuildModeActive(false);
  }, [validation.isValid, currentParcel, selectedStructure, onExecuteBuild]);

  return {
    isBuildModeActive,
    setIsBuildModeActive,
    toggleBuildMode,
    selectedStructure,
    selectStructure,
    ghostPosition,
    updateAimPosition,
    isValidPlacement: validation.isValid,
    validationError: validation.reason,
    activeStructureInfo: STRUCTURE_BUILD_INFO[selectedStructure],
    confirmPlacement,
  };
}

export default useBuildingPlacement;
