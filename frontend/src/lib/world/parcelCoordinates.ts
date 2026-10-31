/**
 * Sovereign Lands - 3D Continuous World Coordinates & Spatial Geometry
 * Manages continuous (X, Z) coordinate mapping, parcel bounding box calculations,
 * procedural terrain elevation, and kingdom territorial boundaries.
 */

export type KingdomType = 'North' | 'South' | 'None';

export interface ParcelBoundingBox {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface ParcelEntity {
  id: number;
  bounds: ParcelBoundingBox;
  kingdom: KingdomType;
  owner: string;
  structure: number; // 0=None, 1=Farmstead, 2=GuardTower, 3=StoneWall, 4=CastleKeep
  defenseRating?: number;
  attackRating?: number;
}

// World Boundary Constants
export const WORLD_CONSTANTS = {
  mapSize: 1000, // 1000m x 1000m total world
  riverMinZ: -20,
  riverMaxZ: 20,
  waterLevel: 0.0,
  bridgeWidth: 14,
  bridgeLength: 50,
  gridSnapSize: 2.0, // 2-meter grid snapping for structure placement
};

/**
 * Continuous procedural heightmap function.
 * Smoothly models rolling hills, river valley basin, bridge causeways, and mountain ridges.
 */
export function getTerrainHeight(x: number, z: number): number {
  // Bridge Causeway (Smooth raised highway crossing the Great Divide at X ~= 0)
  const distFromBridgeAxis = Math.abs(x);
  const isNearBridgeRoad = distFromBridgeAxis < 8 && Math.abs(z) < 28;
  if (isNearBridgeRoad) {
    // Arching bridge elevation: peaks at center (Y = 1.8m), connects to riverbanks at Y = 1.2m
    const bridgeArch = 1.8 - Math.pow(z / 25, 2) * 0.6;
    return bridgeArch;
  }

  // River Basin: The Great Divide river channel runs along Z = 0
  const riverDist = Math.abs(z);
  if (riverDist < 20) {
    // Smooth riverbed depression dipping below water level (Y = 0)
    const t = riverDist / 20; // 0 at river center, 1 at banks
    const bankHeight = 0.8;
    const riverBedDepth = -2.2;
    return riverBedDepth + (bankHeight - riverBedDepth) * (t * t);
  }

  // North Kingdom (Z < -20): Cold mountains and rolling rocky highlands
  if (z < -20) {
    const northDist = Math.abs(z) - 20;
    const baseSlope = (northDist / 400) * 8.0; // gradual rise up to +8m
    const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.02) * 4.5;
    const hill2 = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.03) * 2.2;
    const ridge = Math.abs(Math.sin((x + z) * 0.01)) * 3.0;
    return Math.max(0.6, 0.8 + baseSlope + hill1 + hill2 + ridge);
  }

  // South Kingdom (Z > 20): Fertile rolling plains and sunlit plateaus
  const southDist = z - 20;
  const baseSlope = (southDist / 400) * 5.5; // gentle rolling rise up to +5.5m
  const meadowHills = Math.sin(x * 0.018) * Math.cos(z * 0.015) * 3.5;
  const gentleRoll = Math.cos(x * 0.035 - z * 0.02) * 1.8;
  return Math.max(0.6, 0.8 + baseSlope + meadowHills + gentleRoll);
}

/**
 * Checks whether a 2D world coordinate (X, Z) is strictly inside a parcel bounding box.
 */
export function isPointInBounds(x: number, z: number, bounds: ParcelBoundingBox): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

/**
 * Finds the parcel that contains the given continuous 3D world position (X, Z).
 */
export function getParcelAtPosition(
  x: number,
  z: number,
  parcels: ParcelEntity[]
): ParcelEntity | null {
  for (const p of parcels) {
    if (isPointInBounds(x, z, p.bounds)) {
      return p;
    }
  }
  return null;
}

/**
 * Validates whether an entire structure footprint (width x depth centered at posX, posZ)
 * fits comfortably inside the parcel boundaries with a minimum safety margin.
 */
export function isStructureWithinBounds(
  posX: number,
  posZ: number,
  width: number,
  depth: number,
  bounds: ParcelBoundingBox,
  margin = 1.0
): boolean {
  const halfW = width / 2;
  const halfD = depth / 2;
  return (
    posX - halfW >= bounds.minX + margin &&
    posX + halfW <= bounds.maxX - margin &&
    posZ - halfD >= bounds.minZ + margin &&
    posZ + halfD <= bounds.maxZ - margin
  );
}

/**
 * Computes the geometric center (X, Y, Z) and dimensions of a parcel bounding box.
 */
export function calculateParcelCenter(bounds: ParcelBoundingBox): {
  centerX: number;
  centerZ: number;
  centerY: number;
  width: number;
  depth: number;
} {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const centerY = getTerrainHeight(centerX, centerZ);
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  return { centerX, centerZ, centerY, width, depth };
}

/**
 * Snaps a continuous coordinate to the nearest building placement grid increment.
 */
export function snapToGrid(value: number, step = WORLD_CONSTANTS.gridSnapSize): number {
  return Math.round(value / step) * step;
}

/**
 * Determines kingdom assignment according to continuous Z coordinates.
 */
export function determineKingdomByZ(minZ: number, maxZ: number): KingdomType {
  const midZ = (minZ + maxZ) / 2;
  if (midZ < 0) return 'North';
  if (midZ > 0) return 'South';
  return minZ < 0 ? 'North' : 'South';
}
