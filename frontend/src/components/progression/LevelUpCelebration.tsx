'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Crown,
  Sparkles,
  Zap,
  Wheat,
  ShieldAlert,
  ShoppingBag,
  ArrowRight,
  Trophy,
  Check,
} from 'lucide-react';

export interface LevelUpCelebrationProps {
  isOpen: boolean;
  level: number;
  title: string;
  unlockedPerks?: string[];
  onClose: () => void;
}

/**
 * Returns default thematic perks unlocked at a given progression level.
 */
function getDefaultPerksForLevel(level: number): string[] {
  switch (level) {
    case 2:
      return [
        '+5% Continental Movement Speed',
        '+10% Farmstead Harvest Tithe Yield',
        'Torvald’s Iron Forge Tier II Wares Unlocked',
      ];
    case 3:
      return [
        '+8% Continental Movement Speed',
        '+15% Farmstead Harvest Tithe Yield',
        'Sanctuary Apothecary Rare Elixirs Accessible',
      ];
    case 4:
      return [
        '+12% Movement Speed & Sprint Endurance',
        '+20% Farmstead Harvest Tithe Yield',
        'Cedric’s Merchant Guild Exotic Blueprints Available',
      ];
    case 5:
      return [
        '+15% Movement Speed',
        '+25% Harvest Tithe Yield',
        'Arcane Reliquary & Solara Curios Market Unlocked',
        'High Baron Council Voting Weight Increased',
      ];
    case 6:
      return [
        '+20% Movement Speed',
        '+35% Harvest Tithe Yield',
        'Citadel War Table Sovereign Decrees Available',
      ];
    case 7:
    default:
      return [
        '+25% Sovereign Movement Speed',
        '+50% Farmstead Harvest Tithe Yield',
        'Master of Continental Trade & Crown Sovereignty',
      ];
  }
}

/**
 * Spectacular GTA / Witcher 3 Style Level-Up Celebration Modal & Banner.
 * Plays triumphant procedural brass chords on mount and displays level, noble title,
 * and unlocked perks. Auto-dismisses in 6 seconds or on Space/Esc/Click.
 */
export function LevelUpCelebration({
  isOpen,
  level,
  title,
  unlockedPerks,
  onClose,
}: LevelUpCelebrationProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(6);

  // Procedural Web Audio Brass Fanfare: C5 -> E5 -> G5 -> C6 -> E6
  const playFanfare = useCallback(() => {
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

      // Brass Fanfare notes (Hz): C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50), E6 (1318.51)
      const fanfareNotes = [
        { freq: 523.25, time: 0.0, duration: 0.25 },
        { freq: 659.25, time: 0.16, duration: 0.25 },
        { freq: 783.99, time: 0.32, duration: 0.35 },
        { freq: 1046.5, time: 0.52, duration: 1.6 },
        { freq: 1318.51, time: 0.65, duration: 1.5 },
      ];

      fanfareNotes.forEach((n) => {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        // Sawtooth & Triangle blend for warm brass character
        osc.type = 'sawtooth';
        oscHarmonic.type = 'triangle';

        const startTime = now + n.time;
        const endTime = startTime + n.duration;

        osc.frequency.setValueAtTime(n.freq, startTime);
        oscHarmonic.frequency.setValueAtTime(n.freq * 2, startTime); // 1 octave above for brass sheen

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        oscHarmonic.start(startTime);
        osc.stop(endTime);
        oscHarmonic.stop(endTime);
      });
    } catch {
      // Audio autoplay gracefully suppressed
    }
  }, []);

  // Play fanfare and start auto-dismiss countdown on open
  useEffect(() => {
    if (!isOpen) return;

    playFanfare();
    setTimeLeft(6);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, playFanfare, onClose]);

  // Keyboard dismiss (Space, Escape, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayPerks = unlockedPerks && unlockedPerks.length > 0
    ? unlockedPerks
    : getDefaultPerksForLevel(level);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Level Up Celebration: Level ${level}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Golden Radial Aura Effect */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 blur-3xl animate-pulse" />
        <div className="absolute w-[800px] h-[800px] border border-amber-500/10 rounded-full animate-ping duration-1000" />
      </div>

      {/* Main Celebratory Parchment Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl mx-auto rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-8 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center text-white overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-300"
      >
        {/* Top Ornate Ribbon Accents */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-6 py-0.5 rounded-b-xl bg-amber-500/20 border-b border-amber-400/40 text-[10px] font-mono tracking-widest text-amber-300 uppercase">
          ✦ Imperial Ascendance ✦
        </div>

        {/* Floating Crown / Laurel Wreath Emblems */}
        <div className="mt-4 flex justify-center items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600/40 via-yellow-500/40 to-amber-300/40 border border-amber-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)]">
              <Crown className="w-12 h-12 text-amber-300 animate-bounce" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-yellow-300 animate-spin duration-3000" />
            <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Title & Banner Headline */}
        <div className="mt-6 space-y-1">
          <h1 className="font-serif font-black text-4xl sm:text-5xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-500 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)] uppercase">
            LEVEL UP!
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm tracking-wider uppercase font-medium">
            You have attained Prestige Level {level}
          </p>
        </div>

        {/* Noble Title Plaque */}
        <div className="mt-4 inline-flex items-center gap-2.5 px-6 py-2 rounded-2xl bg-amber-950/50 border border-amber-400/40 shadow-inner">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-serif font-bold text-lg sm:text-xl text-amber-200 tracking-wide">
            {title}
          </span>
        </div>

        {/* Stat Improvements / Unlocked Perks Box */}
        <div className="mt-6 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-left space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Sovereign Perks Unlocked
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Tier {level} Status</span>
          </div>

          <div className="space-y-2 pt-1">
            {displayPerks.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-zinc-200 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60"
              >
                <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span className="leading-tight font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button & Auto-dismiss prompt */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
              Space
            </kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300">
              Esc
            </kbd>
            <span>to dismiss ({timeLeft}s)</span>
          </div>

          <button
            onClick={() => {
              onClose();
            }}
            className="w-full sm:w-auto px-7 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-serif font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:shadow-[0_0_30px_rgba(251,191,36,0.9)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue Adventure</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LevelUpCelebration;
