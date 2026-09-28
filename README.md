# HAVOC

**Browser kart combat with server-authoritative multiplayer.** Drift, boost, grab a weapon off the track and shoot the other five racers before the three-minute round ends.

Built with Three.js and a single Node process that also owns the match.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

---

## Features

- **Three arenas** — Sunset Canyon (dry, high grip), Frostbite Ridge (snowfall, low grip), Neon Docks (midnight, wet asphalt). Each has its own surface grip, obstacles, ramps and boundary.
- **Nine weapons** — Rockets, Autocannon, Proximity Mines, Energy Shield, Seeker Missiles, Scattergun, Bouncing Bombs, Railgun and EMP Pulse. Twelve pickups spawn per arena, so you are never left empty-handed for long.
- **Drifting and boosting** — hold a drift to charge, release to launch. Every track has four boost pads, two ramps, six breakable barrels and a pair of repair pads.
- **Real multiplayer** — the server simulates the match. Clients send input, not positions, so nobody can teleport or cheat their way to first.
- **Bots** — a room is padded to six racers with bots, so a quick match never starts empty-handed.
- **Three-minute rounds** — countdown, respawns, and a results screen when time runs out.
- **Drivable from a browser or a controller** — rebindable keyboard, gamepad, or on-screen touch controls.

## Controls

| Action             | Keyboard                       | Gamepad (standard mapping)        |
| ------------------ | ------------------------------ | --------------------------------- |
| Accelerate / brake | `W` / `S`, or arrow up / down  | Right trigger / left trigger      |
| Steer              | `A` `D`, or arrow left / right | Left stick, or D-pad left / right |
| Fire               | `Space`                        | `A` / cross, or `B` / circle      |
| Drift              | `Shift`                        | `X` / square                      |
| Boost              | `E`                            | `RB` / `R1`                       |
| Match menu         | `Escape`                       | Menu                              |

Bindings are editable in Settings and persisted locally. A binding set that repeats a key is rejected and falls back to the defaults, so two actions can never end up on one key. Touch devices get their own on-screen controls.

## Multiplayer

Create a room and share its six-character code or the invite link. Anyone on your network can join via your computer's LAN address on port 3000.

Rooms are **ephemeral**: a room is deleted the moment its last human leaves, and a server restart clears all of them. A room holds up to eight human racers, and the server itself caps concurrent connections at 128.

Playing over the internet means putting this Node process behind a public address with HTTPS and WebSocket support. The app is not publicly deployed, and it needs no third-party account or API key to run.

## Architecture

The one idea worth knowing: **`shared/game.js` is the whole simulation**, and the browser and the server both import that same file. There is no second copy of the physics to keep in sync.

```
src/          browser only — rendering, input, menus, HUD
shared/       shared by both — the authoritative simulation
server.mjs    browser only — rooms, sockets, serving
```

- `shared/game.js` is dependency-free and deterministic: pure functions, plain data, a fixed `1/60` timestep. It runs unchanged under `node --test` and in the browser. If the two sides ever disagreed, the tests would fail rather than the match.
- `server.mjs` advances the world on a fixed timestep and broadcasts snapshots. Clients only ever send `input`, `ping` and room-join messages — never their own position.
- `src/` renders what it is told and predicts locally in between snapshots to keep steering responsive.
- Rendering degrades honestly: Performance mode drops shadows and bloom.

## Scripts

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Dev server on `PORT`, default 3000            |
| `npm run build` | Production bundle into `dist/` via Vite       |
| `npm start`     | Serve `dist/` and WebSockets from one process |
| `npm test`      | `node --test` over the shared simulation      |

Requires **Node 22.12+**. Set `PORT` to change the listening port.

## Layout

```
index.html          markup, modals, HUD
server.mjs          rooms, sockets, static serving
shared/game.js      the simulation, shared by client and server
src/main.js         client bootstrap, menus, HUD, netcode
src/scene.js        Three.js arenas and the kart model
src/audio.js        procedural Web Audio
src/effects.js      particles and screen shake
src/controls.js     bindings, gamepad, deadzone
src/style.css       all styling
public/assets/      fonts, textures, sky HDR, arena art
design/             visual notes and concept art
tests/              simulation regression tests
```

## Credits and scope

Three.js, `ws` and Vite do the heavy lifting. Asset credits:

- Ground, rock and sky HDR textures from [Poly Haven](https://polyhaven.com) — CC0.
- Barlow and Barlow Condensed from Google Fonts — SIL Open Font License.
- Arena picker panoramas and the lobby concept were generated with an image-generation tool. Prompts are recorded in [`design/NOTES.md`](design/NOTES.md).

This is an original, compact Smash Karts-inspired implementation. It is not a copy of that game's code or assets. The renderer draws actual 3D geometry with physically based materials, a sky, shadow maps, bloom and particles — the geometry is visibly simpler than photorealistic concept art, and AAA fidelity is not claimed. Real-time WebGL performance depends on the device.
