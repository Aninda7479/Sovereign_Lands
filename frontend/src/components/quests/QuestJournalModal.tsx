'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Scroll,
  CheckCircle2,
  Circle,
  MapPin,
  Sparkles,
  Trophy,
  Coins,
  Shield,
  Layers,
  ArrowRight,
  X,
  Compass,
  Gift,
  Lock,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { usePlayerProgression } from '@/providers/PlayerProgressionProvider';
import { QuestData, QuestStep, RPGItem } from '@/lib/rpg/types';
import { soundManager } from '@/lib/audio/SoundManager';

export interface QuestJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWaypoint?: (waypoint: { x: number; z: number; label: string }) => void;
}

/**
 * Returns Tailwind badge classes for item rarity levels
 */
function getRarityStyle(rarity: string) {
  switch (rarity) {
    case 'legendary':
      return 'border-amber-400 text-amber-300 bg-amber-950/60 shadow-[0_0_10px_rgba(251,191,36,0.4)]';
    case 'epic':
      return 'border-purple-400 text-purple-300 bg-purple-950/50';
    case 'rare':
      return 'border-sky-400 text-sky-300 bg-sky-950/50';
    case 'uncommon':
      return 'border-emerald-400 text-emerald-300 bg-emerald-950/50';
    case 'common':
    default:
      return 'border-zinc-600 text-zinc-300 bg-zinc-900/60';
  }
}

/**
 * Interactive GTA / Witcher-style Quest Journal Modal.
 * Dual-pane parchment layout displaying active, available, and completed quests,
 * interactive step checklists, GPS waypoint targeting, rewards, and claim fanfare.
 */
export function QuestJournalModal({
  isOpen,
  onClose,
  onSelectWaypoint,
}: QuestJournalModalProps) {
  const {
    quests,
    activeQuestId,
    level,
    completeQuestStep,
    claimQuestReward,
    setActiveQuestId,
  } = usePlayerProgression();

  const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || 'quest_1');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'available' | 'completed'>('all');
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play procedural brass reward fanfare on claim
  const playRewardFanfare = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // High triumphant fanfare chord: G4 -> C5 -> E5 -> G5 -> C6
      const chord = [392.0, 523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.2);
      });
    } catch {
      // Audio suppressed
    }
  }, []);

  // Sync selectedQuestId with activeQuestId when modal opens if needed
  useEffect(() => {
    if (isOpen && activeQuestId) {
      // If currently selected quest is not found or empty, select active
      setSelectedQuestId((prev) => {
        const exists = quests.some((q) => q.id === prev);
        return exists ? prev : activeQuestId;
      });
    }
  }, [isOpen, activeQuestId, quests]);

  // Keyboard shortcut listener (J or Esc closes journal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Categorize quests
  const categorizedQuests = useMemo(() => {
    const active: QuestData[] = [];
    const available: QuestData[] = [];
    const completed: QuestData[] = [];

    quests.forEach((q) => {
      if (q.isClaimed) {
        completed.push(q);
      } else if (q.id === activeQuestId) {
        active.push(q);
      } else {
        available.push(q);
      }
    });

    return { active, available, completed };
  }, [quests, activeQuestId]);

  // Filtered quest list for left pane
  const displayedQuests = useMemo(() => {
    switch (filterTab) {
      case 'active':
        return categorizedQuests.active;
      case 'available':
        return categorizedQuests.available;
      case 'completed':
        return categorizedQuests.completed;
      case 'all':
      default:
        return quests;
    }
  }, [filterTab, categorizedQuests, quests]);

  // The currently active quest being inspected in right pane
  const currentQuest = useMemo(() => {
    return quests.find((q) => q.id === selectedQuestId) || quests[0] || null;
  }, [quests, selectedQuestId]);

  // Check if all steps in the current inspected quest are completed
  const allStepsCompleted = useMemo(() => {
    if (!currentQuest || !currentQuest.steps || currentQuest.steps.length === 0) return false;
    return currentQuest.steps.every((s) => s.isCompleted);
  }, [currentQuest]);

  // Dispatch Waypoint GPS event to minimap and compass
  const handleSetWaypoint = useCallback(
    (wp: { x: number; z: number; label: string }, instruction?: string) => {
      soundManager.playClick();
      onSelectWaypoint?.(wp);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sovereign-waypoint-set', {
            detail: {
              id: `quest_wp_${currentQuest?.id || 'target'}`,
              x: wp.x,
              z: wp.z,
              label: wp.label,
              description: instruction || 'Active Quest Destination',
              icon: 'quest',
            },
          })
        );
      }
    },
    [currentQuest, onSelectWaypoint]
  );

  // Set quest as active tracker
  const handleTrackQuest = useCallback(() => {
    if (!currentQuest) return;
    soundManager.playClick();
    setActiveQuestId(currentQuest.id);

    // Auto set waypoint to first incomplete step with coordinates
    const firstStepWithWp = currentQuest.steps.find((s) => !s.isCompleted && s.waypoint);
    if (firstStepWithWp && firstStepWithWp.waypoint) {
      handleSetWaypoint(firstStepWithWp.waypoint, firstStepWithWp.instruction);
    }
  }, [currentQuest, setActiveQuestId, handleSetWaypoint]);

  // Claim quest reward
  const handleClaimReward = useCallback(() => {
    if (!currentQuest) return;
    playRewardFanfare();
    claimQuestReward(currentQuest.id);
  }, [currentQuest, playRewardFanfare, claimQuestReward]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quest Journal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[88vh] max-h-[760px] rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white shadow-[0_0_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Ornate Header Bar */}
        <header className="relative px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.25)]">
              <Scroll className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif font-black text-xl tracking-wider text-amber-200 flex items-center gap-2">
                SOVEREIGN QUEST JOURNAL
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-[10px] font-mono text-amber-300">
                  [J]
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Imperial Chronicles, Decrees & Continental Expeditions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 text-xs">
              {(['all', 'active', 'available', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    soundManager.playClick();
                    setFilterTab(tab);
                  }}
                  className={`px-3 py-1 rounded-xl font-medium capitalize transition-all cursor-pointer ${
                    filterTab === tab
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
              title="Close Journal (Esc or J)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Body: Left Pane (List) + Right Pane (Dossier) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT PANE: Quest List */}
          <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col shrink-0 overflow-hidden">
            {/* Mobile Category Tab Selector */}
            <div className="sm:hidden flex items-center justify-around p-2 border-b border-zinc-800 bg-zinc-900/50 text-xs">
              {(['all', 'active', 'available', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-2 py-1 rounded-lg capitalize ${
                    filterTab === tab ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-zinc-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable Quest Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {displayedQuests.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
                  <Scroll className="w-8 h-8 mx-auto opacity-30" />
                  <p>No quests found in this category.</p>
                </div>
              ) : (
                displayedQuests.map((quest) => {
                  const isSelected = quest.id === currentQuest?.id;
                  const isActive = quest.id === activeQuestId;
                  const isLocked = quest.levelRequired > level;
                  const stepsDone = quest.steps.filter((s) => s.isCompleted).length;
                  const totalSteps = quest.steps.length;
                  const isReadyToClaim =
                    !quest.isClaimed && quest.steps.every((s) => s.isCompleted);

                  return (
                    <div
                      key={quest.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedQuestId(quest.id);
                      }}
                      className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left select-none group ${
                        isSelected
                          ? 'border-amber-400/80 bg-gradient-to-r from-amber-950/50 to-zinc-900/80 shadow-lg shadow-amber-500/10'
                          : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700'
                      }`}
                    >
                      {/* Active Tracker Pin Indicator */}
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-mono text-amber-300">
                          <Compass className="w-2.5 h-2.5 text-amber-400 animate-spin duration-3000" />
                          <span>TRACKING</span>
                        </div>
                      )}

                      {/* Ready to claim glow tag */}
                      {isReadyToClaim && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300 animate-pulse">
                          <Gift className="w-2.5 h-2.5 text-emerald-400" />
                          <span>CLAIM REWARD</span>
                        </div>
                      )}

                      {/* Header line */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-400 tracking-wider">
                          {quest.numberTitle}
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                            <Lock className="w-2.5 h-2.5" />
                            <span>LVL {quest.levelRequired}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className={`font-serif font-bold text-sm tracking-wide mt-0.5 ${
                          isSelected ? 'text-amber-200' : 'text-zinc-100 group-hover:text-amber-100'
                        }`}
                      >
                        {quest.title}
                      </h3>

                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {quest.subtitle}
                      </p>

                      {/* Progress bar & Rewards brief */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                          <span>
                            {stepsDone}/{totalSteps} Steps
                          </span>
                          {quest.isClaimed && (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-amber-300 flex items-center gap-0.5">
                            <Coins className="w-3 h-3 text-amber-400" />+{quest.coinReward}
                          </span>
                          <span className="text-indigo-300 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3 text-indigo-400" />+{quest.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT PANE: Detailed Quest Dossier */}
          <main className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-zinc-950/40 via-zinc-900/40 to-black overflow-y-auto">
            {currentQuest ? (
              <div className="p-6 md:p-8 space-y-6 flex-1">
                {/* Dossier Header */}
                <div className="space-y-2 border-b border-zinc-800/80 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold tracking-widest uppercase">
                      {currentQuest.numberTitle}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-mono text-xs">
                        Req. Level {currentQuest.levelRequired}
                      </span>
                      {currentQuest.isClaimed ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED & CLAIMED
                        </span>
                      ) : allStepsCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold animate-pulse flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          READY TO CLAIM
                        </span>
                      ) : currentQuest.id === activeQuestId ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 font-mono text-xs font-bold flex items-center gap-1">
                          <Compass className="w-3 h-3 text-sky-400" />
                          ACTIVE MISSION
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 font-mono text-xs">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>

                  <h1 className="font-serif font-black text-2xl md:text-3xl text-amber-200 tracking-wide">
                    {currentQuest.title}
                  </h1>
                  <p className="text-sm font-medium text-amber-400/80 tracking-wide">
                    {currentQuest.subtitle}
                  </p>
                </div>

                {/* Narrative Lore Box */}
                <div className="relative p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs sm:text-sm leading-relaxed font-serif italic shadow-inner">
                  <div className="absolute top-2 left-2 text-zinc-700 text-lg select-none font-serif">
                    “
                  </div>
                  <p className="pl-3 pr-2 text-zinc-300">{currentQuest.loreText}</p>
                </div>

                {/* Interactive Objective Steps Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm tracking-wider text-amber-300 uppercase flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Quest Objectives
                    </h3>
                    <span className="text-xs font-mono text-zinc-400">
                      {currentQuest.steps.filter((s) => s.isCompleted).length} /{' '}
                      {currentQuest.steps.length} Complete
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {currentQuest.steps.map((step, idx) => {
                      return (
                        <div
                          key={step.id}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            step.isCompleted
                              ? 'border-emerald-500/30 bg-emerald-950/20'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                          }`}
                        >
                          {/* Checkbox & Details */}
                          <div
                            onClick={() => {
                              completeQuestStep(currentQuest.id, step.id);
                              soundManager.playClick();
                            }}
                            className="flex items-start gap-3 cursor-pointer select-none group"
                            title="Click to toggle objective completion"
                          >
                            <button
                              type="button"
                              className="mt-0.5 shrink-0 focus:outline-none"
                            >
                              {step.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                              )}
                            </button>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    step.isCompleted
                                      ? 'text-emerald-300 line-through'
                                      : 'text-zinc-100 group-hover:text-amber-200'
                                  }`}
                                >
                                  {idx + 1}. {step.label}
                                </span>
                                {step.hotkey && (
                                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
                                    [{step.hotkey}]
                                  </kbd>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug">
                                {step.instruction}
                              </p>
                            </div>
                          </div>

                          {/* Waypoint GPS Button */}
                          {step.waypoint && (
                            <button
                              onClick={() => {
                                if (step.waypoint) {
                                  handleSetWaypoint(step.waypoint, step.instruction);
                                }
                              }}
                              className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-mono font-medium transition active:scale-95 cursor-pointer shadow-sm"
                              title="Set GPS marker on Radar & Compass"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>GPS [{step.waypoint.x}, {step.waypoint.z}]</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rewards Box */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-serif font-bold text-xs tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      Quest Completion Rewards
                    </span>
                    {currentQuest.isClaimed && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        ✓ CLAIMED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Gold Coins Reward */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-mono">Gold Bounty</div>
                        <div className="font-mono font-bold text-sm text-amber-300">
                          +{currentQuest.coinReward} Coins
                        </div>
                      </div>
                    </div>

                    {/* XP Reward */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-mono">Experience</div>
                        <div className="font-mono font-bold text-sm text-indigo-300">
                          +{currentQuest.xpReward} XP
                        </div>
                      </div>
                    </div>

                    {/* Item Reward */}
                    {currentQuest.itemReward ? (
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-xl border ${getRarityStyle(
                          currentQuest.itemReward.rarity
                        )}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-amber-400/30 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase font-mono tracking-widest text-zinc-300">
                            {currentQuest.itemReward.rarity} {currentQuest.itemReward.category}
                          </div>
                          <div className="font-serif font-bold text-xs truncate text-amber-100">
                            {currentQuest.itemReward.name}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-xs font-mono">
                        <span>No bonus item</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                Select a quest from the ledger to inspect details.
              </div>
            )}

            {/* Action Footer */}
            {currentQuest && (
              <footer className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {currentQuest.id === activeQuestId ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-950/60 border border-sky-400/50 text-sky-200 text-xs font-bold font-mono">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>CURRENTLY TRACKED</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleTrackQuest}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-zinc-200 hover:text-white text-xs font-serif font-bold tracking-wider uppercase transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <Compass className="w-4 h-4 text-amber-400" />
                      <span>Track Quest</span>
                    </button>
                  )}
                </div>

                <div>
                  {currentQuest.isClaimed ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-serif font-bold tracking-wider uppercase cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Reward Claimed</span>
                    </button>
                  ) : allStepsCompleted ? (
                    <button
                      onClick={handleClaimReward}
                      className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-serif font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse active:scale-95 transition-all cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Claim Reward</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-xs font-serif font-bold tracking-wider uppercase cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Objectives Incomplete</span>
                    </button>
                  )}
                </div>
              </footer>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default QuestJournalModal;
