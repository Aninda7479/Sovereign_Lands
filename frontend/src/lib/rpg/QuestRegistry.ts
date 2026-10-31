/**
 * Sovereign Lands - Quest & Mission Registry
 * Defines sequential storyline quests from Level 1 Pioneer to Level 7 Continental Monarch.
 */

import { QuestData } from './types';
import { getItemById } from './ArtifactRegistry';

export const DEFAULT_QUESTS: QuestData[] = [
  // ========================================================
  // QUEST 1: THE PIONEER'S CLAIM
  // ========================================================
  {
    id: 'quest_1',
    numberTitle: 'QUEST I',
    title: "The Pioneer's Claim",
    subtitle: 'Frontier Settlement',
    loreText:
      'The Sovereign North invites all wanderers to stake their permanent birthright on the continental frontier. Cross the frosted stone markers, stand within an unclaimed parcel quadrant, and seal your sovereign title on-chain.',
    xpReward: 150,
    coinReward: 200,
    itemReward: getItemById('armor_pioneers_boots'),
    levelRequired: 1,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q1_s1',
        label: 'Travel to Frontier Claim Zone',
        instruction: 'Move past the border stones towards coordinate [-40, -40]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: -40, z: -40, label: 'Frontier Claim Zone' },
      },
      {
        id: 'q1_s2',
        label: 'Open Land Claim Interface',
        instruction: 'Press [B] while standing inside an unclaimed parcel',
        hotkey: 'B',
        isCompleted: false,
        waypoint: { x: -40, z: -40, label: 'Claimable Frontier Parcel' },
      },
      {
        id: 'q1_s3',
        label: 'Claim Your First Sovereign Parcel',
        instruction: 'Mint the parcel deed on-chain or complete the local sovereign claim',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 2: BREAD & SOVEREIGNTY
  // ========================================================
  {
    id: 'quest_2',
    numberTitle: 'QUEST II',
    title: 'Bread & Sovereignty',
    subtitle: 'Agrarian Foundation',
    loreText:
      'Empty dirt cannot feed an army. Erect a Farmstead upon your claimed soil to yield continuous golden grain. Tithe to the common treasury to secure Citadel favor and agrarian prosperity.',
    xpReward: 250,
    coinReward: 350,
    itemReward: getItemById('weapon_sickle_prosperity'),
    levelRequired: 1,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q2_s1',
        label: 'Enter 3D Construction Mode',
        instruction: 'Press [C] to project procedural architectural holograms',
        hotkey: 'C',
        isCompleted: false,
      },
      {
        id: 'q2_s2',
        label: 'Place Farmstead at Boreal Basin',
        instruction: 'Construct a Farmstead structure near coordinate [-35, -65]',
        hotkey: 'C',
        isCompleted: false,
        waypoint: { x: -35, z: -65, label: "Aldric's Farmland Basin" },
      },
      {
        id: 'q2_s3',
        label: 'Harvest First Golden Crop Yield',
        instruction: 'Interact with the Farmstead to harvest accumulated gold crops',
        hotkey: 'E',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 3: COLD FORGED STEEL
  // ========================================================
  {
    id: 'quest_3',
    numberTitle: 'QUEST III',
    title: 'Cold Forged Steel',
    subtitle: "Blacksmith's Ordinance",
    loreText:
      'Unarmed sovereigns are quickly deposed. Seek out Master Torvald at his iron forge in the northern foothills, inspect his weaponry, and arm yourself with forged vanguard steel.',
    xpReward: 200,
    coinReward: 250,
    itemReward: getItemById('trinket_blacksmith_tongs'),
    levelRequired: 2,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q3_s1',
        label: "Travel to Torvald's Forge",
        instruction: 'Follow the northern trail to Torvald\'s Iron Forge at [-22, -120]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: -22, z: -120, label: "Torvald's Iron Forge" },
      },
      {
        id: 'q3_s2',
        label: 'Open Forge Shop Catalog',
        instruction: 'Approach Torvald and press [E] to browse weapons and armor',
        hotkey: 'E',
        isCompleted: false,
      },
      {
        id: 'q3_s3',
        label: 'Acquire Vanguard Longsword',
        instruction: 'Purchase a Vanguard Iron Longsword or armory ware',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 4: THE ALCHEMIST'S REMEDY
  // ========================================================
  {
    id: 'quest_4',
    numberTitle: 'QUEST IV',
    title: "The Alchemist's Remedy",
    subtitle: 'Sacred Concoctions',
    loreText:
      'Boreal blizzards chill bone and steel. In the sacred northern sanctuary, Sister Beatrice distills herbs and celestial dew into curative draughts to revitalize weary travelers.',
    xpReward: 250,
    coinReward: 300,
    itemReward: getItemById('artifact_blessed_rosary'),
    levelRequired: 2,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q4_s1',
        label: 'Visit Sister Beatrice at the Sanctuary',
        instruction: 'Travel to the peaceful Sanctuary Apothecary at [-80, -132]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: -80, z: -132, label: 'The Sanctuary Apothecary' },
      },
      {
        id: 'q4_s2',
        label: 'Purchase an Elixir of Pegasus',
        instruction: 'Open the Apothecary shop and purchase an Elixir of Pegasus',
        hotkey: 'E',
        isCompleted: false,
      },
      {
        id: 'q4_s3',
        label: 'Test the Invigorating Draught',
        instruction: 'Open your inventory [I] and consume the elixir to gain sprint speed',
        hotkey: 'I',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 5: CROSSING THE GREAT DIVIDE
  // ========================================================
  {
    id: 'quest_5',
    numberTitle: 'QUEST V',
    title: 'Crossing the Great Divide',
    subtitle: 'Southern Expedition',
    loreText:
      'The continent is split by the perilous Great Divide chasm. Cross the grand suspension bridge to the sun-drenched dunes of the South and rendezvous with Nomad Merchant Zara.',
    xpReward: 350,
    coinReward: 400,
    itemReward: getItemById('trinket_southern_silk_sash'),
    levelRequired: 3,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q5_s1',
        label: 'Cross the Great Divide Suspension Bridge',
        instruction: 'Navigate south across the central bridge towards coordinate [15, 45]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: 15, z: 45, label: "Zara's Solara Oasis Curio Bazaar" },
      },
      {
        id: 'q5_s2',
        label: 'Meet Nomad Merchant Zara',
        instruction: 'Interact with Zara at her ornate desert pavilion',
        hotkey: 'E',
        isCompleted: false,
      },
      {
        id: 'q5_s3',
        label: 'Trade Southern Curios',
        instruction: 'Inspect the southern inventory or purchase an exotic artifact',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 6: RELICS OF THE ARCANE
  // ========================================================
  {
    id: 'quest_6',
    numberTitle: 'QUEST VI',
    title: 'Relics of the Arcane',
    subtitle: 'Celestial Mystery',
    loreText:
      'Perched atop the western ridge stands the ancient Archmage Observatory. High Astrologer Kaelen watches the stars for celestial convergences that empower continental ley lines.',
    xpReward: 450,
    coinReward: 500,
    itemReward: getItemById('artifact_arcane_crystal'),
    levelRequired: 4,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q6_s1',
        label: 'Ascend to Archmage Observatory',
        instruction: 'Climb the winding mountain path to coordinate [-94, -96]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: -94, z: -96, label: 'Archmage Observatory' },
      },
      {
        id: 'q6_s2',
        label: 'Inspect the Ancient Astrolabe',
        instruction: 'Access the Arcane Reliquary shop to view legendary curios',
        hotkey: 'E',
        isCompleted: false,
      },
      {
        id: 'q6_s3',
        label: 'Attune to the Arcane Ley Lines',
        instruction: 'Commune with the observatory apparatus or acquire an astral focus',
        isCompleted: false,
      },
    ],
  },

  // ========================================================
  // QUEST 7: CROWN OF DOMINION
  // ========================================================
  {
    id: 'quest_7',
    numberTitle: 'QUEST VII',
    title: 'Crown of Dominion',
    subtitle: 'High Sovereign Throne',
    loreText:
      'The moment of destiny arrives. Ascend to the Northern Citadel War Table, convene the High Council, cast your sovereign decree, and claim the Crown of Sovereignty.',
    xpReward: 800,
    coinReward: 1000,
    itemReward: getItemById('artifact_crown_of_sovereignty'),
    levelRequired: 5,
    isCompleted: false,
    isClaimed: false,
    steps: [
      {
        id: 'q7_s1',
        label: 'Visit the Citadel War Table',
        instruction: 'Enter the Grand Citadel interior towards coordinate [25, -95]',
        hotkey: 'WASD',
        isCompleted: false,
        waypoint: { x: 25, z: -95, label: 'Citadel War Table' },
      },
      {
        id: 'q7_s2',
        label: 'Cast a Sovereign Council Decree',
        instruction: 'Open the Citadel Council Table and cast a realm policy vote',
        hotkey: 'E',
        isCompleted: false,
      },
      {
        id: 'q7_s3',
        label: 'Attain Level 5 & Claim the Crown',
        instruction: 'Reach Player Level 5 to don the Crown of Sovereignty',
        isCompleted: false,
      },
    ],
  },
];

export const QUESTS_BY_ID: Record<string, QuestData> = DEFAULT_QUESTS.reduce(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {} as Record<string, QuestData>
);

export function getQuestById(id: string): QuestData | undefined {
  return QUESTS_BY_ID[id];
}
