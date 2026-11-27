// Steel Falcon 3D — the DOM HUD and the screens.
// Instruments (altitude, speed, heading, attitude ball, throttle, fuel,
// hull), mission box, score, camera-mode button, and the title / pause /
// complete / crash overlays. All DOM ids live in index.html.

export class HUD {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      alt: $('hud-alt'), spd: $('hud-spd'), hdg: $('hud-hdg'),
      fuel: $('hud-fuel'), fuelBar: $('hud-fuel-bar'),
      thr: $('hud-thr'), thrBar: $('hud-thr-bar'),
      hull: $('hud-hull'), hullBar: $('hud-hull-bar'),
      score: $('hud-score'), mission: $('hud-mission'),
      rings: $('hud-rings'), cam: $('hud-cam'),
      attitude: $('hud-attitude'), horizon: $('hud-horizon'),
      msg: $('hud-msg'), wind: $('hud-wind'),
      screenTitle: $('screen-title'), screenPause: $('screen-pause'),
      screenEnd: $('screen-end'), endTitle: $('end-title'),
      endBody: $('end-body'),
      btnCam: $('btn-cam'), btnSound: $('btn-sound'),
    };
    this._msgTimer = 0;
  }

  /** Per-frame instrument update. */
  update(s) {
    this.el.alt.textContent = `${Math.max(0, Math.round(s.alt))}`;
    this.el.spd.textContent = `${Math.round(s.speed * 3.6)}`;
    this.el.hdg.textContent = `${String(Math.round(s.heading)).padStart(3, '0')}°`;
    this.el.fuel.textContent = `${Math.max(0, Math.round(s.fuel))}%`;
    this.el.fuelBar.style.width = `${Math.max(0, Math.min(100, s.fuel))}%`;
    this.el.fuelBar.style.background = s.fuel < 25 ? '#ff5a4d' : '#ffb347';
    this.el.thr.textContent = `${Math.round(s.throttle * 100)}%`;
    this.el.thrBar.style.width = `${Math.round(s.throttle * 100)}%`;
    this.el.hull.textContent = `${Math.max(0, Math.round(s.hull))}%`;
    this.el.hullBar.style.width = `${Math.max(0, Math.min(100, s.hull))}%`;
    this.el.hullBar.style.background = s.hull < 35 ? '#ff5a4d' : '#37d67a';
    this.el.score.textContent = `${s.score}`;
    this.el.mission.textContent = s.missionName;
    this.el.rings.textContent = `RINGS ${s.ringsPassed}/${s.ringsTotal}`;
    this.el.cam.textContent = `CAM ${s.camMode}`;
    this.el.wind.textContent = s.wind ? `WIND ${s.wind} m/s` : '';
    // Attitude ball: horizon line tilts with roll, slides with pitch.
    this.el.horizon.style.transform =
      `translateY(${(-s.pitch * 40).toFixed(1)}px) rotate(${(-s.roll * 57.3).toFixed(1)}deg)`;
    this.el.attitude.classList.toggle('warn', s.alt < 25 && s.speed > 60);
  }

  /** Centre-screen flash message, auto-hides after ~2.4 s. */
  message(text) {
    this.el.msg.textContent = text;
    this.el.msg.classList.remove('hidden');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this.el.msg.classList.add('hidden'), 2400);
  }

  /** Hide any flash message immediately (screenshot staging). */
  clearMessage() {
    clearTimeout(this._msgTimer);
    this.el.msg.classList.add('hidden');
  }

  showTitle() {
    this.el.screenTitle.classList.remove('hidden');
    this.el.screenPause.classList.add('hidden');
    this.el.screenEnd.classList.add('hidden');
  }

  showPause(on) {
    this.el.screenPause.classList.toggle('hidden', !on);
  }

  showEnd(title, body) {
    this.el.endTitle.textContent = title;
    this.el.endBody.innerHTML = body;
    this.el.screenEnd.classList.remove('hidden');
    this.el.screenTitle.classList.add('hidden');
    this.el.screenPause.classList.add('hidden');
  }

  hideScreens() {
    this.el.screenTitle.classList.add('hidden');
    this.el.screenPause.classList.add('hidden');
    this.el.screenEnd.classList.add('hidden');
  }

  setSoundLabel(muted) {
    this.el.btnSound.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  }
}
