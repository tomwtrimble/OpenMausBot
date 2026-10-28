// @vitest-environment happy-dom
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Button, buttonClass } from "./Button";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const html = (props: Parameters<typeof Button>[0]) => renderToStaticMarkup(createElement(Button, props));
const classes = (markup: string) => /class="([^"]*)"/.exec(markup)![1]!.split(" ");

describe("Button", () => {
  it("draws the shared control: a quiet secondary by default, a plain button unless asked to submit", () => {
    const markup = html({ children: "Save" });
    expect(classes(markup)).toEqual(["ui-button"]);
    expect(markup).toContain('type="button"');
    expect(html({ type: "submit", children: "Save" })).toContain('type="submit"');
  });

  it("names each variant by the class styles.css paints: the ink pill in Simple and the accent elsewhere come from one class", () => {
    expect(classes(html({ variant: "primary", children: "Go" }))).toEqual(["ui-button", "ui-button-primary"]);
    expect(classes(html({ variant: "ghost", children: "Cancel" }))).toEqual(["ui-button", "ui-button-ghost"]);
    expect(classes(html({ variant: "danger", children: "Delete" }))).toEqual(["ui-button", "ui-button-danger"]);
  });

  it("steps down the control scale and rounds into a pill", () => {
    expect(buttonClass({ size: "md" })).toBe("ui-button ui-button-md");
    expect(buttonClass({ size: "sm", pill: true })).toBe("ui-button ui-button-sm ui-button-pill");
    expect(buttonClass({ size: "lg" })).toBe("ui-button ui-button-lg");
  });

  it("keeps a call site's placement classes and lets them win over the recipe", () => {
    expect(buttonClass({ variant: "primary", className: "mt-4 w-full" })).toBe("ui-button ui-button-primary mt-4 w-full");
  });

  it("disables natively, so styles.css gives the disabled colours", () => {
    expect(html({ variant: "primary", disabled: true, children: "Go" })).toContain('disabled=""');
  });

  it("marks a busy button and shows a spinner before the label, without the disabled colours", () => {
    const markup = html({ variant: "primary", loading: true, children: "Saving" });
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('data-loading=""');
    expect(markup).not.toContain('disabled=""');
    expect(markup).toMatch(/<svg[^>]*ui-button-spinner[^>]*motion-reduce:animate-none/);
    expect(markup.indexOf("<svg")).toBeLessThan(markup.indexOf("Saving"));
  });
});

describe("Button presses", () => {
  let host: HTMLDivElement, root: Root;
  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it("runs onClick, and ignores presses while loading", async () => {
    const onClick = vi.fn();
    await act(async () => { root.render(createElement(Button, { onClick, children: "Save" })); });
    host.querySelector("button")!.click();
    expect(onClick).toHaveBeenCalledOnce();
    await act(async () => { root.render(createElement(Button, { onClick, loading: true, children: "Save" })); });
    host.querySelector("button")!.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards its ref to the button", async () => {
    const ref = { current: null as HTMLButtonElement | null };
    await act(async () => { root.render(createElement(Button, { ref, children: "Save" })); });
    expect(ref.current).toBe(host.querySelector("button"));
  });
});
