'use client';

import React from 'react';
import {
  Crown,
  Flag,
  Sparkles,
  Wind,
  Gem,
  ShieldAlert,
  CircleDot,
  Sword,
  Shield,
  HardHat,
  Zap,
  Coins,
  ShieldCheck,
  Landmark,
  Castle,
  Warehouse,
  Flame,
  FlaskConical,
  Hammer,
  Wheat,
  Store,
  Package,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ItemRarity } from '@/lib/inventory/types';

export const RARITY_THEMES: Record<
  ItemRarity,
  {
    name: string;
    border: string;
    bg: string;
    text: string;
    badgeBg: string;
    glow: string;
    accent: string;
  }
> = {
  common: {
    name: 'Common',
    border: 'border-zinc-700/80 hover:border-zinc-500',
    bg: 'bg-zinc-900/60',
    text: 'text-zinc-300',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    glow: 'hover:shadow-[0_0_15px_rgba(161,161,170,0.15)]',
    accent: 'zinc-400',
  },
  uncommon: {
    name: 'Uncommon',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    glow: 'hover:shadow-[0_0_18px_rgba(16,185,129,0.25)]',
    accent: 'emerald-400',
  },
  rare: {
    name: 'Rare',
    border: 'border-sky-500/50 hover:border-sky-400',
    bg: 'bg-sky-950/30',
    text: 'text-sky-300',
    badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
    glow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]',
    accent: 'sky-400',
  },
  epic: {
    name: 'Epic',
    border: 'border-purple-500/60 hover:border-purple-400',
    bg: 'bg-purple-950/35',
    text: 'text-purple-300',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    glow: 'hover:shadow-[0_0_22px_rgba(168,85,247,0.35)]',
    accent: 'purple-400',
  },
  legendary: {
    name: 'Legendary',
    border: 'border-amber-500/70 hover:border-amber-400 ring-1 ring-amber-500/30',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    glow: 'hover:shadow-[0_0_26px_rgba(245,158,11,0.45)] drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    accent: 'amber-400',
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  Crown,
  Flag,
  Sparkles,
  Wind,
  Gem,
  ShieldAlert,
  CircleDot,
  Sword,
  Shield,
  HardHat,
  Zap,
  Coins,
  ShieldCheck,
  Landmark,
  Castle,
  Warehouse,
  Flame,
  FlaskConical,
  Hammer,
  Wheat,
  Store,
  Package,
  Layers,
};

interface ItemIconProps {
  iconName: string;
  rarity?: ItemRarity;
  className?: string;
  size?: number;
}

export function ItemIcon({ iconName, rarity = 'common', className = '', size = 22 }: ItemIconProps) {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  const theme = RARITY_THEMES[rarity] || RARITY_THEMES.common;

  return (
    <div
      className={`inline-flex items-center justify-center transition-transform group-hover:scale-110 ${theme.text} ${className}`}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
}
