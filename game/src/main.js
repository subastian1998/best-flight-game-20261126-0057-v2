// Steel Falcon 3D — boot, game loop, arcade flight physics, missions.
// A Rafale-class delta fighter over a war-torn robot city: thread the
// gold rings in order, watch fuel and hull, and put her down gently on
// the strip. Two cameras (chase / cockpit), three missions, synthesised
// audio, no files loaded from anywhere but game/ itself.

import * as THREE from 'three';
import { MISSIONS, PALETTE, PHYSICS, RING, RUNWAY } from './config.js';
import { mulberry32, seedFromUrl } from './random.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { buildJet } from './jet.js';
import { buildCity } from './city.js';
import { Rings } from './rings.js';
import { CameraRig } from './camera.js';
import { HUD } from './hud.js';
import { stageShot } from './shots.js';

const $ = (id) => document.getElementById(id);

class Game {
  constructor() {
    this.seed = seedFromUrl();
    this.rng = mulberry32(this.seed);
    this.state = 'title'; // title | flying | paused | over | shot
    this.shotCamera = false;
    this.missionIndex = 0;
    this.mission = MISSIONS[0];
    this.score = 0;
    this.nextRing = 0;

    // --- Renderer / scene / camera ---
    this.renderer = new THREE.WebGLRenderer({
      canvas: $('game'), antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.fog, 180, 1500);
    this.camera = new THREE.PerspectiveCamera(
      68, window.innerWidth / window.innerHeight, 0.1, 4000,
    );

    // --- Lights: dusk hemisphere + low orange sun ---
    const hemi = new THREE.HemisphereLight(0xff9a5c, 0x2a2024, 1.3);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xff8a4a, 2.1);
    sun.position.set(-400, 260, -320);
    this.scene.add(sun);

    // --- World: keep every ring approach clear of tall buildings ---
    const keepOut = [];
    for (const m of MISSIONS) {
      for (const r of m.rings) keepOut.push({ x: r.x, z: r.z, r: 34 });
    }
    this.city = buildCity(this.scene, this.rng, keepOut);
    const jet = buildJet();
    this.jetGroup = jet.group;
    this.nozzleGlow = jet.nozzleGlow;
    this.scene.add(this.jetGroup);

    // --- Plane state (roll positive = bank right) ---
    this.plane = {
      pos: new THREE.Vector3(0, 2, 600),
      yaw: 0, pitch: 0, roll: 0,
      speed: 0, throttle: 0, fuel: 100, hull: 100,
      flaps: false, vy: 0,
    };
    this._prevY = 2;
    this._flameout = false;

    this.rings = new Rings(this.scene, this.mission.rings);
    this.chase = new CameraRig(this.camera, this.jetGroup);
    this.hud = new HUD();
    this.audio = new AudioEngine();
    this.input = new Input(
      () => this.toggleCamera(),
      (n) => { if (this.state === 'title') this.startMission(n); },
    );

    this._wireButtons();
    this._applyPlaneTransform();
    this.chase.snap();
    this.hud.showTitle();
    this.hud.setSoundLabel(false);

    window.addEventListener('resize', () => this._resize());
    window.addEventListener('pointerdown', () => this.audio.ensure(), { once: true });
    window.addEventListener('keydown', () => this.audio.ensure(), { once: true });

    // Screenshot staging: ?shot=chase|cockpit|city|landing
    const shot = /[?&]shot=([a-z]+)/.exec(location.search);
    if (shot && stageShot(shot[1], this)) {
      this.state = 'shot';
      this._applyPlaneTransform();
      if (!this.shotCamera) this.chase.update(0.016);
      this._syncHud();
    }

    this.clock = new THREE.Clock();
    window.__game = this;
    this.renderer.setAnimationLoop(() => this._tick());
  }

  _wireButtons() {
    for (let i = 0; i < 3; i++) {
      const b = $(`btn-m${i}`);
      if (b) b.addEventListener('click', () => {
        this.audio.ensure();
        this.audio.blip();
        this.startMission(i);
      });
    }
    $('btn-sound').addEventListener('click', () => {
      this.audio.ensure();
      this.audio.setMuted(!this.audio.muted);
      this.hud.setSoundLabel(this.audio.muted);
    });
    $('btn-again').addEventListener('click', () => {
      this.audio.blip();
      this.startMission(this.missionIndex);
    });
    $('btn-menu').addEventListener('click', () => {
      this.audio.blip();
      this.state = 'title';
      this.startMission(this.missionIndex, { keepScreen: false });
      this.state = 'title';
      this.hud.showTitle();
    });
  }

  _resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startMission(index, opts = {}) {
    this.missionIndex = index;
    this.mission = MISSIONS[index];
    const s = this.mission.start;
    const p = this.plane;
    p.pos.set(s.x, s.y, s.z);
    p.yaw = s.yaw;
    p.pitch = 0;
    p.roll = 0;
    p.speed = 0;
    p.throttle = 0;
    p.fuel = 100;
    p.hull = 100;
    p.flaps = false;
    p.vy = 0;
    this.score = 0;
    this.nextRing = 0;
    this._flameout = false;
    this._prevY = s.y;
    this.rings.reset(this.mission.rings);
    this._applyPlaneTransform();
    this.chase.snap();
    this.state = 'flying';
    if (!opts.keepScreen) this.hud.hideScreens();
    this.hud.message(`${this.mission.name} — ${this.mission.rings.length} rings`);
    this._syncHud();
  }

  toggleCamera() {
    if (this.state !== 'flying' && this.state !== 'paused') return;
    const mode = this.chase.toggle();
    this.audio.blip(mode === 'COCKPIT' ? 520 : 760, 0.07, 0.08);
    this.hud.message(mode === 'COCKPIT' ? 'COCKPIT CAM' : 'CHASE CAM');
  }

  _applyPlaneTransform() {
    const p = this.plane;
    this.jetGroup.position.copy(p.pos);
    // Roll positive = bank right, so the model rolls the other way.
    this.jetGroup.rotation.set(p.pitch, p.yaw, -p.roll, 'YXZ');
  }

  _syncHud() {
    const p = this.plane;
    this.hud.update({
      alt: p.pos.y,
      speed: p.speed,
      heading: ((-p.yaw * 180 / Math.PI) % 360 + 360) % 360,
      pitch: p.pitch,
      roll: p.roll,
      throttle: p.throttle,
      fuel: p.fuel,
      hull: p.hull,
      score: this.score,
      missionName: this.mission.name,
      ringsPassed: this.rings.passed,
      ringsTotal: this.mission.rings.length,
      camMode: this.chase.mode,
      wind: this.mission.wind,
    });
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.state === 'shot') {
      this.city.update(dt);
      this.renderer.render(this.scene, this.camera);
      this.renderer.render(this.scene, this.camera);
      if (!window.__shotReady) window.__shotReady = true;
      return;
    }
    this.city.update(dt);
    if (this.state === 'flying') this._updateFlight(dt);
    if (this.state === 'title') {
      // Parked on the strip: idle camera drift for the title backdrop.
      this.chase.update(dt);
    }
    if (this.state !== 'paused') {
      this.audio.update(
        this.plane.throttle, this.plane.speed, this.state === 'flying',
      );
    }
    this._syncHud();
    this.renderer.render(this.scene, this.camera);
  }

  _updateFlight(dt) {
    const p = this.plane;
    const input = this.input;

    if (input.pause() && !this._pauseHeld) {
      this.state = 'paused';
      this.hud.showPause(true);
      this._pauseHeld = true;
      return;
    }
    if (!input.pause()) this._pauseHeld = false;
    if (input.restart()) {
      this.startMission(this.missionIndex);
      return;
    }
    if (input.mute() && !this._muteHeld) {
      this.audio.setMuted(!this.audio.muted);
      this.hud.setSoundLabel(this.audio.muted);
      this._muteHeld = true;
    }
    if (!input.mute()) this._muteHeld = false;

    // --- Controls ---
    p.throttle = Math.max(0, Math.min(1,
      p.throttle + input.throttle() * 0.55 * dt));
    if (this._flameout || p.fuel <= 0) p.throttle = 0;
    p.flaps = input.flaps();
    const rollTarget = input.roll() * 0.85;
    p.roll += (rollTarget - p.roll) * Math.min(1, dt * 4);
    p.roll = Math.max(-1.1, Math.min(1.1, p.roll));
    p.pitch += input.pitch() * PHYSICS.pitchRate * dt;
    p.pitch = Math.max(-0.55, Math.min(0.55, p.pitch));
    // Bank turns the nose: roll right -> heading right.
    p.yaw -= p.roll * PHYSICS.turnRate * dt;

    // --- Speed: thrust, drag, brake, flaps, climb cost ---
    const stall = p.flaps ? PHYSICS.flapStall : PHYSICS.stallSpeed;
    let drag = PHYSICS.drag + (p.flaps ? PHYSICS.flapDrag : 0);
    if (input.brake()) drag += PHYSICS.brakeDrag;
    p.speed += (PHYSICS.thrust * p.throttle - drag * p.speed * p.speed) * dt;
    p.speed -= 9.8 * Math.sin(p.pitch) * 0.45 * dt;
    p.speed = Math.max(0, p.speed);

    // --- Move: forward + wind drift + stall sink ---
    const fwd = new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(p.pitch, p.yaw, -p.roll, 'YXZ'));
    p.pos.addScaledVector(fwd, p.speed * dt);
    p.pos.x += this.mission.wind * dt;
    if (p.speed < stall) {
      p.pos.y -= PHYSICS.sink * (1 - p.speed / stall) * dt;
    }
    p.vy = (p.pos.y - this._prevY) / Math.max(dt, 1e-4);
    this._prevY = p.pos.y;

    // --- Fuel ---
    p.fuel -= (PHYSICS.fuelBase + PHYSICS.fuelPerThrottle * p.throttle) * dt;
    if (p.fuel <= 0 && !this._flameout) {
      p.fuel = 0;
      this._flameout = true;
      this.hud.message('FLAMEOUT — no fuel! Glide to the strip');
    }

    // --- Afterburner glow follows the throttle ---
    const glow = 0.15 + p.throttle * 0.75;
    for (const m of this.nozzleGlow) m.opacity = glow;

    this._applyPlaneTransform();
    this.chase.update(dt);

    // --- Rings ---
    if (this.rings.check(p.pos)) {
      this.score += 100;
      p.fuel = Math.min(100, p.fuel + PHYSICS.ringFuel);
      this.audio.chime();
      this.hud.message(
        `RING ${this.rings.passed}/${this.mission.rings.length} — +100  •  fuel +${PHYSICS.ringFuel}`,
      );
    }
    this.rings.update(dt);

    // --- Collisions ---
    this._checkCollisions();
  }

  _checkCollisions() {
    const p = this.plane;
    // Buildings and wrecked mechs.
    for (const c of this.city.colliders) {
      if (Math.abs(p.pos.x - c.x) < c.hw + 2
        && Math.abs(p.pos.z - c.z) < c.hd + 2
        && p.pos.y < c.top + 1) {
        return this._crash('You clipped a ruined tower.');
      }
    }
    // World bounds: turn back with a warning instead of flying forever.
    if (Math.abs(p.pos.x) > 700 || p.pos.z < -780 || p.pos.z > 860) {
      p.yaw += Math.PI;
      this.hud.message('EDGE OF THE WARZONE — turning back');
      return;
    }
    // Ground.
    if (p.pos.y <= 1.6) {
      const onStrip = Math.abs(p.pos.x - RUNWAY.x) < RUNWAY.halfWidth - 1
        && p.pos.z > RUNWAY.zStart && p.pos.z < RUNWAY.zEnd;
      if (onStrip && p.vy > PHYSICS.softTouch && p.speed < 165
        && Math.abs(p.roll) < 0.4) {
        return this._land();
      }
      if (onStrip && p.vy > PHYSICS.hardTouch && p.speed < 175) {
        // Hard touchdown: hull damage, bounce back into the air.
        p.hull -= 45;
        p.pos.y = 4;
        p.vy = 5;
        p.speed *= 0.75;
        this.audio.thud();
        this.hud.message(`HARD LANDING — hull ${Math.max(0, Math.round(p.hull))}%`);
        if (p.hull <= 0) return this._crash('The hull gave out after the hard landing.');
        return;
      }
      if (onStrip) return this._crash('Too fast / too steep for the strip.');
      return this._crash('You hit the ash plain — land on the runway strip.');
    }
  }

  _land() {
    const p = this.plane;
    p.pos.y = 1.6;
    p.speed = 0;
    p.throttle = 0;
    this.state = 'over';
    this.audio.fanfare();
    if (this.rings.done) {
      const bonus = 400 + Math.max(0, Math.round(200 + p.vy * 15));
      this.score += bonus;
      this.hud.showEnd(
        'MISSION COMPLETE',
        `<p><b>${this.mission.name}</b> — all ${this.mission.rings.length} rings flown, ` +
        `wheels down on the strip.</p>` +
        `<p>Landing bonus <b>+${bonus}</b> &nbsp;•&nbsp; Final score <b>${this.score}</b></p>` +
        `<p>Fuel left ${Math.round(p.fuel)}% &nbsp;•&nbsp; Hull ${Math.round(p.hull)}%</p>`,
      );
    } else {
      this.hud.showEnd(
        'LANDED EARLY',
        `<p>Wheels down, but only ${this.rings.passed}/${this.mission.rings.length} ` +
        `rings flown. The delivery run needs every ring.</p>` +
        `<p>Score so far <b>${this.score}</b> — fly again and finish the chain.</p>`,
      );
    }
    this._syncHud();
  }

  _crash(reason) {
    if (this.state !== 'flying') return;
    this.state = 'over';
    this.plane.speed = 0;
    this.jetGroup.visible = false;
    this.audio.thud();
    this.audio.update(0, 0, false);
    this.hud.showEnd(
      'JET DOWN',
      `<p>${reason}</p>` +
      `<p>Rings ${this.rings.passed}/${this.mission.rings.length} &nbsp;•&nbsp; ` +
      `Score <b>${this.score}</b></p>` +
      `<p>Tip: keep speed above stall, bank gently, and line up on the strip early.</p>`,
    );
    this._syncHud();
  }
}

// Paused state: P resumes (handled here so the loop stays simple).
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && window.__game && window.__game.state === 'paused') {
    window.__game.state = 'flying';
    window.__game.hud.showPause(false);
  }
});

new Game();
