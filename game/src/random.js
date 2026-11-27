// Steel Falcon 3D — deterministic seeded random numbers.
// The city, the debris and the smoke all come from one seed so the same
// seed always builds the same ruined city (and screenshots are repeatable).

/** Mulberry32: a small fast seeded PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a next() function. */
export function int(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Float in [min, max) from a next() function. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one element of an array from a next() function. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Read ?seed=N from the URL, defaulting to 7. */
export function seedFromUrl() {
  const m = /[?&]seed=(\d+)/.exec(location.search);
  return m ? Number(m[1]) >>> 0 : 7;
}
