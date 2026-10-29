import { oklch, p3 } from "./color.ts";
import { radiusScale } from "./radius.ts";
import {
  COLOR_TOKENS, IDENTITY_HUES, RADII, ROOT_TOKENS, THEME_TOKENS, WIDE_GAMUT_LIFT, WIDE_GAMUT_TOKENS,
  type ColorToken, type Colors, type Radius, type SkinSource,
} from "./skin.ts";

/** The marker pairs around every generated region. Everything between two markers is rewritten on each run. */
export const REGIONS = {
  theme: ["/* @generated tokens:theme start */", "/* @generated tokens:theme end */"],
  skins: ["/* @generated tokens:skins start */", "/* @generated tokens:skins end */"],
  bubbles: ["/* @generated tokens:bubbles start */", "/* @generated tokens:bubbles end */"],
  wideGamut: ["/* @generated tokens:wide-gamut start */", "/* @generated tokens:wide-gamut end */"],
  phone: ["/* @generated tokens:phone start */", "/* @generated tokens:phone end */"],
  chrome: ["// @generated tokens:chrome start", "// @generated tokens:chrome end"],
} as const;

type Entry = [string, string];
const declare = (indent: string, entries: Iterable<Entry>) => [...entries].map(([name, value]) => `${indent}${name}: ${value};`);
const colorEntries = (colors: Partial<Colors>, tokens: readonly ColorToken[] = COLOR_TOKENS): Entry[] =>
  tokens.filter((token) => colors[token] !== undefined).map((token) => [`--color-${token}`, colors[token]!]);
const radiusEntries = (radius: Partial<Record<Radius, string>>): Entry[] =>
  RADII.filter((size) => radius[size] !== undefined).map((size) => [`--radius-${size}`, radius[size]!]);
/** The full corner scale, with `--radius` (Tailwind's bare `rounded`) at the sm step. */
const scaleEntries = (radius: Partial<Record<Radius, string>>): Entry[] => {
  const scale = radiusScale(radius);
  return [["--radius", scale.sm], ...radiusEntries({ ...scale, menu: radius.menu })];
};
/** The phone's scale where it differs from the skin's own. */
const phoneScaleEntries = (skin: SkinSource): Entry[] => {
  const desktop = new Map(scaleEntries(skin.radius));
  return scaleEntries({ ...skin.radius, ...skin.phone!.radius }).filter(([name, value]) => desktop.get(name) !== value);
};

/** The default skin's colours in `@theme`, so Tailwind emits a utility for each token. */
export function themeDefaults(skin: SkinSource): string {
  return [...declare("  ", colorEntries(skin.colors, THEME_TOKENS)), ...declare("  ", scaleEntries(skin.radius))].join("\n");
}

/** A token's Display P3 twin: the pinned value, or the same lightness and hue with more chroma, fitted to P3. */
export function wideGamutValue(skin: SkinSource, token: ColorToken): string {
  const pinned = skin.wideGamut.pinned?.[token];
  if (pinned) return pinned;
  const color = oklch(skin.colors[token]);
  return p3({ ...color, c: color.c * WIDE_GAMUT_LIFT });
}

/** The bare `:root` fallbacks for the tokens outside `@theme`, then one `[data-skin]` block per skin. */
export function skinsCss(skins: readonly SkinSource[], fallback: SkinSource): string {
  const out = [":root {", `  --code-color-scheme: ${fallback.mode};`, ...declare("  ", colorEntries(fallback.colors, ROOT_TOKENS))];
  out.push(`  --shadow-float: 0 0 #0000;`, "}");
  for (const skin of skins) {
    out.push("", `[data-skin="${skin.id}"] {`, `  color-scheme: ${skin.mode};`, `  --code-color-scheme: ${skin.mode};`);
    out.push(...declare("  ", colorEntries(skin.colors)));
    out.push(`  --font-sans: ${skin.font};`);
    out.push(...declare("  ", scaleEntries(skin.radius)));
    out.push(...declare("  ", IDENTITY_HUES.map((hue): Entry => [`--identity-${hue}`, skin.identity[hue]])));
    if (skin.shadowFloat) out.push(`  --shadow-float: ${skin.shadowFloat};`);
    out.push("}");
  }
  return out.join("\n");
}

/** The context inside the inverted user bubbles. Scoped so a nested skin (the picker's previews) keeps its own. */
export function bubblesCss(skins: readonly SkinSource[]): string {
  return skins.filter((skin) => skin.invertedBubble).map((skin) => [
    `@scope ([data-skin="${skin.id}"]) to ([data-skin]) {`,
    "  .bg-bubble-user {",
    ...declare("    ", colorEntries(skin.invertedBubble!)),
    "  }",
    "}",
  ].join("\n")).join("\n\n");
}

export function wideGamutCss(skins: readonly SkinSource[]): string {
  const out = ["@media (color-gamut: p3) {"];
  for (const skin of skins) {
    const tokens = skin.wideGamut.tokens ?? WIDE_GAMUT_TOKENS;
    out.push(`  :is([data-skin="${skin.id}"]) {`);
    out.push(...declare("    ", tokens.map((token): Entry => [`--color-${token}`, wideGamutValue(skin, token)])));
    out.push("  }");
  }
  out.push("}");
  return out.join("\n");
}

export function phoneCss(skins: readonly SkinSource[]): string {
  const out = ["@media (max-width: 767.98px) {"];
  for (const skin of skins.filter((entry) => entry.phone)) {
    out.push(`  :is([data-skin="${skin.id}"]) {`);
    out.push(...declare("    ", colorEntries(skin.phone!.colors)), ...declare("    ", phoneScaleEntries(skin)));
    out.push("  }");
  }
  out.push("}");
  return out.join("\n");
}

/** The caption-button overlay on Windows: the ground behind it and an opaque symbol colour. */
export function chromeJs(skins: readonly SkinSource[]): string {
  return skins.map((skin) => {
    const key = /^[a-z]+$/.test(skin.id) ? skin.id : JSON.stringify(skin.id);
    return `  ${key}: Object.freeze({ color: "${skin.colors.app}", symbolColor: "${skin.captionSymbol}" }),`;
  }).join("\n");
}

/** Replaces the text between a region's two marker lines, keeping the markers and the end marker's indent. */
export function splice(file: string, [start, end]: readonly [string, string], body: string): string {
  const from = file.indexOf(start);
  const to = file.indexOf(end);
  if (from < 0 || to < from) throw new Error(`missing generated-region markers: ${start}`);
  const lineStart = file.lastIndexOf("\n", to) + 1;
  const indent = file.slice(lineStart, to);
  return `${file.slice(0, from + start.length)}\n${body}\n${indent}${file.slice(to)}`;
}
