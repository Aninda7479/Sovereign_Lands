'use client';

import React, { useState, useEffect } from 'react';

const LORE_TIPS = [
  'The Great Divide river has separated the North and South kingdoms since the First War of the Realms.',
  'Constructing a Farmstead yields +5 Gold per minute, with a 10% tithe claimed for the royal treasury.',
  'Guard Towers and Stone Walls bolster your kingdom defense against rival siege incursions.',
  'Citadel proposals require at least 20% quorum of owned kingdom parcels to enact royal tax decrees.',
  'Hold [Shift] to sprint, press [C] to enter in-world building mode, and press [E] to interact with Citadel NPCs.',
  'Runes engraved along parcel borders glow Cyan for North, Crimson for South, and Gold for your personal sovereign domain.',
  'Castle Keeps provide massive combat influence (+10 Attack, +5 Defense) during seasonal war resolutions.',
  'Trading caravans cross the Great Stone Bridge daily to barter wheat, timber, and forged iron.',
];

interface LoadingScreenProps {
  progress?: number;
  statusText?: string;
}

export function LoadingScreen({ progress = 0, statusText = 'Entering Sovereign Lands...' }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * LORE_TIPS.length));
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LORE_TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md px-4 select-none">
      {/* Background Medieval Vignette & Motif */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/70 to-slate-950 pointer-events-none" />

      {/* Ornate Frame Container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full p-8 border-2 border-amber-600/40 rounded-2xl bg-slate-900/80 shadow-2xl shadow-black/80 text-center">
        {/* Animated Faction Crest */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-amber-400/50 flex items-center justify-center bg-gradient-to-b from-amber-500/20 to-sky-500/20 shadow-lg shadow-amber-500/20 animate-pulse">
            <span className="text-4xl filter drop-shadow">⚔️</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border border-slate-950 flex items-center justify-center text-xs font-bold text-slate-950">
            3D
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-serif drop-shadow-md">
          SOVEREIGN LANDS
        </h1>
        <p className="text-xs uppercase tracking-widest text-amber-500/80 mt-1 font-semibold">
          Open-World Medieval Sandbox
        </p>

        {/* Status Text & Progress Bar */}
        <div className="w-full mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>{statusText}</span>
            <span className="text-amber-400 font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-sky-400 rounded-full transition-all duration-300 shadow-md shadow-amber-400/50"
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        {/* Rotating Lore Tips Box */}
        <div className="mt-8 p-3.5 border border-amber-500/20 rounded-lg bg-slate-950/60 max-w-md min-h-[4.5rem] flex items-center justify-center">
          <p className="text-xs text-amber-200/80 italic leading-relaxed transition-opacity duration-500">
            "{LORE_TIPS[tipIndex]}"
          </p>
        </div>

        {/* Footer controls hint */}
        <div className="mt-5 text-[10px] text-slate-500 uppercase tracking-widest">
          WASD • Orbit Camera • RAPID 3D WebGL • Polygon Amoy
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
