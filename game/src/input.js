// Steel Falcon 3D — keyboard input plus the camera-switch control.
// Keys are read as a live state object; the game polls it every frame.
// The camera toggle is an event (key C or the on-screen CAM button), so a
// single press flips the view exactly once.

/** Keys the game cares about, by KeyboardEvent.code. */
const GAME_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyS', 'KeyA', 'KeyD',
  'Space', 'KeyF', 'KeyC', 'KeyP', 'KeyR', 'KeyM',
  'Digit1', 'Digit2', 'Digit3', 'Enter',
];

export class Input {
  /**
   * @param {() => void} onCameraToggle called on C or the CAM button.
   * @param {(n: number) => void} onMissionPick called on Digit1..3.
   */
  constructor(onCameraToggle, onMissionPick) {
    /** @type {Record<string, boolean>} live key state. */
    this.keys = {};
    this.onCameraToggle = onCameraToggle;
    this.onMissionPick = onMissionPick;
    this._down = (e) => {
      if (!GAME_KEYS.includes(e.code)) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        if (e.code === 'KeyC') this.onCameraToggle();
        if (e.code === 'Digit1') this.onMissionPick(0);
        if (e.code === 'Digit2') this.onMissionPick(1);
        if (e.code === 'Digit3') this.onMissionPick(2);
      }
      this.keys[e.code] = true;
    };
    this._up = (e) => {
      this.keys[e.code] = false;
    };
    window.addEventListener('keydown', this._down);
    window.addEventListener('keyup', this._up);
    // The on-screen CAM button mirrors the C key.
    const btn = document.getElementById('btn-cam');
    if (btn) btn.addEventListener('click', () => this.onCameraToggle());
  }

  down(code) {
    return !!this.keys[code];
  }

  /** Pitch stick: -1 (nose down) .. +1 (nose up). */
  pitch() {
    return (this.down('ArrowUp') ? 1 : 0) + (this.down('ArrowDown') ? -1 : 0);
  }

  /** Roll stick: -1 (left) .. +1 (right). */
  roll() {
    return (this.down('ArrowRight') ? 1 : 0) + (this.down('ArrowLeft') ? -1 : 0);
  }

  /** Throttle keys: +1 (W) .. -1 (S). */
  throttle() {
    return (this.down('KeyW') ? 1 : 0) + (this.down('KeyS') ? -1 : 0);
  }

  brake() {
    return this.down('Space');
  }

  flaps() {
    return this.down('KeyF');
  }

  pause() {
    return this.down('KeyP');
  }

  restart() {
    return this.down('KeyR');
  }

  mute() {
    return this.down('KeyM');
  }

  dispose() {
    window.removeEventListener('keydown', this._down);
    window.removeEventListener('keyup', this._up);
  }
}
