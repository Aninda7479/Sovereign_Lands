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
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap,
  RotateCcw,
  Clock,
  Key,
} from 'lucide-react';
import { getNPCProfileById, NPCProfile } from '../../../../ai-system/npc-engine/NPCProfiles';
import { npcManager } from '../../../../ai-system/npc-engine/NPCManager';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import { rateLimiter } from '../../../../ai-system/providers/RateLimiter';
import { AIErrorDetails, RateLimiterMetrics } from '../../../../ai-system/providers/types';

export interface DialogueHUDProps {
  isOpen: boolean;
  npcId: string | null;
  onClose: () => void;
  onOpenSettings?: () => void;
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
 * error handling (disconnected AI, rate limits, quota 429), and responsive [E] key talk triggers.
 */
export function DialogueHUD({
  isOpen,
  npcId,
  onClose,
  onOpenSettings,
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
  const [activeProvider, setActiveProvider] = useState<string>('mock');
  const [aiError, setAiError] = useState<AIErrorDetails | null>(null);
  const [rateMetrics, setRateMetrics] = useState<RateLimiterMetrics>(rateLimiter.getMetrics());
  const [isErrorDismissed, setIsErrorDismissed] = useState<boolean>(false);

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

  // Sync AI engine status, API keys, and error diagnostics
  const refreshAIStatus = useCallback(() => {
    const prov = keyVault.getActiveProvider();
    const conf = keyVault.getConfig(prov);
    setActiveProvider(prov);
    setActiveEngineName(`${prov.toUpperCase()} • ${conf.model || 'Default'}`);

    const lastErr = keyVault.getLastError();
    const metrics = rateLimiter.getMetrics();
    setRateMetrics(metrics);

    // If provider is not mock and has no key configured, generate immediate error diagnostic
    const hasKey = Boolean(keyVault.getApiKey(prov));
    if (prov !== 'mock' && !hasKey) {
      setAiError({
        code: 'NO_API_KEY',
        provider: prov,
        message: `AI Engine Disconnected: No API key found for ${prov.toUpperCase()}.`,
        details: `Using offline medieval lore script. Add your ${prov.toUpperCase()} API key in Settings [K] to enable live AI dialogue.`,
        timestamp: Date.now(),
      });
      setIsErrorDismissed(false);
    } else if (lastErr) {
      setAiError(lastErr);
      setIsErrorDismissed(false);
    } else {
      setAiError(null);
    }
  }, []);

  useEffect(() => {
    refreshAIStatus();
    const unsub = keyVault.subscribe((payload) => {
      refreshAIStatus();
    });
    return () => unsub();
  }, [refreshAIStatus]);

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

      const history = npcManager.getConversationHistory(npcId);
      const lastNPCMessage = history.filter((h: any) => h.role === 'npc').pop();
      const greeting = lastNPCMessage ? lastNPCMessage.content : loadedProfile.defaultDialogue;

      startTypewriter(greeting);
    }

    return () => {
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
    };
  }, [isOpen, npcId, startTypewriter]);

  // Handle player message submission with thorough error catching
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
        refreshAIStatus();
        startTypewriter(reply);
      } catch (e: any) {
        setIsThinking(false);
        console.error('[DialogueHUD] NPC generation error:', e);
        keyVault.setLastError({
          code: 'UNKNOWN_ERROR',
          provider: keyVault.getActiveProvider(),
          message: `Dialogue Error: ${e?.message || 'Unable to generate reply'}`,
          details: 'Switched to emergency medieval script.',
          timestamp: Date.now(),
        });
        refreshAIStatus();
        startTypewriter(profile.defaultDialogue);
      }
    },
    [profile, isThinking, worldContext, startTypewriter, refreshAIStatus]
  );

  // Keyboard controls: [E] to talk / skip, [Space] to skip text, [1-4] for choices, [Esc] to exit
  useEffect(() => {
    if (!isOpen || !profile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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

      // [E] Key: Primary Talk & Advance Shortcut!
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (isStreaming) {
          // If speech is still scrolling, press [E] to skip typewriter
          skipTypewriter();
        } else if (!isThinking) {
          // If custom input is present, send it
          if (customInput.trim()) {
            handleSendMessage(customInput);
          } else if (profile.quickChoices && profile.quickChoices.length > 0) {
            // Speak using the primary quick choice!
            handleSendMessage(profile.quickChoices[0].prompt);
          }
        }
        return;
      }

      // [Space] to skip speech crawl
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
  }, [
    isOpen,
    profile,
    isStreaming,
    isThinking,
    customInput,
    handleSendMessage,
    skipTypewriter,
    onClose,
  ]);

  const handleClose = () => {
    npcManager.endConversation();
    onClose();
  };

  const handleSwitchToMock = () => {
    keyVault.setActiveProvider('mock');
    keyVault.clearError();
    setIsErrorDismissed(true);
    refreshAIStatus();
  };

  if (!isOpen || !profile) return null;

  const isMock = activeProvider === 'mock';

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between pointer-events-none select-none">
      {/* Cinematic Top Letterbox Bar */}
      <div className="w-full h-14 bg-gradient-to-b from-black/90 to-transparent pointer-events-auto flex items-center justify-between px-8">
        <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-400">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-zinc-300">SOVEREIGN LANDS</span>
          <span className="text-zinc-600">•</span>
          <span>NPC DIALOGUE</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick AI status badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            {aiError ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>AI Warning</span>
              </span>
            ) : isMock ? (
              <span className="flex items-center gap-1.5 text-yellow-300/80">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>Offline Lore</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Connected</span>
              </span>
            )}
          </div>

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
      <div className="w-full max-w-4xl mx-auto mb-6 px-4 pointer-events-auto">
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-zinc-950/95 shadow-2xl backdrop-blur-xl text-zinc-100 p-6 flex flex-col gap-3.5">
          {/* Diagnostic Error Banner when AI is disconnected or limits crossed */}
          {aiError && !isErrorDismissed && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 to-zinc-900/90 border border-amber-500/60 shadow-lg text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200 flex items-center gap-2">
                    <span>{aiError.message}</span>
                    {aiError.code === 'RATE_LIMIT_EXCEEDED' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                        Quota Throttle
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{aiError.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-semibold text-[11px] transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings [K]</span>
                  </button>
                )}

                <button
                  onClick={handleSwitchToMock}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-[11px] transition"
                  title="Switch to built-in offline lore responses"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Use Offline Lore</span>
                </button>

                <button
                  onClick={() => setIsErrorDismissed(true)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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

            {/* AI Engine Status Pill & Diagnostics */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{activeEngineName}</span>
              </div>

              {rateMetrics && (
                <div
                  className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-500"
                  title="Rate limit tracker: remaining tokens in current window"
                >
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>{rateMetrics.requestsRemaining} req left</span>
                </div>
              )}
            </div>
          </div>

          {/* Speech Text Area */}
          <div
            onClick={isStreaming ? skipTypewriter : undefined}
            className={`min-h-[75px] text-sm md:text-base font-serif leading-relaxed text-zinc-200 p-2 rounded-xl transition ${
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

          {/* Skip crawl hint with explicit [E] indicator */}
          {isStreaming && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono -mt-1 px-1">
              <div className="flex items-center gap-1.5">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold border border-zinc-700">
                  E
                </kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold border border-zinc-700">
                  Space
                </kbd>
                <span>to reveal text immediately</span>
              </div>

              <button
                onClick={skipTypewriter}
                className="text-[10px] text-amber-400/80 hover:text-amber-300 underline"
              >
                Skip Typewriter
              </button>
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
                    <span className="flex items-center justify-center px-1.5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold group-hover:bg-amber-400 group-hover:text-black transition">
                      {idx === 0 ? '1 • E' : `${idx + 1}`}
                    </span>
                    <span className="text-xs text-zinc-300 group-hover:text-zinc-100 font-medium">
                      {choice.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Free-form Question Input with [E] Speak action */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={`Ask ${profile.name} anything in your own words...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-sans"
                />

                {/* Primary Action Button: Sends custom message or quick choice */}
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      handleSendMessage(customInput);
                    } else if (profile.quickChoices && profile.quickChoices.length > 0) {
                      handleSendMessage(profile.quickChoices[0].prompt);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs active:scale-95 transition shadow-md shadow-amber-500/20"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded bg-black/20 text-[10px] font-mono">
                    E
                  </span>
                  <span>{customInput.trim() ? 'Inquire' : 'Talk'}</span>
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
