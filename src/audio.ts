export class ChickenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private lastPopPerfMs = 0;

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
    this.isMuted = !this.isMuted;
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
    // Cheerful 2-note cluck!
    this.tone('triangle', 380, 540, 0.08, 0.18, 0);
    this.tone('triangle', 520, 780, 0.11, 0.2, 0.065);
  }

  public playUpgrade(): void {
    this.tone('triangle', 440, 587, 0.08, 0.18, 0);
    this.tone('triangle', 587, 880, 0.14, 0.2, 0.06);
  }

  public playBugPop(isFoxBoss: boolean): void {
    const now = performance.now();
    if (!isFoxBoss && now - this.lastPopPerfMs < 38) return;
    this.lastPopPerfMs = now;

    if (isFoxBoss) {
      this.tone('sawtooth', 190, 55, 0.28, 0.26, 0);
      this.tone('triangle', 420, 140, 0.22, 0.2, 0.03);
    } else {
      const pitch = 520 + Math.random() * 240;
      this.tone('sine', pitch, pitch * 1.45, 0.045, 0.11, 0);
    }
  }

  public playWaveStart(): void {
    this.tone('triangle', 330, 440, 0.12, 0.18, 0);
    this.tone('triangle', 440, 659, 0.2, 0.22, 0.1);
  }

  public playEggLeak(): void {
    this.tone('sawtooth', 240, 90, 0.2, 0.24, 0);
  }
}
