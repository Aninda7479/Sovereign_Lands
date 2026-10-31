'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  InventoryItem,
  EquipmentSlots,
  EquipmentSlot,
  ActiveBuff,
  ItemStatPerks,
} from '@/lib/inventory/types';
import {
  MASTER_ITEMS_CATALOG,
  INITIAL_PLAYER_EQUIPMENT,
  INITIAL_PLAYER_INVENTORY,
} from '@/lib/inventory/itemsCatalog';
import { soundManager } from '@/lib/audio/SoundManager';

const STORAGE_KEY = 'sovereign_player_progression_v1';

export interface PlayerProgressionState {
  playerLevel: number;
  playerXp: number;
  nextLevelXp: number;
  coins: number;
  equipped: EquipmentSlots;
  inventory: InventoryItem[];
  activeBuffs: ActiveBuff[];
}

const DEFAULT_STATE: PlayerProgressionState = {
  playerLevel: 5,
  playerXp: 1850,
  nextLevelXp: 2500,
  coins: 480,
  equipped: INITIAL_PLAYER_EQUIPMENT,
  inventory: INITIAL_PLAYER_INVENTORY,
  activeBuffs: [],
};

// Singleton memory store & subscriber listeners for real-time cross-component reactivity
class PlayerProgressionStore {
  private state: PlayerProgressionState = DEFAULT_STATE;
  private listeners: Set<(state: PlayerProgressionState) => void> = new Set();
  private buffInterval: NodeJS.Timeout | null = null;
  private isLoaded: boolean = false;

  constructor() {
    this.loadState();
    this.startBuffTicker();
  }

  private loadState() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.state = {
            ...DEFAULT_STATE,
            ...parsed,
            equipped: { ...DEFAULT_STATE.equipped, ...(parsed.equipped || {}) },
            inventory: parsed.inventory && parsed.inventory.length > 0 ? parsed.inventory : DEFAULT_STATE.inventory,
            activeBuffs: parsed.activeBuffs || [],
          };
        }
      } catch (err) {
        console.warn('Failed to parse player progression state from localStorage:', err);
      }
      this.isLoaded = true;
    }
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {}
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public subscribe(listener: (state: PlayerProgressionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): PlayerProgressionState {
    return { ...this.state };
  }

  private startBuffTicker() {
    if (typeof window === 'undefined') return;
    if (this.buffInterval) clearInterval(this.buffInterval);

    this.buffInterval = setInterval(() => {
      if (this.state.activeBuffs.length === 0) return;

      let changed = false;
      const updatedBuffs = this.state.activeBuffs
        .map((buff) => ({
          ...buff,
          remainingSec: buff.remainingSec - 1,
        }))
        .filter((buff) => buff.remainingSec > 0);

      if (updatedBuffs.length !== this.state.activeBuffs.length || updatedBuffs.some((b, i) => b.remainingSec !== this.state.activeBuffs[i].remainingSec)) {
        this.state = {
          ...this.state,
          activeBuffs: updatedBuffs,
        };
        changed = true;
      }

      if (changed) {
        this.saveState();
      }
    }, 1000);
  }

  public setCoins(amount: number) {
    this.state = { ...this.state, coins: Math.max(0, amount) };
    this.saveState();
  }

  public addCoins(amount: number) {
    this.setCoins(this.state.coins + amount);
  }

  public deductCoins(amount: number): boolean {
    if (this.state.coins < amount) return false;
    this.setCoins(this.state.coins - amount);
    return true;
  }

  public equipItem(item: InventoryItem) {
    if (!item.slot) return;
    const slot = item.slot;
    const currentEquipped = this.state.equipped[slot];

    // Remove 1 quantity of the item from bag
    let newInventory = [...this.state.inventory];
    const itemIndex = newInventory.findIndex((i) => i.id === item.id);
    if (itemIndex >= 0) {
      const existing = newInventory[itemIndex];
      if ((existing.quantity || 1) > 1) {
        newInventory[itemIndex] = { ...existing, quantity: (existing.quantity || 1) - 1 };
      } else {
        newInventory.splice(itemIndex, 1);
      }
    }

    // If current slot was occupied, move it back into inventory
    if (currentEquipped) {
      const existingBagIndex = newInventory.findIndex((i) => i.id === currentEquipped.id);
      if (existingBagIndex >= 0 && !currentEquipped.slot) {
        newInventory[existingBagIndex].quantity = (newInventory[existingBagIndex].quantity || 1) + 1;
      } else {
        newInventory.push({ ...currentEquipped, quantity: 1 });
      }
    }

    this.state = {
      ...this.state,
      equipped: {
        ...this.state.equipped,
        [slot]: { ...item, quantity: 1 },
      },
      inventory: newInventory,
    };
    soundManager.playEquipSound();
    this.saveState();
  }

  public unequipItem(slot: EquipmentSlot) {
    const item = this.state.equipped[slot];
    if (!item) return;

    const newInventory = [...this.state.inventory];
    const existingIndex = newInventory.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0 && !item.slot) {
      newInventory[existingIndex].quantity = (newInventory[existingIndex].quantity || 1) + 1;
    } else {
      newInventory.push({ ...item, quantity: 1 });
    }

    this.state = {
      ...this.state,
      equipped: {
        ...this.state.equipped,
        [slot]: null,
      },
      inventory: newInventory,
    };
    soundManager.playClick();
    this.saveState();
  }

  public useItem(item: InventoryItem): { success: boolean; message: string; buffName?: string } {
    if (!item.usable) {
      return { success: false, message: 'This item cannot be consumed.' };
    }

    // Decrement from inventory
    const newInventory = [...this.state.inventory];
    const index = newInventory.findIndex((i) => i.id === item.id);
    if (index === -1) {
      return { success: false, message: 'Item not found in your satchel.' };
    }

    const currentQty = newInventory[index].quantity || 1;
    if (currentQty > 1) {
      newInventory[index] = { ...newInventory[index], quantity: currentQty - 1 };
    } else {
      newInventory.splice(index, 1);
    }

    // Apply buff
    const duration = item.buffDurationSec || 60;
    const buffName = item.buffName || item.name;
    const buffDesc = item.buffDescription || item.description;

    const newBuff: ActiveBuff = {
      id: `${item.id}_${Date.now()}`,
      name: buffName,
      description: buffDesc,
      durationSec: duration,
      remainingSec: duration,
      stats: item.stats,
      iconName: item.iconName,
    };

    // Filter out existing buff of same item type to refresh timer
    const filteredBuffs = this.state.activeBuffs.filter((b) => !b.id.startsWith(item.id));
    filteredBuffs.push(newBuff);

    this.state = {
      ...this.state,
      inventory: newInventory,
      activeBuffs: filteredBuffs,
    };

    soundManager.playPotionDrink();
    this.saveState();

    return {
      success: true,
      buffName,
      message: `Drank ${item.name}! Active effect: ${buffDesc}`,
    };
  }

  public discardItem(itemId: string, count: number = 1) {
    const newInventory = [...this.state.inventory];
    const index = newInventory.findIndex((i) => i.id === itemId);
    if (index === -1) return;

    const currentQty = newInventory[index].quantity || 1;
    if (currentQty > count) {
      newInventory[index] = { ...newInventory[index], quantity: currentQty - count };
    } else {
      newInventory.splice(index, 1);
    }

    this.state = {
      ...this.state,
      inventory: newInventory,
    };
    soundManager.playClick();
    this.saveState();
  }

  public buyItem(
    item: InventoryItem,
    discountPct: number = 0
  ): { success: boolean; reason?: 'insufficient_funds' | 'level_locked'; finalPrice: number } {
    // Check level req
    if (this.state.playerLevel < item.levelReq) {
      soundManager.playErrorBuzzer();
      return {
        success: false,
        reason: 'level_locked',
        finalPrice: item.price,
      };
    }

    // Calculate discounted price (max 50% discount)
    const effectiveDiscount = Math.min(50, Math.max(0, discountPct));
    const finalPrice = Math.max(1, Math.round(item.price * (1 - effectiveDiscount / 100)));

    if (this.state.coins < finalPrice) {
      soundManager.playErrorBuzzer();
      return {
        success: false,
        reason: 'insufficient_funds',
        finalPrice,
      };
    }

    // Deduct coins
    const newCoins = this.state.coins - finalPrice;

    // Add to inventory
    const newInventory = [...this.state.inventory];
    const existingIndex = newInventory.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        quantity: (newInventory[existingIndex].quantity || 1) + 1,
      };
    } else {
      newInventory.push({ ...item, quantity: 1 });
    }

    this.state = {
      ...this.state,
      coins: newCoins,
      inventory: newInventory,
    };

    soundManager.playCoinClink();
    this.saveState();

    return {
      success: true,
      finalPrice,
    };
  }

  public sellItem(
    item: InventoryItem,
    count: number = 1
  ): { success: boolean; sellPrice: number } {
    const newInventory = [...this.state.inventory];
    const index = newInventory.findIndex((i) => i.id === item.id);
    if (index === -1) {
      return { success: false, sellPrice: 0 };
    }

    const currentQty = newInventory[index].quantity || 1;
    const qtyToSell = Math.min(currentQty, count);
    const unitSellPrice = Math.max(1, Math.floor(item.price * 0.5));
    const totalGained = unitSellPrice * qtyToSell;

    if (currentQty > qtyToSell) {
      newInventory[index] = { ...newInventory[index], quantity: currentQty - qtyToSell };
    } else {
      newInventory.splice(index, 1);
    }

    this.state = {
      ...this.state,
      coins: this.state.coins + totalGained,
      inventory: newInventory,
    };

    soundManager.playCoinClink();
    this.saveState();

    return {
      success: true,
      sellPrice: totalGained,
    };
  }
}

// Global store instance
const store = new PlayerProgressionStore();

export interface UsePlayerProgressionReturn {
  playerLevel: number;
  playerXp: number;
  nextLevelXp: number;
  coins: number;
  equipped: EquipmentSlots;
  inventory: InventoryItem[];
  activeBuffs: ActiveBuff[];
  statBoosts: {
    movementSpeedPct: number;
    harvestYieldPct: number;
    defenseRating: number;
    shopDiscountPct: number;
  };
  equipItem: (item: InventoryItem) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  useItem: (item: InventoryItem) => { success: boolean; message: string; buffName?: string };
  discardItem: (itemId: string, count?: number) => void;
  buyItem: (item: InventoryItem) => {
    success: boolean;
    reason?: 'insufficient_funds' | 'level_locked';
    finalPrice: number;
  };
  sellItem: (item: InventoryItem, count?: number) => { success: boolean; sellPrice: number };
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  isLoading: boolean;
}

/**
 * Universal Player Progression Hook.
 * Manages character level, XP, gold balance, equipment slots, bag inventory, and live stat perks.
 * Fully reactive across all components and persistent via localStorage.
 */
export function usePlayerProgression(): UsePlayerProgressionReturn {
  const [state, setState] = useState<PlayerProgressionState>(() => store.getState());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setState(store.getState());
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Compute total stat boosts combining all 6 equipped gear slots + active buffs
  const statBoosts = useMemo(() => {
    let movementSpeedPct = 0;
    let harvestYieldPct = 0;
    let defenseRating = 0;
    let shopDiscountPct = 0;

    // Equipped items
    Object.values(state.equipped).forEach((item) => {
      if (!item) return;
      if (item.stats.movementSpeedPct) movementSpeedPct += item.stats.movementSpeedPct;
      if (item.stats.harvestYieldPct) harvestYieldPct += item.stats.harvestYieldPct;
      if (item.stats.defenseRating) defenseRating += item.stats.defenseRating;
      if (item.stats.shopDiscountPct) shopDiscountPct += item.stats.shopDiscountPct;
    });

    // Active buffs
    state.activeBuffs.forEach((buff) => {
      if (buff.stats.movementSpeedPct) movementSpeedPct += buff.stats.movementSpeedPct;
      if (buff.stats.harvestYieldPct) harvestYieldPct += buff.stats.harvestYieldPct;
      if (buff.stats.defenseRating) defenseRating += buff.stats.defenseRating;
      if (buff.stats.shopDiscountPct) shopDiscountPct += buff.stats.shopDiscountPct;
    });

    return {
      movementSpeedPct,
      harvestYieldPct,
      defenseRating,
      shopDiscountPct: Math.min(50, shopDiscountPct), // Cap merchant discount at 50%
    };
  }, [state.equipped, state.activeBuffs]);

  const equipItem = useCallback((item: InventoryItem) => {
    store.equipItem(item);
  }, []);

  const unequipItem = useCallback((slot: EquipmentSlot) => {
    store.unequipItem(slot);
  }, []);

  const useItem = useCallback((item: InventoryItem) => {
    return store.useItem(item);
  }, []);

  const discardItem = useCallback((itemId: string, count?: number) => {
    store.discardItem(itemId, count);
  }, []);

  const buyItem = useCallback(
    (item: InventoryItem) => {
      return store.buyItem(item, statBoosts.shopDiscountPct);
    },
    [statBoosts.shopDiscountPct]
  );

  const sellItem = useCallback((item: InventoryItem, count?: number) => {
    return store.sellItem(item, count);
  }, []);

  const addCoins = useCallback((amount: number) => {
    store.addCoins(amount);
  }, []);

  const deductCoins = useCallback((amount: number) => {
    return store.deductCoins(amount);
  }, []);

  return {
    playerLevel: state.playerLevel,
    playerXp: state.playerXp,
    nextLevelXp: state.nextLevelXp,
    coins: state.coins,
    equipped: state.equipped,
    inventory: state.inventory,
    activeBuffs: state.activeBuffs,
    statBoosts,
    equipItem,
    unequipItem,
    useItem,
    discardItem,
    buyItem,
    sellItem,
    addCoins,
    deductCoins,
    isLoading,
  };
}
