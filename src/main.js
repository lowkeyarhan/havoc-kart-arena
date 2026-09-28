import "./style.css";
import { GameAudio } from "./audio.js";
import {
  DEFAULT_BINDINGS,
  validBindings,
  gamepadInput,
  bindingLabel,
} from "./controls.js";
import { ArenaScene } from "./scene.js";
import {
  MAPS,
  COLORS,
  WEAPONS,
  movePlayer,
  neutralInput,
  angleDiff,
  FIXED_DT,
  PHYSICS,
} from "../shared/game.js";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  edit: "m15 5 4 4M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.9M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm4-3a4 4 0 0 1 0 8",
  volume: "m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "m11 5-6 4H2v6h3l6 4zM16 9l5 6m0-6-5 6",
  settings:
    "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  helmet: "M4 15V11a8 8 0 0 1 16 0v4l-3 5H7zm0-5h16l-4 5H8z",
  rotate: "M20 8a8 8 0 1 0 0 8m0-13v5h-5",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  snow: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 4 4-4M8 20l4-4 4 4",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  copy: "M9 9h11v11H9zM5 15H3V3h12v2",
  pause: "M8 5v14M16 5v14",
  box: "m12 3 9 5v9l-9 5-9-5V8zm0 10 9-5m-9 5L3 8m9 5v9m-5-16 9 5",
  rocket:
    "M14 4 20 3l-1 6-9 9-4-4zM6 14l-3 1 1-6 5-1m1 10-1 3 6-1 1-5M3 21l3-3",
  blaster: "M3 9h17v6H8l-2 6H3l2-8M20 11h3",
  mine: "M18 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0M12 8V5l4-2m0 0 3 2m-3-2 1-2",
  homing:
    "M3 12h4m10 0h4M12 3v4m0 10v4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  shotgun: "M3 10h16v4H8l-2 6H3l2-8M20 7l3-2m-2 7h3m-4 5 3 2",
  grenade: "M7 8h10l3 7-4 6H8l-4-6zm3 0V4h5l2 4m-3-4 4-2",
  railgun: "M3 9h14v6H8l-2 5H3l2-7m12-3h7m-7 4h7M19 5l3 2m-3 12 3-2",
  emp: "m13 2-7 11h5l-1 9 8-12h-6zM3 5 1 8m20 11 2-3",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zm-4 9 3 3 5-6",
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
const hydrateIcons = () =>
  $$("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
hydrateIcons();
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const save = (k, v) => {
  try {
    localStorage.setItem("havoc-" + k, v);
  } catch {}
};
const read = (k, d) => {
  try {
    return localStorage.getItem("havoc-" + k) || d;
  } catch {
    return d;
  }
};
let selectedMap = "canyon",
  color = read("color", COLORS[0]),
  socket = null,
  state = null,
  playerId = null,
  predicted = null,
  roomCode = "",
  game = null,
  playing = false,
  joining = false,
  lastRound = 0;
let muted = read("muted", "false") === "true",
  toastTimer,
  killMessages = [],
  shownFinish = false;
const audio = new GameAudio();
audio.enabled = !muted;
audio.volume = Number(read("volume", ".65"));
let bindings;
try {
  bindings = validBindings(JSON.parse(read("bindings", "{}")));
} catch {
  bindings = { ...DEFAULT_BINDINGS };
}
let sensitivity = Number(read("sensitivity", "1")),
  cameraView = Number(read("camera", "1")),
  screenShake =
    read(
      "shake",
      matchMedia("(prefers-reduced-motion: reduce)").matches ? "false" : "true",
    ) === "true";
let lastCountdown = -1,
  lastHud = 0,
  pingMs = 0,
  controllerMenuHeld = false;
let quality = read("quality", "high");
const keys = new Set(),
  touch = new Set(),
  modal = $("#modal");
$("#driver-name").value = read("name", "Racer");
const toast = (text) => {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
};
function openModal(html) {
  $("#modal-content").innerHTML = html;
  if (!modal.open) modal.showModal();
  keys.clear();
  touch.clear();
}
function closeModal() {
  modal.close();
  keys.clear();
  touch.clear();
}
$("#close-modal").onclick = closeModal;
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
function startAudio() {
  audio.setEnabled(!muted);
  audio.start();
}
function syncSound() {
  $("#sound-button").innerHTML = icon(muted ? "mute" : "volume");
  $("#sound-button").setAttribute(
    "aria-label",
    muted ? "Enable sound" : "Mute sound",
  );
  audio.setEnabled(!muted);
}
$("#sound-button").onclick = () => {
  muted = !muted;
  save("muted", muted);
  startAudio();
  syncSound();
  toast(muted ? "Sound muted" : "Engine audio enabled");
};
syncSound();
function help() {
  openModal(
    `<div class="dialog-kicker">THE RULES ARE SIMPLE</div><h2>DRIVE. ARM UP.<br/>CAUSE HAVOC.</h2><p>Grab glowing mystery crates. Use your weapons to wreck other racers. The most eliminations in three minutes wins. You respawn after every wreck.</p><div class="controls-list"><kbd>WASD / ↑↓←→</kbd><span>Accelerate, reverse & steer</span><kbd>SPACE</kbd><span>Fire your equipped weapon</span><kbd>SHIFT</kbd><span>Hold a drift, then release for a mini-turbo</span><kbd>E</kbd><span>Boost — recharges over time</span><kbd>ESC</kbd><span>Open the match menu</span></div><p>Nine weapons, explosive barrels, repair kits, and blue boost pads. S brakes before reversing. Bots fill empty seats; friends replace bots as they join. On touchscreens, use the on-screen pedals. A standard controller uses RT/LT for gas/brake, left stick to steer, A to fire, X to drift, and RB to boost.</p><button class="secondary" id="open-armory">WEAPON FIELD GUIDE</button><button class="primary" id="got-it">LET’S ROLL ${icon("arrow")}</button>`,
  );
  $("#got-it").onclick = closeModal;
  $("#open-armory").onclick = armory;
}
$("#help-nav").onclick = help;
$("#play-nav").onclick = () => {
  closeModal();
  $("#driver-name").focus();
};
function garage() {
  openModal(
    `<div class="dialog-kicker">YOUR GARAGE / 01</div><h2>THE RENEGADE</h2><p>Low center of gravity. Wide track. Absolutely no self-preservation instinct. Make it yours.</p><label>CHOOSE YOUR FINISH</label><div class="swatches">${COLORS.map((c, i) => `<button class="swatch ${c === color ? "selected" : ""}" style="--color:${c}" data-color="${c}" aria-label="${["Acid lime", "Ember orange", "Glacier blue", "Orchid purple", "Sunburst gold", "Arctic white"][i]}" aria-pressed="${c === color}"></button>`).join("")}</div><div class="spec-list"><div><small>TOP SPEED</small><strong>108 KM/H</strong></div><div><small>BOOST SPEED</small><strong>155 KM/H</strong></div><div><small>CLASS</small><strong>ALL-ROUNDER</strong></div></div><button class="primary" id="garage-done">READY TO ROLL ${icon("check")}</button>`,
  );
  $$(".swatch").forEach(
    (b) =>
      (b.onclick = () => {
        color = b.dataset.color;
        save("color", color);
        game.setColor(color);
        $$(".swatch").forEach((s) => {
          s.classList.toggle("selected", s === b);
          s.setAttribute("aria-pressed", String(s === b));
        });
      }),
  );
  $("#garage-done").onclick = closeModal;
}
$("#garage-nav").onclick = garage;
function armory() {
  openModal(
    `<div class="dialog-kicker">KNOW YOUR FIREPOWER</div><h2>THE ARSENAL.</h2><div class="armory">${Object.entries(
      WEAPONS,
    )
      .map(
        ([id, w]) =>
          `<div class="weapon-guide"><span style="color:${w.color}">${icon(id)}</span><div><strong>${w.name}</strong><small>${w.ammo} ${w.ammo === 1 ? "CHARGE" : "ROUNDS"}</small><p>${w.description}</p></div></div>`,
      )
      .join(
        "",
      )}</div><button class="primary" id="armory-done">LOCKED & LOADED</button>`,
  );
  $("#armory-done").onclick = closeModal;
}
function settings() {
  openModal(
    `<h2>FINE TUNE.</h2><div class="settings-grid"><div><label for="quality">GRAPHICS</label><select id="quality"><option value="high">High — shadows & bloom</option><option value="medium">Balanced — shadows</option><option value="low">Performance</option></select></div><div><label for="camera-setting">CHASE CAMERA</label><select id="camera-setting"><option value="0.82">Close</option><option value="1">Standard</option><option value="1.25">Wide</option></select></div></div><div class="settings-grid"><div><label for="audio-setting">ENGINE & EFFECTS</label><select id="audio-setting"><option value="off">Muted</option><option value="on">Sound on</option></select></div><div><label for="shake-setting">CAMERA SHAKE</label><select id="shake-setting"><option value="on">On</option><option value="off">Off</option></select></div></div><label for="volume-setting">MASTER VOLUME</label><input id="volume-setting" type="range" min="0" max="1" step=".05" value="${audio.volume}"/><label for="steering-setting">STEERING SENSITIVITY</label><input id="steering-setting" type="range" min=".65" max="1.5" step=".05" value="${sensitivity}"/><label>KEYBOARD — CLICK A KEY TO REBIND</label><div class="binding-grid">${Object.entries(
      bindings,
    )
      .map(
        ([action, code]) =>
          `<button type="button" data-binding="${action}"><span>${action.toUpperCase()}</span><kbd>${bindingLabel(code)}</kbd></button>`,
      )
      .join(
        "",
      )}</div><p class="settings-note">Arrow keys always work. Controllers: left stick, RT/LT, A fire, X drift, RB boost. Settings apply to this browser.</p><button class="primary" id="settings-done">SAVE SETTINGS ${icon("check")}</button>`,
  );
  $("#quality").value = quality;
  $("#audio-setting").value = muted ? "off" : "on";
  $("#camera-setting").value = String(cameraView);
  $("#shake-setting").value = screenShake ? "on" : "off";
  const draft = { ...bindings };
  let capture = null;
  $$("[data-binding]").forEach(
    (button) =>
      (button.onclick = () => {
        if (capture)
          capture.querySelector("kbd").textContent = bindingLabel(
            draft[capture.dataset.binding],
          );
        capture = button;
        button.querySelector("kbd").textContent = "PRESS KEY";
      }),
  );
  const listener = (e) => {
    if (!capture) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code === "Escape") {
      capture.querySelector("kbd").textContent = bindingLabel(
        draft[capture.dataset.binding],
      );
      capture = null;
      return;
    }
    const action = capture.dataset.binding;
    if (Object.entries(draft).some(([a, c]) => a !== action && c === e.code)) {
      toast("That key is already assigned.");
      return;
    }
    if (
      !/^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight|ControlLeft|AltLeft)$/.test(
        e.code,
      )
    ) {
      toast("Choose a letter, number, Space, Shift, Control, or Alt.");
      return;
    }
    draft[action] = e.code;
    capture.querySelector("kbd").textContent = bindingLabel(e.code);
    capture = null;
  };
  modal.addEventListener("keydown", listener, true);
  modal.addEventListener(
    "close",
    () => modal.removeEventListener("keydown", listener, true),
    { once: true },
  );
  $("#settings-done").onclick = () => {
    quality = $("#quality").value;
    muted = $("#audio-setting").value === "off";
    cameraView = Number($("#camera-setting").value);
    screenShake = $("#shake-setting").value === "on";
    sensitivity = Number($("#steering-setting").value);
    bindings = draft;
    audio.setVolume(Number($("#volume-setting").value));
    game.setQuality(quality);
    game.cameraDistance = cameraView;
    game.screenShake = screenShake;
    for (const [key, value] of Object.entries({
      quality,
      muted,
      camera: cameraView,
      shake: screenShake,
      sensitivity,
      volume: audio.volume,
      bindings: JSON.stringify(bindings),
    }))
      save(key, value);
    startAudio();
    syncSound();
    syncBindings();
    closeModal();
  };
}
function syncBindings() {
  const hints = $$(".control-hints kbd");
  if (hints[0])
    hints[0].textContent = ["forward", "left", "reverse", "right"]
      .map((a) => bindingLabel(bindings[a]))
      .join("");
  if (hints[1]) hints[1].textContent = bindingLabel(bindings.fire);
  if (hints[2]) hints[2].textContent = bindingLabel(bindings.drift);
  if (hints[3]) hints[3].textContent = bindingLabel(bindings.boost);
  $(".weapon-slot kbd").textContent = bindingLabel(bindings.fire);
  $(".boost-line kbd").textContent = bindingLabel(bindings.boost);
}
syncBindings();
$("#settings-button").onclick = settings;
$$(".arena-card").forEach(
  (b) =>
    (b.onclick = () => {
      if (playing || joining) return;
      selectedMap = b.dataset.map;
      game.setMap(selectedMap);
      $$(".arena-card").forEach((c) => {
        c.classList.toggle("selected", c === b);
        c.setAttribute("aria-pressed", String(c === b));
      });
    }),
);
$("#rotate-preview").onclick = () => {
  game.orbit += Math.PI / 3;
};
$("#driver-name").addEventListener("change", () => {
  save("name", $("#driver-name").value.trim() || "Racer");
  $("#profile-name").textContent =
    $("#driver-name").value.trim().toUpperCase() || "GUEST RACER";
});
function setJoining(value) {
  joining = value;
  $("#quick-play").disabled = value;
  $("#create-room").disabled = value;
  $("#quick-play").firstElementChild.textContent = value
    ? "CONNECTING…"
    : "QUICK PLAY";
}
function join(mode, code = "") {
  if (joining || playing) return;
  setJoining(true);
  startAudio();
  const name = $("#driver-name").value.trim() || "Racer";
  save("name", name);
  const ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
  );
  socket = ws;
  const timer = setTimeout(() => {
    if (!playing && socket === ws) {
      ws.close();
      setJoining(false);
      toast("Connection timed out. Please try again.");
    }
  }, 10000);
  ws.onopen = () =>
    ws.send(
      JSON.stringify({
        type: "join",
        mode,
        map: selectedMap,
        name,
        color,
        code,
      }),
    );
  ws.onmessage = ({ data }) => {
    if (socket !== ws) return;
    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }
    if (m.type === "error") {
      clearTimeout(timer);
      setJoining(false);
      toast(m.message);
      ws.close();
      return;
    }
    if (m.type === "welcome") {
      clearTimeout(timer);
      playerId = m.id;
      roomCode = m.code;
      selectedMap = m.map;
      playing = true;
      state = null;
      predicted = null;
      shownFinish = false;
      lastCountdown = -1;
      killMessages = [];
      game.setMap(m.map);
      game.lobby = false;
      game.clearPlayers();
      $("#lobby").hidden = true;
      $("#hud").hidden = false;
      $("#match-map").textContent = MAPS[m.map].name.toUpperCase();
      $("#room-code").textContent = m.code;
      closeModal();
      setJoining(false);
      toast(
        mode === "create"
          ? `Room ${m.code} created. Click the code to invite friends.`
          : "You’re in. Grab a crate and cause havoc.",
      );
    }
    if (m.type === "pong") {
      pingMs = Math.max(0, Date.now() - m.at);
      $("#latency").textContent = `${pingMs} MS · LIVE`;
    }
    if (m.type === "state") {
      state = m;
      const p = m.players.find((p) => p.id === playerId);
      if (p) {
        if (
          !predicted ||
          Math.hypot(predicted.x - p.x, predicted.z - p.z) > 5 ||
          p.dead > 0 ||
          m.round !== lastRound ||
          m.countdown > 0 ||
          predicted.dead > 0
        )
          predicted = { ...p };
        else {
          const visual = {
            x: predicted.x,
            y: predicted.y,
            z: predicted.z,
            angle: predicted.angle,
          };
          Object.assign(predicted, p);
          predicted.x =
            visual.x +
            (p.x + p.vx * Math.min(pingMs / 2000, 0.08) - visual.x) * 0.42;
          predicted.z =
            visual.z +
            (p.z + p.vz * Math.min(pingMs / 2000, 0.08) - visual.z) * 0.42;
          predicted.y = visual.y + (p.y - visual.y) * 0.65;
          predicted.angle =
            visual.angle + angleDiff(p.angle, visual.angle) * 0.45;
        }
      }
      lastRound = m.round;
      const count = Math.ceil(m.countdown || 0);
      if (count !== lastCountdown) {
        lastCountdown = count;
        audio.event(
          { type: "countdown", value: count, id: playerId },
          playerId,
        );
        if (count === 0) toast("GO!");
      }
      for (const e of m.events) {
        const local = e.id === playerId;
        if (
          [
            "fire",
            "explosion",
            "hit",
            "block",
            "collision",
            "land",
            "boost",
          ].includes(e.type) ||
          local
        )
          audio.event(e, playerId);
        if (e.type === "explosion")
          game.explosion(e.x, e.y ?? 1, e.z, e.size, e.weapon);
        if (e.type === "tracer") game.tracer(e.from, e.to);
        if (e.type === "kill") {
          game.explosion(e.x, e.y ?? 1, e.z, 2, "wreck");
          killMessages.push({
            killer: e.killer,
            victim: e.victim,
            at: Date.now(),
          });
          if (e.owner === playerId) feedback(`ELIMINATION +1`);
        }
        if (e.type === "hit" && e.owner === playerId && !local) {
          $("#crosshair").classList.add("hit");
          setTimeout(() => $("#crosshair").classList.remove("hit"), 160);
        }
        if (local) {
          if (e.type === "pickup") toast(`${WEAPONS[e.weapon].name} EQUIPPED`);
          if (e.type === "repair") feedback("+40 ARMOR");
          if (e.type === "boost") feedback("TURBO!");
          if (e.type === "hit") {
            $("#hit-flash").style.opacity = ".55";
            setTimeout(() => ($("#hit-flash").style.opacity = "0"), 140);
            game.shake = Math.max(game.shake, 0.18);
          }
          if (e.type === "land" && screenShake)
            game.shake = Math.max(game.shake, e.strength * 0.2);
        }
      }
      if (m.intermission > 0 && !shownFinish) {
        shownFinish = true;
        showResults();
      }
      if (m.intermission <= 0 && shownFinish) {
        shownFinish = false;
        closeModal();
        toast("New round. Make it count.");
      }
      if (performance.now() - lastHud > 80) {
        updateHUD();
        lastHud = performance.now();
      }
    }
  };
  ws.onerror = () => {
    if (socket === ws && !playing)
      toast("Could not reach the game server. Check that it is running.");
  };
  ws.onclose = () => {
    clearTimeout(timer);
    if (socket !== ws) return;
    setJoining(false);
    if (playing) {
      leave();
      toast("Connection lost. You can rejoin from the lobby.");
    }
  };
}
$("#play-form").onsubmit = (e) => {
  e.preventDefault();
  join("quick");
};
$("#create-room").onclick = () => join("create");
function joinDialog(code = "") {
  openModal(
    `<div class="dialog-kicker">BRING YOUR CREW</div><h2>JOIN THE CHAOS.</h2><p>Enter the six-character room code from your friend. The arena is chosen by the host.</p><form id="join-form"><label for="join-code">ROOM CODE</label><div class="name-field"><input id="join-code" maxlength="6" minlength="6" pattern="[A-Fa-f0-9]{6}" placeholder="A1B2C3" value="${escape(code)}" autocomplete="off" required style="text-transform:uppercase;letter-spacing:5px"/></div><button class="primary" type="submit">JOIN ROOM ${icon("arrow")}</button></form>`,
  );
  $("#join-form").onsubmit = (e) => {
    e.preventDefault();
    join("join", $("#join-code").value.trim().toUpperCase());
  };
  $("#join-code").focus();
}
$("#join-room").onclick = () => joinDialog();
$("#invite-button").onclick = async () => {
  const url = new URL(location.href);
  url.searchParams.set("room", roomCode);
  try {
    await navigator.clipboard.writeText(url.href);
    toast(`Invite link copied · Room ${roomCode}`);
  } catch {
    openModal(
      `<h2>INVITE YOUR CREW.</h2><p>Share this room code: <strong style="color:var(--lime)">${escape(roomCode)}</strong></p><div class="name-field"><input value="${escape(url.href)}" readonly aria-label="Invite link"/></div>`,
    );
    $("#modal-content input").select();
  }
};
function leave() {
  const ws = socket;
  socket = null;
  ws?.close();
  playing = false;
  state = null;
  predicted = null;
  keys.clear();
  touch.clear();
  game.lobby = true;
  game.clearPlayers();
  $("#lobby").hidden = false;
  $("#hud").hidden = true;
  $("#nameplates").replaceChildren();
  $("#respawn").hidden = true;
  audio.update(null, neutralInput(), false, selectedMap);
  closeModal();
  $$(".arena-card").forEach((c) => {
    c.classList.toggle("selected", c.dataset.map === selectedMap);
    c.setAttribute("aria-pressed", String(c.dataset.map === selectedMap));
  });
}
function pause() {
  if (!playing) return;
  openModal(
    `<div class="dialog-kicker">ROOM ${escape(roomCode)}</div><h2>TAKE A BREATHER.</h2><p>This is a live match. Other racers keep driving while the menu is open.</p><button class="primary" id="resume">BACK TO THE ARENA ${icon("arrow")}</button><button class="secondary" id="match-settings">SETTINGS & CONTROLS</button><button class="secondary" id="leave">LEAVE MATCH</button>`,
  );
  $("#resume").onclick = closeModal;
  $("#leave").onclick = leave;
  $("#match-settings").onclick = settings;
}
$("#pause-button").onclick = pause;
function showResults() {
  if (!state) return;
  const players = [...state.players].sort(
    (a, b) => b.kills - a.kills || a.deaths - b.deaths,
  );
  openModal(
    `<div class="dialog-kicker">ROUND COMPLETE</div><h2>${players[0].id === playerId ? "YOU OWNED IT." : "THAT WAS HAVOC."}</h2><p>${escape(players[0].name)} takes the arena. Next round starts automatically.</p><table class="results"><thead><tr><th>RACER</th><th>KILLS</th><th>DEATHS</th></tr></thead><tbody>${players.map((p, i) => `<tr class="${p.id === playerId ? "me" : ""}"><td>${i + 1}. ${escape(p.name)} ${p.bot ? "(BOT)" : ""}</td><td>${p.kills}</td><td>${p.deaths}</td></tr>`).join("")}</tbody></table><button class="secondary" id="results-leave">BACK TO GARAGE</button>`,
  );
  $("#results-leave").onclick = leave;
}
const input = () => {
  if (modal.open || document.hidden) return neutralInput();
  const pad = [...(navigator.getGamepads?.() || [])].find((p) => p?.connected),
    controller = gamepadInput(pad),
    pressed = (action, arrow) =>
      keys.has(bindings[action]) ||
      (arrow && keys.has(arrow)) ||
      touch.has(action);
  const menu = !!pad?.buttons?.[9]?.pressed;
  if (menu && !controllerMenuHeld && playing) pause();
  controllerMenuHeld = menu;
  const throttle =
    Number(pressed("forward", "ArrowUp")) -
    Number(pressed("reverse", "ArrowDown"));
  const steer =
    Number(pressed("right", "ArrowRight")) -
    Number(pressed("left", "ArrowLeft"));
  return {
    throttle: throttle || controller.throttle,
    steer: Math.max(-1, Math.min(1, (steer || controller.steer) * sensitivity)),
    drift: pressed("drift") || keys.has("ShiftRight") || controller.drift,
    boost: pressed("boost") || controller.boost,
    fire: pressed("fire") || controller.fire,
  };
};
window.addEventListener("keydown", (e) => {
  if (!playing || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === "Escape") {
    if (!modal.open) {
      e.preventDefault();
      pause();
    }
    return;
  }
  if (
    Object.values(bindings).includes(e.code) ||
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftRight"].includes(
      e.code,
    )
  ) {
    e.preventDefault();
    keys.add(e.code);
  }
});
$("#game").addEventListener("pointerdown", (e) => {
  if (playing && !modal.open && e.pointerType === "mouse" && e.button === 0)
    touch.add("fire");
});
window.addEventListener("pointerup", (e) => {
  if (e.pointerType === "mouse") touch.delete("fire");
});
window.addEventListener("gamepadconnected", () =>
  toast("Controller connected — RT gas · A fire · X drift · RB boost"),
);
window.addEventListener("gamepaddisconnected", () => {
  controllerMenuHeld = false;
  toast("Controller disconnected. Keyboard and touch still work.");
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  touch.clear();
});
document.addEventListener("visibilitychange", () => {
  keys.clear();
  touch.clear();
});
$$("[data-control]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touch.add(b.dataset.control);
    b.classList.add("pressed");
    startAudio();
  };
  const release = () => {
    touch.delete(b.dataset.control);
    b.classList.remove("pressed");
  };
  b.onpointerup = release;
  b.onpointercancel = release;
  b.onlostpointercapture = release;
});
setInterval(() => {
  if (socket?.readyState === WebSocket.OPEN && playing)
    socket.send(JSON.stringify({ type: "input", input: input() }));
}, 1000 / 30);
setInterval(() => {
  if (socket?.readyState === WebSocket.OPEN && playing)
    socket.send(JSON.stringify({ type: "ping", at: Date.now() }));
}, 2000);
function updateHUD() {
  const p = state.players.find((p) => p.id === playerId);
  if (!p) return;
  const sec = Math.ceil(state.time);
  $("#time-left").textContent =
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  $("#round-label").textContent =
    `ROUND ${String(state.round).padStart(2, "0")}`;
  $("#player-count").textContent =
    `${state.players.length} RACERS · ${state.players.filter((p) => !p.bot).length} HUMAN`;
  $("#health-number").textContent =
    p.shield > 0 ? `SHIELD ${Math.ceil(p.shield)}s` : p.hp;
  $("#health-bar").style.width = `${p.hp}%`;
  $("#health-bar").style.background = p.hp < 30 ? "#ff7853" : "var(--lime)";
  $("#boost-bar").style.width = `${p.boost}%`;
  $("#drift-fill").style.width =
    `${Math.min(100, (p.driftCharge / 2.4) * 100)}%`;
  $("#drift-label").textContent =
    p.disabled > 0
      ? "EMP DISABLED"
      : p.miniBoost > 0
        ? "TURBO ACTIVE"
        : p.driftCharge > 1.7
          ? "RELEASE FOR SUPER TURBO"
          : p.driftCharge > 0.65
            ? "RELEASE FOR TURBO"
            : "HOLD SHIFT + TURN TO DRIFT";
  $("#drift-meter").classList.toggle(
    "charged",
    p.driftCharge > 0.65 || p.miniBoost > 0,
  );
  $("#countdown").hidden = !(state.countdown > 0);
  $("#countdown-number").textContent = Math.ceil(state.countdown || 0);
  $("#hud").classList.toggle("boosting", !!p.boosting);
  $("#speed").textContent = Math.round((predicted?.speed || p.speed) * 3.6);
  $("#respawn").hidden = p.dead <= 0;
  $("#respawn-time").textContent = Math.ceil(p.dead);
  $("#weapon-name").textContent = p.weapon
    ? WEAPONS[p.weapon].name
    : "FIND YOUR FIREPOWER";
  $("#weapon-hint").textContent = p.weapon
    ? p.weapon === "homing"
      ? "FACE A RACER TO LOCK ON"
      : p.weapon === "emp"
        ? "17 METER DISRUPTION RADIUS"
        : "LOCK. LOAD. LET LOOSE."
    : "DRIVE THROUGH A PICKUP";
  $("#weapon-icon").innerHTML = icon(p.weapon || "box");
  $("#ammo").textContent = p.weapon ? p.ammo : "";
  $("#leaderboard").innerHTML = [...state.players]
    .sort((a, b) => b.kills - a.kills)
    .map(
      (p, i) =>
        `<div class="leader-row ${p.id === playerId ? "me" : ""}"><span>${i + 1}</span><span class="driver-dot" style="background:${p.color}"></span><span>${escape(p.name)}</span>${p.bot ? '<span class="bot-mark">BOT</span>' : ""}<strong>${p.kills}</strong></div>`,
    )
    .join("");
  killMessages = killMessages.filter((m) => Date.now() - m.at < 6000).slice(-4);
  $("#kill-feed").innerHTML = killMessages
    .map(
      (m) =>
        `<div class="kill-message"><b>${escape(m.killer)}</b> wrecked ${escape(m.victim)}</div>`,
    )
    .join("");
  const ctx = $("#minimap").getContext("2d");
  ctx.clearRect(0, 0, 140, 140);
  ctx.strokeStyle = "#b3c79c66";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(70, 70, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#8ca17d55";
  for (const [x, z, w, d] of MAPS[state.map].obstacles)
    ctx.fillRect(
      70 + x * 0.9 - w * 0.45,
      70 + z * 0.9 - d * 0.45,
      w * 0.9,
      d * 0.9,
    );
  for (const q of state.pickups)
    if (!q.cooldown) {
      ctx.fillStyle = "#c4f564";
      ctx.fillRect(69 + q.x * 0.9, 69 + q.z * 0.9, 2, 2);
    }
  for (const q of state.repairs || [])
    if (!q.cooldown) {
      ctx.fillStyle = "#6bf3ab";
      ctx.fillRect(68 + q.x * 0.9, 68 + q.z * 0.9, 4, 4);
    }
  for (const q of state.players)
    if (q.dead <= 0) {
      ctx.fillStyle = q.id === playerId ? "#ffffff" : q.color;
      ctx.beginPath();
      ctx.arc(
        70 + q.x * 0.9,
        70 + q.z * 0.9,
        q.id === playerId ? 4 : 2.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
}
let feedbackTimer;
function feedback(text) {
  $("#combat-feedback").textContent = text;
  $("#combat-feedback").classList.add("show");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(
    () => $("#combat-feedback").classList.remove("show"),
    1100,
  );
}
async function boot() {
  try {
    await document.fonts.ready;
    game = new ArenaScene($("#game"));
    game.setColor(color);
    game.setQuality(quality);
    game.cameraDistance = cameraView;
    game.screenShake = screenShake;
    let physicsTime = 0;
    let last = performance.now(),
      frame = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frame++;
      const controls = input();
      physicsTime = Math.min(0.1, physicsTime + dt);
      while (physicsTime >= FIXED_DT) {
        if (
          playing &&
          predicted &&
          state &&
          state.intermission <= 0 &&
          !(state.countdown > 0)
        )
          movePlayer(predicted, controls, FIXED_DT, selectedMap);
        physicsTime -= FIXED_DT;
      }
      game.update(dt, now / 1000, state, playerId, predicted);
      if (playing && state && frame % 3 === 0) {
        $("#nameplates").innerHTML = state.players
          .filter((p) => p.id !== playerId && p.dead <= 0)
          .map((p) => {
            const v = game.screenPosition(p.x, p.y + 2.9, p.z);
            return v.visible
              ? `<span class="nameplate" style="left:${v.x}px;top:${v.y}px;border-color:${p.color}">${escape(p.name)}${p.bot ? " · BOT" : ""}</span>`
              : "";
          })
          .join("");
      }
      audio.update(
        predicted,
        controls,
        playing && !document.hidden,
        selectedMap,
      );
    }
    requestAnimationFrame(tick);
    if (import.meta.env.DEV)
      window.__HAVOC__ = {
        get state() {
          return state;
        },
        get player() {
          return predicted;
        },
        get render() {
          return game.renderer.info.render;
        },
        get audio() {
          return {
            state: audio.ctx?.state,
            enabled: audio.enabled,
            voices: audio.active,
          };
        },
      };
    $("#loading").classList.add("finished");
    setTimeout(() => $("#loading").remove(), 500);
    const code = new URL(location.href).searchParams.get("room");
    if (code) joinDialog(code.slice(0, 6));
  } catch (e) {
    console.error(e);
    $("#loading").innerHTML =
      `<span class="brand">HAVOC/</span><p>WEBGL COULD NOT START</p><p style="max-width:380px;text-align:center;line-height:1.7;letter-spacing:1px">Enable hardware acceleration in your browser and reload. ${escape(e.message)}</p>`;
  }
}
boot();
