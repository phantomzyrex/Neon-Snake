/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useInputStore, inputManager } from '../store/inputStore';
import { useGameStore } from '../store/gameStore';
import { Zap, Navigation } from 'lucide-react';
import { soundFX } from '../utils/audio';

export function TouchControls() {
  const { isTouchDevice, mobileControlMode, setMobileControlMode } = useInputStore();
  const { gameState, playerId } = useGameStore();
  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const canBoost = isAlive && (player?.score ?? 0) > 10;

  // Track joystick visual position directly with ref & minimal re-render
  const [joystickVisible, setJoystickVisible] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ originX: 0, originY: 0, currentX: 0, currentY: 0 });
  const [isBoostingTouch, setIsBoostingTouch] = useState(false);

  const boostBtnRef = useRef<HTMLButtonElement>(null);
  const touchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Don't intercept touches if dead or if touch target is a button or modal
      if (!isAlive) return;

      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.pointer-events-auto:not(#touch-surface)')) {
        return;
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        // If boost button touched
        if (boostBtnRef.current && boostBtnRef.current.contains(target)) {
          continue;
        }

        // Steer touch (first active steer touch)
        if (inputManager.touchId === null) {
          inputManager.touchId = touch.identifier;
          inputManager.lastInputDevice = 'touch';

          if (mobileControlMode === 'joystick') {
            inputManager.joystick.active = true;
            inputManager.joystick.originX = touch.clientX;
            inputManager.joystick.originY = touch.clientY;
            inputManager.joystick.currentX = touch.clientX;
            inputManager.joystick.currentY = touch.clientY;

            setJoystickPos({
              originX: touch.clientX,
              originY: touch.clientY,
              currentX: touch.clientX,
              currentY: touch.clientY,
            });
            setJoystickVisible(true);
          } else {
            // Direct touch mode (relative to screen center)
            const dx = touch.clientX - window.innerWidth / 2;
            const dy = -(touch.clientY - window.innerHeight / 2);
            if (Math.hypot(dx, dy) > 15) {
              inputManager.targetAngle = Math.atan2(dy, dx);
            }
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAlive) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === inputManager.touchId) {
          if (mobileControlMode === 'joystick') {
            const dx = touch.clientX - inputManager.joystick.originX;
            const dy = -(touch.clientY - inputManager.joystick.originY);
            const dist = Math.hypot(dx, dy);

            if (dist > 8) {
              inputManager.targetAngle = Math.atan2(dy, dx);
            }

            // Visual knob position clamped to 50px max radius
            const maxRadius = 48;
            const clampedRadius = Math.min(dist, maxRadius);
            const angle = Math.atan2(touch.clientY - inputManager.joystick.originY, touch.clientX - inputManager.joystick.originX);
            const currentX = inputManager.joystick.originX + Math.cos(angle) * clampedRadius;
            const currentY = inputManager.joystick.originY + Math.sin(angle) * clampedRadius;

            inputManager.joystick.currentX = currentX;
            inputManager.joystick.currentY = currentY;

            setJoystickPos((prev) => ({
              ...prev,
              currentX,
              currentY,
            }));
          } else {
            // Direct touch mode
            const dx = touch.clientX - window.innerWidth / 2;
            const dy = -(touch.clientY - window.innerHeight / 2);
            if (Math.hypot(dx, dy) > 15) {
              inputManager.targetAngle = Math.atan2(dy, dx);
            }
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === inputManager.touchId) {
          inputManager.touchId = null;
          inputManager.joystick.active = false;
          setJoystickVisible(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isAlive, mobileControlMode]);

  // Dedicated boost button handlers
  const handleBoostStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canBoost) return;
    inputManager.touchBoost = true;
    inputManager.updateBoost();
    setIsBoostingTouch(true);
    soundFX.triggerHaptic('medium');
  };

  const handleBoostEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.touchBoost = false;
    inputManager.updateBoost();
    setIsBoostingTouch(false);
  };

  if (!isAlive) return null;

  return (
    <>
      {/* Invisible Touch Surface for Steering */}
      <div
        id="touch-surface"
        ref={touchAreaRef}
        className="absolute inset-0 pointer-events-auto touch-none select-none z-10"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />

      {/* Floating Virtual Joystick Visuals */}
      {joystickVisible && mobileControlMode === 'joystick' && (
        <div
          className="fixed pointer-events-none z-30 transition-opacity duration-150"
          style={{
            left: joystickPos.originX - 60,
            top: joystickPos.originY - 60,
            width: 120,
            height: 120,
          }}
        >
          {/* Outer Ring */}
          <div className="w-full h-full rounded-full border border-cyan-400/40 bg-cyan-950/20 backdrop-blur-xs shadow-[0_0_15px_rgba(34,211,238,0.25)] flex items-center justify-center relative">
            {/* Cardinal ticks */}
            <div className="absolute top-1 w-1 h-2 bg-cyan-400/50 rounded-full" />
            <div className="absolute bottom-1 w-1 h-2 bg-cyan-400/50 rounded-full" />
            <div className="absolute left-1 w-2 h-1 bg-cyan-400/50 rounded-full" />
            <div className="absolute right-1 w-2 h-1 bg-cyan-400/50 rounded-full" />

            {/* Inner draggable knob */}
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_12px_rgba(56,189,248,0.8)] border border-white/60 flex items-center justify-center transition-transform duration-75"
              style={{
                left: joystickPos.currentX - joystickPos.originX + 36,
                top: joystickPos.currentY - joystickPos.originY + 36,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Thumb Zone Controls */}
      <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-30 pointer-events-auto flex flex-col items-center gap-3">
        {/* On-Screen Boost Button */}
        <button
          ref={boostBtnRef}
          onTouchStart={handleBoostStart}
          onTouchEnd={handleBoostEnd}
          onMouseDown={handleBoostStart}
          onMouseUp={handleBoostEnd}
          onMouseLeave={handleBoostEnd}
          disabled={!canBoost}
          aria-label="Boost speed"
          className={`relative group flex flex-col items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-full transition-all duration-150 select-none touch-none shadow-2xl active:scale-95 ${
            isBoostingTouch
              ? 'bg-gradient-to-tr from-amber-500 to-rose-500 scale-105 shadow-[0_0_30px_rgba(244,63,94,0.7)] border-2 border-white'
              : canBoost
              ? 'bg-gradient-to-tr from-cyan-900/80 to-blue-900/80 hover:from-cyan-800 hover:to-blue-800 border-2 border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.4)] backdrop-blur-md'
              : 'bg-zinc-900/60 border border-white/10 opacity-40 cursor-not-allowed'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Animated pulse ring when active */}
          {isBoostingTouch && (
            <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/40 pointer-events-none" />
          )}

          <Zap
            size={28}
            className={`transition-colors duration-150 ${
              isBoostingTouch ? 'text-white fill-white' : canBoost ? 'text-cyan-300' : 'text-zinc-500'
            }`}
          />
          <span
            className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
              isBoostingTouch ? 'text-white' : canBoost ? 'text-cyan-200' : 'text-zinc-500'
            }`}
          >
            Boost
          </span>
        </button>
      </div>

      {/* Mobile Touch Mode Switcher in Bottom Left (Small, unobtrusive) */}
      <div className="fixed bottom-5 left-5 sm:bottom-8 sm:left-8 z-30 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            soundFX.playClick();
            setMobileControlMode(mobileControlMode === 'joystick' ? 'direct' : 'joystick');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md text-white/70 hover:text-white text-xs font-mono transition-colors shadow-lg active:scale-95"
          title="Toggle Mobile Steering Style"
        >
          <Navigation size={13} className={mobileControlMode === 'joystick' ? 'text-cyan-400' : 'text-purple-400'} />
          <span className="hidden xs:inline text-[11px]">
            {mobileControlMode === 'joystick' ? 'Joystick Mode' : 'Touch Point'}
          </span>
        </button>
      </div>
    </>
  );
}
