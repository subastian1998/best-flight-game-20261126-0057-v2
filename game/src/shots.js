// Steel Falcon 3D — screenshot staging: ?shot=chase|cockpit|city|landing
// (with &seed=N) poses a fixed scene instead of running the loop, paints
// it twice and sets window.__shotReady for the screenshot tool.

import { RUNWAY } from './config.js';

/**
 * Pose a scene for a screenshot.
 * @param {string} name 'chase' | 'cockpit' | 'city' | 'landing'.
 * @param {object} game the live game object from main.js.
 * @returns {boolean} whether the shot name was known.
 */
export function stageShot(name, game) {
  game.shotCamera = false;
  // Every branch poses the plane, then applies the transform BEFORE the
  // camera is placed: snap/update read the jet's quaternion, so a stale
  // transform would park the camera at the previous pose.
  const poseDone = () => {
    game._applyPlaneTransform();
    game.hud.clearMessage();
  };
  if (name === 'chase') {
    // Chase view: jet threading the first ring over the ruined city,
    // a wrecked mech and burning towers in the background.
    game.startMission(0, { keepScreen: true });
    const ring0 = game.mission.rings[0];
    game.plane.pos.set(ring0.x - 6, ring0.y + 4, ring0.z + 52);
    game.plane.speed = 138;
    game.plane.throttle = 0.74;
    game.plane.yaw = 0.04;
    game.plane.pitch = 0.02;
    game.plane.roll = 0.08;
    game.plane.fuel = 82;
    game.score = 350;
    game.chase.setMode('CHASE');
    poseDone();
    game.chase.snap();
    game.hud.hideScreens();
    return true;
  }
  if (name === 'cockpit') {
    // Cockpit view: same approach, from the pilot's seat — panel and
    // canopy frame in frame, ring dead ahead.
    game.startMission(0, { keepScreen: true });
    const ring0 = game.mission.rings[0];
    game.plane.pos.set(ring0.x - 2, ring0.y + 1, ring0.z + 46);
    game.plane.speed = 138;
    game.plane.throttle = 0.74;
    game.plane.yaw = 0.01;
    game.plane.pitch = 0.01;
    game.plane.roll = 0;
    game.plane.fuel = 82;
    game.score = 350;
    game.chase.setMode('COCKPIT');
    poseDone();
    game.chase.update(0.016);
    game.hud.hideScreens();
    return true;
  }
  if (name === 'city') {
    // Wide skyline shot: the jet low over the ruined city with the
    // leaning wrecked mech in the foreground and fires behind it.
    game.startMission(0, { keepScreen: true });
    game.plane.pos.set(-108, 42, 205);
    game.plane.speed = 122;
    game.plane.throttle = 0.66;
    game.plane.yaw = Math.PI - 0.55;
    game.plane.pitch = 0;
    game.plane.roll = -0.12;
    game.plane.fuel = 68;
    game.score = 620;
    game.nextRing = 3;
    game.rings.next = 3;
    game.rings.passed = 3;
    poseDone();
    // Fixed camera: low, looking across the mech toward the jet.
    game.shotCamera = true;
    game.camera.position.set(-168, 30, 246);
    game.camera.up.set(0, 1, 0);
    game.camera.lookAt(-70, 46, 130);
    game.hud.hideScreens();
    return true;
  }
  if (name === 'landing') {
    // Final approach: gear-down attitude, flaps out, runway lights
    // ahead, all rings flown, HUD lit.
    game.startMission(2, { keepScreen: true });
    game.plane.pos.set(0, 26, 400);
    game.plane.speed = 98;
    game.plane.throttle = 0.34;
    game.plane.yaw = Math.PI;
    game.plane.pitch = -0.05;
    game.plane.roll = 0;
    game.plane.flaps = true;
    game.plane.fuel = 38;
    game.score = 1240;
    game.nextRing = game.mission.rings.length;
    game.rings.next = game.mission.rings.length;
    game.rings.passed = game.mission.rings.length;
    game.chase.setMode('CHASE');
    poseDone();
    game.chase.snap();
    game.hud.hideScreens();
    return true;
  }
  return false;
}
