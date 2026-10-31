'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import { MessageSquare } from 'lucide-react';

export interface FloatingSpeechBubbleProps {
  text?: string;
  visible?: boolean;
  speakerName?: string;
  faction?: 'north' | 'south' | 'neutral';
  position?: [number, number, number];
  distanceFactor?: number;
}

/**
 * 3D Billboard Speech Bubble hovering over an NPC's head.
 * Displays ambient barks and dialogue cues with high readability and medieval styling.
 */
export function FloatingSpeechBubble({
  text,
  visible = true,
  speakerName,
  faction = 'north',
  position = [0, 2.25, 0],
  distanceFactor = 12,
}: FloatingSpeechBubbleProps) {
  if (!visible || !text || text.trim().length === 0) {
    return null;
  }

  const factionColors = {
    north: {
      border: 'border-sky-500/60',
      badge: 'bg-sky-500/20 text-sky-300',
      glow: 'shadow-[0_4px_20px_rgba(56,189,248,0.25)]',
    },
    south: {
      border: 'border-amber-500/60',
      badge: 'bg-amber-500/20 text-amber-300',
      glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
    },
    neutral: {
      border: 'border-indigo-500/60',
      badge: 'bg-indigo-500/20 text-indigo-300',
      glow: 'shadow-[0_4px_20px_rgba(99,102,241,0.25)]',
    },
  }[faction];

  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'all 0.25s ease-out',
      }}
    >
      <div className="relative flex flex-col items-center animate-bounce-short">
        {/* Main Speech Container */}
        <div
          className={`relative max-w-[220px] px-3.5 py-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md border ${factionColors.border} ${factionColors.glow} text-zinc-100 shadow-xl`}
        >
          {/* Header with speaker name */}
          {speakerName && (
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-2.5 h-2.5 text-amber-400" />
              <span className={`text-[10px] font-serif font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${factionColors.badge}`}>
                {speakerName}
              </span>
            </div>
          )}

          {/* Speech Text */}
          <p className="text-[11px] font-sans leading-tight text-zinc-200 tracking-tight">
            &ldquo;{text}&rdquo;
          </p>
        </div>

        {/* Speech Bubble Pointer / Tail */}
        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[6px] border-t-zinc-950/90 -mt-[1px]" />
      </div>
    </Html>
  );
}

export default FloatingSpeechBubble;
