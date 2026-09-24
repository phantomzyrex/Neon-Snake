/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy
    }
  }

  public playCollect(value: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const baseFreq = 480 + Math.min(value * 60, 400);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext policy
    }
  }

  public playDeath() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext policy
    }
  }

  public setBoost(active: boolean) {
    if (!this.enabled || !active) {
      if (this.boostGain && this.ctx) {
        try {
          this.boostGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
          setTimeout(() => {
            if (!active && this.boostOsc) {
              this.boostOsc.stop();
              this.boostOsc.disconnect();
              this.boostOsc = null;
              this.boostGain = null;
            }
          }, 60);
        } catch {
          // ignore
        }
      }
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    if (!this.boostOsc) {
      try {
        const now = this.ctx.currentTime;
        this.boostOsc = this.ctx.createOscillator();
        this.boostGain = this.ctx.createGain();

        this.boostOsc.type = 'sine';
        this.boostOsc.frequency.setValueAtTime(140, now);
        this.boostOsc.frequency.linearRampToValueAtTime(210, now + 0.2);

        this.boostGain.gain.setValueAtTime(0.001, now);
        this.boostGain.gain.linearRampToValueAtTime(0.07, now + 0.1);

        this.boostOsc.connect(this.boostGain);
        this.boostGain.connect(this.ctx.destination);
        this.boostOsc.start();
      } catch {
        // ignore
      }
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(12);
        else if (type === 'medium') navigator.vibrate(25);
        else if (type === 'heavy') navigator.vibrate([40, 50, 40]);
      } catch {
        // unsupported or disabled
      }
    }
  }
}

export const soundFX = new SoundEffects();
