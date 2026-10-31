'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Crown, MessageSquare } from 'lucide-react';

import { createCharacterMesh, Faction } from '@/lib/assets/proceduralModels';
import { CharacterAnimation } from './CharacterAnimation';
import { NetworkedRemotePlayer, ActiveSpeechBubble, KingdomType } from '@/hooks/useMultiplayerSync';

export interface RemotePlayerEntityProps {
  player: NetworkedRemotePlayer;
  speechBubble?: ActiveSpeechBubble;
}

/**
 * Maps player kingdom to faction palette
 */
function kingdomToFaction(kingdom: KingdomType): Faction {
  if (kingdom === 'north') return 'north';
  if (kingdom === 'south') return 'south';
  return 'neutral';
}

/**
 * RemotePlayerEntity
 * 3D React Three Fiber entity representing another networked player in Sovereign Lands.
 * Features smooth dead-reckoning lerp locomotion, procedural animation, kingdom heraldry,
 * and hovering proximity speech bubbles.
 */
export function RemotePlayerEntity({ player, speechBubble }: RemotePlayerEntityProps) {
  const rootGroupRef = useRef<THREE.Group>(null);

  // Map kingdom to faction
  const faction = useMemo(() => kingdomToFaction(player.kingdom), [player.kingdom]);

  // Create procedural 3D model instance
  const characterGroup = useMemo(() => {
    return createCharacterMesh({ faction, isPlayer: false });
  }, [faction]);

  // Interpolated visual state
  const currentPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const currentRotY = useRef(player.rotationY);

  // Shorten wallet address for display
  const shortWallet = useMemo(() => {
    if (!player.walletAddress || player.walletAddress.length < 10) return '';
    return `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`;
  }, [player.walletAddress]);

  // Animation parameters derived from networked animState
  const animParams = useMemo(() => {
    switch (player.animState) {
      case 'run':
        return { speed: 8.0, isSprinting: true, isGrounded: true, verticalVelocity: 0 };
      case 'walk':
        return { speed: 3.5, isSprinting: false, isGrounded: true, verticalVelocity: 0 };
      case 'jump':
        return { speed: 3.5, isSprinting: false, isGrounded: false, verticalVelocity: 2.5 };
      case 'idle':
      default:
        return { speed: 0, isSprinting: false, isGrounded: true, verticalVelocity: 0 };
    }
  }, [player.animState]);

  // Smooth dead-reckoning interpolation loop
  useFrame((_, delta) => {
    if (!rootGroupRef.current) return;

    // 1. Position Interpolation (lerp toward target position)
    const lerpSpeed = Math.min(delta * 12, 1.0);
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, player.targetX, lerpSpeed);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, player.targetY, lerpSpeed);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, player.targetZ, lerpSpeed);

    rootGroupRef.current.position.copy(currentPos.current);

    // 2. Rotation Interpolation (shortest angular difference)
    const targetAngle = player.targetRotationY;
    const diff = ((targetAngle - currentRotY.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    currentRotY.current += diff * Math.min(delta * 14, 1.0);

    rootGroupRef.current.rotation.y = currentRotY.current;
  });

  // Badge colors based on kingdom
  const kingdomBadge = useMemo(() => {
    switch (player.kingdom) {
      case 'north':
        return {
          title: 'BOREAL',
          border: 'border-sky-500/50',
          bg: 'bg-sky-950/80',
          text: 'text-sky-300',
          icon: <Shield className="w-2.5 h-2.5 text-sky-400" />,
        };
      case 'south':
        return {
          title: 'SOLARA',
          border: 'border-amber-500/50',
          bg: 'bg-amber-950/80',
          text: 'text-amber-300',
          icon: <Crown className="w-2.5 h-2.5 text-amber-400" />,
        };
      default:
        return {
          title: 'CITIZEN',
          border: 'border-zinc-700/60',
          bg: 'bg-zinc-900/80',
          text: 'text-zinc-300',
          icon: <Shield className="w-2.5 h-2.5 text-zinc-400" />,
        };
    }
  }, [player.kingdom]);

  return (
    <group ref={rootGroupRef} position={[player.x, player.y, player.z]}>
      {/* 3D Character Mesh */}
      <primitive object={characterGroup} />

      {/* Procedural Limb Articulation Animation */}
      <CharacterAnimation
        characterGroup={characterGroup}
        speed={animParams.speed}
        isSprinting={animParams.isSprinting}
        isGrounded={animParams.isGrounded}
        verticalVelocity={animParams.verticalVelocity}
      />

      {/* Overhead 3D Billboard HUD */}
      <Html
        position={[0, 2.35, 0]}
        center
        distanceFactor={14}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'all 0.15s ease-out',
        }}
      >
        <div className="flex flex-col items-center gap-1.5 whitespace-nowrap">
          {/* Active Proximity Speech Bubble */}
          {speechBubble && speechBubble.text && (
            <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              <div
                className={`max-w-[220px] px-3 py-1.5 rounded-xl bg-zinc-950/95 backdrop-blur-md border ${kingdomBadge.border} shadow-lg shadow-black/60 text-zinc-100`}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[9px] text-zinc-400 font-medium">
                  <MessageSquare className="w-2.5 h-2.5 text-amber-400" />
                  <span>{speechBubble.speakerName}</span>
                </div>
                <p className="text-[11px] leading-tight text-zinc-100 font-sans tracking-tight break-words">
                  &ldquo;{speechBubble.text}&rdquo;
                </p>
              </div>
              {/* Tail pointer */}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[5px] border-t-zinc-950/95 -mt-[1px]" />
            </div>
          )}

          {/* Player Nameplate & Kingdom Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-sm border border-zinc-800 shadow-md">
            {/* Kingdom Icon */}
            {kingdomBadge.icon}

            {/* Nickname */}
            <span className="text-xs font-serif font-bold tracking-wide text-zinc-100">
              {player.nickname}
            </span>

            {/* Kingdom Pill Tag */}
            <span
              className={`text-[9px] font-sans font-semibold px-1.5 py-0.2 rounded border ${kingdomBadge.border} ${kingdomBadge.bg} ${kingdomBadge.text}`}
            >
              {kingdomBadge.title}
            </span>

            {/* Short Wallet (if not guest) */}
            {shortWallet && !shortWallet.includes('0x0000') && (
              <span className="text-[9px] text-zinc-400 font-mono">
                {shortWallet}
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * RemotePlayersManager
 * Convenience component that renders all active remote players and their speech bubbles.
 */
export function RemotePlayersManager({
  remotePlayers,
  activeSpeechBubbles = {},
}: {
  remotePlayers: Record<string, NetworkedRemotePlayer> | NetworkedRemotePlayer[];
  activeSpeechBubbles?: Record<string, ActiveSpeechBubble>;
}) {
  const playerList = useMemo(() => {
    return Array.isArray(remotePlayers) ? remotePlayers : Object.values(remotePlayers);
  }, [remotePlayers]);

  return (
    <group name="RemotePlayers">
      {playerList.map((player) => (
        <RemotePlayerEntity
          key={player.id}
          player={player}
          speechBubble={activeSpeechBubbles[player.id]}
        />
      ))}
    </group>
  );
}

export default RemotePlayerEntity;
