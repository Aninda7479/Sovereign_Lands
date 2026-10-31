import * as THREE from 'three';

/**
 * Sovereign Lands - Procedural Shop & Market 3D Models
 * High-performance, low-poly medieval fantasy market stalls, forge stations, and arcane altars.
 * Optimized for WebGL 60 FPS with baked material palettes, vibrant vertex/material lighting,
 * and themed medieval merchant props.
 */

export type ShopTheme = 'general' | 'armory' | 'apothecary' | 'arcane' | 'silk' | 'trinket';

export interface MarketStallConfig {
  canopyColor: string;
  stripeColor: string;
  theme?: ShopTheme;
  stallName?: string;
}

// =============================================================================
//                             COLOR PALETTES
// =============================================================================

const SHOP_PALETTE = {
  wood: {
    dark: 0x3e2723,
    medium: 0x5d4037,
    light: 0x8d6e63,
    counter: 0x4e342e,
    aged: 0x2e1c14,
    thatch: 0xd4a373,
  },
  stone: {
    dark: 0x27272a,
    brick: 0x3f3f46,
    mortar: 0x52525b,
    light: 0x71717a,
    rune: 0x06b6d4,
  },
  metal: {
    iron: 0x334155,
    steel: 0x94a3b8,
    blade: 0xcbd5e1,
    brass: 0xd97706,
    gold: 0xf59e0b,
    bronze: 0x92400e,
  },
  potions: {
    emerald: 0x10b981,
    sapphire: 0x3b82f6,
    ruby: 0xef4444,
    amethyst: 0xa855f7,
    glass: 0xe0f2fe,
    cork: 0xd97706,
  },
  arcane: {
    crystal: 0x06b6d4,
    crystalEmissive: 0x0284c7,
    glowPurple: 0x8b5cf6,
    runeGlow: 0x38bdf8,
    goldLeaf: 0xfcd34d,
  },
  fire: {
    ember: 0xff3b00,
    coal: 0x1c1917,
    glow: 0xff7700,
  },
  silks: [
    0x7c3aed, // Royal Purple
    0xd97706, // Imperial Gold
    0x0284c7, // Sapphire Blue
    0xdc2626, // Crimson Velvet
    0x059669, // Emerald Satin
  ],
};

function createMat(
  color: number | string,
  roughness = 0.8,
  metalness = 0.1,
  emissive: number | string = 0x000000,
  emissiveIntensity = 1.0
): THREE.MeshStandardMaterial {
  const c = typeof color === 'string' ? new THREE.Color(color) : color;
  const em = typeof emissive === 'string' ? new THREE.Color(emissive) : emissive;
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness,
    metalness,
    emissive: em,
    emissiveIntensity,
    flatShading: true,
  });
}

function enableShadows(obj: THREE.Object3D) {
  obj.castShadow = true;
  obj.receiveShadow = true;
  obj.children.forEach(enableShadows);
}

// =============================================================================
//                       1. MARKET STALL MODEL FACTORY
// =============================================================================

/**
 * Creates an authentic medieval timber-framed market stall with curved/slanted striped awning,
 * counter, tiered display shelves, hanging lantern, swinging shop sign, and theme-specific props.
 */
export function createMarketStallModel(config: MarketStallConfig): THREE.Group {
  const stall = new THREE.Group();
  stall.name = `MarketStall_${config.theme || 'general'}`;

  const darkWoodMat = createMat(SHOP_PALETTE.wood.dark, 0.9, 0.05);
  const medWoodMat = createMat(SHOP_PALETTE.wood.medium, 0.85, 0.05);
  const counterWoodMat = createMat(SHOP_PALETTE.wood.counter, 0.75, 0.05);
  const ironMat = createMat(SHOP_PALETTE.metal.iron, 0.6, 0.5);

  const canopyMat = createMat(config.canopyColor, 0.9, 0.0);
  const stripeMat = createMat(config.stripeColor, 0.9, 0.0);

  // ---------------------------------------------------------------------------
  // A. Timber Posts & Frame (4 Posts + Crossbeams)
  // ---------------------------------------------------------------------------
  const postWidth = 0.14;
  const stallHalfW = 1.5;
  const stallHalfD = 1.1;
  const frontHeight = 2.5;
  const rearHeight = 2.85; // Slight slope backward for awning

  const postPositions: [number, number, number, number][] = [
    // [x, yCenter, z, height]
    [-stallHalfW, frontHeight / 2, stallHalfD, frontHeight],
    [stallHalfW, frontHeight / 2, stallHalfD, frontHeight],
    [-stallHalfW, rearHeight / 2, -stallHalfD, rearHeight],
    [stallHalfW, rearHeight / 2, -stallHalfD, rearHeight],
  ];

  postPositions.forEach(([x, y, z, h]) => {
    const postGeo = new THREE.BoxGeometry(postWidth, h, postWidth);
    const postMesh = new THREE.Mesh(postGeo, darkWoodMat);
    postMesh.position.set(x, y, z);
    stall.add(postMesh);

    // Stone footing
    const footingGeo = new THREE.BoxGeometry(postWidth * 1.5, 0.18, postWidth * 1.5);
    const footingMesh = new THREE.Mesh(footingGeo, createMat(SHOP_PALETTE.stone.brick, 0.95, 0.05));
    footingMesh.position.set(x, 0.09, z);
    stall.add(footingMesh);
  });

  // Top perimeter timber beams
  const frontTopBeam = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 + 0.3, postWidth, postWidth),
    medWoodMat
  );
  frontTopBeam.position.set(0, frontHeight - 0.07, stallHalfD);
  stall.add(frontTopBeam);

  const rearTopBeam = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 + 0.3, postWidth, postWidth),
    medWoodMat
  );
  rearTopBeam.position.set(0, rearHeight - 0.07, -stallHalfD);
  stall.add(rearTopBeam);

  [-stallHalfW, stallHalfW].forEach((sideX) => {
    // Slanted side roof beam
    const sideBeamLen = Math.hypot(stallHalfD * 2, rearHeight - frontHeight);
    const sideBeamAngle = Math.atan2(rearHeight - frontHeight, stallHalfD * 2);
    const sideBeam = new THREE.Mesh(
      new THREE.BoxGeometry(postWidth * 0.9, postWidth * 0.9, sideBeamLen + 0.2),
      medWoodMat
    );
    sideBeam.position.set(sideX, (frontHeight + rearHeight) / 2 - 0.07, 0);
    sideBeam.rotation.x = sideBeamAngle;
    stall.add(sideBeam);

    // Diagonal corner braces
    const braceGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const braceFront = new THREE.Mesh(braceGeo, darkWoodMat);
    braceFront.position.set(sideX > 0 ? sideX - 0.2 : sideX + 0.2, frontHeight - 0.35, stallHalfD);
    braceFront.rotation.z = sideX > 0 ? -Math.PI / 4 : Math.PI / 4;
    stall.add(braceFront);

    const braceRear = new THREE.Mesh(braceGeo, darkWoodMat);
    braceRear.position.set(sideX > 0 ? sideX - 0.2 : sideX + 0.2, rearHeight - 0.35, -stallHalfD);
    braceRear.rotation.z = sideX > 0 ? -Math.PI / 4 : Math.PI / 4;
    stall.add(braceRear);
  });

  // ---------------------------------------------------------------------------
  // B. Slanted Striped Cloth Canopy with Hanging Scalloped Valance
  // ---------------------------------------------------------------------------
  const canopyGroup = new THREE.Group();
  canopyGroup.name = 'Stall_Canopy';

  const numStripes = 10;
  const canopyWidth = (stallHalfW * 2 + 0.4) / numStripes;
  const canopySpanDepth = stallHalfD * 2 + 0.6;
  const canopySlopeAngle = Math.atan2(rearHeight - frontHeight, stallHalfD * 2);

  for (let i = 0; i < numStripes; i++) {
    const isEven = i % 2 === 0;
    const mat = isEven ? canopyMat : stripeMat;
    const stripeX = -stallHalfW - 0.2 + canopyWidth / 2 + i * canopyWidth;

    // Main roof cloth strip
    const roofStrip = new THREE.Mesh(
      new THREE.BoxGeometry(canopyWidth * 0.98, 0.04, canopySpanDepth),
      mat
    );
    roofStrip.position.set(stripeX, (frontHeight + rearHeight) / 2 + 0.06, 0.05);
    roofStrip.rotation.x = canopySlopeAngle;
    canopyGroup.add(roofStrip);

    // Front hanging valance flap (drapes downward)
    const valanceFront = new THREE.Mesh(
      new THREE.BoxGeometry(canopyWidth * 0.96, 0.28, 0.03),
      mat
    );
    valanceFront.position.set(
      stripeX,
      frontHeight - 0.06,
      stallHalfD + 0.35
    );
    valanceFront.rotation.x = 0.08;
    canopyGroup.add(valanceFront);

    // Rear small hanging flap
    const valanceRear = new THREE.Mesh(
      new THREE.BoxGeometry(canopyWidth * 0.96, 0.2, 0.03),
      mat
    );
    valanceRear.position.set(
      stripeX,
      rearHeight - 0.02,
      -stallHalfD - 0.25
    );
    valanceRear.rotation.x = -0.08;
    canopyGroup.add(valanceRear);
  }

  stall.add(canopyGroup);

  // ---------------------------------------------------------------------------
  // C. Wooden Front Counter Table & Planks
  // ---------------------------------------------------------------------------
  const counterGroup = new THREE.Group();
  counterGroup.name = 'Front_Counter';

  const counterH = 0.98;
  const counterW = stallHalfW * 2 + 0.1;
  const counterD = 0.72;

  // Countertop slab
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(counterW, 0.08, counterD),
    counterWoodMat
  );
  counterTop.position.set(0, counterH, stallHalfD - 0.22);
  counterGroup.add(counterTop);

  // Front wooden apron planks
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(counterW - 0.08, counterH - 0.08, 0.05),
    medWoodMat
  );
  apron.position.set(0, (counterH - 0.08) / 2, stallHalfD + 0.12);
  counterGroup.add(apron);

  // Lower shelf board under counter
  const underShelf = new THREE.Mesh(
    new THREE.BoxGeometry(counterW - 0.2, 0.04, counterD - 0.1),
    darkWoodMat
  );
  underShelf.position.set(0, 0.35, stallHalfD - 0.22);
  counterGroup.add(underShelf);

  stall.add(counterGroup);

  // ---------------------------------------------------------------------------
  // D. Rear Multi-Tiered Shelves & Storage
  // ---------------------------------------------------------------------------
  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = 'Rear_Shelves';

  // Back wall wooden slats
  const backWallH = 1.6;
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 - 0.1, backWallH, 0.05),
    darkWoodMat
  );
  backWall.position.set(0, 0.9 + backWallH / 2, -stallHalfD + 0.08);
  shelvesGroup.add(backWall);

  // Tier 1 Shelf
  const shelf1 = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 - 0.16, 0.06, 0.38),
    medWoodMat
  );
  shelf1.position.set(0, 1.05, -stallHalfD + 0.26);
  shelvesGroup.add(shelf1);

  // Tier 2 Shelf
  const shelf2 = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 - 0.16, 0.06, 0.34),
    medWoodMat
  );
  shelf2.position.set(0, 1.6, -stallHalfD + 0.24);
  shelvesGroup.add(shelf2);

  // Tier 3 Top Narrow Shelf
  const shelf3 = new THREE.Mesh(
    new THREE.BoxGeometry(stallHalfW * 2 - 0.3, 0.05, 0.28),
    medWoodMat
  );
  shelf3.position.set(0, 2.1, -stallHalfD + 0.2);
  shelvesGroup.add(shelf3);

  stall.add(shelvesGroup);

  // ---------------------------------------------------------------------------
  // E. Hanging Iron Lantern with Warm Point Light
  // ---------------------------------------------------------------------------
  const lanternGroup = new THREE.Group();
  lanternGroup.name = 'Stall_Lantern';
  lanternGroup.position.set(stallHalfW - 0.25, frontHeight - 0.2, stallHalfD + 0.05);

  // Chain link
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.22, 5),
    ironMat
  );
  chain.position.set(0, 0.11, 0);
  lanternGroup.add(chain);

  // Lantern Cap & Base
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.09, 5), ironMat);
  cap.position.set(0, 0, 0);
  lanternGroup.add(cap);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.04, 5), ironMat);
  base.position.set(0, -0.22, 0);
  lanternGroup.add(base);

  // Glowing Lantern Glass
  const glassMat = createMat(0xffd166, 0.2, 0.1, 0xf59e0b, 1.8);
  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.18, 6),
    glassMat
  );
  lanternGlass.position.set(0, -0.11, 0);
  lanternGroup.add(lanternGlass);

  // Warm Point Light
  const warmLight = new THREE.PointLight(0xffa500, 1.5, 6, 1.8);
  warmLight.position.set(0, -0.11, 0);
  warmLight.castShadow = false; // Keep lightweight for performance
  lanternGroup.add(warmLight);

  stall.add(lanternGroup);

  // ---------------------------------------------------------------------------
  // F. Swinging Wooden Shop Sign
  // ---------------------------------------------------------------------------
  const signGroup = new THREE.Group();
  signGroup.name = 'Shop_Sign';
  signGroup.position.set(-stallHalfW - 0.22, frontHeight - 0.35, stallHalfD + 0.05);

  // Bracket
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.05), ironMat);
  bracket.position.set(-0.15, 0, 0);
  signGroup.add(bracket);

  // Sign chains
  [-0.08, -0.25].forEach((cx) => {
    const sChain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4), ironMat);
    sChain.position.set(cx, -0.1, 0);
    signGroup.add(sChain);
  });

  // Sign Board
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.04),
    createMat(SHOP_PALETTE.wood.aged, 0.85, 0.05)
  );
  signBoard.position.set(-0.16, -0.32, 0);
  signGroup.add(signBoard);

  // Sign Emblem / Border
  const signEmblem = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.28, 0.05),
    createMat(SHOP_PALETTE.metal.brass, 0.4, 0.7, 0xd97706, 0.3)
  );
  signEmblem.position.set(-0.16, -0.32, 0);
  signGroup.add(signEmblem);

  stall.add(signGroup);

  // ---------------------------------------------------------------------------
  // G. THEMED PROPS INTEGRATION
  // ---------------------------------------------------------------------------
  const propsGroup = new THREE.Group();
  propsGroup.name = 'Themed_Props';

  const theme = config.theme || 'general';

  switch (theme) {
    case 'armory': {
      // 1. Hanging Shield on back wall
      const shieldMat = createMat(0x1e293b, 0.4, 0.6);
      const shieldBossMat = createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8, 0xf59e0b, 0.3);
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12), shieldMat);
      shield.rotation.x = Math.PI / 2;
      shield.position.set(-0.4, 1.8, -stallHalfD + 0.12);
      propsGroup.add(shield);

      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), shieldBossMat);
      boss.position.set(-0.4, 1.8, -stallHalfD + 0.16);
      propsGroup.add(boss);

      // Heater Shield (Kite-like) on right side of back wall
      const heater = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.05), createMat(0x991b1b, 0.6, 0.3));
      heater.position.set(0.5, 1.8, -stallHalfD + 0.12);
      propsGroup.add(heater);

      // 2. Iron Sword Blades on counter & rack
      const steelMat = createMat(SHOP_PALETTE.metal.blade, 0.25, 0.85);
      const swordRack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.2), darkWoodMat);
      swordRack.position.set(-0.6, counterH + 0.09, stallHalfD - 0.25);
      propsGroup.add(swordRack);

      [-0.15, 0.0, 0.15].forEach((offX, idx) => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.7), steelMat);
        blade.position.set(-0.6 + offX, counterH + 0.22, stallHalfD - 0.25);
        blade.rotation.x = 0.2;
        propsGroup.add(blade);

        // Crossguard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), ironMat);
        guard.position.set(-0.6 + offX, counterH + 0.22, stallHalfD + 0.06);
        propsGroup.add(guard);

        // Hilt
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), darkWoodMat);
        hilt.rotation.x = Math.PI / 2;
        hilt.position.set(-0.6 + offX, counterH + 0.22, stallHalfD + 0.15);
        propsGroup.add(hilt);
      });

      // 3. Whetstone on side table
      const whetstoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), darkWoodMat);
      whetstoneBase.position.set(0.7, counterH + 0.15, stallHalfD - 0.25);
      propsGroup.add(whetstoneBase);

      const whetWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.08, 14),
        createMat(SHOP_PALETTE.stone.mortar, 0.9, 0.1)
      );
      whetWheel.rotation.z = Math.PI / 2;
      whetWheel.position.set(0.7, counterH + 0.45, stallHalfD - 0.25);
      propsGroup.add(whetWheel);

      // Iron ingots stacked on lower shelf
      const ingotMat = createMat(SHOP_PALETTE.metal.iron, 0.5, 0.7);
      [-0.2, 0.0, 0.2].forEach((ix) => {
        const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.32), ingotMat);
        ingot.position.set(ix, 1.1, -stallHalfD + 0.26);
        propsGroup.add(ingot);
      });
      break;
    }

    case 'apothecary': {
      // 1. Glowing Colorful Potion Flasks (Emerald, Sapphire, Ruby, Amethyst)
      const potionTypes = [
        { color: SHOP_PALETTE.potions.emerald, emissive: 0x059669, x: -0.8 },
        { color: SHOP_PALETTE.potions.sapphire, emissive: 0x2563eb, x: -0.4 },
        { color: SHOP_PALETTE.potions.ruby, emissive: 0xdc2626, x: 0.0 },
        { color: SHOP_PALETTE.potions.amethyst, emissive: 0x9333ea, x: 0.4 },
        { color: 0xf59e0b, emissive: 0xd97706, x: 0.8 },
      ];

      // Shelf 1 potions (Round bottom flasks)
      potionTypes.forEach((p) => {
        const flaskMat = createMat(p.color, 0.2, 0.3, p.emissive, 1.6);
        const flaskBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), flaskMat);
        flaskBody.position.set(p.x, 1.2, -stallHalfD + 0.25);
        propsGroup.add(flaskBody);

        const flaskNeck = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8),
          createMat(SHOP_PALETTE.potions.glass, 0.1, 0.1, 0xffffff, 0.3)
        );
        flaskNeck.position.set(p.x, 1.34, -stallHalfD + 0.25);
        propsGroup.add(flaskNeck);

        const cork = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.035, 0.06, 6),
          createMat(SHOP_PALETTE.potions.cork, 0.9, 0.0)
        );
        cork.position.set(p.x, 1.41, -stallHalfD + 0.25);
        propsGroup.add(cork);
      });

      // Shelf 2 potions (Tall triangular elixir bottles)
      [-0.6, -0.2, 0.2, 0.6].forEach((bx, i) => {
        const bottleColor = [0x06b6d4, 0xec4899, 0x10b981, 0x8b5cf6][i];
        const bMat = createMat(bottleColor, 0.15, 0.4, bottleColor, 1.4);
        const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.25, 6), bMat);
        bMesh.position.set(bx, 1.75, -stallHalfD + 0.22);
        propsGroup.add(bMesh);
      });

      // 2. Dried Herb Bundles hanging from front top beam
      [-0.7, -0.2, 0.3, 0.8].forEach((hx) => {
        const herbMat = createMat(0x3f6212, 0.95, 0.0);
        const herbStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), darkWoodMat);
        herbStem.position.set(hx, frontHeight - 0.2, stallHalfD);
        propsGroup.add(herbStem);

        const herbLeaves = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), herbMat);
        herbLeaves.rotation.x = Math.PI; // upside down hanging bundle
        herbLeaves.position.set(hx, frontHeight - 0.38, stallHalfD);
        propsGroup.add(herbLeaves);
      });

      // 3. Mortar & Pestle on Counter
      const mortar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.09, 0.14, 10),
        createMat(SHOP_PALETTE.stone.dark, 0.8, 0.1)
      );
      mortar.position.set(-0.5, counterH + 0.07, stallHalfD - 0.25);
      propsGroup.add(mortar);

      const pestle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.2, 6), darkWoodMat);
      pestle.position.set(-0.48, counterH + 0.16, stallHalfD - 0.25);
      pestle.rotation.z = 0.35;
      propsGroup.add(pestle);

      // Recipe Scroll
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8),
        createMat(0xfef3c7, 0.9, 0.0)
      );
      scroll.rotation.z = Math.PI / 2;
      scroll.position.set(0.5, counterH + 0.04, stallHalfD - 0.25);
      propsGroup.add(scroll);
      break;
    }

    case 'arcane': {
      // 1. Floating Glowing Magical Dodecahedron Crystal
      const crystalMat = createMat(
        SHOP_PALETTE.arcane.crystal,
        0.1,
        0.2,
        SHOP_PALETTE.arcane.crystalEmissive,
        2.5
      );
      const crystal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), crystalMat);
      crystal.name = 'floatingCrystal';
      crystal.position.set(0, counterH + 0.55, stallHalfD - 0.25);
      propsGroup.add(crystal);

      // Glowing crystal point light
      const crystalLight = new THREE.PointLight(0x38bdf8, 2.0, 5, 2.0);
      crystalLight.position.set(0, counterH + 0.55, stallHalfD - 0.25);
      propsGroup.add(crystalLight);

      // Crystal Pedestal Ring
      const ringMat = createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8, 0xf59e0b, 0.5);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, counterH + 0.12, stallHalfD - 0.25);
      propsGroup.add(ring);

      // 2. Ancient Tome on Lectern
      const lectern = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.35), darkWoodMat);
      lectern.position.set(-0.65, counterH + 0.1, stallHalfD - 0.25);
      propsGroup.add(lectern);

      const bookCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.06, 0.32),
        createMat(0x4c1d95, 0.7, 0.2, 0x6d28d9, 0.5)
      );
      bookCover.position.set(-0.65, counterH + 0.23, stallHalfD - 0.25);
      bookCover.rotation.x = 0.25;
      propsGroup.add(bookCover);

      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.04, 0.28),
        createMat(0xfef9c3, 0.8, 0.0, 0xfef08a, 0.4)
      );
      pages.position.set(-0.65, counterH + 0.25, stallHalfD - 0.25);
      pages.rotation.x = 0.25;
      propsGroup.add(pages);

      // 3. Arcane Artifacts on Shelves
      [-0.7, 0.7].forEach((ax) => {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          createMat(0xa855f7, 0.1, 0.1, 0x8b5cf6, 2.0)
        );
        orb.position.set(ax, 1.25, -stallHalfD + 0.25);
        propsGroup.add(orb);
      });

      // Hourglass
      const hgMat = createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8);
      const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 8), hgMat);
      hg.position.set(0.65, counterH + 0.14, stallHalfD - 0.25);
      propsGroup.add(hg);
      break;
    }

    case 'silk': {
      // 1. Rolled Up Vibrant Fabric Bolts on Shelves
      const silkColors = SHOP_PALETTE.silks;
      [-0.8, -0.4, 0.0, 0.4, 0.8].forEach((sx, idx) => {
        const boltColor = silkColors[idx % silkColors.length];
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.55, 12),
          createMat(boltColor, 0.5, 0.3)
        );
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(sx, 1.15, -stallHalfD + 0.26);
        propsGroup.add(bolt);

        // Second layer of rolls on top
        if (idx % 2 === 0) {
          const topBolt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12),
            createMat(silkColors[(idx + 2) % silkColors.length], 0.5, 0.3)
          );
          topBolt.rotation.z = Math.PI / 2;
          topBolt.position.set(sx, 1.32, -stallHalfD + 0.26);
          propsGroup.add(topBolt);
        }
      });

      // 2. Draped Silk Cloth hanging over counter edge
      const drapeMat = createMat(0xd97706, 0.4, 0.4);
      const drape = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.03), drapeMat);
      drape.position.set(0, counterH - 0.15, stallHalfD + 0.15);
      propsGroup.add(drape);

      // 3. Golden Brass Shears on Counter
      const shears = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.02, 0.28),
        createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8, 0xf59e0b, 0.3)
      );
      shears.position.set(0.6, counterH + 0.05, stallHalfD - 0.2);
      propsGroup.add(shears);

      // 4. Wooden Crates & Baskets on lower counter
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.35, 0.4),
        createMat(SHOP_PALETTE.wood.light, 0.9, 0.05)
      );
      crate.position.set(-0.7, counterH + 0.18, stallHalfD - 0.25);
      propsGroup.add(crate);
      break;
    }

    case 'trinket': {
      // 1. Small Wooden Lute / Mandolin
      const luteBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        createMat(SHOP_PALETTE.wood.medium, 0.6, 0.1)
      );
      luteBody.scale.set(0.9, 1.2, 0.5);
      luteBody.position.set(-0.55, 1.7, -stallHalfD + 0.16);
      propsGroup.add(luteBody);

      const luteNeck = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.45, 0.04),
        createMat(SHOP_PALETTE.wood.dark, 0.7, 0.1)
      );
      luteNeck.position.set(-0.55, 2.05, -stallHalfD + 0.16);
      propsGroup.add(luteNeck);

      // 2. Ornate Treasure Chest on Counter
      const chestMat = createMat(SHOP_PALETTE.wood.dark, 0.7, 0.2);
      const chestGoldMat = createMat(SHOP_PALETTE.metal.gold, 0.3, 0.8, 0xf59e0b, 0.4);

      const chestBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.3), chestMat);
      chestBody.position.set(0.5, counterH + 0.11, stallHalfD - 0.25);
      propsGroup.add(chestBody);

      const chestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 8), chestMat);
      chestLid.rotation.z = Math.PI / 2;
      chestLid.position.set(0.5, counterH + 0.23, stallHalfD - 0.25);
      propsGroup.add(chestLid);

      const chestClasp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), chestGoldMat);
      chestClasp.position.set(0.5, counterH + 0.18, stallHalfD - 0.09);
      propsGroup.add(chestClasp);

      // 3. Brass Balance Scales on Counter
      const scaleStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.04, 0.4, 6),
        createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8)
      );
      scaleStand.position.set(-0.05, counterH + 0.2, stallHalfD - 0.25);
      propsGroup.add(scaleStand);

      const scaleBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.02, 0.02),
        createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8)
      );
      scaleBeam.position.set(-0.05, counterH + 0.38, stallHalfD - 0.25);
      propsGroup.add(scaleBeam);

      [-0.22, 0.12].forEach((sx) => {
        const pan = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.04, 0.03, 8),
          createMat(SHOP_PALETTE.metal.brass, 0.3, 0.8)
        );
        pan.position.set(sx, counterH + 0.24, stallHalfD - 0.25);
        propsGroup.add(pan);
      });
      break;
    }

    case 'general':
    default: {
      // 1. Crates of Grain & Produce
      [-0.6, 0.6].forEach((cx, idx) => {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.32, 0.38),
          createMat(SHOP_PALETTE.wood.light, 0.9, 0.05)
        );
        crate.position.set(cx, counterH + 0.16, stallHalfD - 0.25);
        propsGroup.add(crate);

        // Contents
        const contentsMat = idx === 0
          ? createMat(0xfacc15, 0.95, 0.0) // Golden Wheat Grain
          : createMat(0xd97706, 0.95, 0.0); // Maize
        const contentMound = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), contentsMat);
        contentMound.scale.set(1.0, 0.5, 1.0);
        contentMound.position.set(cx, counterH + 0.32, stallHalfD - 0.25);
        propsGroup.add(contentMound);
      });

      // 2. Fruit Basket with Red Apples & Citrus
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.14, 0.16, 10),
        createMat(SHOP_PALETTE.wood.light || 0xd4a373, 0.9, 0.0)
      );
      basket.position.set(0, counterH + 0.08, stallHalfD - 0.25);
      propsGroup.add(basket);

      // Red apples & golden oranges
      const fruitColors = [0xef4444, 0xdc2626, 0xf97316, 0xef4444, 0xfbbf24];
      [
        [-0.06, 0.05],
        [0.06, 0.04],
        [0.0, -0.06],
        [-0.04, -0.04],
        [0.03, 0.08],
      ].forEach(([fx, fz], fi) => {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 6, 6),
          createMat(fruitColors[fi], 0.4, 0.1)
        );
        fruit.position.set(fx, counterH + 0.18, stallHalfD - 0.25 + fz);
        propsGroup.add(fruit);
      });

      // 3. Storage Barrels stacked on shelf
      [-0.6, 0.0, 0.6].forEach((bx) => {
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.16, 0.4, 10),
          createMat(SHOP_PALETTE.wood.dark, 0.85, 0.05)
        );
        barrel.position.set(bx, 1.25, -stallHalfD + 0.26);
        propsGroup.add(barrel);

        // Metal hoop bands
        [-0.12, 0.12].forEach((hy) => {
          const hoop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.165, 0.165, 0.03, 10),
            createMat(SHOP_PALETTE.metal.iron, 0.5, 0.6)
          );
          hoop.position.set(bx, 1.25 + hy, -stallHalfD + 0.26);
          propsGroup.add(hoop);
        });
      });
      break;
    }
  }

  stall.add(propsGroup);

  enableShadows(stall);
  return stall;
}

// =============================================================================
//                       2. FORGE STATION MODEL FACTORY
// =============================================================================

/**
 * Creates a complete medieval blacksmith forge station:
 * - Stone brick furnace / hearth with glowing coals and chimney
 * - Heavy iron anvil on timber stump
 * - Water quenching barrel with reflective water
 * - Forge tongs & blacksmith hammer
 */
export function createForgeStationModel(): THREE.Group {
  const forge = new THREE.Group();
  forge.name = 'Blacksmith_Forge_Station';

  const brickMat = createMat(SHOP_PALETTE.stone.brick, 0.95, 0.05);
  const darkStoneMat = createMat(SHOP_PALETTE.stone.dark, 0.9, 0.1);
  const ironMat = createMat(SHOP_PALETTE.metal.iron, 0.6, 0.6);
  const steelMat = createMat(SHOP_PALETTE.metal.steel, 0.35, 0.8);
  const woodMat = createMat(SHOP_PALETTE.wood.dark, 0.9, 0.05);

  // ---------------------------------------------------------------------------
  // A. Stone Furnace Hearth
  // ---------------------------------------------------------------------------
  const hearthBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.2), brickMat);
  hearthBase.position.set(0, 0.45, 0);
  forge.add(hearthBase);

  // Hearth Firebox Basin
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.8), darkStoneMat);
  firebox.position.set(0, 0.85, 0.1);
  forge.add(firebox);

  // Glowing Orange Coals & Embers
  const coalMat = createMat(
    SHOP_PALETTE.fire.coal,
    0.8,
    0.1,
    SHOP_PALETTE.fire.ember,
    2.2
  );
  const embers = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.65), coalMat);
  embers.name = 'glowingCoals';
  embers.position.set(0, 0.96, 0.1);
  forge.add(embers);

  // Warm Forge Fire Point Light
  const forgeLight = new THREE.PointLight(0xff4500, 2.5, 6, 2.0);
  forgeLight.position.set(0, 1.15, 0.1);
  forge.add(forgeLight);

  // Stone Chimney Hood & Exhaust Stack
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.9, 4), brickMat);
  hood.rotation.y = Math.PI / 4;
  hood.position.set(0, 1.75, -0.1);
  forge.add(hood);

  const stack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), brickMat);
  stack.position.set(0, 2.7, -0.1);
  forge.add(stack);

  // ---------------------------------------------------------------------------
  // B. Heavy Iron Anvil on Timber Log
  // ---------------------------------------------------------------------------
  const anvilGroup = new THREE.Group();
  anvilGroup.name = 'Anvil';
  anvilGroup.position.set(1.4, 0, 0.4);

  // Oak Tree Stump Base
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.65, 8), woodMat);
  stump.position.set(0, 0.325, 0);
  anvilGroup.add(stump);

  // Anvil Footing
  const anvilFoot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.24), ironMat);
  anvilFoot.position.set(0, 0.7, 0);
  anvilGroup.add(anvilFoot);

  // Anvil Waist
  const anvilWaist = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.16), ironMat);
  anvilWaist.position.set(0, 0.83, 0);
  anvilGroup.add(anvilWaist);

  // Anvil Striking Face & Table
  const anvilFace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.22), steelMat);
  anvilFace.position.set(0, 0.985, 0);
  anvilGroup.add(anvilFace);

  // Anvil Conical Horn (Pointing X+)
  const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 8), steelMat);
  anvilHorn.rotation.z = -Math.PI / 2;
  anvilHorn.position.set(0.36, 0.985, 0);
  anvilGroup.add(anvilHorn);

  // Heated Iron Blade resting on anvil
  const heatedBladeMat = createMat(0xd97706, 0.3, 0.8, 0xff5500, 1.5);
  const redBlade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.06), heatedBladeMat);
  redBlade.position.set(0.05, 1.07, 0);
  anvilGroup.add(redBlade);

  // Blacksmith Hammer
  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6), woodMat);
  hammerHandle.rotation.x = Math.PI / 2;
  hammerHandle.position.set(-0.15, 1.08, -0.05);
  anvilGroup.add(hammerHandle);

  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.12), ironMat);
  hammerHead.position.set(-0.15, 1.08, 0.1);
  anvilGroup.add(hammerHead);

  forge.add(anvilGroup);

  // ---------------------------------------------------------------------------
  // C. Water Quenching Tub
  // ---------------------------------------------------------------------------
  const tubGroup = new THREE.Group();
  tubGroup.name = 'Quenching_Tub';
  tubGroup.position.set(-1.3, 0, 0.3);

  const tubBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.7, 10), woodMat);
  tubBarrel.position.set(0, 0.35, 0);
  tubGroup.add(tubBarrel);

  // Metal barrel bands
  [-0.15, 0.15].forEach((by) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.035, 10), ironMat);
    band.position.set(0, 0.35 + by, 0);
    tubGroup.add(band);
  });

  // Blue Water Surface
  const waterMat = createMat(0x0284c7, 0.1, 0.2, 0x0369a1, 0.4);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 10), waterMat);
  water.position.set(0, 0.65, 0);
  tubGroup.add(water);

  // Long Forge Tongs resting across the barrel rim
  const tongs = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), ironMat);
  tongs.rotation.z = 0.4;
  tongs.rotation.x = 0.2;
  tongs.position.set(0, 0.72, 0);
  tubGroup.add(tongs);

  forge.add(tubGroup);

  enableShadows(forge);
  return forge;
}

// =============================================================================
//                       3. ARCANE ALTAR MODEL FACTORY
// =============================================================================

/**
 * Creates an ancient celestial arcane altar:
 * - Runic stone pedestal with engraved glowing magical channels
 * - Hovering pulsing arcane crystal
 * - Ring of 6 standing megalithic rune stones angled inwards
 */
export function createArcaneAltarModel(): THREE.Group {
  const altar = new THREE.Group();
  altar.name = 'Arcane_Altar';

  const stoneMat = createMat(SHOP_PALETTE.stone.dark, 0.85, 0.15);
  const runicMat = createMat(
    SHOP_PALETTE.arcane.crystal,
    0.2,
    0.3,
    SHOP_PALETTE.arcane.glowPurple,
    2.2
  );
  const glyphMat = createMat(
    SHOP_PALETTE.arcane.runeGlow,
    0.1,
    0.2,
    SHOP_PALETTE.arcane.runeGlow,
    3.0
  );

  // ---------------------------------------------------------------------------
  // A. Stepped Runic Stone Dais & Pedestal
  // ---------------------------------------------------------------------------
  // Step 1: Base Platform
  const baseStep1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.18, 8), stoneMat);
  baseStep1.position.set(0, 0.09, 0);
  altar.add(baseStep1);

  // Step 2: Mid Platform
  const baseStep2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.18, 8), stoneMat);
  baseStep2.position.set(0, 0.27, 0);
  altar.add(baseStep2);

  // Central Carved Pillar Pedestal
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.0, 6), stoneMat);
  pedestal.position.set(0, 0.86, 0);
  altar.add(pedestal);

  // Engraved Glowing Runic Channels
  const runeBand = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.12, 6), runicMat);
  runeBand.position.set(0, 0.9, 0);
  altar.add(runeBand);

  // Pedestal Capital / Font Basin
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.45, 0.24, 6), stoneMat);
  basin.position.set(0, 1.48, 0);
  altar.add(basin);

  // Glowing pool in basin
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 6), runicMat);
  pool.position.set(0, 1.58, 0);
  altar.add(pool);

  // ---------------------------------------------------------------------------
  // B. Hovering Pulsing Crystal & Point Light
  // ---------------------------------------------------------------------------
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), runicMat);
  crystal.name = 'hoveringAltarCrystal';
  crystal.scale.set(0.8, 1.3, 0.8);
  crystal.position.set(0, 2.15, 0);
  altar.add(crystal);

  // Small orbit crystals
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const mini = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), glyphMat);
    mini.position.set(Math.cos(angle) * 0.7, 2.15 + Math.sin(i) * 0.1, Math.sin(angle) * 0.7);
    altar.add(mini);
  }

  const altarLight = new THREE.PointLight(0x8b5cf6, 2.8, 8, 2.0);
  altarLight.position.set(0, 2.2, 0);
  altar.add(altarLight);

  // ---------------------------------------------------------------------------
  // C. Ring of 6 Standing Runic Megaliths
  // ---------------------------------------------------------------------------
  const numStones = 6;
  const ringRadius = 1.85;

  for (let i = 0; i < numStones; i++) {
    const angle = (i * Math.PI * 2) / numStones;
    const sx = Math.cos(angle) * ringRadius;
    const sz = Math.sin(angle) * ringRadius;

    const stoneGroup = new THREE.Group();
    stoneGroup.position.set(sx, 0, sz);
    // Face slightly inwards toward center
    stoneGroup.rotation.y = -angle + Math.PI / 2;

    // Megalith Body
    const stoneMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 1.7 + (i % 3) * 0.2, 0.22),
      stoneMat
    );
    stoneMesh.position.set(0, 0.85 + (i % 3) * 0.1, 0);
    // Slight inward lean
    stoneMesh.rotation.z = 0.08;
    stoneGroup.add(stoneMesh);

    // Glowing Inlaid Rune Glyph on inward face
    const glyph = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.35, 0.03),
      glyphMat
    );
    glyph.position.set(0, 0.95 + (i % 3) * 0.1, 0.11);
    stoneGroup.add(glyph);

    altar.add(stoneGroup);
  }

  enableShadows(altar);
  return altar;
}
