'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Coins,
  Landmark,
  Settings,
  Scroll,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';
import { usePlayerProgression } from '@/providers/PlayerProgressionProvider';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import { soundManager } from '@/lib/audio/SoundManager';

export interface TopResourceHUDProps {
  overrideGold?: number;
  overrideParcelsCount?: number;
  overrideKingdom?: 'North' | 'South';
  serverConnected?: boolean;
  onOpenCouncil?: () => void;
  onOpenBuildMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenQuests?: () => void;
  onOpenInventory?: () => void;
}

/**
 * Medieval GTA-Style Top Resource HUD.
 * Features:
 * - Kingdom Crest & Allegiance
 * - Player Level, Title & Animated XP Progress Bar
 * - Real-time Gold Coin Balance & Quick-Tithe claim
 * - Quick-access Quests Journal [J] button with quest tracker blip
 * - Quick-access Bag / Inventory [I] button with stack item count
 * - Master Settings [Esc] button with live AI Brain status
 */
export function TopResourceHUD({
  overrideGold,
  overrideParcelsCount,
  overrideKingdom,
  serverConnected,
  onOpenCouncil,
  onOpenBuildMenu,
  onOpenSettings,
  onOpenQuests,
  onOpenInventory,
}: TopResourceHUDProps) {
  const { playerGold, playerParcels, pendingGold, claimGold, isTransacting } = useParcelContract();
  const { northStats, southStats } = useKingdomTreasury();
  const { level, xp, xpToNextLevel, title, inventory, quests, activeQuestId } =
    usePlayerProgression();

  const [displayedGold, setDisplayedGold] = useState<number>(overrideGold ?? playerGold);
  const [goldAnimClass, setGoldAnimClass] = useState<string>('');
  const [aiActive, setAiActive] = useState<boolean>(false);
  const prevGoldRef = useRef<number>(playerGold);

  // Check AI brain status from KeyVault
  useEffect(() => {
    setAiActive(keyVault.getActiveProvider() !== 'mock');
    const unsub = keyVault.subscribe((payload) => {
      if (payload.type === 'provider-changed') {
        setAiActive(payload.provider !== 'mock');
      }
    });
    return () => unsub();
  }, []);

  // Animated Gold Balance counter
  useEffect(() => {
    const targetGold = overrideGold ?? playerGold;
    if (targetGold !== prevGoldRef.current) {
      const diff = targetGold - prevGoldRef.current;
      setGoldAnimClass(
        diff > 0
          ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
          : 'text-red-400 scale-95'
      );

      const duration = 800;
      const startTime = performance.now();
      const startGold = prevGoldRef.current;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const current = Math.round(startGold + diff * easeOutQuad);
        setDisplayedGold(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayedGold(targetGold);
          setTimeout(() => setGoldAnimClass(''), 400);
        }
      };

      requestAnimationFrame(animate);
      prevGoldRef.current = targetGold;
    } else {
      setDisplayedGold(targetGold);
    }
  }, [playerGold, overrideGold]);

  // Determine current active kingdom based on player's first parcel or default North
  const currentKingdom: 'North' | 'South' =
    overrideKingdom ||
    (playerParcels.length > 0 && playerParcels[0].kingdom === 'South' ? 'South' : 'North');

  const ownedCount = overrideParcelsCount ?? playerParcels.length;

  const kingdomTheme =
    currentKingdom === 'North'
      ? {
          name: 'Frostfang Realm',
          motto: 'Boreal Bastion',
          badgeBg: 'bg-sky-950/85 border-sky-400/40 text-sky-200',
        }
      : {
          name: 'Sunspear Realm',
          motto: 'Solara Sovereignty',
          badgeBg: 'bg-amber-950/85 border-amber-400/40 text-amber-200',
        };

  // Calculate XP fill percentage (0 to 100%)
  const xpPercentage = useMemo(() => {
    if (!xpToNextLevel || xpToNextLevel <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((xp / xpToNextLevel) * 100)));
  }, [xp, xpToNextLevel]);

  // Count total inventory items
  const totalItemCount = useMemo(() => {
    return inventory.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [inventory]);

  // Check if any quest has ready-to-claim reward or active tracker
  const hasClaimableQuest = useMemo(() => {
    return quests.some((q) => !q.isClaimed && q.steps.every((s) => s.isCompleted));
  }, [quests]);

  const hasActiveQuest = useMemo(() => {
    return Boolean(activeQuestId && quests.some((q) => q.id === activeQuestId && !q.isClaimed));
  }, [activeQuestId, quests]);

  return (
    <header className="fixed top-4 left-4 right-4 z-40 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT: Kingdom, Level & Resources */}
        <div className="pointer-events-auto flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Kingdom Crest Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all ${kingdomTheme.badgeBg}`}
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-serif font-black text-xs tracking-wider text-white hidden sm:inline">
              {kingdomTheme.name}
            </span>
          </div>

          {/* Level & XP Progress Pill (Clickable -> Opens Quest Journal) */}
          <div
            onClick={() => {
              soundManager.playClick();
              onOpenQuests?.();
            }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-indigo-500/40 bg-zinc-950/90 hover:bg-zinc-900/90 hover:border-indigo-400 backdrop-blur-xl shadow-xl cursor-pointer transition-all active:scale-95"
            title={`Player Level ${level} - ${title} (${xp} / ${xpToNextLevel} XP). Click to open Quest Journal [J]`}
          >
            {/* Level Badge */}
            <div className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-mono font-black text-[11px] shadow-sm tracking-wide">
              LVL {level}
            </div>

            {/* Title & XP bar */}
            <div className="flex flex-col gap-0.5 min-w-[70px] sm:min-w-[90px]">
              <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                <span className="text-zinc-300 font-serif font-bold truncate max-w-[80px] sm:max-w-[110px]">
                  {title}
                </span>
                <span className="text-indigo-300 font-bold shrink-0">
                  {xpPercentage}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden border border-zinc-700/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gold Coin Balance Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-amber-500/40 bg-zinc-950/90 backdrop-blur-xl shadow-xl">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span
              className={`font-mono font-black text-sm text-amber-300 transition-all ${goldAnimClass}`}
            >
              {displayedGold.toLocaleString()}
            </span>
            <span className="text-[10px] font-black text-amber-400/80">GOLD</span>

            {/* Quick Harvest button if pending tithes exist */}
            {pendingGold.totalNet > 0 && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  claimGold();
                }}
                disabled={isTransacting}
                className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold animate-pulse transition cursor-pointer"
                title="Claim pending gold tithes"
              >
                +{pendingGold.totalNet} CLAIM
              </button>
            )}
          </div>

          {/* Parcels Count */}
          {ownedCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-zinc-700/60 bg-zinc-950/80 backdrop-blur-xl text-xs text-zinc-300 shadow-lg">
              <Landmark className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-bold text-indigo-200">{ownedCount}</span>
              <span className="text-[10px] text-zinc-400">PLOTS</span>
            </div>
          )}
        </div>

        {/* RIGHT: Quests, Inventory, and Settings */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Quests Journal Button ([J]) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenQuests?.();
            }}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl border border-amber-500/40 hover:border-amber-400 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 text-xs font-semibold backdrop-blur-xl shadow-xl shadow-black/80 transition active:scale-95 cursor-pointer group"
            title="Open Quest Journal (J)"
          >
            <Scroll className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Quests</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
              J
            </kbd>

            {/* Active quest tracker or claim reward blip */}
            {hasClaimableQuest ? (
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping"
                title="Quest rewards ready to claim!"
              />
            ) : hasActiveQuest ? (
              <span
                className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                title="Active Quest Tracking"
              />
            ) : null}
          </button>

          {/* Inventory Bag Button ([I]) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenInventory?.();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl border border-indigo-500/40 hover:border-indigo-400 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 text-xs font-semibold backdrop-blur-xl shadow-xl shadow-black/80 transition active:scale-95 cursor-pointer group"
            title="Open Inventory Bag (I)"
          >
            <Package className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Bag</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-indigo-300">
              I
            </kbd>
            {totalItemCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-mono font-bold text-indigo-200">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* Master Settings & Pause Button (Press Esc or Click) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings?.();
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-2xl border border-amber-400/50 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 text-xs font-semibold backdrop-blur-xl shadow-xl shadow-black/80 hover:border-amber-300 transition active:scale-95 cursor-pointer group"
            title="Open Pause Menu & Settings (Esc or X)"
          >
            <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline">Settings</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
              Esc
            </kbd>
            <div className="flex items-center gap-1.5 ml-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  aiActive
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-zinc-500'
                }`}
                title={aiActive ? 'AI Engine: Active' : 'AI Engine: Inactive'}
              />
              <span
                className={`w-2 h-2 rounded-full ${
                  serverConnected
                    ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]'
                    : 'bg-zinc-600'
                }`}
                title={serverConnected ? 'Multiplayer Server: Connected (20Hz)' : 'Multiplayer: Standalone'}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopResourceHUD;
