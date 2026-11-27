// Steel Falcon 3D — the war-torn robotic city.
// A seeded grid of ruined skyscrapers (some leaning, some broken open),
// rubble piles, cracked roads, fires with smoke plumes and glowing embers,
// three wrecked combat mechs as landmarks, scattered debris, and a lit
// runway strip. Everything is procedural; nothing is loaded from a file.

import * as THREE from 'three';
import { PALETTE, RUNWAY, WORLD } from './config.js';
import { int, pick, range } from './random.js';

/** One wrecked combat mech: torso, head with a dead eye-slit, limbs. */
function buildMech(metal, rust, glowMat) {
  const g = new THREE.Group();
  // Torso.
  const torso = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 5), metal);
  torso.position.y = 8.5;
  g.add(torso);
  // Chest plate, rusted.
  const chest = new THREE.Mesh(new THREE.BoxGeometry(7.4, 4, 0.8), rust);
  chest.position.set(0, 9.5, 2.6);
  g.add(chest);
  // Head with a dead glowing eye slit.
  const head = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 3), metal);
  head.position.y = 14.6;
  g.add(head);
  const eye = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.35, 0.2),
    glowMat,
  );
  eye.position.set(0, 14.7, 1.6);
  g.add(eye);
  // Arms: upper + forearm, one raised, one hanging.
  const armL = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), metal);
  armL.position.set(-4.8, 8, 0);
  armL.rotation.z = 0.5;
  g.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), rust);
  armR.position.set(4.8, 6.5, 0.5);
  armR.rotation.z = -0.9;
  g.add(armR);
  // Legs.
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.5, 2.4), metal);
    leg.position.set(side * 2, 3.2, 0);
    g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 4.5), rust);
    foot.position.set(side * 2, 0.6, 0.8);
    g.add(foot);
  }
  return g;
}

/**
 * Build the city into the scene.
 * @param {THREE.Scene} scene
 * @param {() => number} rng seeded random.
 * @param {Array<{x:number,z:number,r:number}>} keepOut clear cylinders
 *   (mission ring approaches) where no tall building may stand.
 * @returns {{ update: (dt: number) => void, colliders: Array, mechPositions: Array }}
 */
export function buildCity(scene, rng, keepOut = []) {
  const blocked = (x, z) => keepOut.some((k) => {
    const dx = x - k.x;
    const dz = z - k.z;
    return dx * dx + dz * dz < k.r * k.r;
  });
  const colliders = [];
  const metal = new THREE.MeshLambertMaterial({ color: PALETTE.metal });
  const rust = new THREE.MeshLambertMaterial({ color: PALETTE.rust });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff3b1f });
  const fireMat = new THREE.MeshBasicMaterial({ color: PALETTE.fire });
  const emberMat = new THREE.MeshBasicMaterial({ color: PALETTE.ember });

  // ---- Ground: ash plain + cracked roads ----
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width * 2.2, WORLD.depth * 2.2),
    new THREE.MeshLambertMaterial({ color: PALETTE.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  // Roads: dark strips on a loose grid, broken by the war.
  const roadMat = new THREE.MeshLambertMaterial({ color: PALETTE.road });
  for (let x = -480; x <= 480; x += 120) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, WORLD.depth * 1.6), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.05, 0);
    scene.add(road);
  }
  for (let z = -600; z <= 720; z += 160) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width * 1.6, 14), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.05, z);
    scene.add(road);
  }

  // ---- Ruined skyscrapers ----
  const buildingMats = PALETTE.building.map(
    (c) => new THREE.MeshLambertMaterial({ color: c }),
  );
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  const fireSpots = [];
  const halfW = WORLD.width / 2;
  for (let gx = -halfW + 60; gx <= halfW - 60; gx += 110) {
    for (let gz = -640; gz <= 700; gz += 130) {
      // Keep the runway corridor and the city centre plaza clear.
      if (Math.abs(gx) < 42 && gz > 420) continue;
      if (Math.abs(gx) < 70 && Math.abs(gz) < 60) continue;
      // Never put a tall building on a ring approach.
      if (blocked(gx, gz)) continue;
      if (rng() < 0.18) continue; // gaps where blocks were flattened
      const w = range(rng, 22, 42);
      const d = range(rng, 22, 42);
      // The ring chains run down the middle of the city, so the central
      // avenue is low ruins (bombed flat) while the tall towers stand on
      // the flanks: a jet threading the rings at 55-120 m never meets a
      // rooftop it cannot see over.
      const h = Math.abs(gx) < 220 ? range(rng, 26, 45) : range(rng, 26, 150);
      const broken = rng() < 0.35;
      const mat = pick(rng, buildingMats);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(gx + range(rng, -8, 8), h / 2, gz + range(rng, -8, 8));
      if (rng() < 0.28) b.rotation.z = range(rng, -0.09, 0.09);
      if (rng() < 0.15) b.rotation.y = range(rng, -0.08, 0.08);
      scene.add(b);
      colliders.push({
        x: b.position.x, z: b.position.z,
        hw: w / 2, hd: d / 2, top: h,
      });
      if (broken) {
        // Jagged broken top: a smaller tilted cap + rubble at the base.
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.6, range(rng, 4, 9), d * 0.6),
          mat,
        );
        cap.position.set(b.position.x + range(rng, -4, 4), h + 2, b.position.z);
        cap.rotation.z = range(rng, -0.35, 0.35);
        scene.add(cap);
        const rubble = new THREE.Mesh(
          new THREE.ConeGeometry(range(rng, 8, 14), range(rng, 3, 6), 7),
          new THREE.MeshLambertMaterial({ color: 0x4a423c }),
        );
        rubble.position.set(
          b.position.x + range(rng, -14, 14), 1.5,
          b.position.z + range(rng, -14, 14),
        );
        scene.add(rubble);
        if (rng() < 0.6) {
          fireSpots.push(new THREE.Vector3(rubble.position.x, 4, rubble.position.z));
        }
      }
      // A few lit windows on the flank facing the flight path.
      if (rng() < 0.45) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 9), windowMat);
        win.position.set(
          b.position.x, range(rng, h * 0.3, h * 0.7),
          b.position.z + d / 2 + 0.1,
        );
        scene.add(win);
      }
    }
  }

  // ---- Rubble piles across the plain ----
  for (let i = 0; i < 26; i++) {
    const r = range(rng, 6, 13);
    const pile = new THREE.Mesh(
      new THREE.ConeGeometry(r, range(rng, 2.5, 5.5), 7),
      new THREE.MeshLambertMaterial({ color: 0x4a423c }),
    );
    pile.position.set(range(rng, -540, 540), 1.2, range(rng, -660, 720));
    if (Math.abs(pile.position.x) < 40 && pile.position.z > 420) continue;
    scene.add(pile);
    if (rng() < 0.4) fireSpots.push(new THREE.Vector3(pile.position.x, 3, pile.position.z));
  }

  // ---- Fires: glowing cones on the fire spots ----
  for (const p of fireSpots) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5.5, 6), fireMat);
    flame.position.copy(p);
    scene.add(flame);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.2, 6), emberMat);
    inner.position.set(p.x, p.y + 0.5, p.z);
    scene.add(inner);
  }
  // Four real point lights on the biggest fires (perf budget).
  for (let i = 0; i < Math.min(4, fireSpots.length); i++) {
    const p = fireSpots[i * 3];
    const light = new THREE.PointLight(0xff6a1e, 900, 120, 1.8);
    light.position.set(p.x, p.y + 6, p.z);
    scene.add(light);
  }

  // ---- Smoke plumes: instanced dark spheres rising from the fires ----
  const smokeCount = 80;
  const smokeGeo = new THREE.SphereGeometry(2.2, 6, 5);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: PALETTE.smoke, transparent: true, opacity: 0.55,
  });
  const smoke = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeCount);
  const smokeState = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < smokeCount; i++) {
    const base = fireSpots.length
      ? fireSpots[i % fireSpots.length]
      : new THREE.Vector3(0, 4, 0);
    smokeState.push({
      x: base.x + range(rng, -3, 3),
      y: base.y + rng() * 40,
      z: base.z + range(rng, -3, 3),
      rise: range(rng, 1.2, 3.2),
      drift: range(rng, -1.5, 1.5),
      scale: range(rng, 0.8, 2.2),
      baseY: base.y,
    });
  }
  scene.add(smoke);

  // ---- Embers: glowing points drifting up from the fires ----
  const emberCount = 260;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberState = [];
  for (let i = 0; i < emberCount; i++) {
    const base = fireSpots.length
      ? fireSpots[i % fireSpots.length]
      : new THREE.Vector3(0, 4, 0);
    emberState.push({
      x: base.x + range(rng, -4, 4),
      y: base.y + rng() * 12,
      z: base.z + range(rng, -4, 4),
      rise: range(rng, 2, 6),
    });
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    color: PALETTE.ember, size: 1.6, sizeAttenuation: true,
    transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(embers);

  // ---- Wrecked mechs: three landmarks ----
  const mechPositions = [
    { x: -150, z: 150, pose: 'lean' },
    { x: 190, z: -120, pose: 'fallen' },
    { x: 70, z: 420, pose: 'kneel' },
  ];
  for (const m of mechPositions) {
    const mech = buildMech(metal, rust, glowMat);
    mech.position.set(m.x, 0, m.z);
    if (m.pose === 'lean') {
      mech.rotation.z = 0.32;
      mech.rotation.y = 0.7;
    } else if (m.pose === 'fallen') {
      mech.rotation.x = Math.PI / 2 - 0.12;
      mech.position.y = 2.5;
      mech.rotation.y = -0.5;
    } else {
      mech.position.y = -2.5;
      mech.rotation.x = 0.25;
      mech.rotation.y = 2.4;
    }
    scene.add(mech);
    colliders.push({
      x: m.x, z: m.z, hw: 7, hd: 7,
      top: m.pose === 'fallen' ? 5 : 15,
    });
  }

  // ---- Scattered robot wreckage + debris (instanced) ----
  const debrisGeo = new THREE.BoxGeometry(1, 1, 1);
  const debrisMat = new THREE.MeshLambertMaterial({ color: 0x55504a });
  const debris = new THREE.InstancedMesh(debrisGeo, debrisMat, 380);
  for (let i = 0; i < 380; i++) {
    dummy.position.set(range(rng, -560, 560), 0.6, range(rng, -680, 730));
    dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    dummy.scale.set(range(rng, 0.6, 3.4), range(rng, 0.4, 1.6), range(rng, 0.6, 3.4));
    dummy.updateMatrix();
    debris.setMatrixAt(i, dummy.matrix);
  }
  debris.instanceMatrix.needsUpdate = true;
  scene.add(debris);
  // A few recognisable wreck parts: severed robot arms and wheels.
  for (let i = 0; i < 14; i++) {
    const part = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, range(rng, 4, 7), 8),
      i % 2 ? rust : metal,
    );
    part.rotation.set(Math.PI / 2, 0, rng() * Math.PI);
    part.position.set(range(rng, -520, 520), 1.1, range(rng, -640, 700));
    scene.add(part);
  }

  // ---- Runway: dark strip, centre dashes, edge lights, windsock ----
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(RUNWAY.halfWidth * 2, RUNWAY.zEnd - RUNWAY.zStart),
    new THREE.MeshLambertMaterial({ color: 0x24262a }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(RUNWAY.x, 0.08, (RUNWAY.zStart + RUNWAY.zEnd) / 2);
  scene.add(strip);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d8 });
  for (let z = RUNWAY.zStart + 12; z < RUNWAY.zEnd - 8; z += 26) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 12), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(RUNWAY.x, 0.12, z);
    scene.add(dash);
  }
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x37d67a });
  for (let z = RUNWAY.zStart; z <= RUNWAY.zEnd; z += 32) {
    for (const side of [-1, 1]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), edgeMat);
      lamp.position.set(RUNWAY.x + side * (RUNWAY.halfWidth + 2), 0.7, z);
      scene.add(lamp);
    }
  }
  // Threshold bars at the approach end.
  for (const side of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(6, 2), dashMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(side * 8, 0.12, RUNWAY.zStart + 6);
    scene.add(bar);
  }
  // Windsock on a pole beside the strip.
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 12, 6),
    new THREE.MeshLambertMaterial({ color: 0x888888 }),
  );
  pole.position.set(RUNWAY.halfWidth + 10, 6, RUNWAY.zStart + 30);
  scene.add(pole);
  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 4.5, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6a1e }),
  );
  sock.rotation.z = Math.PI / 2 + 0.25;
  sock.position.set(RUNWAY.halfWidth + 12.5, 11.4, RUNWAY.zStart + 30);
  scene.add(sock);

  // ---- Low sun disc on the horizon ----
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(55, 24),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }),
  );
  sun.position.set(-620, 85, -900);
  sun.lookAt(0, 60, 0);
  scene.add(sun);
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(110, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff9a4d, transparent: true, opacity: 0.22,
      fog: false, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  sunGlow.position.set(-620, 85, -905);
  sunGlow.lookAt(0, 60, 0);
  scene.add(sunGlow);

  /** Per-frame animation: smoke rises, embers drift up. */
  function update(dt) {
    for (let i = 0; i < smokeCount; i++) {
      const s = smokeState[i];
      s.y += s.rise * dt;
      s.x += s.drift * dt;
      if (s.y > s.baseY + 55) {
        s.y = s.baseY + rng() * 4;
        s.x += range(rng, -4, 4);
      }
      const grow = 1 + (s.y - s.baseY) / 40;
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.scale * grow);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      smoke.setMatrixAt(i, dummy.matrix);
    }
    smoke.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < emberCount; i++) {
      const e = emberState[i];
      e.y += e.rise * dt;
      e.x += Math.sin(e.y * 0.8 + i) * dt * 1.5;
      if (e.y > 26) e.y = 3;
      emberPos[i * 3] = e.x;
      emberPos[i * 3 + 1] = e.y;
      emberPos[i * 3 + 2] = e.z;
    }
    emberGeo.attributes.position.needsUpdate = true;
  }

  return { update, colliders, mechPositions, fireSpots };
}
