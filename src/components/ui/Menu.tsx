import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { popoverClosesOnKey, usePopoverDismiss } from "@/hooks/use-popover-dismiss";
import { useMenuMotion } from "../MenuMotion";
import { MENU_HEADING, MENU_ITEM, MENU_ITEM_SEPARATOR, MENU_SHEET, nextMenuIndex } from "../menu-recipe";

export type MenuPlacement = "below-start" | "below-end" | "above-start" | "above-end";
type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };
type Size = { width: number; height: number };

const GAP = 6;
const EDGE = 8;
/** A typed letter joins the search for this long. */
export const TYPEAHEAD_MS = 500;

/** Where the sheet sits: by its trigger on the side `placement` names, flipped when that side is short, or at a point
 * (a context menu), always inside the window. Start and end read the page's direction. */
export function menuPosition(anchor: Box | Point, menu: Size, viewport: Size, placement: MenuPlacement = "below-start", rtl = false): { left: number; top: number } {
  const box: Box = "x" in anchor ? { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y } : anchor;
  const point = "x" in anchor;
  const [vertical, align] = placement.split("-") as ["below" | "above", "start" | "end"];
  const gap = point ? 0 : GAP;
  const below = box.bottom + gap, above = box.top - gap - menu.height;
  const fitsBelow = below + menu.height <= viewport.height - EDGE, fitsAbove = above >= EDGE;
  const top = vertical === "below" ? (fitsBelow || !fitsAbove ? below : above) : (fitsAbove || !fitsBelow ? above : below);
  const leftEdge = point ? box.left : (align === "start") !== rtl ? box.left : box.right - menu.width;
  const clamp = (value: number, size: number, limit: number) => Math.min(Math.max(value, EDGE), Math.max(EDGE, limit - size - EDGE));
  return { left: clamp(leftEdge, menu.width, viewport.width), top: clamp(top, menu.height, viewport.height) };
}

/** The item a typed prefix lands on: the next one after `current` whose label starts with it, wrapping. */
export function typeaheadIndex(labels: readonly string[], prefix: string, current: number): number | null {
  const wanted = prefix.toLocaleLowerCase();
  if (!wanted) return null;
  // A repeated single letter steps through the items that start with it.
  const repeat = wanted.length > 1 && [...wanted].every((char) => char === wanted[0]);
  const needle = repeat ? wanted[0]! : wanted;
  const start = repeat || wanted.length === 1 ? current + 1 : Math.max(current, 0);
  for (let step = 0; step < labels.length; step++) {
    const index = (start + step) % labels.length;
    if (labels[index]!.trim().toLocaleLowerCase().startsWith(needle)) return index;
  }
  return null;
}

const items = (menu: HTMLElement | null) =>
  menu ? [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter((item) => !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true" && item.closest('[role="menu"]') === menu) : [];

const MenuContext = createContext<{ close: (refocus?: boolean) => void } | null>(null);

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  open: boolean;
  /** Escape, Tab, a press outside or a chosen item; `refocus` asks for focus back on the trigger. */
  onClose: (refocus: boolean) => void;
  /** The trigger the sheet hangs from, or the point a context menu opens at. */
  anchor: RefObject<HTMLElement | null> | Point;
  /** The menu's accessible name. */
  label: string;
  placement?: MenuPlacement;
  /** Lands focus on the first item on open (a keyboard open); a pointer open leaves it on the trigger. */
  autoFocus?: boolean;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

/**
 * A popover menu on the shared menu recipe (MENU_SHEET: 14px corners, the one floating surface): arrow keys, Home and End
 * move between items, a typed letter jumps to the item it starts, Escape closes and returns focus to the trigger,
 * Tab closes, and a press outside dismisses. It renders into <body>, placed by its anchor.
 */
export function Menu({ open, onClose, anchor, label, placement = "below-start", autoFocus = false, ref, className, style, children, onKeyDown, ...rest }: MenuProps) {
  const motion = useMenuMotion(open);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const anchorElement = () => ("current" in anchor ? anchor.current : null);

  const close = (refocus = false) => {
    onCloseRef.current(refocus);
    if (refocus) anchorElement()?.focus();
  };
  const inside = useRef<{ contains: (target: unknown) => boolean } | null>(null);
  inside.current = { contains: (target) => [sheetRef.current, anchorElement()].some((node) => node?.contains(target as Node)) };
  usePopoverDismiss(open, inside, () => close(false));

  const pointKey = "x" in anchor ? `${anchor.x},${anchor.y}` : "";
  useLayoutEffect(() => {
    if (!motion.shown) {
      setPosition(null);
      return;
    }
    const place = () => {
      const sheet = sheetRef.current;
      const from = "x" in anchor ? anchor : anchor.current?.getBoundingClientRect();
      if (!sheet || !from) return;
      const rtl = typeof getComputedStyle === "function" && getComputedStyle(sheet).direction === "rtl";
      setPosition(menuPosition(from, { width: sheet.offsetWidth, height: sheet.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, placement, rtl));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
    // The point's coordinates, not the object, decide a re-place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion.shown, placement, pointKey]);

  // Focus waits until the sheet is placed: a hidden sheet cannot take it.
  useEffect(() => {
    if (open && autoFocus && position) items(sheetRef.current)[0]?.focus();
  }, [open, autoFocus, position]);

  const onKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const list = items(event.currentTarget);
    const current = list.indexOf(document.activeElement as HTMLElement);
    const next = nextMenuIndex(event.key, current, list.length);
    if (next != null) {
      event.preventDefault();
      list[next]?.focus();
      return;
    }
    if (popoverClosesOnKey({ key: event.key, defaultPrevented: false, isComposing: event.nativeEvent.isComposing })) {
      // The menu, not the dialog or panel around it, owns this Escape.
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && /\S/.test(event.key)) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : "") + event.key, at: now };
      const index = typeaheadIndex(list.map((item) => item.textContent ?? ""), typed.current.text, current);
      if (index != null) {
        event.preventDefault();
        list[index]?.focus();
      }
    }
  };

  const setRef = (node: HTMLDivElement | null) => {
    sheetRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  if (!motion.shown || typeof document === "undefined") return null;
  return createPortal(
    <MenuContext.Provider value={{ close }}>
      <div
        ref={setRef}
        role="menu"
        aria-label={label}
        {...motion.exitProps}
        {...rest}
        onKeyDown={onKey}
        style={{ position: "fixed", left: position?.left ?? 0, top: position?.top ?? 0, maxHeight: `calc(100vh - ${EDGE * 2}px)`, visibility: position ? undefined : "hidden", ...style }}
        className={cn(MENU_SHEET, "z-[60] overflow-y-auto", motion.className, className)}
      >
        {children}
      </div>
    </MenuContext.Provider>,
    document.body,
  );
}

export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  icon?: ReactNode;
  /** a count, a shortcut, a chevron: after the label */
  trailing?: ReactNode;
  /** The chosen one of a set: the active fill. */
  active?: boolean;
  /** Runs on a click or Enter; the menu then closes unless `keepOpen`. */
  onSelect?: () => void;
  keepOpen?: boolean;
  role?: "menuitem" | "menuitemradio" | "menuitemcheckbox";
  ref?: Ref<HTMLButtonElement>;
}

/** One 30px row (MENU_ITEM): a visible hover, keyboard focus shown as the same fill. */
export function MenuItem({ icon, trailing, active = false, onSelect, keepOpen = false, role = "menuitem", className, children, onClick, ref, ...rest }: MenuItemProps) {
  const menu = useContext(MenuContext);
  return (
    <button
      ref={ref}
      type="button"
      role={role}
      aria-checked={role === "menuitem" ? undefined : active}
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onSelect?.();
        // A click from Enter or Space (detail 0) hands focus back to the trigger.
        if (!keepOpen) menu?.close(event.detail === 0);
      }}
      className={cn(MENU_ITEM, "text-ink focus-visible:outline-none disabled:opacity-60", active ? "bg-menu-active" : "hover:bg-menu-hover", className)}
      {...rest}
    >
      {icon && <span aria-hidden className={cn("flex size-4 shrink-0 items-center justify-center [&>svg]:size-4", active ? "text-accent-text" : "text-ink-secondary")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </button>
  );
}

export function MenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn(MENU_ITEM_SEPARATOR, className)} />;
}

export function MenuHeading({ className, children }: { className?: string; children: ReactNode }) {
  return <div role="presentation" className={cn(MENU_HEADING, className)}>{children}</div>;
}
