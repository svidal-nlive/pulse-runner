import { Scene, MeshBuilder, Vector3, Mesh, StandardMaterial, Color3, Texture } from '@babylonjs/core';

export class TrackManager {
  private scene: Scene;
  private segments: Mesh[] = [];
  private segmentLength: number = 60;
  private numSegments: number = 5;
  private laneWidth: number = 3.5;
  
  private trackMat: StandardMaterial;
  private gridMat: StandardMaterial;

  public onSegmentRecycled?: (zStart: number, zEnd: number) => void;

  constructor(scene: Scene) {
    this.scene = scene;

    this.trackMat = new StandardMaterial("trackMat", scene);
    this.trackMat.diffuseColor = new Color3(0.05, 0.05, 0.05);
    this.trackMat.specularColor = new Color3(0.1, 0.1, 0.1);

    this.gridMat = new StandardMaterial("gridMat", scene);
    this.gridMat.emissiveColor = new Color3(0.0, 0.5, 1.0); // Neon blue lines
    this.gridMat.wireframe = true;
    this.gridMat.alpha = 0.3;

    this.initSegments();
  }

  private initSegments() {
    for (let i = 0; i < this.numSegments; i++) {
      this.createSegment(i * this.segmentLength);
    }
  }

  private createSegment(zPos: number) {
    const segment = MeshBuilder.CreateGround("segment", { width: this.laneWidth * 3 + 2, height: this.segmentLength }, this.scene);
    segment.position.z = zPos;
    segment.material = this.trackMat;

    // Add grid overlay for speed sensation
    const grid = MeshBuilder.CreateGround("grid", { width: this.laneWidth * 3 + 2, height: this.segmentLength, subdivisions: 10 }, this.scene);
    grid.position.y = 0.01; // Slightly above ground
    grid.parent = segment;
    grid.material = this.gridMat;

    // Add lane dividers
    for (let l = -1; l <= 1; l += 2) {
      const divider = MeshBuilder.CreateBox("divider", { width: 0.2, height: 0.1, depth: this.segmentLength }, this.scene);
      divider.position.x = l * (this.laneWidth / 2);
      divider.position.y = 0.05;
      divider.parent = segment;
      
      const divMat = new StandardMaterial("divMat", this.scene);
      divMat.emissiveColor = new Color3(0.0, 0.8, 1.0);
      divider.material = divMat;
    }

    this.segments.push(segment);
  }

  public update(playerZ: number) {
    // Find the segment furthest behind
    let oldestSegment = this.segments[0];
    let minZ = oldestSegment.position.z;

    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].position.z < minZ) {
        minZ = this.segments[i].position.z;
        oldestSegment = this.segments[i];
      }
    }

    // If it's far enough behind the player, move it to the front
    if (playerZ - oldestSegment.position.z > this.segmentLength) {
      // Find the segment furthest ahead
      let maxZ = this.segments[0].position.z;
      for (let i = 1; i < this.segments.length; i++) {
        if (this.segments[i].position.z > maxZ) {
          maxZ = this.segments[i].position.z;
        }
      }

      const newZ = maxZ + this.segmentLength;
      oldestSegment.position.z = newZ;

      // Notify that a segment was moved so items can be spawned
      if (this.onSegmentRecycled) {
        this.onSegmentRecycled(newZ - this.segmentLength / 2, newZ + this.segmentLength / 2);
      }
    }
  }

  public getSegments(): Mesh[] {
    return this.segments;
  }

  public getSegmentLength(): number {
    return this.segmentLength;
  }

  public reset() {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].position.z = i * this.segmentLength;
    }
  }
}
