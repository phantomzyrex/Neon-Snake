/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useInputStore, inputManager } from '../store/inputStore';
import { TouchControls } from './TouchControls';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MousePointer,
  Smartphone,
  Keyboard,
  Zap,
  X,
  Share2,
  Check,
} from 'lucide-react';
import { soundFX } from '../utils/audio';

export function UI() {
  const { gameState, playerId, joinGame } = useGameStore();
  const {
    soundEnabled,
    toggleSound,
    leaderboardOpen,
    toggleLeaderboard,
    setLeaderboardOpen,
    isTouchDevice,
  } = useInputStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';
  const canBoost = isAlive && (player?.score ?? 0) > 10;

  // Track mouse coordinates for aim guide when alive and playing with mouse
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (inputManager.lastInputDevice === 'mouse' && isAlive) {
        setMouseCoord({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isAlive]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    soundFX.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen policy restriction
    }
  };

  const handleCopyShare = async () => {
    soundFX.playClick();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePlayClick = () => {
    soundFX.playClick();
    joinGame();
  };

  // Find player's current rank in leaderboard
  const playerRank =
    gameState && playerId
      ? gameState.leaderboard.findIndex((e) => e.id === playerId) + 1
      : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden">
      {/* Visual Mouse Aim Cursor & Heading Line (only shown during mouse steering) */}
      {isAlive && mouseCoord && inputManager.lastInputDevice === 'mouse' && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 opacity-60 transition-opacity duration-300">
          <line
            x1={window.innerWidth / 2}
            y1={window.innerHeight / 2}
            x2={mouseCoord.x}
            y2={mouseCoord.y}
            stroke={player?.color || '#38bdf8'}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <circle
            cx={mouseCoord.x}
            cy={mouseCoord.y}
            r="8"
            fill="none"
            stroke={player?.color || '#38bdf8'}
            strokeWidth="2"
            opacity="0.8"
          />
          <circle
            cx={mouseCoord.x}
            cy={mouseCoord.y}
            r="2"
            fill={player?.color || '#38bdf8'}
          />
        </svg>
      )}

      {/* Top Bar */}
      <header className="flex justify-between items-start pointer-events-auto relative z-20 gap-2">
        {/* Brand & Score */}
        <div className="flex flex-col gap-0.5">
          <h1
            className="text-xl sm:text-2xl font-black text-white tracking-wider"
            style={{ textShadow: '0 0 12px rgba(56,189,248,0.7)' }}
          >
            NEON<span className="text-cyan-400">.</span>SNAKE
          </h1>
          {isAlive && player && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-white/90">
              <span className="text-cyan-300">Length: {Math.floor(player.score)}</span>
              {playerRank > 0 && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-amber-400">#{playerRank}</span>
                </>
              )}
              {canBoost && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-0.5 text-emerald-400 text-[11px] animate-pulse">
                    <Zap size={12} /> Ready
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Controls Hint (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 opacity-80 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-mono text-white/90 bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
            <MousePointer size={12} className="text-cyan-400" />
            <span>Mouse to steer</span>
            <span className="text-white/30">/</span>
            <Keyboard size={12} className="text-purple-400" />
            <span>A/D</span>
            <span className="text-white/30">·</span>
            <span className="text-amber-400">Click / Space</span>
            <span>boost</span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md rounded-full text-white text-xs font-medium transition-all border border-white/10 flex items-center gap-1.5"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-zinc-400" />}
            <span className="hidden sm:inline text-xs">{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>

          {/* Leaderboard Toggle Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              toggleLeaderboard();
            }}
            aria-label="Toggle leaderboard"
            className={`p-2 sm:px-3 sm:py-2 backdrop-blur-md rounded-full text-xs font-medium transition-all border active:scale-95 flex items-center gap-1.5 ${
              leaderboardOpen
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
            }`}
            title="Leaderboard"
          >
            <Trophy size={16} className={leaderboardOpen ? 'text-yellow-400' : 'text-zinc-300'} />
            <span className="hidden sm:inline text-xs">Ranks</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md rounded-full text-white text-xs font-medium transition-all border border-white/10 flex items-center gap-1.5"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="hidden sm:inline text-xs">{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>

          {/* Share Link (Avoid window.open for iframe policy) */}
          <button
            onClick={handleCopyShare}
            aria-label="Share game link"
            className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md rounded-full text-white text-xs font-medium transition-all border border-white/10 flex items-center gap-1.5"
            title="Copy game link"
          >
            {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            <span className="hidden sm:inline text-xs">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Leaderboard Panel (Responsive: Desktop floating card, Mobile slide-in drawer) */}
      <AnimatePresence>
        {leaderboardOpen && gameState && gameState.leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-16 right-3 sm:right-4 z-20 w-60 sm:w-64 max-h-[60vh] bg-black/70 backdrop-blur-lg rounded-2xl p-3.5 border border-white/15 pointer-events-auto shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white/90 text-xs font-bold tracking-wider uppercase font-mono">
                <Trophy size={14} className="text-yellow-400" />
                <span>Leaderboard</span>
              </div>
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded-md"
                aria-label="Close leaderboard"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 text-xs">
              {gameState.leaderboard.map((entry, i) => {
                const isMe = entry.id === playerId;
                return (
                  <div
                    key={entry.id}
                    className={`flex justify-between items-center py-1 px-2 rounded-lg transition-colors ${
                      isMe ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200' : 'text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-white/40 w-4 font-mono font-medium">{i + 1}.</span>
                      <span
                        style={{ color: entry.color }}
                        className="font-medium truncate max-w-[110px]"
                      >
                        {entry.name} {isMe ? '(You)' : ''}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-white/90 font-bold ml-2">
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* On-Screen Touch / Mobile Controls (active when player is alive) */}
      <TouchControls />

      {/* Menus: Join Arena / You Died */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/70 backdrop-blur-md p-4 z-40"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-900/95 p-6 sm:p-8 rounded-3xl border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-sm sm:max-w-md w-full flex flex-col items-center gap-5"
            >
              {isDead ? (
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
                    Eliminated
                  </span>
                  <h2
                    className="text-4xl sm:text-5xl font-black text-rose-500 tracking-tight"
                    style={{ textShadow: '0 0 20px rgba(244,63,94,0.6)' }}
                  >
                    YOU DIED
                  </h2>
                  <p className="text-white/80 font-mono text-base mt-2">
                    Final Length: <strong className="text-white text-lg">{Math.floor(player.score)}</strong>
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h2
                    className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                    style={{ textShadow: '0 0 15px rgba(56,189,248,0.5)' }}
                  >
                    NEON ARENA
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">
                    Multiplayer real-time snake survival. Slither to the top!
                  </p>
                </div>
              )}

              {/* Multi-platform control instructions */}
              <div className="w-full bg-black/40 rounded-2xl p-3 border border-white/10 flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2.5 text-white/80">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <MousePointer size={13} className="text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Mouse: </span>
                    <span className="text-white/60">Move cursor to steer, click / hold to boost</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/80">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Smartphone size={13} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Mobile Touch: </span>
                    <span className="text-white/60">Drag anywhere to steer, tap BOOST button</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/80">
                  <div className="w-6 h-6 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Keyboard size={13} className="text-purple-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Keys: </span>
                    <span className="text-white/60">A/D or Arrows to turn, Space/W to boost</span>
                  </div>
                </div>
              </div>

              {/* Play / Respawn Button */}
              <button
                onClick={handlePlayClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-base sm:text-lg rounded-2xl transition-all shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-98 tracking-wide cursor-pointer uppercase"
              >
                {isDead ? 'RESPAWN NOW' : 'ENTER ARENA'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
