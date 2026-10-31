'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Vote,
  Swords,
  Shield,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Percent,
  Landmark,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';

export interface CitadelCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerKingdom?: 'North' | 'South';
}

export function CitadelCouncilModal({
  isOpen,
  onClose,
  playerKingdom = 'North',
}: CitadelCouncilModalProps) {
  const [activeTab, setActiveTab] = useState<'decrees' | 'war' | 'treasury'>('decrees');
  const [hasVotedLocally, setHasVotedLocally] = useState<boolean>(false);
  const [voteChoice, setVoteChoice] = useState<'yes' | 'no' | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [warCooldownLeft, setWarCooldownLeft] = useState<number>(0);

  const { playerParcels } = useParcelContract();
  const {
    northStats,
    southStats,
    activeProposal,
    isVoting,
    castVote,
    declareWar,
  } = useKingdomTreasury();

  // Calculate player's voting power (number of parcels in this kingdom)
  const playerVotingPower = useMemo(() => {
    const matchingParcels = playerParcels.filter(
      (p) => p.kingdom.toLowerCase() === playerKingdom.toLowerCase()
    );
    return Math.max(1, matchingParcels.length); // Default 1 for demo Lord
  }, [playerParcels, playerKingdom]);

  // Current and enemy stats
  const currentStats = playerKingdom === 'North' ? northStats : southStats;
  const enemyStats = playerKingdom === 'North' ? southStats : northStats;
  const enemyKingdom = playerKingdom === 'North' ? 'South' : 'North';

  // Proposal countdown timer
  useEffect(() => {
    if (!isOpen || !activeProposal) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = activeProposal.endTime - now;
      if (diff <= 0) {
        setTimeLeft('Voting Concluded');
      } else {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeProposal]);

  // War Cooldown Timer (10 minutes = 600s)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const warTime = currentStats.lastWarTimestamp;
      const cooldownSecs = 600;
      const elapsed = now - warTime;
      const remaining = Math.max(0, cooldownSecs - elapsed);
      setWarCooldownLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, currentStats.lastWarTimestamp]);

  // ESC key listener to close modal
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

  // Proposal vote calculations
  const totalVotes = (activeProposal?.yesVotes || 0) + (activeProposal?.noVotes || 0);
  const yesPercentage = totalVotes > 0 ? Math.round(((activeProposal?.yesVotes || 0) / totalVotes) * 100) : 50;
  const noPercentage = 100 - yesPercentage;

  // Quorum (needs 20% of realm parcels)
  const quorumRequired = Math.ceil((currentStats.totalParcels || 5) * 0.2);
  const quorumCurrent = activeProposal?.totalVoters || 1;
  const quorumReached = quorumCurrent >= quorumRequired;

  // War balance calculations
  // Attacker ATK vs Defender DEF
  const attackerAtk = currentStats.totalAttack;
  const defenderDef = enemyStats.totalDefense;
  const warVictoryLikelihood =
    attackerAtk >= defenderDef
      ? 'Decisive Victory Predicted'
      : 'Bastion Hold Predicted (Insufficient Siege)';
  const potentialPlunder = Math.round(enemyStats.treasuryGold * 0.25);

  const handleVote = async (support: boolean) => {
    if (!activeProposal || hasVotedLocally) return;
    try {
      await castVote(activeProposal.id, support);
      setHasVotedLocally(true);
      setVoteChoice(support ? 'yes' : 'no');
    } catch (err) {
      console.error('Failed to cast vote:', err);
    }
  };

  const handleDeclareWar = async () => {
    const attackerEnum = playerKingdom === 'North' ? 1 : 2;
    await declareWar(attackerEnum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-amber-500/30 bg-stone-950/95 text-stone-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-stone-900/80 to-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg tracking-wide text-amber-100 flex items-center gap-2">
                <span>The Sovereign Citadel Council</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                  {playerKingdom} Dominion
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                High Council Chamber • Governance & Realm Defense Ledger
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 pt-3 border-b border-white/10 flex gap-4 bg-stone-900/40">
          <button
            onClick={() => setActiveTab('decrees')}
            className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'decrees'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Royal Decrees</span>
            {activeProposal && !activeProposal.executed && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('war')}
            className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'war'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Crusade & War Room</span>
          </button>

          <button
            onClick={() => setActiveTab('treasury')}
            className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'treasury'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Realm Treasury</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: ROYAL DECREES */}
          {activeTab === 'decrees' && (
            <div className="space-y-6">
              {activeProposal ? (
                <div className="p-6 rounded-2xl border border-white/10 bg-stone-900/50 backdrop-blur-xl space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold">
                        Decree #{activeProposal.id}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        Proposed by {activeProposal.proposer.slice(0, 6)}...{activeProposal.proposer.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs font-mono text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{timeLeft}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">
                      {activeProposal.description}
                    </h3>
                    <p className="mt-1 text-xs text-stone-300">
                      Param Target: <span className="font-mono text-amber-300 font-bold">{activeProposal.param}%</span>
                    </p>
                  </div>

                  {/* Voting Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">
                        YES {yesPercentage}% ({activeProposal.yesVotes} votes)
                      </span>
                      <span className="text-rose-400 font-bold">
                        NO {noPercentage}% ({activeProposal.noVotes} votes)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-stone-800 overflow-hidden flex border border-white/10">
                      <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${yesPercentage}%` }}
                      />
                      <div
                        className="bg-rose-500 transition-all duration-500"
                        style={{ width: `${noPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Quorum Metric */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                    <span className="text-stone-400">Governance Quorum Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-200">
                        {quorumCurrent} / {quorumRequired} Required Lords
                      </span>
                      {quorumReached ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Player Voting Action */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-stone-300">
                      Your Voting Power:{' '}
                      <span className="font-mono font-bold text-amber-300">
                        {playerVotingPower} {playerVotingPower === 1 ? 'Vote' : 'Votes'}
                      </span>{' '}
                      <span className="text-stone-500">({playerVotingPower} owned parcels)</span>
                    </div>

                    {hasVotedLocally ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Voted {voteChoice?.toUpperCase()} ({playerVotingPower} votes recorded)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVote(true)}
                          disabled={isVoting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ENACT DECREE (YES)</span>
                        </button>
                        <button
                          onClick={() => handleVote(false)}
                          disabled={isVoting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 border border-rose-400/40 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>VETO DECREE (NO)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-white/10 bg-stone-900/30">
                  <Vote className="w-12 h-12 text-stone-500 mx-auto mb-3" />
                  <h4 className="font-serif font-bold text-stone-300">No Active Decrees</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                    The High Council is currently adjourned. Propose new decrees through your citadel steward.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRUSADE & WAR ROOM */}
          {activeTab === 'war' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-xl space-y-6">
                <div>
                  <h3 className="text-base font-serif font-bold text-rose-200 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" />
                    <span>Deterministic Realm Warfare Engine</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Battle outcomes are fully deterministic based on constructed Guard Towers (ATK) vs Bastion Walls & Keeps (DEF).
                  </p>
                </div>

                {/* Military Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Your Kingdom */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-sky-300">
                        {playerKingdom} Dominion (Attacking Army)
                      </span>
                      <Award className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Total Siege Attack:</span>
                        <span className="font-mono font-bold text-rose-400">{attackerAtk} ATK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Bastion Defense:</span>
                        <span className="font-mono font-bold text-emerald-400">{currentStats.totalDefense} DEF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Treasury Reserves:</span>
                        <span className="font-mono font-bold text-amber-300">{currentStats.treasuryGold} Gold</span>
                      </div>
                    </div>
                  </div>

                  {/* Enemy Kingdom */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-rose-300">
                        {enemyKingdom} Dominion (Defenders)
                      </span>
                      <Shield className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Siege Attack:</span>
                        <span className="font-mono font-bold text-rose-400">{enemyStats.totalAttack} ATK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Target Bastion Defense:</span>
                        <span className="font-mono font-bold text-emerald-400">{defenderDef} DEF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Plunderable Treasury (25%):</span>
                        <span className="font-mono font-bold text-amber-300">+{potentialPlunder} Gold</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcome Prediction & Trigger */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-stone-400">Tactical Projection:</div>
                    <div className="font-bold text-sm text-stone-200 mt-0.5">{warVictoryLikelihood}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Attacking with {attackerAtk} ATK against {defenderDef} DEF
                    </div>
                  </div>

                  <div>
                    {warCooldownLeft > 0 ? (
                      <div className="px-4 py-2 rounded-xl bg-stone-900 border border-white/10 text-stone-400 text-xs font-mono flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Armistice Cooldown: {warCooldownLeft}s</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleDeclareWar}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-stone-950 font-black text-xs tracking-wider uppercase shadow-xl transition-all active:scale-95"
                      >
                        March to Battle & Plunder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REALM TREASURY LEDGER */}
          {activeTab === 'treasury' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-white/10 bg-stone-900/50 space-y-1">
                  <div className="text-xs text-stone-400">Royal Vault Balance</div>
                  <div className="font-mono font-black text-2xl text-amber-300">
                    {currentStats.treasuryGold} Gold
                  </div>
                  <div className="text-[11px] text-stone-500">Collected from land tithes</div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-stone-900/50 space-y-1">
                  <div className="text-xs text-stone-400">Current Tax Tithe</div>
                  <div className="font-mono font-black text-2xl text-indigo-300">
                    {currentStats.taxRate}%
                  </div>
                  <div className="text-[11px] text-stone-500">Levied on farmstead harvests</div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-stone-900/50 space-y-1">
                  <div className="text-xs text-stone-400">Realm Registered Parcels</div>
                  <div className="font-mono font-black text-2xl text-emerald-300">
                    {currentStats.totalParcels}
                  </div>
                  <div className="text-[11px] text-stone-500">Active feudal holdings</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-stone-400">
          <span>Press [Esc] or click close to return to the 3D world</span>
          <span className="font-mono">Sovereign Lands Citadel v1.0 • Polygon Amoy</span>
        </div>
      </div>
    </div>
  );
}

export default CitadelCouncilModal;
