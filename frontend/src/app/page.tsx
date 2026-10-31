'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useAccount } from 'wagmi';

import { GameProvider, useGameState } from '@/providers/GameProvider';
import { GameCanvas } from '@/components/canvas/GameCanvas';
import { MainScene } from '@/components/scene/MainScene';
import { TopResourceHUD } from '@/components/web3-hud/TopResourceHUD';
import { RadarMiniMap, WaypointData } from '@/components/minimap/RadarMiniMap';
import { CompassHeading } from '@/components/minimap/CompassHeading';
import { QuestObjectiveHUD } from '@/components/minimap/QuestObjectiveHUD';
import { InteractionPrompt, PromptActionType } from '@/components/web3-hud/InteractionPrompt';
import { DialogueHUD } from '@/components/npc-dialogue/DialogueHUD';
import { CitadelCouncilModal } from '@/components/web3-hud/CitadelCouncilModal';
import { GameSettingsModal } from '@/components/settings/GameSettingsModal';
import { PauseEscapeMenu } from '@/components/settings/PauseEscapeMenu';
import { TacticalOverlayHUD } from '@/components/tactical-map/TacticalOverlayHUD';
import { BuildingMenuHUD } from '@/components/world/BuildingMenuHUD';
import { TransactionToast, TxStatus } from '@/components/web3-hud/TransactionToast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';
import { getParcelAtPosition, ParcelEntity } from '@/lib/world/parcelCoordinates';
import { StructureTypeEnum } from '@/lib/assets/modelRegistry';
import { STRUCTURE_BUILD_INFO } from '@/hooks/useBuildingPlacement';
import { npcManager } from '../../../ai-system/npc-engine/NPCManager';
import { soundManager } from '@/lib/audio/SoundManager';

/**
 * Inner Game Content connecting 3D Canvas, Web3 contracts, and GTA-style HUD overlays.
 */
function GameWorldContent() {
  const { address } = useAccount();
  const {
    allParcels,
    playerGold,
    pendingGold,
    buyParcel,
    claimGold,
    constructStructure,
    isTransacting,
  } = useParcelContract();
  const { northStats, southStats } = useKingdomTreasury();

  // Unified Game State
  const gameState = useGameState();

  // Player spatial tracking
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 2.0, 0]);
  const [cameraYaw, setCameraYaw] = useState<number>(0);
  const [activeWaypoint, setActiveWaypoint] = useState<WaypointData | null>(null);

  // Modals & Dialogue UI state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'wallet' | 'ai' | 'controls' | 'kingdom' | 'display'
  >('wallet');
  const [isCouncilOpen, setIsCouncilOpen] = useState(false);
  const [isTacticalOpen, setIsTacticalOpen] = useState(false);
  const [activeNpc, setActiveNpc] = useState<string | null>(null);
  const [isBuildingMode, setIsBuildingMode] = useState(false);

  // Clean Screen & HUD Density State (Defaults set to clean & uncluttered)
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showCompass, setShowCompass] = useState<boolean>(false); // Hidden by default for clean screen
  const [showQuestHUD, setShowQuestHUD] = useState<boolean>(false); // Hidden by default for clean screen
  const [showPostProcessing, setShowPostProcessing] = useState<boolean>(true);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('medium');

  const [buildStructureType, setBuildStructureType] = useState<StructureTypeEnum>(
    StructureTypeEnum.Farmstead
  );

  // Check if any modal or menu is actively obstructing gameplay
  const isAnyModalOpen = useMemo(() => {
    return (
      isPaused ||
      isSettingsOpen ||
      isCouncilOpen ||
      isTacticalOpen ||
      Boolean(activeNpc)
    );
  }, [isPaused, isSettingsOpen, isCouncilOpen, isTacticalOpen, activeNpc]);

  // Transaction Toast state
  const [txToast, setTxToast] = useState<{
    status: TxStatus;
    txHash: string | null;
    title?: string;
    description?: string;
  }>({
    status: 'idle',
    txHash: null,
  });

  // Calculate current parcel under player
  const currentParcel = useMemo<ParcelEntity | null>(() => {
    return getParcelAtPosition(playerPosition[0], playerPosition[2], allParcels);
  }, [playerPosition, allParcels]);

  // Check proximity to Citadel War Table ([25, 1.4, -95])
  const isNearWarTable = useMemo(() => {
    const dx = playerPosition[0] - 25;
    const dz = playerPosition[2] - (-95);
    return Math.hypot(dx, dz) < 4.5;
  }, [playerPosition]);

  // Check proximity to nearby living NPCs
  const nearestNpc = useMemo(() => {
    return npcManager.getNearestNPC();
  }, [playerPosition]);

  // Determine current contextual prompt action
  const promptAction = useMemo<PromptActionType | null>(() => {
    // If dialogue or modal is open, suppress world prompts
    if (isAnyModalOpen) {
      return null;
    }

    if (nearestNpc) {
      return 'npc';
    }

    if (isNearWarTable) {
      return 'council';
    }

    if (currentParcel) {
      const isUnclaimed =
        !currentParcel.owner ||
        currentParcel.owner === '0x0000000000000000000000000000000000000000' ||
        currentParcel.owner === '';

      if (isUnclaimed) {
        return 'buy';
      }

      const isOwner =
        Boolean(address) &&
        Boolean(currentParcel.owner) &&
        currentParcel.owner.toLowerCase() === address?.toLowerCase();

      if (isOwner) {
        if (currentParcel.structure === StructureTypeEnum.Farmstead) {
          return 'harvest';
        }
        return 'build';
      }
    }

    if (isBuildingMode) {
      return 'build';
    }

    return null;
  }, [
    isAnyModalOpen,
    isNearWarTable,
    currentParcel,
    address,
    isBuildingMode,
  ]);

  // Action Handlers
  const handleClaimOrBuy = useCallback(async () => {
    if (!currentParcel) return;
    setTxToast({
      status: 'mining',
      txHash: null,
      title: 'Claiming Sovereign Parcel',
      description: `Broadcasting claim for Plot #${currentParcel.id} to Polygon Amoy...`,
    });
    try {
      const hash = await buyParcel(currentParcel.id);
      setTxToast({
        status: 'confirmed',
        txHash: hash || '0x4f8a...Amoy',
        title: 'Frontier Parcel Claimed!',
        description: `Successfully staked sovereignty over Plot #${currentParcel.id}.`,
      });
    } catch (err: any) {
      setTxToast({
        status: 'failed',
        txHash: null,
        title: 'Claim Failed',
        description: err?.message || 'Transaction was rejected or timed out.',
      });
    }
  }, [currentParcel, buyParcel]);

  const handleHarvestGold = useCallback(async () => {
    if (!currentParcel) return;
    setTxToast({
      status: 'mining',
      txHash: null,
      title: 'Harvesting Gold',
      description: `Collecting grain tithes from Farmstead on Plot #${currentParcel.id}...`,
    });
    try {
      const hash = await claimGold(currentParcel.id);
      setTxToast({
        status: 'confirmed',
        txHash: hash || '0x8b3c...Amoy',
        title: 'Royal Harvest Complete!',
        description: 'Gold transferred directly to your sovereign balance.',
      });
    } catch (err: any) {
      setTxToast({
        status: 'failed',
        txHash: null,
        title: 'Harvest Failed',
        description: err?.message || 'Unable to harvest at this time.',
      });
    }
  }, [currentParcel, claimGold]);

  const handleConfirmBuild = useCallback(async () => {
    if (!currentParcel) return;
    const info = STRUCTURE_BUILD_INFO[buildStructureType];
    const structureName = info?.name || 'Structure';
    setTxToast({
      status: 'mining',
      txHash: null,
      title: `Constructing ${structureName}`,
      description: `Broadcasting construction of Plot #${currentParcel.id} to blockchain...`,
    });
    try {
      const hash = await constructStructure(currentParcel.id, buildStructureType);
      setTxToast({
        status: 'confirmed',
        txHash: hash || '0x5c9f...Amoy',
        title: `${structureName} Completed!`,
        description: `Successfully erected on Plot #${currentParcel.id}.`,
      });
      setIsBuildingMode(false);
    } catch (err: any) {
      setTxToast({
        status: 'failed',
        txHash: null,
        title: 'Construction Failed',
        description: err?.message || 'Transaction rejected or insufficient funds.',
      });
    }
  }, [currentParcel, buildStructureType, constructStructure]);

  const handleTriggerAction = useCallback(() => {
    switch (promptAction) {
      case 'npc':
        if (nearestNpc) {
          setActiveNpc(nearestNpc.id);
        }
        break;
      case 'buy':
        handleClaimOrBuy();
        break;
      case 'harvest':
        handleHarvestGold();
        break;
      case 'council':
        setIsTacticalOpen(true);
        break;
      case 'build':
        setIsBuildingMode((prev) => !prev);
        break;
    }
  }, [promptAction, nearestNpc, handleClaimOrBuy, handleHarvestGold]);

  // Respawn Handler
  const handleRespawn = useCallback(() => {
    setPlayerPosition([0, 2.0, 0]);
    if (gameState.setPlayerPosition) {
      gameState.setPlayerPosition([0, 2.0, 0]);
    }
  }, [gameState]);

  // Keyboard Shortcuts for GTA-style Interaction & Escape Pause Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Escape or X key: Pause Menu / Back / Close
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        if (activeNpc) {
          setActiveNpc(null);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isCouncilOpen) {
          setIsCouncilOpen(false);
          return;
        }
        if (isTacticalOpen) {
          setIsTacticalOpen(false);
          return;
        }
        if (isBuildingMode) {
          setIsBuildingMode(false);
          return;
        }

        // Toggle Escape Pause Menu
        setIsPaused((prev) => {
          const next = !prev;
          soundManager.playMenuChime(next);
          if (next && typeof document !== 'undefined' && document.pointerLockElement) {
            document.exitPointerLock?.();
          }
          return next;
        });
        return;
      }

      // If pause menu or any modal is open, suppress world hotkeys
      if (isAnyModalOpen) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        if (promptAction === 'buy') {
          handleClaimOrBuy();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        const nearestNpc = npcManager.getNearestNPCId();
        if (nearestNpc && !activeNpc) {
          setActiveNpc(nearestNpc);
          return;
        }
        if (promptAction === 'harvest') {
          handleHarvestGold();
        } else if (isNearWarTable) {
          setIsTacticalOpen(true);
        } else if (promptAction === 'build') {
          setIsBuildingMode((prev) => !prev);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setIsBuildingMode((prev) => !prev);
      } else if (e.key === 'v' || e.key === 'V') {
        setIsCouncilOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsTacticalOpen((prev) => !prev);
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'o' || e.key === 'O') {
        // Quest HUD quick toggle
        setShowQuestHUD((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnyModalOpen,
    activeNpc,
    isSettingsOpen,
    isCouncilOpen,
    isTacticalOpen,
    isBuildingMode,
    promptAction,
    handleClaimOrBuy,
    handleHarvestGold,
    isNearWarTable,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas Viewport */}
      <GameCanvas showLighting={false} graphicsQuality={graphicsQuality}>
        <MainScene
          parcels={allParcels}
          connectedPlayerAddress={address}
          selectedParcelId={currentParcel?.id ?? null}
          playerPosition={playerPosition}
          onPlayerPositionChange={setPlayerPosition}
          onCameraYawChange={setCameraYaw}
          onOpenWarTable={() => setIsTacticalOpen(true)}
          onInteractNPC={(npcId) => setActiveNpc(npcId)}
          activeNpcDialogue={activeNpc}
          isBuildingMode={isBuildingMode}
          buildStructureType={buildStructureType}
          showLighting={true}
          showPostProcessing={false} // Canvas already has outer vignette
          isPointerLockDisabled={isAnyModalOpen}
          graphicsQuality={graphicsQuality}
        />
      </GameCanvas>

      {/* 2D HUD Overlays */}
      {/* Top Resource HUD (Cleaned: Connect Wallet moved into Settings) */}
      <TopResourceHUD
        onOpenCouncil={() => setIsCouncilOpen(true)}
        onOpenBuildMenu={() => setIsBuildingMode((prev) => !prev)}
        onOpenSettings={() => {
          setIsPaused(true);
          soundManager.playMenuChime(true);
          if (typeof document !== 'undefined' && document.pointerLockElement) {
            document.exitPointerLock?.();
          }
        }}
      />

      {/* Top Compass Heading Tape (Toggleable in Settings, Default Hidden) */}
      {showCompass && (
        <Suspense fallback={null}>
          <CompassHeading
            cameraYaw={cameraYaw}
            playerPosition={playerPosition}
            activeWaypoint={activeWaypoint}
          />
        </Suspense>
      )}

      {/* GTA-style Mission Tracker (Toggleable in Settings, Default Hidden) */}
      {showQuestHUD && (
        <Suspense fallback={null}>
          <QuestObjectiveHUD
            onWaypointChange={setActiveWaypoint}
            defaultCollapsed={false}
          />
        </Suspense>
      )}

      {/* Circular Radar Mini-Map in Bottom-Left (Toggleable in Settings) */}
      {showRadar && (
        <Suspense fallback={null}>
          <RadarMiniMap
            playerPosition={playerPosition}
            cameraYaw={cameraYaw}
            activeWaypoint={activeWaypoint}
            onSelectWaypoint={setActiveWaypoint}
          />
        </Suspense>
      )}

      {/* GTA Contextual Interaction Prompt (Bottom-Center) */}
      <InteractionPrompt
        actionType={promptAction}
        parcelId={currentParcel?.id}
        npcName={nearestNpc?.name}
        npcRole={nearestNpc?.role}
        goldReward={25}
        priceEth="0.01"
        onTrigger={handleTriggerAction}
      />

      {/* Cinematic GTA / Witcher NPC Dialogue HUD */}
      <DialogueHUD
        isOpen={Boolean(activeNpc)}
        npcId={activeNpc}
        onClose={() => setActiveNpc(null)}
        onOpenSettings={() => {
          setSettingsInitialTab('ai');
          setIsSettingsOpen(true);
        }}
        worldContext={{
          currentKingdom: currentParcel?.kingdom || 'North',
          playerGold,
          timeOfDay: gameState.timeOfDay,
        }}
      />

      {/* Royal Architect & Construction Registry HUD ([C]) */}
      <BuildingMenuHUD
        isOpen={isBuildingMode}
        selectedStructure={buildStructureType}
        playerGold={playerGold}
        onSelectStructure={setBuildStructureType}
        onConfirmBuild={handleConfirmBuild}
        onClose={() => setIsBuildingMode(false)}
        canBuildHere={
          Boolean(currentParcel) &&
          Boolean(address) &&
          Boolean(currentParcel?.owner) &&
          currentParcel?.owner?.toLowerCase() === address?.toLowerCase()
        }
        validationReason={
          !currentParcel
            ? 'Must be standing within an owned parcel to construct'
            : !address
            ? 'Connect wallet or claim parcel in demo mode'
            : currentParcel.owner?.toLowerCase() !== address?.toLowerCase()
            ? 'You do not own this territory'
            : playerGold < (STRUCTURE_BUILD_INFO[buildStructureType]?.goldCost || 50)
            ? `Insufficient gold (Need ${STRUCTURE_BUILD_INFO[buildStructureType]?.goldCost}g, have ${playerGold}g)`
            : null
        }
      />

      {/* Citadel Council Governance Modal ([V]) */}
      <CitadelCouncilModal
        isOpen={isCouncilOpen}
        onClose={() => setIsCouncilOpen(false)}
        playerKingdom={currentParcel?.kingdom === 'South' ? 'South' : 'North'}
      />

      {/* Full-Screen Citadel War Table & Tactical Command ([M]) */}
      <TacticalOverlayHUD
        isOpen={isTacticalOpen}
        onClose={() => setIsTacticalOpen(false)}
        playerKingdom={currentParcel?.kingdom === 'South' ? 'South' : 'North'}
      />

      {/* Dedicated Escape / Pause Action Menu ([Esc] or [X]) */}
      <PauseEscapeMenu
        isOpen={isPaused && !isSettingsOpen}
        onResume={() => setIsPaused(false)}
        onOpenSettings={(tab) => {
          if (tab) setSettingsInitialTab(tab);
          setIsSettingsOpen(true);
        }}
        onRespawn={handleRespawn}
        hudSettings={{
          showRadar,
          setShowRadar,
          showCompass,
          setShowCompass,
          showQuestHUD,
          setShowQuestHUD,
          showPostProcessing,
          setShowPostProcessing,
        }}
        graphicsQuality={graphicsQuality}
        setGraphicsQuality={setGraphicsQuality}
      />

      {/* Master Settings Hub (Wallet, AI Key Vault, Controls, Display, Realm) */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => setIsSettingsOpen(false)}
        hudSettings={{
          showRadar,
          setShowRadar,
          showCompass,
          setShowCompass,
          showQuestHUD,
          setShowQuestHUD,
          showPostProcessing,
          setShowPostProcessing,
        }}
        graphicsQuality={graphicsQuality}
        setGraphicsQuality={setGraphicsQuality}
      />

      {/* Web3 Mining & Confirmation Toast */}
      <TransactionToast
        status={txToast.status}
        txHash={txToast.txHash}
        title={txToast.title}
        description={txToast.description}
        onDismiss={() => setTxToast((prev) => ({ ...prev, status: 'idle' }))}
      />
    </main>
  );
}

/**
 * Root Game Page with Client Hydration Guard and Unified Game Provider
 */
export default function GamePage() {
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  if (!isClientMounted) {
    return <LoadingScreen progress={55} statusText="Initializing WebGL & Polygon World..." />;
  }

  return (
    <GameProvider>
      <GameWorldContent />
    </GameProvider>
  );
}
