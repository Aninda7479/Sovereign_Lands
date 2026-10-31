'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { Shield, Swords, Coins, Landmark, Wallet, ChevronDown, CheckCircle2, AlertCircle, LogOut, Settings, Cpu } from 'lucide-react';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';
import { keyVault } from '../../../../ai-system/providers/KeyVault';

export interface TopResourceHUDProps {
  overrideGold?: number;
  overrideParcelsCount?: number;
  overrideKingdom?: 'North' | 'South';
  onOpenCouncil?: () => void;
  onOpenBuildMenu?: () => void;
  onOpenSettings?: () => void;
}

export function TopResourceHUD({
  overrideGold,
  overrideParcelsCount,
  overrideKingdom,
  onOpenCouncil,
  onOpenBuildMenu,
  onOpenSettings,
}: TopResourceHUDProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const { playerGold, playerParcels, pendingGold, claimGold, isTransacting } = useParcelContract();
  const { northStats, southStats, activeProposal } = useKingdomTreasury();

  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
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
      setGoldAnimClass(diff > 0 ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'text-red-400 scale-95');
      
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

  const currentStats = currentKingdom === 'North' ? northStats : southStats;
  const ownedCount = overrideParcelsCount ?? playerParcels.length;

  // Network label
  const networkName =
    chainId === 80002
      ? 'Polygon Amoy'
      : chainId === 84532
      ? 'Base Sepolia'
      : isConnected
      ? 'Testnet'
      : 'Demo Offline';

  const truncateAddress = (addr?: string) => {
    if (!addr) return 'Mock Lord (0x7099...79C8)';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const kingdomTheme =
    currentKingdom === 'North'
      ? {
          name: 'Frostfang Realm',
          motto: 'Boreal Bastion',
          badgeBg: 'bg-sky-950/80 border-sky-500/40 text-sky-200',
          accent: 'from-sky-500 to-cyan-300',
          glow: 'rgba(56, 189, 248, 0.4)',
        }
      : {
          name: 'Sunspear Realm',
          motto: 'Solara Sovereignty',
          badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-200',
          accent: 'from-amber-500 to-yellow-300',
          glow: 'rgba(245, 158, 11, 0.4)',
        };

  return (
    <header className="fixed top-3 left-3 right-3 z-30 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT: Compact Realm & Resources Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Kingdom Crest Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all ${kingdomTheme.badgeBg}`}
          >
            <Shield className="w-4 h-4 text-amber-300" />
            <span className="font-serif font-bold text-xs tracking-wider text-white">
              {kingdomTheme.name}
            </span>
          </div>

          {/* Gold Coin Balance Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-amber-500/30 bg-black/75 backdrop-blur-xl shadow-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className={`font-mono font-bold text-sm text-amber-400 ${goldAnimClass}`}>
              {displayedGold.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-amber-300/80">GOLD</span>

            {/* Quick Harvest button if pending gold exists */}
            {pendingGold.totalNet > 0 && (
              <button
                onClick={() => claimGold()}
                disabled={isTransacting}
                className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold animate-pulse transition"
                title="Claim pending gold tithes"
              >
                +{pendingGold.totalNet} CLAIM
              </button>
            )}
          </div>

          {/* Parcels Count */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl text-xs text-stone-300 shadow-lg">
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-bold text-indigo-200">{ownedCount}</span>
            <span className="text-[10px] text-stone-400">PLOTS</span>
          </div>
        </div>

        {/* RIGHT: Clean Controls, Wallet & Settings */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Wallet Button */}
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/15 bg-stone-900/80 hover:bg-stone-800 text-stone-100 text-xs backdrop-blur-xl shadow-xl transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono">{truncateAddress(address)}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {/* Dropdown Menu */}
              {walletMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-stone-950/95 backdrop-blur-2xl shadow-2xl p-2 z-50 text-xs flex flex-col gap-1">
                  <div className="px-3 py-2 border-b border-white/10 text-[11px] text-stone-400">
                    <div>Connected Lord</div>
                    <div className="font-mono text-stone-200 truncate mt-0.5">{address}</div>
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      setWalletMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                const injectedConnector = connectors[0];
                if (injectedConnector) {
                  connect({ connector: injectedConnector });
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-600/90 to-amber-700/90 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs backdrop-blur-xl shadow-lg transition active:scale-95"
            >
              <Wallet className="w-3.5 h-3.5 text-stone-950" />
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Master Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/15 bg-black/70 hover:bg-zinc-800/90 text-stone-200 text-xs backdrop-blur-xl shadow-xl transition group"
            title="Open Kingdom Settings, AI Key Vault, and Keybindings"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="font-semibold text-xs">Settings</span>
            <span
              className={`w-2 h-2 rounded-full ${
                aiActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-500'
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
