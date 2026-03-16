export class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.enabled = true;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.enabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playPulse() {
    this.playTone(400, 'sine', 0.5, 0.2);
    setTimeout(() => this.playTone(600, 'sine', 0.4, 0.1), 50);
  }

  public playCollect() {
    this.playTone(800, 'square', 0.1, 0.05);
    setTimeout(() => this.playTone(1200, 'square', 0.2, 0.05), 100);
  }

  public playMultiplier() {
    this.playTone(1000, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(1500, 'sine', 0.1, 0.05), 100);
    setTimeout(() => this.playTone(2000, 'sine', 0.2, 0.05), 200);
  }

  public playCrash() {
    this.playTone(100, 'sawtooth', 0.5, 0.3);
    setTimeout(() => this.playTone(50, 'sawtooth', 0.8, 0.3), 100);
  }

  public playExplosion() {
    this.playTone(150, 'square', 0.3, 0.2);
  }

  public playBoost() {
    this.playTone(300, 'triangle', 0.8, 0.1);
    setTimeout(() => this.playTone(400, 'triangle', 0.8, 0.1), 100);
  }
}

export const audioManager = new AudioManager();
