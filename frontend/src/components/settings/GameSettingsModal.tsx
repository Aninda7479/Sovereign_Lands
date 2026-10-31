'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  Cpu,
  Key,
  ShieldCheck,
  Sparkles,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  Sliders,
  ExternalLink,
  Trash2,
  Gamepad2,
  Landmark,
  Shield,
  Swords,
  Coins,
  Monitor,
  Volume2,
} from 'lucide-react';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import {
  AIProviderType,
  ProviderConfig,
  ConnectionTestResult,
} from '../../../../ai-system/providers/types';
import { useParcelContract } from '@/hooks/web3/useParcelContract';
import { useKingdomTreasury } from '@/hooks/web3/useKingdomTreasury';

export interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ai' | 'controls' | 'kingdom' | 'display';
  hudSettings?: {
    showRadar: boolean;
    setShowRadar: (show: boolean) => void;
    showCompass: boolean;
    setShowCompass: (show: boolean) => void;
    showPostProcessing: boolean;
    setShowPostProcessing: (show: boolean) => void;
  };
}

interface ProviderMeta {
  id: AIProviderType;
  name: string;
  badge: string;
  description: string;
  defaultModels: string[];
  docUrl: string;
  color: string;
  requiresKey: boolean;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Recommended',
    description: 'Ultra-fast, high-intelligence model powering rich NPC interactions.',
    defaultModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    docUrl: 'https://aistudio.google.com/app/apikey',
    color: 'from-blue-600 to-indigo-600',
    requiresKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Popular',
    description: 'Industry-standard reasoning with GPT-4o and lightweight GPT-4o-mini.',
    defaultModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    docUrl: 'https://platform.openai.com/api-keys',
    color: 'from-emerald-600 to-teal-600',
    requiresKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Creative',
    description: 'Nuanced medieval narrative voice with Claude 3.5 Haiku and Sonnet.',
    defaultModels: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
    docUrl: 'https://console.anthropic.com/settings/keys',
    color: 'from-amber-600 to-orange-600',
    requiresKey: true,
  },
  {
    id: 'ollama',
    name: 'Local Ollama',
    badge: '100% Free & Offline',
    description: 'Run private local LLMs on your GPU (e.g. Llama 3, Mistral) at zero cost.',
    defaultModels: ['llama3:8b', 'mistral:7b', 'phi3:mini', 'gemma2:9b'],
    docUrl: 'https://ollama.com',
    color: 'from-purple-600 to-pink-600',
    requiresKey: false,
  },
  {
    id: 'mock',
    name: 'Medieval Chronicle (Built-in)',
    badge: 'Built-in Demo',
    description: 'Instant offline canned dialogue for all NPCs. No internet or setup required.',
    defaultModels: ['default-lore-engine'],
    docUrl: '',
    color: 'from-stone-600 to-stone-700',
    requiresKey: false,
  },
];

export function GameSettingsModal({
  isOpen,
  onClose,
  initialTab = 'ai',
  hudSettings,
}: GameSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'controls' | 'kingdom' | 'display'>(initialTab);

  // Synchronize initialTab if provided
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // AI Tab State
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('gemini');
  const [activeProvider, setActiveProvider] = useState<AIProviderType>('mock');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [endpointInput, setEndpointInput] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Web3 / Kingdom State
  const { playerGold, playerParcels } = useParcelContract();
  const { northStats, southStats, activeProposal } = useKingdomTreasury();

  // Load initial settings from KeyVault
  useEffect(() => {
    if (!isOpen) return;

    const currentActive = keyVault.getActiveProvider();
    setActiveProvider(currentActive);
    setSelectedProvider(currentActive === 'mock' ? 'gemini' : currentActive);
    loadProviderState(currentActive === 'mock' ? 'gemini' : currentActive);

    const unsubscribe = keyVault.subscribe((payload) => {
      if (payload.type === 'provider-changed') {
        setActiveProvider(payload.provider);
      }
      if (payload.type === 'test-complete' && payload.provider === selectedProvider) {
        setTestResult(payload.data);
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  const loadProviderState = (provider: AIProviderType) => {
    const config = keyVault.getConfig(provider);
    setApiKeyInput(config.apiKey || '');
    setSelectedModel(config.model || '');
    setEndpointInput(config.endpointUrl || '');
    setTestResult(keyVault.getTestResult(provider) || null);
  };

  const handleProviderSelect = (provider: AIProviderType) => {
    setSelectedProvider(provider);
    loadProviderState(provider);
  };

  const currentMeta = useMemo(() => {
    return PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];
  }, [selectedProvider]);

  // Handle Save & Activate
  const handleSaveAndActivate = async () => {
    keyVault.updateConfig(selectedProvider, {
      apiKey: apiKeyInput.trim(),
      model: selectedModel || currentMeta.defaultModels[0],
      endpointUrl: endpointInput.trim() || undefined,
    });
    keyVault.setActiveProvider(selectedProvider);
    setActiveProvider(selectedProvider);

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);

    // Auto-trigger ping test
    handleTestConnection();
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      keyVault.updateConfig(selectedProvider, {
        apiKey: apiKeyInput.trim(),
        model: selectedModel || currentMeta.defaultModels[0],
        endpointUrl: endpointInput.trim() || undefined,
      });
      const result = await keyVault.testConnection(selectedProvider);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err?.message || 'Connection test failed',
        testedAt: Date.now(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = () => {
    keyVault.removeApiKey(selectedProvider);
    setApiKeyInput('');
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-zinc-100 flex items-center gap-2">
                Kingdom Settings & Control Center
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your Bring-Your-Own-AI brain, hotkeys, realm governance, and graphics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOP TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'ai'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Brain & Key Vault</span>
            {activeProvider !== 'mock' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'controls'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Controls & Hotkeys</span>
          </button>

          <button
            onClick={() => setActiveTab('kingdom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'kingdom'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Kingdom & Governance</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'display'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Display & Clean HUD</span>
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: AI BRAIN & KEY VAULT                                               */}
          {/* ========================================================================= */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Informational Hero Card */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 to-zinc-900/30 flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <div className="font-semibold text-zinc-100 flex items-center gap-2">
                    Bring-Your-Own-AI (BYOAI) Architecture
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      100% Client-Side Privacy
                    </span>
                  </div>
                  <p>
                    Your API keys are encrypted and stored solely in your local browser{' '}
                    <code className="text-amber-300 font-mono">localStorage</code>. They are never sent
                    to any third-party server. All NPC dialogue generation (Sir Gareth, Farmer Aldric, Raymond Vance)
                    and Citadel battle intelligence runs directly from your machine.
                  </p>
                </div>
              </div>

              {/* Provider Selector Grid */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.id;
                    const isActive = activeProvider === p.id;

                    return (
                      <button
                        key={p.id}
                        onClick={() => handleProviderSelect(p.id)}
                        className={`relative p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-100">{p.name}</span>
                            {isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2">{p.description}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[10px]">
                          <span className="text-amber-300/80 font-medium">{p.badge}</span>
                          {p.requiresKey && (
                            <span className="text-zinc-500 font-mono">API Key Req</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Provider Configuration Card */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-zinc-100">
                      Configure {currentMeta.name}
                    </h3>
                  </div>
                  {currentMeta.docUrl && (
                    <a
                      href={currentMeta.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* API Key Input */}
                {currentMeta.requiresKey && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 block font-medium">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={`Paste your ${currentMeta.name} secret key...`}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition pr-20"
                      />
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        >
                          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {apiKeyInput && (
                          <button
                            type="button"
                            onClick={handleClearKey}
                            className="p-1 rounded-lg hover:bg-zinc-800 text-rose-400 hover:text-rose-300"
                            title="Clear saved key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 block font-medium">Model Selection</label>
                  <select
                    value={selectedModel || currentMeta.defaultModels[0]}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 transition"
                  >
                    {currentMeta.defaultModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Local Ollama / Custom Endpoint URL */}
                {(selectedProvider === 'ollama' || selectedProvider === 'custom') && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 block font-medium">
                      Endpoint Base URL
                    </label>
                    <input
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      placeholder={selectedProvider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                )}

                {/* Action Buttons: Test Connection & Save */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || (currentMeta.requiresKey && !apiKeyInput)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Pinging Provider...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={handleSaveAndActivate}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Activate Brain</span>
                  </button>
                </div>

                {/* Connection Test Result Pill */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      testResult.success
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{testResult.success ? `Connected successfully (${testResult.modelUsed || selectedModel})` : testResult.error || 'Connection failed'}</span>
                    </div>
                    {testResult.latencyMs > 0 && (
                      <span className="font-mono text-[10px] text-zinc-400">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}

                {saveSuccessNotice && (
                  <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 text-xs text-center font-medium">
                    ✓ Configuration saved to local storage! AI Engine is now active.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CONTROLS & HOTKEYS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Standard GTA Keybindings</h3>
                  <p className="text-xs text-zinc-400">
                    Sovereign Lands uses intuitive over-the-shoulder third-person controls.
                  </p>
                </div>
                <kbd className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
                  Mouse Look Enabled
                </kbd>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'W / ↑', action: 'Move Forward', desc: 'Runs in the camera view direction' },
                  { key: 'S / ↓', action: 'Move Backward', desc: 'Backpedals toward the camera' },
                  { key: 'A / ←', action: 'Strafe Left', desc: 'Steps laterally to the left' },
                  { key: 'D / →', action: 'Strafe Right', desc: 'Steps laterally to the right' },
                  { key: 'Shift (Hold)', action: 'Sprint', desc: 'Increases locomotion speed to 8.5 m/s' },
                  { key: 'Space', action: 'Jump', desc: 'Applies Rapier physics vertical impulse' },
                  { key: '[B]', action: 'Claim Land Parcel', desc: 'Stakes ownership over the current plot' },
                  { key: '[C]', action: 'Construction Mode', desc: 'Toggles 3D holographic structure placement' },
                  { key: '[R]', action: 'Rotate Hologram', desc: 'Rotates active structure preview 90 degrees' },
                  { key: '[E]', action: 'Interact / Talk / Harvest', desc: 'Talks with roaming NPCs or harvests gold tithes' },
                  { key: '[M]', action: 'Tactical War Map', desc: 'Opens aerial 3D kingdom balance map' },
                  { key: '[Esc] / [K]', action: 'Settings Hub', desc: 'Opens this Master Settings & AI Vault modal' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-200">{item.action}</div>
                      <div className="text-[11px] text-zinc-400">{item.desc}</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-400 shadow-inner">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: KINGDOM & GOVERNANCE                                               */}
          {/* ========================================================================= */}
          {activeTab === 'kingdom' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* North Kingdom Card */}
                <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-black text-sm text-sky-300">
                      BOREAL REALM (NORTH)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                      Frostfang Citadel
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-rose-300">{northStats.totalAttack}</div>
                      <div className="text-[10px] text-zinc-400">ATTACK</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-emerald-300">{northStats.totalDefense}</div>
                      <div className="text-[10px] text-zinc-400">DEFENSE</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-amber-300">{northStats.treasuryGold}</div>
                      <div className="text-[10px] text-zinc-400">TREASURY</div>
                    </div>
                  </div>
                </div>

                {/* South Kingdom Card */}
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-black text-sm text-amber-300">
                      SOLARA REALM (SOUTH)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                      Solara Keep
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-rose-300">{southStats.totalAttack}</div>
                      <div className="text-[10px] text-zinc-400">ATTACK</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-emerald-300">{southStats.totalDefense}</div>
                      <div className="text-[10px] text-zinc-400">DEFENSE</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-xs font-mono font-bold text-amber-300">{southStats.treasuryGold}</div>
                      <div className="text-[10px] text-zinc-400">TREASURY</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Decree Section */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <span>Citadel Council Active Decree</span>
                </div>
                {activeProposal && !activeProposal.executed ? (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-xs text-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Decree #{activeProposal.id}: </span>
                      {activeProposal.description}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                      Voting Active
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    No active war or tax decrees pending. Landholders can propose decrees at the Citadel War Table.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DISPLAY & CLEAN SCREEN                                             */}
          {/* ========================================================================= */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Clean Screen & HUD Customization</h3>
                <p className="text-xs text-zinc-400">
                  Toggle on-screen HUD elements on and off to enjoy a completely cinematic medieval view.
                </p>
              </div>

              {hudSettings && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-zinc-200">GTA Radar Mini-Map</div>
                      <div className="text-[11px] text-zinc-400">Shows bottom-left rotating compass and parcel beacons</div>
                    </div>
                    <button
                      onClick={() => hudSettings.setShowRadar(!hudSettings.showRadar)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        hudSettings.showRadar
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {hudSettings.showRadar ? 'ENABLED' : 'HIDDEN'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-zinc-200">Compass Heading Ribbon</div>
                      <div className="text-[11px] text-zinc-400">Top-center compass ribbon showing cardinal directions</div>
                    </div>
                    <button
                      onClick={() => hudSettings.setShowCompass(!hudSettings.showCompass)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        hudSettings.showCompass
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {hudSettings.showCompass ? 'ENABLED' : 'HIDDEN'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-zinc-200">Cinematic Vignette</div>
                      <div className="text-[11px] text-zinc-400">Subtle atmospheric edge shading across viewport</div>
                    </div>
                    <button
                      onClick={() => hudSettings.setShowPostProcessing(!hudSettings.showPostProcessing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        hudSettings.showPostProcessing
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {hudSettings.showPostProcessing ? 'ENABLED' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Esc</kbd> anytime to toggle this menu</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameSettingsModal;
