'use client';

import React, { useMemo, useEffect } from 'react';
import { getTerrainHeight } from '@/lib/world/parcelCoordinates';
import { ShopWorldEntity } from './ShopWorldEntity';
import { ShopTheme } from '@/lib/assets/shopModels';

export interface ShopConfig {
  id: string;
  name: string;
  shopkeeper: string;
  shopkeeperRole: string;
  theme: ShopTheme;
  coords: [number, number]; // [X, Z]
  rotY: number;
  badge: string;
  color: string;
}

/**
 * 6 Open-World Shops & Merchant Establishments across Sovereign Lands
 */
export const CONTINENT_SHOPS: ShopConfig[] = [
  {
    id: 'armory_torvald',
    name: 'Frostfang Forge & Armory',
    shopkeeper: 'Master Torvald',
    shopkeeperRole: 'Master Weaponsmith',
    theme: 'armory',
    coords: [-22, -120],
    rotY: -0.4,
    badge: '⚒️',
    color: '#f97316',
  },
  {
    id: 'apothecary_beatrice',
    name: 'Sanctuary Apothecary',
    shopkeeper: 'Sister Beatrice',
    shopkeeperRole: 'Herbalist & Alchemist',
    theme: 'apothecary',
    coords: [-80, -132],
    rotY: 0.3,
    badge: '🧪',
    color: '#10b981',
  },
  {
    id: 'arcane_observatory',
    name: 'The Arcane Reliquary',
    shopkeeper: 'Archmage Vaelin',
    shopkeeperRole: 'Relic Master & Mage',
    theme: 'arcane',
    coords: [-94, -96],
    rotY: 0.6,
    badge: '🔮',
    color: '#8b5cf6',
  },
  {
    id: 'guild_cedric',
    name: 'Boreal Merchant Guild',
    shopkeeper: 'Cedric the Trader',
    shopkeeperRole: 'Guild Quartermaster',
    theme: 'general',
    coords: [-56, -114],
    rotY: 0.1,
    badge: '⚖️',
    color: '#eab308',
  },
  {
    id: 'bazaar_zara',
    name: 'Solara Silk & Curio Bazaar',
    shopkeeper: 'Zara the Nomad',
    shopkeeperRole: 'Silk Trader & Smuggler',
    theme: 'silk',
    coords: [15, 45],
    rotY: -0.5,
    badge: '🧵',
    color: '#f59e0b',
  },
  {
    id: 'minstrel_lyra',
    name: "Minstrel's Curio Cart",
    shopkeeper: 'Lyra the Bard',
    shopkeeperRole: 'Wandering Minstrel',
    theme: 'trinket',
    coords: [-46, -94],
    rotY: 0.8,
    badge: '🎵',
    color: '#ec4899',
  },
];

export interface ShopWorldManagerProps {
  playerPosition?: [number, number, number] | { x: number; y: number; z: number };
  onOpenShop?: (shopId: string) => void;
}

/**
 * Sovereign Lands - Open World Shop Manager
 * Renders all 6 continental market stalls, forge stations, and arcane altars
 * snapped to procedural terrain elevation heights.
 * Broadcasts static shop waypoints so RadarMiniMap and CompassHeading display shop icons.
 */
export function ShopWorldManager({
  playerPosition,
  onOpenShop,
}: ShopWorldManagerProps) {
  // Pre-calculate exact terrain-snapped 3D positions for each shop
  const snappedShops = useMemo(() => {
    return CONTINENT_SHOPS.map((shop) => {
      const terrainY = getTerrainHeight(shop.coords[0], shop.coords[1]);
      return {
        ...shop,
        position: [shop.coords[0], terrainY, shop.coords[1]] as [number, number, number],
      };
    });
  }, []);

  // Broadcast shop locations as static waypoints for minimap, radar, and compass HUDs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shopWaypoints = CONTINENT_SHOPS.map((s) => ({
      id: s.id,
      label: s.name,
      role: `${s.shopkeeper} • ${s.shopkeeperRole}`,
      worldX: s.coords[0],
      worldZ: s.coords[1],
      type: 'shop' as const,
      color: s.color,
      badge: s.badge,
      theme: s.theme,
    }));

    // Broadcast event for HUDs and map systems
    window.dispatchEvent(
      new CustomEvent('sovereign-shop-waypoints', {
        detail: shopWaypoints,
      })
    );
  }, []);

  return (
    <group name="Sovereign_Open_World_Shops">
      {snappedShops.map((shop) => (
        <ShopWorldEntity
          key={shop.id}
          shopId={shop.id}
          name={shop.name}
          shopkeeperName={shop.shopkeeper}
          shopkeeperRole={shop.shopkeeperRole}
          theme={shop.theme}
          position={shop.position}
          rotationY={shop.rotY}
          playerPosition={playerPosition}
          onOpenShop={onOpenShop}
        />
      ))}
    </group>
  );
}

export default ShopWorldManager;
