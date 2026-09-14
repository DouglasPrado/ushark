import { useEffect, useRef, useState } from "react";

export type Direction = "left" | "right" | "up" | "down";
export type Action = Direction | "confirm" | "back";
export type InputMode = "keyboard" | "remote" | "gamepad" | "disconnected";

const focusableSelector = [
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "summary",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const directionKeys: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Left: "left",
  Right: "right",
  Up: "up",
  Down: "down",
};

const backKeys = new Set([
  "Escape",
  "Esc",
  "Backspace",
  "BrowserBack",
  "GoBack",
  "Back",
]);

const confirmKeys = new Set(["Enter", "Accept", "Select", " "]);

const legacyRemoteKeyCodes: Record<number, Action> = {
  8: "back",
  13: "confirm",
  27: "back",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  461: "back",
  10009: "back",
};

export function remoteActionForKey(
  key: string,
  legacyKeyCode = 0,
): Action | null {
  if (directionKeys[key]) return directionKeys[key];
  if (backKeys.has(key)) return "back";
  if (confirmKeys.has(key)) return "confirm";
  return legacyRemoteKeyCodes[legacyKeyCode] ?? null;
}

export function gamepadAction(
  pad: Pick<Gamepad, "buttons" | "axes">,
): Action | null {
  const pressed = (index: number) =>
    !!pad.buttons[index] &&
    (pad.buttons[index].pressed || pad.buttons[index].value > 0.5);
  if (pressed(1)) return "back";
  if (pressed(0)) return "confirm";
  if (pressed(12) || (pad.axes[1] ?? 0) < -0.62) return "up";
  if (pressed(13) || (pad.axes[1] ?? 0) > 0.62) return "down";
  if (pressed(14) || (pad.axes[0] ?? 0) < -0.62) return "left";
  if (pressed(15) || (pad.axes[0] ?? 0) > 0.62) return "right";
  return null;
}

const visible = (element: HTMLElement) =>
  element.getClientRects().length > 0 &&
  element.getAttribute("aria-hidden") !== "true" &&
  !element.closest("[inert]");

const navigationScope = () => {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ).filter(visible);
  return dialogs.at(-1) ?? document;
};

const navigationItems = (scope: Document | HTMLElement = navigationScope()) =>
  Array.from(scope.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    visible,
  );

const explicitNeighbor = (
  active: HTMLElement,
  action: Direction,
  items: HTMLElement[],
) => {
  const property = `nav${action[0].toUpperCase()}${action.slice(1)}`;
  const reference = active.dataset[property];
  if (!reference) return undefined;
  const byId = document.getElementById(reference);
  if (byId instanceof HTMLElement && items.includes(byId)) return byId;
  try {
    const bySelector = navigationScope().querySelector(reference);
    return bySelector instanceof HTMLElement && items.includes(bySelector)
      ? bySelector
      : undefined;
  } catch {
    return undefined;
  }
};

const crossOverlap = (
  from: DOMRect,
  candidate: DOMRect,
  horizontal: boolean,
) => {
  const start = Math.max(
    horizontal ? from.top : from.left,
    horizontal ? candidate.top : candidate.left,
  );
  const end = Math.min(
    horizontal ? from.bottom : from.right,
    horizontal ? candidate.bottom : candidate.right,
  );
  return Math.max(0, end - start);
};

const spatialScore = (from: DOMRect, candidate: DOMRect, action: Direction) => {
  const horizontal = action === "left" || action === "right";
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const candidateX = candidate.left + candidate.width / 2;
  const candidateY = candidate.top + candidate.height / 2;
  const deltaX = candidateX - fromX;
  const deltaY = candidateY - fromY;
  const primary =
    action === "left"
      ? -deltaX
      : action === "right"
        ? deltaX
        : action === "up"
          ? -deltaY
          : deltaY;
  if (primary <= 4) return Infinity;

  const cross = horizontal ? Math.abs(deltaY) : Math.abs(deltaX);
  const overlap = crossOverlap(from, candidate, horizontal);
  const crossSize = Math.min(
    horizontal ? from.height : from.width,
    horizontal ? candidate.height : candidate.width,
  );
  const inLane = overlap >= Math.min(24, crossSize * 0.25);
  const edgeGap = Math.max(
    0,
    action === "left"
      ? from.left - candidate.right
      : action === "right"
        ? candidate.left - from.right
        : action === "up"
          ? from.top - candidate.bottom
          : candidate.top - from.bottom,
  );

  // Prefer the current row/column before accepting a diagonal jump.
  return (
    edgeGap +
    primary * 0.2 +
    cross * (inLane ? 0.22 : 2.8) +
    (inLane ? 0 : 1_000)
  );
};

const revealFocus = (
  element: HTMLElement,
  action: Direction | undefined,
  scope: Document | HTMLElement,
  items: HTMLElement[],
) => {
  element.focus({ preventScroll: true });
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const firstButton = items.find((item) => item instanceof HTMLButtonElement);
  if (element === firstButton) {
    const options: ScrollToOptions = {
      top: 0,
      behavior: reduced ? "auto" : "smooth",
    };
    if (scope instanceof HTMLElement) scope.scrollTo(options);
    else window.scrollTo(options);
    return;
  }
  const horizontalGroup = element.closest<HTMLElement>(
    '[data-nav-axis="horizontal"]',
  );
  element.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "nearest",
    inline:
      horizontalGroup && (action === "left" || action === "right")
        ? "center"
        : "nearest",
  });
};

export function moveFocus(action: Direction) {
  const scope = navigationScope();
  const allItems = navigationItems(scope);
  const active = document.activeElement as HTMLElement;
  const from = active?.getBoundingClientRect();
  if (!from || !allItems.includes(active)) {
    const initial =
      scope.querySelector<HTMLElement>("[data-nav-initial]") ?? allItems[0];
    if (initial) revealFocus(initial, action, scope, allItems);
    return initial;
  }

  const explicit = explicitNeighbor(active, action, allItems);
  if (explicit) {
    revealFocus(explicit, action, scope, allItems);
    return explicit;
  }

  const group = active.closest<HTMLElement>("[data-nav-axis]");
  const groupAxis = group?.dataset.navAxis;
  const groupMatches =
    (groupAxis === "horizontal" && (action === "left" || action === "right")) ||
    (groupAxis === "vertical" && (action === "up" || action === "down"));
  const items =
    groupMatches && group
      ? allItems.filter((item) => group.contains(item))
      : allItems;
  const target = items
    .filter((item) => item !== active)
    .map((item, index) => ({
      item,
      index,
      score: spatialScore(from, item.getBoundingClientRect(), action),
    }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)[0]?.item;

  if (target) revealFocus(target, action, scope, allItems);
  return target;
}

const editingText = (element: Element | null) => {
  if (element instanceof HTMLTextAreaElement) return true;
  if (!(element instanceof HTMLInputElement))
    return element instanceof HTMLElement && element.isContentEditable;
  return !["button", "checkbox", "radio", "range", "reset", "submit"].includes(
    element.type,
  );
};

const adjustNativeControl = (active: Element | null, action: Direction) => {
  if (action !== "left" && action !== "right") return false;
  const increment = action === "right" ? 1 : -1;
  if (active instanceof HTMLSelectElement && !active.disabled) {
    const options = Array.from(active.options).filter(
      (option) => !option.disabled,
    );
    const index = options.findIndex((option) => option.value === active.value);
    const next = options[index + increment];
    if (next) {
      active.value = next.value;
      active.dispatchEvent(new Event("input", { bubbles: true }));
      active.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }
  if (
    active instanceof HTMLInputElement &&
    active.type === "range" &&
    !active.disabled
  ) {
    const step = Number(active.step) || 1;
    const nextValue = Math.min(
      Number(active.max) || 100,
      Math.max(
        Number(active.min) || 0,
        Number(active.value) + increment * step,
      ),
    );
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(active, String(nextValue));
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
};

export function useNavigation(back: () => void, enabled = true, layer?: "tv") {
  const callback = useRef(back);
  callback.current = back;
  const [input, setInput] = useState<InputMode>("keyboard");
  useEffect(() => {
    if (!enabled) return;
    const blockedByTvLayer = () =>
      !!document.querySelector(".tv-session-dialog") && layer !== "tv";
    const run = (action: Action) => {
      if (blockedByTvLayer()) return;
      const active = document.activeElement;
      if (
        (action === "left" || action === "right") &&
        adjustNativeControl(active, action)
      )
        return;
      if (action === "back") callback.current();
      else if (action === "confirm") (active as HTMLElement | null)?.click?.();
      else moveFocus(action);
    };
    const key = (event: KeyboardEvent) => {
      if (blockedByTvLayer() || event.defaultPrevented) return;
      const action = remoteActionForKey(event.key, event.keyCode);
      const active = document.activeElement;
      if (!action) {
        if (event.key === "Tab" || editingText(event.target as Element))
          setInput("keyboard");
        return;
      }
      if (editingText(event.target as Element) && action !== "back") {
        setInput("keyboard");
        return;
      }
      if (
        action === "back" &&
        event.key === "Backspace" &&
        editingText(event.target as Element)
      )
        return;
      if (action === "confirm" && active instanceof HTMLSelectElement) return;
      if (event.repeat && (action === "confirm" || action === "back")) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      setInput("remote");
      run(action);
    };
    const connect = () => setInput("gamepad");
    const disconnect = () => setInput("disconnected");
    let frame = 0;
    let last: Action | null = null;
    let nextRepeat = 0;
    const poll = (time: number) => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      const action = pad ? gamepadAction(pad) : null;
      if (action && (action !== last || time >= nextRepeat)) {
        setInput("gamepad");
        run(action);
        const firstPress = action !== last;
        nextRepeat = time + (firstPress ? 260 : 90);
        if (action === "confirm" || action === "back") nextRepeat = Infinity;
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
  }, [enabled, layer]);
  return input;
}
