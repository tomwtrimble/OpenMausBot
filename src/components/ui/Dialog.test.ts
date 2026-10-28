// @vitest-environment happy-dom
import { act, createElement, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement, root: Root, opener: HTMLButtonElement;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');
const named = (text: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find((node) => node.textContent === text)!;
const key = (name: string, shiftKey = false) => act(async () => {
  const event = new KeyboardEvent("keydown", { key: name, shiftKey, bubbles: true, cancelable: true });
  document.activeElement!.dispatchEvent(event);
  return event;
});

function Probe({ onClose, initial = false, portal = false }: { onClose: () => void; initial?: boolean; portal?: boolean }) {
  const [open, setOpen] = useState(true);
  const start = useRef<HTMLButtonElement>(null);
  const close = () => { onClose(); setOpen(false); };
  return createElement(Dialog, {
    open, onClose: close, "aria-label": "Rename", initialFocus: initial ? start : undefined, portal, className: "panel",
    children: [
      createElement("button", { key: "a", type: "button" }, "First"),
      createElement("button", { key: "b", type: "button", ref: start }, "Middle"),
      createElement("button", { key: "c", type: "button", onClick: close }, "Last"),
    ],
  });
}

beforeEach(() => {
  opener = document.createElement("button");
  opener.textContent = "Open";
  document.body.append(opener);
  opener.focus();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  opener.remove();
  document.body.innerHTML = "";
});

describe("Dialog", () => {
  it("renders nothing while closed", async () => {
    await act(async () => { root.render(createElement(Dialog, { open: false, onClose: () => {}, children: "x" })); });
    expect(dialog()).toBeNull();
  });

  it("is a labelled modal that takes focus on open", async () => {
    await act(async () => { root.render(createElement(Probe, { onClose: () => {} })); });
    expect(dialog()?.getAttribute("aria-modal")).toBe("true");
    expect(dialog()?.getAttribute("aria-label")).toBe("Rename");
    expect(dialog()?.className).toBe("panel");
    expect(document.activeElement).toBe(dialog());
  });

  it("starts on the control it is given", async () => {
    await act(async () => { root.render(createElement(Probe, { onClose: () => {}, initial: true })); });
    expect(document.activeElement).toBe(named("Middle"));
  });

  it("keeps Tab inside, both ways", async () => {
    await act(async () => { root.render(createElement(Probe, { onClose: () => {} })); });
    named("Last").focus();
    expect((await key("Tab")).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(named("First"));
    expect((await key("Tab", true)).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(named("Last"));
  });

  it("closes on Escape and gives focus back to the opener", async () => {
    const onClose = vi.fn();
    await act(async () => { root.render(createElement(Probe, { onClose })); });
    await key("Escape");
    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("closes on a press that starts on the backdrop, not on one inside", async () => {
    const onClose = vi.fn();
    await act(async () => { root.render(createElement(Probe, { onClose })); });
    await act(async () => { dialog()!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { dialog()!.parentElement!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("can render into <body>", async () => {
    await act(async () => { root.render(createElement(Probe, { onClose: () => {}, portal: true })); });
    expect(host.contains(dialog())).toBe(false);
    expect(dialog()?.parentElement?.parentElement).toBe(document.body);
  });

  it("returns focus to the given control when the opener has gone", async () => {
    const fallback = document.createElement("button");
    document.body.append(fallback);
    const returnFocus = { current: fallback };
    await act(async () => { root.render(createElement(Dialog, { onClose: () => {}, returnFocus, children: createElement("button", { type: "button" }, "OK") })); });
    opener.remove();
    await act(async () => { root.render(createElement(Dialog, { open: false, onClose: () => {}, returnFocus })); });
    expect(document.activeElement).toBe(fallback);
  });
});
