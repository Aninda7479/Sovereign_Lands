'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  MessageSquare,
  Sparkles,
  Send,
  User,
  Shield,
  Coins,
  Compass,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getNPCProfileById, NPCProfile } from '../../../../ai-system/npc-engine/NPCProfiles';
import { npcManager } from '../../../../ai-system/npc-engine/NPCManager';
import { keyVault } from '../../../../ai-system/providers/KeyVault';

export interface DialogueHUDProps {
  isOpen: boolean;
  npcId: string | null;
  onClose: () => void;
  worldContext?: {
    currentKingdom?: string;
    weather?: string;
    timeOfDay?: string;
    activeWar?: boolean;
    playerGold?: number;
  };
}

/**
 * Cinematic GTA / Witcher-style NPC Dialogue HUD
 * Features bottom dialogue box, NPC portrait, typewriter speech streaming,
 * dynamic BYOAI engine responses, and free-form / quick response options.
 */
export function DialogueHUD({
  isOpen,
  npcId,
  onClose,
  worldContext,
}: DialogueHUDProps) {
  const [profile, setProfile] = useState<NPCProfile | null>(null);
  const [fullSpeechText, setFullSpeechText] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [activeEngineName, setActiveEngineName] = useState<string>('BYOAI');

  const typewriterTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio synthesizer for typewriter typing sound ticks
  const playTypeSound = useCallback(() => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Low subtle mechanical/parchment tick
      osc.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted or suspended by browser policy
    }
  }, [audioEnabled]);

  // Read active AI engine label
  useEffect(() => {
    const prov = keyVault.getActiveProvider();
    const conf = keyVault.getConfig(prov);
    setActiveEngineName(`${prov.toUpperCase()} • ${conf.model || 'Default'}`);

    const unsub = keyVault.subscribe(() => {
      const p = keyVault.getActiveProvider();
      const c = keyVault.getConfig(p);
      setActiveEngineName(`${p.toUpperCase()} • ${c.model || 'Default'}`);
    });
    return () => unsub();
  }, []);

  // Load NPC profile and trigger initial greeting
  useEffect(() => {
    if (!isOpen || !npcId) {
      setProfile(null);
      setFullSpeechText('');
      setDisplayedText('');
      setIsStreaming(false);
      return;
    }

    const loadedProfile = getNPCProfileById(npcId);
    if (loadedProfile) {
      setProfile(loadedProfile);
      npcManager.startConversation(npcId);

      // Check if there is already conversation history, otherwise use default greeting
      const history = npcManager.getConversationHistory(npcId);
      const lastNPCMessage = history.filter((h: any) => h.role === 'npc').pop();
      const greeting = lastNPCMessage ? lastNPCMessage.content : loadedProfile.defaultDialogue;

      startTypewriter(greeting);
    }

    return () => {
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
    };
  }, [isOpen, npcId]);

  // Typewriter streaming effect
  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);

    setFullSpeechText(text);
    setDisplayedText('');
    setIsStreaming(true);

    let charIndex = 0;
    const speedMs = 28; // ~35 chars/sec

    const typeNextChar = () => {
      if (charIndex < text.length) {
        const nextChar = text.charAt(charIndex);
        setDisplayedText((prev) => prev + nextChar);
        charIndex++;

        // Play subtle tick on vowels and consonants (skip spaces for realism)
        if (nextChar !== ' ' && nextChar !== '.' && nextChar !== ',') {
          playTypeSound();
        }

        typewriterTimeout.current = setTimeout(typeNextChar, speedMs);
      } else {
        setIsStreaming(false);
      }
    };

    typewriterTimeout.current = setTimeout(typeNextChar, speedMs);
  }, [playTypeSound]);

  // Skip typewriter to show full text immediately
  const skipTypewriter = useCallback(() => {
    if (typewriterTimeout.current) {
      clearTimeout(typewriterTimeout.current);
    }
    setDisplayedText(fullSpeechText);
    setIsStreaming(false);
  }, [fullSpeechText]);

  // Handle player message submission
  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!profile || isThinking || !messageText.trim()) return;

      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      setIsStreaming(false);
      setDisplayedText('');
      setIsThinking(true);
      setCustomInput('');

      try {
        const reply = await npcManager.generateDialogueResponse(
          profile.id,
          messageText.trim(),
          worldContext
        );
        setIsThinking(false);
        startTypewriter(reply);
      } catch (e) {
        setIsThinking(false);
        startTypewriter(profile.defaultDialogue);
      }
    },
    [profile, isThinking, worldContext, startTypewriter]
  );

  // Keyboard controls: [Space] to skip text, [1-4] for quick choices, [Esc] to exit
  useEffect(() => {
    if (!isOpen || !profile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in the custom text input
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'Escape') {
        npcManager.endConversation();
        onClose();
        return;
      }

      if (inInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSendMessage(customInput);
        }
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (isStreaming) {
          e.preventDefault();
          skipTypewriter();
        }
      }

      // Quick choices 1-4
      if (!isStreaming && !isThinking) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= profile.quickChoices.length) {
          e.preventDefault();
          const choice = profile.quickChoices[num - 1];
          handleSendMessage(choice.prompt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, profile, isStreaming, isThinking, customInput, handleSendMessage, skipTypewriter, onClose]);

  const handleClose = () => {
    npcManager.endConversation();
    onClose();
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between pointer-events-none select-none">
      {/* Cinematic Top Letterbox Bar */}
      <div className="w-full h-14 bg-gradient-to-b from-black/90 to-transparent pointer-events-auto flex items-center justify-between px-8">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>SOVEREIGN LANDS • DIALOGUE MODE</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Audio toggle button */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-zinc-400 hover:text-amber-300 transition p-1"
            title={audioEnabled ? 'Mute Speech Clicks' : 'Unmute Speech Clicks'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Close [Esc] */}
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-700/80 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <span>Exit</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-amber-300">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Bottom Dialogue Card Container */}
      <div className="w-full max-w-4xl mx-auto mb-8 px-4 pointer-events-auto">
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-zinc-950/95 shadow-2xl backdrop-blur-xl text-zinc-100 p-6 flex flex-col gap-4">
          {/* Header: Portrait, NPC Name, Title, Kingdom Badge */}
          <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-3.5">
              {/* NPC Portrait Box */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${profile.portraitColor} border border-amber-400/50 flex items-center justify-center text-amber-200 shadow-md font-serif font-bold text-lg`}
              >
                {profile.name.charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-amber-100 tracking-wide">
                    {profile.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                    {profile.title}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{profile.role}</p>
              </div>
            </div>

            {/* AI Engine Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{activeEngineName}</span>
            </div>
          </div>

          {/* Speech Text Area */}
          <div
            onClick={isStreaming ? skipTypewriter : undefined}
            className={`min-h-[80px] text-sm md:text-base font-serif leading-relaxed text-zinc-200 p-2 rounded-xl transition ${
              isStreaming ? 'cursor-pointer' : ''
            }`}
          >
            {isThinking ? (
              <div className="flex items-center gap-3 text-amber-300/80 italic text-sm py-3">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <span>{profile.name} considers your words carefully...</span>
              </div>
            ) : (
              <div>
                <span>&ldquo;{displayedText}&rdquo;</span>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>

          {/* Skip crawl hint */}
          {isStreaming && (
            <div className="text-[10px] text-zinc-500 font-mono -mt-2">
              Press <kbd className="px-1 py-0.2 rounded bg-zinc-800 text-amber-400">Space</kbd> or click to skip crawl
            </div>
          )}

          {/* Quick Choice Pills & Free-form Input */}
          {!isThinking && !isStreaming && (
            <div className="space-y-3 pt-1 border-t border-zinc-800/80">
              {/* Quick Choices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {profile.quickChoices.map((choice: any, idx: number) => (
                  <button
                    key={choice.id}
                    onClick={() => handleSendMessage(choice.prompt)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-amber-400/50 active:scale-98 transition text-left group"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold group-hover:bg-amber-400 group-hover:text-black transition">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-zinc-300 group-hover:text-zinc-100 font-medium">
                      {choice.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Free-form Question Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={`Ask ${profile.name} anything in your own words...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-sans"
                />
                <button
                  onClick={() => handleSendMessage(customInput)}
                  disabled={!customInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
                >
                  <span>Inquire</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DialogueHUD;
