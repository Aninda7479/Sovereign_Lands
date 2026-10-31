'use client';

/**
 * Sovereign Lands - Unified Player Progression & Economy Provider
 * Manages player level, XP curves, coin purse, inventory, equipment, active buffs,
 * stats recomputation, quest tracking, and localStorage persistence.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  PlayerProgressionState,
  PlayerProgressionContextType,
  RPGItem,
  EquipmentSlot,
  InventoryItem,
  QuestData,
  ActiveBuff,
  PlayerStats,
  calculateXPToNextLevel,
  getTitleForLevel,
} from '@/lib/rpg/types';
import { DEFAULT_QUESTS } from '@/lib/rpg/QuestRegistry';

const STORAGE_KEY = 'sovereign_player_progression_v1';

const BASE_STATS: PlayerStats = {
  speedMultiplier: 1.0,
  harvestMultiplier: 1.0,
  defenseRating: 0,
  attackRating: 10,
  shopDiscountMultiplier: 1.0,
};

const INITIAL_STATE: PlayerProgressionState = {
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXPToNextLevel(1),
  coins: 250, // Starting player gold purse
  title: getTitleForLevel(1),
  inventory: [],
  equippedItems: {},
  quests: DEFAULT_QUESTS,
  activeQuestId: 'quest_1',
  stats: BASE_STATS,
  activeBuffs: [],
};

const PlayerProgressionContext = createContext<PlayerProgressionContextType | undefined>(
  undefined
);

/**
 * Safely dispatches a custom browser event for audio triggers, HUD alerts, or toasts.
 */
function dispatchSovereignEvent<T>(eventName: string, detail: T) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch {
      // Ignore if server-rendered or unsupported
    }
  }
}

/**
 * Computes player stats based on equipped items and active temporary buffs.
 */
function computePlayerStats(
  equippedItems: Partial<Record<EquipmentSlot, RPGItem>>,
  buffs: ActiveBuff[] = []
): PlayerStats {
  const now = Date.now();
  let speedMultiplier = BASE_STATS.speedMultiplier;
  let harvestMultiplier = BASE_STATS.harvestMultiplier;
  let defenseRating = BASE_STATS.defenseRating;
  let attackRating = BASE_STATS.attackRating;
  let totalDiscount = 0;

  // Add stats from equipped items
  for (const item of Object.values(equippedItems)) {
    if (!item || !item.stats) continue;
    if (item.stats.speedBoost) speedMultiplier += item.stats.speedBoost;
    if (item.stats.harvestBoost) harvestMultiplier += item.stats.harvestBoost;
    if (item.stats.defenseBoost) defenseRating += item.stats.defenseBoost;
    if (item.stats.attackBoost) attackRating += item.stats.attackBoost;
    if (item.stats.shopDiscount) totalDiscount += item.stats.shopDiscount;
  }

  // Add stats from active buffs
  for (const buff of buffs) {
    if (buff.expiresAt <= now || !buff.stats) continue;
    if (buff.stats.speedBoost) speedMultiplier += buff.stats.speedBoost;
    if (buff.stats.harvestBoost) harvestMultiplier += buff.stats.harvestBoost;
    if (buff.stats.defenseBoost) defenseRating += buff.stats.defenseBoost;
    if (buff.stats.attackBoost) attackRating += buff.stats.attackBoost;
    if (buff.stats.shopDiscount) totalDiscount += buff.stats.shopDiscount;
  }

  const shopDiscountMultiplier = Math.max(0.5, Math.round((1.0 - totalDiscount) * 100) / 100);

  return {
    speedMultiplier: Math.round(speedMultiplier * 100) / 100,
    harvestMultiplier: Math.round(harvestMultiplier * 100) / 100,
    defenseRating,
    attackRating,
    shopDiscountMultiplier,
  };
}

export interface PlayerProgressionProviderProps {
  children: React.ReactNode;
}

export function PlayerProgressionProvider({ children }: PlayerProgressionProviderProps) {
  const [state, setState] = useState<PlayerProgressionState>(INITIAL_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on client-side mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Partial<PlayerProgressionState> = JSON.parse(stored);

        // Merge stored quests with DEFAULT_QUESTS so any new quests are included
        const mergedQuests = DEFAULT_QUESTS.map((defaultQuest) => {
          const existing = parsed.quests?.find((q) => q.id === defaultQuest.id);
          if (!existing) return defaultQuest;
          return {
            ...defaultQuest,
            isCompleted: existing.isCompleted,
            isClaimed: existing.isClaimed,
            steps: defaultQuest.steps.map((defStep) => {
              const existingStep = existing.steps?.find((s) => s.id === defStep.id);
              return existingStep ? { ...defStep, isCompleted: existingStep.isCompleted } : defStep;
            }),
          };
        });

        const equipped = parsed.equippedItems || {};
        const activeBuffs = (parsed.activeBuffs || []).filter((b) => b.expiresAt > Date.now());
        const recomputedStats = computePlayerStats(equipped, activeBuffs);

        setState({
          level: parsed.level ?? INITIAL_STATE.level,
          xp: parsed.xp ?? INITIAL_STATE.xp,
          xpToNextLevel: calculateXPToNextLevel(parsed.level ?? 1),
          coins: parsed.coins ?? INITIAL_STATE.coins,
          title: getTitleForLevel(parsed.level ?? 1),
          inventory: parsed.inventory || [],
          equippedItems: equipped,
          quests: mergedQuests,
          activeQuestId: parsed.activeQuestId || 'quest_1',
          stats: recomputedStats,
          activeBuffs,
        });
      }
    } catch (e) {
      console.warn('Failed to load Sovereign Lands progression from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist state to localStorage whenever state changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save Sovereign Lands progression to localStorage:', e);
    }
  }, [state, isInitialized]);

  // Periodic ticker to purge expired buffs and update stats
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.activeBuffs || prev.activeBuffs.length === 0) return prev;
        const now = Date.now();
        const active = prev.activeBuffs.filter((b) => b.expiresAt > now);
        if (active.length === prev.activeBuffs.length) return prev;

        const updatedStats = computePlayerStats(prev.equippedItems, active);
        return {
          ...prev,
          activeBuffs: active,
          stats: updatedStats,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // PROGRESSION METHODS
  // ==========================================

  const addXP = useCallback((amount: number, reason?: string) => {
    setState((prev) => {
      let currentXP = prev.xp + amount;
      let currentLevel = prev.level;
      let threshold = prev.xpToNextLevel;
      let leveledUp = false;

      while (currentXP >= threshold) {
        currentXP -= threshold;
        currentLevel += 1;
        threshold = calculateXPToNextLevel(currentLevel);
        leveledUp = true;
      }

      const newTitle = getTitleForLevel(currentLevel);

      if (leveledUp) {
        dispatchSovereignEvent('sovereign-levelup', {
          level: currentLevel,
          title: newTitle,
        });
      }

      dispatchSovereignEvent('sovereign-xp-gained', {
        amount,
        reason: reason || 'Adventure Accomplishment',
        xp: currentXP,
        xpToNextLevel: threshold,
      });

      return {
        ...prev,
        level: currentLevel,
        xp: currentXP,
        xpToNextLevel: threshold,
        title: newTitle,
      };
    });
  }, []);

  const addCoins = useCallback((amount: number) => {
    setState((prev) => {
      const newTotal = prev.coins + amount;
      dispatchSovereignEvent('sovereign-coins-changed', {
        delta: amount,
        newTotal,
      });
      return { ...prev, coins: newTotal };
    });
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.coins < amount) {
        success = false;
        return prev;
      }
      success = true;
      const newTotal = prev.coins - amount;
      dispatchSovereignEvent('sovereign-coins-changed', {
        delta: -amount,
        newTotal,
      });
      return { ...prev, coins: newTotal };
    });
    return success;
  }, []);

  const buyItem = useCallback(
    (item: RPGItem): boolean => {
      let purchased = false;
      setState((prev) => {
        if (prev.level < item.levelRequired) {
          dispatchSovereignEvent('sovereign-toast', {
            title: 'Level Requirement Unmet',
            message: `Requires Level ${item.levelRequired} to purchase ${item.name}`,
            type: 'error',
          });
          return prev;
        }

        const effectivePrice = Math.max(
          1,
          Math.round(item.price * prev.stats.shopDiscountMultiplier)
        );

        if (prev.coins < effectivePrice) {
          dispatchSovereignEvent('sovereign-toast', {
            title: 'Insufficient Coins',
            message: `Requires ${effectivePrice} Gold Coins (You have ${prev.coins})`,
            type: 'error',
          });
          return prev;
        }

        const newCoins = prev.coins - effectivePrice;
        const newInventory = [...prev.inventory];
        const existingIndex = newInventory.findIndex((inv) => inv.item.id === item.id);

        if (existingIndex >= 0) {
          newInventory[existingIndex] = {
            ...newInventory[existingIndex],
            quantity: newInventory[existingIndex].quantity + 1,
          };
        } else {
          newInventory.push({
            item,
            quantity: 1,
            acquiredAt: Date.now(),
          });
        }

        purchased = true;
        dispatchSovereignEvent('sovereign-coins-changed', {
          delta: -effectivePrice,
          newTotal: newCoins,
        });
        dispatchSovereignEvent('sovereign-item-bought', {
          item,
          price: effectivePrice,
        });

        return {
          ...prev,
          coins: newCoins,
          inventory: newInventory,
        };
      });
      return purchased;
    },
    []
  );

  const sellItem = useCallback((itemId: string): boolean => {
    let sold = false;
    setState((prev) => {
      const invIndex = prev.inventory.findIndex((inv) => inv.item.id === itemId);
      if (invIndex < 0 || prev.inventory[invIndex].quantity <= 0) {
        return prev;
      }

      const target = prev.inventory[invIndex];
      const sellPrice = target.item.sellPrice;
      const newCoins = prev.coins + sellPrice;
      const newInventory = [...prev.inventory];

      let newEquipped = { ...prev.equippedItems };

      if (target.quantity > 1) {
        newInventory[invIndex] = {
          ...target,
          quantity: target.quantity - 1,
        };
      } else {
        newInventory.splice(invIndex, 1);
        // Unequip if currently equipped
        if (target.item.slot && newEquipped[target.item.slot]?.id === itemId) {
          delete newEquipped[target.item.slot];
        }
      }

      sold = true;
      const updatedStats = computePlayerStats(newEquipped, prev.activeBuffs);

      dispatchSovereignEvent('sovereign-coins-changed', {
        delta: sellPrice,
        newTotal: newCoins,
      });
      dispatchSovereignEvent('sovereign-item-sold', {
        item: target.item,
        price: sellPrice,
      });

      return {
        ...prev,
        coins: newCoins,
        inventory: newInventory,
        equippedItems: newEquipped,
        stats: updatedStats,
      };
    });
    return sold;
  }, []);

  const equipItem = useCallback((item: RPGItem) => {
    if (!item.slot) return;
    setState((prev) => {
      const newEquipped = {
        ...prev.equippedItems,
        [item.slot!]: item,
      };
      const updatedStats = computePlayerStats(newEquipped, prev.activeBuffs);

      dispatchSovereignEvent('sovereign-item-equipped', {
        item,
        slot: item.slot,
      });

      return {
        ...prev,
        equippedItems: newEquipped,
        stats: updatedStats,
      };
    });
  }, []);

  const unequipItem = useCallback((slot: EquipmentSlot) => {
    setState((prev) => {
      if (!prev.equippedItems[slot]) return prev;
      const newEquipped = { ...prev.equippedItems };
      delete newEquipped[slot];
      const updatedStats = computePlayerStats(newEquipped, prev.activeBuffs);

      dispatchSovereignEvent('sovereign-item-unequipped', { slot });

      return {
        ...prev,
        equippedItems: newEquipped,
        stats: updatedStats,
      };
    });
  }, []);

  const consumePotion = useCallback((item: RPGItem): boolean => {
    if (!item.isConsumable) return false;

    let consumed = false;
    setState((prev) => {
      const invIndex = prev.inventory.findIndex((inv) => inv.item.id === item.id);
      if (invIndex < 0 || prev.inventory[invIndex].quantity <= 0) {
        return prev;
      }

      consumed = true;
      const target = prev.inventory[invIndex];
      const newInventory = [...prev.inventory];
      if (target.quantity > 1) {
        newInventory[invIndex] = { ...target, quantity: target.quantity - 1 };
      } else {
        newInventory.splice(invIndex, 1);
      }

      let newCoins = prev.coins;
      let newBuffs = [...(prev.activeBuffs || [])];

      // Item-specific mechanics
      if (item.id === 'potion_sovereign_gold') {
        newCoins += 100;
        dispatchSovereignEvent('sovereign-coins-changed', {
          delta: 100,
          newTotal: newCoins,
        });
      } else if (item.id === 'potion_elixir_of_pegasus') {
        newBuffs = newBuffs.filter((b) => b.id !== 'buff_pegasus');
        newBuffs.push({
          id: 'buff_pegasus',
          name: 'Elixir of Pegasus',
          expiresAt: Date.now() + 120_000, // 2 minutes
          stats: { speedBoost: 0.40 },
        });
      } else if (item.id === 'potion_northern_pine') {
        newBuffs = newBuffs.filter((b) => b.id !== 'buff_pine');
        newBuffs.push({
          id: 'buff_pine',
          name: 'Northern Pine Brew',
          expiresAt: Date.now() + 180_000, // 3 minutes
          stats: { defenseBoost: 15 },
        });
      } else if (item.id === 'potion_draught_of_vitality') {
        newBuffs = newBuffs.filter((b) => b.id !== 'buff_vitality');
        newBuffs.push({
          id: 'buff_vitality',
          name: 'Draught of Vitality',
          expiresAt: Date.now() + 60_000,
          stats: { defenseBoost: 10 },
        });
      }

      const updatedStats = computePlayerStats(prev.equippedItems, newBuffs);
      dispatchSovereignEvent('sovereign-potion-consumed', { item });

      return {
        ...prev,
        coins: newCoins,
        inventory: newInventory,
        activeBuffs: newBuffs,
        stats: updatedStats,
      };
    });

    return consumed;
  }, []);

  const completeQuestStep = useCallback((questId: string, stepId: string) => {
    setState((prev) => {
      let questJustCompleted = false;
      const updatedQuests = prev.quests.map((q) => {
        if (q.id !== questId) return q;

        const updatedSteps = q.steps.map((s) => {
          if (s.id === stepId) {
            return { ...s, isCompleted: true };
          }
          return s;
        });

        const allDone = updatedSteps.every((s) => s.isCompleted);
        if (allDone && !q.isCompleted) {
          questJustCompleted = true;
        }

        return {
          ...q,
          steps: updatedSteps,
          isCompleted: allDone,
        };
      });

      dispatchSovereignEvent('sovereign-quest-step-completed', {
        questId,
        stepId,
      });

      if (questJustCompleted) {
        dispatchSovereignEvent('sovereign-quest-ready-to-claim', { questId });
      }

      return {
        ...prev,
        quests: updatedQuests,
      };
    });
  }, []);

  const completeQuest = useCallback(
    (questId: string) => {
      setState((prev) => {
        const questIndex = prev.quests.findIndex((q) => q.id === questId);
        if (questIndex < 0) return prev;

        const target = prev.quests[questIndex];
        if (target.isClaimed) return prev; // Already claimed

        // Award XP, Coins & Item Reward
        let currentXP = prev.xp + target.xpReward;
        let currentLevel = prev.level;
        let threshold = prev.xpToNextLevel;
        let leveledUp = false;

        while (currentXP >= threshold) {
          currentXP -= threshold;
          currentLevel += 1;
          threshold = calculateXPToNextLevel(currentLevel);
          leveledUp = true;
        }

        const newTitle = getTitleForLevel(currentLevel);
        const newCoins = prev.coins + target.coinReward;

        const newInventory = [...prev.inventory];
        if (target.itemReward) {
          const existingIdx = newInventory.findIndex((i) => i.item.id === target.itemReward!.id);
          if (existingIdx >= 0) {
            newInventory[existingIdx] = {
              ...newInventory[existingIdx],
              quantity: newInventory[existingIdx].quantity + 1,
            };
          } else {
            newInventory.push({
              item: target.itemReward,
              quantity: 1,
              acquiredAt: Date.now(),
            });
          }
        }

        // Mark quest complete and claimed
        const updatedQuests = [...prev.quests];
        updatedQuests[questIndex] = {
          ...target,
          isCompleted: true,
          isClaimed: true,
          steps: target.steps.map((s) => ({ ...s, isCompleted: true })),
        };

        // Determine next active quest
        let nextQuestId = prev.activeQuestId;
        if (questIndex + 1 < updatedQuests.length) {
          nextQuestId = updatedQuests[questIndex + 1].id;
        }

        if (leveledUp) {
          dispatchSovereignEvent('sovereign-levelup', {
            level: currentLevel,
            title: newTitle,
          });
        }

        dispatchSovereignEvent('sovereign-coins-changed', {
          delta: target.coinReward,
          newTotal: newCoins,
        });

        dispatchSovereignEvent('sovereign-quest-completed', {
          quest: updatedQuests[questIndex],
        });

        return {
          ...prev,
          level: currentLevel,
          xp: currentXP,
          xpToNextLevel: threshold,
          title: newTitle,
          coins: newCoins,
          inventory: newInventory,
          quests: updatedQuests,
          activeQuestId: nextQuestId,
        };
      });
    },
    []
  );

  const claimQuestReward = useCallback(
    (questId: string) => {
      // Delegate to completeQuest which marks completed & claimed, awarding all spoils
      completeQuest(questId);
    },
    [completeQuest]
  );

  const setActiveQuestId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeQuestId: id }));
  }, []);

  const resetProgression = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    setState(INITIAL_STATE);
  }, []);

  const contextValue = useMemo<PlayerProgressionContextType>(
    () => ({
      ...state,
      addXP,
      addCoins,
      spendCoins,
      buyItem,
      sellItem,
      equipItem,
      unequipItem,
      consumePotion,
      completeQuestStep,
      completeQuest,
      claimQuestReward,
      setActiveQuestId,
      resetProgression,
    }),
    [
      state,
      addXP,
      addCoins,
      spendCoins,
      buyItem,
      sellItem,
      equipItem,
      unequipItem,
      consumePotion,
      completeQuestStep,
      completeQuest,
      claimQuestReward,
      setActiveQuestId,
      resetProgression,
    ]
  );

  return (
    <PlayerProgressionContext.Provider value={contextValue}>
      {children}
    </PlayerProgressionContext.Provider>
  );
}

/**
 * Hook to access Sovereign Lands player progression and RPG economy systems.
 */
export function usePlayerProgression(): PlayerProgressionContextType {
  const context = useContext(PlayerProgressionContext);
  if (!context) {
    throw new Error(
      'usePlayerProgression must be used within a PlayerProgressionProvider.'
    );
  }
  return context;
}

export default PlayerProgressionProvider;
