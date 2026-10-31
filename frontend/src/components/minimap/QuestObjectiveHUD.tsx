'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scroll,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Trophy,
  Coins,
  Shield,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { WaypointData } from './RadarMiniMap';

export interface QuestStep {
  id: string;
  label: string;
  instruction: string;
  hotkey?: string;
  isCompleted: boolean;
  waypoint?: { x: number; z: number; label: string };
}

export interface QuestMission {
  id: number;
  numberTitle: string; // e.g. "MISSION I"
  title: string;       // e.g. "THE CLAIM"
  subtitle: string;    // e.g. "Frontier Settlement"
  loreText: string;
  goldReward: number;
  honorReward: number;
  steps: QuestStep[];
}

export interface QuestObjectiveHUDProps {
  onWaypointChange?: (waypoint: WaypointData) => void;
  className?: string;
  defaultCollapsed?: boolean;
}

// Initial 3 Canonical Onboarding Missions
const INITIAL_MISSIONS: QuestMission[] = [
  {
    id: 1,
    numberTitle: 'MISSION I',
    title: 'THE CLAIM',
    subtitle: 'Frontier Settlement',
    loreText:
      'The Sovereign North invites wanderers to stake their permanent birthright on the continental frontier. Travel across the frost ridge and secure your first sovereign 3D parcel on-chain.',
    goldReward: 150,
    honorReward: 50,
    steps: [
      {
        id: 'm1_step1',
        label: 'Travel to the Frontier Claim Zone',
        instruction: 'Move past the border stones towards coordinate [-40, -40]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: -40, z: -40, label: 'Frontier Claim Zone' },
      },
      {
        id: 'm1_step2',
        label: 'Initiate Land Claim Interface',
        instruction: 'Press [B] while standing inside an unclaimed parcel',
        hotkey: 'B',
        isCompleted: false,
        waypoint: { x: -40, z: -40, label: 'Claimable Frontier Parcel' },
      },
      {
        id: 'm1_step3',
        label: 'Sign the Royal Land Deed',
        instruction: 'Mint the parcel on Polygon Amoy testnet with 0.001 POL',
        isCompleted: false,
      },
    ],
  },
  {
    id: 2,
    numberTitle: 'MISSION II',
    title: 'HARVEST & TITHE',
    subtitle: 'Agrarian Might',
    loreText:
      'Empty dirt cannot feed an army. Erect a Farmstead upon your claimed soil to yield continuous golden grain. Tithe 10% to the common treasury to secure Citadel favor.',
    goldReward: 300,
    honorReward: 100,
    steps: [
      {
        id: 'm2_step1',
        label: 'Enter 3D Construction Mode',
        instruction: 'Press [C] to project procedural architectural holograms',
        hotkey: 'C',
        isCompleted: false,
      },
      {
        id: 'm2_step2',
        label: 'Construct a Farmstead',
        instruction: 'Place a Farmstead on your parcel grid [Cost: 50 Gold]',
        isCompleted: false,
        waypoint: { x: -35, z: -65, label: 'Farmstead Site' },
      },
      {
        id: 'm2_step3',
        label: 'Harvest First Grain Yield',
        instruction: 'Approach the golden crop silo and press [E] to harvest',
        hotkey: 'E',
        isCompleted: false,
        waypoint: { x: -35, z: -65, label: 'Crop Silo' },
      },
      {
        id: 'm2_step4',
        label: 'Pay Royal Tithe',
        instruction: 'Deposit your 10% grain tithe to support the realm garrison',
        isCompleted: false,
      },
    ],
  },
  {
    id: 3,
    numberTitle: 'MISSION III',
    title: 'COUNCIL OF WAR',
    subtitle: 'Kingdom Sovereign',
    loreText:
      'Dark clouds gather along the Great Divide. Ascend to the High Citadel, confer with Crown Advisor Merin, and cast your sovereign vote on the declaration of realm war.',
    goldReward: 500,
    honorReward: 250,
    steps: [
      {
        id: 'm3_step1',
        label: 'Enter the High Citadel Keep',
        instruction: 'Ascend the stone mountain ramp to the North Citadel [0, -120]',
        waypoint: { x: 0, z: -120, label: 'North Citadel Gates' },
        isCompleted: false,
      },
      {
        id: 'm3_step2',
        label: 'Confer with Advisor Merin',
        instruction: 'Press [E] to discuss war statistics and parcel defense ratings',
        hotkey: 'E',
        waypoint: { x: 30, z: -110, label: 'Advisor Merin' },
        isCompleted: false,
      },
      {
        id: 'm3_step3',
        label: 'Cast Sovereign Vote on Realm Decree',
        instruction: 'Access the War Table and submit your on-chain ballot',
        isCompleted: false,
        waypoint: { x: 28, z: -112, label: 'Citadel War Table' },
      },
    ],
  },
];

/**
 * GTA-Style Onboarding Quest & Mission Tracker HUD
 * Features:
 * - Top-left anchored mission dossier
 * - Step-by-step interactive quest objectives with keybindings ([B], [C], [E], [WASD])
 * - Synchronizes active quest target waypoint with RadarMiniMap & CompassHeading
 * - Web Audio procedural sound synthesizer for objective chimes and GTA-style "MISSION PASSED" fanfare
 * - Mission progression, completion reward toasts, and mission switcher
 */
export function QuestObjectiveHUD({
  onWaypointChange,
  className = '',
  defaultCollapsed = false,
}: QuestObjectiveHUDProps) {
  const [missions, setMissions] = useState<QuestMission[]>(INITIAL_MISSIONS);
  const [activeMissionIndex, setActiveMissionIndex] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastCompletedReward, setLastCompletedReward] = useState<{ gold: number; honor: number } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const currentMission = missions[activeMissionIndex] || missions[0];

  // Procedural Web Audio Synthesizer
  const playSoundEffect = useCallback((type: 'step' | 'complete') => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'step') {
        // High crisp double-chime
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880, now + 0.08); // A5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else if (type === 'complete') {
        // Glorious GTA-style brass / fanfare chords: C5 -> E5 -> G5 -> C6
        const chord = [523.25, 659.25, 783.99, 1046.5];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.18, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + 1.2);
        });
      }
    } catch (e) {
      // Audio autoplay gracefully suppressed
    }
  }, []);

  // Update active waypoint whenever current active step changes
  useEffect(() => {
    const incompleteStep = currentMission.steps.find((s) => !s.isCompleted);
    const targetWp = incompleteStep?.waypoint;

    const wpData: WaypointData = targetWp
      ? {
          id: `quest_wp_${currentMission.id}`,
          x: targetWp.x,
          z: targetWp.z,
          label: targetWp.label,
          description: incompleteStep?.instruction,
          icon: 'quest',
        }
      : {
          id: `quest_wp_${currentMission.id}_fallback`,
          x: -40,
          z: -40,
          label: currentMission.title,
          description: currentMission.subtitle,
          icon: 'quest',
        };

    onWaypointChange?.(wpData);

    // Broadcast globally to Radar and Compass
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sovereign-waypoint-set', { detail: wpData })
      );
    }
  }, [currentMission, onWaypointChange]);

  // Toggle step completion
  const handleToggleStep = (stepId: string) => {
    setMissions((prevMissions) => {
      const updated = prevMissions.map((m, mIdx) => {
        if (mIdx !== activeMissionIndex) return m;

        const updatedSteps = m.steps.map((s) => {
          if (s.id === stepId) {
            return { ...s, isCompleted: !s.isCompleted };
          }
          return s;
        });

        // Check if all steps in this mission are now completed
        const allDone = updatedSteps.every((s) => s.isCompleted);
        if (allDone && !m.steps.every((s) => s.isCompleted)) {
          // Mission Passed!
          playSoundEffect('complete');
          setLastCompletedReward({ gold: m.goldReward, honor: m.honorReward });
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);

          // Auto-advance to next mission if available
          if (activeMissionIndex < prevMissions.length - 1) {
            setTimeout(() => {
              setActiveMissionIndex((idx) => Math.min(prevMissions.length - 1, idx + 1));
            }, 3000);
          }
        } else {
          playSoundEffect('step');
        }

        return { ...m, steps: updatedSteps };
      });
      return updated;
    });
  };

  // Reset current mission progress
  const handleResetMission = () => {
    setMissions((prev) =>
      prev.map((m, idx) => {
        if (idx !== activeMissionIndex) return m;
        return {
          ...m,
          steps: m.steps.map((s) => ({ ...s, isCompleted: false })),
        };
      })
    );
  };

  return (
    <>
      {/* GTA "MISSION PASSED" Celebration Banner Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center bg-zinc-950/90 border-y-2 border-amber-400/90 w-full py-8 backdrop-blur-xl shadow-[0_0_60px_rgba(251,191,36,0.5)]">
            <div className="font-serif font-black text-3xl md:text-5xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 uppercase drop-shadow-[0_2px_15px_rgba(251,191,36,0.9)] animate-pulse">
              MISSION PASSED
            </div>
            <div className="font-mono text-sm tracking-widest text-zinc-300 mt-2 uppercase">
              {currentMission.title} — {currentMission.subtitle}
            </div>

            {/* Rewards */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/60 px-4 py-1.5 rounded-full">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="font-mono font-bold text-amber-300 text-base">
                  +{lastCompletedReward?.gold || currentMission.goldReward} GOLD
                </span>
              </div>
              <div className="flex items-center gap-2 bg-sky-500/20 border border-sky-400/60 px-4 py-1.5 rounded-full">
                <Shield className="w-5 h-5 text-sky-400" />
                <span className="font-mono font-bold text-sky-300 text-base">
                  +{lastCompletedReward?.honor || currentMission.honorReward} HONOR
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Top-Left Mission Dossier Tracker */}
      <div
        className={`fixed top-4 left-4 z-35 font-sans select-none transition-all duration-300 ${className}`}
        data-testid="quest-objective-hud"
      >
        <div className="w-[320px] rounded-2xl border border-zinc-700/80 bg-zinc-950/92 backdrop-blur-md shadow-[0_4px_35px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-400">
                <Scroll className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-black tracking-widest text-amber-400/90 leading-tight">
                  {currentMission.numberTitle}
                </span>
                <span className="text-xs font-serif font-black tracking-wider text-zinc-100 uppercase leading-tight">
                  {currentMission.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mission Selector Dropdown Pill */}
              <select
                aria-label="Select Active Mission"
                value={activeMissionIndex}
                onChange={(e) => setActiveMissionIndex(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-mono rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-400/80 transition"
              >
                {missions.map((m, idx) => (
                  <option key={m.id} value={idx}>
                    M{idx + 1}: {m.title}
                  </option>
                ))}
              </select>

              {/* Collapse/Expand Toggle */}
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                title={isCollapsed ? 'Expand Quest Log' : 'Collapse Quest Log'}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Mission Details & Step Checklist */}
          {!isCollapsed && (
            <div className="p-3.5 flex flex-col gap-3">
              {/* Mission Subtitle & Brief */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 font-bold">
                  {currentMission.subtitle}
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed mt-1 font-sans">
                  {currentMission.loreText}
                </p>
              </div>

              {/* Objectives Checklist */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  DIRECTIVES & TASKS
                </span>

                {currentMission.steps.map((step, idx) => {
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleToggleStep(step.id)}
                      className={`group flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        step.isCompleted
                          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60'
                          : 'bg-zinc-900/80 border-amber-400/40 hover:border-amber-400/90 shadow-md'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <button
                        className="mt-0.5 text-zinc-400 group-hover:text-amber-400 transition"
                        title="Click to toggle objective completion"
                      >
                        {step.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-400" />
                        )}
                      </button>

                      {/* Step Text & Hotkey */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold leading-tight ${
                              step.isCompleted
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-100'
                            }`}
                          >
                            {step.label}
                          </span>

                          {/* GTA Style Keyboard Badge e.g. [B] */}
                          {step.hotkey && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/60 font-mono font-bold text-[9px] text-amber-300">
                              [{step.hotkey}]
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                          {step.instruction}
                        </span>

                        {/* Waypoint coordinates indicator */}
                        {step.waypoint && !step.isCompleted && (
                          <div className="flex items-center gap-1 text-[9px] font-mono text-amber-300/80 mt-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>
                              Waypoint: [{step.waypoint.x}, {step.waypoint.z}]
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rewards & Reset Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Bounty:</span>
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {currentMission.goldReward}G
                  </span>
                  <span className="text-sky-300 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {currentMission.honorReward} XP
                  </span>
                </div>

                <button
                  onClick={handleResetMission}
                  title="Reset Mission Objectives"
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default QuestObjectiveHUD;
