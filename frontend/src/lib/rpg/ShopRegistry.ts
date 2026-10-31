/**
 * Sovereign Lands - Shop & Merchant Registry
 * Configures the canonical open-world shops, inventories, shopkeeper profiles, and map coordinates.
 */

import { ShopProfile, RPGItem } from './types';
import { getItemById } from './ArtifactRegistry';

function resolveItems(ids: string[]): RPGItem[] {
  return ids
    .map((id) => getItemById(id))
    .filter((item): item is RPGItem => item !== undefined);
}

export const SHOP_REGISTRY: Record<string, ShopProfile> = {
  // ========================================================
  // 1. TORVALD'S IRON FORGE & ARMORY
  // ========================================================
  armory_torvald: {
    id: 'armory_torvald',
    name: "Torvald's Iron Forge & Armory",
    subtitle: 'Cold-forged steel & vanguard armor',
    kingdom: 'North',
    shopkeeperName: 'Torvald',
    shopkeeperRole: 'Master Weaponsmith',
    npcId: 'torvald',
    position: [-22, 1.2, -120],
    colorTheme: 'from-amber-600 to-slate-900',
    greeting:
      'Welcome to the forge, wanderer. Feel the heat of genuine northern steel. What can Torvald strike for you today?',
    items: resolveItems([
      'weapon_vanguard_sword',
      'weapon_frostfang_battleaxe',
      'weapon_ranger_bow',
      'shield_boreal_kite',
      'armor_northern_cuirass',
      'trinket_blacksmith_tongs',
    ]),
  },

  // ========================================================
  // 2. THE SANCTUARY APOTHECARY
  // ========================================================
  apothecary_beatrice: {
    id: 'apothecary_beatrice',
    name: 'The Sanctuary Apothecary',
    subtitle: 'Sacred balms, elixirs & curative draughts',
    kingdom: 'North',
    shopkeeperName: 'Sister Beatrice',
    shopkeeperRole: 'Sanctuary Herbalist',
    npcId: 'beatrice',
    position: [-80, 1.4, -132],
    colorTheme: 'from-emerald-600 to-teal-950',
    greeting:
      'May the light bless your path, traveler. The Sanctuary offers remedies for weary souls, frostbite, and exhausted limbs.',
    items: resolveItems([
      'potion_elixir_of_pegasus',
      'potion_draught_of_vitality',
      'potion_northern_pine',
      'potion_sovereign_gold',
      'artifact_blessed_rosary',
    ]),
  },

  // ========================================================
  // 3. THE ARCANE RELIQUARY
  // ========================================================
  arcane_observatory: {
    id: 'arcane_observatory',
    name: 'The Arcane Reliquary',
    subtitle: 'Ancient astrolabes, celestial relics & high sorcery',
    kingdom: 'Neutral',
    shopkeeperName: 'Archmage Kaelen',
    shopkeeperRole: 'Celestial Astrologer & Guardian',
    npcId: 'kaelen',
    position: [-94, 2.0, -96],
    colorTheme: 'from-purple-600 to-indigo-950',
    greeting:
      'You stand beneath the stars of the Old Realm. The relics here whisper truths of lost dominions and cosmic alignment.',
    items: resolveItems([
      'artifact_celestial_sextant',
      'artifact_eye_of_frostfang',
      'artifact_arcane_crystal',
      'artifact_phoenix_feather',
      'artifact_crown_of_sovereignty',
    ]),
  },

  // ========================================================
  // 4. CEDRIC'S BOREAL MERCHANT GUILD
  // ========================================================
  guild_cedric: {
    id: 'guild_cedric',
    name: "Cedric's Boreal Merchant Guild",
    subtitle: 'Provisions, construction plans & raw commodities',
    kingdom: 'North',
    shopkeeperName: 'Cedric',
    shopkeeperRole: 'Guild Factor & Trade Master',
    npcId: 'cedric',
    position: [-56, 1.2, -114],
    colorTheme: 'from-blue-600 to-slate-900',
    greeting:
      'Coins turn the wheels of kingdoms! Looking for architectural deeds, heirloom seeds, or fine northern provisions?',
    items: resolveItems([
      'blueprint_master_mason',
      'commodity_grain_satchel',
      'trinket_cartographer_atlas',
      'artifact_titan_buckle',
      'armor_pioneers_boots',
    ]),
  },

  // ========================================================
  // 5. ZARA'S SOLARA OASIS CURIO BAZAAR
  // ========================================================
  bazaar_zara: {
    id: 'bazaar_zara',
    name: "Zara's Solara Oasis Curio Bazaar",
    subtitle: 'Exotic silks, sun-blades & southern treasures',
    kingdom: 'South',
    shopkeeperName: 'Zara',
    shopkeeperRole: 'Silk Nomad & Curio Merchant',
    npcId: 'zara',
    position: [15, 1.0, 45],
    colorTheme: 'from-yellow-500 to-amber-900',
    greeting:
      'Warm sun upon you, traveler from the frosted north! The shifting dunes have brought priceless wonders to my silk stall.',
    items: resolveItems([
      'weapon_solara_sunblade',
      'armor_solara_silk_robe',
      'artifact_golden_scarab',
      'artifact_ring_of_sun_king',
      'trinket_southern_silk_sash',
    ]),
  },

  // ========================================================
  // 6. LYRA'S WANDERING TRINKET CART
  // ========================================================
  minstrel_lyra: {
    id: 'minstrel_lyra',
    name: "Lyra's Wandering Trinket Cart",
    subtitle: 'Charms, ballads, songs & eccentric curios',
    kingdom: 'Neutral',
    shopkeeperName: 'Lyra',
    shopkeeperRole: 'Wandering Troubadour',
    npcId: 'lyra',
    position: [-46, 1.2, -94],
    colorTheme: 'from-pink-600 to-rose-950',
    greeting:
      "A melody for your thoughts, a charm for your pouch! Every coin supports the realm's wandering ballads.",
    items: resolveItems([
      'trinket_bard_songsheet',
      'artifact_amulet_of_swiftness',
      'potion_draught_of_vitality',
      'weapon_sickle_prosperity',
      'potion_elixir_of_pegasus',
    ]),
  },
};

export const ALL_SHOPS: ShopProfile[] = Object.values(SHOP_REGISTRY);

export function getShopById(shopId: string): ShopProfile | undefined {
  return SHOP_REGISTRY[shopId];
}

export function getShopByNpcId(npcId: string): ShopProfile | undefined {
  return ALL_SHOPS.find((shop) => shop.npcId === npcId);
}
