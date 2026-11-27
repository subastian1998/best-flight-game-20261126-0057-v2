// Steel Falcon 3D — the gold target rings.
// Rings hang in the air over the ruined city; the jet must fly through
// each one in order. Passed rings turn green and stop glowing.

import * as THREE from 'three';
import { PALETTE, RING } from './config.js';

export class Rings {
  /**
   * @param {THREE.Scene} scene
   * @param {Array<{x:number,y:number,z:number}>} points ring centres.
   */
  constructor(scene, points) {
    this.group = new THREE.Group();
    this.points = points;
    this.next = 0;
    this.passed = 0;
    this.meshes = points.map((p) => {
      const ring = new THREE.Group();
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(RING.radius, RING.tube, 10, 28),
        new THREE.MeshBasicMaterial({ color: PALETTE.ring }),
      );
      ring.add(torus);
      // Inner glow disc so the ring reads at distance.
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(RING.radius * 0.92, 24),
        new THREE.MeshBasicMaterial({
          color: PALETTE.ring, transparent: true, opacity: 0.07,
          side: THREE.DoubleSide, depthWrite: false,
        }),
      );
      ring.add(disc);
      ring.position.set(p.x, p.y, p.z);
      // Face along the flight path (rings stand vertical, facing +/-z).
      ring.rotation.y = 0;
      this.group.add(ring);
      return { group: ring, torus, disc, done: false };
    });
    scene.add(this.group);
    this._pulse = 0;
  }

  /** The centre of the next ring, or null when all are passed. */
  nextPoint() {
    return this.next < this.points.length ? this.points[this.next] : null;
  }

  /** True when every ring is passed. */
  get done() {
    return this.next >= this.points.length;
  }

  /**
   * Check the jet position against the next ring.
   * @param {THREE.Vector3} pos jet position.
   * @returns {boolean} true if a ring was just passed.
   */
  check(pos) {
    const p = this.nextPoint();
    if (!p) return false;
    const dx = pos.x - p.x;
    const dy = pos.y - p.y;
    const dz = pos.z - p.z;
    if (dx * dx + dy * dy + dz * dz < RING.radius * RING.radius) {
      const m = this.meshes[this.next];
      m.done = true;
      m.torus.material = new THREE.MeshBasicMaterial({ color: PALETTE.ringDone });
      m.disc.material.opacity = 0.02;
      this.next += 1;
      this.passed += 1;
      return true;
    }
    return false;
  }

  /** Pulse the next ring so it draws the eye. */
  update(dt) {
    this._pulse += dt * 3;
    const m = this.meshes[this.next];
    if (m && !m.done) {
      const s = 1 + Math.sin(this._pulse) * 0.05;
      m.group.scale.setScalar(s);
    }
  }

  reset(points) {
    this.points = points;
    this.next = 0;
    this.passed = 0;
    this.meshes.forEach((m, i) => {
      m.done = false;
      m.group.position.set(points[i].x, points[i].y, points[i].z);
      m.group.scale.setScalar(1);
      m.torus.material = new THREE.MeshBasicMaterial({ color: PALETTE.ring });
      m.disc.material.opacity = 0.07;
    });
  }
}
