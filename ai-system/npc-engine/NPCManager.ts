/**
 * Sovereign Lands - NPC World Manager & Dialogue Coordinator
 * Manages all active 3D NPCs, coordinates proximity checks with the player,
 * and orchestrates LLM dialogue generation through Agent 08's BYOAI Provider Hub.
 */

import { NPCProfile, getAllNPCProfiles, getNPCProfileById } from './NPCProfiles';
import { NPCRoamingController, NPCRoamingSnapshot } from './NPCRoamingController';
import { providerFactory } from '../providers/ProviderFactory';
import { NPCConversationContext, DialogueMessage } from '../providers/types';

export type NPCManagerEventType =
  | 'conversation-started'
  | 'conversation-ended'
  | 'proximity-changed'
  | 'bark-triggered'
  | 'dialogue-stream-start'
  | 'dialogue-stream-end';

export interface NPCManagerEvent {
  type: NPCManagerEventType;
  npcId?: string;
  data?: any;
  timestamp: number;
}

export class NPCManager {
  private static instance: NPCManager | null = null;

  private controllers: Map<string, NPCRoamingController> = new Map();
  private activeSpeakerId: string | null = null;
  private nearestNPCId: string | null = null;
  private isGeneratingDialogue = false;

  // In-memory conversation history per NPC: npcId -> DialogueMessage[]
  private conversationHistories: Map<string, DialogueMessage[]> = new Map();

  // Event listeners
  private listeners: Set<(event: NPCManagerEvent) => void> = new Set();

  // Proximity settings
  private readonly interactionRadius = 5.0; // 5 meters

  // Ambient barking interval timer
  private ambientBarkTimer = 0;
  private readonly barkIntervalSeconds = 18;

  private constructor() {
    this.initializeNPCs();
  }

  public static getInstance(): NPCManager {
    if (!NPCManager.instance) {
      NPCManager.instance = new NPCManager();
    }
    return NPCManager.instance;
  }

  /**
   * Initializes all NPC profiles from registry
   */
  private initializeNPCs(): void {
    const profiles = getAllNPCProfiles();
    for (const profile of profiles) {
      const controller = new NPCRoamingController(profile);
      this.controllers.set(profile.id, controller);
      this.conversationHistories.set(profile.id, []);
    }
  }

  public subscribe(listener: (event: NPCManagerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(type: NPCManagerEventType, npcId?: string, data?: any): void {
    const event: NPCManagerEvent = {
      type,
      npcId,
      data,
      timestamp: Date.now(),
    };
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error('[NPCManager] Listener error:', e);
      }
    });
  }

  /**
   * Main per-frame update loop called from the 3D canvas / frame loop
   */
  public update(
    delta: number,
    playerPosition?: [number, number, number] | { x: number; y: number; z: number }
  ): Map<string, NPCRoamingSnapshot> {
    const snapshots: Map<string, NPCRoamingSnapshot> = new Map();

    let closestId: string | null = null;
    let minDistance = 999;

    for (const [id, controller] of this.controllers.entries()) {
      const snapshot = controller.update(delta, playerPosition);
      snapshots.set(id, snapshot);

      if (snapshot.distanceToPlayer < minDistance) {
        minDistance = snapshot.distanceToPlayer;
        if (snapshot.distanceToPlayer <= this.interactionRadius) {
          closestId = id;
        }
      }
    }

    // Proximity change detection
    if (closestId !== this.nearestNPCId) {
      this.nearestNPCId = closestId;
      this.emitEvent('proximity-changed', closestId || undefined, {
        distance: minDistance,
        canInteract: closestId !== null,
      });
    }

    // Ambient random barking among NPCs
    this.ambientBarkTimer += delta;
    if (this.ambientBarkTimer >= this.barkIntervalSeconds) {
      this.ambientBarkTimer = 0;
      this.triggerRandomAmbientBark();
    }

    return snapshots;
  }

  /**
   * Trigger an ambient bark from a randomly selected roaming NPC
   */
  private triggerRandomAmbientBark(): void {
    // Do not bark if player is in an active dialogue conversation
    if (this.activeSpeakerId) return;

    const ids = Array.from(this.controllers.keys());
    if (ids.length === 0) return;

    const randomId = ids[Math.floor(Math.random() * ids.length)];
    const controller = this.controllers.get(randomId);
    if (!controller) return;

    const profile = controller.profile;
    const barks = profile.ambientBarks;
    if (barks && barks.length > 0) {
      const chosenBark = barks[Math.floor(Math.random() * barks.length)];
      controller.triggerBark(chosenBark, 4.5);
      this.emitEvent('bark-triggered', randomId, { barkText: chosenBark });
    }
  }

  public getNearestNPCId(): string | null {
    return this.nearestNPCId;
  }

  public getNearestNPC(): NPCProfile | null {
    if (!this.nearestNPCId) return null;
    return getNPCProfileById(this.nearestNPCId) || null;
  }

  public getActiveSpeakerId(): string | null {
    return this.activeSpeakerId;
  }

  public getActiveSpeaker(): NPCProfile | null {
    if (!this.activeSpeakerId) return null;
    return getNPCProfileById(this.activeSpeakerId) || null;
  }

  public getController(id: string): NPCRoamingController | undefined {
    return this.controllers.get(id);
  }

  /**
   * Start a conversation with an NPC
   */
  public startConversation(npcId: string): NPCProfile | null {
    const profile = getNPCProfileById(npcId);
    if (!profile) return null;

    this.activeSpeakerId = npcId;
    const controller = this.controllers.get(npcId);
    if (controller) {
      controller.setConversing(true);
    }

    this.emitEvent('conversation-started', npcId, { profile });
    return profile;
  }

  /**
   * End current active conversation
   */
  public endConversation(): void {
    if (this.activeSpeakerId) {
      const prevSpeaker = this.activeSpeakerId;
      const controller = this.controllers.get(prevSpeaker);
      if (controller) {
        controller.setConversing(false);
      }
      this.activeSpeakerId = null;
      this.emitEvent('conversation-ended', prevSpeaker);
    }
  }

  /**
   * Generate an NPC response via Agent 08's ProviderFactory with fallback stubbing
   */
  public async generateDialogueResponse(
    npcId: string,
    playerMessage: string,
    worldContext?: any
  ): Promise<string> {
    const profile = getNPCProfileById(npcId);
    if (!profile) return '...';

    this.isGeneratingDialogue = true;
    this.emitEvent('dialogue-stream-start', npcId);

    // Save player message to history
    const history = this.conversationHistories.get(npcId) || [];
    history.push({
      role: 'player',
      content: playerMessage,
      timestamp: Date.now(),
    });

    const context: NPCConversationContext = {
      npcId: profile.id,
      npcName: profile.name,
      npcRole: profile.role,
      npcPersonality: profile.personality,
      playerMessage,
      conversationHistory: history,
      worldContext: {
        currentKingdom: profile.kingdom,
        weather: worldContext?.weather || 'Clear',
        timeOfDay: worldContext?.timeOfDay || 'Day',
        activeWar: worldContext?.activeWar || false,
        playerGold: worldContext?.playerGold,
      },
    };

    let reply = '';
    try {
      // Use Agent 08's ProviderFactory
      reply = await providerFactory.generateNPCResponse(context);
    } catch (err) {
      console.warn('[NPCManager] LLM generation error, using profile fallback:', err);
      reply = profile.defaultDialogue;
    }

    if (!reply || reply.trim().length === 0) {
      reply = profile.defaultDialogue;
    }

    // Save NPC reply to history
    history.push({
      role: 'npc',
      content: reply,
      timestamp: Date.now(),
    });
    this.conversationHistories.set(npcId, history);

    this.isGeneratingDialogue = false;
    this.emitEvent('dialogue-stream-end', npcId, { response: reply });

    return reply;
  }

  public getConversationHistory(npcId: string): DialogueMessage[] {
    return this.conversationHistories.get(npcId) || [];
  }

  public clearConversationHistory(npcId: string): void {
    this.conversationHistories.set(npcId, []);
  }

  public isThinking(): boolean {
    return this.isGeneratingDialogue;
  }
}

export const npcManager = NPCManager.getInstance();
