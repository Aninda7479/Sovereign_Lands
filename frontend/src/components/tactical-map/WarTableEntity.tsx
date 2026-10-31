'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Map, Sparkles } from 'lucide-react';

export interface WarTableEntityProps {
  position?: [number, number, number];
  kingdom?: 'North' | 'South';
  onOpenWarTable?: () => void;
  playerPosition?: [number, number, number] | { x: number; y: number; z: number };
}

/**
 * 3D Citadel War Table Entity
 * Detailed carved oak war room table with candle braziers and an aerial holographic projection
 * of the Sovereign Lands realm floating above the tabletop.
 */
export function WarTableEntity({
  position = [25, 1.4, -95],
  kingdom = 'North',
  onOpenWarTable,
  playerPosition,
}: WarTableEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hologramRef = useRef<THREE.Group>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState<boolean>(false);

  // Proximity threshold: 4 meters
  const interactionRadius = 4.0;

  // Listen for 'E' keypress when player is nearby
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if ((e.key === 'e' || e.key === 'E') && isNear) {
        onOpenWarTable?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, onOpenWarTable]);

  // Per-frame animation for hologram hover/rotation and candle flame flicker
  useFrame((_, delta) => {
    // 1. Hologram floating bob and slow tactical rotation
    if (hologramRef.current) {
      hologramRef.current.rotation.y += delta * 0.25;
      hologramRef.current.position.y = 1.35 + Math.sin(Date.now() * 0.002) * 0.04;
    }

    // 2. Candle flame flicker
    const time = Date.now() * 0.01;
    if (flame1Ref.current) {
      flame1Ref.current.scale.set(
        0.8 + Math.sin(time * 1.5) * 0.2,
        0.9 + Math.cos(time * 2.1) * 0.25,
        0.8 + Math.sin(time * 1.5) * 0.2
      );
    }
    if (flame2Ref.current) {
      flame2Ref.current.scale.set(
        0.8 + Math.cos(time * 1.7) * 0.2,
        0.9 + Math.sin(time * 1.9) * 0.25,
        0.8 + Math.cos(time * 1.7) * 0.2
      );
    }

    // 3. Distance check with player
    if (playerPosition && groupRef.current) {
      const px = Array.isArray(playerPosition) ? playerPosition[0] : playerPosition.x;
      const pz = Array.isArray(playerPosition) ? playerPosition[2] : playerPosition.z;
      const dist = Math.hypot(px - position[0], pz - position[2]);
      const near = dist <= interactionRadius;
      if (near !== isNear) {
        setIsNear(near);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onOpenWarTable?.();
      }}
    >
      {/* ========================================================================= */}
      {/*                         CARVED OAK WAR TABLE                              */}
      {/* ========================================================================= */}

      {/* Main Table Top Slab */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.2, 2.8]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Table Chamfer Rim / Border Trim */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[4.3, 0.06, 2.9]} />
        <meshStandardMaterial color="#3d271d" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* 4 Heavy Carved Oak Legs with Bronze Feet */}
      {[
        [-1.8, 0.42, -1.1],
        [1.8, 0.42, -1.1],
        [-1.8, 0.42, 1.1],
        [1.8, 0.42, 1.1],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.09, 0.85, 8]} />
            <meshStandardMaterial color="#1f140e" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.13, 0.14, 0.08, 8]} />
            <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Heavy Cross Stretcher Beam */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#24160f" roughness={0.9} />
      </mesh>

      {/* Rolled Ancient Map Parchments on tabletop */}
      <mesh position={[0, 0.97, 0]} rotation={[-Math.PI / 2, 0, 0.05]} receiveShadow>
        <planeGeometry args={[3.2, 2.1]} />
        <meshStandardMaterial color="#d4a373" roughness={0.9} />
      </mesh>

      {/* Pewter Candleholder Left */}
      <group position={[-1.6, 0.96, 0.9]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.14, 0.22, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Wax candle */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
        {/* Flickering Flame */}
        <mesh ref={flame1Ref} position={[0, 0.32, 0]}>
          <coneGeometry args={[0.04, 0.12, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <pointLight color="#f59e0b" intensity={1.2} distance={5} />
      </group>

      {/* Pewter Candleholder Right */}
      <group position={[1.6, 0.96, -0.9]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.14, 0.22, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Wax candle */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
        {/* Flickering Flame */}
        <mesh ref={flame2Ref} position={[0, 0.32, 0]}>
          <coneGeometry args={[0.04, 0.12, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <pointLight color="#f59e0b" intensity={1.2} distance={5} />
      </group>

      {/* ========================================================================= */}
      {/*             FLOATING 3D AERIAL HOLOGRAPHIC PROJECTION                     */}
      {/* ========================================================================= */}
      <group ref={hologramRef} position={[0, 1.35, 0]}>
        {/* Holographic Emitter Base Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
          <ringGeometry args={[0.8, 0.95, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* Hologram North Kingdom Terrain Slab (Cyan Glow) */}
        <mesh position={[0, 0, -0.45]}>
          <boxGeometry args={[2.2, 0.08, 0.8]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#38bdf8"
            emissiveIntensity={0.6}
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>

        {/* Great Divide River Channel (Deep Glowing Blue Line) */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[2.4, 0.03, 0.15]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#22d3ee"
            emissiveIntensity={0.9}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Hologram Bridge Crossing Causeway */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.18, 0.06, 0.35]} />
          <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.8} />
        </mesh>

        {/* Hologram South Kingdom Terrain Slab (Amber Glow) */}
        <mesh position={[0, 0, 0.45]}>
          <boxGeometry args={[2.2, 0.08, 0.8]} />
          <meshStandardMaterial
            color="#b45309"
            emissive="#f59e0b"
            emissiveIntensity={0.6}
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>

        {/* Miniature Citadel Castle Keeps (North & South) */}
        <mesh position={[-0.5, 0.14, -0.6]}>
          <boxGeometry args={[0.16, 0.22, 0.16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0.5, 0.14, 0.6]}>
          <boxGeometry args={[0.16, 0.22, 0.16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.9} />
        </mesh>

        {/* Ambient Hologram Point Light */}
        <pointLight color="#38bdf8" intensity={0.8} distance={3} />
      </group>

      {/* ========================================================================= */}
      {/*               PROXIMITY PROMPT: [E] EXAMINE WAR TABLE                     */}
      {/* ========================================================================= */}
      {isNear && (
        <Html
          position={[0, 1.8, 0]}
          center
          distanceFactor={9}
          zIndexRange={[60, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenWarTable?.();
            }}
            className="group cursor-pointer flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 border-amber-400/90 bg-zinc-950/95 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-amber-200"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500/30 border border-amber-400 font-mono font-bold text-sm text-amber-300 shadow-inner group-hover:animate-bounce">
              E
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-xs tracking-wide leading-tight text-amber-100">
                Examine Citadel War Table
              </span>
              <span className="text-[10px] text-zinc-400 font-sans mt-0.5">
                Consult High Strategist & View 3D Holographic Map
              </span>
            </div>
            <span className="text-xs text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
              ▶
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default WarTableEntity;
