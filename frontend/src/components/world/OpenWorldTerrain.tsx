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
