'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Swords,
  Shield,
  Coins,
  Compass,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Percent,
  RefreshCw,
  Castle,
  TowerControl as Tower,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useKingdomTreasury, KingdomStatsData } from '@/hooks/web3/useKingdomTreasury';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import {
  WarSimulator3D,
  KingdomMilitaryData,
  WarPredictionOutcome,
  TerritoryBreakdown,
  COMBAT_CONSTANTS,
} from '../../../../ai-system/strategy/WarSimulator3D';
import {
  tacticalAdvisor,
  StrategicBriefing,
} from '../../../../ai-system/strategy/TacticalAdvisor';

export interface TacticalOverlayHUDProps {
  isOpen: boolean;
  onClose: () => void;
  playerKingdom?: 'North' | 'South';
}

/**
 * Full-Screen Citadel War Table & 3D Tactical Command Overlay
 * Provides aerial world map, real-time power balance meters, deterministic combat simulation,
 * live plunder predictions, and AI military strategist briefings.
 */
export function TacticalOverlayHUD({
  isOpen,
  onClose,
  playerKingdom = 'North',
}: TacticalOverlayHUDProps) {
  const {
    northStats,
    southStats,
    declareWar,
    isVoting,
  } = useKingdomTreasury();

  const { allParcels } = useParcelContract();

  const [activeTab, setActiveTab] = useState<'map' | 'simulation' | 'briefing'>('map');
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [briefing, setBriefing] = useState<StrategicBriefing | null>(null);
  const [isRefreshingAI, setIsRefreshingAI] = useState<boolean>(false);
  const [isDeclaringWar, setIsDeclaringWar] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const rivalKingdom: 'North' | 'South' = playerKingdom === 'North' ? 'South' : 'North';

  // Format military data from on-chain stats and parcel counts
  const { attackerMilitary, defenderMilitary } = useMemo(() => {
    const isNorthAttacking = playerKingdom === 'North';
    const ourStats = isNorthAttacking ? northStats : southStats;
    const rivalStats = isNorthAttacking ? southStats : northStats;

    // Count structures from allParcels
    let ourCastles = 0;
    let ourTowers = 0;
    let ourWalls = 0;
    let ourFarms = 0;

    let rivalCastles = 0;
    let rivalTowers = 0;
    let rivalWalls = 0;
    let rivalFarms = 0;

    for (const p of allParcels) {
      const isOurKingdom = (p.kingdom || '').toLowerCase() === playerKingdom.toLowerCase();
      if (isOurKingdom) {
        if (p.structure === 4) ourCastles++;
        else if (p.structure === 2) ourTowers++;
        else if (p.structure === 3) ourWalls++;
        else if (p.structure === 1) ourFarms++;
      } else {
        if (p.structure === 4) rivalCastles++;
        else if (p.structure === 2) rivalTowers++;
        else if (p.structure === 3) rivalWalls++;
        else if (p.structure === 1) rivalFarms++;
      }
    }

    const calculatedOurPower = WarSimulator3D.calculateCombatPower({
      castles: ourCastles,
      towers: ourTowers,
      walls: ourWalls,
    });

    const calculatedRivalPower = WarSimulator3D.calculateCombatPower({
      castles: rivalCastles,
      towers: rivalTowers,
      walls: rivalWalls,
    });

    const attacker: KingdomMilitaryData = {
      kingdom: playerKingdom,
      treasuryGold: ourStats.treasuryGold,
      attackPower: Math.max(ourStats.totalAttack, calculatedOurPower.attack),
      defensePower: Math.max(ourStats.totalDefense, calculatedOurPower.defense),
      castleCount: ourCastles,
      towerCount: ourTowers,
      wallCount: ourWalls,
      farmCount: ourFarms,
      totalParcels: ourStats.totalParcels,
      lastWarTimestamp: ourStats.lastWarTimestamp,
    };

    const defender: KingdomMilitaryData = {
      kingdom: rivalKingdom,
      treasuryGold: rivalStats.treasuryGold,
      attackPower: Math.max(rivalStats.totalAttack, calculatedRivalPower.attack),
      defensePower: Math.max(rivalStats.totalDefense, calculatedRivalPower.defense),
      castleCount: rivalCastles,
      towerCount: rivalTowers,
      wallCount: rivalWalls,
      farmCount: rivalFarms,
      totalParcels: rivalStats.totalParcels,
      lastWarTimestamp: rivalStats.lastWarTimestamp,
    };

    return { attackerMilitary: attacker, defenderMilitary: defender };
  }, [playerKingdom, rivalKingdom, northStats, southStats, allParcels]);

  // Live combat simulation outcome
  const simulationOutcome = useMemo(() => {
    return WarSimulator3D.predictWarOutcome(attackerMilitary, defenderMilitary);
  }, [attackerMilitary, defenderMilitary]);

  // Territory breakdown
  const territory = useMemo(() => {
    return WarSimulator3D.calculateTerritory(allParcels);
  }, [allParcels]);

  // Load initial AI briefing
  const fetchBriefing = useCallback(async () => {
    setIsRefreshingAI(true);
    try {
      const result = await tacticalAdvisor.generateBriefing(
        playerKingdom,
        attackerMilitary,
        defenderMilitary,
        territory
      );
      setBriefing(result);
    } catch (err) {
      console.warn('[TacticalOverlayHUD] Error generating briefing:', err);
    } finally {
      setIsRefreshingAI(false);
    }
  }, [playerKingdom, attackerMilitary, defenderMilitary, territory]);

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen, fetchBriefing]);

  // Handle Declare War action
  const handleDeclareWar = async () => {
    if (!simulationOutcome.canDeclareWar) return;
    setIsDeclaringWar(true);
    try {
      await declareWar(playerKingdom);
      setActionNotice('⚔️ War Declared! The Citadel heralds sound the war horns.');
      setTimeout(() => setActionNotice(null), 5000);
      fetchBriefing();
    } catch (err: any) {
      setActionNotice(`❌ Failed to declare war: ${err?.message || 'Transaction rejected'}`);
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsDeclaringWar(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn select-none text-zinc-100">
      {/* Main War Table Frame */}
      <div className="relative w-full max-w-7xl h-[92vh] rounded-3xl border-2 border-amber-500/50 bg-zinc-950/95 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-inner">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold tracking-wider text-amber-200">
                  Citadel War Table
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-amber-300 font-mono">
                  Tactical Strategic Command
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Territorial aerial radar &bull; Deterministic combat simulation &bull; BYOAI Military Advisor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Allegiance Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-serif font-bold ${
                playerKingdom === 'North'
                  ? 'bg-sky-950/70 border-sky-400/60 text-sky-200'
                  : 'bg-amber-950/70 border-amber-400/60 text-amber-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{playerKingdom} Kingdom Sovereign</span>
            </div>

            {/* Close Button [Esc] */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-amber-500/20 border-b border-amber-400/40 px-6 py-2 text-xs font-mono text-amber-200 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Main Content Split: Left (Aerial Map & Territory) / Right (War Predictor & AI Counsel) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ========================================================================= */}
          {/*          LEFT COLUMN: AERIAL HOLOGRAPHIC RADAR & TERRITORY METRICS        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 border-r border-zinc-800/80 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Map Title & Filter Pills */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-sm text-zinc-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Continuous World Aerial Hologram (1000m &times; 1000m)</span>
                  </h2>
                  <span className="text-[11px] text-zinc-400">
                    Showing parcels, Citadel keeps, river channel, and Great Divide bridge
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> North
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> South
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> River
                  </span>
                </div>
              </div>

              {/* Holographic Radar Canvas / SVG Display */}
              <div className="relative w-full aspect-[16/10] max-h-[360px] rounded-2xl border-2 border-cyan-500/30 bg-zinc-950 overflow-hidden shadow-inner flex items-center justify-center">
                {/* Holographic Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* SVG Tactical Radar */}
                <svg className="w-full h-full p-4" viewBox="-500 -500 1000 1000">
                  {/* North Kingdom Territory (Top half, Z < -20) */}
                  <rect
                    x="-480"
                    y="-480"
                    width="960"
                    height="460"
                    fill="#0284c7"
                    fillOpacity="0.08"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text x="-460" y="-440" fill="#38bdf8" fontSize="24" fontFamily="serif" fontWeight="bold">
                    NORTH KINGDOM (BOREAL)
                  </text>

                  {/* Great Divide River (Z = -20 to +20) */}
                  <rect
                    x="-480"
                    y="-20"
                    width="960"
                    height="40"
                    fill="#06b6d4"
                    fillOpacity="0.3"
                  />
                  <text x="-460" y="5" fill="#22d3ee" fontSize="16" fontFamily="monospace">
                    GREAT DIVIDE RIVER (Z = 0)
                  </text>

                  {/* Great Divide Bridge Causeway (Crossing at X ~= 0) */}
                  <rect
                    x="-20"
                    y="-35"
                    width="40"
                    height="70"
                    fill="#f59e0b"
                    fillOpacity="0.75"
                    stroke="#fcd34d"
                    strokeWidth="2"
                  />
                  <text x="30" y="5" fill="#fcd34d" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    BRIDGE
                  </text>

                  {/* South Kingdom Territory (Bottom half, Z > 20) */}
                  <rect
                    x="-480"
                    y="20"
                    width="960"
                    height="460"
                    fill="#b45309"
                    fillOpacity="0.08"
                    stroke="#b45309"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text x="-460" y="460" fill="#f59e0b" fontSize="24" fontFamily="serif" fontWeight="bold">
                    SOUTH KINGDOM (SOLARA)
                  </text>

                  {/* Citadel Keeps */}
                  {/* North Citadel Keep */}
                  <circle cx="0" cy="-350" r="18" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                  <text x="25" y="-345" fill="#38bdf8" fontSize="16" fontFamily="monospace">
                    North Citadel
                  </text>

                  {/* South Citadel Keep */}
                  <circle cx="0" cy="350" r="18" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <text x="25" y="355" fill="#f59e0b" fontSize="16" fontFamily="monospace">
                    South Citadel
                  </text>

                  {/* Registered Parcels Rendering */}
                  {allParcels.map((parcel: any) => {
                    const b = parcel.bounds;
                    const width = Math.max(20, b.maxX - b.minX);
                    const height = Math.max(20, b.maxZ - b.minZ);
                    const isNorth = (parcel.kingdom || '').toLowerCase() === 'north';
                    const isSelected = selectedParcelId === parcel.id;

                    let structureColor = '#94a3b8';
                    if (parcel.structure === 4) structureColor = '#ec4899'; // Castle Keep
                    else if (parcel.structure === 2) structureColor = '#f59e0b'; // Guard Tower
                    else if (parcel.structure === 3) structureColor = '#3b82f6'; // Stone Wall
                    else if (parcel.structure === 1) structureColor = '#22c55e'; // Farmstead

                    return (
                      <g key={parcel.id} onClick={() => setSelectedParcelId(parcel.id)} className="cursor-pointer">
                        <rect
                          x={b.minX}
                          y={b.minZ}
                          width={width}
                          height={height}
                          fill={isNorth ? '#0284c7' : '#b45309'}
                          fillOpacity={isSelected ? 0.7 : 0.35}
                          stroke={isSelected ? '#fcd34d' : structureColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                        />
                        <text
                          x={b.minX + 4}
                          y={b.minZ + 16}
                          fill="#ffffff"
                          fontSize="12"
                          fontFamily="monospace"
                        >
                          #{parcel.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Radar Scanline Animation Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-12 w-full animate-scan" />
              </div>

              {/* Selected Parcel Inspector Pill */}
              {selectedParcelId !== null && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-300">
                      Parcel #{selectedParcelId}
                    </span>
                    {(() => {
                      const p = allParcels.find((item: any) => item.id === selectedParcelId);
                      if (!p) return null;
                      const structureNames = ['Unbuilt', 'Farmstead', 'Guard Tower', 'Stone Wall', 'Castle Keep'];
                      return (
                        <>
                          <span className="text-zinc-400">
                            Kingdom: <strong className="text-zinc-200">{p.kingdom}</strong>
                          </span>
                          <span className="text-zinc-400">
                            Structure: <strong className="text-zinc-200">{structureNames[p.structure] || 'None'}</strong>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => setSelectedParcelId(null)}
                    className="text-zinc-400 hover:text-white text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Territory Control Progress Bar */}
            <div className="space-y-2 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Realm Territorial Hegemony</span>
                </span>
                <span className="text-amber-400 font-mono">
                  {territory.dominantKingdom === 'Contested'
                    ? 'Contested Frontier'
                    : `${territory.dominantKingdom} Dominance`}
                </span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex">
                <div
                  style={{ width: `${territory.northControlPercent}%` }}
                  className="bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500"
                  title={`North: ${territory.northControlPercent}%`}
                />
                <div
                  style={{ width: `${territory.southControlPercent}%` }}
                  className="bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  title={`South: ${territory.southControlPercent}%`}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span className="text-sky-300">North: {territory.northControlPercent}%</span>
                <span>Unclaimed: {100 - territory.northControlPercent - territory.southControlPercent}%</span>
                <span className="text-amber-300">South: {territory.southControlPercent}%</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/*          RIGHT COLUMN: WAR PREDICTOR & AI MILITARY STRATEGIST             */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            {/* Live Combat Prediction Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-zinc-100 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <span>Deterministic War Outcome Predictor</span>
                </h3>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${simulationOutcome.verdictColor}`}>
                  {simulationOutcome.verdictLabel}
                </span>
              </div>

              {/* Power Differential Box */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">
                      Our Siege Attack
                    </span>
                    <span className="text-2xl font-bold font-serif text-amber-300">
                      {attackerMilitary.attackPower}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      ({attackerMilitary.castleCount} Castle Keeps)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">
                      Rival Defense
                    </span>
                    <span className="text-2xl font-bold font-serif text-sky-300">
                      {defenderMilitary.defensePower}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      ({defenderMilitary.towerCount} Towers, {defenderMilitary.wallCount} Walls)
                    </span>
                  </div>
                </div>

                {/* Plunder vs Risk Financial Ledger */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px]">Projected Plunder (Win)</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      +{simulationOutcome.estimatedPlunder} Gold
                    </span>
                    <span className="text-[9px] text-zinc-500">25% of rival treasury</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px]">Penalty at Risk (Loss)</span>
                    <span className="text-rose-400 font-bold text-sm">
                      -{simulationOutcome.riskPenalty} Gold
                    </span>
                    <span className="text-[9px] text-zinc-500">10% tithe penalty</span>
                  </div>
                </div>

                {/* Cooldown Timer */}
                <div className="flex items-center justify-between text-xs font-mono pt-1 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>War Cooldown:</span>
                  </span>
                  <span className={simulationOutcome.canDeclareWar ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {simulationOutcome.canDeclareWar
                      ? 'Ready to Strike'
                      : `${Math.ceil(simulationOutcome.cooldownRemainingSeconds / 60)} minutes remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Military Strategist Briefing Card */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-4 space-y-3 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-serif font-bold text-sm">
                    V
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-200">
                      {briefing?.strategistName || 'Grand Marshal Vane'}
                    </h4>
                    <span className="text-[10px] text-zinc-400 block">
                      {briefing?.strategistTitle || 'Citadel Supreme Strategist'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={fetchBriefing}
                  disabled={isRefreshingAI}
                  className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
                  title="Query BYOAI Engine for Fresh Briefing"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAI ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>

              {/* AI Briefing Speech */}
              <div className="text-xs font-serif leading-relaxed text-zinc-200 italic p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                {isRefreshingAI ? (
                  <span className="text-amber-400/80 animate-pulse">
                    Consulting High Strategist tactical models...
                  </span>
                ) : (
                  <span>&ldquo;{briefing?.counselText}&rdquo;</span>
                )}
              </div>

              {/* Recommended Action */}
              <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Recommended Construction:</span>
                  <span className="text-[11px] text-amber-200/90 leading-tight">
                    {briefing?.recommendedAction}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Declare War & Close */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDeclareWar}
                disabled={!simulationOutcome.canDeclareWar || isDeclaringWar}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-rose-500 via-amber-400 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-98 transition shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flame className="w-4 h-4" />
                <span>
                  {isDeclaringWar
                    ? 'Broadcasting War Decree...'
                    : simulationOutcome.canDeclareWar
                    ? 'Declare War & Raid Rival Treasury'
                    : 'War Cooldown Active'}
                </span>
              </button>

              <div className="text-center text-[10px] text-zinc-500">
                War decrees execute deterministic combat matching SovereignLands.sol smart contract.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TacticalOverlayHUD;
