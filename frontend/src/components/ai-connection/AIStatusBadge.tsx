'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Sparkles, RefreshCw, Zap, Bot, ChevronRight } from 'lucide-react';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import { AIProviderType } from '../../../../ai-system/providers/types';
import { AISettingsModal } from './AISettingsModal';

export interface AIStatusBadgeProps {
  onOpenSettings?: () => void;
  className?: string;
  showHotkeyHint?: boolean;
}

export function AIStatusBadge({
  onOpenSettings,
  className = '',
  showHotkeyHint = true,
}: AIStatusBadgeProps) {
  const [activeProvider, setActiveProvider] = useState<AIProviderType>('mock');
  const [activeModel, setActiveModel] = useState<string>('medieval-chronicle-mock');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeNPC, setActiveNPC] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasTestedOnline, setHasTestedOnline] = useState<boolean>(false);

  useEffect(() => {
    // Read initial state
    const currentProv = keyVault.getActiveProvider();
    const config = keyVault.getConfig(currentProv);
    setActiveProvider(currentProv);
    setActiveModel(config.model || currentProv);

    const testRes = keyVault.getTestResult(currentProv);
    setHasTestedOnline(testRes ? testRes.success : currentProv === 'mock');

    // Subscribe to key vault events
    const unsubscribe = keyVault.subscribe((payload) => {
      if (payload.type === 'provider-changed' || payload.type === 'key-updated') {
        const prov = keyVault.getActiveProvider();
        const conf = keyVault.getConfig(prov);
        setActiveProvider(prov);
        setActiveModel(conf.model || prov);
        const res = keyVault.getTestResult(prov);
        setHasTestedOnline(res ? res.success : prov === 'mock');
      }

      if (payload.type === 'request-start') {
        setIsThinking(true);
        setActiveNPC(payload.data?.npc || 'NPC');
      }

      if (payload.type === 'request-end') {
        setIsThinking(false);
        setActiveNPC(null);
      }

      if (payload.type === 'test-complete') {
        setHasTestedOnline(payload.data?.success ?? false);
      }
    });

    // Listen for [K] hotkey to toggle AI settings modal
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (onOpenSettings) {
          onOpenSettings();
        } else {
          setIsModalOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenSettings]);

  const handleBadgeClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setIsModalOpen(true);
    }
  };

  const getProviderLabel = (prov: AIProviderType): string => {
    switch (prov) {
      case 'gemini':
        return 'Gemini 2.0';
      case 'openai':
        return 'OpenAI 4o';
      case 'anthropic':
        return 'Claude 3.5';
      case 'ollama':
        return 'Ollama Local';
      case 'custom':
        return 'Custom LLM';
      case 'mock':
      default:
        return 'Mock Chronicle';
    }
  };

  const getStatusDot = () => {
    if (isThinking) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
      );
    }

    if (activeProvider === 'mock') {
      return <span className="h-2 w-2 rounded-full bg-amber-400/80 shadow-[0_0_6px_#fbbf24]" />;
    }

    if (hasTestedOnline) {
      return <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />;
    }

    return <span className="h-2 w-2 rounded-full bg-zinc-500" />;
  };

  return (
    <>
      <div
        onClick={handleBadgeClick}
        className={`group cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
        title="Click or press [K] to configure Bring-Your-Own-AI settings"
      >
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/80 backdrop-blur-md shadow-lg hover:border-amber-400/60 transition">
          {/* Status Dot */}
          <div className="flex items-center justify-center">
            {getStatusDot()}
          </div>

          {/* Engine Icon */}
          <div className="text-amber-400">
            {isThinking ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bot className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Provider Label & Subtext */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold font-serif tracking-wide text-zinc-100 group-hover:text-amber-300 transition">
                {isThinking ? `${activeNPC} thinking...` : getProviderLabel(activeProvider)}
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 leading-none truncate max-w-[110px]">
              {isThinking ? 'Generating speech' : activeModel}
            </span>
          </div>

          {/* Hotkey hint [K] */}
          {showHotkeyHint && (
            <div className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/80 text-[10px] font-mono text-amber-300 font-bold group-hover:bg-amber-500 group-hover:text-black transition">
              K
            </div>
          )}

          <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Internal Modal Fallback if not controlled externally */}
      {!onOpenSettings && (
        <AISettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default AIStatusBadge;
