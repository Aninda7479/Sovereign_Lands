'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Coins, Landmark, Settings } from 'lucide-react';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import { soundManager } from '@/lib/audio/SoundManager';

export interface TopResourceHUDProps {
  overrideGold?: number;
  overrideParcelsCount?: number;
  overrideKingdom?: 'North' | 'South';
  onOpenCouncil?: () => void;
  onOpenBuildMenu?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Clean, minimalistic medieval Top Resource HUD.
 * Connect Wallet has been moved exclusively inside the Settings Modal per player specification.
 */
export function TopResourceHUD({
  overrideGold,
  overrideParcelsCount,
  overrideKingdom,
  onOpenCouncil,
  onOpenBuildMenu,
  onOpenSettings,
}: TopResourceHUDProps) {
  const { playerGold, playerParcels, pendingGold, claimGold, isTransacting } = useParcelContract();
  const { northStats, southStats } = useKingdomTreasury();

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

  return (
    <header className="fixed top-4 left-4 right-4 z-40 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT: Compact Realm & Resources */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Kingdom Crest Pill */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all ${kingdomTheme.badgeBg}`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-serif font-black text-xs tracking-wider text-white">
              {kingdomTheme.name}
            </span>
          </div>

          {/* Gold Coin Balance Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-amber-500/40 bg-zinc-950/90 backdrop-blur-xl shadow-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className={`font-mono font-black text-sm text-amber-300 transition-all ${goldAnimClass}`}>
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
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-zinc-700/60 bg-zinc-950/80 backdrop-blur-xl text-xs text-zinc-300 shadow-lg">
              <Landmark className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-bold text-indigo-200">{ownedCount}</span>
              <span className="text-[10px] text-zinc-400">PLOTS</span>
            </div>
          )}
        </div>

        {/* RIGHT: Master Settings & Pause Button (Press Esc or Click) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings?.();
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl border border-amber-400/50 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 text-xs font-semibold backdrop-blur-xl shadow-xl shadow-black/80 hover:border-amber-300 transition active:scale-95 cursor-pointer group"
            title="Open Pause Menu & Settings (Esc or X)"
          >
            <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>Settings</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
              Esc
            </kbd>
            <span
              className={`w-2 h-2 rounded-full ${
                aiActive
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : 'bg-zinc-500'
              }`}
              title={aiActive ? 'AI Engine Active' : 'AI Engine Inactive (Click to Configure)'}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopResourceHUD;
