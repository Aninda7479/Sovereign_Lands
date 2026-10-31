'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

export interface WaterRiverProps {
  riverWidth?: number; // Z-axis width of the river (e.g. 40m, Z from -20 to 20)
  riverLength?: number; // X-axis span (e.g. 1000m)
  waterLevel?: number;
}

/**
 * The Great Divide: River & Great Stone Bridge.
 * Separates North and South kingdoms along Z = 0.
 * Animated flowing water surface with normal map ripples, plus a fortified stone bridge with Rapier physics.
 */
export function WaterRiver({
  riverWidth = 40,
  riverLength = 1000,
  waterLevel = 0.0,
}: WaterRiverProps) {
  const waterMeshRef = useRef<THREE.Mesh>(null);
  const waterMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Load water normal map from textures
  const normalMap = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const tex = textureLoader.load('/textures/water_normal.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(25, 3);
    return tex;
  }, []);

  // Animate water ripples and surface flow
  useFrame((_, delta) => {
    if (normalMap) {
      normalMap.offset.x += delta * 0.035;
      normalMap.offset.y += delta * 0.015;
    }
  });

  return (
    <group name="GreatDivide_River_System">
      {/* =================================================================== */}
      {/*                        FLOWING RIVER SURFACE                        */}
      {/* =================================================================== */}
      <mesh
        ref={waterMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, waterLevel, 0]}
        receiveShadow
      >
        <planeGeometry args={[riverLength, riverWidth, 64, 8]} />
        <meshStandardMaterial
          ref={waterMaterialRef}
          color="#0284c7"
          emissive="#082f49"
          emissiveIntensity={0.2}
          roughness={0.08}
          metalness={0.25}
          transparent
          opacity={0.88}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
        />
      </mesh>

      {/* =================================================================== */}
      {/*                  THE GREAT STONE CROSSING BRIDGE                   */}
      {/* =================================================================== */}
      <RigidBody type="fixed" colliders={false} name="GreatStoneBridge">
        {/* Bridge Main Road Deck (Width 12m, Length 52m across Z from -26 to 26) */}
        <CuboidCollider args={[6.0, 0.4, 26]} position={[0, 1.2, 0]} />

        {/* Left Parapet Wall Collider */}
        <CuboidCollider args={[0.5, 0.8, 26]} position={[-5.8, 2.0, 0]} />

        {/* Right Parapet Wall Collider */}
        <CuboidCollider args={[0.5, 0.8, 26]} position={[5.8, 2.0, 0]} />

        {/* 3D Visual Mesh for Bridge */}
        <group position={[0, 0, 0]}>
          {/* Main Road Deck */}
          <mesh position={[0, 1.1, 0]} receiveShadow castShadow>
            <boxGeometry args={[12, 0.6, 52]} />
            <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
          </mesh>

          {/* Underbridge Stone Piers / Arches (3 massive river pillars) */}
          {[-16, 0, 16].map((zPos, idx) => (
            <group key={idx} position={[0, 0, zPos]}>
              {/* Arch column */}
              <mesh position={[0, -0.5, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[2.8, 3.5, 4.0, 8]} />
                <meshStandardMaterial color="#334155" roughness={0.95} flatShading />
              </mesh>
              {/* Cutwater prow (pointed prow to break river current) */}
              <mesh position={[3.6, -0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <coneGeometry args={[1.5, 2.0, 4]} />
                <meshStandardMaterial color="#1e293b" roughness={0.95} flatShading />
              </mesh>
            </group>
          ))}

          {/* Left Stone Balustrade / Parapet */}
          <mesh position={[-5.7, 1.8, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.6, 0.9, 52]} />
            <meshStandardMaterial color="#334155" roughness={0.85} flatShading />
          </mesh>

          {/* Right Stone Balustrade / Parapet */}
          <mesh position={[5.7, 1.8, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.6, 0.9, 52]} />
            <meshStandardMaterial color="#334155" roughness={0.85} flatShading />
          </mesh>

          {/* Bridge Decorative Corner Pillars & Lantern Posts */}
          {[
            [-5.7, -25],
            [5.7, -25],
            [-5.7, 0],
            [5.7, 0],
            [-5.7, 25],
            [5.7, 25],
          ].map(([px, pz], pIdx) => (
            <group key={`pillar_${pIdx}`} position={[px, 1.5, pz]}>
              <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[0.9, 1.6, 0.9]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} flatShading />
              </mesh>
              {/* Torch Lantern Top */}
              <mesh position={[0, 1.7, 0]}>
                <sphereGeometry args={[0.22, 6, 6]} />
                <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={2} />
              </mesh>
            </group>
          ))}
        </group>
      </RigidBody>
    </group>
  );
}

export default WaterRiver;
