'use client';

import React, { useMemo } from 'react';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { getTerrainHeight, WORLD_CONSTANTS } from '@/lib/world/parcelCoordinates';
import { createTreeModel, createRockModel } from '@/lib/assets/proceduralModels';

export interface OpenWorldTerrainProps {
  size?: number;
  segments?: number;
}

/**
 * Continuous 3D Open-World Terrain for Sovereign Lands.
 * Features rolling hills, river valley depression, vertex-colored biomes (North Frost vs South Solara),
 * Rapier physics Trimesh collider, and instanced vegetation.
 */
export function OpenWorldTerrain({
  size = WORLD_CONSTANTS.mapSize,
  segments = 80,
}: OpenWorldTerrainProps) {
  // Generate terrain geometry with procedural height perturbation & biome vertex colors
  const { geometry, vertices, indices } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2); // Orient horizontal (X, Z plane)

    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    const colorNorthSnow = new THREE.Color('#f1f5f9');
    const colorNorthRock = new THREE.Color('#334155');
    const colorNorthGrass = new THREE.Color('#1e3a2b');
    const colorSand = new THREE.Color('#d97706');
    const colorSouthGrass = new THREE.Color('#4d7c0f');
    const colorSouthWheat = new THREE.Color('#ca8a04');
    const colorSouthRock = new THREE.Color('#9a3412');

    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Perturb vertex height using continuous procedural function
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      // Biome-based vertex color assignment
      if (Math.abs(z) <= 24) {
        // Riverbanks: Golden Sand & Silt
        tempColor.copy(colorSand);
      } else if (z < -24) {
        // North Kingdom (Boreal)
        if (y > 7.5 || z < -350) {
          tempColor.lerpColors(colorNorthRock, colorNorthSnow, Math.min(1, (y - 7) / 6));
        } else {
          tempColor.lerpColors(colorNorthGrass, colorNorthRock, Math.min(1, y / 6));
        }
      } else {
        // South Kingdom (Solara)
        if (y > 6.0 || z > 350) {
          tempColor.lerpColors(colorSouthGrass, colorSouthRock, Math.min(1, (y - 5) / 5));
        } else {
          tempColor.lerpColors(colorSouthGrass, colorSouthWheat, Math.abs(Math.sin(x * 0.05)));
        }
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const rawVertices = new Float32Array(pos.array);
    const rawIndices = new Uint32Array(geo.index?.array || []);

    return { geometry: geo, vertices: rawVertices, indices: rawIndices };
  }, [size, segments]);

  // Scatter representative trees and rocks across the landscape
  const foliageInstances = useMemo(() => {
    const items: Array<{
      type: 'pine' | 'oak' | 'rock';
      pos: [number, number, number];
      scale: number;
    }> = [];

    // Deterministic pseudo-random seed generator
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // North Pine Trees (Z from -380 to -35)
    for (let i = 0; i < 30; i++) {
      const x = -300 + random() * 600;
      const z = -380 + random() * 340;
      // Keep clear of center bridge road (X in [-15, 15])
      if (Math.abs(x) > 16) {
        const y = getTerrainHeight(x, z);
        items.push({ type: 'pine', pos: [x, y, z], scale: 0.8 + random() * 0.4 });
      }
    }

    // South Oak Trees (Z from 35 to 380)
    for (let i = 0; i < 30; i++) {
      const x = -300 + random() * 600;
      const z = 35 + random() * 340;
      if (Math.abs(x) > 16) {
        const y = getTerrainHeight(x, z);
        items.push({ type: 'oak', pos: [x, y, z], scale: 0.8 + random() * 0.4 });
      }
    }

    // Scattered Boulders along hillsides
    for (let i = 0; i < 20; i++) {
      const x = -280 + random() * 560;
      const z = (random() > 0.5 ? 1 : -1) * (40 + random() * 300);
      if (Math.abs(x) > 16) {
        const y = getTerrainHeight(x, z);
        items.push({ type: 'rock', pos: [x, y, z], scale: 0.8 + random() * 0.7 });
      }
    }

    // Pre-create 3D model primitives once in memory to avoid garbage collection stutter
    return items.map((item) => {
      let meshObj: THREE.Object3D;
      if (item.type === 'pine') {
        meshObj = createTreeModel('pine');
      } else if (item.type === 'oak') {
        meshObj = createTreeModel('oak');
      } else {
        meshObj = createRockModel(item.scale);
      }
      return {
        ...item,
        model: meshObj,
      };
    });
  }, []);

  // Instanced procedural grass tufts distributed across northern & southern fields
  const grassMesh = useMemo(() => {
    // 2-plane crossed blade geometry for natural volume
    const bladeW = 0.45;
    const bladeH = 0.55;
    const g1 = new THREE.PlaneGeometry(bladeW, bladeH);
    g1.translate(0, bladeH / 2, 0);
    const g2 = g1.clone();
    g2.rotateY(Math.PI / 2);

    const pos1 = g1.attributes.position.array;
    const pos2 = g2.attributes.position.array;
    const combinedPositions = new Float32Array(pos1.length + pos2.length);
    combinedPositions.set(pos1, 0);
    combinedPositions.set(pos2, pos1.length);

    const grassGeo = new THREE.BufferGeometry();
    grassGeo.setAttribute('position', new THREE.BufferAttribute(combinedPositions, 3));

    const idx1 = g1.index?.array || [];
    const idx2 = g2.index?.array || [];
    const combinedIndices = new Uint32Array(idx1.length + idx2.length);
    combinedIndices.set(idx1, 0);
    for (let i = 0; i < idx2.length; i++) {
      combinedIndices[idx1.length + i] = idx2[i] + 4;
    }
    grassGeo.setIndex(new THREE.BufferAttribute(combinedIndices, 1));
    grassGeo.computeVertexNormals();
    grassGeo.computeBoundingSphere();
    grassGeo.computeBoundingBox();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const GRASS_COUNT = 1200;
    const mesh = new THREE.InstancedMesh(grassGeo, grassMat, GRASS_COUNT);

    let seed = 777;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const dummy = new THREE.Object3D();
    const northBorealGrass = new THREE.Color('#224233');
    const northFrostMoss = new THREE.Color('#385e49');
    const southLushGrass = new THREE.Color('#558b2f');
    const southGoldenWheat = new THREE.Color('#ca8a04');
    const tempColor = new THREE.Color();

    let placed = 0;
    for (let i = 0; i < GRASS_COUNT * 2 && placed < GRASS_COUNT; i++) {
      const x = -360 + random() * 720;
      const z = -360 + random() * 720;

      // Skip the Great Divide river channel and bridge highway
      if (Math.abs(z) <= 24 || (Math.abs(x) <= 12 && Math.abs(z) <= 30)) {
        continue;
      }

      const y = getTerrainHeight(x, z);
      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.y = random() * Math.PI;
      const s = 0.75 + random() * 0.55;
      dummy.scale.set(s, s * (0.8 + random() * 0.4), s);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed, dummy.matrix);

      if (z < -24) {
        tempColor.lerpColors(northBorealGrass, northFrostMoss, random());
      } else {
        tempColor.lerpColors(southLushGrass, southGoldenWheat, random() * 0.4);
      }
      mesh.setColorAt(placed, tempColor);
      placed++;
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;

    return mesh;
  }, []);

  return (
    <group name="OpenWorldTerrain_Root">
      {/* Physics Surface with Rapier Trimesh Collider */}
      <RigidBody type="fixed" colliders={false} name="TerrainPhysicsBody">
        <TrimeshCollider args={[vertices, indices]} />
        <mesh geometry={geometry} receiveShadow castShadow>
          <meshStandardMaterial
            vertexColors
            roughness={0.88}
            metalness={0.08}
            flatShading
          />
        </mesh>
      </RigidBody>

      {/* Lush Instanced Grass Tufts */}
      <primitive object={grassMesh} />

      {/* Decorative Environmental Foliage */}
      <group name="TerrainFoliage">
        {foliageInstances.map((item, idx) => (
          <group
            key={`foliage_${idx}`}
            position={item.pos}
            scale={[item.scale, item.scale, item.scale]}
          >
            <primitive object={item.model} />
          </group>
        ))}
      </group>
    </group>
  );
}

export default OpenWorldTerrain;
