import { useEffect, useRef, useState } from "react";
export type Action = "left" | "right" | "up" | "down" | "confirm" | "back";
export function gamepadAction(
  pad: Pick<Gamepad, "buttons" | "axes">,
): Action | null {
  const pressed = (i: number) => pad.buttons[i]?.pressed;
  if (pressed(1)) return "back";
  if (pressed(0)) return "confirm";
  if (pressed(12) || pad.axes[1] < -0.6) return "up";
  if (pressed(13) || pad.axes[1] > 0.6) return "down";
  if (pressed(14) || pad.axes[0] < -0.6) return "left";
  if (pressed(15) || pad.axes[0] > 0.6) return "right";
  return null;
}
export function moveFocus(action: Action) {
  const scope = document.querySelector('[role="dialog"]') ?? document;
  const items = Array.from(
    scope.querySelectorAll<HTMLElement>(
      "button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]",
    ),
  ).filter((el) => el.getClientRects().length > 0);
  const active = document.activeElement as HTMLElement;
  const from = active?.getBoundingClientRect();
  if (!from || !items.includes(active)) {
    items[0]?.focus();
    return;
  }
  const x = from.x + from.width / 2,
    y = from.y + from.height / 2;
  const ranked = items
    .filter((el) => el !== active)
    .map((el) => {
      const b = el.getBoundingClientRect();
      const dx = b.x + b.width / 2 - x,
        dy = b.y + b.height / 2 - y;
      const primary =
        action === "left"
          ? -dx
          : action === "right"
            ? dx
            : action === "up"
              ? -dy
              : dy;
      const cross =
        action === "left" || action === "right" ? Math.abs(dy) : Math.abs(dx);
      return { el, score: primary > 5 ? primary + cross * 3 : Infinity };
    })
    .sort((a, b) => a.score - b.score);
  if (ranked[0]?.score < Infinity) {
    ranked[0].el.focus();
    ranked[0].el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}
export function useNavigation(back: () => void) {
  const callback = useRef(back);
  callback.current = back;
  const [input, setInput] = useState("keyboard");
  useEffect(() => {
    const run = (action: Action) => {
      if (action === "back") callback.current();
      else if (action === "confirm")
        (document.activeElement as HTMLElement)?.click();
      else moveFocus(action);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callback.current();
        return;
      }
      if ((e.target as HTMLElement).matches("input,select,textarea")) return;
      const action = (
        {
          ArrowLeft: "left",
          ArrowRight: "right",
          ArrowUp: "up",
          ArrowDown: "down",
        } as Record<string, Action>
      )[e.key];
      if (action) {
        e.preventDefault();
        run(action);
      }
    };
    const connect = () => setInput("gamepad");
    const disconnect = () => setInput("disconnected");
    let frame = 0,
      last: Action | null = null,
      next = 0;
    const poll = (time: number) => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      const action = pad ? gamepadAction(pad) : null;
      if (action && (action !== last || time >= next)) {
        setInput("gamepad");
        run(action);
        next = time + (action !== last ? 380 : 150);
        if (action === "confirm" || action === "back") next = Infinity;
      }
      last = action;
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    window.addEventListener("keydown", key);
    window.addEventListener("gamepadconnected", connect);
    window.addEventListener("gamepaddisconnected", disconnect);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", key);
      window.removeEventListener("gamepadconnected", connect);
      window.removeEventListener("gamepaddisconnected", disconnect);
    };
  }, []);
  return input;
}
