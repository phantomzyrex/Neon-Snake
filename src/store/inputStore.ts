/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { soundFX } from '../utils/audio';

export interface JoystickData {
  active: boolean;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
}

// 60FPS high-speed non-reactive input container for Three.js render loop
export const inputManager = {
  targetAngle: null as number | null,
  turnLeft: false,
  turnRight: false,
  isBoosting: false,
  keyBoost: false,
  mouseBoost: false,
  touchBoost: false,
  mousePos: null as { x: number; y: number } | null,
  mouseActive: false,
  touchId: null as number | null,
  joystick: {
    active: false,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
  } as JoystickData,
  lastInputDevice: 'mouse' as 'mouse' | 'touch' | 'keyboard',

  updateBoost() {
    this.isBoosting = this.keyBoost || this.mouseBoost || this.touchBoost;
    soundFX.setBoost(this.isBoosting);
  },

  reset() {
    this.targetAngle = null;
    this.turnLeft = false;
    this.turnRight = false;
    this.keyBoost = false;
    this.mouseBoost = false;
    this.touchBoost = false;
    this.isBoosting = false;
    this.mouseActive = false;
    this.touchId = null;
    this.joystick.active = false;
    soundFX.setBoost(false);
  }
};

interface InputStoreState {
  soundEnabled: boolean;
  toggleSound: () => void;
  leaderboardOpen: boolean;
  toggleLeaderboard: () => void;
  setLeaderboardOpen: (val: boolean) => void;
  isTouchDevice: boolean;
  setIsTouchDevice: (val: boolean) => void;
  mobileControlMode: 'joystick' | 'direct';
  setMobileControlMode: (mode: 'joystick' | 'direct') => void;
  touchBoostActive: boolean;
  setTouchBoostActive: (active: boolean) => void;
}

export const useInputStore = create<InputStoreState>((set) => ({
  soundEnabled: true,
  toggleSound: () =>
    set((state) => {
      const next = !state.soundEnabled;
      soundFX.enabled = next;
      return { soundEnabled: next };
    }),
  leaderboardOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  toggleLeaderboard: () => set((state) => ({ leaderboardOpen: !state.leaderboardOpen })),
  setLeaderboardOpen: (val: boolean) => set({ leaderboardOpen: val }),
  isTouchDevice:
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  setIsTouchDevice: (val: boolean) => set({ isTouchDevice: val }),
  mobileControlMode: 'joystick',
  setMobileControlMode: (mode: 'joystick' | 'direct') => set({ mobileControlMode: mode }),
  touchBoostActive: false,
  setTouchBoostActive: (active: boolean) => {
    inputManager.touchBoost = active;
    inputManager.updateBoost();
    set({ touchBoostActive: active });
  },
}));
