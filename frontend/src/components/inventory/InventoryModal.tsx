'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  Coins,
  Sparkles,
  Zap,
  TrendingUp,
  Percent,
  Wind,
  Trash2,
  Check,
  ShoppingBag,
  Store,
  Crown,
  Sword,
  Gem,
  CircleDot,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { InventoryItem, EquipmentSlot, ItemCategory } from '@/lib/inventory/types';
import { ItemIcon, RARITY_THEMES } from './ItemIcon';
import { soundManager } from '@/lib/audio/SoundManager';

export interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: (shopId?: string) => void;
}

type BagCategoryTab = 'all' | 'artefacts' | 'weapons' | 'potions' | 'blueprints';

interface InventoryToast {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

const EQUIPMENT_SLOT_CONFIG: {
  slot: EquipmentSlot;
  label: string;
  placeholderIcon: string;
  sublabel: string;
}[] = [
  { slot: 'head', label: 'Head', placeholderIcon: 'Crown', sublabel: 'Crowns / Helms' },
  { slot: 'amulet', label: 'Amulet', placeholderIcon: 'Sparkles', sublabel: 'Talismans / Necklaces' },
  { slot: 'ring', label: 'Ring', placeholderIcon: 'CircleDot', sublabel: 'Bands / Signets' },
  { slot: 'weapon', label: 'Weapon', placeholderIcon: 'Sword', sublabel: 'Blades / Staves' },
  { slot: 'shield', label: 'Shield', placeholderIcon: 'Shield', sublabel: 'Bucklers / Aegis' },
  { slot: 'relic', label: 'Relic', placeholderIcon: 'Flag', sublabel: 'Ancient Artefacts' },
];

export function InventoryModal({
  isOpen,
  onClose,
  onOpenShop,
}: InventoryModalProps) {
  const {
    playerLevel,
    playerXp,
    nextLevelXp,
    coins,
    equipped,
    inventory,
    activeBuffs,
    statBoosts,
    equipItem,
    unequipItem,
    useItem,
    discardItem,
  } = usePlayerProgression();

  const [activeTab, setActiveTab] = useState<BagCategoryTab>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [toasts, setToasts] = useState<InventoryToast[]>([]);

  // Sound chime when modal opens
  useEffect(() => {
    if (isOpen) {
      soundManager.playMenuChime(true);
      // Select first inventory item if none selected
      if (!selectedItem && inventory.length > 0) {
        setSelectedItem(inventory[0]);
      }
    }
  }, [isOpen]);

  // Keep selected item in sync if its quantity or existence changes
  useEffect(() => {
    if (selectedItem) {
      const match = inventory.find((i) => i.id === selectedItem.id);
      if (match) {
        setSelectedItem(match);
      } else {
        // If unequipped, maybe it's in equipment
        const eqMatch = Object.values(equipped).find((e) => e?.id === selectedItem.id);
        if (!eqMatch && inventory.length > 0) {
          setSelectedItem(inventory[0]);
        }
      }
    }
  }, [inventory, equipped]);

  // Filter bag inventory based on selected tab
  const filteredBagItems = useMemo(() => {
    if (activeTab === 'all') return inventory;
    return inventory.filter((item) => item.category === activeTab);
  }, [inventory, activeTab]);

  // Toast notification helper
  const addToast = useCallback((type: 'success' | 'info' | 'warning', title: string, message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Handle Equip
  const handleEquip = (item: InventoryItem) => {
    if (!item.slot) return;
    equipItem(item);
    addToast('success', 'Gear Equipped', `Equipped ${item.name} to ${item.slot.toUpperCase()} slot!`);
  };

  // Handle Unequip
  const handleUnequip = (slot: EquipmentSlot) => {
    const item = equipped[slot];
    if (!item) return;
    unequipItem(slot);
    addToast('info', 'Gear Unequipped', `Returned ${item.name} to your satchel.`);
  };

  // Handle Consume Potion
  const handleUsePotion = (item: InventoryItem) => {
    const res = useItem(item);
    if (res.success) {
      addToast('success', `${res.buffName || 'Elixir Activated'}!`, res.message);
    } else {
      addToast('warning', 'Cannot Consume', res.message);
    }
  };

  // Handle Discard
  const handleDiscard = (item: InventoryItem) => {
    discardItem(item.id, 1);
    setConfirmDiscard(false);
    addToast('info', 'Item Discarded', `Discarded 1x ${item.name}.`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-6xl h-[92vh] max-h-[880px] bg-zinc-950/95 border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient atmospheric radial glows */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= HEADER ================= */}
        <div className="relative border-b border-amber-500/30 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-950 border-2 border-amber-400/60 flex items-center justify-center shadow-md">
                <Crown className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-amber-200 drop-shadow">
                    Sovereign Armory & Satchel
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Character Sheet
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                  <span>
                    Level <strong className="text-sky-300 font-mono">{playerLevel}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    XP: <span className="text-zinc-300 font-mono">{playerXp}</span> /{' '}
                    <span className="text-zinc-500 font-mono">{nextLevelXp}</span>
                  </span>
                  {activeBuffs.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
                        <Zap className="w-3.5 h-3.5" /> {activeBuffs.length} Active Buff
                        {activeBuffs.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-3">
              {/* Gold Balance */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-amber-950/60 to-zinc-900 border border-amber-500/50 shadow-inner">
                <Coins className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 leading-none">
                    Gold Coins
                  </span>
                  <span className="text-base font-black text-amber-300 font-mono leading-tight">
                    {coins.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Visit Shop Button */}
              {onOpenShop && (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onOpenShop();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all text-xs font-bold shadow-sm"
                  title="Visit Open-World Shop"
                >
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Visit Shop</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  soundManager.playMenuChime(false);
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700 transition-colors"
                aria-label="Close Inventory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= MAIN SPLIT CONTENT ================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ================= LEFT COLUMN: CHARACTER EQUIPMENT SLOTS (5 Cols) ================= */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-serif">
                  <Shield className="w-4 h-4" />
                  Active Equipment (6 Slots)
                </h3>
                <span className="text-[11px] text-zinc-500 italic">Click equipped item to unequip</span>
              </div>

              {/* Equipment Slots Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {EQUIPMENT_SLOT_CONFIG.map(({ slot, label, placeholderIcon, sublabel }) => {
                  const item = equipped[slot];
                  const theme = item ? RARITY_THEMES[item.rarity] : null;

                  return (
                    <div
                      key={slot}
                      onClick={() => {
                        if (item) {
                          handleUnequip(slot);
                        }
                      }}
                      className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        item
                          ? `${theme?.border} ${theme?.bg} ${theme?.glow} hover:border-red-400/60`
                          : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                      }`}
                    >
                      {/* Slot Icon Tile */}
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border shadow-inner ${
                          item
                            ? `border-amber-400/40 bg-zinc-950/80`
                            : 'border-zinc-800 bg-zinc-950/50 text-zinc-600'
                        }`}
                      >
                        {item ? (
                          <ItemIcon iconName={item.iconName} rarity={item.rarity} size={22} />
                        ) : (
                          <ItemIcon iconName={placeholderIcon} rarity="common" size={20} className="opacity-30" />
                        )}
                      </div>

                      {/* Slot Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                          {label}
                        </span>
                        {item ? (
                          <>
                            <h4
                              className={`text-xs font-bold truncate ${theme?.text} font-serif`}
                              title={item.name}
                            >
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {item.statTags[0] || 'Equipped'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-600 italic block">{sublabel}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Stat Boosts Summary Card */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                      Total Stat Boosts
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-400">Equipped Gear + Active Draughts</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Movement Speed */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                    <div className="p-1.5 rounded-md bg-sky-950/60 text-sky-400 border border-sky-500/30">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Sprint Speed</span>
                      <strong className="text-sky-300 font-mono text-sm">
                        +{statBoosts.movementSpeedPct}%
                      </strong>
                    </div>
                  </div>

                  {/* Harvest Gold Yield */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                    <div className="p-1.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Harvest Yield</span>
                      <strong className="text-amber-300 font-mono text-sm">
                        +{statBoosts.harvestYieldPct}%
                      </strong>
                    </div>
                  </div>

                  {/* Defense Rating */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                    <div className="p-1.5 rounded-md bg-purple-950/60 text-purple-400 border border-purple-500/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Defense Rating</span>
                      <strong className="text-purple-300 font-mono text-sm">
                        +{statBoosts.defenseRating}
                      </strong>
                    </div>
                  </div>

                  {/* Merchant Discount */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                    <div className="p-1.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Shop Discount</span>
                      <strong className="text-emerald-300 font-mono text-sm">
                        +{statBoosts.shopDiscountPct}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Buffs Section */}
              {activeBuffs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Active Elixirs ({activeBuffs.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeBuffs.map((buff) => (
                      <div
                        key={buff.id}
                        className="flex items-center justify-between text-xs p-1.5 rounded bg-zinc-950/80 border border-emerald-800/40"
                      >
                        <span className="text-zinc-200 font-medium truncate">{buff.name}</span>
                        <span className="text-emerald-400 font-mono font-bold shrink-0 ml-2">
                          {buff.remainingSec}s left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hint Box */}
            <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-snug">
              Equipping legendary artefacts multiplies your movement speed and land parcel harvest yields in the 3D sandbox.
            </div>
          </div>

          {/* ================= RIGHT COLUMN: BAG GRID & INSPECTION DRAWER (7 Cols) ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden bg-zinc-900/40">
            {/* Bag Category Tabs */}
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/60 overflow-x-auto">
              {[
                { id: 'all', label: 'All Wares' },
                { id: 'artefacts', label: 'Artefacts' },
                { id: 'weapons', label: 'Weapons & Armor' },
                { id: 'potions', label: 'Potions' },
                { id: 'blueprints', label: 'Blueprints' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveTab(tab.id as BagCategoryTab);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-sm'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Bag Items Grid */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
              {filteredBagItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                  <ShoppingBag className="w-10 h-10 mb-2 text-zinc-600" />
                  <p className="text-xs font-medium">No items found in this bag category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredBagItems.map((item) => {
                    const theme = RARITY_THEMES[item.rarity];
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedItem(item);
                          setConfirmDiscard(false);
                        }}
                        className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          theme.border
                        } ${theme.bg} ${theme.glow} ${
                          isSelected ? 'ring-2 ring-amber-400 shadow-lg' : ''
                        }`}
                      >
                        {/* Top: Icon & Quantity Badge */}
                        <div className="flex items-start justify-between">
                          <div
                            className={`w-10 h-10 rounded-lg bg-zinc-950/80 border ${theme.border} flex items-center justify-center shadow-inner`}
                          >
                            <ItemIcon iconName={item.iconName} rarity={item.rarity} size={22} />
                          </div>
                          {(item.quantity || 1) > 1 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black font-mono">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Title & Rarity */}
                        <div className="mt-2.5">
                          <h4
                            className={`text-xs font-bold font-serif truncate ${theme.text}`}
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 capitalize block mt-0.5">
                            {item.slot ? item.slot : item.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ================= INSPECTION DRAWER (BOTTOM OF BAG) ================= */}
            {selectedItem && (
              <div className="p-4 border-t border-amber-500/30 bg-zinc-950/90 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Item Snapshot */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-14 h-14 rounded-xl bg-zinc-950 border ${
                        RARITY_THEMES[selectedItem.rarity].border
                      } flex items-center justify-center shrink-0 shadow-inner`}
                    >
                      <ItemIcon
                        iconName={selectedItem.iconName}
                        rarity={selectedItem.rarity}
                        size={30}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-base font-bold font-serif ${
                            RARITY_THEMES[selectedItem.rarity].text
                          }`}
                        >
                          {selectedItem.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            RARITY_THEMES[selectedItem.rarity].badgeBg
                          }`}
                        >
                          {selectedItem.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 italic line-clamp-1 mt-0.5">
                        {selectedItem.description}
                      </p>
                      {/* Stat tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedItem.statTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-900 border border-zinc-700 text-amber-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (EQUIP, CONSUME, DISCARD) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Discard Button */}
                    {confirmDiscard ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setConfirmDiscard(false)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDiscard(selectedItem)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setConfirmDiscard(true);
                        }}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 border border-zinc-700 transition-colors"
                        title="Discard Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Equip Button (if equippable) */}
                    {selectedItem.slot && (
                      <button
                        onClick={() => handleEquip(selectedItem)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-md shadow-amber-950/50 active:scale-95 transition-all"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Equip ({selectedItem.slot})
                      </button>
                    )}

                    {/* Consume / Use Button (if potion/draught) */}
                    {selectedItem.usable && (
                      <button
                        onClick={() => handleUsePotion(selectedItem)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-950/50 active:scale-95 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Drink / Use
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <span>
              Total Items in Bag:{' '}
              <strong className="text-zinc-200 font-mono">
                {inventory.reduce((acc, i) => acc + (i.quantity || 1), 0)}
              </strong>
            </span>
            <span>•</span>
            <span>
              Gold Balance:{' '}
              <strong className="text-amber-300 font-mono font-bold">
                {coins.toLocaleString()}g
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              Tip: Potions can be consumed for temporary sprint and harvesting boosts.
            </span>
            <button
              onClick={() => {
                soundManager.playMenuChime(false);
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* ================= FLOATING TOASTS ================= */}
        {toasts.length > 0 && (
          <div className="absolute bottom-16 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-slide-in-right ${
                  toast.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : toast.type === 'warning'
                    ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                    : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
                }`}
              >
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {toast.type === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                <div>
                  <h5 className="font-bold">{toast.title}</h5>
                  <p className="text-[11px] opacity-90">{toast.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default InventoryModal;
