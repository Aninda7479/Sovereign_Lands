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
import { AISettingsModal } from '@/components/ai-connection/AISettingsModal';
import { AIStatusBadge } from '@/components/ai-connection/AIStatusBadge';
import { TacticalOverlayHUD } from '@/components/tactical-map/TacticalOverlayHUD';
import { TransactionToast, TxStatus } from '@/components/web3-hud/TransactionToast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { UnderConstruction } from '@/components/ui/UnderConstruction';

import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';
import { getParcelAtPosition, ParcelEntity } from '@/lib/world/parcelCoordinates';
import { StructureTypeEnum } from '@/lib/assets/modelRegistry';

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
  const [isCouncilOpen, setIsCouncilOpen] = useState(false);
  const [isTacticalOpen, setIsTacticalOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [activeNpc, setActiveNpc] = useState<string | null>(null);
  const [isBuildingMode, setIsBuildingMode] = useState(false);
  const [buildStructureType, setBuildStructureType] = useState<StructureTypeEnum>(
    StructureTypeEnum.Farmstead
  );

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

  // Determine current contextual prompt action
  const promptAction = useMemo<PromptActionType | null>(() => {
    // If dialogue or modal is open, suppress world prompts
    if (activeNpc || isCouncilOpen || isTacticalOpen || isAISettingsOpen) {
      return null;
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
    activeNpc,
    isCouncilOpen,
    isTacticalOpen,
    isAISettingsOpen,
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

  const handleTriggerAction = useCallback(() => {
    switch (promptAction) {
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
  }, [promptAction, handleClaimOrBuy, handleHarvestGold]);

  // Keyboard Shortcuts for GTA-style Interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setIsCouncilOpen(false);
        setIsTacticalOpen(false);
        setIsAISettingsOpen(false);
        setActiveNpc(null);
        setIsBuildingMode(false);
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        if (promptAction === 'buy') {
          handleClaimOrBuy();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (promptAction === 'harvest') {
          handleHarvestGold();
        } else if (isNearWarTable) {
          setIsTacticalOpen(true);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setIsBuildingMode((prev) => !prev);
      } else if (e.key === 'v' || e.key === 'V') {
        setIsCouncilOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsTacticalOpen((prev) => !prev);
      } else if (e.key === 'k' || e.key === 'K') {
        setIsAISettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptAction, handleClaimOrBuy, handleHarvestGold, isNearWarTable]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas Viewport */}
      <GameCanvas showLighting={false}>
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
        />
      </GameCanvas>

      {/* 2D HUD Overlays */}
      {/* Top Resource HUD & Wallet Connect */}
      <TopResourceHUD
        onOpenCouncil={() => setIsCouncilOpen(true)}
        onOpenBuildMenu={() => setIsBuildingMode((prev) => !prev)}
      />

      {/* Top Compass Heading Tape */}
      <Suspense fallback={null}>
        <CompassHeading
          cameraYaw={cameraYaw}
          playerPosition={playerPosition}
          activeWaypoint={activeWaypoint}
        />
      </Suspense>

      {/* GTA-style Mission Tracker in Top-Left */}
      <Suspense
        fallback={
          <div className="absolute top-20 left-6 z-20">
            <UnderConstruction moduleName="Quest Tracker" agentId="agent-12" compact />
          </div>
        }
      >
        <QuestObjectiveHUD
          onWaypointChange={setActiveWaypoint}
        />
      </Suspense>

      {/* Circular Radar Mini-Map in Bottom-Left */}
      <Suspense
        fallback={
          <div className="absolute bottom-6 left-6 z-30">
            <UnderConstruction moduleName="Radar Mini-Map" agentId="agent-12" compact />
          </div>
        }
      >
        <RadarMiniMap
          playerPosition={playerPosition}
          cameraYaw={cameraYaw}
          activeWaypoint={activeWaypoint}
          onSelectWaypoint={setActiveWaypoint}
        />
      </Suspense>

      {/* AI Connection Status Pill (Bottom-Right / Top-Right) */}
      <div className="fixed top-20 right-6 z-30 pointer-events-auto">
        <AIStatusBadge
          onOpenSettings={() => setIsAISettingsOpen(true)}
        />
      </div>

      {/* GTA Contextual Interaction Prompt (Bottom-Center) */}
      <InteractionPrompt
        actionType={promptAction}
        parcelId={currentParcel?.id}
        goldReward={25}
        priceEth="0.01"
        onTrigger={handleTriggerAction}
      />

      {/* Cinematic GTA / Witcher NPC Dialogue HUD */}
      <DialogueHUD
        isOpen={Boolean(activeNpc)}
        npcId={activeNpc}
        onClose={() => setActiveNpc(null)}
        worldContext={{
          currentKingdom: currentParcel?.kingdom || 'North',
          playerGold,
          timeOfDay: gameState.timeOfDay,
        }}
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

      {/* BYOAI Hub & LLM Key Vault Modal ([K]) */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
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
