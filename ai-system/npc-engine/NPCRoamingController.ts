/**
 * Sovereign Lands - NPC Roaming & 3D Spatial AI Controller
 * Drives waypoint navigation, terrain hugging, idle behaviors, and player turn-to-face mechanics.
 */

import { NPCProfile, NPCWaypoint } from './NPCProfiles';
import { getTerrainHeight } from '../../frontend/src/lib/world/parcelCoordinates';

export type NPCBehaviorState =
  | 'idle'
  | 'walking'
  | 'inspecting'
  | 'warming_hands'
  | 'looking_around'
  | 'working'
  | 'conversing'
  | 'bowing'
  | 'saluting'
  | 'waving'
  | 'shrugging'
  | 'laughing'
  | 'gesturing'
  | 'thinking';

export interface NPCRoamingSnapshot {
  npcId: string;
  position: [number, number, number];
  rotationY: number;
  behaviorState: NPCBehaviorState;
  currentSpeed: number;
  activeBark?: string;
  isFacingPlayer: boolean;
  distanceToPlayer: number;
}

export class NPCRoamingController {
  public readonly profile: NPCProfile;

  private position: [number, number, number];
  private rotationY = 0;
  private currentWaypointIndex = 0;
  private dwellTimer = 0;
  private behaviorState: NPCBehaviorState = 'idle';
  private currentSpeed = 0;
  private isConversing = false;
  private activeBark?: string;
  private barkTimer = 0;
  private activeGesture?: NPCBehaviorState;
  private gestureTimer = 0;

  // Custom override target (e.g. from LLM spatial routine actions)
  private overrideTarget: [number, number, number] | null = null;
  private overrideDurationTimer = 0;

  // Proximity threshold settings (in meters)
  private readonly conversationRadius = 4.5;
  private readonly arrivalThreshold = 0.4;
  private readonly turnSpeed = 4.5; // radians per second

  constructor(profile: NPCProfile) {
    this.profile = profile;
    const spawn = profile.spawnPosition;
    const groundY = this.calculateGroundHeight(spawn[0], spawn[2]);
    this.position = [spawn[0], groundY, spawn[2]];
    this.dwellTimer = profile.waypoints[0]?.dwellTimeSeconds ?? 3;
    this.behaviorState = 'idle';
  }

  private calculateGroundHeight(x: number, z: number): number {
    try {
      return getTerrainHeight(x, z);
    } catch {
      return 1.0;
    }
  }

  /**
   * Set conversation state with player (stops walking and faces player)
   */
  public setConversing(conversing: boolean): void {
    this.isConversing = conversing;
    if (conversing) {
      this.behaviorState = 'conversing';
      this.currentSpeed = 0;
    } else {
      this.behaviorState = 'idle';
      this.dwellTimer = 2.0; // small pause before resuming walk
    }
  }

  /**
   * Override waypoint target dynamically (e.g. from Agent 08's LLM spatial action)
   */
  public setCustomAction(target: [number, number, number], duration = 6, barkText?: string): void {
    const groundY = this.calculateGroundHeight(target[0], target[2]);
    this.overrideTarget = [target[0], groundY, target[2]];
    this.overrideDurationTimer = duration;
    if (barkText) {
      this.triggerBark(barkText, 4.0);
    }
  }

  /**
   * Trigger an ambient voice bark
   */
  public triggerBark(text: string, duration = 4.0): void {
    this.activeBark = text;
    this.barkTimer = duration;
  }

  public clearBark(): void {
    this.activeBark = undefined;
    this.barkTimer = 0;
  }

  /**
   * Trigger a physical procedural 3D body movement/gesture (bow, salute, wave, nod, etc.)
   */
  public triggerGesture(gesture: NPCBehaviorState, duration = 3.2): void {
    this.activeGesture = gesture;
    this.gestureTimer = duration;
    this.behaviorState = gesture;
  }

  /**
   * Main per-frame update loop
   */
  public update(
    delta: number,
    playerPosition?: [number, number, number] | { x: number; y: number; z: number }
  ): NPCRoamingSnapshot {
    // 1. Tick bark & gesture timers
    if (this.barkTimer > 0) {
      this.barkTimer -= delta;
      if (this.barkTimer <= 0) {
        this.activeBark = undefined;
      }
    }

    if (this.gestureTimer > 0) {
      this.gestureTimer -= delta;
      if (this.gestureTimer <= 0) {
        this.activeGesture = undefined;
      }
    }

    // 2. Parse player position
    let px = 0;
    let pz = 0;
    let distToPlayer = 999;
    if (playerPosition) {
      px = Array.isArray(playerPosition) ? playerPosition[0] : playerPosition.x;
      pz = Array.isArray(playerPosition) ? playerPosition[2] : playerPosition.z;
      distToPlayer = Math.hypot(px - this.position[0], pz - this.position[2]);
    }

    const isNearPlayer = distToPlayer <= this.conversationRadius;

    // 3. If in active conversation or player is directly engaging
    if (this.isConversing || (isNearPlayer && distToPlayer < 2.0)) {
      if (this.activeGesture) {
        this.behaviorState = this.activeGesture;
      } else {
        this.behaviorState = 'conversing';
      }
      this.currentSpeed = 0;

      // Smoothly turn to face player
      const dx = px - this.position[0];
      const dz = pz - this.position[2];
      const targetAngle = Math.atan2(dx, dz);
      this.smoothRotateTowards(targetAngle, delta);

      return this.getSnapshot(distToPlayer, true);
    }

    // 4. Handle LLM spatial action override if active
    if (this.overrideTarget && this.overrideDurationTimer > 0) {
      this.overrideDurationTimer -= delta;
      const arrived = this.stepTowards(this.overrideTarget, delta);
      if (arrived || this.overrideDurationTimer <= 0) {
        this.overrideTarget = null;
        this.behaviorState = 'idle';
        this.dwellTimer = 3.0;
      }
      return this.getSnapshot(distToPlayer, false);
    }

    // 5. Waypoint Patrol System
    const waypoints = this.profile.waypoints;
    if (!waypoints || waypoints.length === 0) {
      this.behaviorState = 'idle';
      this.currentSpeed = 0;
      return this.getSnapshot(distToPlayer, false);
    }

    // Dwelling at current waypoint
    if (this.dwellTimer > 0) {
      this.dwellTimer -= delta;
      this.currentSpeed = 0;

      const currentWp = waypoints[this.currentWaypointIndex];
      switch (currentWp.idleAction) {
        case 'inspect':
          this.behaviorState = 'inspecting';
          break;
        case 'warm_hands':
          this.behaviorState = 'warming_hands';
          break;
        case 'work':
          this.behaviorState = 'working';
          break;
        case 'look_around':
        default:
          this.behaviorState = 'looking_around';
          break;
      }

      // If finished dwelling, advance to next waypoint
      if (this.dwellTimer <= 0) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
        const nextWp = waypoints[this.currentWaypointIndex];
        if (nextWp.barkText && Math.random() < 0.4) {
          this.triggerBark(nextWp.barkText);
        }
      }

      return this.getSnapshot(distToPlayer, false);
    }

    // Walking towards target waypoint
    const targetWp = waypoints[this.currentWaypointIndex];
    const targetPos: [number, number, number] = [
      targetWp.position[0],
      this.calculateGroundHeight(targetWp.position[0], targetWp.position[2]),
      targetWp.position[2],
    ];

    const arrived = this.stepTowards(targetPos, delta);
    if (arrived) {
      this.dwellTimer = targetWp.dwellTimeSeconds;
      this.behaviorState = 'idle';
      this.currentSpeed = 0;
    }

    return this.getSnapshot(distToPlayer, false);
  }

  /**
   * Moves NPC one step closer to target coordinates
   */
  private stepTowards(target: [number, number, number], delta: number): boolean {
    const dx = target[0] - this.position[0];
    const dz = target[2] - this.position[2];
    const dist = Math.hypot(dx, dz);

    if (dist <= this.arrivalThreshold) {
      this.position[0] = target[0];
      this.position[2] = target[2];
      this.position[1] = this.calculateGroundHeight(target[0], target[2]);
      this.currentSpeed = 0;
      return true;
    }

    // Rotate to face direction of travel
    const targetAngle = Math.atan2(dx, dz);
    this.smoothRotateTowards(targetAngle, delta);

    // Advance position
    const speed = this.profile.patrolSpeed;
    const step = Math.min(speed * delta, dist);
    const dirX = dx / dist;
    const dirZ = dz / dist;

    this.position[0] += dirX * step;
    this.position[2] += dirZ * step;
    this.position[1] = this.calculateGroundHeight(this.position[0], this.position[2]);

    this.behaviorState = 'walking';
    this.currentSpeed = speed;
    return false;
  }

  /**
   * Smooth spherical angle interpolation
   */
  private smoothRotateTowards(targetAngle: number, delta: number): void {
    let diff = targetAngle - this.rotationY;
    // Normalize diff to [-PI, PI]
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const maxStep = this.turnSpeed * delta;
    if (Math.abs(diff) < maxStep) {
      this.rotationY = targetAngle;
    } else {
      this.rotationY += Math.sign(diff) * maxStep;
    }
  }

  private getSnapshot(distToPlayer: number, isFacingPlayer: boolean): NPCRoamingSnapshot {
    return {
      npcId: this.profile.id,
      position: [this.position[0], this.position[1], this.position[2]],
      rotationY: this.rotationY,
      behaviorState: this.behaviorState,
      currentSpeed: this.currentSpeed,
      activeBark: this.activeBark,
      isFacingPlayer,
      distanceToPlayer: distToPlayer,
    };
  }

  public getPosition(): [number, number, number] {
    return [...this.position];
  }

  public getRotationY(): number {
    return this.rotationY;
  }

  public getBehaviorState(): NPCBehaviorState {
    return this.behaviorState;
  }
}
