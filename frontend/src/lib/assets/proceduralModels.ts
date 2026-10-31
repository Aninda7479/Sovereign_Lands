import * as THREE from 'three';

/**
 * Sovereign Lands - Procedural 3D Model Factory
 * High-performance, zero-network-lag low-poly medieval fantasy meshes.
 * Optimized for 60 FPS WebGL rendering with baked material palettes and articulated joints.
 */

export type Faction = 'north' | 'south' | 'neutral';
export type BoundaryPillarType = 'north' | 'south' | 'player' | 'unclaimed';

// =============================================================================
//                             COLOR PALETTES
// =============================================================================

export const PALETTE = {
  // North Kingdom (Boreal) - Frozen peaks, slate, iron, ice
  north: {
    primary: 0x1e293b,     // Slate Navy
    secondary: 0x334155,   // Dark Slate
    accent: 0x38bdf8,      // Frost Cyan
    emissive: 0x0284c7,    // Glowing Ice Blue
    roof: 0x0f172a,        // Midnight Slate
    trim: 0x94a3b8,        // Iron Silver
  },
  // South Kingdom (Solara) - Sunlit plains, sandstone, terracotta, crimson
  south: {
    primary: 0x991b1b,     // Imperial Crimson
    secondary: 0xb45309,   // Warm Terracotta
    accent: 0xf59e0b,      // Solar Amber
    emissive: 0xd97706,    // Golden Sun
    roof: 0x7c2d12,        // Terracotta Tile
    trim: 0xfcd34d,        // Gilded Gold
  },
  // Universal Natural Materials
  wood: {
    dark: 0x3e2723,
    medium: 0x5d4037,
    light: 0x8d6e63,
    thatch: 0xd4a373,
  },
  stone: {
    dark: 0x334155,
    medium: 0x64748b,
    light: 0x94a3b8,
    moss: 0x475569,
  },
  metal: {
    iron: 0x475569,
    steel: 0x94a3b8,
    gold: 0xf59e0b,
    bronze: 0xb45309,
  },
  foliage: {
    pine: 0x14532d,
    oak: 0x15803d,
    grass: 0x4ade80,
    wheat: 0xfacc15,
    soil: 0x422006,
  },
  hero: {
    skin: 0xf8d7da,
    hair: 0x78350f,
    tunic: 0x2563eb,
    trousers: 0x1e293b,
    leather: 0x78350f,
  }
};

// =============================================================================
//                             HELPER UTILS
// =============================================================================

function createMat(color: number, roughness = 0.8, metalness = 0.1, emissive = 0x000000): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    flatShading: true,
  });
}

function enableShadows(obj: THREE.Object3D) {
  obj.castShadow = true;
  obj.receiveShadow = true;
  obj.children.forEach(enableShadows);
}

// =============================================================================
//                         1. CHARACTER MESHES
// =============================================================================

export interface CharacterJoints {
  head: THREE.Object3D;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  sheath: THREE.Object3D;
}

/**
 * Creates the stylized third-person medieval hero character.
 * Structured with articulated joints for animation (walk, run, sprint, jump, attack).
 */
export function createCharacterMesh(options: { faction?: Faction; isPlayer?: boolean } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = options.isPlayer ? 'PlayerHero' : 'Character';

  const faction = options.faction || 'north';
  const factionColors = faction === 'north' ? PALETTE.north : PALETTE.south;

  // Materials
  const skinMat = createMat(PALETTE.hero.skin, 0.9, 0.0);
  const hairMat = createMat(PALETTE.hero.hair, 0.8, 0.1);
  const tunicMat = createMat(options.isPlayer ? 0x2563eb : factionColors.primary, 0.7, 0.2);
  const leatherMat = createMat(PALETTE.hero.leather, 0.8, 0.1);
  const pantsMat = createMat(PALETTE.hero.trousers, 0.8, 0.1);
  const bootMat = createMat(0x0f172a, 0.8, 0.1);
  const steelMat = createMat(PALETTE.metal.steel, 0.3, 0.8);
  const goldMat = createMat(PALETTE.metal.gold, 0.4, 0.7);

  // Torso / Chest (Pivot at waist: 0, 0.9, 0)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.9, 0);

  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), tunicMat);
  chestMesh.position.set(0, 0.3, 0);
  torsoGroup.add(chestMesh);

  // Belt & Gold Buckle
  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), leatherMat);
  beltMesh.position.set(0, 0.05, 0);
  torsoGroup.add(beltMesh);

  const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.34), goldMat);
  buckleMesh.position.set(0, 0.05, 0);
  torsoGroup.add(buckleMesh);

  // Head (Pivot at neck: 0, 0.6, 0 inside torsoGroup)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), skinMat);
  headMesh.position.set(0, 0.16, 0);
  headGroup.add(headMesh);

  // Hair / Hood
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), hairMat);
  hairMesh.position.set(0, 0.28, 0);
  headGroup.add(hairMesh);

  // Medieval Circlet / Headband
  const circletMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.32), goldMat);
  circletMesh.position.set(0, 0.24, 0);
  headGroup.add(circletMesh);

  torsoGroup.add(headGroup);

  // Back-Mounted Sheath & Sword
  const sheathGroup = new THREE.Group();
  sheathGroup.position.set(0.1, 0.35, -0.2);
  sheathGroup.rotation.z = -0.35;
  sheathGroup.rotation.y = 0.1;

  const scabbardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.04), leatherMat);
  sheathGroup.add(scabbardMesh);

  const hiltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), goldMat);
  hiltMesh.position.set(0, 0.38, 0);
  sheathGroup.add(hiltMesh);

  const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.04), steelMat);
  gripMesh.position.set(0, 0.48, 0);
  sheathGroup.add(gripMesh);

  torsoGroup.add(sheathGroup);

  // Left Arm (Pivot at left shoulder: -0.32, 0.55, 0)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.33, 0.55, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), tunicMat);
  leftArmMesh.position.set(0, -0.22, 0);
  leftArmGroup.add(leftArmMesh);
  torsoGroup.add(leftArmGroup);

  // Right Arm (Pivot at right shoulder: 0.33, 0.55, 0)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.33, 0.55, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), tunicMat);
  rightArmMesh.position.set(0, -0.22, 0);
  rightArmGroup.add(rightArmMesh);
  torsoGroup.add(rightArmGroup);

  group.add(torsoGroup);

  // Left Leg (Pivot at left hip: -0.15, 0.9, 0)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.15, 0.9, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
  leftLegMesh.position.set(0, -0.25, 0);
  leftLegGroup.add(leftLegMesh);

  const leftBootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.25), bootMat);
  leftBootMesh.position.set(0, -0.7, 0.03);
  leftLegGroup.add(leftBootMesh);
  group.add(leftLegGroup);

  // Right Leg (Pivot at right hip: 0.15, 0.9, 0)
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.15, 0.9, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
  rightLegMesh.position.set(0, -0.25, 0);
  rightLegGroup.add(rightLegMesh);

  const rightBootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.25), bootMat);
  rightBootMesh.position.set(0, -0.7, 0.03);
  rightLegGroup.add(rightBootMesh);
  group.add(rightLegGroup);

  enableShadows(group);

  // Store joints on userData for procedural animation controller
  const joints: CharacterJoints = {
    head: headGroup,
    torso: torsoGroup,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    sheath: sheathGroup,
  };
  group.userData.joints = joints;

  return group;
}

/**
 * Creates an NPC Farmer with straw hat, rustic tunic, and wooden hoe.
 */
export function createNPCFarmerMesh(): THREE.Group {
  const group = createCharacterMesh({ faction: 'neutral' });
  group.name = 'NPC_Farmer';

  const strawMat = createMat(PALETTE.wood.thatch, 0.9, 0.0);
  const woodMat = createMat(PALETTE.wood.medium, 0.8, 0.1);
  const ironMat = createMat(PALETTE.metal.iron, 0.4, 0.6);

  const joints: CharacterJoints = group.userData.joints;

  // Straw Hat on head
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 10), strawMat);
  hatBrim.position.set(0, 0.32, 0);
  joints.head.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 8), strawMat);
  hatCrown.position.set(0, 0.46, 0);
  joints.head.add(hatCrown);

  // Wooden Hoe in right hand
  const hoeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), woodMat);
  hoeHandle.position.set(0.15, -0.3, 0.2);
  hoeHandle.rotation.x = 0.5;

  const hoeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.02), ironMat);
  hoeBlade.position.set(0, 0.7, 0.05);
  hoeBlade.rotation.x = -1.2;
  hoeHandle.add(hoeBlade);

  joints.rightArm.add(hoeHandle);

  return group;
}

/**
 * Creates an NPC Royal Knight with full plate armor, horned helmet, shield, and longsword.
 */
export function createNPCKnightMesh(faction: Faction = 'north'): THREE.Group {
  const group = createCharacterMesh({ faction });
  group.name = `NPC_Knight_${faction}`;

  const armorMat = createMat(PALETTE.metal.steel, 0.3, 0.85);
  const goldMat = createMat(PALETTE.metal.gold, 0.3, 0.8);
  const factionMat = createMat(faction === 'north' ? PALETTE.north.primary : PALETTE.south.primary, 0.5, 0.3);

  const joints: CharacterJoints = group.userData.joints;

  // Great Helm
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), armorMat);
  helm.position.set(0, 0.18, 0);

  // Visor Slit
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.38), createMat(0x0a0a0a, 0.9, 0.1));
  visor.position.set(0, 0.18, 0);
  helm.add(visor);

  // Helmet Horns / Wings
  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 5), goldMat);
  leftHorn.position.set(-0.2, 0.25, 0);
  leftHorn.rotation.z = 0.5;
  helm.add(leftHorn);

  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 5), goldMat);
  rightHorn.position.set(0.2, 0.25, 0);
  rightHorn.rotation.z = -0.5;
  helm.add(rightHorn);

  joints.head.add(helm);

  // Tower Kite Shield on left arm
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.15, -0.2, 0.15);
  shieldGroup.rotation.y = 0.5;

  const shieldBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.05), factionMat);
  shieldGroup.add(shieldBody);

  const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldMat);
  shieldBoss.position.set(0, 0.1, 0.04);
  shieldGroup.add(shieldBoss);

  joints.leftArm.add(shieldGroup);

  // Longsword in right hand
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0, -0.45, 0.2);
  swordGroup.rotation.x = 0.8;

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.02), armorMat);
  blade.position.set(0, 0.45, 0);
  swordGroup.add(blade);

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), goldMat);
  crossguard.position.set(0, 0.02, 0);
  swordGroup.add(crossguard);

  joints.rightArm.add(swordGroup);

  return group;
}

/**
 * Creates an NPC Citadel Advisor with robes, deep cowl, and ancient scroll.
 */
export function createNPCAdvisorMesh(faction: Faction = 'north'): THREE.Group {
  const group = createCharacterMesh({ faction });
  group.name = 'NPC_Advisor';

  const robeMat = createMat(0x312e81, 0.8, 0.1); // Indigo / arcane robe
  const cowlMat = createMat(0x1e1b4b, 0.9, 0.0);
  const parchmentMat = createMat(0xfef08a, 0.8, 0.0);
  const waxMat = createMat(0xdc2626, 0.5, 0.2);

  const joints: CharacterJoints = group.userData.joints;

  // Flowing Robe Skirt covering legs
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.9, 8), robeMat);
  skirt.position.set(0, 0.45, 0);
  group.add(skirt);

  // Deep Hood / Cowl
  const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), cowlMat);
  cowl.position.set(0, 0.2, -0.05);
  joints.head.add(cowl);

  // Ancient Scroll in hand
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), parchmentMat);
  scroll.rotation.z = Math.PI / 2;
  scroll.position.set(0, -0.4, 0.15);

  const waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 6), waxMat);
  waxSeal.position.set(0, 0.04, 0);
  scroll.add(waxSeal);

  joints.rightArm.add(scroll);

  return group;
}

// =============================================================================
//                         2. STRUCTURE MODELS
// =============================================================================

/**
 * Creates the Farmstead structure:
 * Thatched cottage, wooden split-rail fencing, tilled loam soil beds with wheat, and a rotating windmill.
 */
export function createFarmsteadModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FarmsteadModel';

  const stoneMat = createMat(PALETTE.stone.medium, 0.85, 0.1);
  const woodMat = createMat(PALETTE.wood.medium, 0.8, 0.05);
  const thatchMat = createMat(PALETTE.wood.thatch, 0.9, 0.0);
  const soilMat = createMat(PALETTE.foliage.soil, 0.95, 0.0);
  const wheatMat = createMat(PALETTE.foliage.wheat, 0.7, 0.1);
  const sailMat = createMat(0xf8fafc, 0.9, 0.0);

  // Base Plot Ground Pad (16m x 16m)
  const pad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), soilMat);
  pad.position.set(0, 0.1, 0);
  group.add(pad);

  // Main Cottage (6m x 4m x 3.5m)
  const cottage = new THREE.Group();
  cottage.position.set(-3, 0, -2);

  const cottageBase = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4.5), stoneMat);
  cottageBase.position.set(0, 1.5, 0);
  cottage.add(cottageBase);

  // Wooden Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), woodMat);
  door.position.set(0, 1.1, 2.3);
  cottage.add(door);

  // Cottage Thatched Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.6, 4), thatchMat);
  roof.position.set(0, 4.3, 0);
  roof.rotation.y = Math.PI / 4;
  cottage.add(roof);

  // Stone Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), stoneMat);
  chimney.position.set(2, 3.2, 1.2);
  cottage.add(chimney);

  group.add(cottage);

  // Tilled Soil Bed with Wheat Stalks (Right side: +4, 0, -1)
  const field = new THREE.Group();
  field.position.set(4, 0.2, -1);

  const fieldBed = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 7.5), createMat(0x3e2723, 0.95, 0.0));
  field.add(fieldBed);

  for (let x = -2; x <= 2; x += 1.0) {
    for (let z = -3; z <= 3; z += 1.0) {
      const wheat = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7 + (Math.sin(x + z) * 0.15), 4), wheatMat);
      wheat.position.set(x, 0.45, z);
      field.add(wheat);
    }
  }
  group.add(field);

  // Windmill Tower (Rear corner: +4, 0, 4)
  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(4, 0, 4.5);

  const windmillTower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 7.5, 8), stoneMat);
  windmillTower.position.set(0, 3.75, 0);
  windmillGroup.add(windmillTower);

  const windmillCap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 8), thatchMat);
  windmillCap.position.set(0, 8.4, 0);
  windmillGroup.add(windmillCap);

  // Rotor Hub & 4 Sails
  const rotorHub = new THREE.Group();
  rotorHub.position.set(0, 7.2, 1.5);
  rotorHub.name = 'WindmillRotor';

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8), woodMat);
  axle.rotation.x = Math.PI / 2;
  rotorHub.add(axle);

  for (let i = 0; i < 4; i++) {
    const sailArm = new THREE.Group();
    sailArm.rotation.z = (Math.PI / 2) * i;

    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), woodMat);
    spar.position.set(0, 2.1, 0);
    sailArm.add(spar);

    const canvasSail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.6, 0.02), sailMat);
    canvasSail.position.set(0.4, 2.1, 0.05);
    sailArm.add(canvasSail);

    rotorHub.add(sailArm);
  }
  windmillGroup.add(rotorHub);
  group.add(windmillGroup);

  // Wooden Fences along perimeter
  const fenceMat = woodMat;
  const fenceSegments = [
    { x: -7, z: 0, rot: 0, len: 14 },
    { x: 0, z: -7, rot: Math.PI / 2, len: 14 },
    { x: 0, z: 7, rot: Math.PI / 2, len: 14 },
  ];
  fenceSegments.forEach(seg => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(seg.len, 0.15, 0.1), fenceMat);
    rail.position.set(seg.x, 0.8, seg.z);
    rail.rotation.y = seg.rot;
    group.add(rail);

    const lowerRail = rail.clone();
    lowerRail.position.y = 0.4;
    group.add(lowerRail);
  });

  enableShadows(group);
  group.userData.windmillRotor = rotorHub;

  return group;
}

/**
 * Creates the Guard Tower structure:
 * Multi-tiered stone watchtower (14m) with battlements, arrow slits, ladder, and a flaming torch brazier.
 */
export function createGuardTowerModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GuardTowerModel';

  const faction = options.faction || 'north';
  const stoneMat = createMat(PALETTE.stone.medium, 0.85, 0.1);
  const darkStoneMat = createMat(PALETTE.stone.dark, 0.9, 0.1);
  const woodMat = createMat(PALETTE.wood.medium, 0.8, 0.1);
  const ironMat = createMat(PALETTE.metal.iron, 0.4, 0.8);
  const bannerMat = createMat(faction === 'north' ? PALETTE.north.primary : PALETTE.south.primary, 0.7, 0.2);

  // Heavy Stone Plinth Base
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 5.2), darkStoneMat);
  basePlinth.position.set(0, 0.6, 0);
  group.add(basePlinth);

  // Main Shaft (11m high, tapered)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.3, 11, 8), stoneMat);
  shaft.position.set(0, 6.7, 0);
  group.add(shaft);

  // Top Overhanging Battlement Platform (width 4.8m)
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.0, 1.2, 8), darkStoneMat);
  platform.position.set(0, 12.8, 0);
  group.add(platform);

  // Crenellations / Parapets (8 merlons around rim)
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.4), darkStoneMat);
    merlon.position.set(Math.sin(angle) * 2.3, 13.85, Math.cos(angle) * 2.3);
    merlon.rotation.y = angle;
    group.add(merlon);
  }

  // Wooden Ladder along back wall
  const ladder = new THREE.Group();
  ladder.position.set(0, 6, -2.1);
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 12, 0.08), woodMat);
  railL.position.set(-0.25, 0, 0);
  const railR = railL.clone();
  railR.position.set(0.25, 0, 0);
  ladder.add(railL, railR);

  for (let y = -5.5; y <= 5.5; y += 0.6) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), woodMat);
    rung.position.set(0, y, 0);
    ladder.add(rung);
  }
  group.add(ladder);

  // Flaming Torch Brazier on Platform Corner
  const brazierGroup = new THREE.Group();
  brazierGroup.position.set(1.4, 13.5, 1.4);

  const brazierTripod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.8, 6), ironMat);
  brazierGroup.add(brazierTripod);

  const brazierBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 0.3, 8), ironMat);
  brazierBowl.position.set(0, 0.4, 0);
  brazierGroup.add(brazierBowl);

  // Flame Mesh with warm emissive light
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.6, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flame.position.set(0, 0.75, 0);
  brazierGroup.add(flame);

  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.4, 6),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  flameCore.position.set(0, 0.7, 0);
  brazierGroup.add(flameCore);

  group.add(brazierGroup);

  // Hanging Kingdom Banner
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), woodMat);
  bannerPole.position.set(0, 11.5, 2.2);
  bannerPole.rotation.z = Math.PI / 2;
  group.add(bannerPole);

  const bannerCloth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.0, 0.04), bannerMat);
  bannerCloth.position.set(0, 9.2, 2.2);
  group.add(bannerCloth);

  enableShadows(group);
  return group;
}

/**
 * Creates the Stone Wall defensive curtain segment:
 * 10m wide x 5m high dressed stone curtain with sentry walkway, buttresses, and crenellations.
 */
export function createStoneWallModel(options: { faction?: Faction; length?: number } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StoneWallModel';

  const wallLength = options.length || 10;
  const stoneMat = createMat(PALETTE.stone.medium, 0.85, 0.1);
  const darkStoneMat = createMat(PALETTE.stone.dark, 0.9, 0.1);
  const woodMat = createMat(PALETTE.wood.medium, 0.8, 0.1);

  // Main Wall Body (length x 4.5m x 2.2m)
  const body = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 4.5, 2.2), stoneMat);
  body.position.set(0, 2.25, 0);
  group.add(body);

  // Top Sentry Walkway Platform
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(wallLength + 0.2, 0.4, 2.6), darkStoneMat);
  walkway.position.set(0, 4.7, 0);
  group.add(walkway);

  // Front Crenellations (Merlons with arrow embrasures)
  const merlonCount = Math.floor(wallLength / 1.8);
  const spacing = wallLength / merlonCount;
  for (let i = 0; i < merlonCount; i++) {
    const x = -wallLength / 2 + (i + 0.5) * spacing;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(spacing * 0.6, 0.9, 0.45), darkStoneMat);
    merlon.position.set(x, 5.35, 1.15);
    group.add(merlon);
  }

  // Rear Handrail
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 0.1, 0.1), woodMat);
  handrail.position.set(0, 5.5, -1.2);
  group.add(handrail);

  for (let x = -wallLength / 2 + 1; x <= wallLength / 2; x += 2.5) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), woodMat);
    post.position.set(x, 5.1, -1.2);
    group.add(post);
  }

  // Reinforcing Stone Buttresses on Front
  for (let x of [-wallLength * 0.35, wallLength * 0.35]) {
    const buttress = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.0, 1.4), darkStoneMat);
    buttress.position.set(x, 2.0, 1.3);
    group.add(buttress);
  }

  enableShadows(group);
  return group;
}

/**
 * Creates the Castle Keep fortress:
 * Majestic fortress with twin gatehouses, portcullis, central grand citadel, battlements, and faction crest.
 */
export function createCastleKeepModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CastleKeepModel';

  const faction = options.faction || 'north';
  const factionColors = faction === 'north' ? PALETTE.north : PALETTE.south;
  const stoneMat = createMat(PALETTE.stone.medium, 0.85, 0.1);
  const darkStoneMat = createMat(PALETTE.stone.dark, 0.9, 0.1);
  const roofMat = createMat(factionColors.roof, 0.8, 0.2);
  const ironMat = createMat(PALETTE.metal.iron, 0.4, 0.8);
  const goldMat = createMat(PALETTE.metal.gold, 0.3, 0.7);
  const bannerMat = createMat(factionColors.primary, 0.6, 0.2);

  // Main Citadel Fortress Base (14m x 14m x 12m)
  const mainCitadel = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 14), stoneMat);
  mainCitadel.position.set(0, 6, 0);
  group.add(mainCitadel);

  // Upper Central Keep (8m x 8m x 6m)
  const upperKeep = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), darkStoneMat);
  upperKeep.position.set(0, 15, 0);
  group.add(upperKeep);

  // Four Corner Citadel Turrets (4m x 4m x 14m)
  const turretOffsets = [
    [-6.5, -6.5],
    [6.5, -6.5],
    [-6.5, 6.5],
    [6.5, 6.5],
  ];
  turretOffsets.forEach(([tx, tz]) => {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 14, 8), darkStoneMat);
    turret.position.set(tx, 7, tz);
    group.add(turret);

    // Conical Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.5, 8), roofMat);
    roof.position.set(tx, 15.75, tz);
    group.add(roof);

    // Gold Finial on roof peak
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), goldMat);
    finial.position.set(tx, 17.6, tz);
    group.add(finial);
  });

  // Twin Front Gatehouses flanking arched entrance (+Z face)
  const leftGate = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 9, 8), darkStoneMat);
  leftGate.position.set(-2.8, 4.5, 7.5);
  const rightGate = leftGate.clone();
  rightGate.position.set(2.8, 4.5, 7.5);
  group.add(leftGate, rightGate);

  // Portcullis Iron Gate (Arched entryway)
  const archWay = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 1.0), createMat(0x0f172a, 0.95, 0.0));
  archWay.position.set(0, 2.25, 7.1);
  group.add(archWay);

  const portcullis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 0.1), ironMat);
  portcullis.position.set(0, 2.5, 7.2);
  group.add(portcullis);

  // Giant Royal War Banner hanging above gatehouse
  const banner = new THREE.Mesh(new THREE.BoxGeometry(3.0, 7.0, 0.08), bannerMat);
  banner.position.set(0, 9.5, 7.2);
  group.add(banner);

  const bannerEmblem = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), goldMat);
  bannerEmblem.position.set(0, 10.5, 7.28);
  group.add(bannerEmblem);

  // Upper Keep Battlements
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.4), darkStoneMat);
    m.position.set(Math.sin(angle) * 3.8, 18.4, Math.cos(angle) * 3.8);
    m.rotation.y = angle;
    group.add(m);
  }

  enableShadows(group);
  return group;
}

// =============================================================================
//                      3. PARCEL BOUNDARY PILLARS
// =============================================================================

/**
 * Creates the glowing boundary pillar marking continuous 3D parcel corners.
 * Color-coded: Blue (North), Red (South), Gold (Player-owned), Faint White (Unclaimed).
 */
export function createBoundaryPillarModel(type: BoundaryPillarType = 'north', height = 3.5): THREE.Group {
  const group = new THREE.Group();
  group.name = `BoundaryPillar_${type}`;

  let glowColor = PALETTE.north.accent;
  let emissiveHex = PALETTE.north.emissive;

  if (type === 'south') {
    glowColor = PALETTE.south.primary;
    emissiveHex = PALETTE.south.emissive;
  } else if (type === 'player') {
    glowColor = 0xfacc15; // Golden Beacon
    emissiveHex = 0xeab308;
  } else if (type === 'unclaimed') {
    glowColor = 0xe2e8f0; // Faint White
    emissiveHex = 0x94a3b8;
  }

  const stoneMat = createMat(PALETTE.stone.dark, 0.9, 0.1);
  const runeMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: emissiveHex,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Stepped Stone Pedestal
  const baseStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), stoneMat);
  baseStep1.position.set(0, 0.15, 0);
  group.add(baseStep1);

  const baseStep2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), stoneMat);
  baseStep2.position.set(0, 0.45, 0);
  group.add(baseStep2);

  // Main Obelisk Shaft (Tapered 4-sided stone column)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, height, 4), stoneMat);
  shaft.position.set(0, 0.6 + height / 2, 0);
  shaft.rotation.y = Math.PI / 4;
  group.add(shaft);

  // Glowing Inlaid Runes (4 inset vertical strips on each face)
  for (let r = 0; r < 4; r++) {
    const rot = (Math.PI / 2) * r;
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.06, height * 0.7, 0.04), runeMat);
    rune.position.set(Math.sin(rot) * 0.22, 0.6 + height / 2, Math.cos(rot) * 0.22);
    rune.rotation.y = rot;
    group.add(rune);
  }

  // Floating Mystical Beacon Crystal above pillar
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), runeMat);
  crystal.position.set(0, height + 1.2, 0);
  crystal.name = 'BeaconCrystal';
  group.add(crystal);

  enableShadows(group);
  return group;
}

// =============================================================================
//                        4. ENVIRONMENT PROPS
// =============================================================================

/**
 * Creates low-poly medieval trees: Pine (North) or Oak (South).
 */
export function createTreeModel(type: 'pine' | 'oak' = 'pine'): THREE.Group {
  const group = new THREE.Group();
  group.name = `Tree_${type}`;

  const trunkMat = createMat(PALETTE.wood.dark, 0.9, 0.0);

  if (type === 'pine') {
    // Pine Tree: Dark brown trunk + 3 stacked cones
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6), trunkMat);
    trunk.position.set(0, 2.25, 0);
    group.add(trunk);

    const foliageMat = createMat(PALETTE.foliage.pine, 0.85, 0.0);
    const tierSizes = [
      { r: 2.2, h: 2.5, y: 3.5 },
      { r: 1.7, h: 2.2, y: 5.0 },
      { r: 1.1, h: 1.8, y: 6.4 },
    ];
    tierSizes.forEach(t => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 6), foliageMat);
      cone.position.set(0, t.y, 0);
      group.add(cone);
    });
  } else {
    // Oak Tree: Gnarled trunk + clustered leaf clusters
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3.5, 7), trunkMat);
    trunk.position.set(0, 1.75, 0);
    group.add(trunk);

    const foliageMat = createMat(PALETTE.foliage.oak, 0.85, 0.0);
    const clusters = [
      { r: 1.8, x: 0, y: 4.0, z: 0 },
      { r: 1.4, x: -0.8, y: 3.5, z: 0.5 },
      { r: 1.4, x: 0.8, y: 3.6, z: -0.4 },
      { r: 1.2, x: 0, y: 4.8, z: 0.2 },
    ];
    clusters.forEach(c => {
      const leafCluster = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 0), foliageMat);
      leafCluster.position.set(c.x, c.y, c.z);
      group.add(leafCluster);
    });
  }

  enableShadows(group);
  return group;
}

/**
 * Creates low-poly faceted boulders and rocks.
 */
export function createRockModel(size = 1.0): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(size, 0);
  // Slightly randomize vertices for unique natural silhouette
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * (0.85 + Math.random() * 0.3),
      pos.getY(i) * (0.7 + Math.random() * 0.4),
      pos.getZ(i) * (0.85 + Math.random() * 0.3)
    );
  }
  geo.computeVertexNormals();

  const mat = createMat(PALETTE.stone.moss, 0.9, 0.05);
  const rock = new THREE.Mesh(geo, mat);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

// =============================================================================
//                        5. RESIDENTIAL HOUSES & CIVIC PROPS
// =============================================================================

/**
 * Style 1: Medieval Thatched Cottage
 * Cozy peasant & artisan dwelling with curved bulging thatch roof, stone chimney,
 * wooden porch, warm glowing lantern windows, and firewood stack.
 */
export function createThatchedCottageModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_Thatched';

  const woodMat = createMat(PALETTE.wood.dark, 0.85, 0.05);
  const wallMat = createMat(0xe2d9c8, 0.9, 0.0); // Warm plaster
  const stoneMat = createMat(PALETTE.stone.medium, 0.85, 0.1);
  const thatchMat = createMat(PALETTE.wood.thatch, 0.92, 0.0);
  const windowMat = createMat(0xfef08a, 0.3, 0.1, 0xf59e0b); // Warm lantern glow
  const doorMat = createMat(PALETTE.wood.medium, 0.8, 0.05);

  // 1. Cobblestone Foundation
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.6, 6.2), stoneMat);
  foundation.position.set(0, 0.3, 0);
  group.add(foundation);

  // 2. Plaster Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.2, 5.6), wallMat);
  walls.position.set(0, 2.2, 0);
  group.add(walls);

  // 3. Exposed Timber Framing Corner Posts & Cross-beams
  const cornerCoords = [
    [-3.3, -2.8], [3.3, -2.8], [-3.3, 2.8], [3.3, 2.8]
  ];
  cornerCoords.forEach(([cx, cz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), woodMat);
    post.position.set(cx, 2.2, cz);
    group.add(post);
  });

  // 4. Overhanging Thatched Straw Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.0, 4), thatchMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 5.2, 0);
  roof.scale.set(1.1, 1.0, 0.9);
  group.add(roof);

  // 5. Cobblestone Side Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.0, 1.2), stoneMat);
  chimney.position.set(-3.4, 3.0, 0);
  group.add(chimney);

  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), stoneMat);
  chimneyCap.position.set(-3.4, 6.1, 0);
  group.add(chimneyCap);

  // 6. Wooden Entrance Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.1, 0.15), doorMat);
  door.position.set(0.6, 1.65, 2.85);
  group.add(door);

  // 7. Glowing Windows
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.1), windowMat);
  win1.position.set(-1.8, 2.4, 2.85);
  group.add(win1);

  const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.1), windowMat);
  win2.position.set(1.8, 2.4, -2.85);
  group.add(win2);

  // 8. Firewood Stack along wall
  const firewood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.8), woodMat);
  firewood.position.set(2.2, 1.05, 2.85);
  group.add(firewood);

  enableShadows(group);
  return group;
}

/**
 * Style 2: Half-Timbered Medieval Townhouse / Villa
 * Multi-story Tudor house with jettied second floor, steep gabled shingle roof,
 * decorative diagonal cross-braces, and entrance porch lantern.
 */
export function createTimberHouseModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_Timber';

  const woodDark = createMat(PALETTE.wood.dark, 0.85, 0.05);
  const plasterMat = createMat(0xf8fafc, 0.92, 0.0);
  const stoneMat = createMat(PALETTE.stone.dark, 0.85, 0.1);
  const roofColor = options.faction === 'south' ? PALETTE.south.roof : PALETTE.north.roof;
  const roofMat = createMat(roofColor, 0.8, 0.1);
  const windowMat = createMat(0xfef08a, 0.3, 0.1, 0xf59e0b);

  // 1. Dressed Stone Ground Floor
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.6, 7.0), stoneMat);
  groundFloor.position.set(0, 1.8, 0);
  group.add(groundFloor);

  // 2. Overhanging (Jettied) Second Floor
  const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.6, 7.6), plasterMat);
  secondFloor.position.set(0, 5.4, 0);
  group.add(secondFloor);

  // 3. Exposed Timber Framing across Second Floor
  const beamFrontHoriz = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.2, 0.1), woodDark);
  beamFrontHoriz.position.set(0, 5.4, 3.82);
  group.add(beamFrontHoriz);

  for (let x = -3.8; x <= 3.8; x += 1.9) {
    const vBeam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.6, 0.1), woodDark);
    vBeam.position.set(x, 5.4, 3.82);
    group.add(vBeam);
  }

  // 4. Steep Gabled Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1.0, 0.95);
  roof.position.set(0, 9.1, 0);
  group.add(roof);

  // 5. Grand Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.5, 1.4), stoneMat);
  chimney.position.set(3.8, 4.75, 1.8);
  group.add(chimney);

  // 6. Ground Floor Wooden Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), woodDark);
  door.position.set(0, 1.2, 3.52);
  group.add(door);

  // 7. Glowing Mullioned Windows (Ground & 2nd floor)
  const winPositions = [
    [-2.2, 1.8, 3.52], [2.2, 1.8, 3.52],
    [-2.2, 5.6, 3.85], [0, 5.6, 3.85], [2.2, 5.6, 3.85]
  ];
  winPositions.forEach(([wx, wy, wz]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), windowMat);
    win.position.set(wx, wy, wz);
    group.add(win);
  });

  enableShadows(group);
  return group;
}

/**
 * Style 3: Fortified Nordic Stone Manor
 * Solid granite homestead with slate roof, arched portal, corner buttresses,
 * high chimneys, and iron crest lanterns.
 */
export function createStoneManorModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_Stone';

  const stoneMain = createMat(PALETTE.stone.dark, 0.88, 0.12);
  const stoneTrim = createMat(PALETTE.stone.light, 0.8, 0.15);
  const slateRoof = createMat(0x1e293b, 0.75, 0.2); // Midnight slate
  const doorWood = createMat(PALETTE.wood.dark, 0.8, 0.1);
  const warmLight = createMat(0xfef08a, 0.2, 0.1, 0xf59e0b);

  // 1. Massive Stone Wing
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(11.0, 5.5, 9.0), stoneMain);
  mainHall.position.set(0, 2.75, 0);
  group.add(mainHall);

  // 2. Corner Buttresses
  const buttressOffsets = [
    [-5.6, -4.6], [5.6, -4.6], [-5.6, 4.6], [5.6, 4.6]
  ];
  buttressOffsets.forEach(([bx, bz]) => {
    const buttress = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.8, 1.2), stoneTrim);
    buttress.position.set(bx, 2.9, bz);
    group.add(buttress);
  });

  // 3. Arched Portal Entrance
  const portalArch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 1.2), stoneTrim);
  portalArch.position.set(0, 1.9, 4.8);
  group.add(portalArch);

  const doubleDoors = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.2), doorWood);
  doubleDoors.position.set(0, 1.4, 5.35);
  group.add(doubleDoors);

  // 4. Slate Roof with Stone End Gables
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.2, 4), slateRoof);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.1, 1.0, 0.9);
  roof.position.set(0, 7.6, 0);
  group.add(roof);

  // 5. Twin Stone Chimneys
  [-3.8, 3.8].forEach((cx) => {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.5, 1.4), stoneTrim);
    ch.position.set(cx, 5.25, 0);
    group.add(ch);
  });

  // 6. Arched Leaded Windows
  [[-3.2, 3.2], [3.2, 3.2]].forEach(([wx, wz]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.1), warmLight);
    win.position.set(wx, 3.0, 4.52);
    group.add(win);
  });

  enableShadows(group);
  return group;
}

/**
 * Style 4: Arcane Wizard's Sanctum / Alchemist Tower
 * Whimsical conical observatory tower with glowing arcane orb atop the spire,
 * attached timber alchemy lab, outdoor staircase, and glowing crystal aura.
 */
export function createWizardTowerModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_Wizard';

  const towerStone = createMat(0x312e81, 0.85, 0.15); // Indigo slate
  const trimStone = createMat(0x4338ca, 0.8, 0.2);
  const conicalRoofMat = createMat(0x1e1b4b, 0.75, 0.2);
  const woodMat = createMat(PALETTE.wood.dark, 0.85, 0.05);
  const arcaneGlow = createMat(0x818cf8, 0.2, 0.4, 0x6366f1); // Violet magic glow

  // 1. Tall Cylindrical Stone Tower
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 11.0, 10), towerStone);
  tower.position.set(0, 5.5, 0);
  group.add(tower);

  // 2. Tower Mid-Ring Balcony
  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.2, 0.6, 10), trimStone);
  balcony.position.set(0, 8.0, 0);
  group.add(balcony);

  // 3. Conical Spire Roof
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.6, 5.5, 10), conicalRoofMat);
  spire.position.set(0, 13.5, 0);
  group.add(spire);

  // 4. Glowing Arcane Crystal Orb at the Spire Peak
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), arcaneGlow);
  orb.position.set(0, 16.6, 0);
  orb.name = 'ArcaneCrystalOrb';
  group.add(orb);

  // 5. Attached Alchemy Lab Cottage
  const annex = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.5, 3.8), createMat(0x475569, 0.9, 0.05));
  annex.position.set(3.4, 1.75, 0);
  group.add(annex);

  const annexRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), conicalRoofMat);
  annexRoof.rotation.y = Math.PI / 4;
  annexRoof.position.set(3.4, 4.4, 0);
  group.add(annexRoof);

  // 6. Glowing Arcane Windows
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.1), arcaneGlow);
  win.position.set(0, 9.5, 2.8);
  group.add(win);

  enableShadows(group);
  return group;
}

/**
 * Style 5: Alpine Log Cabin / Woodsman Lodge
 * Rustic timber logs, mossy turf roof, front covered porch with railings.
 */
export function createNordicCabinModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_Cabin';

  const logMat = createMat(PALETTE.wood.medium, 0.85, 0.05);
  const darkLogMat = createMat(PALETTE.wood.dark, 0.9, 0.05);
  const turfRoof = createMat(0x2d4a22, 0.95, 0.0); // Mossy pine green
  const stoneMat = createMat(PALETTE.stone.dark, 0.9, 0.1);
  const windowMat = createMat(0xfef08a, 0.3, 0.1, 0xf59e0b);

  // 1. Foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.5, 6.2), stoneMat);
  base.position.set(0, 0.25, 0);
  group.add(base);

  // 2. Horizontal Log Wall Simulation
  const cabinBody = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 5.6), logMat);
  cabinBody.position.set(0, 1.75, 0);
  group.add(cabinBody);

  // 3. Low-sloping Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.4, 4), turfRoof);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.2, 0.9, 1.0);
  roof.position.set(0, 4.0, 0);
  group.add(roof);

  // 4. Front Porch with 2 Wooden Posts
  [-2.2, 2.2].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 6), darkLogMat);
    post.position.set(px, 1.3, 3.2);
    group.add(post);
  });

  // 5. Door & Window
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.15), darkLogMat);
  door.position.set(0.6, 1.25, 2.85);
  group.add(door);

  const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), windowMat);
  win.position.set(-1.6, 1.8, 2.85);
  group.add(win);

  enableShadows(group);
  return group;
}

/**
 * Royal Tiered Stone Civic Fountain
 * Centerpiece for parks and village squares with ornate carved basins,
 * central column, and translucent shimmering water surface.
 */
export function createFountainModel(options: { faction?: Faction } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Fountain_Royal';

  const stoneMat = createMat(PALETTE.stone.light, 0.78, 0.15);
  const darkStone = createMat(PALETTE.stone.dark, 0.85, 0.1);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.78,
  });

  // 1. Outer Large Octagonal / Circular Basin Rim
  const outerBasinRim = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.6, 0.8, 12),
    stoneMat
  );
  outerBasinRim.position.set(0, 0.4, 0);
  group.add(outerBasinRim);

  // 2. Pool Water Surface
  const poolWater = new THREE.Mesh(
    new THREE.CylinderGeometry(3.15, 3.15, 0.1, 12),
    waterMat
  );
  poolWater.position.set(0, 0.65, 0);
  group.add(poolWater);

  // 3. Central Carved Column
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 2.8, 8),
    darkStone
  );
  column.position.set(0, 1.8, 0);
  group.add(column);

  // 4. Mid-Tier Water Basin
  const midBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.3, 0.5, 10),
    stoneMat
  );
  midBowl.position.set(0, 2.4, 0);
  group.add(midBowl);

  const midWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.65, 0.08, 10),
    waterMat
  );
  midWater.position.set(0, 2.58, 0);
  group.add(midWater);

  // 5. Upper Spire Column & Small Basin
  const upperSpire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 1.4, 8),
    darkStone
  );
  upperSpire.position.set(0, 3.3, 0);
  group.add(upperSpire);

  const topBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.6, 0.35, 8),
    stoneMat
  );
  topBowl.position.set(0, 3.8, 0);
  group.add(topBowl);

  // 6. Top Water Jet Finial
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    waterMat
  );
  finial.position.set(0, 4.2, 0);
  group.add(finial);

  enableShadows(group);
  return group;
}

/**
 * Public Park Props: Benches, Lampposts, and Flowerbeds
 */
export function createParkBenchModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Park_Bench';

  const ironMat = createMat(PALETTE.metal.iron, 0.7, 0.4);
  const woodMat = createMat(PALETTE.wood.medium, 0.85, 0.05);

  // Legs / Armrests
  [-0.9, 0.9].forEach((bx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.7), ironMat);
    leg.position.set(bx, 0.35, 0);
    group.add(leg);
  });

  // Seat Slats
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.55), woodMat);
  seat.position.set(0, 0.45, 0.05);
  group.add(seat);

  // Backrest Slats
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.08), woodMat);
  back.position.set(0, 0.85, -0.22);
  back.rotation.x = -0.15;
  group.add(back);

  enableShadows(group);
  return group;
}

export function createParkLampModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Park_Lamp';

  const ironMat = createMat(PALETTE.metal.iron, 0.65, 0.4);
  const lanternGlass = createMat(0xfef08a, 0.2, 0.1, 0xfde047);

  // Post & Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.4, 6), ironMat);
  base.position.set(0, 0.2, 0);
  group.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.8, 6), ironMat);
  post.position.set(0, 2.1, 0);
  group.add(post);

  // Top Lantern
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), lanternGlass);
  lantern.position.set(0, 4.1, 0);
  group.add(lantern);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.35, 4), ironMat);
  cap.position.set(0, 4.45, 0);
  group.add(cap);

  enableShadows(group);
  return group;
}

export function createFlowerBedModel(type: 'rose' | 'lavender' | 'marigold' = 'rose'): THREE.Group {
  const group = new THREE.Group();
  group.name = `FlowerBed_${type}`;

  const stoneRim = createMat(PALETTE.stone.moss, 0.9, 0.05);
  const soilMat = createMat(PALETTE.foliage.soil, 0.95, 0.0);

  const flowerColors = {
    rose: 0xef4444,     // Red
    lavender: 0xa855f7, // Violet/Purple
    marigold: 0xf59e0b, // Amber/Orange
  };
  const petalMat = createMat(flowerColors[type] || 0xef4444, 0.7, 0.0);
  const stemMat = createMat(PALETTE.foliage.grass, 0.85, 0.0);

  // Border stone kerb
  const kerb = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.25, 8), stoneRim);
  kerb.position.set(0, 0.12, 0);
  group.add(kerb);

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.15, 8), soilMat);
  soil.position.set(0, 0.22, 0);
  group.add(soil);

  // Scattered Flower blossoms
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.15;
    const fx = Math.cos(angle) * r;
    const fz = Math.sin(angle) * r;
    const fh = 0.25 + Math.random() * 0.2;

    const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), petalMat);
    blossom.position.set(fx, 0.25 + fh, fz);
    group.add(blossom);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, fh, 4), stemMat);
    stem.position.set(fx, 0.25 + fh / 2, fz);
    group.add(stem);
  }

  enableShadows(group);
  return group;
}

/**
 * Towering Mountain Peak with Snowy Cap
 */
export function createMountainPeakModel(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Mountain_Peak';

  const rockMat = createMat(0x334155, 0.9, 0.08); // Dark mountain slate
  const snowMat = createMat(0xf8fafc, 0.82, 0.05); // Glacier snow

  // Craggy Lower Peak Body
  const baseGeo = new THREE.ConeGeometry(38 * scale, 55 * scale, 7);
  // Deform vertices for rugged alpine facet silhouette
  const pos = baseGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 20 * scale) {
      pos.setX(i, pos.getX(i) * (0.85 + ((i % 5) * 0.06)));
      pos.setZ(i, pos.getZ(i) * (0.85 + ((i % 7) * 0.05)));
    }
  }
  baseGeo.computeVertexNormals();

  const baseMesh = new THREE.Mesh(baseGeo, rockMat);
  baseMesh.position.set(0, 27.5 * scale, 0);
  group.add(baseMesh);

  // Snow-capped Summit Cap
  const snowCapGeo = new THREE.ConeGeometry(16 * scale, 22 * scale, 7);
  const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
  snowCap.position.set(0, 44 * scale, 0);
  group.add(snowCap);

  enableShadows(group);
  return group;
}

/**
 * Flowering Cherry Blossom Tree for the Royal Park
 */
export function createCherryBlossomTreeModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tree_CherryBlossom';

  const trunkMat = createMat(0x451a03, 0.9, 0.0);
  const blossomMat = createMat(0xf472b6, 0.8, 0.0); // Vivid pink blossoms

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 3.8, 6), trunkMat);
  trunk.position.set(0, 1.9, 0);
  group.add(trunk);

  const clusters = [
    { r: 1.8, x: 0, y: 4.2, z: 0 },
    { r: 1.4, x: -0.9, y: 3.7, z: 0.6 },
    { r: 1.5, x: 0.9, y: 3.8, z: -0.5 },
    { r: 1.2, x: 0, y: 5.1, z: 0.2 },
  ];
  clusters.forEach(c => {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 0), blossomMat);
    puff.position.set(c.x, c.y, c.z);
    group.add(puff);
  });

  enableShadows(group);
  return group;
}

/**
 * Weeping Willow Tree for Riverbanks & Watersides
 */
export function createWillowTreeModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tree_Willow';

  const trunkMat = createMat(0x3e2723, 0.9, 0.0);
  const willowMat = createMat(0x65a30d, 0.85, 0.0); // Drooping lime-green leaves

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 4.0, 6), trunkMat);
  trunk.position.set(0, 2.0, 0);
  group.add(trunk);

  // Drooping canopy domes
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 3.0, 8), willowMat);
  crown.position.set(0, 4.4, 0);
  group.add(crown);

  enableShadows(group);
  return group;
}

