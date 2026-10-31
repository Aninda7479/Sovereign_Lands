/**
 * Sovereign Lands - NPC Character Profiles & Lore Data
 * Defines rich personalities, waypoint routes, ambient voice barks, and dialogue choices
 * for living open-world 3D entities roaming the sandbox.
 */

export type NPCId = 'aldric' | 'gareth' | 'merin' | 'zara';

export interface NPCWaypoint {
  position: [number, number, number];
  dwellTimeSeconds: number; // how long NPC pauses at this point
  idleAction?: 'inspect' | 'warm_hands' | 'look_around' | 'work' | 'rest';
  barkText?: string;
}

export interface QuickDialogueChoice {
  id: string;
  label: string;
  prompt: string;
}

export interface NPCProfile {
  id: NPCId;
  name: string;
  title: string;
  role: string;
  kingdom: 'North' | 'South' | 'Neutral';
  faction: 'north' | 'south' | 'neutral';
  meshType: 'npc_farmer' | 'npc_knight' | 'npc_advisor' | 'character';
  personality: string;
  avatarUrl?: string;
  portraitColor: string;
  spawnPosition: [number, number, number];
  patrolSpeed: number; // meters per second (default ~ 1.4 m/s walking)
  waypoints: NPCWaypoint[];
  ambientBarks: string[];
  quickChoices: QuickDialogueChoice[];
  defaultDialogue: string;
}

export const NPC_PROFILES: Record<NPCId, NPCProfile> = {
  aldric: {
    id: 'aldric',
    name: 'Aldric',
    title: 'The Boreal Farmer',
    role: 'Farmer & Grain Harvester',
    kingdom: 'North',
    faction: 'north',
    meshType: 'npc_farmer',
    personality:
      'Grizzled, hardworking peasant who knows the northern soil like the back of his hand. Deeply distrustful of southern nobility, constantly grumbling about frost, taxes, and high Citadel tithes. Has a soft spot for anyone willing to buy him an ale.',
    portraitColor: 'from-amber-700 to-yellow-800',
    spawnPosition: [-35, 1.2, -65],
    patrolSpeed: 1.3,
    waypoints: [
      {
        position: [-35, 1.2, -65],
        dwellTimeSeconds: 6,
        idleAction: 'work',
        barkText: 'The late barley is holding against the morning chill.',
      },
      {
        position: [-42, 1.4, -75],
        dwellTimeSeconds: 4,
        idleAction: 'inspect',
        barkText: 'Need to mend this irrigation furrow before the freeze.',
      },
      {
        position: [-28, 1.1, -82],
        dwellTimeSeconds: 5,
        idleAction: 'look_around',
        barkText: 'Citadel spires look gloomy under those heavy gray clouds.',
      },
      {
        position: [-22, 1.2, -68],
        dwellTimeSeconds: 4,
        idleAction: 'warm_hands',
        barkText: 'Cold winds coming down from the Frost Ridge...',
      },
    ],
    ambientBarks: [
      'Cold winds biting again... Frost will ruin the late barley.',
      'Citadel lords feast while we break our backs in frozen mud.',
      'If taxes go any higher, I am selling the plow and joining the bandits.',
      'Watch where you tread, stranger! Those sprouts are worth gold.',
      'Heard the Great Divide bridge had Southern spies spotted near it.',
    ],
    quickChoices: [
      {
        id: 'harvest',
        label: 'Ask about the harvest',
        prompt: 'How fares the grain harvest in the cold North this season?',
      },
      {
        id: 'taxes',
        label: 'Complain about royal tithes',
        prompt: 'Why are the Citadel tithes so burdensome on the farmers?',
      },
      {
        id: 'rumors',
        label: 'Inquire about strangers',
        prompt: 'Have you seen any strange wanderers or spies in the fields?',
      },
      {
        id: 'hire',
        label: 'Hire for farmstead labor',
        prompt: 'Can I hire you to tend my claimed parcel farmstead?',
      },
    ],
    defaultDialogue:
      'Aye, traveler. Mind you do not trample the wheat. Between the bitter frost and the royal tax collectors, a farmer barely keeps enough to feed the pigs.',
  },

  gareth: {
    id: 'gareth',
    name: 'Sir Gareth',
    title: 'The Fortress Guard',
    role: 'Vanguard Bridge Sentry',
    kingdom: 'North',
    faction: 'north',
    meshType: 'npc_knight',
    personality:
      'Disciplined, battle-tested sentinel guarding the northern choke point of the Great Divide bridge. Vigilant, stern, values defense fortifications and military order above all else.',
    portraitColor: 'from-slate-700 to-sky-900',
    spawnPosition: [0, 1.8, -22],
    patrolSpeed: 1.5,
    waypoints: [
      {
        position: [0, 1.8, -22],
        dwellTimeSeconds: 5,
        idleAction: 'look_around',
        barkText: 'Halt! Scan the southern riverbank for movement.',
      },
      {
        position: [4, 1.8, -12],
        dwellTimeSeconds: 4,
        idleAction: 'inspect',
        barkText: 'Ballista winch is oiled. Sentry tower ready.',
      },
      {
        position: [-4, 1.8, -2],
        dwellTimeSeconds: 6,
        idleAction: 'look_around',
        barkText: 'River rapids are loud today. Stay sharp.',
      },
      {
        position: [0, 1.8, -18],
        dwellTimeSeconds: 3,
        idleAction: 'warm_hands',
        barkText: 'A warm brazier would do wonders on this bridge.',
      },
    ],
    ambientBarks: [
      'Eyes front! The Great Divide is no place for idle loiterers.',
      'Keep that blade sheathed unless you want a quarrel through your cuirass.',
      'Southern skirmishers were sighted across the river last dusk.',
      'Our watchtowers need higher stone walls. Council is slacking.',
      'The bridge stands unbroken. Long live the Sovereign North!',
    ],
    quickChoices: [
      {
        id: 'threat',
        label: 'Ask about border threats',
        prompt: 'What is the current threat level at the Great Divide bridge?',
      },
      {
        id: 'defense',
        label: 'Inquire about fortifications',
        prompt: 'How can we upgrade the defensive rating of the bridgeheads?',
      },
      {
        id: 'enemies',
        label: 'Ask about Southern soldiers',
        prompt: 'Have enemy skirmishers attempted to cross the river recently?',
      },
      {
        id: 'towers',
        label: 'Strategic building advice',
        prompt: 'Where should a sovereign lord construct guard towers to assist you?',
      },
    ],
    defaultDialogue:
      'Halt! Identify your allegiance, traveler. The Great Divide bridge is under strict military curfew. Keep your steel sheathed while in my sight.',
  },

  merin: {
    id: 'merin',
    name: 'Merin',
    title: 'The Citadel Royal Advisor',
    role: 'Crown Treasurer & Scholar',
    kingdom: 'North',
    faction: 'neutral',
    meshType: 'npc_advisor',
    personality:
      'Erudite, diplomatic royal counselor who studies war statistics, parcel defense ratings, and treasury yields. Speaks with measured precision and political savvy.',
    portraitColor: 'from-indigo-800 to-purple-950',
    spawnPosition: [30, 2.0, -110],
    patrolSpeed: 1.1,
    waypoints: [
      {
        position: [30, 2.0, -110],
        dwellTimeSeconds: 7,
        idleAction: 'inspect',
        barkText: 'The royal ledger reflects another parcel claimed on the frontier.',
      },
      {
        position: [38, 2.1, -118],
        dwellTimeSeconds: 5,
        idleAction: 'look_around',
        barkText: 'The Council voting period will conclude with the next chime.',
      },
      {
        position: [24, 2.0, -125],
        dwellTimeSeconds: 6,
        idleAction: 'inspect',
        barkText: 'Reviewing defense ratings of bordering curtain walls.',
      },
    ],
    ambientBarks: [
      'The treasury balance shifts by the hour as frontier parcels produce.',
      'Council votes on the new decree close when the sun reaches high peak.',
      'A sovereign kingdom requires both gold in the vaults and steel at the gates.',
      'Every claimed parcel provides a steady 10% tithe to the common fund.',
      'Diplomacy with the South falters; the lords prepare their armies.',
    ],
    quickChoices: [
      {
        id: 'treasury',
        label: 'Ask about the treasury',
        prompt: 'How is the kingdom treasury performing this economic cycle?',
      },
      {
        id: 'council',
        label: 'Inquire about active decrees',
        prompt: 'Explain the active voting proposals currently before the Council.',
      },
      {
        id: 'parcels',
        label: 'Strategic parcel valuation',
        prompt: 'Which frontier plots offer the highest strategic and gold value?',
      },
      {
        id: 'war_status',
        label: 'Ask about war status',
        prompt: 'What are the current war statistics and defense ratings between kingdoms?',
      },
    ],
    defaultDialogue:
      'Greetings, Lord. The kingdom’s ledgers are open to those with land and status. Whether you seek economic insight or wish to influence the Citadel council, speak your mind.',
  },

  zara: {
    id: 'zara',
    name: 'Zara',
    title: 'The Frontier Trader',
    role: 'Nomadic Merchant & Information Broker',
    kingdom: 'South',
    faction: 'south',
    meshType: 'npc_farmer',
    personality:
      'Quick-witted, opportunistic wanderer who crosses the border freely. Trades in rare goods, gold tips, and dangerous rumors. Loyal to whoever holds the heaviest coin purse.',
    portraitColor: 'from-amber-600 to-red-800',
    spawnPosition: [15, 1.0, 45],
    patrolSpeed: 1.4,
    waypoints: [
      {
        position: [15, 1.0, 45],
        dwellTimeSeconds: 6,
        idleAction: 'look_around',
        barkText: 'Gold talks, everyone else walks. Let us see who approaches.',
      },
      {
        position: [22, 1.1, 55],
        dwellTimeSeconds: 4,
        idleAction: 'inspect',
        barkText: 'These silk bolts survived the river crossing intact.',
      },
      {
        position: [8, 0.9, 38],
        dwellTimeSeconds: 5,
        idleAction: 'work',
        barkText: 'Counting out the day’s coin... A modest haul.',
      },
    ],
    ambientBarks: [
      'Gold talks, everyone else walks. What do you need today?',
      'Border guards look the other way if you know which palm to grease.',
      'Heard the Southern King is amassing catapults near the sandstone quarry.',
      'Good rumors don’t come cheap, friend. But they will save your skin.',
      'The river shallows are wadeable if Sir Gareth is looking the other way.',
    ],
    quickChoices: [
      {
        id: 'rumors_south',
        label: 'Ask about southern rumors',
        prompt: 'What rumors have you heard from the Southern court recently?',
      },
      {
        id: 'gold_tips',
        label: 'Ask about gold nodes',
        prompt: 'Where are the richest unharvested gold veins in the frontier?',
      },
      {
        id: 'cross_border',
        label: 'Smuggling and safe passage',
        prompt: 'How do you bypass the bridge checkpoints and guards unnoticed?',
      },
      {
        id: 'trade_goods',
        label: 'Inquire about rare goods',
        prompt: 'What rare building materials or treasures do you carry for trade?',
      },
    ],
    defaultDialogue:
      'Well met, traveler! Rare spices, tempered steel, or spicy rumors—Zara’s pack has whatever your coin can afford. Looking to trade, or just eavesdropping?',
  },
};

/**
 * Returns all NPC character profiles
 */
export function getAllNPCProfiles(): NPCProfile[] {
  return Object.values(NPC_PROFILES);
}

/**
 * Find an NPC profile by ID
 */
export function getNPCProfileById(id: string): NPCProfile | undefined {
  return NPC_PROFILES[id as NPCId];
}

/**
 * Find NPC profiles by kingdom
 */
export function getNPCProfilesByKingdom(kingdom: 'North' | 'South' | 'Neutral'): NPCProfile[] {
  return getAllNPCProfiles().filter((npc) => npc.kingdom === kingdom);
}
