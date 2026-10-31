'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import {
  Shield,
  Sparkles,
  FlaskConical,
  Coins,
  Music,
  ShoppingBag,
  Store,
  Flame,
  ArrowRight,
} from 'lucide-react';

import {
  createMarketStallModel,
  createForgeStationModel,
  createArcaneAltarModel,
  ShopTheme,
} from '@/lib/assets/shopModels';
import { soundManager } from '@/lib/audio/SoundManager';

export interface ShopWorldEntityProps {
  shopId: string;
  name: string;
  shopkeeperName: string;
  shopkeeperRole: string;
  theme: ShopTheme;
  position: [number, number, number];
  rotationY?: number;
  playerPosition?: [number, number, number] | { x: number; y: number; z: number };
  onOpenShop?: (shopId: string) => void;
  canopyColor?: string;
  stripeColor?: string;
}

const THEME_CONFIG: Record<
  ShopTheme,
  {
    canopy: string;
    stripe: string;
    beaconColor: string;
    accentClass: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    emoji: string;
  }
> = {
  armory: {
    canopy: '#1e293b',
    stripe: '#991b1b',
    beaconColor: '#f97316',
    accentClass: 'from-orange-500/20 to-red-950/40 border-orange-500/60 text-orange-300',
    badgeBg: 'bg-orange-500/20',
    badgeBorder: 'border-orange-500/50',
    badgeText: 'text-orange-400',
    emoji: '⚒️',
  },
  apothecary: {
    canopy: '#064e3b',
    stripe: '#a7f3d0',
    beaconColor: '#10b981',
    accentClass: 'from-emerald-500/20 to-teal-950/40 border-emerald-500/60 text-emerald-300',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/50',
    badgeText: 'text-emerald-400',
    emoji: '🧪',
  },
  arcane: {
    canopy: '#1e1b4b',
    stripe: '#7c3aed',
    beaconColor: '#8b5cf6',
    accentClass: 'from-purple-500/20 to-indigo-950/40 border-purple-500/60 text-purple-300',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/50',
    badgeText: 'text-purple-400',
    emoji: '🔮',
  },
  silk: {
    canopy: '#b45309',
    stripe: '#f59e0b',
    beaconColor: '#f59e0b',
    accentClass: 'from-amber-500/20 to-amber-950/40 border-amber-500/60 text-amber-300',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/50',
    badgeText: 'text-amber-400',
    emoji: '🧵',
  },
  trinket: {
    canopy: '#831843',
    stripe: '#fcd34d',
    beaconColor: '#ec4899',
    accentClass: 'from-pink-500/20 to-rose-950/40 border-pink-500/60 text-pink-300',
    badgeBg: 'bg-pink-500/20',
    badgeBorder: 'border-pink-500/50',
    badgeText: 'text-pink-400',
    emoji: '🎵',
  },
  general: {
    canopy: '#78350f',
    stripe: '#fef08a',
    beaconColor: '#eab308',
    accentClass: 'from-yellow-500/20 to-amber-950/40 border-yellow-500/60 text-yellow-300',
    badgeBg: 'bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/50',
    badgeText: 'text-yellow-400',
    emoji: '⚖️',
  },
};

/**
 * 3D Physical Open-World Shop Entity
 * Complete with Rapier physics RigidBody colliders, 15m vertical light beacon,
 * and 4.5m medieval floating prompt with [E] keyboard interaction.
 */
export function ShopWorldEntity({
  shopId,
  name,
  shopkeeperName,
  shopkeeperRole,
  theme,
  position,
  rotationY = 0,
  playerPosition,
  onOpenShop,
  canopyColor: customCanopy,
  stripeColor: customStripe,
}: ShopWorldEntityProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const beaconMeshRef = useRef<THREE.Mesh>(null);
  const beaconRingRef = useRef<THREE.Mesh>(null);

  const [isNear, setIsNear] = useState<boolean>(false);
  const [isBeaconVisible, setIsBeaconVisible] = useState<boolean>(false);

  const themeInfo = THEME_CONFIG[theme] || THEME_CONFIG.general;
  const canopy = customCanopy || themeInfo.canopy;
  const stripe = customStripe || themeInfo.stripe;

  // 1. Procedural 3D Mesh Assemblies
  const stallModel = useMemo(() => {
    return createMarketStallModel({
      canopyColor: canopy,
      stripeColor: stripe,
      theme,
      stallName: name,
    });
  }, [canopy, stripe, theme, name]);

  const forgeModel = useMemo(() => {
    if (theme === 'armory') {
      return createForgeStationModel();
    }
    return null;
  }, [theme]);

  const altarModel = useMemo(() => {
    if (theme === 'arcane') {
      return createArcaneAltarModel();
    }
    return null;
  }, [theme]);

  // Handle Trade / Enter Shop action
  const handleOpen = useCallback(() => {
    soundManager.playCoinClink();
    onOpenShop?.(shopId);

    // Global custom event broadcast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sovereign-open-shop', {
          detail: {
            shopId,
            name,
            shopkeeperName,
            shopkeeperRole,
            theme,
          },
        })
      );
    }
  }, [shopId, name, shopkeeperName, shopkeeperRole, theme, onOpenShop]);

  // Listen for 'E' keypress when player is in close proximity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if ((e.key === 'e' || e.key === 'E') && isNear) {
        handleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, handleOpen]);

  // Clean-up near shop state on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sovereign-near-shop', {
            detail: { shopId, isNear: false },
          })
        );
      }
    };
  }, [shopId]);

  // Frame loop: distance checking and live prop animations
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;

    // 1. Distance measurement to player
    if (playerPosition) {
      const px = Array.isArray(playerPosition) ? playerPosition[0] : playerPosition.x;
      const pz = Array.isArray(playerPosition) ? playerPosition[2] : playerPosition.z;
      const dist = Math.hypot(px - position[0], pz - position[2]);

      const near = dist <= 4.5;
      const beaconNear = dist <= 15.0;

      if (near !== isNear) {
        setIsNear(near);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sovereign-near-shop', {
              detail: {
                shopId,
                name,
                shopkeeperName,
                shopkeeperRole,
                theme,
                isNear: near,
              },
            })
          );
        }
      }

      if (beaconNear !== isBeaconVisible) {
        setIsBeaconVisible(beaconNear);
      }
    }

    // 2. Animate subtle swinging sign & hanging lantern
    const shopSign = stallModel.getObjectByName('Shop_Sign');
    if (shopSign) {
      shopSign.rotation.z = Math.sin(time * 1.8) * 0.06;
    }
    const lantern = stallModel.getObjectByName('Stall_Lantern');
    if (lantern) {
      lantern.rotation.x = Math.sin(time * 1.4) * 0.04;
      lantern.rotation.z = Math.cos(time * 1.2) * 0.03;
    }

    // 3. Themed prop animations (floating crystals, glowing coals)
    const floatingCrystal = stallModel.getObjectByName('floatingCrystal');
    if (floatingCrystal) {
      floatingCrystal.rotation.y += delta * 0.8;
      floatingCrystal.rotation.x = Math.sin(time * 1.5) * 0.15;
      floatingCrystal.position.y = 0.98 + 0.55 + Math.sin(time * 2.2) * 0.06;
    }

    if (forgeModel) {
      const coals = forgeModel.getObjectByName('glowingCoals') as THREE.Mesh;
      if (coals && coals.material instanceof THREE.MeshStandardMaterial) {
        coals.material.emissiveIntensity = 2.0 + Math.sin(time * 4) * 0.6;
      }
    }

    if (altarModel) {
      const altarCrystal = altarModel.getObjectByName('hoveringAltarCrystal') as THREE.Mesh;
      if (altarCrystal) {
        altarCrystal.rotation.y += delta * 0.7;
        altarCrystal.position.y = 2.15 + Math.sin(time * 2) * 0.1;
      }
    }

    // 4. Subtle beacon animation
    if (beaconMeshRef.current && beaconRingRef.current) {
      const pulse = 0.28 + Math.sin(time * 2.5) * 0.08;
      (beaconMeshRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      (beaconRingRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 1.4;
      beaconRingRef.current.rotation.z += delta * 0.2;
    }
  });

  // Icon component helper
  const renderThemeIcon = () => {
    switch (theme) {
      case 'armory':
        return <Shield className="w-5 h-5 text-orange-400" />;
      case 'apothecary':
        return <FlaskConical className="w-5 h-5 text-emerald-400" />;
      case 'arcane':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'silk':
        return <ShoppingBag className="w-5 h-5 text-amber-400" />;
      case 'trinket':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'general':
      default:
        return <Coins className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <group ref={rootGroupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* ========================================================================= */}
      {/*                     15M VERTICAL LIGHT BEACON                             */}
      {/* ========================================================================= */}
      {isBeaconVisible && (
        <group position={[0, 0, 0]}>
          {/* Subtle Vertical Light Cylinder */}
          <mesh ref={beaconMeshRef} position={[0, 10, 0]}>
            <cylinderGeometry args={[0.2, 0.45, 20, 16, 1, true]} />
            <meshBasicMaterial
              color={themeInfo.beaconColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Glowing Ground Rune Ring */}
          <mesh
            ref={beaconRingRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.05, 0]}
          >
            <ringGeometry args={[0.5, 1.8, 32]} />
            <meshBasicMaterial
              color={themeInfo.beaconColor}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Ambient Beacon Glow Light */}
          <pointLight
            color={themeInfo.beaconColor}
            intensity={isNear ? 1.6 : 0.8}
            distance={7}
            position={[0, 1.8, 0]}
          />
        </group>
      )}

      {/* ========================================================================= */}
      {/*               RAPIER PHYSICS RIGIDBODY & COLLIDERS                        */}
      {/* ========================================================================= */}
      <RigidBody
        type="fixed"
        colliders={false}
        name={`RigidBody_Shop_${shopId}`}
      >
        {/* Market Stall Main Counter & Shelf Collider */}
        <CuboidCollider args={[1.6, 1.4, 1.2]} position={[0, 1.4, 0]} />

        {/* Forge Station Physical Collider */}
        {theme === 'armory' && (
          <CuboidCollider args={[1.5, 1.2, 1.0]} position={[-2.8, 1.2, 0.4]} />
        )}

        {/* Arcane Altar Physical Collider */}
        {theme === 'arcane' && (
          <CuboidCollider args={[1.8, 1.2, 1.8]} position={[-3.2, 1.2, 0]} />
        )}

        {/* ======================================================================= */}
        {/*                       3D PROCEDURAL SHOP MESHES                         */}
        {/* ======================================================================= */}
        <primitive object={stallModel} />

        {forgeModel && (
          <primitive
            object={forgeModel}
            position={[-2.8, 0, 0.4]}
            rotation={[0, 0.2, 0]}
          />
        )}

        {altarModel && (
          <primitive
            object={altarModel}
            position={[-3.2, 0, 0]}
            rotation={[0, 0.4, 0]}
          />
        )}
      </RigidBody>

      {/* ========================================================================= */}
      {/*          4.5M PROXIMITY PROMPT: [E] TRADE / ENTER SHOP                   */}
      {/* ========================================================================= */}
      {isNear && (
        <Html
          position={[0, 2.3, 0.4]}
          center
          distanceFactor={9}
          zIndexRange={[60, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            className="group cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Dark medieval glass & parchment pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 border-amber-400/80 bg-zinc-950/95 shadow-2xl backdrop-blur-md text-amber-100">
              {/* Theme Icon Badge */}
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl border ${themeInfo.badgeBg} ${themeInfo.badgeBorder} shadow-inner`}
              >
                {renderThemeIcon()}
              </div>

              {/* Shop & Shopkeeper Titles */}
              <div className="flex flex-col text-left pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-sm tracking-wide text-amber-200 leading-tight">
                    {name}
                  </span>
                  <span className="text-xs">{themeInfo.emoji}</span>
                </div>
                <span className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  <strong className="text-zinc-300">{shopkeeperName}</strong> • {shopkeeperRole}
                </span>
              </div>

              {/* [E] Trade / Enter Shop Keycap Button */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wider shadow-lg transition-all group-hover:shadow-amber-500/30">
                <span className="px-1.5 py-0.5 rounded bg-zinc-950/30 font-mono text-[11px] border border-zinc-950/20">
                  E
                </span>
                <span>TRADE</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
