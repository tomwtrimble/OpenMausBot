// @vitest-environment happy-dom
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IconButton } from "./IconButton";
import { Tooltip, TOOLTIP_DELAY_MS, tooltipPosition } from "./Tooltip";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("tooltipPosition", () => {
  const viewport = { width: 800, height: 600 };
  const tip = { width: 80, height: 24 };
  it("centres the label under its trigger", () => {
    expect(tooltipPosition({ left: 100, right: 132, top: 100, bottom: 132 }, tip, viewport, "bottom")).toEqual({ left: 76, top: 138, side: "bottom" });
  });
  it("flips to the other side when its own side is short, and stays inside the window", () => {
    expect(tooltipPosition({ left: 0, right: 32, top: 570, bottom: 598 }, tip, viewport, "bottom")).toEqual({ left: 8, top: 540, side: "top" });
    expect(tooltipPosition({ left: 760, right: 792, top: 100, bottom: 132 }, tip, viewport, "right").side).toBe("left");
  });
});

describe("Tooltip", () => {
  let host: HTMLDivElement, root: Root;
  const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');
  const button = () => host.querySelector("button")!;
  // React builds enter and leave from over and out.
  const native = { pointerenter: "pointerover", pointerleave: "pointerout" } as Record<string, string>;
  const pointer = (type: string) => act(async () => {
    button().dispatchEvent(new PointerEvent(native[type] ?? type, { bubbles: true, pointerType: "mouse" }));
  });
  // A person tabbing: focus that follows Tab shows the label at once.
  const tabTo = (element: HTMLElement) => act(async () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    element.focus();
  });
  const render = (props: Partial<Parameters<typeof Tooltip>[0]> = {}) => act(async () => {
    root.render(createElement(Tooltip, { content: "Close", children: createElement("button", { type: "button", "aria-label": "Close" }, "×"), ...props }));
  });

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.useRealTimers();
    delete document.documentElement.dataset.reducedMotion;
  });

  it("waits out the hover delay, then labels the trigger through aria-describedby", async () => {
    await render();
    await pointer("pointerenter");
    expect(tooltip()).toBeNull();
    await act(async () => { vi.advanceTimersByTime(TOOLTIP_DELAY_MS - 1); });
    expect(tooltip()).toBeNull();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(tooltip()?.textContent).toBe("Close");
    expect(button().getAttribute("aria-describedby")).toBe(tooltip()!.id);
    await pointer("pointerleave");
    expect(tooltip()).toBeNull();
    expect(button().hasAttribute("aria-describedby")).toBe(false);
  });

  it("shows at once when Tab brings focus, and hides on blur", async () => {
    await render();
    await tabTo(button());
    expect(tooltip()?.textContent).toBe("Close");
    await act(async () => { button().blur(); });
    expect(tooltip()).toBeNull();
  });

  it("hides on Escape before anything around it sees the key", async () => {
    await render();
    await tabTo(button());
    const outer = vi.fn();
    window.addEventListener("keydown", outer);
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    await act(async () => { button().dispatchEvent(event); });
    window.removeEventListener("keydown", outer);
    expect(tooltip()).toBeNull();
    expect(event.defaultPrevented).toBe(true);
    expect(outer).not.toHaveBeenCalled();
    // focus stays where it was
    expect(document.activeElement).toBe(button());
  });

  it("shows nothing for focus a dialog gives on open, with no key behind it", async () => {
    await render();
    vi.advanceTimersByTime(5_000);
    await act(async () => { button().focus(); });
    expect(tooltip()).toBeNull();
  });

  it("hides when the trigger is pressed", async () => {
    await render();
    await tabTo(button());
    await pointer("pointerdown");
    expect(tooltip()).toBeNull();
  });

  it("fades in, unless motion is reduced", async () => {
    await render();
    await tabTo(button());
    expect(tooltip()!.className).toContain("animate-[fade-in");
    await act(async () => { button().blur(); });
    document.documentElement.dataset.reducedMotion = "true";
    await tabTo(button());
    expect(tooltip()!.className).not.toContain("animate-");
  });

  it("keeps the trigger's own handlers and describedby", async () => {
    const onFocus = vi.fn();
    await render({ children: createElement("button", { type: "button", onFocus, "aria-describedby": "hint" }, "×") });
    await tabTo(button());
    expect(onFocus).toHaveBeenCalledOnce();
    expect(button().getAttribute("aria-describedby")).toBe(`hint ${tooltip()!.id}`);
  });

  it("shows nothing when disabled or empty", async () => {
    await render({ disabled: true });
    await tabTo(button());
    expect(tooltip()).toBeNull();
    await render({ content: "" });
    await act(async () => { button().blur(); });
    await tabTo(button());
    expect(tooltip()).toBeNull();
  });
});

describe("IconButton", () => {
  it("names the button and drops the native title", () => {
    const markup = renderToStaticMarkup(createElement(IconButton, { label: "Close", children: "×" }));
    expect(markup).toBe('<button type="button" aria-label="Close" class="ui-icon-button">×</button>');
  });

  it("keeps a call site's own look when it brings one", () => {
    const markup = renderToStaticMarkup(createElement(IconButton, { label: "Close", className: "size-8 rounded-full", children: "×" }));
    expect(markup).toContain('class="size-8 rounded-full"');
  });

  it("shows its label as the tooltip, or a longer tooltip when given", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => { root.render(createElement(IconButton, { label: "Close", tooltip: "Close (Esc)", children: "×" })); });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      host.querySelector("button")!.focus();
    });
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe("Close (Esc)");
    expect(host.querySelector("button")!.getAttribute("aria-label")).toBe("Close");
    await act(async () => root.unmount());
    host.remove();
    vi.useRealTimers();
  });
});
