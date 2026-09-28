import { clamp, neutralInput } from "../shared/game.js";

export const DEFAULT_BINDINGS = {
  forward: "KeyW",
  reverse: "KeyS",
  left: "KeyA",
  right: "KeyD",
  drift: "ShiftLeft",
  boost: "KeyE",
  fire: "Space",
};
export function validBindings(value) {
  if (!value || typeof value !== "object") return { ...DEFAULT_BINDINGS };
  const result = { ...DEFAULT_BINDINGS };
  for (const action of Object.keys(result))
    if (
      typeof value[action] === "string" &&
      /^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight|ControlLeft|AltLeft)$/.test(
        value[action],
      )
    )
      result[action] = value[action];
  return new Set(Object.values(result)).size === Object.keys(result).length
    ? result
    : { ...DEFAULT_BINDINGS };
}
export function gamepadInput(pad) {
  if (!pad || pad.connected === false || pad.mapping !== "standard")
    return neutralInput();
  const button = (i) => clamp(Number(pad.buttons?.[i]?.value) || 0, 0, 1),
    axis = Number(pad.axes?.[0]) || 0;
  const steer =
    Math.abs(axis) > 0.16
      ? (Math.sign(axis) * (Math.min(1, Math.abs(axis)) - 0.16)) / 0.84
      : button(15) - button(14);
  return {
    throttle: button(7) - button(6),
    steer,
    drift: button(2) > 0.5,
    boost: button(5) > 0.5,
    fire: button(0) > 0.5 || button(1) > 0.5,
  };
}
export const bindingLabel = (code) =>
  code
    .replace("Key", "")
    .replace("Digit", "")
    .replace("Left", "")
    .replace("Right", " R")
    .toUpperCase();
