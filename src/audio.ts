import { CannonTypeId, MutationTier } from './types';

export class ChickenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private lastPopPerfMs = 0;
  private lastBossPopPerfMs = 0;
  private lastCritPerfMs = 0;
  private lastShrinePerfMs = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);
    }
    if ((this.ctx.state as string) !== 'running' && (this.ctx.state as string) !== 'closed') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime, 0.015);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private tone(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    durationSec: number,
    peakGain: number,
    delaySec = 0
  ): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || (ctx.state as string) !== 'running') return;
    const t0 = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), t0 + durationSec);
    gain.gain.setValueAtTime(peakGain, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.01);
  }

  public playHenClick(isCrit: boolean, isMegaCob: boolean): void {
    if (isMegaCob) {
      this.tone('triangle', 523.25, 1046.5, 0.14, 0.24, 0);
      this.tone('triangle', 659.25, 1318.5, 0.16, 0.2, 0.05);
    } else if (isCrit) {
      this.tone('triangle', 680, 1180, 0.1, 0.2, 0);
    } else {
      const jitter = (Math.random() - 0.5) * 70;
      this.tone('triangle', 460 + jitter, 760 + jitter, 0.055, 0.14, 0);
    }
  }

  public playBlockedClick(): void {
    this.tone('sine', 165, 110, 0.06, 0.09, 0);
  }

  public playPlaceChicken(): void {
    this.tone('triangle', 380, 540, 0.08, 0.18, 0);
    this.tone('triangle', 520, 780, 0.11, 0.2, 0.065);
  }

  public playUpgrade(): void {
    this.tone('triangle', 440, 587, 0.08, 0.18, 0);
    this.tone('triangle', 587, 880, 0.14, 0.2, 0.06);
  }

  public playBugPop(isFoxBoss: boolean): void {
    const now = performance.now();
    if (isFoxBoss) {
      if (now - this.lastBossPopPerfMs < 75) return;
      this.lastBossPopPerfMs = now;
      this.tone('sawtooth', 190, 55, 0.28, 0.26, 0);
      this.tone('triangle', 420, 140, 0.22, 0.2, 0.03);
    } else {
      if (now - this.lastPopPerfMs < 38) return;
      this.lastPopPerfMs = now;
      const pitch = 520 + Math.random() * 240;
      this.tone('sine', pitch, pitch * 1.45, 0.045, 0.11, 0);
    }
  }

  public playSavageCrit(): void {
    const now = performance.now();
    if (now - this.lastCritPerfMs < 85) return;
    this.lastCritPerfMs = now;
    this.tone('square', 740, 1320, 0.09, 0.16, 0);
    this.tone('triangle', 1046, 1568, 0.11, 0.18, 0.035);
  }

  public playMalevolentShrineCast(): void {
    const now = performance.now();
    if (now - this.lastShrinePerfMs < 140) return;
    this.lastShrinePerfMs = now;
    // Ominous temple bell chime + descending cursed resonance
    this.tone('sine', 587.33, 293.66, 0.34, 0.22, 0);
    this.tone('triangle', 293.66, 110, 0.38, 0.2, 0.02);
    this.tone('square', 880, 440, 0.12, 0.1, 0);
  }

  public playMalevolentShrineImpact(): void {
    // Thunderous Shrine slam + rapid razor-cleave overtones
    this.tone('sawtooth', 220, 38, 0.48, 0.28, 0);
    this.tone('square', 146.83, 32, 0.52, 0.24, 0.02);
    this.tone('triangle', 987.77, 261.63, 0.16, 0.18, 0.05);
    this.tone('triangle', 1318.5, 329.63, 0.16, 0.16, 0.12);
  }

  public playCluckCannon(cannonId: CannonTypeId = 'shockwave'): void {
    if (cannonId === 'time_stop') {
      // Dramatic Chrono Time-Stop pitch-warp + clock-halt chime!
      this.tone('sawtooth', 960, 58, 0.52, 0.28, 0);
      this.tone('sine', 440, 42, 0.56, 0.26, 0.04);
      this.tone('triangle', 1174.66, 587.33, 0.14, 0.22, 0.1);
      this.tone('triangle', 880, 440, 0.22, 0.22, 0.22);
    } else if (cannonId === 'damage_boost') {
      // Heroic blazing War-Horn overdrive fanfare!
      this.tone('sawtooth', 392, 523.25, 0.14, 0.24, 0);
      this.tone('sawtooth', 523.25, 659.25, 0.14, 0.26, 0.09);
      this.tone('square', 659.25, 1046.5, 0.34, 0.22, 0.18);
      this.tone('triangle', 1046.5, 1318.5, 0.36, 0.26, 0.18);
    } else if (cannonId === 'orbital_nova') {
      // Orbital antimatter beam charge + thunderous detonation!
      this.tone('sine', 320, 1480, 0.12, 0.22, 0);
      this.tone('sawtooth', 1240, 52, 0.54, 0.3, 0.1);
      this.tone('square', 640, 48, 0.58, 0.24, 0.12);
    } else if (cannonId === 'cornstorm') {
      // Golden Cornstorm knockback gale + bright coin-like arpeggio!
      this.tone('sawtooth', 720, 120, 0.34, 0.24, 0);
      this.tone('triangle', 587.33, 880, 0.12, 0.24, 0.06);
      this.tone('triangle', 880, 1174.66, 0.14, 0.24, 0.15);
      this.tone('triangle', 1174.66, 1567.98, 0.24, 0.26, 0.24);
    } else {
      this.tone('sawtooth', 880, 110, 0.42, 0.28, 0);
      this.tone('square', 520, 65, 0.48, 0.22, 0.04);
      this.tone('triangle', 1320, 440, 0.3, 0.22, 0.08);
    }
  }

  public playWaveStart(): void {
    this.tone('triangle', 330, 440, 0.12, 0.18, 0);
    this.tone('triangle', 440, 659, 0.2, 0.22, 0.1);
  }

  public playEggLeak(): void {
    this.tone('sawtooth', 240, 90, 0.2, 0.24, 0);
  }

  public playDefeatJingle(): void {
    this.tone('sawtooth', 392, 349.23, 0.22, 0.22, 0.0);
    this.tone('sawtooth', 349.23, 311.13, 0.22, 0.22, 0.2);
    this.tone('sawtooth', 311.13, 261.63, 0.24, 0.24, 0.4);
    this.tone('triangle', 196, 98, 0.55, 0.28, 0.62);
  }

  public playEggWobble(): void {
    this.tone('triangle', 290, 420, 0.09, 0.18, 0);
    this.tone('sine', 420, 310, 0.09, 0.14, 0.07);
  }

  public playEggCrack(stage: 1 | 2): void {
    const base = stage === 1 ? 620 : 880;
    this.tone('square', base, base * 0.45, 0.08, 0.2, 0);
    this.tone('triangle', base * 1.35, base * 1.8, 0.1, 0.18, 0.04);
  }

  public playEggReveal(kind: 'new' | MutationTier): void {
    if (kind === 'new' || kind === 'legendary' || kind === 'mastered' || kind === 'aether') {
      // Grand triumphant 4-note Mythic Hatch fanfare!
      this.tone('triangle', 523.25, 523.25, 0.12, 0.24, 0.0);
      this.tone('triangle', 659.25, 659.25, 0.12, 0.24, 0.1);
      this.tone('triangle', 783.99, 783.99, 0.14, 0.25, 0.2);
      this.tone('triangle', 1046.5, 1318.5, 0.36, 0.28, 0.31);
      this.tone('square', 523.25, 1046.5, 0.32, 0.14, 0.31);
    } else if (kind === 'epic') {
      this.tone('triangle', 440, 587.33, 0.12, 0.22, 0.0);
      this.tone('triangle', 659.25, 880, 0.16, 0.24, 0.1);
      this.tone('triangle', 880, 1174.66, 0.26, 0.24, 0.21);
    } else if (kind === 'rare') {
      this.tone('triangle', 440, 659.25, 0.12, 0.2, 0.0);
      this.tone('triangle', 659.25, 880, 0.2, 0.22, 0.11);
    } else {
      this.tone('triangle', 392, 523.25, 0.11, 0.18, 0.0);
      this.tone('triangle', 523.25, 659.25, 0.16, 0.2, 0.09);
    }
  }
}
