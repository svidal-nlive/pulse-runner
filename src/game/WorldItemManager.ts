import { Scene, MeshBuilder, Vector3, Mesh, StandardMaterial, Color3, Animation, ParticleSystem, Texture, Color4 } from '@babylonjs/core';

export enum ItemType {
  OBSTACLE,
  PICKUP,
  NEUTRAL_CRATE,
  SPEED_PAD_INACTIVE,
  SPEED_PAD_ACTIVE,
  SHIELD_PICKUP,
  MOVING_OBSTACLE,
  SCORE_MULTIPLIER
}

export interface WorldItem {
  mesh: Mesh;
  type: ItemType;
  active: boolean;
  lane: number;
  moveDirection?: number; // For moving obstacles
}

export class WorldItemManager {
  private scene: Scene;
  private items: WorldItem[] = [];
  private laneWidth: number = 3.5;
  
  private obstacleMat: StandardMaterial;
  private pickupMat: StandardMaterial;
  private neutralMat: StandardMaterial;
  private speedPadInactiveMat: StandardMaterial;
  private speedPadActiveMat: StandardMaterial;
  private shieldPickupMat: StandardMaterial;
  private movingObstacleMat: StandardMaterial;
  private scoreMultiplierMat: StandardMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    this.obstacleMat = new StandardMaterial("obstacleMat", scene);
    this.obstacleMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.obstacleMat.emissiveColor = new Color3(1.0, 0.0, 0.2); // Neon red/pink

    this.pickupMat = new StandardMaterial("pickupMat", scene);
    this.pickupMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.pickupMat.emissiveColor = new Color3(0.0, 1.0, 0.5); // Neon green

    this.neutralMat = new StandardMaterial("neutralMat", scene);
    this.neutralMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    this.neutralMat.emissiveColor = new Color3(0.1, 0.1, 0.1); // Dull grey

    this.speedPadInactiveMat = new StandardMaterial("speedPadInactiveMat", scene);
    this.speedPadInactiveMat.diffuseColor = new Color3(0.1, 0.1, 0.2);
    this.speedPadInactiveMat.emissiveColor = new Color3(0.0, 0.1, 0.3); // Dark blue

    this.speedPadActiveMat = new StandardMaterial("speedPadActiveMat", scene);
    this.speedPadActiveMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.speedPadActiveMat.emissiveColor = new Color3(0.0, 1.0, 1.0); // Bright cyan

    this.shieldPickupMat = new StandardMaterial("shieldPickupMat", scene);
    this.shieldPickupMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.shieldPickupMat.emissiveColor = new Color3(0.8, 0.2, 1.0); // Purple

    this.movingObstacleMat = new StandardMaterial("movingObstacleMat", scene);
    this.movingObstacleMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.movingObstacleMat.emissiveColor = new Color3(1.0, 0.5, 0.0); // Orange

    this.scoreMultiplierMat = new StandardMaterial("scoreMultiplierMat", scene);
    this.scoreMultiplierMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.scoreMultiplierMat.emissiveColor = new Color3(1.0, 1.0, 0.0); // Yellow
  }

  private createMeshForType(type: ItemType): Mesh {
    switch (type) {
      case ItemType.OBSTACLE: {
        const mesh = MeshBuilder.CreateBox("obstacle", { width: 2.5, height: 1.5, depth: 1.5 }, this.scene);
        mesh.material = this.obstacleMat;
        mesh.position.y = 0.75;
        return mesh;
      }
      case ItemType.PICKUP: {
        const mesh = MeshBuilder.CreateSphere("pickup", { diameter: 1.2, segments: 8 }, this.scene);
        mesh.material = this.pickupMat;
        mesh.position.y = 1.0;
        return mesh;
      }
      case ItemType.NEUTRAL_CRATE: {
        const mesh = MeshBuilder.CreateBox("neutral", { width: 2.0, height: 2.0, depth: 2.0 }, this.scene);
        mesh.material = this.neutralMat;
        mesh.position.y = 1.0;
        return mesh;
      }
      case ItemType.SPEED_PAD_INACTIVE:
      case ItemType.SPEED_PAD_ACTIVE: {
        const mesh = MeshBuilder.CreateBox("speedPad", { width: 2.5, height: 0.1, depth: 4.0 }, this.scene);
        mesh.material = type === ItemType.SPEED_PAD_ACTIVE ? this.speedPadActiveMat : this.speedPadInactiveMat;
        mesh.position.y = 0.05;
        return mesh;
      }
      case ItemType.SHIELD_PICKUP: {
        const mesh = MeshBuilder.CreateTorus("shieldPickup", { diameter: 1.5, thickness: 0.3, tessellation: 16 }, this.scene);
        mesh.material = this.shieldPickupMat;
        mesh.position.y = 1.0;
        return mesh;
      }
      case ItemType.MOVING_OBSTACLE: {
        const mesh = MeshBuilder.CreateCylinder("movingObstacle", { diameter: 2.0, height: 2.0, tessellation: 16 }, this.scene);
        mesh.material = this.movingObstacleMat;
        mesh.position.y = 1.0;
        return mesh;
      }
      case ItemType.SCORE_MULTIPLIER: {
        const mesh = MeshBuilder.CreatePolyhedron("scoreMultiplier", { type: 1, size: 0.8 }, this.scene); // Octahedron
        mesh.material = this.scoreMultiplierMat;
        mesh.position.y = 1.0;
        return mesh;
      }
    }
  }

  private getItem(type: ItemType): WorldItem {
    let item = this.items.find(i => i.type === type && !i.active);
    if (!item) {
      const mesh = this.createMeshForType(type);
      mesh.isVisible = false;
      item = { mesh, type, active: false, lane: 0 };
      this.items.push(item);
    }
    return item;
  }

  public spawnOnSegment(zStart: number, zEnd: number) {
    if (zStart < 100) return; // Don't spawn too close to start

    const length = zEnd - zStart;
    
    // Difficulty scaling based on distance
    // 0.0 at z=100, 1.0 at z=3000
    const difficulty = Math.min(1.0, Math.max(0, (zStart - 100) / 3000));
    
    // Number of rows increases with difficulty
    const numRows = Math.floor(3 + difficulty * 2); // 3 to 5 rows
    const rowSpacing = length / numRows;

    let lastEmptyLane = -2; // Track to ensure path

    for (let i = 0; i < numRows; i++) {
      const zPos = zStart + (i + 0.5) * rowSpacing;
      
      const rand = Math.random();
      
      // Ensure at least one lane is open, or create a wall with a pickup
      let emptyLane = Math.floor(Math.random() * 3) - 1;
      
      // Avoid forcing the player to switch from -1 to 1 in a short distance
      if (lastEmptyLane !== -2 && Math.abs(emptyLane - lastEmptyLane) > 1) {
        emptyLane = 0; // Force center lane if it was a hard jump
      }
      lastEmptyLane = emptyLane;

      // Determine row type based on difficulty and random
      if (rand < 0.2 + difficulty * 0.2) {
        // Wall of 2 obstacles
        for (let l = -1; l <= 1; l++) {
          if (l !== emptyLane) {
            this.spawnItem(ItemType.OBSTACLE, l, zPos);
          } else {
            // 50% chance to put a pickup in the empty lane of a wall
            if (Math.random() > 0.5) {
               this.spawnItem(ItemType.PICKUP, l, zPos);
            }
          }
        }
      } else if (rand < 0.3 + difficulty * 0.3 && difficulty > 0.2) {
        // Moving obstacle (only after some distance)
        const lane = Math.floor(Math.random() * 3) - 1;
        this.spawnItem(ItemType.MOVING_OBSTACLE, lane, zPos);
      } else {
        // Single items
        const lane = Math.floor(Math.random() * 3) - 1;
        const itemRand = Math.random();
        
        if (itemRand < 0.45) {
          this.spawnItem(ItemType.OBSTACLE, lane, zPos);
        } else if (itemRand < 0.70) {
          this.spawnItem(ItemType.PICKUP, lane, zPos);
        } else if (itemRand < 0.85) {
          this.spawnItem(ItemType.NEUTRAL_CRATE, lane, zPos);
        } else if (itemRand < 0.92) {
          this.spawnItem(ItemType.SPEED_PAD_INACTIVE, lane, zPos);
        } else if (itemRand < 0.97) {
          this.spawnItem(ItemType.SHIELD_PICKUP, lane, zPos);
        } else {
          this.spawnItem(ItemType.SCORE_MULTIPLIER, lane, zPos);
        }
      }
    }
  }

  private spawnItem(type: ItemType, lane: number, zPos: number) {
    const item = this.getItem(type);
    item.active = true;
    item.lane = lane;
    item.mesh.position.x = lane * this.laneWidth;
    item.mesh.position.z = zPos;
    item.mesh.isVisible = true;

    if (type === ItemType.MOVING_OBSTACLE) {
      item.moveDirection = Math.random() > 0.5 ? 1 : -1;
    }

    if (type === ItemType.PICKUP || type === ItemType.SHIELD_PICKUP || type === ItemType.SCORE_MULTIPLIER) {
      item.mesh.rotation.y = Math.random() * Math.PI;
    }
  }

  public update(playerZ: number, deltaTime: number) {
    for (const item of this.items) {
      if (!item.active) continue;

      if (item.type === ItemType.PICKUP) {
        item.mesh.rotation.y += deltaTime * 2;
        item.mesh.position.y = 1.0 + Math.sin(performance.now() * 0.005 + item.mesh.position.z) * 0.2;
      } else if (item.type === ItemType.SHIELD_PICKUP) {
        item.mesh.rotation.y += deltaTime * 3;
        item.mesh.rotation.x += deltaTime * 1.5;
        item.mesh.position.y = 1.0 + Math.sin(performance.now() * 0.005 + item.mesh.position.z) * 0.2;
      } else if (item.type === ItemType.SCORE_MULTIPLIER) {
        item.mesh.rotation.y += deltaTime * 4;
        item.mesh.rotation.z += deltaTime * 2;
        item.mesh.position.y = 1.0 + Math.sin(performance.now() * 0.008 + item.mesh.position.z) * 0.3;
      } else if (item.type === ItemType.MOVING_OBSTACLE && item.moveDirection) {
        item.mesh.position.x += item.moveDirection * 4 * deltaTime;
        
        // Bounce off edges
        if (item.mesh.position.x > this.laneWidth * 1.5) {
          item.mesh.position.x = this.laneWidth * 1.5;
          item.moveDirection = -1;
        } else if (item.mesh.position.x < -this.laneWidth * 1.5) {
          item.mesh.position.x = -this.laneWidth * 1.5;
          item.moveDirection = 1;
        }
        
        // Update lane based on x position
        item.lane = Math.round(item.mesh.position.x / this.laneWidth);
      }

      // Recycle if behind player
      if (item.mesh.position.z < playerZ - 10) {
        this.deactivateItem(item);
      }
    }
  }

  public deactivateItem(item: WorldItem) {
    item.active = false;
    item.mesh.isVisible = false;
  }

  public checkCollisions(playerMesh: Mesh): WorldItem | null {
    for (const item of this.items) {
      if (!item.active) continue;
      if (item.type === ItemType.SPEED_PAD_INACTIVE) continue; // Safe to drive over
      
      if (playerMesh.intersectsMesh(item.mesh, false)) {
        return item;
      }
    }
    return null;
  }

  public applyPulse(lane: number, playerZ: number): string[] {
    // Find valid targets in the same lane, ahead of player, within 80 units
    const targets = this.items.filter(i => 
      i.active && 
      i.lane === lane && 
      i.mesh.position.z > playerZ + 2 && 
      i.mesh.position.z < playerZ + 80 &&
      (i.type === ItemType.OBSTACLE || i.type === ItemType.MOVING_OBSTACLE || i.type === ItemType.NEUTRAL_CRATE || i.type === ItemType.SPEED_PAD_INACTIVE)
    );

    if (targets.length === 0) return [];

    const results: string[] = [];

    for (const target of targets) {
      if (target.type === ItemType.OBSTACLE || target.type === ItemType.MOVING_OBSTACLE) {
        this.deactivateItem(target);
        this.createExplosion(target.mesh.position, target.type === ItemType.MOVING_OBSTACLE ? new Color3(1, 0.5, 0) : new Color3(1, 0, 0));
        results.push('destroyed');
      } else if (target.type === ItemType.NEUTRAL_CRATE) {
        this.deactivateItem(target);
        this.spawnItem(ItemType.PICKUP, lane, target.mesh.position.z);
        this.createExplosion(target.mesh.position, new Color3(0, 1, 0)); // Green flash
        results.push('converted');
      } else if (target.type === ItemType.SPEED_PAD_INACTIVE) {
        this.deactivateItem(target);
        this.spawnItem(ItemType.SPEED_PAD_ACTIVE, lane, target.mesh.position.z);
        this.createExplosion(target.mesh.position, new Color3(0, 1, 1)); // Cyan flash
        results.push('bonus_lane');
      }
    }

    return results;
  }

  private createExplosion(position: Vector3, color: Color3) {
    const explosion = MeshBuilder.CreateBox("explosion", { size: 2 }, this.scene);
    explosion.position = position.clone();
    const mat = new StandardMaterial("expMat", this.scene);
    mat.emissiveColor = color;
    mat.alpha = 1.0;
    explosion.material = mat;

    const animScale = new Animation("expScale", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animScale.setKeys([{ frame: 0, value: new Vector3(1, 1, 1) }, { frame: 15, value: new Vector3(2, 2, 2) }]);

    const animAlpha = new Animation("expAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animAlpha.setKeys([{ frame: 0, value: 1.0 }, { frame: 15, value: 0 }]);

    explosion.animations = [animScale, animAlpha];
    this.scene.beginAnimation(explosion, 0, 15, false, 1, () => {
      explosion.dispose();
      mat.dispose();
    });

    // Particles
    const particles = new ParticleSystem("expParticles", 50, this.scene);
    particles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    particles.emitter = position.clone();
    particles.minEmitBox = new Vector3(-1, -1, -1);
    particles.maxEmitBox = new Vector3(1, 1, 1);
    particles.color1 = new Color4(color.r, color.g, color.b, 1.0);
    particles.color2 = new Color4(color.r, color.g, color.b, 0.5);
    particles.colorDead = new Color4(0, 0, 0, 0.0);
    particles.minSize = 0.5;
    particles.maxSize = 1.5;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.5;
    particles.emitRate = 500;
    particles.direction1 = new Vector3(-2, -2, -2);
    particles.direction2 = new Vector3(2, 2, 2);
    particles.minEmitPower = 2;
    particles.maxEmitPower = 5;
    particles.updateSpeed = 0.01;
    particles.targetStopDuration = 0.2;
    particles.disposeOnStop = true;
    particles.start();
  }

  public reset() {
    for (const item of this.items) {
      this.deactivateItem(item);
    }
  }
}
