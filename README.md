# best-flight-game-20261126-0057-v2

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/subastian1998/best-flight-game-20261126-0057-v2/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/subastian1998/best-flight-game-20261126-0057-v2/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Steel Falcon 3D** — a low-poly 3D flight game built with Three.js. Fly a Rafale-class delta fighter over a war-torn robot city: ruined skyscrapers, collapsed blocks, fires, smoke and embers, wrecked combat mechs. Thread the gold rings, watch fuel and hull, and bring her home to the lit runway strip.

Two cameras, switchable live: a chase camera behind the jet, and a cockpit camera from the pilot's seat — panel, gauges and canopy frame in view. Three missions with different ring chains, wind and fuel pressure; throttle and turn discipline rewarded; flaps and airbrake for the final approach; and synthesised WebAudio engine, wind, chimes and thuds — no audio files. It runs entirely offline from its own static files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests, no external files.

## How to play

- Pick a mission on the title screen (click, or press **1**–**3**).
- Fly through every glowing ring in order — each one scores points and tops up a little fuel.
- Land on the runway after the last ring: a gentle touchdown scores a bonus, a hard one damages the hull.
- **↑/↓** pitch · **←/→** bank and turn · **W/S** throttle · **Space** airbrake · **F** flaps · **C** chase / cockpit camera · **P** pause · **R** restart · **M** sound.
- Keep some speed: below stall speed the wing stops lifting and the jet sinks. Over the ash plain there is nowhere to land but the strip.
