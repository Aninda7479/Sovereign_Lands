/**
 * Sovereign Lands - RPG Progression & Economy Core Type Definitions
 * Defines data structures for items, equipment slots, inventory, quests, shops, and player stats.
 */

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'potion'
  | 'blueprint'
  | 'trinket';

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export type EquipmentSlot =
  | 'head'
  | 'amulet'
  | 'ring'
  | 'weapon'
  | 'shield'
  | 'relic';

export interface RPGItemStats {
  speedBoost?: number; // e.g. 0.35 (+35%)
  harvestBoost?: number; // e.g. 0.50 (+50%)
  defenseBoost?: number; // flat defense bonus
  attackBoost?: number; // flat attack bonus
  shopDiscount?: number; // e.g. 0.15 (15% discount)
}

export interface RPGItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  slot?: EquipmentSlot;
  price: number; // in gold coins
  sellPrice: number;
  levelRequired: number;
  stats?: RPGItemStats;
  iconName: string; // Lucide icon identifier
  loreText?: string;
  isConsumable?: boolean;
}

export interface InventoryItem {
  item: RPGItem;
  quantity: number;
  acquiredAt: number; // timestamp
}

export interface QuestStep {
  id: string;
  label: string;
  instruction: string;
  hotkey?: string;
  isCompleted: boolean;
  waypoint?: { x: number; z: number; label: string };
}

export interface QuestData {
  id: string;
  numberTitle: string; // e.g. "QUEST I"
  title: string;
  subtitle: string;
  loreText: string;
  xpReward: number;
  coinReward: number;
  itemReward?: RPGItem;
  levelRequired: number;
  steps: QuestStep[];
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface ShopProfile {
  id: string;
  name: string;
  subtitle: string;
  kingdom: 'North' | 'South' | 'Neutral';
  shopkeeperName: string;
  shopkeeperRole: string;
  npcId: string;
  position: [number, number, number];
  colorTheme: string;
  items: RPGItem[];
  greeting: string;
}

export interface PlayerStats {
  speedMultiplier: number;
  harvestMultiplier: number;
  defenseRating: number;
  attackRating: number;
  shopDiscountMultiplier: number;
}

export interface ActiveBuff {
  id: string;
  name: string;
  expiresAt: number;
  stats: Partial<RPGItemStats>;
}

export interface PlayerProgressionState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  title: string;
  inventory: InventoryItem[];
  equippedItems: Partial<Record<EquipmentSlot, RPGItem>>;
  quests: QuestData[];
  activeQuestId: string;
  stats: PlayerStats;
  activeBuffs?: ActiveBuff[];
}

export interface PlayerProgressionContextType extends PlayerProgressionState {
  addXP: (amount: number, reason?: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  buyItem: (item: RPGItem) => boolean;
  sellItem: (itemId: string) => boolean;
  equipItem: (item: RPGItem) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  consumePotion: (item: RPGItem) => boolean;
  completeQuestStep: (questId: string, stepId: string) => void;
  completeQuest: (questId: string) => void;
  claimQuestReward: (questId: string) => void;
  setActiveQuestId: (id: string) => void;
  resetProgression: () => void;
}

/**
 * Calculates XP threshold required to reach next level.
 */
export function calculateXPToNextLevel(level: number): number {
  const THRESHOLDS: Record<number, number> = {
    1: 200,   // Level 1 -> 2 (200 XP)
    2: 350,   // Level 2 -> 3 (350 XP)
    3: 500,   // Level 3 -> 4 (500 XP)
    4: 700,   // Level 4 -> 5 (700 XP)
    5: 1000,  // Level 5 -> 6 (1000 XP)
    6: 1500,  // Level 6 -> 7 (1500 XP)
    7: 2200,  // Level 7 -> 8 (2200 XP)
  };
  return THRESHOLDS[level] || Math.round(200 * Math.pow(1.35, level - 1));
}

/**
 * Returns noble/honorific title for a given player progression level.
 */
export function getTitleForLevel(level: number): string {
  switch (level) {
    case 1:
      return 'Novice Pioneer';
    case 2:
      return 'Yeoman Freeholder';
    case 3:
      return 'Frontier Warden';
    case 4:
      return 'Knight of the Realm';
    case 5:
      return 'High Baron of Sovereign Lands';
    case 6:
      return 'Citadel Archon';
    case 7:
    default:
      return 'Continental Sovereign';
  }
}
