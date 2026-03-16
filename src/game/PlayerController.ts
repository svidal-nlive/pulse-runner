import { Mesh, MeshBuilder, Scene, Vector3, StandardMaterial, Color3, PointLight, TransformNode, Animation, CubicEase, EasingFunction, UniversalCamera, ParticleSystem, Texture, Color4 } from '@babylonjs/core';

export class PlayerController {
  public rootNode: TransformNode;
  public mesh: Mesh;
  private scene: Scene;
  private currentLane: number = 0; // -1 (left), 0 (center), 1 (right)
  private laneWidth: number = 3.5;
  private baseSpeed: number = 30;
  private currentSpeed: number = 30;
  private maxSpeed: number = 85;
  private speedRamp: number = 0.6; // units per second per second
  private isChangingLane: boolean = false;
  private isCrashed: boolean = false;
  private camera: UniversalCamera;
  
  private speedBoostTimer: number = 0;
  private shieldTimer: number = 0;
  public onPulseRequested?: () => void;

  private engineParticles: ParticleSystem;
  private shieldMesh: Mesh;

  constructor(scene: Scene) {
    this.scene = scene;
    
    this.rootNode = new TransformNode("playerRoot", scene);
    this.rootNode.position = new Vector3(0, 0.5, 0);

    // Create a sleek hovercraft shape
    this.mesh = MeshBuilder.CreateBox("player", { width: 1.2, height: 0.4, depth: 2.5 }, scene);
    this.mesh.parent = this.rootNode;
    
    // Add some details (wings)
    const leftWing = MeshBuilder.CreateBox("leftWing", { width: 0.8, height: 0.1, depth: 1.5 }, scene);
    leftWing.parent = this.mesh;
    leftWing.position = new Vector3(-0.8, 0, -0.2);
    
    const rightWing = MeshBuilder.CreateBox("rightWing", { width: 0.8, height: 0.1, depth: 1.5 }, scene);
    rightWing.parent = this.mesh;
    rightWing.position = new Vector3(0.8, 0, -0.2);

    const material = new StandardMaterial("playerMat", scene);
    material.diffuseColor = new Color3(0.1, 0.1, 0.1);
    material.emissiveColor = new Color3(0.0, 0.8, 1.0); // Neon blue
    this.mesh.material = material;
    leftWing.material = material;
    rightWing.material = material;

    // Shield Mesh
    this.shieldMesh = MeshBuilder.CreateSphere("shield", { diameter: 3.5, segments: 16 }, scene);
    this.shieldMesh.parent = this.rootNode;
    const shieldMat = new StandardMaterial("shieldMat", scene);
    shieldMat.diffuseColor = new Color3(0, 0, 0);
    shieldMat.emissiveColor = new Color3(0.8, 0.2, 1.0); // Purple shield
    shieldMat.alpha = 0.0;
    shieldMat.wireframe = true;
    this.shieldMesh.material = shieldMat;

    // Engine glow
    const light = new PointLight("playerLight", new Vector3(0, 0, -1.5), scene);
    light.parent = this.mesh;
    light.diffuse = new Color3(0.0, 0.8, 1.0);
    light.intensity = 1.0;
    light.range = 15;

    // Camera setup
    this.camera = new UniversalCamera("followCam", new Vector3(0, 4, -10), scene);
    this.camera.parent = this.rootNode;
    
    // Create a target node for the camera to look at
    const camTarget = new TransformNode("camTarget", scene);
    camTarget.parent = this.rootNode;
    camTarget.position = new Vector3(0, 0, 10);
    
    this.camera.lockedTarget = camTarget;

    // Engine particles
    this.engineParticles = new ParticleSystem("engineParticles", 200, scene);
    this.engineParticles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    this.engineParticles.emitter = this.mesh;
    this.engineParticles.minEmitBox = new Vector3(-0.5, 0, -1.2);
    this.engineParticles.maxEmitBox = new Vector3(0.5, 0, -1.2);
    this.engineParticles.color1 = new Color4(0, 0.8, 1.0, 1.0);
    this.engineParticles.color2 = new Color4(0, 0.5, 1.0, 1.0);
    this.engineParticles.colorDead = new Color4(0, 0, 0.2, 0.0);
    this.engineParticles.minSize = 0.1;
    this.engineParticles.maxSize = 0.5;
    this.engineParticles.minLifeTime = 0.1;
    this.engineParticles.maxLifeTime = 0.3;
    this.engineParticles.emitRate = 100;
    this.engineParticles.direction1 = new Vector3(-0.5, -0.5, -2);
    this.engineParticles.direction2 = new Vector3(0.5, 0.5, -2);
    this.engineParticles.minEmitPower = 1;
    this.engineParticles.maxEmitPower = 3;
    this.engineParticles.updateSpeed = 0.01;
    this.engineParticles.start();

    this.setupInput();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isChangingLane) return;

    if ((e.key === "a" || e.key === "ArrowLeft") && this.currentLane > -1) {
      this.switchLane(-1);
    } else if ((e.key === "d" || e.key === "ArrowRight") && this.currentLane < 1) {
      this.switchLane(1);
    } else if (e.code === "Space") {
      if (this.onPulseRequested) this.onPulseRequested();
    }
  };

  private setupInput() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  public dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.engineParticles.dispose();
    this.rootNode.dispose();
  }

  private switchLane(direction: number) {
    this.isChangingLane = true;
    const targetLane = this.currentLane + direction;
    const targetX = targetLane * this.laneWidth;

    const frameRate = 60;
    const durationFrames = 10; // 0.16s at 60fps for snappy feel

    const animPos = new Animation("laneSwitchPos", "position.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keysPos = [
      { frame: 0, value: this.mesh.position.x },
      { frame: durationFrames, value: targetX }
    ];
    animPos.setKeys(keysPos);

    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    animPos.setEasingFunction(easingFunction);

    const animRoll = new Animation("laneSwitchRoll", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keysRoll = [
      { frame: 0, value: 0 },
      { frame: durationFrames / 2, value: direction * -0.4 }, // Tilt into turn
      { frame: durationFrames, value: 0 }
    ];
    animRoll.setKeys(keysRoll);
    animRoll.setEasingFunction(easingFunction);

    const camAnimPos = new Animation("camPos", "position.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const camKeysPos = [
      { frame: 0, value: this.camera.position.x },
      { frame: durationFrames / 2, value: direction * 0.5 },
      { frame: durationFrames, value: 0 }
    ];
    camAnimPos.setKeys(camKeysPos);
    camAnimPos.setEasingFunction(easingFunction);

    this.mesh.animations = [animPos, animRoll];
    this.camera.animations = [camAnimPos];

    this.scene.beginAnimation(this.mesh, 0, durationFrames, false, 1, () => {
      this.currentLane = targetLane;
      this.mesh.position.x = targetX;
      this.mesh.rotation.z = 0;
      this.isChangingLane = false;
    });
    this.scene.beginAnimation(this.camera, 0, durationFrames, false, 1);
  }

  public getLane(): number {
    return this.currentLane;
  }

  public updateIdle(deltaTime: number) {
    // Add a slight hover effect without moving forward
    this.mesh.position.y = Math.sin(performance.now() * 0.005) * 0.1;
  }

  public update(deltaTime: number) {
    if (this.isCrashed) return;

    // Speed progression
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += this.speedRamp * deltaTime;
    }

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= deltaTime;
      if (this.speedBoostTimer <= 0) {
        const mat = this.mesh.material as StandardMaterial;
        mat.emissiveColor = new Color3(0.0, 0.8, 1.0); // Back to blue
      }
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer -= deltaTime;
      const shieldMat = this.shieldMesh.material as StandardMaterial;
      if (this.shieldTimer <= 0) {
        shieldMat.alpha = 0.0;
      } else {
        shieldMat.alpha = 0.5 + Math.sin(performance.now() * 0.01) * 0.2;
        this.shieldMesh.rotation.y += deltaTime * 2;
        this.shieldMesh.rotation.z += deltaTime * 1.5;
      }
    }

    const actualSpeed = this.currentSpeed + (this.speedBoostTimer > 0 ? 30 : 0);

    // FOV based on speed for sensation of speed
    const targetFOV = 0.8 + (this.currentSpeed / this.maxSpeed) * 0.2 + (this.speedBoostTimer > 0 ? 0.2 : 0);
    this.camera.fov += (targetFOV - this.camera.fov) * deltaTime * 5;

    // Move forward
    this.rootNode.position.z += actualSpeed * deltaTime;
    
    // Add a slight hover effect and forward tilt based on speed
    this.mesh.position.y = Math.sin(performance.now() * 0.005) * 0.1;
    this.mesh.rotation.x = (this.currentSpeed / this.maxSpeed) * 0.1 + (this.speedBoostTimer > 0 ? 0.1 : 0);
  }

  public crash(): boolean {
    if (this.shieldTimer > 0) {
      // Shield absorbs crash
      this.shieldTimer = 0;
      const shieldMat = this.shieldMesh.material as StandardMaterial;
      shieldMat.alpha = 0.0;
      
      // Visual feedback for shield break
      const mat = this.mesh.material as StandardMaterial;
      mat.emissiveColor = new Color3(1.0, 1.0, 1.0); // Flash white
      setTimeout(() => {
        if (!this.isCrashed) {
          mat.emissiveColor = this.speedBoostTimer > 0 ? new Color3(1.0, 1.0, 1.0) : new Color3(0.0, 0.8, 1.0);
        }
      }, 200);

      // Shield break particles
      const particles = new ParticleSystem("shieldBreak", 100, this.scene);
      particles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
      particles.emitter = this.rootNode.position.clone();
      particles.minEmitBox = new Vector3(-2, -1, -2);
      particles.maxEmitBox = new Vector3(2, 1, 2);
      particles.color1 = new Color4(0.8, 0.2, 1.0, 1.0);
      particles.color2 = new Color4(0.5, 0.0, 1.0, 1.0);
      particles.colorDead = new Color4(0, 0, 0, 0.0);
      particles.minSize = 0.5;
      particles.maxSize = 1.5;
      particles.minLifeTime = 0.2;
      particles.maxLifeTime = 0.5;
      particles.emitRate = 1000;
      particles.direction1 = new Vector3(-3, -3, -3);
      particles.direction2 = new Vector3(3, 3, 3);
      particles.minEmitPower = 5;
      particles.maxEmitPower = 10;
      particles.updateSpeed = 0.01;
      particles.targetStopDuration = 0.2;
      particles.disposeOnStop = true;
      particles.start();

      return false; // Did not crash
    }

    this.isCrashed = true;
    this.engineParticles.stop();
    
    // Visual feedback
    const mat = this.mesh.material as StandardMaterial;
    mat.emissiveColor = new Color3(1.0, 0.0, 0.0); // Flash red

    // Shake camera slightly
    const anim = new Animation("shake", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [
      { frame: 0, value: 4 },
      { frame: 5, value: 4.5 },
      { frame: 10, value: 3.5 },
      { frame: 15, value: 4 }
    ];
    anim.setKeys(keys);
    this.camera.animations = [anim];
    this.scene.beginAnimation(this.camera, 0, 15, false);
    return true; // Crashed
  }

  public collect() {
    // Visual feedback for pickup
    const anim = new Animation("scale", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 5, value: new Vector3(1.2, 1.2, 1.2) },
      { frame: 15, value: new Vector3(1, 1, 1) }
    ];
    anim.setKeys(keys);
    this.mesh.animations.push(anim);
    this.scene.beginDirectAnimation(this.mesh, [anim], 0, 15, false);

    // Collect particles
    const particles = new ParticleSystem("collectParticles", 50, this.scene);
    particles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    particles.emitter = this.rootNode.position.clone();
    particles.minEmitBox = new Vector3(-1, 0, -1);
    particles.maxEmitBox = new Vector3(1, 1, 1);
    particles.color1 = new Color4(0.0, 1.0, 0.5, 1.0);
    particles.color2 = new Color4(0.0, 0.8, 0.2, 1.0);
    particles.colorDead = new Color4(0, 0, 0, 0.0);
    particles.minSize = 0.2;
    particles.maxSize = 0.6;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.4;
    particles.emitRate = 500;
    particles.direction1 = new Vector3(-1, 1, -1);
    particles.direction2 = new Vector3(1, 2, 1);
    particles.minEmitPower = 2;
    particles.maxEmitPower = 5;
    particles.updateSpeed = 0.01;
    particles.targetStopDuration = 0.2;
    particles.disposeOnStop = true;
    particles.start();
  }

  public firePulse() {
    const pulseRing = MeshBuilder.CreateTorus("pulseRing", { diameter: 4, thickness: 0.3, tessellation: 32 }, this.scene);
    pulseRing.position = this.rootNode.position.clone();
    pulseRing.position.y = 1;
    pulseRing.rotation.x = Math.PI / 2;
    
    const mat = new StandardMaterial("pulseMat", this.scene);
    mat.emissiveColor = new Color3(0.0, 1.0, 1.0);
    mat.diffuseColor = new Color3(0, 0, 0);
    mat.alpha = 0.8;
    pulseRing.material = mat;

    const animZ = new Animation("pulseZ", "position.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animZ.setKeys([{ frame: 0, value: pulseRing.position.z }, { frame: 20, value: pulseRing.position.z + 80 }]);

    const animScale = new Animation("pulseScale", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animScale.setKeys([{ frame: 0, value: new Vector3(1, 1, 1) }, { frame: 20, value: new Vector3(2, 2, 2) }]);

    const animAlpha = new Animation("pulseAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animAlpha.setKeys([{ frame: 0, value: 0.8 }, { frame: 15, value: 0.8 }, { frame: 20, value: 0 }]);

    pulseRing.animations = [animZ, animScale, animAlpha];
    this.scene.beginAnimation(pulseRing, 0, 20, false, 1, () => {
        pulseRing.dispose();
        mat.dispose();
    });

    // Pulse particles
    const pulseParticles = new ParticleSystem("pulseParticles", 100, this.scene);
    pulseParticles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    pulseParticles.emitter = this.rootNode.position.clone();
    pulseParticles.minEmitBox = new Vector3(-2, 0, 0);
    pulseParticles.maxEmitBox = new Vector3(2, 0, 0);
    pulseParticles.color1 = new Color4(0, 1.0, 1.0, 1.0);
    pulseParticles.color2 = new Color4(0, 0.5, 1.0, 1.0);
    pulseParticles.colorDead = new Color4(0, 0, 0.2, 0.0);
    pulseParticles.minSize = 0.2;
    pulseParticles.maxSize = 0.8;
    pulseParticles.minLifeTime = 0.2;
    pulseParticles.maxLifeTime = 0.5;
    pulseParticles.emitRate = 500;
    pulseParticles.direction1 = new Vector3(-1, 0, 5);
    pulseParticles.direction2 = new Vector3(1, 0, 5);
    pulseParticles.minEmitPower = 5;
    pulseParticles.maxEmitPower = 10;
    pulseParticles.updateSpeed = 0.01;
    pulseParticles.targetStopDuration = 0.2;
    pulseParticles.disposeOnStop = true;
    pulseParticles.start();
  }

  public applySpeedBoost() {
    this.speedBoostTimer = 1.5;
    const mat = this.mesh.material as StandardMaterial;
    mat.emissiveColor = new Color3(1.0, 1.0, 1.0); // White hot

    // Speed boost particles
    const particles = new ParticleSystem("boostParticles", 100, this.scene);
    particles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    particles.emitter = this.rootNode.position.clone();
    particles.minEmitBox = new Vector3(-1, 0, -2);
    particles.maxEmitBox = new Vector3(1, 1, -1);
    particles.color1 = new Color4(0.0, 1.0, 1.0, 1.0);
    particles.color2 = new Color4(0.0, 0.5, 1.0, 1.0);
    particles.colorDead = new Color4(0, 0, 0, 0.0);
    particles.minSize = 0.2;
    particles.maxSize = 0.8;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.5;
    particles.emitRate = 500;
    particles.direction1 = new Vector3(-1, 0, -5);
    particles.direction2 = new Vector3(1, 0, -5);
    particles.minEmitPower = 5;
    particles.maxEmitPower = 15;
    particles.updateSpeed = 0.01;
    particles.targetStopDuration = 1.5;
    particles.disposeOnStop = true;
    particles.start();
  }

  public applyShield() {
    this.shieldTimer = 5.0; // 5 seconds of shield

    // Shield particles
    const particles = new ParticleSystem("shieldParticles", 50, this.scene);
    particles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    particles.emitter = this.rootNode.position.clone();
    particles.minEmitBox = new Vector3(-2, -1, -2);
    particles.maxEmitBox = new Vector3(2, 1, 2);
    particles.color1 = new Color4(0.8, 0.2, 1.0, 1.0);
    particles.color2 = new Color4(0.5, 0.0, 1.0, 1.0);
    particles.colorDead = new Color4(0, 0, 0, 0.0);
    particles.minSize = 0.2;
    particles.maxSize = 0.6;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.4;
    particles.emitRate = 500;
    particles.direction1 = new Vector3(-1, 1, -1);
    particles.direction2 = new Vector3(1, 2, 1);
    particles.minEmitPower = 2;
    particles.maxEmitPower = 5;
    particles.updateSpeed = 0.01;
    particles.targetStopDuration = 0.2;
    particles.disposeOnStop = true;
    particles.start();
  }

  public isShieldActive(): boolean {
    return this.shieldTimer > 0;
  }

  public getShieldTimer(): number {
    return this.shieldTimer;
  }

  public isSpeedBoostActive(): boolean {
    return this.speedBoostTimer > 0;
  }

  public getSpeedBoostTimer(): number {
    return this.speedBoostTimer;
  }

  public reset() {
    this.isCrashed = false;
    this.currentSpeed = this.baseSpeed;
    this.currentLane = 0;
    this.speedBoostTimer = 0;
    this.shieldTimer = 0;
    
    this.scene.stopAnimation(this.mesh);
    this.scene.stopAnimation(this.camera);
    
    this.rootNode.position = new Vector3(0, 0.5, 0);
    this.mesh.position.x = 0;
    this.mesh.rotation.z = 0;
    this.mesh.rotation.x = 0;
    this.camera.position.x = 0;
    this.camera.position.y = 4; // Reset camera height
    this.camera.fov = 0.8;
    this.isChangingLane = false;
    
    const mat = this.mesh.material as StandardMaterial;
    mat.emissiveColor = new Color3(0.0, 0.8, 1.0); // Back to blue
    const shieldMat = this.shieldMesh.material as StandardMaterial;
    shieldMat.alpha = 0.0;
    
    this.engineParticles.start();
  }

  public getPosition(): Vector3 {
    return this.rootNode.position;
  }
}
