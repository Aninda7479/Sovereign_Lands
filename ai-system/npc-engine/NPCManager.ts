/**
 * Sovereign Lands - NPC World Manager & Dialogue Coordinator
 * Manages all active 3D NPCs, coordinates proximity checks with the player,
 * and orchestrates LLM dialogue generation through Agent 08's BYOAI Provider Hub.
 */

import { NPCProfile, getAllNPCProfiles, getNPCProfileById } from './NPCProfiles';
import { NPCRoamingController, NPCRoamingSnapshot, NPCBehaviorState } from './NPCRoamingController';
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
   * Directly triggers a physical 3D procedural body movement on an NPC
   */
  public triggerNPCGesture(npcId: string, gesture: NPCBehaviorState, duration = 3.2): void {
    const controller = this.controllers.get(npcId);
    if (controller) {
      controller.triggerGesture(gesture, duration);
    }
  }

  /**
   * Helper that parses gesture tags like [bow], [salute], [wave], etc. from AI responses,
   * activates the 3D body movement on the NPC, and returns cleaned speech text.
   */
  public parseAndTriggerGesture(
    npcId: string,
    text: string
  ): { cleanText: string; gestureTag?: string } {
    const match = text.match(/^\[(bow|salute|wave|nod|think|shrug|laugh|gesture|conversing)\]/i);
    if (match) {
      const tag = match[1].toLowerCase();
      let gestureState: NPCBehaviorState = 'conversing';
      if (tag === 'bow') gestureState = 'bowing';
      else if (tag === 'salute') gestureState = 'saluting';
      else if (tag === 'wave') gestureState = 'waving';
      else if (tag === 'think') gestureState = 'thinking';
      else if (tag === 'shrug') gestureState = 'shrugging';
      else if (tag === 'laugh') gestureState = 'laughing';
      else if (tag === 'gesture') gestureState = 'gesturing';
      else if (tag === 'nod') gestureState = 'conversing';

      this.triggerNPCGesture(npcId, gestureState, 3.5);
      const cleanText = text
        .replace(/^\[(bow|salute|wave|nod|think|shrug|laugh|gesture|conversing)\]\s*/i, '')
        .trim();
      return { cleanText, gestureTag: tag };
    }
    return { cleanText: text.trim() };
  }

  /**
   * Live AI-generated opening greeting when the player approaches and speaks to an NPC
   */
  public async generateInitialGreeting(
    npcId: string,
    worldContext?: any
  ): Promise<{ greeting: string; gestureTag?: string }> {
    const profile = getNPCProfileById(npcId);
    if (!profile) {
      return { greeting: 'Greetings, traveler.' };
    }

    const history = this.conversationHistories.get(npcId) || [];
    const lastNPC = history.filter((h) => h.role === 'npc').pop();
    if (lastNPC) {
      const parsed = this.parseAndTriggerGesture(npcId, lastNPC.content);
      return { greeting: parsed.cleanText, gestureTag: parsed.gestureTag };
    }

    // Generate live dynamic opening greeting
    this.isGeneratingDialogue = true;
    this.emitEvent('dialogue-stream-start', npcId);

    const context: NPCConversationContext = {
      npcId: profile.id,
      npcName: profile.name,
      npcRole: profile.role,
      npcPersonality: profile.personality,
      playerMessage: '[A traveler approaches you in the settlement]',
      conversationHistory: [],
      worldContext: {
        currentKingdom: profile.kingdom,
        weather: worldContext?.weather || 'Clear',
        timeOfDay: worldContext?.timeOfDay || 'Day',
        activeWar: worldContext?.activeWar || false,
        playerGold: worldContext?.playerGold,
      },
    };

    let rawReply = '';
    try {
      rawReply = await providerFactory.generateNPCResponse(context);
    } catch {
      rawReply = profile.defaultDialogue;
    }

    if (!rawReply || rawReply.trim().length === 0) {
      rawReply = profile.defaultDialogue;
    }

    const { cleanText, gestureTag } = this.parseAndTriggerGesture(npcId, rawReply);

    // Record to history
    history.push({
      role: 'npc',
      content: rawReply,
      timestamp: Date.now(),
    });
    this.conversationHistories.set(npcId, history);

    this.isGeneratingDialogue = false;
    this.emitEvent('dialogue-stream-end', npcId, { response: cleanText });

    return { greeting: cleanText, gestureTag };
  }

  /**
   * Live streaming NPC response generation with real-time token delivery and synchronized 3D gestures
   */
  public async generateDialogueResponseStream(
    npcId: string,
    playerMessage: string,
    onToken: (chunk: string, fullCleanText: string, gestureTag?: string) => void,
    worldContext?: any
  ): Promise<{ fullText: string; gestureTag?: string }> {
    const profile = getNPCProfileById(npcId);
    if (!profile) return { fullText: '...' };

    this.isGeneratingDialogue = true;
    this.emitEvent('dialogue-stream-start', npcId);

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

    let rawFull = '';
    let parsedGesture = false;
    let detectedGestureTag: string | undefined = undefined;

    try {
      rawFull = await providerFactory.generateNPCResponseStream(
        context,
        (chunk, currentFull) => {
          rawFull = currentFull;

          // Check if we can parse the gesture from the start of the response
          if (!parsedGesture && currentFull.includes(']')) {
            const { gestureTag } = this.parseAndTriggerGesture(npcId, currentFull);
            if (gestureTag) {
              detectedGestureTag = gestureTag;
              parsedGesture = true;
            }
          }

          // Strip gesture tag from visible text so [salute] does not appear as raw text to user
          const cleanText = currentFull
            .replace(/^\[(bow|salute|wave|nod|think|shrug|laugh|gesture|conversing)\]\s*/i, '')
            .trimStart();

          onToken(chunk, cleanText, detectedGestureTag);
        }
      );
    } catch (err) {
      console.warn('[NPCManager] Streaming error, fallback:', err);
      rawFull = profile.defaultDialogue;
    }

    if (!rawFull || rawFull.trim().length === 0) {
      rawFull = profile.defaultDialogue;
    }

    const { cleanText, gestureTag } = this.parseAndTriggerGesture(npcId, rawFull);

    history.push({
      role: 'npc',
      content: rawFull,
      timestamp: Date.now(),
    });
    this.conversationHistories.set(npcId, history);

    this.isGeneratingDialogue = false;
    this.emitEvent('dialogue-stream-end', npcId, { response: cleanText });

    return { fullText: cleanText, gestureTag: detectedGestureTag || gestureTag };
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
      reply = await providerFactory.generateNPCResponse(context);
    } catch (err) {
      console.warn('[NPCManager] LLM generation error, using profile fallback:', err);
      reply = profile.defaultDialogue;
    }

    if (!reply || reply.trim().length === 0) {
      reply = profile.defaultDialogue;
    }

    // Parse and trigger physical body movement immediately on the 3D NPC entity
    const { cleanText } = this.parseAndTriggerGesture(npcId, reply);

    // Save NPC reply to history
    history.push({
      role: 'npc',
      content: reply,
      timestamp: Date.now(),
    });
    this.conversationHistories.set(npcId, history);

    this.isGeneratingDialogue = false;
    this.emitEvent('dialogue-stream-end', npcId, { response: cleanText });

    return cleanText;
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
