'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Cpu,
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
  HardDrive,
} from 'lucide-react';
import { keyVault } from '../../../../ai-system/providers/KeyVault';
import {
  AIProviderType,
  ProviderConfig,
  ConnectionTestResult,
} from '../../../../ai-system/providers/types';

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    id: 'custom',
    name: 'Custom Endpoint',
    badge: 'Self-Hosted',
    description: 'Connect any OpenAI-compatible API (LM Studio, vLLM, LocalAI).',
    defaultModels: ['default', 'custom-llm'],
    docUrl: '',
    color: 'from-cyan-600 to-blue-600',
    requiresKey: false,
  },
  {
    id: 'mock',
    name: 'Medieval Chronicle (Mock)',
    badge: 'Built-in Demo',
    description: 'Instant offline canned dialogue for all NPCs. No internet or setup required.',
    defaultModels: ['medieval-chronicle-mock'],
    docUrl: '',
    color: 'from-zinc-600 to-stone-600',
    requiresKey: false,
  },
];

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('gemini');
  const [activeProvider, setActiveProvider] = useState<AIProviderType>('mock');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [endpointInput, setEndpointInput] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Load initial settings from KeyVault
  useEffect(() => {
    if (!isOpen) return;

    const currentActive = keyVault.getActiveProvider();
    setActiveProvider(currentActive);
    setSelectedProvider(currentActive);
    loadProviderState(currentActive);

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
    setTemperature(config.temperature ?? 0.7);
    setTestResult(keyVault.getTestResult(provider) || null);

    if (provider === 'ollama') {
      fetchOllamaTags(config.endpointUrl || 'http://localhost:11434');
    }
  };

  const handleProviderTabClick = (provider: AIProviderType) => {
    setSelectedProvider(provider);
    loadProviderState(provider);
  };

  const currentMeta = useMemo(() => {
    return PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];
  }, [selectedProvider]);

  const fetchOllamaTags = async (url: string) => {
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name);
          setOllamaModels(names);
          if (names.length > 0 && !names.includes(selectedModel)) {
            setSelectedModel(names[0]);
          }
        }
      }
    } catch (e) {
      // Ollama not currently running
      setOllamaModels([]);
    }
  };

  const handleSaveAndActivate = () => {
    const configUpdate: Partial<ProviderConfig> = {
      apiKey: apiKeyInput.trim(),
      model: selectedModel,
      endpointUrl: endpointInput.trim() || undefined,
      temperature,
    };

    keyVault.updateConfig(selectedProvider, configUpdate);
    keyVault.setActiveProvider(selectedProvider);
    setActiveProvider(selectedProvider);

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save current fields first
    keyVault.updateConfig(selectedProvider, {
      apiKey: apiKeyInput.trim(),
      model: selectedModel,
      endpointUrl: endpointInput.trim() || undefined,
    });

    try {
      const result = await keyVault.testConnection(selectedProvider);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err?.message || 'Test failed',
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-zinc-950/95 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-gradient-to-r from-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide text-amber-200">
                BYOAI Provider Hub & Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Connect your personal AI models to drive open-world 3D NPCs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Close [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Provider Sidebar */}
          <div className="w-56 border-r border-zinc-800/80 bg-zinc-900/60 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Select Engine
            </div>
            {PROVIDERS.map((prov) => {
              const isSelected = selectedProvider === prov.id;
              const isActive = activeProvider === prov.id;

              return (
                <button
                  key={prov.id}
                  onClick={() => handleProviderTabClick(prov.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200 shadow-sm'
                      : 'hover:bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{prov.name}</span>
                    <span className="text-[10px] opacity-70">{prov.badge}</span>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Configuration Main Panel */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Provider Banner */}
            <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-zinc-100">
                    {currentMeta.name}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-zinc-800 border border-zinc-700 text-amber-300 font-mono">
                    {currentMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  {currentMeta.description}
                </p>
              </div>

              {currentMeta.docUrl && (
                <a
                  href={currentMeta.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* API Key Input (if required) */}
            {currentMeta.requiresKey && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>API Key</span>
                  {apiKeyInput && (
                    <button
                      onClick={handleClearKey}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Key
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={`Enter your ${currentMeta.name} API Key...`}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 outline-none font-mono text-zinc-200 placeholder:text-zinc-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Ollama Endpoint or Custom URL */}
            {(selectedProvider === 'ollama' || selectedProvider === 'custom') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Endpoint URL</span>
                  {selectedProvider === 'ollama' && (
                    <button
                      onClick={() => fetchOllamaTags(endpointInput || 'http://localhost:11434')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Detect Local Models
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  placeholder={selectedProvider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400/80 outline-none font-mono text-zinc-200 placeholder:text-zinc-600"
                />
                {selectedProvider === 'ollama' && ollamaModels.length === 0 && (
                  <p className="text-[11px] text-amber-400/80">
                    💡 Tip: Start Ollama with <code className="font-mono bg-zinc-800 px-1 py-0.5 rounded">OLLAMA_ORIGINS=&quot;*&quot; ollama serve</code> to enable browser access.
                  </p>
                )}
              </div>
            )}

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Model Choice
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400/80 outline-none text-zinc-200 font-mono"
                >
                  {(selectedProvider === 'ollama' && ollamaModels.length > 0
                    ? ollamaModels
                    : currentMeta.defaultModels
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="custom-input">+ Custom model name...</option>
                </select>

                {selectedModel === 'custom-input' && (
                  <input
                    type="text"
                    placeholder="Type model name..."
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 font-mono"
                  />
                )}
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Creativity / Temperature</span>
                <span className="font-mono text-amber-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Predictable (0.2)</span>
                <span>Balanced (0.7)</span>
                <span>Expressive (1.1)</span>
              </div>
            </div>

            {/* Connection Test & Feedback */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-750 active:scale-95 transition disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isTesting ? 'Pinging Provider...' : 'Test Connection'}</span>
              </button>

              {testResult && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/60 border-red-500/50 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span>
                    {testResult.success
                      ? `Online (${testResult.latencyMs}ms)`
                      : testResult.error || 'Connection Failed'}
                  </span>
                </div>
              )}
            </div>

            {/* Security Assurance Badge */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-200/90 text-xs">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <span className="font-semibold block text-emerald-300">
                  Zero Server Storage Guarantee
                </span>
                <span className="opacity-80 leading-relaxed text-[11px]">
                  Keys are stored exclusively in your browser&apos;s encrypted local storage.
                  Requests are dispatched directly from your browser to AI provider endpoints.
                  No intermediary server or telemetry ever accesses your keys.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Current Active:</span>
            <span className="text-xs font-mono font-bold text-amber-300 uppercase">
              {activeProvider}
            </span>
            {saveSuccessNotice && (
              <span className="text-xs text-emerald-400 animate-pulse font-medium">
                ✓ Provider Activated & Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndActivate}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-lg shadow-amber-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activate & Save Engine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISettingsModal;
