'use client';

import React from 'react';

export type PromptActionType = 'buy' | 'harvest' | 'council' | 'build' | 'npc' | 'shop';

export interface InteractionPromptProps {
  actionType: PromptActionType | null;
  parcelId?: number;
  npcName?: string;
  npcRole?: string;
  shopName?: string;
  goldReward?: number;
  priceEth?: string;
  onTrigger?: () => void;
}

/**
 * GTA-style contextual interaction prompt hovering at bottom-center of viewport.
 * Dynamically switches between:
 * - [B] Claim Parcel — 0.01 ETH
 * - [E] Harvest Gold (+X Gold Ready)
 * - [E] Trade Wares & Artefacts
 * - [E] Speak with Resident / NPC
 * - [V] Open Kingdom Council & Vote
 * - [C] Open In-World Building Mode
 */
export function InteractionPrompt({
  actionType,
  parcelId,
  npcName,
  npcRole,
  shopName,
  goldReward = 25,
  priceEth = '0.01',
  onTrigger,
}: InteractionPromptProps) {
  if (!actionType) return null;

  const config = {
    npc: {
      key: 'E',
      title: npcName ? `Speak with ${npcName}` : 'Speak with Resident',
      subtitle: npcRole || 'Press E or Click to interact',
      color: 'border-amber-400/90 bg-zinc-950/90 text-amber-200',
      badge: 'bg-amber-500/30 text-amber-300 border-amber-400/80',
    },
    shop: {
      key: 'E',
      title: shopName ? `Enter ${shopName}` : npcName ? `Trade with ${npcName}` : 'Trade Wares & Artefacts',
      subtitle: npcRole || 'Press [E] to browse shop catalog',
      color: 'border-amber-400/90 bg-zinc-950/90 text-amber-200',
      badge: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/80',
    },
    buy: {
      key: 'B',
      title: 'Claim Frontier Territory',
      subtitle: `Plot #${parcelId || 1} • ${priceEth} Testnet ETH`,
      color: 'border-amber-400/80 bg-amber-950/80 text-amber-200',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    },
    harvest: {
      key: 'E',
      title: 'Harvest Royal Grain & Gold',
      subtitle: `+${goldReward} Net Gold (10% tithe to realm)`,
      color: 'border-emerald-400/80 bg-emerald-950/80 text-emerald-200',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    },
    council: {
      key: 'V',
      title: 'Citadel Town Hall',
      subtitle: 'Cast Vote on Active Royal Decree',
      color: 'border-sky-400/80 bg-sky-950/80 text-sky-200',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
    },
    build: {
      key: 'C',
      title: 'In-World Construction',
      subtitle: 'Construct Houses, Fountains, or Fortresses',
      color: 'border-purple-400/80 bg-purple-950/80 text-purple-200',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
    },
  }[actionType];

  return (
    <div
      onClick={onTrigger}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 cursor-pointer select-none group"
    >
      <div
        className={`flex items-center gap-4 px-5 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${config.color}`}
      >
        {/* Animated Key Cap Icon */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 font-mono font-black text-lg shadow-inner ${config.badge} group-hover:animate-bounce`}
        >
          {config.key}
        </div>

        {/* Text Content */}
        <div className="flex flex-col text-left">
          <span className="font-serif font-bold text-sm tracking-wide leading-tight">
            {config.title}
          </span>
          <span className="text-xs opacity-80 font-sans mt-0.5">{config.subtitle}</span>
        </div>

        {/* Action arrow indicator */}
        <div className="ml-2 text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
          ▶
        </div>
      </div>
    </div>
  );
}
