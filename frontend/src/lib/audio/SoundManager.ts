'use client';

/**
 * Procedural Web Audio Sound Manager for Sovereign Lands.
 * Synthesizes crisp medieval chimes, UI clicks, and fanfares without external audio assets.
 * Persists Master, Ambience, and SFX volume levels in localStorage.
 */

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  ambienceVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

const STORAGE_KEY = 'sovereign_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  ambienceVolume: 0.6,
  sfxVolume: 0.8,
  isMuted: false,
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private listeners: Set<(settings: AudioSettings) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } catch {
        // Fallback to defaults
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch {}
    }
    this.listeners.forEach((cb) => cb(this.settings));
  }

  public subscribe(cb: (settings: AudioSettings) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private getEffectiveVolume(type: 'sfx' | 'ambience' = 'sfx'): number {
    if (this.settings.isMuted) return 0;
    const catVol = type === 'ambience' ? this.settings.ambienceVolume : this.settings.sfxVolume;
    return Math.max(0, Math.min(1, this.settings.masterVolume * catVol));
  }

  /**
   * Crisp UI click / tap sound
   */
  public playClick() {
    const ctx = this.initContext();
    if (!ctx) return;
    const vol = this.getEffectiveVolume('sfx') * 0.15;
    if (vol <= 0) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Interactive volume slider feedback chime
   */
  public playVolumeFeedback(pitchFactor: number = 1.0) {
    const ctx = this.initContext();
    if (!ctx) return;
    const vol = this.getEffectiveVolume('sfx') * 0.2;
    if (vol <= 0) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 440 * Math.max(0.5, Math.min(2.0, pitchFactor));
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  /**
   * Menu toggle / Pause chime
   */
  public playMenuChime(isOpening: boolean = true) {
    const ctx = this.initContext();
    if (!ctx) return;
    const vol = this.getEffectiveVolume('sfx') * 0.22;
    if (vol <= 0) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const f1 = isOpening ? 523.25 : 659.25; // C5 or E5
      const f2 = isOpening ? 659.25 : 523.25; // E5 or C5

      osc.frequency.setValueAtTime(f1, now);
      osc.frequency.setValueAtTime(f2, now + 0.08);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }
}

export const soundManager = new SoundManager();
