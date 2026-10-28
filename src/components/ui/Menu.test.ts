// @vitest-environment happy-dom
import { act, createElement, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MENU_ITEM, MENU_SHEET } from "../menu-recipe";
import { Menu, MenuItem, MenuSeparator, menuPosition, typeaheadIndex } from "./Menu";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("menuPosition", () => {
  const viewport = { width: 800, height: 600 };
  const menu = { width: 200, height: 120 };
  const trigger = { left: 100, right: 132, top: 100, bottom: 132 };
  it("hangs below its trigger from the start edge, or the end edge", () => {
    expect(menuPosition(trigger, menu, viewport, "below-start")).toEqual({ left: 100, top: 138 });
    expect(menuPosition({ ...trigger, left: 500, right: 532 }, menu, viewport, "below-end")).toEqual({ left: 332, top: 138 });
  });
  it("flips above when there is no room below, and mirrors in right-to-left", () => {
    expect(menuPosition({ left: 100, right: 132, top: 540, bottom: 572 }, menu, viewport, "below-start")).toEqual({ left: 100, top: 414 });
    expect(menuPosition({ ...trigger, left: 500, right: 532 }, menu, viewport, "below-start", true)).toEqual({ left: 332, top: 138 });
  });
  it("opens a context menu at the pointer, kept inside the window", () => {
    expect(menuPosition({ x: 300, y: 200 }, menu, viewport)).toEqual({ left: 300, top: 200 });
    expect(menuPosition({ x: 790, y: 590 }, menu, viewport)).toEqual({ left: 592, top: 470 });
  });
});

describe("typeaheadIndex", () => {
  const labels = ["Rename", "Pin", "Copy link", "Archive", "Pause"];
  it("jumps to the next item a typed prefix starts", () => {
    expect(typeaheadIndex(labels, "c", 0)).toBe(2);
    expect(typeaheadIndex(labels, "pa", 0)).toBe(4);
    expect(typeaheadIndex(labels, "zz", 0)).toBeNull();
  });
  it("steps through items that share a letter when it is pressed again", () => {
    expect(typeaheadIndex(labels, "p", 1)).toBe(4);
    expect(typeaheadIndex(labels, "pp", 4)).toBe(1);
  });
});

describe("Menu", () => {
  let host: HTMLDivElement, root: Root;
  const onSelect = vi.fn();
  const sheet = () => document.querySelector<HTMLElement>('[role="menu"]');
  const items = () => [...document.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]')];
  const trigger = () => host.querySelector<HTMLButtonElement>("[data-trigger]")!;
  const key = (name: string) => act(async () => {
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  });

  function Probe({ keyboard = true }: { keyboard?: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);
    return createElement("div", null,
      createElement("button", { ref, type: "button", "data-trigger": "", onClick: () => setOpen(!open) }, "More"),
      createElement(Menu, { open, onClose: () => setOpen(false), anchor: ref, label: "Row actions", autoFocus: keyboard },
        createElement(MenuItem, { onSelect: () => onSelect("rename") }, "Rename"),
        createElement(MenuItem, { onSelect: () => onSelect("pin"), disabled: true }, "Pin"),
        createElement(MenuSeparator),
        createElement(MenuItem, { onSelect: () => onSelect("copy") }, "Copy link"),
        createElement(MenuItem, { onSelect: () => onSelect("archive"), active: true, role: "menuitemradio" }, "Archive"),
      ));
  }

  beforeEach(async () => {
    // Closed menus leave at once instead of fading out.
    document.documentElement.dataset.reducedMotion = "true";
    onSelect.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => { root.render(createElement(Probe)); });
    trigger().focus();
    await act(async () => { trigger().click(); });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    document.body.innerHTML = "";
    delete document.documentElement.dataset.reducedMotion;
    vi.restoreAllMocks();
  });

  it("is a labelled sheet on the #3657 recipe, its rows 30px items", () => {
    expect(sheet()?.getAttribute("aria-label")).toBe("Row actions");
    for (const cls of MENU_SHEET.split(" ")) expect(sheet()!.classList).toContain(cls);
    for (const cls of MENU_ITEM.split(" ")) expect(items()[0]!.classList).toContain(cls);
    expect(items()[0]!.className).toContain("hover:bg-menu-hover");
    expect(items()[1]!.disabled).toBe(true);
    expect(items()[3]!.className).toContain("bg-menu-active");
    expect(items()[3]!.getAttribute("aria-checked")).toBe("true");
  });

  it("lands on the first item and moves with the arrows, Home and End, past disabled items", async () => {
    expect(document.activeElement).toBe(items()[0]);
    await key("ArrowDown");
    expect(document.activeElement?.textContent).toBe("Copy link");
    await key("End");
    expect(document.activeElement?.textContent).toBe("Archive");
    await key("ArrowDown");
    expect(document.activeElement?.textContent).toBe("Rename");
    await key("ArrowUp");
    expect(document.activeElement?.textContent).toBe("Archive");
    await key("Home");
    expect(document.activeElement?.textContent).toBe("Rename");
  });

  it("jumps to an item by its first letters, and starts a new search after a pause", async () => {
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    await key("a");
    expect(document.activeElement?.textContent).toBe("Archive");
    now += 100;
    await key("c");
    expect(document.activeElement?.textContent).toBe("Archive");
    now += 1_000;
    await key("c");
    expect(document.activeElement?.textContent).toBe("Copy link");
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    await key("Escape");
    expect(sheet()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes on Tab", async () => {
    await key("Tab");
    expect(sheet()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("runs the chosen item and closes", async () => {
    await act(async () => { items()[2]!.click(); });
    expect(onSelect).toHaveBeenCalledWith("copy");
    expect(sheet()).toBeNull();
  });

  it("closes on a press outside, but not on one on its trigger", async () => {
    await act(async () => { trigger().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); });
    expect(sheet()).not.toBeNull();
    await act(async () => { document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); });
    expect(sheet()).toBeNull();
  });

  it("owns Escape while open, even with focus left on its trigger, before a dialog around it sees the key", async () => {
    trigger().focus();
    const outer = vi.fn();
    window.addEventListener("keydown", outer);
    await act(async () => { trigger().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    window.removeEventListener("keydown", outer);
    expect(sheet()).toBeNull();
    expect(outer).not.toHaveBeenCalled();
  });
});

describe("Menu with a field inside", () => {
  it("leaves a field's own keys alone", async () => {
    document.documentElement.dataset.reducedMotion = "true";
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(Menu, { open: true, onClose: () => {}, anchor: { x: 10, y: 10 }, label: "Room" },
        createElement("input", { "aria-label": "Name" }),
        createElement(MenuItem, null, "Archive")));
    });
    const field = document.querySelector("input")!;
    field.focus();
    const event = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    await act(async () => { field.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(field);
    await act(async () => root.unmount());
    host.remove();
    delete document.documentElement.dataset.reducedMotion;
  });
});
