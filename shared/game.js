export const MAPS = {
  canyon: {
    name: "Sunset Canyon",
    subtitle: "GOLDEN HOUR · DRY TERRAIN",
    color: "#c4f564",
    radius: 68,
    obstacles: [
      [-23, -16, 6, 9],
      [24, 19, 8, 6],
      [-29, 27, 5, 7],
      [29, -28, 7, 5],
      [0, 0, 8, 8],
    ],
    ramps: [
      [-12, 24, 6, 12],
      [15, -24, 6, 12],
    ],
    grip: 7,
  },
  alpine: {
    name: "Frostbite Ridge",
    subtitle: "SNOWFALL · LOW GRIP",
    color: "#b8e8ff",
    radius: 68,
    obstacles: [
      [-22, -24, 8, 6],
      [25, 22, 7, 8],
      [-24, 22, 6, 7],
      [29, -23, 7, 7],
      [0, 0, 6, 12],
    ],
    ramps: [
      [0, 32, 8, 12],
      [0, -32, 8, 12],
    ],
    grip: 4.2,
  },
  harbor: {
    name: "Neon Docks",
    subtitle: "MIDNIGHT · WET ASPHALT",
    color: "#f382cf",
    radius: 68,
    obstacles: [
      [-24, -22, 5, 13],
      [24, 22, 5, 13],
      [-26, 24, 12, 5],
      [27, -26, 12, 5],
      [0, 0, 10, 5],
    ],
    ramps: [
      [-12, 0, 6, 12],
      [14, 0, 6, 12],
    ],
    grip: 5.7,
  },
};
export const COLORS = [
  "#c4f564",
  "#ff784e",
  "#78baff",
  "#df85ef",
  "#f6ce67",
  "#e3e6eb",
];
export const WEAPONS = {
  rocket: {
    name: "ROCKETS",
    ammo: 3,
    damage: 62,
    speed: 64,
    delay: 0.48,
    radius: 5.8,
    color: "#ffad54",
    description: "Three explosive rockets. Lead moving targets.",
  },
  blaster: {
    name: "AUTOCANNON",
    ammo: 24,
    damage: 12,
    speed: 110,
    delay: 0.095,
    color: "#ffe3a0",
    description: "Rapid fire. Hold fire to unleash the belt.",
  },
  mine: {
    name: "PROXIMITY MINES",
    ammo: 3,
    damage: 85,
    speed: 0,
    delay: 0.55,
    radius: 6,
    color: "#ff675e",
    description: "Drop behind you. Arms after a short delay.",
  },
  shield: {
    name: "ENERGY SHIELD",
    ammo: 1,
    delay: 0.3,
    color: "#83dfff",
    description: "Absorb incoming hits for six seconds.",
  },
  homing: {
    name: "SEEKER MISSILES",
    ammo: 2,
    damage: 55,
    speed: 39,
    delay: 0.75,
    radius: 5.5,
    color: "#f99afd",
    description: "Locks onto a racer ahead and follows them.",
  },
  shotgun: {
    name: "SCATTERGUN",
    ammo: 4,
    damage: 13,
    speed: 95,
    delay: 0.65,
    color: "#ffcb72",
    description: "Seven pellets. Devastating at close range.",
  },
  grenade: {
    name: "BOUNCING BOMBS",
    ammo: 3,
    damage: 80,
    speed: 25,
    delay: 0.7,
    radius: 8,
    color: "#a4ed83",
    description: "Lob a bouncing explosive. A 2.2 second fuse.",
  },
  railgun: {
    name: "RAILGUN",
    ammo: 3,
    damage: 85,
    speed: 450,
    delay: 0.9,
    color: "#66e6ff",
    description: "An instant precision shot. Line them up.",
  },
  emp: {
    name: "EMP PULSE",
    ammo: 2,
    damage: 22,
    delay: 1,
    radius: 17,
    color: "#bca3ff",
    description: "Disables nearby shields and boost for 2.5 seconds.",
  },
};
export const ROUND_SECONDS = 180;
export const FIXED_DT = 1 / 60;
export const PHYSICS = {
  topSpeed: 32,
  reverseSpeed: 12,
  boostSpeed: 44,
  acceleration: 27,
  braking: 48,
  wheelbase: 2.25,
  gravity: 23,
  radius: 1.25,
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const neutralInput = () => ({
  throttle: 0,
  steer: 0,
  drift: false,
  boost: false,
  fire: false,
});
export function cleanInput(input = {}) {
  if (!input || typeof input !== "object") return neutralInput();
  return {
    throttle: Number.isFinite(input.throttle)
      ? clamp(input.throttle, -1, 1)
      : 0,
    steer: Number.isFinite(input.steer) ? clamp(input.steer, -1, 1) : 0,
    drift: input.drift === true,
    boost: input.boost === true,
    fire: input.fire === true,
  };
}
export function spawnPoint(index) {
  const a = (index * Math.PI) / 4 + 0.35;
  return { x: Math.sin(a) * 56, z: Math.cos(a) * 56, angle: a + Math.PI };
}
export function makePlayer(
  id,
  name,
  index,
  color = COLORS[index % COLORS.length],
  bot = false,
) {
  return {
    id,
    name,
    color,
    bot,
    ...spawnPoint(index),
    y: 0,
    vy: 0,
    vx: 0,
    vz: 0,
    speed: 0,
    forwardSpeed: 0,
    steerAngle: 0,
    yawRate: 0,
    slip: 0,
    pitch: 0,
    roll: 0,
    grounded: true,
    landing: 0,
    impact: 0,
    impactCooldown: 0,
    driftCharge: 0,
    drifting: false,
    miniBoost: 0,
    boosting: false,
    padCooldown: 0,
    disabled: 0,
    hp: 100,
    kills: 0,
    deaths: 0,
    boost: 100,
    weapon: null,
    ammo: 0,
    cooldown: 0,
    shield: 2,
    dead: 0,
    input: neutralInput(),
  };
}
export const BOOST_PADS = [
  [-43, 0, Math.PI / 2],
  [43, 0, -Math.PI / 2],
  [0, 55, Math.PI],
  [0, -55, 0],
];
export const BARREL_POSITIONS = [
  [-13, -17],
  [16, 15],
  [-39, 28],
  [37, -12],
  [-8, -43],
  [9, 43],
];
export const REPAIR_POSITIONS = [
  [-52, -15],
  [52, 15],
];
export function makeWorld(map = "canyon") {
  return {
    map,
    time: ROUND_SECONDS,
    countdown: 3,
    intermission: 0,
    round: 1,
    tick: 0,
    players: [],
    projectiles: [],
    events: [],
    nextId: 1,
    pickups: Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6,
        r = i % 2 ? 47 : 26;
      return { id: i, x: Math.sin(a) * r, z: Math.cos(a) * r, cooldown: 0 };
    }),
    barrels: BARREL_POSITIONS.map(([x, z], id) => ({
      id,
      x,
      z,
      hp: 35,
      cooldown: 0,
    })),
    repairs: REPAIR_POSITIONS.map(([x, z], id) => ({ id, x, z, cooldown: 0 })),
  };
}
export function surfaceHeight(x, z, map) {
  for (const [rx, rz, w, d] of MAPS[map].ramps)
    if (Math.abs(x - rx) <= w / 2 && Math.abs(z - rz) <= d / 2)
      return ((z - rz + d / 2) / d) * 3.5;
  return 0;
}
export function surfaceGrip(x, z, map) {
  const road = Math.hypot(x, z) > 20 && Math.hypot(x, z) < 54;
  return MAPS[map].grip * (road ? 1.6 : 1.05);
}
function collideBox(p, x, z, w, d, height = 5) {
  if (p.y > height) return;
  const cx = clamp(p.x, x - w / 2, x + w / 2),
    cz = clamp(p.z, z - d / 2, z + d / 2);
  let dx = p.x - cx,
    dz = p.z - cz,
    dist = Math.hypot(dx, dz),
    depth = PHYSICS.radius - dist;
  if (depth <= 0) return;
  if (dist < 0.00001) {
    const px = w / 2 - Math.abs(p.x - x),
      pz = d / 2 - Math.abs(p.z - z);
    if (px < pz) {
      dx = Math.sign(p.x - x) || 1;
      dz = 0;
      depth = px + PHYSICS.radius;
    } else {
      dz = Math.sign(p.z - z) || 1;
      dx = 0;
      depth = pz + PHYSICS.radius;
    }
    dist = 1;
  }
  const nx = dx / dist,
    nz = dz / dist;
  p.x += nx * depth;
  p.z += nz * depth;
  const v = p.vx * nx + p.vz * nz;
  if (v < 0) {
    p.impact = Math.max(p.impact, -v);
    p.vx -= nx * v * 1.22;
    p.vz -= nz * v * 1.22;
  }
}
export function movePlayer(p, rawInput, dt, map = "canyon") {
  if (p.dead > 0 || !Number.isFinite(dt) || dt <= 0) return;
  const input = cleanInput(rawInput),
    count = Math.max(1, Math.ceil(Math.min(dt, 0.1) / FIXED_DT)),
    h = Math.min(dt, 0.1) / count;
  for (let sub = 0; sub < count; sub++) {
    const fx = Math.sin(p.angle),
      fz = Math.cos(p.angle),
      oldSpeed = p.vx * fx + p.vz * fz;
    p.disabled = Math.max(0, (p.disabled || 0) - h);
    p.miniBoost = Math.max(0, (p.miniBoost || 0) - h);
    p.padCooldown = Math.max(0, (p.padCooldown || 0) - h);
    p.landing = Math.max(0, (p.landing || 0) - h * 3);
    p.impact = Math.max(0, (p.impact || 0) - h * 45);
    const previousFloor = surfaceHeight(p.x, p.z, map),
      wasGrounded = p.grounded !== false;
    const drift =
      input.drift &&
      Math.abs(oldSpeed) > 8 &&
      Math.abs(input.steer) > 0.15 &&
      wasGrounded;
    if (p.drifting && !drift) {
      if (p.driftCharge > 0.65)
        p.miniBoost = Math.max(p.miniBoost, p.driftCharge > 1.7 ? 1.35 : 0.75);
      p.driftCharge = 0;
    }
    p.drifting = drift;
    p.driftCharge = drift ? Math.min(2.4, (p.driftCharge || 0) + h) : 0;
    const manual =
      input.boost && p.boost > 1 && input.throttle > 0 && !p.disabled;
    p.boosting = (manual || p.miniBoost > 0) && !p.disabled;
    p.boost = clamp(p.boost + (manual ? -29 : 12) * h, 0, 100);
    const steerTarget =
      (-input.steer * (drift ? 0.64 : 0.52)) / (1 + Math.abs(oldSpeed) / 39);
    p.steerAngle +=
      (steerTarget - (p.steerAngle || 0)) * (1 - Math.exp(-h * 11));
    const yawTarget =
      clamp(
        (oldSpeed / PHYSICS.wheelbase) * Math.tan(p.steerAngle),
        -2.6,
        2.6,
      ) *
      (drift ? 1.2 : 1) *
      (wasGrounded ? 1 : 0.16);
    p.yawRate += (yawTarget - (p.yawRate || 0)) * (1 - Math.exp(-h * 10));
    p.angle += p.yawRate * h;
    const braking = input.throttle * oldSpeed < -0.5;
    let acceleration =
      input.throttle *
      (braking ? PHYSICS.braking : PHYSICS.acceleration) *
      (p.disabled ? 0.45 : 1);
    if (p.boosting) acceleration += oldSpeed >= 0 ? 24 : 0;
    if (!wasGrounded) acceleration *= 0.15;
    p.vx += fx * acceleration * h;
    p.vz += fz * acceleration * h;
    const forward = p.vx * Math.sin(p.angle) + p.vz * Math.cos(p.angle),
      lateral = p.vx * Math.cos(p.angle) - p.vz * Math.sin(p.angle);
    const grip = wasGrounded
      ? drift
        ? 2.1
        : surfaceGrip(p.x, p.z, map)
      : 0.07;
    const lateralDrop = lateral * (1 - Math.exp(-grip * h));
    p.vx -= Math.cos(p.angle) * lateralDrop;
    p.vz += Math.sin(p.angle) * lateralDrop;
    const drag = Math.exp(-h * (input.throttle === 0 ? 1.25 : 0.55));
    p.vx *= drag;
    p.vz *= drag;
    const speed = Math.hypot(p.vx, p.vz),
      limit = p.boosting
        ? PHYSICS.boostSpeed
        : forward < 0
          ? PHYSICS.reverseSpeed
          : PHYSICS.topSpeed;
    if (speed > limit) {
      const ratio = Math.max(limit / speed, Math.exp(-h * 5));
      p.vx *= ratio;
      p.vz *= ratio;
    }
    if (input.throttle === 0 && Math.hypot(p.vx, p.vz) < 0.08) {
      p.vx = 0;
      p.vz = 0;
    }
    const oldX = p.x,
      oldZ = p.z;
    p.x += p.vx * h;
    p.z += p.vz * h;
    let floor = surfaceHeight(p.x, p.z, map);
    if (floor - p.y > 0.65) {
      // Solid ramp backs/sides cannot teleport a kart onto the deck.
      p.x = oldX;
      p.z = oldZ;
      p.vx *= -0.18;
      p.vz *= -0.18;
      p.impact = Math.max(p.impact, speed);
      floor = previousFloor;
    }
    if (wasGrounded && floor >= previousFloor - 0.07) {
      p.y = floor;
      p.vy = (floor - previousFloor) / h;
      p.grounded = true;
    } else {
      p.grounded = false;
      p.vy -= PHYSICS.gravity * h;
      p.y += p.vy * h;
      if (p.y <= floor) {
        p.landing = clamp(-p.vy / 18, 0, 1);
        p.y = floor;
        p.vy = 0;
        p.grounded = true;
      }
    }
    if (p.grounded) {
      const pitch = Math.atan2(
        surfaceHeight(
          p.x + Math.sin(p.angle) * 0.4,
          p.z + Math.cos(p.angle) * 0.4,
          map,
        ) - floor,
        0.4,
      );
      p.pitch = clamp(-pitch, -0.36, 0.36);
    } else p.pitch = clamp(-p.vy * 0.025, -0.3, 0.3);
    p.roll = clamp(-p.yawRate * speed * 0.0018, -0.13, 0.13);
    p.slip = Math.abs(lateral);
    p.forwardSpeed = forward;
    for (const [x, z, w, d] of MAPS[map].obstacles)
      collideBox(p, x, z, w, d, 5);
    const distance = Math.hypot(p.x, p.z),
      radius = MAPS[map].radius - PHYSICS.radius - 0.45;
    if (distance > radius) {
      const nx = p.x / distance,
        nz = p.z / distance,
        v = p.vx * nx + p.vz * nz;
      p.x = nx * radius;
      p.z = nz * radius;
      if (v > 0) {
        p.impact = Math.max(p.impact, v);
        p.vx -= v * nx * 1.25;
        p.vz -= v * nz * 1.25;
      }
    }
    if (!p.padCooldown && p.grounded)
      for (const [x, z] of BOOST_PADS)
        if (Math.hypot(p.x - x, p.z - z) < 3) {
          p.miniBoost = 1.5;
          p.padCooldown = 2.5;
        }
    p.speed = Math.hypot(p.vx, p.vz);
  }
}
// Return the earliest segment hit, including a projectile crossing a target between ticks.
export function segmentSphere(a, b, c, r) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    dz = b.z - a.z,
    ox = a.x - c.x,
    oy = a.y - c.y,
    oz = a.z - c.z;
  const aa = dx * dx + dy * dy + dz * dz,
    cc = ox * ox + oy * oy + oz * oz - r * r;
  if (cc <= 0) return 0;
  if (aa < 1e-12) return null;
  const bb = ox * dx + oy * dy + oz * dz,
    disc = bb * bb - aa * cc;
  if (disc < 0) return null;
  const t = (-bb - Math.sqrt(disc)) / aa;
  return t >= 0 && t <= 1 ? t : null;
}
export function segmentBox(a, b, box) {
  let lo = 0,
    hi = 1;
  for (const key of ["x", "y", "z"]) {
    const delta = b[key] - a[key],
      min = box[key][0],
      max = box[key][1];
    if (Math.abs(delta) < 1e-9) {
      if (a[key] < min || a[key] > max) return null;
      continue;
    }
    const t1 = (min - a[key]) / delta,
      t2 = (max - a[key]) / delta;
    lo = Math.max(lo, Math.min(t1, t2));
    hi = Math.min(hi, Math.max(t1, t2));
    if (lo > hi) return null;
  }
  return lo;
}
function wallHit(a, b, map) {
  let best = null;
  for (const [x, z, w, d] of MAPS[map].obstacles) {
    const t = segmentBox(a, b, {
      x: [x - w / 2, x + w / 2],
      y: [0, 5],
      z: [z - d / 2, z + d / 2],
    });
    if (t !== null && (best === null || t < best)) best = t;
  }
  for (const [x, z, w, d] of MAPS[map].ramps) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z,
      slope = 3.5 / d;
    let lo = 0,
      hi = 1;
    // Clip against the six half-spaces of the solid ramp wedge.
    for (const [value, delta] of [
      [a.x - x + w / 2, dx],
      [x + w / 2 - a.x, -dx],
      [a.z - z + d / 2, dz],
      [z + d / 2 - a.z, -dz],
      [a.y, dy],
      [slope * (a.z - z + d / 2) - a.y, slope * dz - dy],
    ]) {
      if (Math.abs(delta) < 1e-9) {
        if (value < 0) {
          lo = 2;
          break;
        }
      } else if (delta > 0) lo = Math.max(lo, -value / delta);
      else hi = Math.min(hi, -value / delta);
    }
    if (lo <= hi && lo <= 1 && hi >= 0 && (best === null || lo < best))
      best = lo;
  }
  return best;
}
function damage(world, p, amount, owner, point, emp = false) {
  if (p.dead > 0) return;
  if (emp) {
    p.shield = 0;
    p.disabled = 2.5;
    p.miniBoost = 0;
    p.boost = Math.max(0, p.boost - 40);
  }
  if (p.shield > 0) {
    world.events.push({ type: "block", id: p.id, x: p.x, y: p.y + 1, z: p.z });
    return;
  }
  p.hp = Math.max(0, p.hp - Math.round(amount));
  if (point) {
    const dx = p.x - point.x,
      dz = p.z - point.z,
      d = Math.hypot(dx, dz) || 1,
      force = clamp(amount * 0.17, 1, 11);
    p.vx += (dx / d) * force;
    p.vz += (dz / d) * force;
  }
  world.events.push({
    type: "hit",
    id: p.id,
    owner,
    damage: Math.round(amount),
    x: p.x,
    y: p.y + 1,
    z: p.z,
  });
  if (!p.hp) {
    p.dead = 3;
    p.deaths++;
    p.vx = 0;
    p.vz = 0;
    p.drifting = false;
    p.driftCharge = 0;
    const killer = world.players.find((q) => q.id === owner);
    if (killer && killer !== p) killer.kills++;
    world.events.push({
      type: "kill",
      id: p.id,
      owner,
      killer: killer?.name || "Arena",
      victim: p.name,
      x: p.x,
      y: p.y + 1,
      z: p.z,
    });
  }
}
function blast(world, point, radius, amount, owner, kind = "rocket") {
  world.events.push({
    type: "explosion",
    ...point,
    size: radius * 0.45,
    weapon: kind,
    owner,
  });
  for (const p of world.players) {
    if (kind === "emp" && p.id === owner) continue;
    const target = { x: p.x, y: p.y + 1, z: p.z },
      d = Math.hypot(
        target.x - point.x,
        target.y - point.y,
        target.z - point.z,
      );
    const start = {
      x: point.x + (target.x - point.x) * 0.002,
      y: point.y + (target.y - point.y) * 0.002,
      z: point.z + (target.z - point.z) * 0.002,
    };
    if (d > radius || wallHit(start, target, world.map) !== null) continue;
    damage(
      world,
      p,
      amount * (1 - (0.5 * d) / radius),
      owner,
      point,
      kind === "emp",
    );
  }
  for (const b of world.barrels)
    if (b.hp > 0 && Math.hypot(b.x - point.x, b.z - point.z) < radius + 1) {
      b.hp = 0;
      b.cooldown = 18;
      blast(world, { x: b.x, y: 1, z: b.z }, 7, 70, owner, "barrel");
    }
}
function aimTarget(p, world, cone = 0.5) {
  return world.players
    .filter(
      (q) =>
        q.id !== p.id &&
        q.dead <= 0 &&
        Math.abs(angleDiff(Math.atan2(q.x - p.x, q.z - p.z), p.angle)) < cone &&
        Math.hypot(q.x - p.x, q.z - p.z) < 75 &&
        wallHit(
          { x: p.x, y: p.y + 1, z: p.z },
          { x: q.x, y: q.y + 1, z: q.z },
          world.map,
        ) === null,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
    )[0];
}
export function fire(world, p) {
  if (
    !p.weapon ||
    !WEAPONS[p.weapon] ||
    p.ammo < 1 ||
    p.cooldown > 0 ||
    p.dead > 0
  )
    return;
  const type = p.weapon,
    w = WEAPONS[type];
  p.ammo--;
  p.cooldown = w.delay;
  world.events.push({
    type: "fire",
    id: p.id,
    weapon: type,
    x: p.x,
    y: p.y + 1,
    z: p.z,
  });
  if (type === "shield") p.shield = 6;
  else if (type === "emp")
    blast(
      world,
      { x: p.x, y: p.y + 1, z: p.z },
      w.radius,
      w.damage,
      p.id,
      "emp",
    );
  else {
    const target = type === "homing" ? aimTarget(p, world, 0.8) : null,
      count = type === "shotgun" ? 7 : 1;
    for (let i = 0; i < count; i++) {
      const a = p.angle + (type === "shotgun" ? (i - 3) * 0.065 : 0),
        mine = type === "mine",
        dir = mine ? -1 : 1;
      const start = {
        x: p.x + Math.sin(a) * dir * 2.25,
        y: p.y + (mine ? 0.22 : 1.1),
        z: p.z + Math.cos(a) * dir * 2.25,
      };
      const s = {
        id: world.nextId++,
        owner: p.id,
        type,
        ...start,
        vx: Math.sin(a) * w.speed + (type === "grenade" ? p.vx * 0.5 : 0),
        vz: Math.cos(a) * w.speed + (type === "grenade" ? p.vz * 0.5 : 0),
        vy: type === "grenade" ? 9 : 0,
        life: mine
          ? 22
          : type === "grenade"
            ? 2.2
            : type === "shotgun"
              ? 0.36
              : 3.1,
        age: 0,
        target: target?.id,
      };
      // Check the muzzle segment too: a shooter touching a wall must not fire through it.
      const muzzleHit = wallHit(
        { x: p.x, y: start.y, z: p.z },
        start,
        world.map,
      );
      if (muzzleHit !== null) {
        world.events.push({
          type: "explosion",
          ...start,
          size: 0.4,
          weapon: type,
        });
        continue;
      }
      world.projectiles.push(s);
    }
  }
  if (!p.ammo) p.weapon = null;
}
export function botInput(p, world, dt) {
  const alive = world.players.filter((q) => q.id !== p.id && q.dead <= 0);
  let targets = p.hp < 45 ? world.repairs.filter((q) => !q.cooldown) : [];
  if (!targets.length)
    targets = p.weapon ? alive : world.pickups.filter((q) => !q.cooldown);
  const target = targets.sort(
    (a, b) =>
      Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
  )[0] || {
    x: Math.sin(world.time * 0.12) * 40,
    z: Math.cos(world.time * 0.12) * 40,
  };
  let tx = target.x,
    tz = target.z;
  if (p.weapon && target.vx) {
    const lead = Math.min(
      0.5,
      Math.hypot(tx - p.x, tz - p.z) / (WEAPONS[p.weapon].speed || 60),
    );
    tx += target.vx * lead;
    tz += target.vz * lead;
  }
  let desired = Math.atan2(tx - p.x, tz - p.z);
  for (const [x, z, w, d] of MAPS[world.map].obstacles) {
    const ahead = 5 + p.speed * 0.22,
      ax = p.x + Math.sin(p.angle) * ahead,
      az = p.z + Math.cos(p.angle) * ahead;
    if (Math.abs(ax - x) < w / 2 + 2.6 && Math.abs(az - z) < d / 2 + 2.6) {
      const side = Math.sin(angleDiff(Math.atan2(x - p.x, z - p.z), p.angle));
      desired = p.angle - (side >= 0 ? 1 : -1) * 1.1;
    }
  }
  p.stuck = p.speed < 1.8 ? (p.stuck || 0) + dt : 0;
  if (p.stuck > 2.6) p.stuck = 0;
  const reversing = p.stuck > 1,
    delta = angleDiff(desired, p.angle),
    distance = Math.hypot(tx - p.x, tz - p.z);
  return {
    throttle: reversing ? -1 : Math.abs(delta) > 1 ? 0.48 : 1,
    steer: clamp(-delta * 1.8, -1, 1) * (reversing ? -1 : 1),
    drift: Math.abs(delta) > 0.7 && p.speed > 15,
    boost: Math.abs(delta) < 0.15 && distance > 28 && p.boost > 50,
    fire:
      !!p.weapon &&
      (p.weapon === "shield"
        ? p.hp < 70
        : p.weapon === "emp"
          ? distance < 15
          : p.weapon === "mine"
            ? distance < 16
            : Math.abs(delta) < (p.weapon === "homing" ? 0.65 : 0.22)),
  };
}
function respawn(world, p, index) {
  let best = spawnPoint(index),
    max = -1;
  for (let i = 0; i < 8; i++) {
    const s = spawnPoint((index + i) % 8),
      d = Math.min(
        ...world.players
          .filter((q) => q !== p && q.dead <= 0)
          .map((q) => Math.hypot(q.x - s.x, q.z - s.z)),
        100,
      );
    if (d > max) {
      best = s;
      max = d;
    }
  }
  const keep = { kills: p.kills, deaths: p.deaths };
  Object.assign(p, makePlayer(p.id, p.name, index, p.color, p.bot), best, keep);
  world.events.push({ type: "respawn", id: p.id, x: p.x, y: 1, z: p.z });
}
function projectilesStep(world, dt) {
  for (const s of world.projectiles) {
    let detonated = false;
    const w = WEAPONS[s.type],
      start = { x: s.x, y: s.y, z: s.z };
    s.life -= dt;
    s.age += dt;
    if (s.type === "homing") {
      const target = world.players.find(
        (p) => p.id === s.target && p.dead <= 0,
      );
      if (target) {
        const current = Math.atan2(s.vx, s.vz),
          desired = Math.atan2(target.x - s.x, target.z - s.z),
          angle =
            current + clamp(angleDiff(desired, current), -dt * 2.5, dt * 2.5);
        s.vx = Math.sin(angle) * w.speed;
        s.vz = Math.cos(angle) * w.speed;
      }
    }
    if (s.type === "grenade") s.vy -= 18 * dt;
    const travel = s.type === "railgun" ? 0.22 : dt;
    const end = {
      x: s.x + s.vx * travel,
      y: s.y + s.vy * travel,
      z: s.z + s.vz * travel,
    };
    let hitT = wallHit(start, end, world.map),
      victim = null,
      barrel = null;
    for (const p of world.players) {
      if (
        p.dead > 0 ||
        (p.id === s.owner && (s.type !== "mine" || s.age < 1.3)) ||
        (s.type === "mine" && s.age < 0.65)
      )
        continue;
      const t = segmentSphere(
        start,
        end,
        { x: p.x, y: p.y + 0.95, z: p.z },
        s.type === "mine" ? 2 : 1.45,
      );
      if (t !== null && (hitT === null || t < hitT)) {
        hitT = t;
        victim = p;
        barrel = null;
      }
    }
    for (const b of world.barrels) {
      if (!b.hp) continue;
      const t = segmentSphere(start, end, { x: b.x, y: 0.8, z: b.z }, 0.8);
      if (t !== null && (hitT === null || t < hitT)) {
        hitT = t;
        barrel = b;
        victim = null;
      }
    }
    if (hitT !== null) {
      s.x = start.x + (end.x - start.x) * hitT;
      s.y = start.y + (end.y - start.y) * hitT;
      s.z = start.z + (end.z - start.z) * hitT;
      if (s.type === "grenade" && !victim && !barrel) {
        s.vx *= -0.6;
        s.vz *= -0.6;
        s.x = start.x;
        s.z = start.z;
      } else {
        s.life = 0;
        if (barrel) {
          barrel.hp = Math.max(0, barrel.hp - (w.damage || 0));
          if (!barrel.hp) {
            barrel.cooldown = 18;
            blast(
              world,
              { x: barrel.x, y: 1, z: barrel.z },
              7,
              70,
              s.owner,
              "barrel",
            );
          }
        }
        if (w.radius) {
          blast(
            world,
            { x: s.x, y: s.y, z: s.z },
            w.radius,
            w.damage,
            s.owner,
            s.type,
          );
          detonated = true;
        } else {
          if (victim) damage(world, victim, w.damage, s.owner, null);
          world.events.push({
            type: "explosion",
            x: s.x,
            y: s.y,
            z: s.z,
            size: 0.25,
            weapon: s.type,
          });
        }
      }
    } else Object.assign(s, end);
    if (s.type === "railgun") {
      world.events.push({
        type: "tracer",
        from: start,
        to: { x: s.x, y: s.y, z: s.z },
        weapon: s.type,
      });
      s.life = 0;
    }
    const ground = surfaceHeight(s.x, s.z, world.map) + 0.2;
    if (s.type === "grenade" && s.y < ground) {
      s.y = ground;
      s.vy = Math.abs(s.vy) * 0.53;
      s.vx *= 0.78;
      s.vz *= 0.78;
    }
    if (s.type === "grenade" && s.life <= 0 && !detonated)
      blast(
        world,
        { x: s.x, y: s.y, z: s.z },
        w.radius,
        w.damage,
        s.owner,
        s.type,
      );
    const distance = Math.hypot(s.x, s.z),
      radius = MAPS[world.map].radius - 0.3;
    if (distance > radius) {
      const nx = s.x / distance,
        nz = s.z / distance;
      s.x = nx * radius;
      s.z = nz * radius;
      if (s.type === "grenade") {
        const dot = s.vx * nx + s.vz * nz;
        if (dot > 0) {
          s.vx -= dot * nx * 1.6;
          s.vz -= dot * nz * 1.6;
        }
      } else {
        s.life = 0;
        if (w.radius && !detonated)
          blast(
            world,
            { x: s.x, y: s.y, z: s.z },
            w.radius,
            w.damage,
            s.owner,
            s.type,
          );
      }
    }
    if (s.y < -0.5) s.life = 0;
  }
  world.projectiles = world.projectiles.filter((s) => s.life > 0);
}
export function stepWorld(world, dt) {
  world.events = [];
  world.tick++;
  if (world.intermission > 0) {
    world.intermission -= dt;
    if (world.intermission <= 0) {
      world.intermission = 0;
      world.round++;
      world.time = ROUND_SECONDS;
      world.countdown = 3;
      world.projectiles = [];
      world.pickups.forEach((q) => (q.cooldown = 0));
      world.repairs.forEach((q) => (q.cooldown = 0));
      world.barrels.forEach((b) => {
        b.hp = 35;
        b.cooldown = 0;
      });
      world.players.forEach((p, i) =>
        Object.assign(p, makePlayer(p.id, p.name, i, p.color, p.bot)),
      );
      world.events.push({ type: "round" });
    }
    return;
  }
  if (world.countdown > 0) {
    world.countdown = Math.max(0, world.countdown - dt);
    return;
  }
  world.time = Math.max(0, world.time - dt);
  if (!world.time) {
    world.intermission = 10;
    world.events.push({ type: "finish" });
    return;
  }
  for (const q of [...world.pickups, ...world.repairs])
    q.cooldown = Math.max(0, q.cooldown - dt);
  for (const b of world.barrels)
    if (b.cooldown > 0) {
      b.cooldown = Math.max(0, b.cooldown - dt);
      if (!b.cooldown) b.hp = 35;
    }
  for (const [index, p] of world.players.entries()) {
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) respawn(world, p, index);
      continue;
    }
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.shield = Math.max(0, p.shield - dt);
    p.impactCooldown = Math.max(0, (p.impactCooldown || 0) - dt);
    if (p.bot) p.input = botInput(p, world, dt);
    const mini = p.miniBoost,
      grounded = p.grounded;
    movePlayer(p, p.input, dt, world.map);
    if (p.miniBoost > mini + 0.2)
      world.events.push({ type: "boost", id: p.id, x: p.x, y: p.y, z: p.z });
    if (!grounded && p.grounded && p.landing > 0.15)
      world.events.push({
        type: "land",
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        strength: p.landing,
      });
    for (const b of world.barrels)
      if (b.hp > 0) collideBox(p, b.x, b.z, 1.2, 1.2, 1.6);
    if (p.impact > 6 && !p.impactCooldown) {
      p.impactCooldown = 0.3;
      world.events.push({
        type: "collision",
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        strength: p.impact,
      });
    }
    if (p.input.fire) fire(world, p);
    for (const q of world.pickups)
      if (
        !q.cooldown &&
        !p.weapon &&
        p.y < 2.5 &&
        Math.hypot(q.x - p.x, q.z - p.z) < 2.6
      ) {
        const choices = Object.keys(WEAPONS).filter((k) => k !== p.lastWeapon);
        p.weapon = choices[Math.floor(Math.random() * choices.length)];
        p.lastWeapon = p.weapon;
        p.ammo = WEAPONS[p.weapon].ammo;
        q.cooldown = 7;
        world.events.push({ type: "pickup", id: p.id, weapon: p.weapon });
      }
    for (const q of world.repairs)
      if (
        !q.cooldown &&
        p.hp < 100 &&
        p.y < 2 &&
        Math.hypot(q.x - p.x, q.z - p.z) < 2.7
      ) {
        p.hp = Math.min(100, p.hp + 40);
        q.cooldown = 16;
        world.events.push({ type: "repair", id: p.id, x: p.x, y: p.y, z: p.z });
      }
  }
  // ponytail: pairwise contact resolution is bounded to eight racers; spatial hashing is unnecessary at this room size.
  for (let i = 0; i < world.players.length; i++)
    for (let j = i + 1; j < world.players.length; j++) {
      const a = world.players[i],
        b = world.players[j];
      if (a.dead > 0 || b.dead > 0 || Math.abs(a.y - b.y) > 1.8) continue;
      let dx = b.x - a.x,
        dz = b.z - a.z,
        d = Math.hypot(dx, dz);
      if (d >= 2.7) continue;
      if (d < 0.0001) {
        dx = 1;
        dz = 0;
        d = 1;
      }
      const nx = dx / d,
        nz = dz / d,
        overlap = (2.7 - d) * 0.5;
      a.x -= nx * overlap;
      a.z -= nz * overlap;
      b.x += nx * overlap;
      b.z += nz * overlap;
      const relative = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz,
        impulse = Math.max(0, relative) * 0.63;
      a.vx -= impulse * nx;
      a.vz -= impulse * nz;
      b.vx += impulse * nx;
      b.vz += impulse * nz;
      if (relative > 7 && !a.impactCooldown) {
        world.events.push({
          type: "collision",
          id: a.id,
          x: a.x,
          y: a.y,
          z: a.z,
          strength: relative,
        });
        a.impactCooldown = 0.3;
      }
    }
  projectilesStep(world, dt);
}
