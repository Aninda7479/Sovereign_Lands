'use client';

import React, { useState } from 'react';
import {
  Home,
  Shield,
  Coins,
  Sparkles,
  X,
  Check,
  Building,
  TreePine,
  Layers,
  Info,
} from 'lucide-react';
import { StructureTypeEnum } from '@/lib/assets/modelRegistry';
import { STRUCTURE_BUILD_INFO, StructureBuildCost } from '@/hooks/useBuildingPlacement';

export interface BuildingMenuHUDProps {
  isOpen: boolean;
  selectedStructure: StructureTypeEnum;
  playerGold: number;
  onSelectStructure: (type: StructureTypeEnum) => void;
  onConfirmBuild: () => void;
  onClose: () => void;
  canBuildHere?: boolean;
  validationReason?: string | null;
}

type TabCategory = 'residential' | 'civic' | 'fortress';

interface BuildingItemDisplay {
  type: StructureTypeEnum;
  category: TabCategory;
  icon: string;
  badge: string;
  perk: string;
}

const BUILDING_ITEMS: BuildingItemDisplay[] = [
  // Residential Houses
  {
    type: StructureTypeEnum.HouseThatched,
    category: 'residential',
    icon: '🛖',
    badge: 'Cozy Peasant Home',
    perk: '+2 Pop • +2 Gold/min',
  },
  {
    type: StructureTypeEnum.HouseTimber,
    category: 'residential',
    icon: '🏡',
    badge: 'Tudor Merchant Villa',
    perk: '+5 Pop • +4 Gold/min',
  },
  {
    type: StructureTypeEnum.HouseStone,
    category: 'residential',
    icon: '🏰',
    badge: 'Fortified Stone Manor',
    perk: '+10 Pop • +3 Defense',
  },
  {
    type: StructureTypeEnum.HouseWizard,
    category: 'residential',
    icon: '🔮',
    badge: 'Arcane Wizard Sanctum',
    perk: '+10 Magic • +5 Gold/min',
  },
  {
    type: StructureTypeEnum.HouseCabin,
    category: 'residential',
    icon: '🪵',
    badge: 'Alpine Pine Cabin',
    perk: '+3 Pop • +2 Gold/min',
  },

  // Civic & Parks
  {
    type: StructureTypeEnum.Fountain,
    category: 'civic',
    icon: '⛲',
    badge: 'Royal Tiered Fountain',
    perk: '+8 Morale • +3 Gold/min',
  },

  // Fortress & Production
  {
    type: StructureTypeEnum.Farmstead,
    category: 'fortress',
    icon: '🌾',
    badge: 'Estate & Windmill',
    perk: '+5 Gold/min (10% tithe)',
  },
  {
    type: StructureTypeEnum.GuardTower,
    category: 'fortress',
    icon: '🗼',
    badge: 'Sentry Watchtower',
    perk: '+8 Kingdom Defense',
  },
  {
    type: StructureTypeEnum.StoneWall,
    category: 'fortress',
    icon: '🧱',
    badge: 'Curtain Stone Wall',
    perk: '+6 Barricade Defense',
  },
  {
    type: StructureTypeEnum.CastleKeep,
    category: 'fortress',
    icon: '👑',
    badge: 'Citadel Fortress Keep',
    perk: '+10 Attack • +5 Defense',
  },
];

export function BuildingMenuHUD({
  isOpen,
  selectedStructure,
  playerGold,
  onSelectStructure,
  onConfirmBuild,
  onClose,
  canBuildHere = true,
  validationReason,
}: BuildingMenuHUDProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('residential');

  if (!isOpen) return null;

  const filteredItems = BUILDING_ITEMS.filter((item) => item.category === activeTab);
  const activeInfo = STRUCTURE_BUILD_INFO[selectedStructure] || STRUCTURE_BUILD_INFO[StructureTypeEnum.HouseThatched];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-auto select-none">
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/60 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl text-zinc-100 p-5 flex flex-col gap-4">
        {/* Header: Title, Category Tabs, Close */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-base shadow-md">
              <Building className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-amber-100 flex items-center gap-2">
                <span>Royal Architect & Construction Registry</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mode [C]
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Select architectural house styles, civic fountains, or defensive battlements
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setActiveTab('residential')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition ${
                activeTab === 'residential'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🏡 Houses</span>
            </button>
            <button
              onClick={() => setActiveTab('civic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition ${
                activeTab === 'civic'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⛲ Civics & Parks</span>
            </button>
            <button
              onClick={() => setActiveTab('fortress')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition ${
                activeTab === 'fortress'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🏰 Citadel Defenses</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structure Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filteredItems.map((item, idx) => {
            const info = STRUCTURE_BUILD_INFO[item.type];
            if (!info) return null;
            const isSelected = selectedStructure === item.type;
            const canAfford = playerGold >= info.goldCost;

            return (
              <div
                key={item.type}
                onClick={() => onSelectStructure(item.type)}
                className={`group relative flex flex-col justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-102 ring-2 ring-amber-400/50'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Top: Icon & Number shortcut */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl drop-shadow">{item.icon}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      #{idx + 1}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-xs text-zinc-100 group-hover:text-amber-200 leading-tight">
                    {info.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{item.badge}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span
                      className={`text-xs font-mono font-bold ${
                        canAfford ? 'text-amber-300' : 'text-red-400'
                      }`}
                    >
                      {info.goldCost}g
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500">
                    {info.width}x{info.depth}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Structure Footer Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Selected Blueprint:</span>
            <span className="font-serif font-bold text-amber-200 text-sm">
              {activeInfo?.name}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
              {activeInfo?.description}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {validationReason && (
              <span className="text-xs text-amber-400/90 font-sans italic">
                ⚠️ {validationReason}
              </span>
            )}

            <button
              onClick={onConfirmBuild}
              disabled={!canBuildHere || playerGold < activeInfo.goldCost}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Construct Structure ({activeInfo?.goldCost}g)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildingMenuHUD;
