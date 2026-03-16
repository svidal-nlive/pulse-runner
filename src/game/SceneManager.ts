import { Engine, Scene, Vector3, HemisphericLight, Color3, DirectionalLight, DefaultRenderingPipeline } from '@babylonjs/core';
import { PlayerController } from './PlayerController';
import { TrackManager } from './TrackManager';
import { gameState } from './GameState';
import { WorldItemManager, ItemType } from './WorldItemManager';
import { audioManager } from './AudioManager';

export class SceneManager {
  private engine: Engine;
  private scene: Scene;
  private player: PlayerController;
  private track: TrackManager;
  private itemManager: WorldItemManager;
  private isRunning: boolean = false;
  private isGameOver: boolean = false;
  private isGameStarted: boolean = false;
  private countdown: number = 0;
  private countdownTimer: number = 0;
  private score: number = 0;
  private pickups: number = 0;
  private startZ: number = 0;
  private lastZ: number = 0;

  private pulseCooldown: number = 3.0; // seconds
  private pulseTimer: number = 3.0;

  private scoreMultiplierTimer: number = 0;
  private currentMultiplier: number = 1;

  private resizeObserver: ResizeObserver;
  private pipeline: DefaultRenderingPipeline;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.02, 0.0, 0.05).toColor4(1); // Dark background

    // Lighting
    const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.3;
    ambientLight.groundColor = new Color3(0.1, 0.0, 0.2);

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), this.scene);
    dirLight.intensity = 0.5;
    dirLight.diffuse = new Color3(0.5, 0.5, 1.0);

    // Initialize game modules
    this.player = new PlayerController(this.scene);
    this.track = new TrackManager(this.scene);
    this.itemManager = new WorldItemManager(this.scene);

    this.track.onSegmentRecycled = (zStart, zEnd) => {
      this.itemManager.spawnOnSegment(zStart, zEnd);
    };

    // Initial spawn
    const segments = this.track.getSegments();
    const segLen = this.track.getSegmentLength();
    for (let i = 1; i < segments.length; i++) { // Skip first segment
      const zStart = segments[i].position.z - segLen / 2;
      this.itemManager.spawnOnSegment(zStart, zStart + segLen);
    }

    gameState.onRestart = () => this.restart();
    gameState.onStart = () => this.startGame();

    this.player.onPulseRequested = () => {
      if (this.pulseTimer >= this.pulseCooldown && !this.isGameOver) {
        this.triggerPulse();
      }
    };

    // Set active camera
    this.scene.activeCamera = this.scene.cameras[0];

    // Post-processing pipeline
    this.pipeline = new DefaultRenderingPipeline("defaultPipeline", true, this.scene, [this.scene.activeCamera]);
    this.pipeline.samples = 4;
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.8;
    this.pipeline.bloomWeight = 0.5;
    this.pipeline.fxaaEnabled = true;
    this.pipeline.chromaticAberrationEnabled = true;
    this.pipeline.chromaticAberration.aberrationAmount = 0;

    // Handle window resize
    this.resizeObserver = new ResizeObserver(() => {
      this.engine.resize();
    });
    this.resizeObserver.observe(canvas);

    // Resume audio context on first click
    canvas.addEventListener('click', () => audioManager.resume(), { once: true });

    this.start();
  }

  private triggerPulse() {
    this.pulseTimer = 0;
    this.player.firePulse();
    audioManager.playPulse();
    
    const hitResults = this.itemManager.applyPulse(this.player.getLane(), this.player.getPosition().z);
    
    for (const hitResult of hitResults) {
      if (hitResult === 'destroyed') {
        this.score += 50 * this.currentMultiplier;
        audioManager.playExplosion();
      }
      if (hitResult === 'converted') {
        this.score += 100 * this.currentMultiplier;
        audioManager.playExplosion();
      }
      if (hitResult === 'bonus_lane') {
        this.score += 150 * this.currentMultiplier;
        audioManager.playExplosion();
      }
    }
  }

  public startGame() {
    this.isGameStarted = true;
    this.countdown = 3;
    this.countdownTimer = 0;
    audioManager.playBoost(); // Sound effect for starting
  }

  public start() {
    this.isRunning = true;
    this.startZ = this.player.getPosition().z;
    this.lastZ = this.startZ;

    this.engine.runRenderLoop(() => {
      if (!this.isRunning) return;

      const deltaTime = this.engine.getDeltaTime() / 1000; // in seconds

      if (this.isGameStarted && this.countdown > 0) {
        this.countdownTimer += deltaTime;
        if (this.countdownTimer >= 1.0) {
          this.countdownTimer -= 1.0;
          this.countdown--;
          if (this.countdown > 0) {
            audioManager.playCollect(); // Beep
          } else {
            audioManager.playBoost(); // GO!
          }
        }
        this.player.updateIdle(deltaTime);
        
        // Update HUD during countdown
        const distance = Math.max(0, Math.floor(this.player.getPosition().z - this.startZ));
        const totalScore = Math.floor(this.score);
        const pulseRatio = Math.min(1, this.pulseTimer / this.pulseCooldown);
        gameState.update(totalScore, distance, this.pickups, this.isGameOver, pulseRatio, pulseRatio >= 1, this.player.isShieldActive(), this.player.getShieldTimer(), this.currentMultiplier, this.scoreMultiplierTimer, this.player.isSpeedBoostActive(), this.player.getSpeedBoostTimer(), this.isGameStarted, this.countdown);
      } else if (this.isGameStarted && !this.isGameOver) {
        if (this.pulseTimer < this.pulseCooldown) {
          this.pulseTimer += deltaTime;
        }

        if (this.scoreMultiplierTimer > 0) {
          this.scoreMultiplierTimer -= deltaTime;
          if (this.scoreMultiplierTimer <= 0) {
            this.currentMultiplier = 1;
          }
        }

        this.player.update(deltaTime);
        this.track.update(this.player.getPosition().z);
        this.itemManager.update(this.player.getPosition().z, deltaTime);

        // Check collisions
        const hitItem = this.itemManager.checkCollisions(this.player.mesh);
        if (hitItem) {
          if (hitItem.type === ItemType.OBSTACLE || hitItem.type === ItemType.NEUTRAL_CRATE || hitItem.type === ItemType.MOVING_OBSTACLE) {
            this.gameOver();
          } else if (hitItem.type === ItemType.PICKUP) {
            this.itemManager.deactivateItem(hitItem);
            this.player.collect();
            audioManager.playCollect();
            this.pickups++;
            this.score += 100 * this.currentMultiplier; // Bonus for pickup
          } else if (hitItem.type === ItemType.SHIELD_PICKUP) {
            this.itemManager.deactivateItem(hitItem);
            this.player.applyShield();
            audioManager.playCollect();
            this.score += 50 * this.currentMultiplier;
          } else if (hitItem.type === ItemType.SPEED_PAD_ACTIVE) {
            this.itemManager.deactivateItem(hitItem);
            this.player.applySpeedBoost();
            audioManager.playBoost();
            this.score += 50 * this.currentMultiplier;
          } else if (hitItem.type === ItemType.SCORE_MULTIPLIER) {
            this.itemManager.deactivateItem(hitItem);
            this.player.collect();
            audioManager.playMultiplier();
            this.scoreMultiplierTimer = 10.0; // 10 seconds of 2x score
            this.currentMultiplier = 2;
          }
        }

        // Update score based on distance incrementally
        const currentZ = this.player.getPosition().z;
        const deltaZ = currentZ - this.lastZ;
        if (deltaZ > 0) {
          this.score += deltaZ * 10 * this.currentMultiplier;
          this.lastZ = currentZ;
        }

        const distance = Math.max(0, Math.floor(currentZ - this.startZ));
        const totalScore = Math.floor(this.score);

        const pulseRatio = Math.min(1, this.pulseTimer / this.pulseCooldown);
        gameState.update(totalScore, distance, this.pickups, this.isGameOver, pulseRatio, pulseRatio >= 1, this.player.isShieldActive(), this.player.getShieldTimer(), this.currentMultiplier, this.scoreMultiplierTimer, this.player.isSpeedBoostActive(), this.player.getSpeedBoostTimer(), this.isGameStarted, this.countdown);
      } else if (this.isGameStarted && this.isGameOver) {
        // Still update game state to ensure HUD knows it's game over
        const currentZ = this.player.getPosition().z;
        const distance = Math.max(0, Math.floor(currentZ - this.startZ));
        const totalScore = Math.floor(this.score);
        const pulseRatio = Math.min(1, this.pulseTimer / this.pulseCooldown);
        gameState.update(totalScore, distance, this.pickups, this.isGameOver, pulseRatio, pulseRatio >= 1, this.player.isShieldActive(), this.player.getShieldTimer(), this.currentMultiplier, this.scoreMultiplierTimer, this.player.isSpeedBoostActive(), this.player.getSpeedBoostTimer(), this.isGameStarted, this.countdown);
      } else {
        // Not started yet
        this.player.updateIdle(deltaTime);
        const distance = 0;
        const totalScore = 0;
        const pulseRatio = 1;
        gameState.update(totalScore, distance, this.pickups, this.isGameOver, pulseRatio, true, false, 0, 1, 0, false, 0, this.isGameStarted, this.countdown);
      }

      this.scene.render();
    });
  }

  private gameOver() {
    const crashed = this.player.crash();
    if (crashed) {
      this.isGameOver = true;
      audioManager.playCrash();
      this.pipeline.chromaticAberration.aberrationAmount = 30; // Strong glitch effect
    } else {
      audioManager.playExplosion(); // Shield break sound
    }
  }

  public restart() {
    this.isGameOver = false;
    this.isGameStarted = true;
    this.countdown = 3;
    this.countdownTimer = 0;
    this.pipeline.chromaticAberration.aberrationAmount = 0;
    audioManager.playBoost();
    this.score = 0;
    this.pickups = 0;
    this.pulseTimer = this.pulseCooldown;
    this.scoreMultiplierTimer = 0;
    this.currentMultiplier = 1;
    
    this.player.reset();
    this.track.reset();
    this.itemManager.reset();
    
    this.startZ = this.player.getPosition().z;
    this.lastZ = this.startZ;

    // Respawn initial items
    const segments = this.track.getSegments();
    const segLen = this.track.getSegmentLength();
    for (let i = 1; i < segments.length; i++) {
      const zStart = segments[i].position.z - segLen / 2;
      this.itemManager.spawnOnSegment(zStart, zStart + segLen);
    }
  }

  public stop() {
    this.isRunning = false;
    this.engine.stopRenderLoop();
  }

  public dispose() {
    this.stop();
    this.resizeObserver.disconnect();
    this.player.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
