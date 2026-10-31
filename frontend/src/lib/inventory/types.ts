export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemCategory = 'artefacts' | 'weapons' | 'potions' | 'blueprints';

export type EquipmentSlot = 'head' | 'amulet' | 'ring' | 'weapon' | 'shield' | 'relic';

export interface ItemStatPerks {
  movementSpeedPct?: number;   // e.g. +35% Sprint Speed
  harvestYieldPct?: number;    // e.g. +50% Parcel Gold Yield
  defenseRating?: number;      // e.g. +45 Defense
  shopDiscountPct?: number;    // e.g. +20% Shop Discount
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  slot?: EquipmentSlot;        // if equippable
  price: number;               // gold purchase cost
  levelReq: number;            // player level required
  description: string;         // lore text
  stats: ItemStatPerks;
  statTags: string[];          // visual tags: e.g. ["+35% Sprint Speed", "+50% Parcel Gold Yield"]
  iconName: string;            // icon key for rendering
  quantity?: number;           // bag stack count
  usable?: boolean;            // true if potion / draught / scroll
  buffDurationSec?: number;    // duration in seconds
  buffName?: string;
  buffDescription?: string;
}

export type EquipmentSlots = {
  head: InventoryItem | null;
  amulet: InventoryItem | null;
  ring: InventoryItem | null;
  weapon: InventoryItem | null;
  shield: InventoryItem | null;
  relic: InventoryItem | null;
};

export interface ActiveBuff {
  id: string;
  name: string;
  description: string;
  durationSec: number;
  remainingSec: number;
  stats: ItemStatPerks;
  iconName: string;
}

export interface ShopProfile {
  id: string;
  name: string;
  merchantName: string;
  merchantRole: string;
  npcId?: string;
  portraitColor: string;
  avatarIcon: string;
  greetingDialogue: string;
  inventoryItemIds: string[];
}
