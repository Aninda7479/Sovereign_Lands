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

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateControls((prev) => (prev.forward ? prev : { ...prev, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateControls((prev) => (prev.backward ? prev : { ...prev, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateControls((prev) => (prev.left ? prev : { ...prev, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateControls((prev) => (prev.right ? prev : { ...prev, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          updateControls((prev) => (prev.sprint ? prev : { ...prev, sprint: true }));
          break;
        case 'Space':
          e.preventDefault();
          updateControls((prev) => (prev.jump ? prev : { ...prev, jump: true }));
          break;
        case 'KeyE':
          updateControls((prev) => (prev.interact ? prev : { ...prev, interact: true }));
          break;
        case 'KeyC':
          updateControls((prev) => (prev.build ? prev : { ...prev, build: true }));
          break;
        case 'KeyB':
          updateControls((prev) => (prev.buy ? prev : { ...prev, buy: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateControls((prev) => ({ ...prev, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateControls((prev) => ({ ...prev, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateControls((prev) => ({ ...prev, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateControls((prev) => ({ ...prev, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          updateControls((prev) => ({ ...prev, sprint: false }));
          break;
        case 'Space':
          updateControls((prev) => ({ ...prev, jump: false }));
          break;
        case 'KeyE':
          updateControls((prev) => ({ ...prev, interact: false }));
          break;
        case 'KeyC':
          updateControls((prev) => ({ ...prev, build: false }));
          break;
        case 'KeyB':
          updateControls((prev) => ({ ...prev, buy: false }));
          break;
        default:
          break;
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
