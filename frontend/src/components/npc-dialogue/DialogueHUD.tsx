'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Mic,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { getNPCProfileById, NPCProfile } from '../../../../ai-system/npc-engine/NPCProfiles';
import { npcManager } from '../../../../ai-system/npc-engine/NPCManager';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import { rateLimiter } from '../../../../ai-system/providers/RateLimiter';
import {
  AIErrorDetails,
  RateLimiterMetrics,
  AIProviderType,
} from '../../../../ai-system/providers/types';
import { OPENCODE_FREE_MODELS } from '../../../../ai-system/providers/OpenCodeAdapter';

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

export type DialogueLayoutMode = 'cinematic' | 'classic';

/**
 * AAA-Grade Sovereign Lands NPC Dialogue HUD
 * Supports OpenCode Free Tier gateway, live AI-generated dialogue,
 * synchronized 3D procedural body movements, and dual layouts (Cinematic Studio & Classic RPG).
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
  const [thinkingMessage, setThinkingMessage] = useState<string>('Reflecting on realm affairs...');
  const [customInput, setCustomInput] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [ttsVoiceEnabled, setTtsVoiceEnabled] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<DialogueLayoutMode>('cinematic');
  const [currentGestureTag, setCurrentGestureTag] = useState<string>('conversing');

  const [activeEngineName, setActiveEngineName] = useState<string>('OPENCODE FREE');
  const [activeProvider, setActiveProvider] = useState<AIProviderType>('opencode');
  const [activeModel, setActiveModel] = useState<string>('mimo-v2.6-flash-free');
  const [aiError, setAiError] = useState<AIErrorDetails | null>(null);
  const [rateMetrics, setRateMetrics] = useState<RateLimiterMetrics>(rateLimiter.getMetrics());
  const [isErrorDismissed, setIsErrorDismissed] = useState<boolean>(false);
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  const typewriterTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize mechanical/ambient typewriter clicks
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
      // Audio policy restricted
    }
  }, [audioEnabled]);

  // Web Speech API Voice Synthesizer
  const speakWithTTS = useCallback(
    (text: string) => {
      if (!ttsVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const clean = text.replace(/\[.*?\]/g, '').trim();
        if (!clean) return;

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.95;
        utterance.pitch = 0.92;
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        if (enVoice) utterance.voice = enVoice;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis suppressed
      }
    },
    [ttsVoiceEnabled]
  );

  // Sync AI engine status, active provider, and diagnostics
  const refreshAIStatus = useCallback(() => {
    const prov = keyVault.getActiveProvider();
    const conf = keyVault.getConfig(prov);
    setActiveProvider(prov);
    setActiveModel(conf.model || 'mimo-v2.6-flash-free');

    const displayName =
      prov === 'opencode'
        ? `OPENCODE FREE • ${conf.model || 'mimo-v2.6-flash-free'}`
        : `${prov.toUpperCase()} • ${conf.model || 'Default'}`;
    setActiveEngineName(displayName);

    const lastErr = keyVault.getLastError();
    const metrics = rateLimiter.getMetrics();
    setRateMetrics(metrics);

    // OpenCode, Mock, and Ollama do not require an API key
    const hasKey =
      prov === 'opencode' ||
      prov === 'mock' ||
      prov === 'ollama' ||
      Boolean(keyVault.getApiKey(prov));

    if (!hasKey) {
      setAiError({
        code: 'NO_API_KEY',
        provider: prov,
        message: `AI Engine Disconnected: No API key found for ${prov.toUpperCase()}.`,
        details: `Using OpenCode Free Tier or offline lore. Add key in Settings [K].`,
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
    const unsub = keyVault.subscribe(() => {
      refreshAIStatus();
    });
    return () => unsub();
  }, [refreshAIStatus]);

  // Typewriter streaming effect
  const startTypewriter = useCallback(
    (text: string) => {
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);

      setFullSpeechText(text);
      setDisplayedText('');
      setIsStreaming(true);

      speakWithTTS(text);

      let charIndex = 0;
      const speedMs = 26; // ~38 chars/sec

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
    },
    [playTypeSound, speakWithTTS]
  );

  // Skip typewriter to show full text immediately
  const skipTypewriter = useCallback(() => {
    if (typewriterTimeout.current) {
      clearTimeout(typewriterTimeout.current);
    }
    setDisplayedText(fullSpeechText);
    setIsStreaming(false);
  }, [fullSpeechText]);

  // Load NPC profile & trigger LIVE AI greeting
  useEffect(() => {
    if (!isOpen || !npcId) {
      setProfile(null);
      setFullSpeechText('');
      setDisplayedText('');
      setIsStreaming(false);
      setIsThinking(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const loadedProfile = getNPCProfileById(npcId);
    if (!loadedProfile) return;

    setProfile(loadedProfile);
    npcManager.startConversation(npcId);

    const history = npcManager.getConversationHistory(npcId);
    const lastNPCMessage = history.filter((h: any) => h.role === 'npc').pop();

    if (lastNPCMessage) {
      const { cleanText, gestureTag } = npcManager.parseAndTriggerGesture(
        npcId,
        lastNPCMessage.content
      );
      setCurrentGestureTag(gestureTag || 'conversing');
      startTypewriter(cleanText);
    } else {
      // Trigger live dynamic AI opening greeting
      setIsThinking(true);
      setThinkingMessage(`${loadedProfile.name} acknowledges your approach...`);

      let hasStreamedFirstChunk = false;
      npcManager
        .generateDialogueResponseStream(
          npcId,
          '[A traveler approaches you in the settlement]',
          (chunk, fullCleanText, tag) => {
            if (!hasStreamedFirstChunk) {
              hasStreamedFirstChunk = true;
              setIsThinking(false);
              setIsStreaming(true);
            }
            if (tag) setCurrentGestureTag(tag);
            setDisplayedText(fullCleanText);
            setFullSpeechText(fullCleanText);
            playTypeSound();
          },
          worldContext
        )
        .then(({ fullText, gestureTag }) => {
          setIsThinking(false);
          setIsStreaming(false);
          setDisplayedText(fullText);
          setFullSpeechText(fullText);
          if (gestureTag) setCurrentGestureTag(gestureTag);
          speakWithTTS(fullText);
        })
        .catch((err) => {
          console.warn('[DialogueHUD] Live greeting fallback:', err);
          setIsThinking(false);
          setIsStreaming(false);
          startTypewriter(loadedProfile.defaultDialogue);
        });
    }

    return () => {
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, npcId, playTypeSound, speakWithTTS, startTypewriter, worldContext]);

  // Handle player message submission with live generation and gesture parsing
  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!profile || isThinking || !messageText.trim()) return;

      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      setIsStreaming(false);
      setDisplayedText('');
      setIsThinking(true);
      setThinkingMessage(`${profile.name} considers your words carefully...`);
      setCustomInput('');

      // Play thinking gesture on NPC entity
      npcManager.triggerNPCGesture(profile.id, 'thinking', 4.0);
      setCurrentGestureTag('thinking');

      try {
        let hasStreamedFirstChunk = false;

        const { fullText, gestureTag } = await npcManager.generateDialogueResponseStream(
          profile.id,
          messageText.trim(),
          (chunk, fullCleanText, tag) => {
            if (!hasStreamedFirstChunk) {
              hasStreamedFirstChunk = true;
              setIsThinking(false);
              setIsStreaming(true);
            }
            if (tag) {
              setCurrentGestureTag(tag);
            }
            setDisplayedText(fullCleanText);
            setFullSpeechText(fullCleanText);
            playTypeSound();
          },
          worldContext
        );

        setIsThinking(false);
        setIsStreaming(false);
        setDisplayedText(fullText);
        setFullSpeechText(fullText);
        if (gestureTag) {
          setCurrentGestureTag(gestureTag);
        }
        refreshAIStatus();
        speakWithTTS(fullText);
      } catch (e: any) {
        setIsThinking(false);
        setIsStreaming(false);
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
    [profile, isThinking, worldContext, playTypeSound, speakWithTTS, startTypewriter, refreshAIStatus]
  );

  // Quick switch OpenCode model on the fly
  const handleModelChange = (modelId: string) => {
    keyVault.updateConfig('opencode', { model: modelId });
    keyVault.setActiveProvider('opencode');
    setActiveModel(modelId);
    setShowModelDropdown(false);
    refreshAIStatus();
  };

  // Keyboard controls: [E] to talk / skip, [Space] to skip text, [1-4] for choices, [Esc] to exit
  useEffect(() => {
    if (!isOpen || !profile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

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

      // [E] Key: Primary Talk & Advance Shortcut
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (isStreaming) {
          skipTypewriter();
        } else if (!isThinking) {
          if (customInput.trim()) {
            handleSendMessage(customInput);
          } else if (profile.quickChoices && profile.quickChoices.length > 0) {
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

      // [Tab] to toggle between Cinematic and Classic layout
      if (e.key === 'Tab') {
        e.preventDefault();
        setLayoutMode((prev) => (prev === 'cinematic' ? 'classic' : 'cinematic'));
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  const handleSwitchToMock = () => {
    keyVault.setActiveProvider('mock');
    keyVault.clearError();
    setIsErrorDismissed(true);
    refreshAIStatus();
  };

  const gestureDisplayMeta = useMemo(() => {
    switch (currentGestureTag) {
      case 'bow':
        return { label: 'Respectful Bow', icon: '🎭', color: 'text-amber-300' };
      case 'salute':
        return { label: 'Knightly Salute', icon: '⚔️', color: 'text-sky-300' };
      case 'wave':
        return { label: 'Frontier Wave', icon: '👋', color: 'text-emerald-300' };
      case 'think':
        return { label: 'Deliberating', icon: '🤔', color: 'text-purple-300' };
      case 'shrug':
        return { label: 'Shrugging', icon: '🤷', color: 'text-zinc-300' };
      case 'laugh':
        return { label: 'Hearty Laugh', icon: '😄', color: 'text-yellow-300' };
      case 'gesture':
        return { label: 'Explaining Realm', icon: '🗣️', color: 'text-amber-200' };
      default:
        return { label: 'Conversing Live', icon: '💬', color: 'text-emerald-400' };
    }
  }, [currentGestureTag]);

  if (!isOpen || !profile) return null;

  const isMock = activeProvider === 'mock';
  const isOpenCode = activeProvider === 'opencode';

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between pointer-events-none select-none">
      {/* Top Letterbox Bar */}
      <div className="w-full h-14 bg-gradient-to-b from-black/95 via-black/80 to-transparent pointer-events-auto flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="font-bold text-zinc-200">SOVEREIGN LANDS</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-300/90 font-serif font-bold">
            {profile.name} ({profile.role})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout Mode Toggle */}
          <button
            onClick={() =>
              setLayoutMode((prev) => (prev === 'cinematic' ? 'classic' : 'cinematic'))
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-700/70 text-[11px] font-mono text-zinc-300 hover:text-amber-300 hover:border-amber-400/50 transition"
            title="Toggle between Cinematic Studio and Classic RPG layout [Tab]"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="capitalize">{layoutMode} Layout</span>
            <kbd className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] text-zinc-400 font-mono">
              Tab
            </kbd>
          </button>

          {/* OpenCode Live Model Selector / Status Pill */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 hover:bg-emerald-900/50 transition"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isOpenCode ? `OpenCode • ${activeModel}` : activeEngineName}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {showModelDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur-xl p-2 z-50 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  OpenCode Free Tier Models
                </div>
                <div className="space-y-1 mt-1 max-h-56 overflow-y-auto">
                  {OPENCODE_FREE_MODELS.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModelChange(m)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                        activeModel === m
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m}</span>
                      {activeModel === m && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real Audio / Web Speech TTS Toggle */}
          <button
            onClick={() => setTtsVoiceEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition ${
              ttsVoiceEnabled
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title="Read live NPC dialogue out loud with text-to-speech voice"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice TTS</span>
          </button>

          {/* Typewriter Click Sound Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-zinc-400 hover:text-amber-300 transition p-1"
            title={audioEnabled ? 'Mute Key Clicks' : 'Unmute Key Clicks'}
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

      {/* ========================================================================= */}
      {/* LAYOUT 1: CINEMATIC STUDIO / SPLIT-SCREEN LAYOUT (NEW RECOMMENDED)        */}
      {/* ========================================================================= */}
      {layoutMode === 'cinematic' ? (
        <div className="w-full max-w-6xl mx-auto mb-6 px-4 pointer-events-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Persona & Movement Studio Card (Cols 1-4) */}
            <div className="md:col-span-4 rounded-3xl border-2 border-amber-500/40 bg-zinc-950/95 shadow-2xl backdrop-blur-xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                {/* 3D NPC Portrait Box */}
                <div className="relative">
                  <div
                    className={`w-full h-36 rounded-2xl bg-gradient-to-br ${profile.portraitColor} border border-amber-400/60 flex flex-col items-center justify-center text-amber-100 shadow-inner relative overflow-hidden`}
                  >
                    <div className="text-5xl font-serif font-black drop-shadow-md">
                      {profile.name.charAt(0)}
                    </div>
                    <div className="absolute bottom-2 px-3 py-0.5 rounded-full bg-black/60 border border-amber-400/30 text-[10px] font-mono text-amber-300">
                      Faction: {profile.faction}
                    </div>
                  </div>
                </div>

                {/* Identity & Kingdom Lore */}
                <div>
                  <h3 className="font-serif font-bold text-xl text-amber-100">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                      {profile.title}
                    </span>
                    <span className="text-xs text-zinc-400 font-serif">{profile.role}</span>
                  </div>
                </div>

                {/* 3D Procedural Movement / Gesture Tag Badge */}
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">3D Body Movement:</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span>{gestureDisplayMeta.icon}</span>
                    <span className={gestureDisplayMeta.color}>
                      {gestureDisplayMeta.label}
                    </span>
                  </div>
                </div>

                {/* Live Speech Waveform Pulse */}
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Voice Synthesis:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className={`w-1 rounded-full bg-amber-400 transition-all duration-150 ${
                          isStreaming || isThinking
                            ? 'h-4 animate-pulse'
                            : 'h-1.5 opacity-30'
                        }`}
                        style={{
                          animationDelay: `${bar * 120}ms`,
                          height: isStreaming ? `${8 + (bar % 3) * 6}px` : '6px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Engine Badge at Base of Left Card */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Keyless OpenCode Gateway
                </span>
                <span>Active 3D Entity</span>
              </div>
            </div>

            {/* Right Dialogue & Action Card (Cols 5-12) */}
            <div className="md:col-span-8 rounded-3xl border-2 border-amber-500/40 bg-zinc-950/95 shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between gap-4">
              {/* Diagnostic Error Banner if applicable */}
              {aiError && !isErrorDismissed && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{aiError.message}</span>
                  </div>
                  <button
                    onClick={() => setIsErrorDismissed(true)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Main Dialogue Speech Output */}
              <div
                onClick={isStreaming ? skipTypewriter : undefined}
                className="flex-1 min-h-[140px] p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col justify-center"
              >
                {isThinking ? (
                  <div className="flex items-center gap-3 text-amber-300 italic text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="font-serif">{thinkingMessage}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-base md:text-lg font-serif leading-relaxed text-zinc-100">
                      &ldquo;{displayedText}&rdquo;
                      {isStreaming && (
                        <span className="inline-block w-2.5 h-5 ml-1.5 bg-amber-400 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Typewriter Skip Hint */}
              {isStreaming && (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono -mt-1">
                  <span>
                    Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold border border-zinc-700">E</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold border border-zinc-700">Space</kbd> to skip text crawl
                  </span>
                  <button
                    onClick={skipTypewriter}
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Reveal Immediately
                  </button>
                </div>
              )}

              {/* Quick Choices & Free-form Input */}
              {!isThinking && !isStreaming && (
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  {/* Quick Topics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                  {/* Free-form Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder={`Inquire with ${profile.name} about sovereign deeds, war, or grain...`}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none text-xs text-zinc-100 placeholder:text-zinc-600"
                    />

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
      ) : (
        /* ========================================================================= */
        /* LAYOUT 2: CLASSIC BOTTOM RPG DIALOGUE BAR                                 */
        /* ========================================================================= */
        <div className="w-full max-w-4xl mx-auto mb-6 px-4 pointer-events-auto">
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-zinc-950/95 shadow-2xl backdrop-blur-xl text-zinc-100 p-6 flex flex-col gap-3.5">
            {/* Header: Portrait, NPC Name, Title */}
            <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-3.5">
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

              {/* Movement & Engine Tag */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  <span>{gestureDisplayMeta.icon}</span>
                  <span className={gestureDisplayMeta.color}>{gestureDisplayMeta.label}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{activeModel}</span>
                </div>
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

            {/* Skip crawl hint */}
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

            {/* Choices & Input */}
            {!isThinking && !isStreaming && (
              <div className="space-y-3 pt-1 border-t border-zinc-800/80">
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

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={`Ask ${profile.name} anything in your own words...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-sans"
                  />

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
      )}
    </div>
  );
}

export default DialogueHUD;
