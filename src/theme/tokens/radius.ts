import type { Radius } from "./skin.ts";

/** Tailwind's corner scale, in px, and the order it must keep in every skin. */
export const SCALE = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const satisfies readonly Radius[];
type Step = (typeof SCALE)[number];
const DEFAULTS: Record<Step, number> = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, "2xl": 16, "3xl": 24, "4xl": 32 };

export function px(value: string): number {
  const match = /^([\d.]+)(px|rem)$/.exec(value);
  if (!match) throw new Error(`not a px or rem length: ${value}`);
  return Number(match[1]) * (match[2] === "rem" ? 16 : 1);
}

/**
 * The whole scale around the corners a skin sets. A step keeps Tailwind's default while that still sits strictly
 * between its neighbours; one that would tie or invert (Foundry's 4px lg under the default 6px md, Pop's 18px xl
 * over the default 16px 2xl) moves by a quarter of its neighbour instead, so `rounded-md` is never rounder than
 * `rounded-lg` on any skin. Set values are returned as written.
 */
export function radiusScale(set: Partial<Record<Radius, string>>): Record<Step, string> {
  const value: Partial<Record<Step, number>> = {};
  for (const step of SCALE) if (set[step] !== undefined) value[step] = px(set[step]!);
  const anchor = SCALE.findIndex((step) => value[step] !== undefined);
  const start = anchor < 0 ? SCALE.indexOf("lg") : anchor;
  value[SCALE[start]!] ??= DEFAULTS[SCALE[start]!];
  for (let i = start - 1; i >= 0; i -= 1) {
    const step = SCALE[i]!;
    const above = value[SCALE[i + 1]!]!;
    if (value[step] === undefined) value[step] = DEFAULTS[step] < above ? DEFAULTS[step] : Math.max(1, Math.min(above - 1, Math.round(above * 0.75)));
  }
  for (let i = start + 1; i < SCALE.length; i += 1) {
    const step = SCALE[i]!;
    const below = value[SCALE[i - 1]!]!;
    if (value[step] === undefined) value[step] = DEFAULTS[step] > below ? DEFAULTS[step] : Math.max(below + 1, Math.round((below * 4) / 3));
  }
  return Object.fromEntries(SCALE.map((step) => [step, set[step] ?? `${value[step]}px`])) as Record<Step, string>;
}
