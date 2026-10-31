'use client';

import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { getTerrainHeight } from '@/lib/world/parcelCoordinates';
import {
  createThatchedCottageModel,
  createTimberHouseModel,
  createStoneManorModel,
  createWizardTowerModel,
  createNordicCabinModel,
  createFountainModel,
  createParkBenchModel,
  createParkLampModel,
  createFlowerBedModel,
  createMountainPeakModel,
  createCherryBlossomTreeModel,
  createWillowTreeModel,
  createTreeModel,
  createRockModel,
} from '@/lib/assets/proceduralModels';

interface SettlementHouse {
  id: string;
  name: string;
  type: 'thatched' | 'timber' | 'stone' | 'wizard' | 'cabin';
  pos: [number, number, number];
  rotY: number;
  width: number;
  depth: number;
}

interface CivicProp {
  id: string;
  type: 'fountain' | 'bench' | 'lamp' | 'flower_rose' | 'flower_lavender' | 'flower_marigold';
  pos: [number, number, number];
  rotY?: number;
}

interface MountainPeakData {
  id: string;
  pos: [number, number, number];
  scale: number;
}

interface FoliageData {
  id: string;
  type: 'pine' | 'oak' | 'willow' | 'cherry' | 'boulder';
  pos: [number, number, number];
  scale: number;
}

/**
 * WorldSettlements Component
 * Populates Sovereign Lands with vibrant medieval architecture, sovereign public parks,
 * tiered marble fountains, surrounding alpine mountains, and lush forests.
 */
export function WorldSettlements() {
  // 1. Surrounding Mountain Ranges (North, East, West boundaries)
  const mountainPeaks = useMemo<MountainPeakData[]>(() => {
    const peaks: MountainPeakData[] = [];

    // North Mountain Wall (Z: -380 to -460)
    for (let x = -440; x <= 440; x += 75) {
      const z = -410 - Math.abs(Math.sin(x * 0.02) * 50);
      const scale = 1.3 + Math.abs(Math.cos(x * 0.03)) * 0.7;
      peaks.push({ id: `mt_north_${x}`, pos: [x, 0, z], scale });
    }

    // East Mountain Wall (X: 420 to 480)
    for (let z = -360; z <= 360; z += 80) {
      const x = 430 + Math.abs(Math.sin(z * 0.02) * 45);
      const scale = 1.2 + Math.abs(Math.sin(z * 0.04)) * 0.6;
      peaks.push({ id: `mt_east_${z}`, pos: [x, 0, z], scale });
    }

    // West Mountain Wall (X: -420 to -480)
    for (let z = -360; z <= 360; z += 80) {
      const x = -430 - Math.abs(Math.cos(z * 0.02) * 45);
      const scale = 1.2 + Math.abs(Math.cos(z * 0.04)) * 0.6;
      peaks.push({ id: `mt_west_${z}`, pos: [x, 0, z], scale });
    }

    return peaks;
  }, []);

  // 2. Residential Houses across North and South Districts
  const houses = useMemo<SettlementHouse[]>(() => {
    const rawPlacements: Array<{
      id: string;
      name: string;
      type: 'thatched' | 'timber' | 'stone' | 'wizard' | 'cabin';
      x: number;
      z: number;
      rotY: number;
      width: number;
      depth: number;
    }> = [
      // NORTHERN VILLAGE (Around X: -60, Z: -90)
      { id: 'n_cottage_1', name: "Aldric's Neighbor Cottage", type: 'thatched', x: -48, z: -82, rotY: 0.2, width: 8, depth: 8 },
      { id: 'n_cottage_2', name: 'Millers Thatched Home', type: 'thatched', x: -68, z: -76, rotY: -0.4, width: 8, depth: 8 },
      { id: 'n_cottage_3', name: 'Weaver Thatched Dwelling', type: 'thatched', x: -32, z: -98, rotY: 0.8, width: 8, depth: 8 },
      { id: 'n_cottage_4', name: 'Fisher Thatched Cottage', type: 'thatched', x: -55, z: -55, rotY: 0.1, width: 8, depth: 8 },
      { id: 'n_timber_1', name: 'North Village Guildhouse', type: 'timber', x: -58, z: -116, rotY: 0.0, width: 9, depth: 9 },
      { id: 'n_timber_2', name: 'Blacksmith Residence', type: 'timber', x: -20, z: -122, rotY: -0.5, width: 9, depth: 9 },
      { id: 'n_stone_1', name: 'Frostguard Manor', type: 'stone', x: 52, z: -108, rotY: 0.3, width: 12, depth: 11 },
      { id: 'n_stone_2', name: 'Citadel Warden Estate', type: 'stone', x: -82, z: -130, rotY: -0.2, width: 12, depth: 11 },
      { id: 'n_wizard_1', name: 'Archmage Observatory', type: 'wizard', x: -94, z: -96, rotY: 0.6, width: 8.5, depth: 8.5 },
      { id: 'n_cabin_1', name: 'Highland Pine Lodge', type: 'cabin', x: -115, z: -64, rotY: 0.4, width: 7.5, depth: 7.5 },
      { id: 'n_cabin_2', name: 'Huntsman Foothill Cabin', type: 'cabin', x: 82, z: -78, rotY: -0.6, width: 7.5, depth: 7.5 },

      // SOUTHERN SOLARA SETTLEMENT (Around X: -20 to 60, Z: 60 to 120)
      { id: 's_timber_1', name: 'Solara Trading Villa', type: 'timber', x: -24, z: 82, rotY: 0.1, width: 9, depth: 9 },
      { id: 's_timber_2', name: 'Sunward Silk House', type: 'timber', x: -46, z: 98, rotY: -0.3, width: 9, depth: 9 },
      { id: 's_cottage_1', name: 'Vintner Thatched Cottage', type: 'thatched', x: 28, z: 72, rotY: 0.5, width: 8, depth: 8 },
      { id: 's_cottage_2', name: 'Caravan Oasis Cottage', type: 'thatched', x: 64, z: 86, rotY: -0.2, width: 8, depth: 8 },
      { id: 's_stone_1', name: 'Sunwatch Garrison Manor', type: 'stone', x: 48, z: 124, rotY: 0.0, width: 12, depth: 11 },
      { id: 's_cabin_1', name: 'River Bend Log Cabin', type: 'cabin', x: -68, z: 62, rotY: 0.7, width: 7.5, depth: 7.5 },
    ];

    return rawPlacements.map((p) => {
      const y = getTerrainHeight(p.x, p.z);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        pos: [p.x, y, p.z],
        rotY: p.rotY,
        width: p.width,
        depth: p.depth,
      };
    });
  }, []);

  // 3. Civic Parks, Fountains, Benches, Lampposts, and Flower Gardens
  const civicProps = useMemo<CivicProp[]>(() => {
    const props: CivicProp[] = [];

    // --- SOVEREIGN CENTRAL PARK (Center: [34, -46]) ---
    const parkX = 34;
    const parkZ = -46;
    const parkY = getTerrainHeight(parkX, parkZ);

    // Centerpiece: Grand Tiered Fountain
    props.push({
      id: 'park_fountain_center',
      type: 'fountain',
      pos: [parkX, parkY, parkZ],
    });

    // Benches surrounding the central fountain
    const benchOffsets = [
      { dx: 0, dz: 6.5, rot: Math.PI },
      { dx: 0, dz: -6.5, rot: 0 },
      { dx: 6.5, dz: 0, rot: -Math.PI / 2 },
      { dx: -6.5, dz: 0, rot: Math.PI / 2 },
      { dx: 4.8, dz: 4.8, rot: (3 * Math.PI) / 4 },
      { dx: -4.8, dz: 4.8, rot: -(3 * Math.PI) / 4 },
      { dx: 4.8, dz: -4.8, rot: Math.PI / 4 },
      { dx: -4.8, dz: -4.8, rot: -Math.PI / 4 },
    ];
    benchOffsets.forEach((b, idx) => {
      const bx = parkX + b.dx;
      const bz = parkZ + b.dz;
      const by = getTerrainHeight(bx, bz);
      props.push({
        id: `park_bench_${idx}`,
        type: 'bench',
        pos: [bx, by, bz],
        rotY: b.rot,
      });
    });

    // Park Lampposts
    const lampOffsets = [
      { dx: 9, dz: 9 },
      { dx: -9, dz: 9 },
      { dx: 9, dz: -9 },
      { dx: -9, dz: -9 },
      { dx: 0, dz: 12 },
      { dx: 0, dz: -12 },
    ];
    lampOffsets.forEach((l, idx) => {
      const lx = parkX + l.dx;
      const lz = parkZ + l.dz;
      const ly = getTerrainHeight(lx, lz);
      props.push({
        id: `park_lamp_${idx}`,
        type: 'lamp',
        pos: [lx, ly, lz],
      });
    });

    // Flower Beds in Park Quadrants
    const flowerBedOffsets: Array<{ dx: number; dz: number; flower: 'flower_rose' | 'flower_lavender' | 'flower_marigold' }> = [
      { dx: 9.5, dz: 0, flower: 'flower_rose' },
      { dx: -9.5, dz: 0, flower: 'flower_lavender' },
      { dx: 0, dz: 9.5, flower: 'flower_marigold' },
      { dx: 0, dz: -9.5, flower: 'flower_rose' },
      { dx: 7.0, dz: 11.0, flower: 'flower_lavender' },
      { dx: -7.0, dz: 11.0, flower: 'flower_marigold' },
    ];
    flowerBedOffsets.forEach((f, idx) => {
      const fx = parkX + f.dx;
      const fz = parkZ + f.dz;
      const fy = getTerrainHeight(fx, fz);
      props.push({
        id: `park_flowers_${idx}`,
        type: f.flower,
        pos: [fx, fy, fz],
      });
    });

    // --- NORTH VILLAGE SQUARE FOUNTAIN & LAMPS (Center: [-48, -98]) ---
    const vX = -48;
    const vZ = -98;
    const vY = getTerrainHeight(vX, vZ);
    props.push({
      id: 'village_square_fountain',
      type: 'fountain',
      pos: [vX, vY, vZ],
    });
    props.push({
      id: 'village_lamp_1',
      type: 'lamp',
      pos: [vX + 5, getTerrainHeight(vX + 5, vZ + 4), vZ + 4],
    });
    props.push({
      id: 'village_lamp_2',
      type: 'lamp',
      pos: [vX - 5, getTerrainHeight(vX - 5, vZ - 4), vZ - 4],
    });
    props.push({
      id: 'village_bench_1',
      type: 'bench',
      pos: [vX + 4.5, getTerrainHeight(vX + 4.5, vZ), vZ],
      rotY: -Math.PI / 2,
    });

    // --- SOUTH SQUARE FOUNTAIN (Center: [-32, 90]) ---
    const sX = -32;
    const sZ = 90;
    const sY = getTerrainHeight(sX, sZ);
    props.push({
      id: 'south_square_fountain',
      type: 'fountain',
      pos: [sX, sY, sZ],
    });
    props.push({
      id: 'south_lamp_1',
      type: 'lamp',
      pos: [sX + 5, getTerrainHeight(sX + 5, sZ), sZ],
    });

    return props;
  }, []);

  // 4. Rich Forest, Riverbank Willows, and Park Cherry Trees
  const floraItems = useMemo<FoliageData[]>(() => {
    const list: FoliageData[] = [];

    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Park Cherry Trees (Encircling Sovereign Central Park, Center: [34, -46])
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const r = 15.0 + rand() * 4.0;
      const cx = 34 + Math.cos(angle) * r;
      const cz = -46 + Math.sin(angle) * r;
      const cy = getTerrainHeight(cx, cz);
      list.push({
        id: `park_cherry_${i}`,
        type: 'cherry',
        pos: [cx, cy, cz],
        scale: 0.9 + rand() * 0.3,
      });
    }

    // Riverbank Weeping Willows (along Z = -18 and Z = 18)
    for (let x = -260; x <= 260; x += 22) {
      if (Math.abs(x) < 18) continue; // Clear bridge road
      // North riverbank
      const nz = -16 - rand() * 6;
      list.push({
        id: `willow_n_${x}`,
        type: 'willow',
        pos: [x, getTerrainHeight(x, nz), nz],
        scale: 0.85 + rand() * 0.3,
      });
      // South riverbank
      const sz = 16 + rand() * 6;
      list.push({
        id: `willow_s_${x}`,
        type: 'willow',
        pos: [x, getTerrainHeight(x, sz), sz],
        scale: 0.85 + rand() * 0.3,
      });
    }

    // Dense North Highland Boreal Pine Forest (80 additional trees)
    for (let i = 0; i < 80; i++) {
      const x = -320 + rand() * 640;
      const z = -360 + rand() * 260;
      if (Math.abs(x) < 20) continue;
      // Keep clear of village center
      const inVillage = Math.hypot(x - (-60), z - (-90)) < 40;
      const inPark = Math.hypot(x - 34, z - (-46)) < 24;
      if (!inVillage && !inPark) {
        list.push({
          id: `dense_pine_${i}`,
          type: 'pine',
          pos: [x, getTerrainHeight(x, z), z],
          scale: 0.8 + rand() * 0.5,
        });
      }
    }

    // Dense South Sunny Solara Oak Groves (80 additional trees)
    for (let i = 0; i < 80; i++) {
      const x = -320 + rand() * 640;
      const z = 45 + rand() * 280;
      if (Math.abs(x) < 20) continue;
      const inSouthVillage = Math.hypot(x - (-30), z - 90) < 35;
      if (!inSouthVillage) {
        list.push({
          id: `dense_oak_${i}`,
          type: 'oak',
          pos: [x, getTerrainHeight(x, z), z],
          scale: 0.8 + rand() * 0.45,
        });
      }
    }

    // Granite Boulders along mountain foothills
    for (let i = 0; i < 35; i++) {
      const x = -350 + rand() * 700;
      const z = (rand() > 0.5 ? -1 : 1) * (180 + rand() * 180);
      list.push({
        id: `boulder_${i}`,
        type: 'boulder',
        pos: [x, getTerrainHeight(x, z), z],
        scale: 1.0 + rand() * 1.4,
      });
    }

    return list;
  }, []);

  return (
    <group name="WorldSettlements_Root">
      {/* 1. Surrounding Mountain Horizon */}
      <group name="Perimeter_Mountains">
        {mountainPeaks.map((peak) => (
          <group key={peak.id} position={peak.pos}>
            <primitive object={createMountainPeakModel(peak.scale)} />
          </group>
        ))}
      </group>

      {/* 2. Residential Houses with Physics Colliders */}
      <group name="Residential_Houses">
        {houses.map((house) => {
          let meshObj: THREE.Group;
          switch (house.type) {
            case 'thatched':
              meshObj = createThatchedCottageModel();
              break;
            case 'timber':
              meshObj = createTimberHouseModel();
              break;
            case 'stone':
              meshObj = createStoneManorModel();
              break;
            case 'wizard':
              meshObj = createWizardTowerModel();
              break;
            case 'cabin':
              meshObj = createNordicCabinModel();
              break;
          }

          return (
            <RigidBody
              key={house.id}
              type="fixed"
              colliders={false}
              position={house.pos}
              rotation={[0, house.rotY, 0]}
              name={`House_${house.id}`}
            >
              <CuboidCollider
                args={[house.width * 0.45, 4.0, house.depth * 0.45]}
                position={[0, 4.0, 0]}
              />
              <primitive object={meshObj} />
            </RigidBody>
          );
        })}
      </group>

      {/* 3. Civic Fountains, Park Benches, Lamps, and Gardens */}
      <group name="Civic_Props">
        {civicProps.map((prop) => {
          let obj: THREE.Object3D;
          let hasCollider = false;
          let colWidth = 2;
          let colHeight = 2;

          switch (prop.type) {
            case 'fountain':
              obj = createFountainModel();
              hasCollider = true;
              colWidth = 3.2;
              colHeight = 2.0;
              break;
            case 'bench':
              obj = createParkBenchModel();
              break;
            case 'lamp':
              obj = createParkLampModel();
              break;
            case 'flower_rose':
              obj = createFlowerBedModel('rose');
              break;
            case 'flower_lavender':
              obj = createFlowerBedModel('lavender');
              break;
            case 'flower_marigold':
              obj = createFlowerBedModel('marigold');
              break;
          }

          if (hasCollider) {
            return (
              <RigidBody
                key={prop.id}
                type="fixed"
                colliders={false}
                position={prop.pos}
                name={`Civic_${prop.id}`}
              >
                <CuboidCollider
                  args={[colWidth, colHeight, colWidth]}
                  position={[0, colHeight, 0]}
                />
                <primitive object={obj} />
              </RigidBody>
            );
          }

          return (
            <group
              key={prop.id}
              position={prop.pos}
              rotation={prop.rotY ? [0, prop.rotY, 0] : undefined}
            >
              <primitive object={obj} />
            </group>
          );
        })}
      </group>

      {/* 4. Dense Forests, Willows, Cherry Blossoms, and Boulders */}
      <group name="Settlement_Flora">
        {floraItems.map((f) => {
          let meshObj: THREE.Object3D;
          if (f.type === 'pine') {
            meshObj = createTreeModel('pine');
          } else if (f.type === 'oak') {
            meshObj = createTreeModel('oak');
          } else if (f.type === 'cherry') {
            meshObj = createCherryBlossomTreeModel();
          } else if (f.type === 'willow') {
            meshObj = createWillowTreeModel();
          } else {
            meshObj = createRockModel(f.scale);
          }

          return (
            <group key={f.id} position={f.pos} scale={[f.scale, f.scale, f.scale]}>
              <primitive object={meshObj} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

export default WorldSettlements;
