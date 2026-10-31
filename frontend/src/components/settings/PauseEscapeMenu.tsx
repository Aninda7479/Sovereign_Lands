'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Settings,
  Volume2,
  VolumeX,
  Monitor,
  Eye,
  EyeOff,
  Compass,
  Scroll,
  RotateCcw,
  Sparkles,
  Shield,
  X,
  Sliders,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { soundManager, AudioSettings } from '@/lib/audio/SoundManager';

export interface PauseEscapeMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onOpenSettings: (tab?: 'wallet' | 'ai' | 'controls' | 'kingdom' | 'display') => void;
  onRespawn: () => void;
  hudSettings: {
    showRadar: boolean;
    setShowRadar: (show: boolean) => void;
    showCompass: boolean;
    setShowCompass: (show: boolean) => void;
    showQuestHUD: boolean;
    setShowQuestHUD: (show: boolean) => void;
    showPostProcessing: boolean;
    setShowPostProcessing: (show: boolean) => void;
  };
  graphicsQuality: 'low' | 'medium' | 'high';
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high') => void;
}

export function PauseEscapeMenu({
  isOpen,
  onResume,
  onOpenSettings,
  onRespawn,
  hudSettings,
  graphicsQuality,
  setGraphicsQuality,
}: PauseEscapeMenuProps) {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(soundManager.getSettings());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    return soundManager.subscribe((newSettings) => {
      setAudioSettings(newSettings);
    });
  }, []);

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSettings({ masterVolume: val, isMuted: false });
    soundManager.playVolumeFeedback(val);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSettings({ sfxVolume: val, ambienceVolume: val, isMuted: false });
    soundManager.playVolumeFeedback(val);
  };

  const handleToggleMute = () => {
    soundManager.setSettings({ isMuted: !audioSettings.isMuted });
    soundManager.playClick();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={(e) => {
        // Clicking backdrop resumes game
        if (e.target === e.currentTarget) {
          soundManager.playClick();
          onResume();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border-2 border-amber-500/50 bg-zinc-950/95 shadow-2xl shadow-black/90 p-6 md:p-8 flex flex-col gap-6 text-zinc-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BANNER */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 uppercase">
                SOVEREIGN LANDS
              </h2>
              <div className="text-[11px] font-mono tracking-widest text-amber-300/80 font-bold">
                GAME PAUSED
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition"
            title="Resume Game (Esc or X)"
          >
            <span>Resume</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-400">Esc</kbd>
          </button>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-col gap-2.5">
          {/* 1. RESUME GAME BUTTON */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition"
          >
            <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
            <span>Resume Sovereign Realm</span>
          </button>

          {/* 2. OPEN FULL SETTINGS & AI VAULT */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-amber-500/40 bg-zinc-900/80 hover:bg-zinc-800 hover:border-amber-400 transition group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-100">Kingdom Settings & AI Vault</div>
                <div className="text-[10px] text-zinc-400">Configure Web3 Wallet, BYOAI API Keys, & Keybindings</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold group-hover:translate-x-0.5 transition">
              Open &rarr;
            </span>
          </button>
        </div>

        {/* QUICK SETTINGS SECTION */}
        <div className="flex flex-col gap-4 p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
          {/* GRAPHICS QUALITY PRESET */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">Graphics Quality</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    soundManager.playClick();
                    setGraphicsQuality(lvl);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                    graphicsQuality === lvl
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* VOLUME SLIDERS */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            {/* Master Volume */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-[110px]">
                <button
                  onClick={handleToggleMute}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition"
                  title={audioSettings.isMuted ? 'Unmute' : 'Mute'}
                >
                  {audioSettings.isMuted || audioSettings.masterVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
                <span className="text-xs text-zinc-300">Master</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.isMuted ? 0 : audioSettings.masterVolume}
                onChange={handleMasterVolumeChange}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
                {audioSettings.isMuted ? '0%' : `${Math.round(audioSettings.masterVolume * 100)}%`}
              </span>
            </div>

            {/* SFX / Ambient Volume */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-[110px]">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-zinc-300">Effects & Ambience</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.isMuted ? 0 : audioSettings.sfxVolume}
                onChange={handleSfxVolumeChange}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
                {audioSettings.isMuted ? '0%' : `${Math.round(audioSettings.sfxVolume * 100)}%`}
              </span>
            </div>
          </div>

          {/* HUD DISPLAY VISIBILITY TOGGLES */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Clean Screen & HUD Visibility
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  hudSettings.setShowCompass(!hudSettings.showCompass);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition ${
                  hudSettings.showCompass
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Compass</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  hudSettings.setShowQuestHUD(!hudSettings.showQuestHUD);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition ${
                  hudSettings.showQuestHUD
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                }`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Quest Log</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  hudSettings.setShowRadar(!hudSettings.showRadar);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition ${
                  hudSettings.showRadar
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Radar Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* RESPAWN & QUIT BUTTONS */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
          <button
            onClick={() => {
              soundManager.playClick();
              onRespawn();
              onResume();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Respawn at Citadel</span>
          </button>

          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rose-300">Confirm Reset?</span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-zinc-500 hover:text-rose-400 transition"
            >
              Reset Local Sandbox
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PauseEscapeMenu;
