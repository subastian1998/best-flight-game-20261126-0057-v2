// Steel Falcon 3D — shared tuning numbers for the whole game.
// One place holds every constant so the physics, the missions, the city
// and the renderer always agree about the world they live in.

/** The ruined robot city: x across, z along the flight path. */
export const WORLD = {
  width: 1200,
  depth: 1500,
  /** Ground level of the ash plain. */
  ground: 0,
};

/** The runway: a flat strip on the ash plain, along +z at x = 0. */
export const RUNWAY = {
  /** Centre line x. */
  x: 0,
  /** Half width of the strip. */
  halfWidth: 16,
  /** Where the strip starts and ends along z. */
  zStart: 480,
  zEnd: 740,
  /** Touchdown zone: gentle landings inside here count. */
  zTouch: 520,
};

/** Arcade flight model for a delta-wing fighter (no physics library). */
export const PHYSICS = {
  /** Thrust acceleration at full throttle, m/s^2. */
  thrust: 46,
  /** Drag coefficient; terminal speed at full throttle is ~200 m/s. */
  drag: 0.00115,
  /** Below this speed the wing stops lifting and the jet sinks. */
  stallSpeed: 58,
  /** Extra drag while the airbrake (Space) is held. */
  brakeDrag: 0.0045,
  /** Flaps: lower stall speed, more drag everywhere. */
  flapStall: 42,
  flapDrag: 0.0009,
  /** Roll rate, rad/s at full stick. */
  rollRate: 1.9,
  /** Pitch rate, rad/s at full stick. */
  pitchRate: 1.1,
  /** How fast bank turns the nose, rad/s per rad of bank. */
  turnRate: 0.55,
  /** Gravity pull when the wing is stalled, m/s^2. */
  sink: 9,
  /** Fuel burn per second: base + throttle * perThrottle. */
  fuelBase: 0.22,
  fuelPerThrottle: 0.95,
  /** Fuel topped up by each ring. */
  ringFuel: 8,
  /** Vertical speed (m/s) that still counts as a gentle touchdown. */
  softTouch: -10,
  /** Vertical speed that wrecks the hull instead of landing. */
  hardTouch: -17,
};

/** Ring geometry. */
export const RING = {
  /** Torus radius in metres; the jet must pass within this of the centre. */
  radius: 12,
  tube: 1.3,
};

/** The three missions. Ring chains are hand-placed over the ruined city;
 *  y is altitude in metres, wind is a steady crosswind in m/s (+x). */
export const MISSIONS = [
  {
    name: 'Ring Run',
    sub: 'Thread the ruins — 6 rings over the war city',
    wind: 0,
    start: { x: 0, y: 90, z: 380, yaw: 0 },
    rings: [
      { x: 0, y: 95, z: 120 },
      { x: -90, y: 80, z: -60 },
      { x: 60, y: 110, z: -220 },
      { x: -140, y: 70, z: -380 },
      { x: 40, y: 100, z: -520 },
      { x: 0, y: 85, z: -640 },
    ],
  },
  {
    name: 'City Hop',
    sub: 'Weave between the broken towers — 7 rings',
    wind: 4,
    start: { x: -60, y: 70, z: 300, yaw: 0 },
    rings: [
      { x: -60, y: 70, z: 100 },
      { x: 120, y: 55, z: -40 },
      { x: -120, y: 90, z: -160 },
      { x: 90, y: 60, z: -300 },
      { x: -60, y: 95, z: -420 },
      { x: 150, y: 65, z: -540 },
      { x: 0, y: 80, z: -660 },
    ],
  },
  {
    name: 'Dusk Delivery',
    sub: 'Long run home — 8 rings, land on the strip',
    wind: 7,
    start: { x: 40, y: 100, z: 360, yaw: 0 },
    rings: [
      { x: 40, y: 100, z: 140 },
      { x: -100, y: 75, z: -20 },
      { x: 130, y: 110, z: -170 },
      { x: -80, y: 60, z: -300 },
      { x: 100, y: 95, z: -430 },
      { x: -140, y: 70, z: -540 },
      { x: 30, y: 105, z: -620 },
      { x: 0, y: 70, z: 430 },
    ],
  },
];

/** Dusk war-city palette. */
export const PALETTE = {
  sky: 0x2b1d26,
  fog: 0x352329,
  sun: 0xff7a2a,
  ground: 0x3d3630,
  road: 0x2c2724,
  building: [0x6b6560, 0x57504b, 0x7a7168, 0x4a4440],
  rust: 0x8a4a28,
  metal: 0x3a3f46,
  jetGrey: 0x8a919c,
  jetDark: 0x5d646e,
  jetCammo: 0x6e757f,
  canopy: 0x1c2733,
  ring: 0xffc93c,
  ringDone: 0x37d67a,
  fire: 0xff6a1e,
  ember: 0xffb347,
  smoke: 0x2a2523,
};
