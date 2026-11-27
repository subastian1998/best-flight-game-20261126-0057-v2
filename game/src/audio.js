// Steel Falcon 3D — synthesised WebAudio sounds, no audio files.
// One engine drone (sawtooth through a low-pass filter, pitch follows
// throttle and speed), wind noise (looped noise buffer, gain follows
// speed), and one-shot chimes / thuds / beeps built from oscillators.

export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.muted = false;
    this._engine = null;
    this._wind = null;
    this._started = false;
  }

  /** Must be called from a user gesture at least once (autoplay policy). */
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this._buildLoops();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  _buildLoops() {
    const ctx = this.ctx;
    // Engine: two detuned saws through a low-pass filter.
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 55 * 1.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    this._engine = { osc1, osc2, filter, gain };

    // Wind: white noise buffer through a band-pass filter.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.6;
    const wGain = ctx.createGain();
    wGain.gain.value = 0;
    noise.connect(band);
    band.connect(wGain);
    wGain.connect(ctx.destination);
    noise.start();
    this._wind = { gain: wGain, band };
    this._started = true;
  }

  /** Per-frame update: throttle 0..1, speed in m/s, flying or not. */
  update(throttle, speed, flying) {
    if (!this._started || this.muted) {
      if (this._engine) this._engine.gain.gain.value = 0;
      if (this._wind) this._wind.gain.gain.value = 0;
      return;
    }
    const t = this.ctx.currentTime;
    const eng = this._engine;
    const target = flying ? 0.05 + throttle * 0.11 : 0;
    eng.gain.gain.setTargetAtTime(target, t, 0.15);
    const freq = 48 + throttle * 90 + speed * 0.25;
    eng.osc1.frequency.setTargetAtTime(freq, t, 0.1);
    eng.osc2.frequency.setTargetAtTime(freq * 1.5, t, 0.1);
    eng.filter.frequency.setTargetAtTime(240 + throttle * 900, t, 0.1);
    const wind = flying ? Math.min(0.16, (speed / 200) * 0.16) : 0;
    this._wind.gain.gain.setTargetAtTime(wind, t, 0.2);
    this._wind.band.frequency.setTargetAtTime(600 + speed * 4, t, 0.2);
  }

  /** Short sine blip at a frequency, for UI clicks. */
  blip(freq = 660, dur = 0.09, vol = 0.12) {
    this._tone(freq, dur, vol, 'sine');
  }

  /** Ring chime: two rising sines. */
  chime() {
    this._tone(880, 0.16, 0.16, 'sine');
    setTimeout(() => this._tone(1318, 0.22, 0.14, 'sine'), 90);
  }

  /** Crash thud: low sine burst with a fast fall. */
  thud() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.35);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  }

  /** Landing success: three-note confirmation. */
  fanfare() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.25, 0.14, 'triangle'), i * 120);
    });
  }

  _tone(freq, dur, vol, type) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  setMuted(m) {
    this.muted = m;
    if (!this._started) return;
    if (m) {
      this._engine.gain.gain.value = 0;
      this._wind.gain.gain.value = 0;
    }
  }
}
