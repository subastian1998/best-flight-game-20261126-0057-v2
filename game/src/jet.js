// Steel Falcon 3D — the Rafale-class delta fighter, built from primitives.
// Nose points toward -Z (the flight direction). Delta wing + canards,
// twin canted tails, twin engine nozzles with afterburner glow, grey
// two-tone camo, a tinted canopy, and a tricolore tail stripe. The cockpit
// interior (instrument panel + canopy frame) is part of the model so the
// cockpit camera sees real geometry, not a painted overlay.

import * as THREE from 'three';
import { PALETTE } from './config.js';

/** Delta-wing planform as a flat extruded shape (x = span, y = chord). */
function deltaWing(span, rootChord, tipChord, sweep, thickness, material) {
  const s = new THREE.Shape();
  const half = span / 2;
  // Planform seen from above: leading edge sweeps back, trailing edge
  // almost straight, clipped tip.
  s.moveTo(0, rootChord / 2);
  s.lineTo(half, rootChord / 2 - sweep);
  s.lineTo(half, rootChord / 2 - sweep - tipChord);
  s.lineTo(0, -rootChord / 2);
  s.lineTo(-half, rootChord / 2 - sweep - tipChord);
  s.lineTo(-half, rootChord / 2 - sweep);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: thickness,
    bevelEnabled: false,
  });
  // Extrude runs along +z; rotate flat so the chord lies along -z/+z.
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  return mesh;
}

/** Build the jet. Returns { group, nozzleGlow, panel }.
 *  group origin is the jet centre; nose at z = -7.6, tail at z = +7.6. */
export function buildJet() {
  const group = new THREE.Group();
  const grey = new THREE.MeshLambertMaterial({ color: PALETTE.jetGrey });
  const dark = new THREE.MeshLambertMaterial({ color: PALETTE.jetDark });
  const camo = new THREE.MeshLambertMaterial({ color: PALETTE.jetCammo });
  const glass = new THREE.MeshLambertMaterial({
    color: PALETTE.canopy,
    emissive: 0x0e2a3a,
    emissiveIntensity: 0.7,
  });
  const hot = new THREE.MeshBasicMaterial({ color: 0xff8a2a });

  // Fuselage: a tapered cylinder (wide at the intakes, narrow at the nose).
  const bodyGeo = new THREE.CylinderGeometry(0.85, 1.35, 11.5, 10);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, grey);
  body.position.set(0, 0, 0.4);
  group.add(body);

  // Nose cone.
  const noseGeo = new THREE.ConeGeometry(0.85, 3.4, 10);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, camo);
  nose.position.set(0, 0, -7.6);
  group.add(nose);

  // Spine hump behind the cockpit.
  const spineGeo = new THREE.CylinderGeometry(0.55, 0.9, 5.2, 8);
  spineGeo.rotateX(Math.PI / 2);
  const spine = new THREE.Mesh(spineGeo, dark);
  spine.position.set(0, 0.55, 2.2);
  group.add(spine);

  // Main delta wing: wide, swept, thin.
  const wing = deltaWing(10.9, 7.6, 1.6, 4.4, 0.22, camo);
  wing.position.set(0, -0.15, 2.4);
  group.add(wing);

  // Canards: small deltas ahead of the wing, either side of the nose.
  const canard = deltaWing(4.4, 2.2, 0.7, 1.3, 0.14, grey);
  canard.position.set(0, 0.25, -3.6);
  group.add(canard);

  // Twin vertical tails, canted outward.
  for (const side of [-1, 1]) {
    const tailGeo = new THREE.BoxGeometry(0.18, 2.6, 2.6);
    const tail = new THREE.Mesh(tailGeo, dark);
    tail.position.set(side * 1.35, 1.35, 4.6);
    tail.rotation.z = -side * 0.28;
    tail.rotation.x = -0.25;
    group.add(tail);
    // Tricolore stripe on each tail: blue / white / red bands.
    const stripeCols = [0x1e3fae, 0xf2f2f2, 0xc8102e];
    stripeCols.forEach((c, i) => {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.55, 2.0),
        new THREE.MeshBasicMaterial({ color: c }),
      );
      band.position.set(side * 1.35, 1.75 + i * 0.56, 4.55);
      band.rotation.z = -side * 0.28;
      band.rotation.x = -0.25;
      group.add(band);
    });
  }

  // Twin engine nozzles + afterburner glow discs.
  const nozzleGlow = [];
  for (const side of [-1, 1]) {
    const nozzleGeo = new THREE.CylinderGeometry(0.62, 0.72, 1.6, 10);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, dark);
    nozzle.position.set(side * 0.95, -0.1, 6.4);
    group.add(nozzle);
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    glow.position.set(side * 0.95, -0.1, 7.25);
    glow.rotation.y = Math.PI;
    group.add(glow);
    nozzleGlow.push(glow.material);
  }

  // Canopy: a flattened half-sphere, tinted glass. Long and tall enough
  // that the pilot's eye sits inside it, ahead of the instrument panel.
  const canopyGeo = new THREE.SphereGeometry(0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  canopyGeo.scale(0.85, 0.75, 2.6);
  const canopy = new THREE.Mesh(canopyGeo, glass);
  canopy.position.set(0, 0.5, -2.0);
  group.add(canopy);

  // ---- Cockpit interior (seen from the cockpit camera) ----
  // Instrument panel: dark slab with glowing gauges, ahead of the pilot.
  // The pilot's eye sits at local (0, 0.95, -0.9); the panel is 1 m
  // ahead of it and low enough to see over — gauges in the lower third,
  // sky and ring dead ahead. The slab is unlit dark grey so it reads as
  // a panel instead of a black void.
  const panel = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.4, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x232830 }),
  );
  slab.position.set(0, 0.45, -2.0);
  slab.rotation.x = -0.35;
  panel.add(slab);
  // Six small glowing gauges, in the lower third of the view.
  const gaugeCols = [0x37d67a, 0xffc93c, 0x4db2ff, 0xff8a2a, 0x37d67a, 0xff5a4d];
  gaugeCols.forEach((c, i) => {
    const g = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 12),
      new THREE.MeshBasicMaterial({ color: c }),
    );
    const gx = -0.45 + (i % 3) * 0.45;
    const gy = 0.55 - Math.floor(i / 3) * 0.2;
    g.position.set(gx, gy, -1.93);
    g.rotation.x = -0.35;
    panel.add(g);
  });
  // HUD glass: a small green-tinted combiner above the panel, far enough
  // ahead that it never fills the view.
  const hudGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.32),
    new THREE.MeshBasicMaterial({
      color: 0x39ff88,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    }),
  );
  hudGlass.position.set(0, 1.08, -2.3);
  hudGlass.rotation.x = -0.4;
  panel.add(hudGlass);
  group.add(panel);

  // Canopy frame bars: thin dark rails over the canopy so the cockpit
  // view reads as "inside a canopy", not free-floating.
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 3.4), dark);
    rail.position.set(side * 0.78, 1.02, -2.2);
    group.add(rail);
  }
  const bow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), dark);
  bow.position.set(0, 1.05, -4.0);
  group.add(bow);

  // Wingtip missile rails (small dark rails, no warheads shown).
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 2.4), dark);
    rail.position.set(side * 5.3, -0.1, 2.6);
    group.add(rail);
  }

  return { group, nozzleGlow, panel };
}
