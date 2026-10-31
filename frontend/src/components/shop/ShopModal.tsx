'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Coins,
  Shield,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Layers,
  Info,
  ChevronRight,
  TrendingUp,
  Percent,
  Check,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { getShopProfileById } from '@/lib/inventory/shopsCatalog';
import { MASTER_ITEMS_CATALOG } from '@/lib/inventory/itemsCatalog';
import { InventoryItem, ItemCategory } from '@/lib/inventory/types';
import { ItemIcon, RARITY_THEMES } from '@/components/inventory/ItemIcon';
import { soundManager } from '@/lib/audio/SoundManager';

export interface ShopModalProps {
  isOpen: boolean;
  shopId: string | null;
  onClose: () => void;
  onOpenInventory?: () => void;
}

type ShopMode = 'buy' | 'sell';
type CategoryFilter = 'all' | 'artefacts' | 'weapons' | 'potions' | 'blueprints';

interface ShopToast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ShopModal({
  isOpen,
  shopId,
  onClose,
  onOpenInventory,
}: ShopModalProps) {
  const {
    playerLevel,
    coins,
    inventory,
    statBoosts,
    buyItem,
    sellItem,
  } = usePlayerProgression();

  const [mode, setMode] = useState<ShopMode>('buy');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sellingItemConfirm, setSellingItemConfirm] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ShopToast[]>([]);

  // Retrieve current shop profile
  const shop = useMemo(() => getShopProfileById(shopId), [shopId]);

  // Retrieve items stocked by this merchant
  const stockedItems = useMemo<InventoryItem[]>(() => {
    return shop.inventoryItemIds
      .map((id) => MASTER_ITEMS_CATALOG[id])
      .filter((item): item is InventoryItem => Boolean(item));
  }, [shop]);

  // Filter items based on active category tab
  const filteredStockedItems = useMemo(() => {
    if (selectedCategory === 'all') return stockedItems;
    return stockedItems.filter((item) => item.category === selectedCategory);
  }, [stockedItems, selectedCategory]);

  const filteredInventoryItems = useMemo(() => {
    if (selectedCategory === 'all') return inventory;
    return inventory.filter((item) => item.category === selectedCategory);
  }, [inventory, selectedCategory]);

  // Toast notification helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Handle Buy
  const handleBuy = (item: InventoryItem) => {
    const discount = statBoosts.shopDiscountPct;
    const result = buyItem(item);

    if (!result.success) {
      if (result.reason === 'level_locked') {
        addToast(
          'error',
          `Requires Level ${item.levelReq}! (Your current level: ${playerLevel})`
        );
      } else if (result.reason === 'insufficient_funds') {
        addToast(
          'error',
          `Not enough Gold! Costs ${result.finalPrice} Gold (You have: ${coins} Gold)`
        );
      }
      return;
    }

    addToast(
      'success',
      `Purchased ${item.name} for ${result.finalPrice} Gold! ${
        discount > 0 ? `(${discount}% royal discount applied)` : ''
      }`
    );
  };

  // Handle Sell
  const handleSell = (item: InventoryItem) => {
    const unitPrice = Math.max(1, Math.floor(item.price * 0.5));
    const result = sellItem(item, 1);
    setSellingItemConfirm(null);

    if (result.success) {
      addToast(
        'success',
        `Sold 1x ${item.name} for +${result.sellPrice} Gold!`
      );
    }
  };

  // Sound chime when modal opens
  useEffect(() => {
    if (isOpen) {
      soundManager.playMenuChime(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[860px] bg-zinc-950/95 border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background aura */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* ================= HEADER SECTION ================= */}
        <div className="relative border-b border-amber-500/30 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Merchant Identity & Banner */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${shop.portraitColor} border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-950/60 ring-2 ring-amber-500/20`}
              >
                <ItemIcon iconName={shop.avatarIcon} rarity="legendary" size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {shop.name}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {shop.merchantRole}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 italic line-clamp-1 max-w-xl">
                  "{shop.greetingDialogue}"
                </p>
              </div>
            </div>

            {/* Top Bar Actions & Player Status */}
            <div className="flex items-center gap-3">
              {/* Player Gold Balance */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-amber-950/60 to-zinc-900 border border-amber-500/50 shadow-inner">
                <Coins className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 leading-none">
                    Gold Coins
                  </span>
                  <span className="text-base font-black text-amber-300 font-mono leading-tight">
                    {coins.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Player Level Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Lv. <span className="text-sky-300 font-mono">{playerLevel}</span>
                </span>
              </div>

              {/* Quick Switch to Inventory Button */}
              {onOpenInventory && (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onOpenInventory();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 hover:text-white transition-all text-xs font-semibold shadow-sm hover:border-amber-400/60"
                  title="Open Character Equipment & Inventory"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Satchel</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  soundManager.playMenuChime(false);
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700 transition-colors"
                aria-label="Close Storefront"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= CONTROLS BAR: MODE SWITCHER & CATEGORY FILTERS ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
          {/* Mode Switcher: BUY WARES vs SELL INVENTORY */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <button
              onClick={() => {
                soundManager.playClick();
                setMode('buy');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                mode === 'buy'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-zinc-950 shadow-md shadow-amber-900/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Buy Wares
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setMode('sell');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                mode === 'sell'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-zinc-950 shadow-md shadow-emerald-900/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Sell Inventory ({inventory.length})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'artefacts', label: 'Artefacts & Relics' },
              { id: 'weapons', label: 'Weapons & Armor' },
              { id: 'potions', label: 'Potions & Elixirs' },
              { id: 'blueprints', label: 'Blueprints' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedCategory(cat.id as CategoryFilter);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 font-semibold shadow-sm'
                      : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Merchant Perk Announcement banner if discount is active */}
        {statBoosts.shopDiscountPct > 0 && mode === 'buy' && (
          <div className="flex items-center gap-2 px-6 py-1.5 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border-b border-amber-500/20 text-xs text-amber-300">
            <Percent className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Royal Diplomat Privilege active: Enjoy a{' '}
              <strong className="text-amber-200 font-bold">
                {statBoosts.shopDiscountPct}% discount
              </strong>{' '}
              on all wares from equipped gear perks!
            </span>
          </div>
        )}

        {/* ================= PRODUCT CARDS GRID ================= */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {mode === 'buy' ? (
            /* === BUY MODE === */
            filteredStockedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <PackageOpen className="w-12 h-12 mb-2 text-zinc-600" />
                <p className="text-sm font-medium">No wares stocked in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStockedItems.map((item) => {
                  const theme = RARITY_THEMES[item.rarity];
                  const isLevelLocked = playerLevel < item.levelReq;
                  const discountPct = statBoosts.shopDiscountPct;
                  const finalPrice = Math.max(
                    1,
                    Math.round(item.price * (1 - Math.min(50, discountPct) / 100))
                  );
                  const canAfford = coins >= finalPrice;

                  return (
                    <div
                      key={item.id}
                      className={`group relative flex flex-col justify-between p-4 rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} transition-all duration-200 hover:-translate-y-0.5`}
                    >
                      {/* Top Row: Icon, Name, Rarity & Slot */}
                      <div>
                        <div className="flex items-start gap-3">
                          {/* Item Icon Box */}
                          <div
                            className={`w-12 h-12 rounded-xl bg-zinc-950/80 border ${theme.border} flex items-center justify-center shrink-0 shadow-inner`}
                          >
                            <ItemIcon iconName={item.iconName} rarity={item.rarity} size={26} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3
                                className={`text-sm font-bold font-serif truncate ${theme.text}`}
                                title={item.name}
                              >
                                {item.name}
                              </h3>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.badgeBg}`}
                              >
                                {item.rarity}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              {item.slot && (
                                <span className="text-[11px] text-zinc-400 capitalize">
                                  Slot: <strong className="text-zinc-300">{item.slot}</strong>
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-500 capitalize">
                                • {item.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lore Description */}
                        <p className="mt-2.5 text-xs text-zinc-400 line-clamp-2 italic leading-relaxed">
                          {item.description}
                        </p>

                        {/* Stat Boost Badges */}
                        {item.statTags && item.statTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {item.statTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-950/80 border border-zinc-800 text-amber-300/90 shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Level Req, Price & Buy Button */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        {/* Level Requirement Indicator */}
                        <div className="flex items-center gap-1.5">
                          {isLevelLocked ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-800/50">
                              <Lock className="w-3 h-3" /> Req Lv.{item.levelReq}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                              <CheckCircle2 className="w-3 h-3" /> Req Lv.{item.levelReq}
                            </span>
                          )}
                        </div>

                        {/* Price & Buy Action */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            {discountPct > 0 && (
                              <span className="text-[10px] text-zinc-500 line-through leading-none">
                                {item.price}g
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span
                                className={`text-sm font-bold font-mono ${
                                  canAfford ? 'text-amber-300' : 'text-red-400'
                                }`}
                              >
                                {finalPrice}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBuy(item)}
                            disabled={isLevelLocked || !canAfford}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm ${
                              isLevelLocked || !canAfford
                                ? 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-amber-950/40 active:scale-95'
                            }`}
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* === SELL MODE === */
            filteredInventoryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <ShoppingBag className="w-12 h-12 mb-2 text-zinc-600" />
                <p className="text-sm font-medium">Your satchel contains no items to sell.</p>
                <button
                  onClick={() => setMode('buy')}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Browse Merchant Wares
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventoryItems.map((item) => {
                  const theme = RARITY_THEMES[item.rarity];
                  const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
                  const isConfirming = sellingItemConfirm === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} transition-all`}
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl bg-zinc-950/80 border ${theme.border} flex items-center justify-center shrink-0 shadow-inner relative`}
                          >
                            <ItemIcon iconName={item.iconName} rarity={item.rarity} size={26} />
                            {(item.quantity || 1) > 1 && (
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-zinc-950 text-[10px] font-black rounded-full font-mono">
                                x{item.quantity}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3
                                className={`text-sm font-bold font-serif truncate ${theme.text}`}
                              >
                                {item.name}
                              </h3>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.badgeBg}`}
                              >
                                {item.rarity}
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-400 mt-0.5 capitalize">
                              {item.category} {item.slot ? `• Slot: ${item.slot}` : ''}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-zinc-400 line-clamp-2 italic">
                          {item.description}
                        </p>
                      </div>

                      {/* Sell Price & Confirm Action */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                            Sell Value (50%)
                          </span>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-sm font-bold font-mono text-emerald-400">
                              +{sellPrice} Gold
                            </span>
                          </div>
                        </div>

                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSellingItemConfirm(null)}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSell(item)}
                              className="px-3 py-1 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              setSellingItemConfirm(item.id);
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-zinc-200 hover:text-emerald-300 transition-all active:scale-95"
                          >
                            Sell
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* ================= FOOTER TOAST SYSTEM ================= */}
        {toasts.length > 0 && (
          <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold animate-slide-in-right ${
                  toast.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : toast.type === 'error'
                    ? 'bg-red-950/90 border-red-500/60 text-red-200'
                    : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
                }`}
              >
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
                <span>{toast.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ShopModal;
