'use client';

import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { Physics } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { SceneLighting } from '@/components/canvas/SceneLighting';
import { PostProcessing } from '@/components/canvas/PostProcessing';
import { OpenWorldTerrain } from '@/components/world/OpenWorldTerrain';
import { WaterRiver } from '@/components/world/WaterRiver';
import { ParcelBoundaryRenderer } from '@/components/world/ParcelBoundaryRenderer';
import { StructureManager } from '@/components/world/StructureManager';
import { HologramBuildPreview } from '@/components/world/HologramBuildPreview';
import { PlayerController } from '@/components/character/PlayerController';
import { NPCWorldEntity as BaseNPCWorldEntity } from '@/components/npc-dialogue/NPCWorldEntity';
import {
  NPC_PROFILES,
  getNPCProfileById,
  NPCProfile,
  NPCId,
} from '../../../../ai-system/npc-engine/NPCProfiles';
import { WarTableEntity } from '@/components/tactical-map/WarTableEntity';
import { ParcelEntity, snapToGrid, getTerrainHeight } from '@/lib/world/parcelCoordinates';
import { StructureTypeEnum } from '@/lib/assets/modelRegistry';
import { useGameState, GameStateContextType } from '@/providers/GameProvider';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useAccount } from 'wagmi';

/**
 * Real-Time Multiplayer Remote Players List
 * Safe container for remote player entities (Agent 17 replication)
 */
export function RemotePlayersList() {
  return <group name="RemotePlayersList" />;
}

export interface NPCWorldEntityWrapperProps {
  npcId?: string;
  profile?: NPCProfile;
  playerPosition?: [number, number, number];
  onInteract?: (npcId: string) => void;
  isConversingWithThisNPC?: boolean;
}

/**
 * NPCWorldEntity adapter accepting either an npcId string or full NPCProfile object
 */
export function NPCWorldEntity({
  npcId,
  profile,
  playerPosition,
  onInteract,
  isConversingWithThisNPC,
}: NPCWorldEntityWrapperProps) {
  const targetProfile = useMemo(() => {
    if (profile) return profile;
    if (npcId) {
      return NPC_PROFILES[npcId as NPCId] || getNPCProfileById(npcId);
    }
    return null;
  }, [npcId, profile]);

  if (!targetProfile) return null;

  return (
    <BaseNPCWorldEntity
      profile={targetProfile}
      playerPosition={playerPosition}
      onInteract={onInteract}
      isConversingWithThisNPC={isConversingWithThisNPC}
    />
  );
}

export interface MainSceneProps {
  parcels?: ParcelEntity[];
  connectedPlayerAddress?: string;
  selectedParcelId?: number | null;
  onSelectParcel?: (parcel: ParcelEntity) => void;
  initialPlayerPosition?: [number, number, number];
  onPlayerPositionChange?: (position: [number, number, number]) => void;
  onCameraYawChange?: (yaw: number) => void;
  onParcelAction?: (action: 'interact' | 'build' | 'buy') => void;
  onOpenWarTable?: () => void;
  onInteractNPC?: (npcId: string) => void;
  activeNpcDialogue?: string | null;
  timeOfDay?: 'day' | 'sunset' | 'night';
  showLighting?: boolean;
  showPostProcessing?: boolean;
  isBuildingMode?: boolean;
  buildStructureType?: StructureTypeEnum;
  buildPosition?: [number, number, number];
  isBuildValid?: boolean;
  playerFaction?: 'north' | 'south' | 'neutral';
}

/**
 * Sovereign Lands Master 3D Scene
 * Assembles atmospheric lighting, Rapier physics world, rolling terrain, river divide,
 * parcel boundaries, constructed structures, hologram preview, character controller,
 * multiplayer remote players, roaming AI NPCs, and citadel war table.
 */
export function MainScene({
  parcels,
  connectedPlayerAddress,
  selectedParcelId,
  onSelectParcel,
  initialPlayerPosition = [0, 2.0, 0],
  onPlayerPositionChange,
  onCameraYawChange,
  onParcelAction,
  onOpenWarTable,
  onInteractNPC,
  activeNpcDialogue,
  timeOfDay: propTimeOfDay,
  showLighting = true,
  showPostProcessing = true,
  isBuildingMode: propIsBuildingMode,
  buildStructureType = StructureTypeEnum.Farmstead,
  buildPosition: propBuildPosition,
  isBuildValid = true,
  playerFaction = 'north',
}: MainSceneProps) {
  // Attempt to read GameProvider context (gracefully fallback if rendered standalone)
  let gameState: Partial<GameStateContextType> = {};
  try {
    gameState = useGameState();
  } catch (err) {
    // Rendered outside of GameProvider
  }

  // Attempt to read on-chain parcels & web3 account if not provided via props
  let fallbackParcels: ParcelEntity[] = [];
  try {
    const { allParcels } = useParcelContract();
    fallbackParcels = allParcels;
  } catch (err) {
    // Wagmi context not mounted
  }

  let accountAddress: string | undefined = undefined;
  try {
    const { address } = useAccount();
    accountAddress = address;
  } catch (err) {
    // Wagmi not mounted
  }

  const effectiveParcels = parcels ?? fallbackParcels;
  const effectiveAddress = connectedPlayerAddress ?? accountAddress;
  const effectiveTimeOfDay = propTimeOfDay ?? gameState.timeOfDay ?? 'day';
  const effectiveIsBuildingMode = propIsBuildingMode ?? gameState.isBuildingMode ?? false;
  const effectiveActiveNpc = activeNpcDialogue ?? gameState.activeNpcDialogue ?? null;

  // Local state tracking for player position
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>(
    initialPlayerPosition
  );

  const handlePositionChange = useCallback(
    (newPos: [number, number, number]) => {
      setPlayerPosition(newPos);
      onPlayerPositionChange?.(newPos);
      if (gameState.setPlayerPosition) {
        gameState.setPlayerPosition(newPos);
      }
    },
    [onPlayerPositionChange, gameState]
  );

  const handleParcelAction = useCallback(
    (action: 'interact' | 'build' | 'buy') => {
      onParcelAction?.(action);
    },
    [onParcelAction]
  );

  const handleInteractNPC = useCallback(
    (npcId: string) => {
      if (onInteractNPC) {
        onInteractNPC(npcId);
      } else if (gameState.setActiveNpcDialogue) {
        gameState.setActiveNpcDialogue(npcId);
      }
    },
    [onInteractNPC, gameState]
  );

  const handleOpenWarTable = useCallback(() => {
    if (onOpenWarTable) {
      onOpenWarTable();
    } else if (gameState.setActiveModal) {
      gameState.setActiveModal('tactical');
    }
  }, [onOpenWarTable, gameState]);

  // Compute building hologram position in front of player
  const buildPosition = useMemo<[number, number, number]>(() => {
    if (propBuildPosition) return propBuildPosition;
    const snapX = snapToGrid(playerPosition[0]);
    const snapZ = snapToGrid(playerPosition[2] - 12);
    const snapY = getTerrainHeight(snapX, snapZ);
    return [snapX, snapY, snapZ];
  }, [propBuildPosition, playerPosition]);

  return (
    <>
      {/* Dynamic Atmospheric Scene Lighting */}
      {showLighting && (
        <SceneLighting timeOfDay={effectiveTimeOfDay} enableShadows />
      )}

      {/* Sovereign Rapier Physics World */}
      <Physics gravity={[0, -9.81, 0]}>
        {/* Continuous 3D Procedural Terrain & Vegetation */}
        <OpenWorldTerrain />

        {/* The Great Divide River & Fortified Stone Bridge */}
        <WaterRiver />

        {/* 3D Parcel Boundary Beacons & Energy Lines */}
        <ParcelBoundaryRenderer
          parcels={effectiveParcels}
          connectedPlayerAddress={effectiveAddress}
          selectedParcelId={selectedParcelId ?? gameState.selectedParcelId}
          onSelectParcel={onSelectParcel}
        />

        {/* Constructed Kingdom Structures & Windmills */}
        <StructureManager
          parcels={effectiveParcels}
          playerPosition={playerPosition}
        />

        {/* In-World Hologram Construction Ghost */}
        <HologramBuildPreview
          active={effectiveIsBuildingMode}
          structureType={buildStructureType}
          position={buildPosition}
          isValid={isBuildValid}
        />

        {/* GTA-Style 3D Character Controller with Orbit Camera */}
        <PlayerController
          initialPosition={initialPlayerPosition}
          faction={playerFaction}
          onPositionChange={handlePositionChange}
          onParcelAction={handleParcelAction}
        />

        {/* Real-Time Multiplayer Remote Players */}
        <RemotePlayersList />

        {/* Roaming AI NPCs */}
        <NPCWorldEntity
          npcId="aldric"
          playerPosition={playerPosition}
          onInteract={handleInteractNPC}
          isConversingWithThisNPC={effectiveActiveNpc === 'aldric'}
        />
        <NPCWorldEntity
          npcId="gareth"
          playerPosition={playerPosition}
          onInteract={handleInteractNPC}
          isConversingWithThisNPC={effectiveActiveNpc === 'gareth'}
        />

        {/* Citadel Strategic War Table */}
        <WarTableEntity
          position={[25, 1.4, -95]}
          kingdom="North"
          onOpenWarTable={handleOpenWarTable}
          playerPosition={playerPosition}
        />
      </Physics>

      {/* Cinematic Vignette Overlay via Drei Html inside Canvas */}
      {showPostProcessing && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <PostProcessing />
        </Html>
      )}
    </>
  );
}

export default MainScene;
