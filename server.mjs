import http from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import {
  MAPS,
  COLORS,
  cleanInput,
  makePlayer,
  makeWorld,
  stepWorld,
  FIXED_DT,
} from "./shared/game.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const production = process.argv.includes("--production");
const rooms = new Map();
const names = [
  "APEX",
  "DUST DEVIL",
  "NITRO",
  "GHOST",
  "SIDEWINDER",
  "VOLT",
  "ROGUE",
];
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".hdr": "application/octet-stream",
};
let vite;
const server = http.createServer(async (req, res) => {
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        rooms: rooms.size,
        players: [...rooms.values()].reduce((n, r) => n + r.clients.size, 0),
      }),
    );
    return;
  }
  if (!production) {
    vite.middlewares(req, res);
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "dist",
      pathname === "/" ? "index.html" : "." + pathname,
    );
    if (!file.startsWith(path.join(root, "dist") + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=86400"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
if (!production) {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
}
const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });
server.on("upgrade", (req, socket, head) => {
  if (new URL(req.url, "http://localhost").pathname !== "/ws") return;
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        socket.destroy();
        return;
      }
    } catch {
      socket.destroy();
      return;
    }
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
function fillBots(room) {
  while (room.world.players.length < 6) {
    const i = room.world.players.length;
    room.world.players.push(
      makePlayer(
        "bot-" + randomBytes(3).toString("hex"),
        names[i % names.length],
        i,
        COLORS[i % COLORS.length],
        true,
      ),
    );
  }
}
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 100000)
    ws.send(JSON.stringify(data));
}
wss.on("connection", (ws) => {
  if (wss.clients.size > 128) {
    ws.close(1013, "Server full");
    return;
  }
  let room,
    player,
    windowStart = Date.now(),
    messages = 0;
  ws.alive = true;
  ws.on("pong", () => (ws.alive = true));
  const joinDeadline = setTimeout(() => {
    if (!room) ws.close(1008, "Join timeout");
  }, 15000);
  ws.on("message", (raw) => {
    if (Date.now() - windowStart > 1000) {
      windowStart = Date.now();
      messages = 0;
    }
    if (++messages > 90) {
      ws.close(1008, "Too many messages");
      return;
    }
    let m;
    try {
      m = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid message." });
      return;
    }
    if (!m || typeof m !== "object") return;
    if (m.type === "ping") {
      send(ws, { type: "pong", at: m.at });
      return;
    }
    if (m.type === "input" && player) {
      player.input = cleanInput(m.input);
      player.lastInput = Date.now();
      return;
    }
    if (m.type !== "join" || room) return;
    if (
      !["quick", "create", "join"].includes(m.mode) ||
      !Object.hasOwn(MAPS, m.map)
    ) {
      send(ws, { type: "error", message: "Choose a valid arena." });
      return;
    }
    if (m.mode === "join") {
      const code = typeof m.code === "string" ? m.code.toUpperCase() : "";
      if (!/^[A-F0-9]{6}$/.test(code) || !rooms.has(code)) {
        send(ws, {
          type: "error",
          message: "Room not found. Check the six-character code.",
        });
        return;
      }
      room = rooms.get(code);
      if (room.clients.size >= 8) {
        room = null;
        send(ws, { type: "error", message: "This room is full." });
        return;
      }
    } else if (m.mode === "quick")
      room = [...rooms.values()].find(
        (r) => !r.private && r.world.map === m.map && r.clients.size < 8,
      );
    if (!room) {
      if (rooms.size >= 32) {
        send(ws, {
          type: "error",
          message: "All arenas are busy. Try again shortly.",
        });
        return;
      }
      let code;
      do {
        code = randomBytes(3).toString("hex").toUpperCase();
      } while (rooms.has(code));
      room = {
        code,
        private: m.mode === "create",
        world: makeWorld(m.map),
        clients: new Set(),
      };
      rooms.set(code, room);
    }
    clearTimeout(joinDeadline);
    if (room.world.players.length >= 6) {
      const bot = room.world.players.findIndex((p) => p.bot);
      if (bot >= 0) room.world.players.splice(bot, 1);
    }
    const name =
      typeof m.name === "string"
        ? m.name
            .replace(/[\p{C}<>]/gu, "")
            .trim()
            .slice(0, 16)
        : "";
    const color = COLORS.includes(m.color) ? m.color : COLORS[0];
    player = makePlayer(
      randomBytes(6).toString("hex"),
      name || "Racer",
      room.world.players.length,
      color,
    );
    player.lastInput = Date.now();
    room.world.players.push(player);
    room.clients.add(ws);
    fillBots(room);
    send(ws, {
      type: "welcome",
      id: player.id,
      code: room.code,
      map: room.world.map,
    });
  });
  ws.on("error", () => ws.close());
  ws.on("close", () => {
    clearTimeout(joinDeadline);
    if (!room) return;
    room.clients.delete(ws);
    room.world.players = room.world.players.filter((p) => p !== player);
    if (!room.clients.size) rooms.delete(room.code);
    else fillBots(room);
  });
});
let lastTick = performance.now(),
  accumulator = 0,
  networkTick = 0;
setInterval(() => {
  const now = performance.now();
  accumulator = Math.min(0.2, accumulator + (now - lastTick) / 1000);
  lastTick = now;
  while (accumulator >= FIXED_DT) {
    accumulator -= FIXED_DT;
    networkTick++;
    for (const room of rooms.values()) {
      for (const p of room.world.players)
        if (!p.bot && Date.now() - p.lastInput > 300) p.input = cleanInput();
      stepWorld(room.world, FIXED_DT);
      room.pendingEvents ||= [];
      room.pendingEvents.push(...room.world.events);
      if (networkTick % 2) continue;
      const world = room.world;
      const snapshot = {
        type: "state",
        map: world.map,
        time: world.time,
        countdown: world.countdown,
        intermission: world.intermission,
        round: world.round,
        tick: world.tick,
        players: world.players.map(({ input, lastInput, stuck, ...p }) => p),
        projectiles: world.projectiles,
        pickups: world.pickups,
        barrels: world.barrels,
        repairs: world.repairs,
        events: room.pendingEvents,
      };
      for (const client of room.clients) send(client, snapshot);
      room.pendingEvents = [];
    }
  }
}, 8);
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    ws.ping();
  }
}, 15000).unref();
const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
server.listen(port, "0.0.0.0", () =>
  console.log(
    `HAVOC is running at http://localhost:${server.address().port} (${production ? "production" : "development"})`,
  ),
);
