import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "../MenuMotion";

export type TooltipSide = "top" | "bottom" | "left" | "right";

/** Hover waits this long before the label shows; keyboard focus shows it at once. */
export const TOOLTIP_DELAY_MS = 500;
/** Moving from one tooltip to the next within this window shows the next at once, as native tooltips do. */
const WARM_MS = 300;
const GAP = 6;
const EDGE = 8;

let lastClosedAt = -Infinity;

/** When a key last moved focus. Focus a dialog or menu gives on open (autoFocus) is not a person tabbing to the
 * control, so it shows no label; focus that follows Tab or an arrow does. */
let navigatedAt = -Infinity;
const NAVIGATION_KEYS = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);
let listening = false;
function listenForNavigation() {
  if (listening || typeof window?.addEventListener !== "function") return;
  listening = true;
  window.addEventListener("keydown", (event) => { if (NAVIGATION_KEYS.has(event.key)) navigatedAt = Date.now(); }, true);
}
const NAVIGATION_WINDOW_MS = 1_000;

type Size = { width: number; height: number };
type Box = { left: number; top: number; right: number; bottom: number };

/** Where the label sits beside its trigger: on `side` when it fits, else the opposite side, always inside the window. */
export function tooltipPosition(trigger: Box, tip: Size, viewport: Size, side: TooltipSide): { left: number; top: number; side: TooltipSide } {
  const fits: Record<TooltipSide, boolean> = {
    top: trigger.top - GAP - tip.height >= EDGE,
    bottom: trigger.bottom + GAP + tip.height <= viewport.height - EDGE,
    left: trigger.left - GAP - tip.width >= EDGE,
    right: trigger.right + GAP + tip.width <= viewport.width - EDGE,
  };
  const opposite: Record<TooltipSide, TooltipSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  const placed = fits[side] || !fits[opposite[side]] ? side : opposite[side];
  const centerX = (trigger.left + trigger.right) / 2 - tip.width / 2;
  const centerY = (trigger.top + trigger.bottom) / 2 - tip.height / 2;
  const raw = {
    top: { left: centerX, top: trigger.top - GAP - tip.height },
    bottom: { left: centerX, top: trigger.bottom + GAP },
    left: { left: trigger.left - GAP - tip.width, top: centerY },
    right: { left: trigger.right + GAP, top: centerY },
  }[placed];
  const clamp = (value: number, size: number, limit: number) => Math.min(Math.max(value, EDGE), Math.max(EDGE, limit - size - EDGE));
  return { left: clamp(raw.left, tip.width, viewport.width), top: clamp(raw.top, tip.height, viewport.height), side: placed };
}

function keyboardFocus(element: Element): boolean {
  if (Date.now() - navigatedAt > NAVIGATION_WINDOW_MS) return false;
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  "aria-describedby"?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

export interface TooltipProps {
  /** What the label says. Empty, the trigger renders alone. */
  content: ReactNode;
  /** One element that takes a ref and focus: a button, a link. */
  children: ReactElement;
  side?: TooltipSide;
  delay?: number;
  disabled?: boolean;
}

/**
 * A short label for a control, in place of the native `title`: it shows after a hover delay or at once when the keyboard
 * moves focus to it, hides on Escape, a press or leaving, and names itself to assistive tech through `aria-describedby`
 * while it shows.
 */
export function Tooltip({ content, children, side = "bottom", delay = TOOLTIP_DELAY_MS, disabled = false }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number; side: TooltipSide } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = !disabled && content != null && content !== "" && content !== false;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const hide = useCallback(() => {
    clearTimer();
    setOpen((was) => {
      if (was) lastClosedAt = Date.now();
      return false;
    });
  }, []);
  const show = (now: boolean) => {
    if (!live) return;
    clearTimer();
    if (now || Date.now() - lastClosedAt < WARM_MS) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };

  useEffect(() => {
    listenForNavigation();
    return () => clearTimer();
  }, []);
  useEffect(() => { if (!live) hide(); }, [live, hide]);

  // Escape hides the label wherever focus is, before a dialog or menu around it sees the key.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      hide();
    };
    const onScroll = () => hide();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, hide]);

  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const trigger = triggerRef.current, tip = tipRef.current;
    if (!trigger || !tip) return;
    if (!trigger.isConnected) return hide();
    setPlace(tooltipPosition(trigger.getBoundingClientRect(), { width: tip.offsetWidth, height: tip.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }, side));
  }, [open, side, content, hide]);

  const own = children.props as TriggerProps;
  const setTrigger = (node: HTMLElement | null) => {
    triggerRef.current = node;
    const outer = own.ref;
    if (typeof outer === "function") outer(node);
    else if (outer) (outer as { current: HTMLElement | null }).current = node;
  };
  const describedBy = [own["aria-describedby"], open ? id : undefined].filter(Boolean).join(" ") || undefined;
  const trigger = cloneElement(children as ReactElement<TriggerProps>, {
    ref: setTrigger,
    "aria-describedby": describedBy,
    onPointerEnter: (event) => {
      own.onPointerEnter?.(event);
      if (event.pointerType !== "touch") show(false);
    },
    onPointerLeave: (event) => {
      own.onPointerLeave?.(event);
      hide();
    },
    onPointerDown: (event) => {
      own.onPointerDown?.(event);
      hide();
    },
    onFocus: (event) => {
      own.onFocus?.(event);
      if (keyboardFocus(event.currentTarget)) show(true);
    },
    onBlur: (event) => {
      own.onBlur?.(event);
      hide();
    },
    onKeyDown: (event) => {
      own.onKeyDown?.(event);
      // Enter or Space acts on the control; the label would only cover what it opens.
      if (event.key === "Enter" || event.key === " ") hide();
    },
  });

  return (
    <>
      {trigger}
      {open && live && typeof document !== "undefined" && createPortal(
        <div
          ref={tipRef}
          id={id}
          role="tooltip"
          data-side={place?.side ?? side}
          style={{ left: place?.left ?? 0, top: place?.top ?? 0, visibility: place ? undefined : "hidden" }}
          className={cn(
            "popover-surface pointer-events-none fixed z-[70] max-w-[280px] rounded-md border border-hairline bg-menu px-2 py-1 text-[12px] font-normal leading-4 text-ink shadow-md",
            !prefersReducedMotion() && "animate-[fade-in_120ms_ease-out]",
          )}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
