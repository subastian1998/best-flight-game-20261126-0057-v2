// Steel Falcon 3D — the two camera modes.
// CHASE: a smoothed camera trailing behind and above the jet, looking
// ahead along the flight path. COCKPIT: first-person from the pilot's
// seat, looking forward past the instrument panel and through the canopy
// frame. Toggle with C or the on-screen CAM button; snap() jumps the
// chase camera into place instantly (used by screenshot staging).

import * as THREE from 'three';

export const CAM_MODES = ['CHASE', 'COCKPIT'];

export class CameraRig {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Object3D} jet the jet group (position + quaternion).
   */
  constructor(camera, jet) {
    this.camera = camera;
    this.jet = jet;
    this.mode = 'CHASE';
    this._chasePos = new THREE.Vector3();
    this._init = false;
    this._tmp = new THREE.Vector3();
    this._target = new THREE.Vector3();
  }

  toggle() {
    this.mode = this.mode === 'CHASE' ? 'COCKPIT' : 'CHASE';
    return this.mode;
  }

  setMode(mode) {
    this.mode = mode;
    return this.mode;
  }

  /** Place the chase camera exactly where it belongs (no smoothing). */
  snap() {
    this._chasePos.copy(this._chaseDesired());
    this.camera.position.copy(this._chasePos);
    this._init = true;
  }

  _chaseDesired() {
    // 17 m behind the jet, 5 m above, in the jet's own frame.
    this._tmp.set(0, 5, 17).applyQuaternion(this.jet.quaternion);
    return this._target.copy(this.jet.position).add(this._tmp);
  }

  /** Per-frame update. dt in seconds. */
  update(dt) {
    if (this.mode === 'COCKPIT') {
      // Pilot's eye: inside the canopy, 1 m behind the instrument panel.
      this._tmp.set(0, 0.95, -0.9).applyQuaternion(this.jet.quaternion);
      this.camera.position.copy(this.jet.position).add(this._tmp);
      // Look far ahead along the jet's nose, slightly down over the panel.
      this._target.set(0, 0.65, -60).applyQuaternion(this.jet.quaternion);
      this._target.add(this.jet.position);
      // The camera banks with the jet so the horizon tilts in the turn.
      this.camera.up.set(0, 1, 0).applyQuaternion(this.jet.quaternion);
      this.camera.lookAt(this._target);
      this.camera.fov = 66;
      this.camera.updateProjectionMatrix();
      this._init = false;
      return;
    }
    // Chase mode: smooth follow, world-up.
    const desired = this._chaseDesired();
    if (!this._init) {
      this._chasePos.copy(desired);
      this._init = true;
    }
    const k = 1 - Math.exp(-dt * 5.5);
    this._chasePos.lerp(desired, k);
    this.camera.position.copy(this._chasePos);
    this.camera.up.set(0, 1, 0);
    this._target.set(0, 1, -30).applyQuaternion(this.jet.quaternion);
    this._target.add(this.jet.position);
    this.camera.lookAt(this._target);
    this.camera.fov = 68;
    this.camera.updateProjectionMatrix();
  }
}
