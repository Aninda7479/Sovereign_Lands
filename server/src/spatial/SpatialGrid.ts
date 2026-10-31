/**
 * SpatialGrid.ts
 * 2D Spatial Partitioning Grid (50m x 50m cells) for Interest Management in Sovereign Lands.
 * Drastically reduces broadcast bandwidth by filtering tick updates only to players in adjacent cells.
 */

export interface Position2D {
  x: number;
  z: number;
}

export interface PlayerSpatialEntry {
  x: number;
  z: number;
  cellKey: string;
}

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly cells: Map<string, Set<string>> = new Map();
  private readonly playerPositions: Map<string, PlayerSpatialEntry> = new Map();

  /**
   * @param cellSize Size of each square grid cell in meters (default 50m).
   */
  constructor(cellSize = 50) {
    this.cellSize = cellSize > 0 ? cellSize : 50;
  }

  /**
   * Computes the cell coordinate index for a world coordinate.
   */
  public coordToCellIndex(coord: number): number {
    return Math.floor(coord / this.cellSize);
  }

  /**
   * Computes the string key for a given cell coordinate index pair.
   */
  public getCellKey(cellX: number, cellZ: number): string {
    return `${cellX}:${cellZ}`;
  }

  /**
   * Computes the cell key for a given world (x, z) coordinate.
   */
  public getCellKeyForPosition(x: number, z: number): string {
    const cx = this.coordToCellIndex(x);
    const cz = this.coordToCellIndex(z);
    return this.getCellKey(cx, cz);
  }

  /**
   * Inserts a player into the grid.
   */
  public insert(playerId: string, x: number, z: number): void {
    if (this.playerPositions.has(playerId)) {
      this.update(playerId, x, z);
      return;
    }

    const cellKey = this.getCellKeyForPosition(x, z);
    let cellSet = this.cells.get(cellKey);
    if (!cellSet) {
      cellSet = new Set();
      this.cells.set(cellKey, cellSet);
    }
    cellSet.add(playerId);

    this.playerPositions.set(playerId, { x, z, cellKey });
  }

  /**
   * Updates a player's position in the grid.
   * If the player crosses a cell boundary, moves them to the new cell.
   * @returns true if the player changed cells, false otherwise.
   */
  public update(playerId: string, x: number, z: number): boolean {
    const existing = this.playerPositions.get(playerId);
    if (!existing) {
      this.insert(playerId, x, z);
      return true;
    }

    existing.x = x;
    existing.z = z;

    const newCellKey = this.getCellKeyForPosition(x, z);
    if (existing.cellKey !== newCellKey) {
      // Remove from old cell
      const oldCell = this.cells.get(existing.cellKey);
      if (oldCell) {
        oldCell.delete(playerId);
        if (oldCell.size === 0) {
          this.cells.delete(existing.cellKey);
        }
      }

      // Add to new cell
      let newCell = this.cells.get(newCellKey);
      if (!newCell) {
        newCell = new Set();
        this.cells.set(newCellKey, newCell);
      }
      newCell.add(playerId);

      existing.cellKey = newCellKey;
      return true;
    }

    return false;
  }

  /**
   * Removes a player from the spatial grid.
   */
  public remove(playerId: string): void {
    const existing = this.playerPositions.get(playerId);
    if (!existing) return;

    const cell = this.cells.get(existing.cellKey);
    if (cell) {
      cell.delete(playerId);
      if (cell.size === 0) {
        this.cells.delete(existing.cellKey);
      }
    }

    this.playerPositions.delete(playerId);
  }

  /**
   * Retrieves all player IDs within the specified cell radius (default 1 = 3x3 adjacent cells, ~100-150m).
   */
  public getNearbyPlayerIds(x: number, z: number, cellRadius = 1): string[] {
    const centerCx = this.coordToCellIndex(x);
    const centerCz = this.coordToCellIndex(z);
    const nearby = new Set<string>();

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = this.getCellKey(centerCx + dx, centerCz + dz);
        const cell = this.cells.get(key);
        if (cell) {
          for (const pid of cell) {
            nearby.add(pid);
          }
        }
      }
    }

    return Array.from(nearby);
  }

  /**
   * Retrieves all player IDs within a strict metric radius (e.g. 100 meters).
   * Uses spatial grid cell pre-filtering followed by exact Euclidean distance.
   */
  public getNearbyPlayersWithinRadius(
    x: number,
    z: number,
    maxRadiusMeters: number
  ): string[] {
    const cellRadius = Math.ceil(maxRadiusMeters / this.cellSize);
    const candidateIds = this.getNearbyPlayerIds(x, z, cellRadius);
    const maxDistSq = maxRadiusMeters * maxRadiusMeters;

    const result: string[] = [];
    for (const pid of candidateIds) {
      const pos = this.playerPositions.get(pid);
      if (pos) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        if (dx * dx + dz * dz <= maxDistSq) {
          result.push(pid);
        }
      }
    }

    return result;
  }

  /**
   * Returns a player's current recorded 2D position.
   */
  public getPlayerPosition(playerId: string): Position2D | undefined {
    const entry = this.playerPositions.get(playerId);
    if (!entry) return undefined;
    return { x: entry.x, z: entry.z };
  }

  /**
   * Returns total count of tracked players.
   */
  public getPlayerCount(): number {
    return this.playerPositions.size;
  }

  /**
   * Returns total count of active grid cells.
   */
  public getCellCount(): number {
    return this.cells.size;
  }

  /**
   * Clears the entire spatial grid.
   */
  public clear(): void {
    this.cells.clear();
    this.playerPositions.clear();
  }
}
