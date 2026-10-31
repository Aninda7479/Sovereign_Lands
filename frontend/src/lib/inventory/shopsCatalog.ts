import { ShopProfile } from './types';

export const SHOPS_CATALOG: Record<string, ShopProfile> = {
  cedric: {
    id: 'cedric',
    npcId: 'cedric',
    name: "Cedric's Royal Caravan Bazaar",
    merchantName: 'Cedric',
    merchantRole: 'Market Trader & Caravan Master',
    portraitColor: 'from-amber-600 via-amber-800 to-yellow-950',
    avatarIcon: 'Coins',
    greetingDialogue:
      'Ah, traveler! Fresh caravans rolled in from the southern passes. High-grade steel, blueprints, and rare curios—all at honest frontier prices.',
    inventoryItemIds: [
      'iron_broadsword',
      'wooden_kite_shield',
      'helm_of_the_vanguard',
      'elixir_of_hyper_swiftness',
      'draught_of_the_merchant_prince',
      'blueprint_reinforced_watchtower',
      'blueprint_automated_granary',
      'signet_of_the_citadel_consul',
      'talisman_of_abundant_tithes',
    ],
  },
  zara: {
    id: 'zara',
    npcId: 'zara',
    name: "Zara's Relic Emporium",
    merchantName: 'Zara',
    merchantRole: 'Nomadic Merchant & Antiquarian',
    portraitColor: 'from-purple-600 via-purple-900 to-indigo-950',
    avatarIcon: 'Sparkles',
    greetingDialogue:
      'Step softly into the shadows, traveler. Ancient tombs in the Great Divide whisper their secrets... What forgotten power does your gold yearn to awaken?',
    inventoryItemIds: [
      'crown_of_high_command',
      'pennant_of_sovereignty',
      'boots_of_the_windstrider',
      'ring_of_the_shadow_broker',
      'hunter_bone_amulet',
      'talisman_of_abundant_tithes',
      'signet_of_the_citadel_consul',
      'draught_of_the_merchant_prince',
    ],
  },
  torvald: {
    id: 'torvald',
    npcId: 'torvald',
    name: "Torvald's Bastion Forge",
    merchantName: 'Torvald',
    merchantRole: 'Master Weaponsmith & Armorer',
    portraitColor: 'from-orange-600 via-red-900 to-zinc-950',
    avatarIcon: 'Hammer',
    greetingDialogue:
      'The anvil rings from dawn till dusk! If you want thin southern iron, look elsewhere. My folded steel and star-iron shields will keep your neck attached.',
    inventoryItemIds: [
      'boreal_frostfang_blade',
      'aegis_of_the_frost_bastion',
      'helm_of_the_vanguard',
      'iron_broadsword',
      'wooden_kite_shield',
      'blueprint_blacksmith_foundry',
      'potion_of_iron_skin',
    ],
  },
  beatrice: {
    id: 'beatrice',
    npcId: 'beatrice',
    name: "Sister Beatrice's Apothecary",
    merchantName: 'Sister Beatrice',
    merchantRole: 'Priestess & Herbal Alchemist',
    portraitColor: 'from-emerald-600 via-teal-900 to-emerald-950',
    avatarIcon: 'FlaskConical',
    greetingDialogue:
      'The blessing of the frost pines be upon you. Brews of swiftness and fertile harvests await. Tend your soul and your stamina, wanderer.',
    inventoryItemIds: [
      'elixir_of_hyper_swiftness',
      'draught_of_boreal_abundance',
      'potion_of_iron_skin',
      'draught_of_the_merchant_prince',
      'talisman_of_abundant_tithes',
      'hunter_bone_amulet',
    ],
  },
  aldric: {
    id: 'aldric',
    npcId: 'aldric',
    name: "Aldric's Harvest Storehouse",
    merchantName: 'Aldric',
    merchantRole: 'Boreal Farmer & Harvester',
    portraitColor: 'from-amber-700 via-stone-800 to-stone-950',
    avatarIcon: 'Wheat',
    greetingDialogue:
      'Cold winds won’t stop us from planting. Need sturdy tools, seeds, or granary schematics? Keep your boots clean and your coin ready.',
    inventoryItemIds: [
      'draught_of_boreal_abundance',
      'blueprint_automated_granary',
      'hunter_bone_amulet',
      'iron_broadsword',
      'wooden_kite_shield',
    ],
  },
  general: {
    id: 'general',
    name: 'Sovereign Grand Bazaar',
    merchantName: 'Grand Imperial Quartermaster',
    merchantRole: 'Royal Provisioner of the Realm',
    portraitColor: 'from-amber-500 via-yellow-700 to-zinc-950',
    avatarIcon: 'Store',
    greetingDialogue:
      'By decree of the High Citadel, all imperial provisions, master blueprints, and sanctified relics are assembled for sovereign purchase.',
    inventoryItemIds: [
      'crown_of_high_command',
      'pennant_of_sovereignty',
      'boreal_frostfang_blade',
      'aegis_of_the_frost_bastion',
      'boots_of_the_windstrider',
      'ring_of_the_shadow_broker',
      'signet_of_the_citadel_consul',
      'talisman_of_abundant_tithes',
      'helm_of_the_vanguard',
      'hunter_bone_amulet',
      'iron_broadsword',
      'wooden_kite_shield',
      'elixir_of_hyper_swiftness',
      'draught_of_boreal_abundance',
      'potion_of_iron_skin',
      'draught_of_the_merchant_prince',
      'blueprint_citadel_grand_keep',
      'blueprint_reinforced_watchtower',
      'blueprint_automated_granary',
      'blueprint_blacksmith_foundry',
    ],
  },
};

export function getShopProfileById(shopId: string | null | undefined): ShopProfile {
  if (!shopId) return SHOPS_CATALOG.general;
  const normalized = shopId.toLowerCase().trim();

  // Direct lookup
  if (SHOPS_CATALOG[normalized]) {
    return SHOPS_CATALOG[normalized];
  }

  // Common aliases & substrings
  if (normalized.includes('torvald') || normalized.includes('blacksmith') || normalized.includes('forge') || normalized.includes('weapon')) {
    return SHOPS_CATALOG.torvald;
  }
  if (normalized.includes('zara') || normalized.includes('relic') || normalized.includes('artefact')) {
    return SHOPS_CATALOG.zara;
  }
  if (normalized.includes('cedric') || normalized.includes('caravan') || normalized.includes('market') || normalized.includes('bazaar')) {
    return SHOPS_CATALOG.cedric;
  }
  if (normalized.includes('beatrice') || normalized.includes('apothecary') || normalized.includes('potion') || normalized.includes('elixir')) {
    return SHOPS_CATALOG.beatrice;
  }
  if (normalized.includes('aldric') || normalized.includes('farm') || normalized.includes('harvest')) {
    return SHOPS_CATALOG.aldric;
  }

  // Try matching by merchant name or keyword
  const found = Object.values(SHOPS_CATALOG).find(
    (shop) =>
      shop.merchantName.toLowerCase().includes(normalized) ||
      shop.name.toLowerCase().includes(normalized) ||
      (shop.npcId && shop.npcId.toLowerCase() === normalized)
  );
  return found || SHOPS_CATALOG.general;
}
