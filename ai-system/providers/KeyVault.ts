/**
 * Sovereign Lands - Client-Side KeyVault
 * Secure client-side storage for Bring-Your-Own-AI (BYOAI) credentials.
 * Keys NEVER leave the player's browser; stored encrypted/obfuscated in localStorage.
 */

import {
  AIProviderType,
  ProviderConfig,
  ConnectionTestResult,
  KeyVaultData,
  ProviderEventPayload,
  ProviderEventType,
} from './types';

const VAULT_STORAGE_KEY = 'sovereign_lands_byoai_vault_v1';
const CIPHER_SALT = 'SL_BYOAI_SALT_2026_948f2c3';

// Default model and endpoint configurations for each provider
export const DEFAULT_PROVIDER_CONFIGS: Record<AIProviderType, ProviderConfig> = {
  openai: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    endpointUrl: 'https://api.openai.com/v1',
    temperature: 0.7,
    maxTokens: 150,
  },
  gemini: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    temperature: 0.7,
    maxTokens: 150,
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: '',
    model: 'claude-3-5-haiku-20241022',
    endpointUrl: 'https://api.anthropic.com/v1',
    temperature: 0.7,
    maxTokens: 150,
  },
  ollama: {
    provider: 'ollama',
    apiKey: '',
    model: 'llama3:8b',
    endpointUrl: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 150,
  },
  custom: {
    provider: 'custom',
    apiKey: '',
    model: 'custom-model',
    endpointUrl: 'http://localhost:8000/v1',
    temperature: 0.7,
    maxTokens: 150,
  },
  mock: {
    provider: 'mock',
    apiKey: 'mock-offline-key',
    model: 'medieval-chronicle-mock',
    endpointUrl: 'local',
    temperature: 0.7,
    maxTokens: 150,
  },
};

export class KeyVault {
  private static instance: KeyVault | null = null;
  private vaultData: KeyVaultData;
  private listeners: Set<(payload: ProviderEventPayload) => void> = new Set();

  private constructor() {
    this.vaultData = this.loadFromStorage();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === VAULT_STORAGE_KEY) {
          this.vaultData = this.loadFromStorage();
          this.emitEvent('key-updated', this.vaultData.activeProvider);
        }
      });
    }
  }

  public static getInstance(): KeyVault {
    if (!KeyVault.instance) {
      KeyVault.instance = new KeyVault();
    }
    return KeyVault.instance;
  }

  /**
   * Obfuscates text using an XOR mask with salt before storing in localStorage
   */
  private obfuscate(plainText: string): string {
    if (!plainText) return '';
    try {
      let result = '';
      for (let i = 0; i < plainText.length; i++) {
        const charCode = plainText.charCodeAt(i) ^ CIPHER_SALT.charCodeAt(i % CIPHER_SALT.length);
        result += String.fromCharCode(charCode);
      }
      return btoa(result);
    } catch (e) {
      return plainText;
    }
  }

  /**
   * De-obfuscates text retrieved from localStorage
   */
  private deobfuscate(cipherText: string): string {
    if (!cipherText) return '';
    try {
      const decoded = atob(cipherText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ CIPHER_SALT.charCodeAt(i % CIPHER_SALT.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (e) {
      return cipherText;
    }
  }

  /**
   * Load vault data from client-side localStorage
   */
  private loadFromStorage(): KeyVaultData {
    const fallback: KeyVaultData = {
      activeProvider: 'mock',
      configs: { ...DEFAULT_PROVIDER_CONFIGS },
      testResults: {},
      rateLimitRPM: 25,
      enableCache: true,
    };

    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw);
      const configs: Record<AIProviderType, ProviderConfig> = { ...DEFAULT_PROVIDER_CONFIGS };

      if (parsed.configs) {
        for (const [provider, conf] of Object.entries(parsed.configs)) {
          const p = provider as AIProviderType;
          if (configs[p]) {
            configs[p] = {
              ...configs[p],
              ...(conf as any),
              apiKey: this.deobfuscate((conf as any).apiKey || ''),
            };
          }
        }
      }

      return {
        activeProvider: parsed.activeProvider || 'mock',
        configs,
        testResults: parsed.testResults || {},
        rateLimitRPM: parsed.rateLimitRPM || 25,
        enableCache: parsed.enableCache !== undefined ? parsed.enableCache : true,
      };
    } catch (err) {
      console.warn('[KeyVault] Failed to load stored credentials, using defaults:', err);
      return fallback;
    }
  }

  /**
   * Save current vault data to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const storageConfigs: Record<string, any> = {};
      for (const [provider, conf] of Object.entries(this.vaultData.configs)) {
        storageConfigs[provider] = {
          ...conf,
          apiKey: this.obfuscate(conf.apiKey || ''),
        };
      }

      const payload = {
        activeProvider: this.vaultData.activeProvider,
        configs: storageConfigs,
        testResults: this.vaultData.testResults,
        rateLimitRPM: this.vaultData.rateLimitRPM,
        enableCache: this.vaultData.enableCache,
      };

      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('[KeyVault] Failed to save credentials to localStorage:', err);
    }
  }

  public subscribe(listener: (payload: ProviderEventPayload) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emitEvent(type: ProviderEventType, provider: AIProviderType, data?: any): void {
    const payload: ProviderEventPayload = {
      type,
      provider,
      timestamp: Date.now(),
      data,
    };
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[KeyVault] Listener error:', e);
      }
    });
  }

  public getActiveProvider(): AIProviderType {
    return this.vaultData.activeProvider;
  }

  public setActiveProvider(provider: AIProviderType): void {
    if (this.vaultData.activeProvider !== provider) {
      this.vaultData.activeProvider = provider;
      this.saveToStorage();
      this.emitEvent('provider-changed', provider);
    }
  }

  public getConfig(provider: AIProviderType): ProviderConfig {
    return this.vaultData.configs[provider] || DEFAULT_PROVIDER_CONFIGS[provider];
  }

  public updateConfig(provider: AIProviderType, partial: Partial<ProviderConfig>): void {
    const current = this.getConfig(provider);
    this.vaultData.configs[provider] = {
      ...current,
      ...partial,
      provider,
    };
    this.saveToStorage();
    this.emitEvent('key-updated', provider, { config: this.vaultData.configs[provider] });
  }

  public getApiKey(provider?: AIProviderType): string | undefined {
    const targetProvider = provider || this.vaultData.activeProvider;
    return this.vaultData.configs[targetProvider]?.apiKey;
  }

  public setApiKey(provider: AIProviderType, apiKey: string): void {
    this.updateConfig(provider, { apiKey: apiKey.trim() });
  }

  public removeApiKey(provider: AIProviderType): void {
    this.updateConfig(provider, { apiKey: '' });
  }

  public clearAllKeys(): void {
    for (const key of Object.keys(this.vaultData.configs)) {
      const p = key as AIProviderType;
      this.vaultData.configs[p].apiKey = '';
    }
    this.vaultData.activeProvider = 'mock';
    this.vaultData.testResults = {};
    this.saveToStorage();
    this.emitEvent('key-updated', 'mock');
  }

  public getTestResult(provider: AIProviderType): ConnectionTestResult | undefined {
    return this.vaultData.testResults[provider];
  }

  public setTestResult(provider: AIProviderType, result: ConnectionTestResult): void {
    this.vaultData.testResults[provider] = result;
    this.saveToStorage();
    this.emitEvent('test-complete', provider, result);
  }

  /**
   * Validate API key format locally before dispatching requests
   */
  public validateKeyFormat(provider: AIProviderType, key: string): { valid: boolean; message?: string } {
    if (provider === 'mock') return { valid: true };
    if (provider === 'ollama') {
      return { valid: true, message: 'Local Ollama does not require an API key.' };
    }

    if (!key || key.trim() === '') {
      return { valid: false, message: 'API key cannot be empty.' };
    }

    const trimmed = key.trim();

    switch (provider) {
      case 'openai':
        if (!trimmed.startsWith('sk-') || trimmed.length < 20) {
          return { valid: false, message: 'OpenAI keys must start with "sk-" and be at least 20 characters.' };
        }
        break;
      case 'gemini':
        if (trimmed.length < 25) {
          return { valid: false, message: 'Google Gemini keys are typically 39 characters.' };
        }
        break;
      case 'anthropic':
        if (!trimmed.startsWith('sk-ant-') || trimmed.length < 30) {
          return { valid: false, message: 'Anthropic keys must start with "sk-ant-".' };
        }
        break;
      case 'custom':
        if (trimmed.length < 3) {
          return { valid: false, message: 'Custom endpoint API key is too short.' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Test connection to provider with ping and latency measurement
   */
  public async testConnection(provider: AIProviderType): Promise<ConnectionTestResult> {
    const config = this.getConfig(provider);
    const startTime = Date.now();

    if (provider === 'mock') {
      const res: ConnectionTestResult = {
        success: true,
        latencyMs: 12,
        modelUsed: config.model,
        testedAt: Date.now(),
      };
      this.setTestResult(provider, res);
      return res;
    }

    // Local validation check
    const val = this.validateKeyFormat(provider, config.apiKey || '');
    if (!val.valid) {
      const res: ConnectionTestResult = {
        success: false,
        latencyMs: 0,
        error: val.message || 'Invalid key format',
        modelUsed: config.model,
        testedAt: Date.now(),
      };
      this.setTestResult(provider, res);
      return res;
    }

    try {
      if (provider === 'ollama') {
        const endpoint = (config.endpointUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`${endpoint}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Ollama returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
        const latencyMs = Date.now() - startTime;

        const res: ConnectionTestResult = {
          success: true,
          latencyMs,
          modelUsed: models.includes(config.model) ? config.model : models[0] || config.model,
          testedAt: Date.now(),
        };
        this.setTestResult(provider, res);
        return res;
      }

      if (provider === 'openai') {
        const endpoint = (config.endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 2,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `OpenAI HTTP ${response.status}`);
        }

        const res: ConnectionTestResult = {
          success: true,
          latencyMs,
          modelUsed: config.model,
          testedAt: Date.now(),
        };
        this.setTestResult(provider, res);
        return res;
      }

      if (provider === 'gemini') {
        const endpoint = (config.endpointUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const url = `${endpoint}/models/${config.model}:generateContent?key=${config.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }],
            generationConfig: { maxOutputTokens: 2 },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gemini HTTP ${response.status}`);
        }

        const res: ConnectionTestResult = {
          success: true,
          latencyMs,
          modelUsed: config.model,
          testedAt: Date.now(),
        };
        this.setTestResult(provider, res);
        return res;
      }

      if (provider === 'anthropic') {
        const endpoint = (config.endpointUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${endpoint}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey || '',
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true',
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 2,
            messages: [{ role: 'user', content: 'Ping' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Anthropic HTTP ${response.status}`);
        }

        const res: ConnectionTestResult = {
          success: true,
          latencyMs,
          modelUsed: config.model,
          testedAt: Date.now(),
        };
        this.setTestResult(provider, res);
        return res;
      }

      if (provider === 'custom') {
        const endpoint = (config.endpointUrl || 'http://localhost:8000/v1').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 2,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
          throw new Error(`Custom endpoint HTTP ${response.status}`);
        }

        const res: ConnectionTestResult = {
          success: true,
          latencyMs,
          modelUsed: config.model,
          testedAt: Date.now(),
        };
        this.setTestResult(provider, res);
        return res;
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const res: ConnectionTestResult = {
        success: false,
        latencyMs,
        error: err?.message || 'Connection failed or timed out',
        modelUsed: config.model,
        testedAt: Date.now(),
      };
      this.setTestResult(provider, res);
      return res;
    }

    return {
      success: false,
      latencyMs: 0,
      error: 'Unknown provider',
      testedAt: Date.now(),
    };
  }
}

export const keyVault = KeyVault.getInstance();
