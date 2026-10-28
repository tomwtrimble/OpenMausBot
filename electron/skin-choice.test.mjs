import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSkinChoiceStore, showWhenSkinned } from "./skin-choice.mjs";

const dirs = [];
const folder = () => {
  const dir = mkdtempSync(join(tmpdir(), "skin-choice-"));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("the remembered skin choice", () => {
  it("has none before the renderer has sent one, and keeps what it sends for the next launch", () => {
    const file = join(folder(), "nested", "skin.json");
    const first = createSkinChoiceStore({ file: () => file, log: vi.fn() });
    expect(first.read()).toBe(null);
    first.remember("atelier");
    expect(first.read()).toBe("atelier");
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ choice: "atelier" });
    expect(createSkinChoiceStore({ file: () => file, log: vi.fn() }).read()).toBe("atelier");
    first.remember("system");
    expect(createSkinChoiceStore({ file: () => file, log: vi.fn() }).read()).toBe("system");
  });

  it("ignores a choice the renderer cannot make, and a file it cannot read", () => {
    const file = join(folder(), "skin.json");
    writeFileSync(file, "{ not json");
    const store = createSkinChoiceStore({ file: () => file, log: vi.fn() });
    expect(store.read()).toBe(null);
    store.remember("nope");
    store.remember(undefined);
    expect(readFileSync(file, "utf8")).toBe("{ not json");
  });

  it("says when the choice could not be saved, and still uses it for this run", () => {
    const dir = folder();
    writeFileSync(join(dir, "blocker"), "a file where the folder should be");
    const log = vi.fn();
    const store = createSkinChoiceStore({ file: () => join(dir, "blocker", "skin.json"), log });
    store.remember("pop");
    expect(store.read()).toBe("pop");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("skin choice save failed"));
  });
});

describe("a window that waits for its skin", () => {
  const fakeWindow = () => {
    const listeners = new Map();
    return {
      shown: 0, visible: false, destroyed: false, listeners,
      isDestroyed() { return this.destroyed; }, isVisible() { return this.visible; },
      show() { this.shown += 1; this.visible = true; listeners.get("show")?.(); },
      once(event, listener) { listeners.set(event, listener); },
    };
  };

  it("shows itself after the wait when the page never stamps a skin", () => {
    vi.useFakeTimers();
    try {
      const win = fakeWindow();
      showWhenSkinned(win, 100);
      vi.advanceTimersByTime(99);
      expect(win.shown).toBe(0);
      vi.advanceTimersByTime(1);
      expect(win.shown).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays as it is once the skin has shown it, or once it has closed", () => {
    vi.useFakeTimers();
    try {
      const shown = fakeWindow();
      showWhenSkinned(shown, 100);
      shown.show();
      vi.advanceTimersByTime(200);
      expect(shown.shown).toBe(1);
      const closed = fakeWindow();
      showWhenSkinned(closed, 100);
      closed.destroyed = true;
      closed.listeners.get("closed")();
      vi.advanceTimersByTime(200);
      expect(closed.shown).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
