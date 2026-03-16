// Simple event emitter for Game State
export class GameState {
  public score: number = 0;
  public distance: number = 0;
  public pickups: number = 0;
  public isGameOver: boolean = false;
  public pulseCooldownRatio: number = 1;
  public pulseReady: boolean = true;
  public shieldActive: boolean = false;
  public shieldTimer: number = 0;
  public scoreMultiplier: number = 1;
  public scoreMultiplierTimer: number = 0;
  public speedBoostActive: boolean = false;
  public speedBoostTimer: number = 0;
  public highScore: number = 0;
  public isGameStarted: boolean = false;
  public countdown: number = 0;
  
  private listeners: ((state: GameState) => void)[] = [];
  private lastNotifyTime: number = 0;
  private notifyInterval: number = 100; // ms (10fps updates for HUD)

  public onRestart?: () => void;
  public onStart?: () => void;

  constructor() {
    const saved = localStorage.getItem('pulseRunnerHighScore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  public subscribe(listener: (state: GameState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public update(score: number, distance: number, pickups: number, isGameOver: boolean, pulseCooldownRatio: number, pulseReady: boolean, shieldActive: boolean, shieldTimer: number, scoreMultiplier: number, scoreMultiplierTimer: number, speedBoostActive: boolean, speedBoostTimer: number, isGameStarted: boolean, countdown: number) {
    this.score = score;
    this.distance = distance;
    this.pickups = pickups;
    this.pulseCooldownRatio = pulseCooldownRatio;
    this.pulseReady = pulseReady;
    this.shieldActive = shieldActive;
    this.shieldTimer = shieldTimer;
    this.scoreMultiplier = scoreMultiplier;
    this.scoreMultiplierTimer = scoreMultiplierTimer;
    this.speedBoostActive = speedBoostActive;
    this.speedBoostTimer = speedBoostTimer;
    this.isGameStarted = isGameStarted;
    this.countdown = countdown;
    
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('pulseRunnerHighScore', this.highScore.toString());
    }
    
    const forceNotify = isGameOver !== this.isGameOver;
    this.isGameOver = isGameOver;
    
    const now = performance.now();
    if (forceNotify || now - this.lastNotifyTime > this.notifyInterval) {
      this.notify();
      this.lastNotifyTime = now;
    }
  }

  public triggerRestart() {
    if (this.onRestart) {
      this.onRestart();
    }
  }

  public triggerStart() {
    if (this.onStart) {
      this.onStart();
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }
}

export const gameState = new GameState();
