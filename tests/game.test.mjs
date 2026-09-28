import test from "node:test";
import assert from "node:assert/strict";
import {
  makeWorld,
  makePlayer,
  movePlayer,
  stepWorld,
  fire,
  cleanInput,
  neutralInput,
  segmentSphere,
  MAPS,
  WEAPONS,
  FIXED_DT,
  BOOST_PADS,
} from "../shared/game.js";
import {
  gamepadInput,
  validBindings,
  DEFAULT_BINDINGS,
} from "../src/controls.js";
const drive = (p, input, seconds, map = "canyon") => {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++)
    movePlayer(p, input, FIXED_DT, map);
};
const run = (world, seconds) => {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++)
    stepWorld(world, FIXED_DT);
};
function arena(type = "rocket") {
  const w = makeWorld();
  w.countdown = 0;
  w.pickups = [];
  w.repairs = [];
  w.barrels = [];
  const p = makePlayer("p", "Racer", 0),
    q = makePlayer("q", "Target", 1);
  Object.assign(p, {
    x: 0,
    z: 35,
    angle: 0,
    shield: 0,
    weapon: type,
    ammo: WEAPONS[type].ammo,
  });
  Object.assign(q, { x: 0, z: 46, shield: 0 });
  w.players = [p, q];
  return { w, p, q };
}
test("safe controls, controller deadzone and unique key bindings", () => {
  assert.deepEqual(cleanInput({ throttle: Infinity, steer: 9, fire: "yes" }), {
    ...neutralInput(),
    steer: 1,
  });
  assert.deepEqual(cleanInput(null), neutralInput());
  assert.deepEqual(gamepadInput(null), neutralInput());
  const pad = {
    mapping: "standard",
    connected: true,
    axes: [0.1],
    buttons: Array.from({ length: 16 }, () => ({ value: 0 })),
  };
  assert.equal(gamepadInput(pad).steer, 0);
  pad.axes[0] = -0.8;
  pad.buttons[7].value = 1;
  pad.buttons[0].value = 1;
  assert(gamepadInput(pad).steer < 0);
  assert.equal(gamepadInput(pad).throttle, 1);
  assert.equal(gamepadInput(pad).fire, true);
  pad.connected = false;
  assert.deepEqual(gamepadInput(pad), neutralInput());
  assert.deepEqual(
    validBindings({ ...DEFAULT_BINDINGS, fire: "KeyW" }),
    DEFAULT_BINDINGS,
  );
  assert.equal(
    validBindings({ ...DEFAULT_BINDINGS, fire: "KeyF" }).fire,
    "KeyF",
  );
});
test("stable contact, braking, reverse limit, frame independence and drift release", () => {
  for (const map of Object.keys(MAPS)) {
    const p = makePlayer("p", "p", 0);
    drive(p, neutralInput(), 2, map);
    assert.equal(p.y, 0);
    assert.equal(p.vy, 0);
    assert.equal(p.speed, 0);
  }
  const p = makePlayer("p", "p", 0);
  Object.assign(p, { x: -45, z: -15, angle: 0 });
  drive(p, { throttle: 1 }, 1);
  assert(p.speed > 18);
  drive(p, { throttle: -1 }, 0.3);
  assert(p.forwardSpeed > 0 && p.speed < 12);
  drive(p, { throttle: -1 }, 1.5);
  assert(p.forwardSpeed < 0);
  assert(p.speed < 12.6);
  const a = makePlayer("a", "a", 0),
    b = { ...a };
  for (let i = 0; i < 20; i++)
    movePlayer(a, { throttle: 1, steer: 0.4 }, 1 / 30);
  for (let i = 0; i < 40; i++)
    movePlayer(b, { throttle: 1, steer: 0.4 }, 1 / 60);
  assert(Math.hypot(a.x - b.x, a.z - b.z) < 1e-8);
  const d = makePlayer("d", "d", 0);
  Object.assign(d, { x: 0, z: -52, angle: 0 });
  drive(d, { throttle: 1 }, 1);
  drive(d, { throttle: 1, steer: 0.6, drift: true }, 1.5);
  assert(d.driftCharge > 0.7);
  movePlayer(d, { throttle: 1 }, FIXED_DT);
  assert(d.miniBoost > 0);
  assert.equal(d.driftCharge, 0);
});
test("ramp launch, solid ramp back, arena boundary and boost pad", () => {
  const p = makePlayer("p", "p", 0);
  Object.assign(p, { x: -12, z: 15, angle: 0, vz: 20, speed: 20 });
  let peak = 0,
    air = false;
  for (let i = 0; i < 170; i++) {
    movePlayer(p, { throttle: 1 }, FIXED_DT);
    peak = Math.max(peak, p.y);
    air ||= !p.grounded;
  }
  assert(air && peak > 3.6);
  assert.equal(p.y, 0);
  assert(Math.hypot(p.x, p.z) < MAPS.canyon.radius);
  Object.assign(p, makePlayer("p", "p", 0), {
    x: -12,
    z: 31,
    angle: Math.PI,
    vz: -10,
    speed: 10,
  });
  drive(p, { throttle: 1 }, 0.5);
  assert.equal(p.y, 0);
  assert(p.z >= 30);
  const [x, z] = BOOST_PADS[0];
  Object.assign(p, makePlayer("p", "p", 0), { x, z });
  movePlayer(p, neutralInput(), FIXED_DT);
  assert(p.miniBoost > 1);
});
test("swept hits, instant rail shot, walls, shields and EMP ownership", () => {
  assert.equal(
    segmentSphere(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 20 },
      { x: 0, y: 0, z: 10 },
      1,
    ),
    0.45,
  );
  const { w, p, q } = arena("railgun");
  q.z = 60;
  fire(w, p);
  stepWorld(w, FIXED_DT);
  assert.equal(q.hp, 15);
  assert.equal(w.projectiles.length, 0);
  assert(w.events.some((e) => e.type === "tracer"));
  const covered = arena("railgun");
  Object.assign(covered.p, { x: 0, z: -10 });
  Object.assign(covered.q, { x: 0, z: 10 });
  fire(covered.w, covered.p);
  run(covered.w, 0.1);
  assert.equal(covered.q.hp, 100);
  const shield = arena();
  shield.q.shield = 5;
  fire(shield.w, shield.p);
  run(shield.w, 0.5);
  assert.equal(shield.q.hp, 100);
  const emp = arena("emp");
  emp.q.shield = 5;
  fire(emp.w, emp.p);
  assert.equal(emp.p.hp, 100);
  assert.equal(emp.p.disabled, 0);
  assert.equal(emp.q.shield, 0);
  assert(emp.q.disabled > 2);
  assert(emp.q.hp < 100);
});
test("projectile weapons, ammo, bomb fuse, mines and seeker lock", () => {
  for (const type of ["rocket", "blaster", "shotgun", "homing"]) {
    const { w, p, q } = arena(type);
    fire(w, p);
    assert.equal(p.ammo, WEAPONS[type].ammo - 1);
    if (type === "homing") assert.equal(w.projectiles[0].target, q.id);
    run(w, 0.8);
    assert(q.hp < 100, type);
  }
  const mine = arena("mine");
  mine.q.z = 32;
  fire(mine.w, mine.p);
  run(mine.w, 0.4);
  assert.equal(mine.q.hp, 100);
  run(mine.w, 0.5);
  assert(mine.q.hp < 100);
  const bomb = arena("grenade");
  fire(bomb.w, bomb.p);
  let exploded = false,
    bounced = false,
    previousVy = 9;
  for (let i = 0; i < 150; i++) {
    stepWorld(bomb.w, FIXED_DT);
    const s = bomb.w.projectiles[0];
    if (s) {
      bounced ||= s.vy > 0 && previousVy < 0;
      previousVy = s.vy;
    }
    exploded ||= bomb.w.events.some(
      (e) => e.type === "explosion" && e.weapon === "grenade",
    );
  }
  assert(bounced);
  assert(exploded);
  assert.equal(bomb.w.projectiles.length, 0);
});
test("barrels, repairs, respawn reset, countdown and round restart", () => {
  const { w, p, q } = arena("railgun");
  w.barrels = [{ id: 0, x: 0, z: 43, hp: 35, cooldown: 0 }];
  fire(w, p);
  stepWorld(w, FIXED_DT);
  assert.equal(w.barrels[0].hp, 0);
  assert(w.barrels[0].cooldown > 0);
  assert(q.hp < 100);
  w.repairs = [{ id: 0, x: p.x, z: p.z, cooldown: 0 }];
  p.hp = 20;
  stepWorld(w, FIXED_DT);
  assert.equal(p.hp, 60);
  assert(w.repairs[0].cooldown > 0);
  p.dead = 0.01;
  p.driftCharge = 2;
  p.disabled = 2;
  stepWorld(w, FIXED_DT);
  assert.equal(p.dead, 0);
  assert.equal(p.hp, 100);
  assert.equal(p.driftCharge, 0);
  assert.equal(p.disabled, 0);
  w.countdown = 1;
  p.input = { throttle: 1, steer: 0 };
  const x = p.x,
    z = p.z,
    time = w.time;
  run(w, 0.5);
  assert.equal(p.x, x);
  assert.equal(p.z, z);
  assert.equal(w.time, time);
  w.countdown = 0;
  w.time = 0.01;
  stepWorld(w, FIXED_DT);
  assert(w.intermission > 0);
  stepWorld(w, 11);
  assert.equal(w.round, 2);
  assert.equal(w.countdown, 3);
  assert.equal(w.barrels[0].hp, 35);
  assert.equal(w.repairs[0].cooldown, 0);
});
