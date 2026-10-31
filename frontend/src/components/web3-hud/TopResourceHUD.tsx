'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { Shield, Swords, Coins, Landmark, Wallet, ChevronDown, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';

export interface TopResourceHUDProps {
  overrideGold?: number;
  overrideParcelsCount?: number;
  overrideKingdom?: 'North' | 'South';
  onOpenCouncil?: () => void;
  onOpenBuildMenu?: () => void;
}

export function TopResourceHUD({
  overrideGold,
  overrideParcelsCount,
  overrideKingdom,
  onOpenCouncil,
  onOpenBuildMenu,
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
  const prevGoldRef = useRef<number>(playerGold);

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
        {/* LEFT: Kingdom Realm Banner & Military Stats */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Kingdom Badge */}
          <div
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${kingdomTheme.badgeBg}`}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-black/40 border border-white/10 shadow-inner">
              <Shield className="w-5 h-5 text-sky-300 animate-pulse" />
              <div
                className="absolute inset-0 rounded-xl blur-sm -z-10"
                style={{ backgroundColor: kingdomTheme.glow }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-black tracking-wider text-xs uppercase bg-gradient-to-r text-white">
                {kingdomTheme.name}
              </span>
              <span className="text-[10px] text-white/60 tracking-wider">
                {kingdomTheme.motto}
              </span>
            </div>
          </div>

          {/* Realm Military Power Pill */}
          <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-xl text-xs text-stone-200">
            <div className="flex items-center gap-1.5" title="Kingdom Army Attack Power">
              <Swords className="w-4 h-4 text-rose-400" />
              <span className="font-mono font-bold text-rose-200">{currentStats.totalAttack}</span>
              <span className="text-[10px] text-stone-400">ATK</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5" title="Kingdom Bastion Defense">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-200">{currentStats.totalDefense}</span>
              <span className="text-[10px] text-stone-400">DEF</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5" title="Citadel Treasury Gold Reserves">
              <Landmark className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-amber-200">{currentStats.treasuryGold}</span>
              <span className="text-[10px] text-stone-400">VAULT</span>
            </div>
          </div>
        </div>

        {/* CENTER: Player Resources & Active Decrees */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Gold Coin Balance HUD */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-amber-500/30 bg-black/75 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <Coins className="w-4 h-4 text-stone-950 font-bold" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-mono font-black text-base text-amber-400 transition-all duration-300 ${goldAnimClass}`}
                >
                  {displayedGold.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">
                  GOLD
                </span>
              </div>
            </div>

            {/* Quick Harvest Pill if pending gold exists */}
            {pendingGold.totalNet > 0 && (
              <button
                onClick={() => claimGold()}
                disabled={isTransacting}
                className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1 animate-pulse transition-colors"
                title="Claim pending farmstead harvest"
              >
                +{pendingGold.totalNet}
                <span className="text-[9px] font-sans opacity-80">CLAIM</span>
              </button>
            )}
          </div>

          {/* Owned Parcels Counter */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl text-xs text-stone-200">
            <Landmark className="w-4 h-4 text-indigo-400" />
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-indigo-200">{ownedCount}</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-wide">
                {ownedCount === 1 ? 'PARCEL' : 'PARCELS'}
              </span>
            </div>
          </div>

          {/* Active Decree / Citadel Council Indicator */}
          {activeProposal && !activeProposal.executed && (
            <button
              onClick={onOpenCouncil}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl border border-purple-500/40 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs backdrop-blur-xl shadow-lg transition-all group"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="font-sans font-medium text-[11px] max-w-[140px] truncate">
                Decree #{activeProposal.id}: {activeProposal.description}
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-purple-400/30 font-mono text-[10px] text-purple-300 group-hover:scale-105">
                V
              </kbd>
            </button>
          )}
        </div>

        {/* RIGHT: Network Pill & Connected Wallet */}
        <div className="pointer-events-auto relative flex items-center gap-2">
          {/* Network Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl text-[11px] text-stone-300 shadow-xl">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="font-sans font-medium">{networkName}</span>
          </div>

          {/* Wallet Button */}
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-white/15 bg-stone-900/80 hover:bg-stone-800/90 text-stone-100 text-xs backdrop-blur-xl shadow-2xl transition-all"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-mono font-medium">{truncateAddress(address)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs backdrop-blur-xl shadow-xl shadow-amber-950/40 transition-all hover:scale-105 active:scale-95"
            >
              <Wallet className="w-4 h-4 text-stone-950" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopResourceHUD;
