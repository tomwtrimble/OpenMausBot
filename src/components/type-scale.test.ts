import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TYPE_SCALE } from "@/theme/tokens/type";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRACTIONAL_SIZE = /text-\[\d+\.\d+px\]|font-size:\s*\d+\.\d+px|fontSize:\s*\d+\.\d+(?![\d.])/g;
/** A size the scale does not name: `text-[13px]`, or a stylesheet's `font-size: 13px`. */
const OFF_SCALE_SIZE = /(?<![\w-])text-\[(\d+(?:\.\d+)?px)\]|font-size:\s*(\d+(?:\.\d+)?px)/g;
/** Tailwind's own steps (`text-sm`, `md:text-lg`): the product scale replaces them. */
const TAILWIND_SIZE = /(?<=[\s"'`:!{(])text-(?:xs|sm|base|lg|[2-9]?xl)(?=[\s"'`!}),])/g;

/** Text that is drawn rather than read, sized to something other than the reader. Each size still has to occur. */
const ALLOWED: Record<string, { sizes: readonly string[] | "any"; why: string }> = {
  "components/widget/widget-style.ts": { sizes: "any", why: "a widget's sizes come from the widget schema a bot writes" },
  "components/cloud-buy/ChooseScreen.tsx": { sizes: ["28px"], why: "the plan's price, set as display type" },
  "components/onboarding/MeetScreen.tsx": { sizes: ["28px"], why: "the first run's welcome line, set as display type" },
  "components/StackedMauses.tsx": { sizes: ["9px"], why: "the +N inside a 16px avatar" },
  "components/RoutineCalendarPage.tsx": { sizes: ["8px", "9px", "10px"], why: "the time grid, whose events are as tall as they last" },
  "styles.css": { sizes: ["16px"], why: "Safari zooms a smaller input on focus" },
  "mascot-preview.css": { sizes: "any", why: "the mascot preview page" },
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) ? [path] : [];
  });
}

const shipped = () => sourceFiles(srcRoot).filter((file) => !/\.test\.tsx?$/.test(file));
const sizesIn = (text: string) => [...text.matchAll(OFF_SCALE_SIZE)].map((match) => match[1] ?? match[2]!);

describe("type scale", () => {
  it("sizes text in whole pixels, so neighbouring steps stay distinct", () => {
    const offenders = sourceFiles(srcRoot).flatMap((file) =>
      (readFileSync(file, "utf8").match(FRACTIONAL_SIZE) ?? []).map((size) => `${relative(srcRoot, file)}: ${size}`),
    );
    expect(offenders).toEqual([]);
  });

  it("sizes text from the scale (text-caption … text-display), not in pixels", () => {
    const offenders = shipped().flatMap((file) => {
      const name = relative(srcRoot, file);
      const allowed = ALLOWED[name]?.sizes;
      if (allowed === "any") return [];
      return sizesIn(readFileSync(file, "utf8")).filter((size) => !allowed?.includes(size)).map((size) => `${name}: ${size}`);
    });
    expect(offenders).toEqual([]);
  });

  it("does not use Tailwind's own text sizes", () => {
    const offenders = shipped().flatMap((file) =>
      (readFileSync(file, "utf8").match(TAILWIND_SIZE) ?? []).map((size) => `${relative(srcRoot, file)}: ${size}`),
    );
    expect(offenders).toEqual([]);
  });

  it("allows only sizes still in use", () => {
    const stale = Object.entries(ALLOWED).flatMap(([name, { sizes }]) => {
      const found = new Set(sizesIn(readFileSync(join(srcRoot, name), "utf8")));
      if (sizes === "any") return found.size ? [] : [name];
      return sizes.filter((size) => !found.has(size)).map((size) => `${name}: ${size}`);
    });
    expect(stale).toEqual([]);
  });

  it("climbs in size and line height", () => {
    const steps = Object.values(TYPE_SCALE);
    for (const [index, step] of steps.entries()) {
      expect(step.lineHeight).toBeGreaterThan(step.size);
      if (index) expect(step.size).toBeGreaterThan(steps[index - 1]!.size);
      if (index) expect(step.lineHeight).toBeGreaterThanOrEqual(steps[index - 1]!.lineHeight);
    }
  });
});
