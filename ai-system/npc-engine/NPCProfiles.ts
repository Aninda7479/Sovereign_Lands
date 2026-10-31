/**
 * Sovereign Lands - NPC Character Profiles & Lore Data
 * Defines rich personalities, waypoint routes, ambient voice barks, and dialogue choices
 * for living open-world 3D entities roaming the sandbox.
 */

export type NPCId =
  | 'aldric'
  | 'gareth'
  | 'merin'
  | 'zara'
  | 'eleanor'
  | 'torvald'
  | 'lyra'
  | 'cedric'
  | 'beatrice'
  | 'kaelen';

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

  eleanor: {
    id: 'eleanor',
    name: 'Lady Eleanor',
    title: 'The Royal Botanist',
    role: 'Park Overseer & Herbalist',
    kingdom: 'North',
    faction: 'neutral',
    meshType: 'character',
    personality:
      'Gentle, poetic noblewoman who tends the Sovereign Public Park. Fascinated by mountain flora, rare blossom trees, and medicinal herbs. Believes the beauty of the gardens can bring peace to war-torn lands.',
    portraitColor: 'from-emerald-700 to-teal-900',
    spawnPosition: [34, 1.2, -42],
    patrolSpeed: 1.1,
    waypoints: [
      {
        position: [34, 1.2, -42],
        dwellTimeSeconds: 5,
        idleAction: 'inspect',
        barkText: 'The pink cherry blossoms are thriving despite the northern breeze.',
      },
      {
        position: [40, 1.2, -48],
        dwellTimeSeconds: 6,
        idleAction: 'work',
        barkText: 'Tending the lavender beds brings peace to this troubled frontier.',
      },
      {
        position: [28, 1.2, -48],
        dwellTimeSeconds: 4,
        idleAction: 'look_around',
        barkText: 'Listen to the fountain waters... A momentary respite from politics.',
      },
      {
        position: [34, 1.2, -54],
        dwellTimeSeconds: 5,
        idleAction: 'inspect',
        barkText: 'These red rosebuds need pruning before the full moon.',
      },
    ],
    ambientBarks: [
      'Take a seat on the benches, wanderer. Rest your weary bones.',
      'Even in a realm divided by war, flowers bloom without borders.',
      'The marble fountain was carved during the Golden Commonwealth era.',
      'I harvested fresh lavender for travelers suffering sleepless nights.',
      'Mind you do not trample the flower beds on your rush to the Citadel.',
    ],
    quickChoices: [
      {
        id: 'park_history',
        label: 'Ask about the Sovereign Park',
        prompt: 'Tell me the history of this beautiful park and marble fountain.',
      },
      {
        id: 'herbs',
        label: 'Inquire about medicinal herbs',
        prompt: 'What medicinal flowers or herbs do you cultivate here?',
      },
      {
        id: 'fountain_waters',
        label: 'Ask about the fountain waters',
        prompt: 'Do the waters of this royal fountain possess rejuvenating properties?',
      },
      {
        id: 'peace',
        label: 'Discuss the kingdom war',
        prompt: 'How can peace be restored between the North and South?',
      },
    ],
    defaultDialogue:
      'Welcome to the Sovereign Gardens, traveler. Pause your march, sit by the marble fountain, and breathe in the scent of blooming lavender. What brings you to this sanctuary?',
  },

  torvald: {
    id: 'torvald',
    name: 'Torvald',
    title: 'The Master Blacksmith',
    role: 'Weaponsmith & Armor Crafter',
    kingdom: 'North',
    faction: 'north',
    meshType: 'npc_farmer',
    personality:
      'Gruff, robust craftsman whose hammer rings from dawn to midnight. Passionate about folded steel, horseshoeing, and fortress iron fittings. Values hard work and honest trades.',
    portraitColor: 'from-orange-800 to-zinc-900',
    spawnPosition: [-22, 1.2, -120],
    patrolSpeed: 1.2,
    waypoints: [
      {
        position: [-22, 1.2, -120],
        dwellTimeSeconds: 7,
        idleAction: 'work',
        barkText: 'Hammer and anvil, heat and oil... The only honest life.',
      },
      {
        position: [-26, 1.2, -124],
        dwellTimeSeconds: 5,
        idleAction: 'warm_hands',
        barkText: 'Need more charcoal from the woodcutter before dusk.',
      },
      {
        position: [-18, 1.2, -118],
        dwellTimeSeconds: 4,
        idleAction: 'inspect',
        barkText: 'Inspecting these newly tempered iron wall braces.',
      },
    ],
    ambientBarks: [
      'Good steel speaks louder than silver tongues when sieges come!',
      'Watch your step near the furnace; sparks fly hot in here.',
      'If you need horseshoes or curtain wall bolts, you come to Torvald.',
      'Southern steel is too brittle for these freezing rocky passes.',
      'Clang, clang! Another blade quenched for the garrison.',
    ],
    quickChoices: [
      {
        id: 'forge_weapons',
        label: 'Ask about weapons and armor',
        prompt: 'What weapons and armor are you forging for the garrison?',
      },
      {
        id: 'building_materials',
        label: 'Inquire about building ironwork',
        prompt: 'Can you provide iron braces and nails for my new houses and watchtowers?',
      },
      {
        id: 'steel_secrets',
        label: 'Ask about northern steel',
        prompt: 'What makes northern forged steel so durable against sieges?',
      },
      {
        id: 'iron_ore',
        label: 'Inquire about iron mines',
        prompt: 'Where can an adventurer mine high-grade iron ore in the mountains?',
      },
    ],
    defaultDialogue:
      'Hah! Step away from the slag heap if you value your boots. Torvald’s the name, forging the finest steel between here and the Frost Ridge. Need an axe sharpened or iron fittings for your parcel?',
  },

  lyra: {
    id: 'lyra',
    name: 'Lyra',
    title: 'The Wandering Minstrel',
    role: 'Bard & Balladeer',
    kingdom: 'Neutral',
    faction: 'neutral',
    meshType: 'character',
    personality:
      'Charming, flamboyant storyteller and singer who performs in village squares and taverns. Knows old songs of forgotten kings, dragon lore, and spicy gossip from both kingdoms.',
    portraitColor: 'from-rose-700 to-purple-800',
    spawnPosition: [-46, 1.2, -94],
    patrolSpeed: 1.3,
    waypoints: [
      {
        position: [-46, 1.2, -94],
        dwellTimeSeconds: 6,
        idleAction: 'look_around',
        barkText: 'La-la-loo... A tune for the brave, a ballad for the broken.',
      },
      {
        position: [-52, 1.2, -102],
        dwellTimeSeconds: 5,
        idleAction: 'inspect',
        barkText: 'Tuning the strings beside the fountain basin...',
      },
      {
        position: [-42, 1.2, -88],
        dwellTimeSeconds: 4,
        idleAction: 'look_around',
        barkText: 'Ah, travelers gather! Time for the Ballad of the Great Divide.',
      },
    ],
    ambientBarks: [
      'Sing of kings and sing of knaves, all shall rest in equal graves!',
      'Got a shiny coin for a song that will stir your heroic heart?',
      'Did you hear the tale of the phantom knight on the river bridge?',
      'The tavern ale is sour today, but my lyrics are as sweet as honey.',
      'Every hero needs a bard to chronicle their deeds in verse!',
    ],
    quickChoices: [
      {
        id: 'sing_ballad',
        label: 'Request a ballad of the realm',
        prompt: 'Sing me a ballad about the creation of the Sovereign Lands.',
      },
      {
        id: 'gossip_taverns',
        label: 'Ask about tavern gossip',
        prompt: 'What spicy rumors and gossip have you overheard in the taverns?',
      },
      {
        id: 'ancient_legends',
        label: 'Inquire about ancient legends',
        prompt: 'Are there forgotten treasures or magical secrets hidden in the mountains?',
      },
      {
        id: 'tip_coin',
        label: 'Toss a gold coin to the bard',
        prompt: 'Here is a gold coin for your melodies, minstrel.',
      },
    ],
    defaultDialogue:
      'Greetings, noble champion! Lyra at your service, collector of rhymes and teller of grand adventures. Shall I weave you a song of heroic triumph or whisper secrets overheard in the shadows?',
  },

  cedric: {
    id: 'cedric',
    name: 'Cedric',
    title: 'The Guild Merchant',
    role: 'Market Trader & Caravan Master',
    kingdom: 'North',
    faction: 'north',
    meshType: 'npc_farmer',
    personality:
      'Calculating, charismatic merchant who manages the village marketplace. Always looking for profitable trade routes, rare gemstones, and frontier commodities.',
    portraitColor: 'from-amber-600 to-yellow-900',
    spawnPosition: [-56, 1.2, -114],
    patrolSpeed: 1.2,
    waypoints: [
      {
        position: [-56, 1.2, -114],
        dwellTimeSeconds: 6,
        idleAction: 'work',
        barkText: 'Checking the inventory crates: fine fabrics, dried meats, salt.',
      },
      {
        position: [-62, 1.2, -110],
        dwellTimeSeconds: 5,
        idleAction: 'inspect',
        barkText: 'Gold exchange rates fluctuate with every parcel claimed.',
      },
      {
        position: [-50, 1.2, -118],
        dwellTimeSeconds: 4,
        idleAction: 'look_around',
        barkText: 'A good merchant never misses an approaching customer.',
      },
    ],
    ambientBarks: [
      'Finest wares in the northern territory! Inspect the goods yourself.',
      'Buy low, sell high, and always keep an eye on the bridge guards.',
      'Caravan just arrived from the eastern valley with rare building timber.',
      'A coin well spent today yields three tomorrow in Sovereign Lands.',
      'Interested in trading rare architectural blueprints for your estate?',
    ],
    quickChoices: [
      {
        id: 'trade_wares',
        label: 'Inspect trade catalog',
        prompt: 'What goods and materials do you currently have for sale?',
      },
      {
        id: 'market_trends',
        label: 'Ask about market economics',
        prompt: 'How is the market economy and gold generation behaving across parcels?',
      },
      {
        id: 'caravan_routes',
        label: 'Inquire about caravan routes',
        prompt: 'Are trade caravan routes safe through the mountain passes?',
      },
      {
        id: 'invest_parcels',
        label: 'Advice on parcel investments',
        prompt: 'Which parcel locations yield the best commercial return for merchants?',
      },
    ],
    defaultDialogue:
      'Ah, a patron of taste! Cedric’s marketplace has supplied kings, builders, and lone wanderers for twenty seasons. Looking to furnish your estate or invest your hard-won gold?',
  },

  beatrice: {
    id: 'beatrice',
    name: 'Sister Beatrice',
    title: 'The Sanctuary Healer',
    role: 'Priestess & Apothecary',
    kingdom: 'North',
    faction: 'neutral',
    meshType: 'npc_advisor',
    personality:
      'Serene, compassionate priestess tending the mountain shrine and herbal dispensary. Cares for wounded soldiers and weary pioneers without regard to faction or banner.',
    portraitColor: 'from-sky-800 to-indigo-950',
    spawnPosition: [-80, 1.4, -132],
    patrolSpeed: 1.1,
    waypoints: [
      {
        position: [-80, 1.4, -132],
        dwellTimeSeconds: 6,
        idleAction: 'inspect',
        barkText: 'Lighting the sacred incense candles for fallen warriors.',
      },
      {
        position: [-86, 1.4, -136],
        dwellTimeSeconds: 5,
        idleAction: 'work',
        barkText: 'Crushing mountain roots for healing poultices.',
      },
      {
        position: [-74, 1.4, -128],
        dwellTimeSeconds: 5,
        idleAction: 'warm_hands',
        barkText: 'May the light guide those traversing the frozen peaks.',
      },
    ],
    ambientBarks: [
      'May the peace of the realm shelter you on your journeys.',
      'Bring your wounded here; all are welcomed beneath the sanctuary roof.',
      'The mountain snows wash clean the blood of yesterday’s battles.',
      'Drink from the spring waters and cleanse your spirit.',
      'Faith and courage are armor no sword can pierce.',
    ],
    quickChoices: [
      {
        id: 'healing_blessing',
        label: 'Request a sacred blessing',
        prompt: 'Bestow upon me your blessing before I venture into danger.',
      },
      {
        id: 'sanctuary_history',
        label: 'Ask about the mountain shrine',
        prompt: 'What deity or sovereign history is honored at this mountain shrine?',
      },
      {
        id: 'healing_remedies',
        label: 'Inquire about herbal remedies',
        prompt: 'What remedies do you prepare for the wounded soldiers of the border?',
      },
      {
        id: 'divine_guidance',
        label: 'Seek wisdom on realm strife',
        prompt: 'What guidance does the sanctuary offer on this endless border war?',
      },
    ],
    defaultDialogue:
      'Peace be with you, child of the frontier. Whether your wounds be of steel or sorrow, the sanctuary doors remain open. How may I aid your spirit this day?',
  },

  kaelen: {
    id: 'kaelen',
    name: 'Kaelen',
    title: 'The Mountain Ranger',
    role: 'Frontier Scout & Pathfinder',
    kingdom: 'North',
    faction: 'north',
    meshType: 'npc_knight',
    personality:
      'Sharp-eyed, stealthy scout who tracks movement across the northern crags and perimeter mountain ranges. Knows every mountain pass, predator den, and hidden trail.',
    portraitColor: 'from-slate-800 to-stone-900',
    spawnPosition: [-112, 1.8, -62],
    patrolSpeed: 1.6,
    waypoints: [
      {
        position: [-112, 1.8, -62],
        dwellTimeSeconds: 5,
        idleAction: 'look_around',
        barkText: 'Tracks in the snow... A wolf pack circled the western ridge.',
      },
      {
        position: [-120, 1.9, -70],
        dwellTimeSeconds: 4,
        idleAction: 'inspect',
        barkText: 'The pine pass is clear. No southern scouts spotted.',
      },
      {
        position: [-105, 1.7, -54],
        dwellTimeSeconds: 5,
        idleAction: 'look_around',
        barkText: 'Scanning the river approaches from this elevated vantage.',
      },
    ],
    ambientBarks: [
      'Keep quiet in the pine valleys; sound carries far in cold air.',
      'Wolves prowl the western ridges. Keep your torches lit at night.',
      'The mountain passes are treacherous for those without seasoned boots.',
      'I scouted the perimeter mountains. The boundary stands firm.',
      'Trust your instincts, pioneer. The frontier does not forgive mistakes.',
    ],
    quickChoices: [
      {
        id: 'scout_report',
        label: 'Ask for frontier scout report',
        prompt: 'What threats or movements have you spotted in the mountain passes?',
      },
      {
        id: 'mountain_paths',
        label: 'Inquire about hidden trails',
        prompt: 'Are there hidden mountain trails that flank the river divide?',
      },
      {
        id: 'wildlife_dangers',
        label: 'Ask about mountain beasts',
        prompt: 'What dangerous wildlife inhabits the outer mountain foothills?',
      },
      {
        id: 'survival_tips',
        label: 'Request frontier survival advice',
        prompt: 'What advice do you have for surviving the harsh northern wilderness?',
      },
    ],
    defaultDialogue:
      'Halt. Step softly, friend. Kaelen of the Frontier Rangers. I watch the mountain trails and perimeter ridges so the settlements below can sleep soundly. What brings you into the highlands?',
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
