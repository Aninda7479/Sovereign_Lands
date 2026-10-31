'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CharacterControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  build: boolean;
  buy: boolean;
}

const INITIAL_STATE: CharacterControlsState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  interact: false,
  build: false,
  buy: false,
};

/**
 * GTA-style keyboard and input listener hook for 3D character locomotion.
 * Listens for WASD / Arrow keys, Sprint (Shift), Jump (Space), Interact (E),
 * Build Mode (C), and Buy Parcel (B).
 */
export function useCharacterControls() {
  const [controls, setControls] = useState<CharacterControlsState>(INITIAL_STATE);
  const controlsRef = useRef<CharacterControlsState>(INITIAL_STATE);

  const updateControls = useCallback((updater: (prev: CharacterControlsState) => CharacterControlsState) => {
    controlsRef.current = updater(controlsRef.current);
    setControls(controlsRef.current);
  }, []);

  const resetControls = useCallback(() => {
    controlsRef.current = INITIAL_STATE;
    setControls(INITIAL_STATE);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when focused in text inputs or chat
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        updateControls((prev) => (prev.forward ? prev : { ...prev, forward: true }));
      } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        updateControls((prev) => (prev.backward ? prev : { ...prev, backward: true }));
      } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        updateControls((prev) => (prev.left ? prev : { ...prev, left: true }));
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        updateControls((prev) => (prev.right ? prev : { ...prev, right: true }));
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
        updateControls((prev) => (prev.sprint ? prev : { ...prev, sprint: true }));
      } else if (code === 'Space' || key === ' ' || key === 'spacebar') {
        e.preventDefault();
        updateControls((prev) => (prev.jump ? prev : { ...prev, jump: true }));
      } else if (code === 'KeyE' || key === 'e') {
        updateControls((prev) => (prev.interact ? prev : { ...prev, interact: true }));
      } else if (code === 'KeyC' || key === 'c') {
        updateControls((prev) => (prev.build ? prev : { ...prev, build: true }));
      } else if (code === 'KeyB' || key === 'b') {
        updateControls((prev) => (prev.buy ? prev : { ...prev, buy: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        updateControls((prev) => ({ ...prev, forward: false }));
      } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        updateControls((prev) => ({ ...prev, backward: false }));
      } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        updateControls((prev) => ({ ...prev, left: false }));
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        updateControls((prev) => ({ ...prev, right: false }));
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
        updateControls((prev) => ({ ...prev, sprint: false }));
      } else if (code === 'Space' || key === ' ' || key === 'spacebar') {
        updateControls((prev) => ({ ...prev, jump: false }));
      } else if (code === 'KeyE' || key === 'e') {
        updateControls((prev) => ({ ...prev, interact: false }));
      } else if (code === 'KeyC' || key === 'c') {
        updateControls((prev) => ({ ...prev, build: false }));
      } else if (code === 'KeyB' || key === 'b') {
        updateControls((prev) => ({ ...prev, buy: false }));
      }
    };

    // Reset controls if window loses focus (prevents infinite running)
    const handleBlur = () => {
      resetControls();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateControls, resetControls]);

  return { controls, resetControls, controlsRef };
}

export default useCharacterControls;
