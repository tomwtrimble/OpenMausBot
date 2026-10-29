#!/usr/bin/env node
// Measures every text/surface pair of the skins in src/styles.css, parsed from
// the CSS itself. Run it after touching a palette:
//
//   pnpm check:contrast
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/styles.css"), "utf8");

function declarations(body) {
  const tokens = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+|(?<![\w-])color-scheme)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

/** The `@theme` defaults plus the bare `:root` block: a skin that does not
 * redefine one of these still ships it, so it is measured. */
function parseBase(source) {
  const base = {};
  for (const [, body] of source.matchAll(/(?:@theme|:root)\s*\{([^}]*)\}/g)) {
    Object.assign(base, declarations(body));
  }
  return base;
}

/** Every `[data-skin="x"] { … }` block, as id → {token: value}, over the
 * inherited base so a skin is measured as it actually renders. */
function parseSkins(source) {
  const { desktop, phone } = splitPhone(source);
  const base = parseBase(desktop);
  const skins = new Map();
  for (const [, id, body] of desktop.matchAll(/\[data-skin="([a-z-]+)"\]\s*\{([^}]*)\}/g)) {
    skins.set(id, { ...base, ...declarations(body) });
  }
  // The phone block re-declares some tokens of a skin under a width query, so
  // that skin is measured twice: as it renders on desktop and as "<id> (phone)".
  for (const [, id, body] of phone.matchAll(/\[data-skin="([a-z-]+)"\]\)?\s*\{([^}]*)\}/g)) {
    skins.set(`${id} (phone)`, { ...skins.get(id), ...declarations(body) });
  }
  return skins;
}

/** The `@media (max-width: 767.98px) { … }` block that re-declares skin tokens,
 * cut out of the source so its skin selectors are not mistaken for a second
 * definition of the skin. Other blocks under the same query hold layout only. */
function splitPhone(source) {
  for (const { index: start } of source.matchAll(/@media \(max-width: 767\.98px\)\s*\{/g)) {
    let depth = 0;
    let end = source.indexOf("{", start);
    for (let i = end; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    const phone = source.slice(start, end);
    if (phone.includes("[data-skin=")) return { desktop: source.slice(0, start) + source.slice(end), phone };
  }
  return { desktop: source, phone: "" };
}

function parseHex(value) {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
  if (!match) return null;
  const h = match[1];
  const full = h.length <= 4 ? Array.from(h, (c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  };
}

/** Foreground alpha composited over an opaque background. */
function flatten(fg, bg) {
  if (fg.a === 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fgHex, bgHex) {
  const bg = parseHex(bgHex);
  const parsedFg = parseHex(fgHex);
  if (!parsedFg || !bg || bg.a !== 1) return null;
  const fg = flatten(parsedFg, bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// Pairs taken from what the components render.
const SURFACES = ["--color-app", "--color-panel", "--color-raised", "--color-raised-hover", "--color-card", "--color-inset", "--color-composer", "--color-menu"];
const WORD_SURFACES = ["--color-app", "--color-panel", "--color-card", "--color-menu"];
const PAIRS = [
  ...SURFACES.map((s) => ["--color-ink", s, 4.5]),
  ...SURFACES.map((s) => ["--color-ink-secondary", s, 4.5]),
  // Quiet text is body-size, so it is held to the same 4.5:1.
  ...SURFACES.map((s) => ["--color-ink-tertiary", s, 4.5]),
  ["--color-bubble-user-ink", "--color-bubble-user", 4.5],
  // The label a filled button or badge carries.
  ["--color-accent-ink", "--color-accent", 4.5],
  ["--color-danger-ink", "--color-danger", 4.5],
  ["--color-success-ink", "--color-success", 4.5],
  // The needs-you amber is a fill that always carries the dark ink.
  ["--color-warning-ink", "--color-warning", 4.5],
  // Accent, danger and needs-you as words (text-accent-text,
  // text-danger-text, text-warning-text): links, selected labels, errors,
  // notices. They sit on the ground, the sidebar, a card and a menu.
  ...WORD_SURFACES.flatMap((s) => [
    ["--color-accent-text", s, 4.5],
    ["--color-danger-text", s, 4.5],
    ["--color-warning-text", s, 4.5],
  ]),
  ["--color-success", "--color-card", 4.5],
  // An error can sit on a control (a chip, a field's row) as well as on the page.
  ["--color-danger-text", "--color-control", 4.5],
  // borders, dots and fills are UI components, not text — AA asks 3:1 of them.
  // A divider (hairline, translucent) only has to be seen; the edge around a
  // control has to be found.
  ["--color-hairline", "--color-app", 1.15],
  ["--color-hairline", "--color-card", 1.1],
  ["--color-edge", "--color-app", 1.5],
  ["--color-edge", "--color-card", 1.3],
  ["--color-edge", "--color-menu", 1.3],
  ["--color-accent", "--color-app", 3],
  // The unread dot sits on the sidebar.
  ["--color-accent", "--color-panel", 3],
  ["--color-danger", "--color-app", 3],
  ["--color-warning", "--color-app", 3],
  ["--color-warning", "--color-panel", 3],
  ["--color-scrollbar", "--color-app", 1.5],
  // The focus ring sits outside the control (outline-offset: 2px), on whatever
  // surface is behind it. WCAG 1.4.11 asks 3:1 of a non-text indicator.
  ["--color-focus", "--color-app", 3],
  ["--color-focus", "--color-panel", 3],
  ["--color-focus", "--color-card", 3],
  // A focused text field paints its border in the ring colour, so the ring
  // must also clear the field fills.
  ["--color-focus", "--color-inset", 3],
  ["--color-focus", "--color-raised", 3],
  ["--color-focus", "--color-control", 3],
  // Surface against surface: two surfaces with one value hide everything painted
  // on one over the other. A surface only has to be seen, so the bar is a
  // just-perceptible step, not a WCAG ratio. `control` can land on any surface.
  ["--color-control", "--color-card", 1.06],
  ["--color-control", "--color-panel", 1.06],
  ["--color-control", "--color-app", 1.04],
  ["--color-control", "--color-inset", 1.04],
  ["--color-control", "--color-raised-hover", 1.04],
  ["--color-raised-hover", "--color-card", 1.04],
  ["--color-inset", "--color-card", 1.04],
  ["--color-card", "--color-app", 1.04],
  ["--color-panel", "--color-app", 1.03],
  // The hover, chip and selected-row fill shows on every surface it lands on.
  ["--color-raised", "--color-app", 1.04],
  ["--color-raised", "--color-panel", 1.04],
  ["--color-raised", "--color-card", 1.04],
  // The float (menus, popovers) is its own surface, a step off the card it
  // floats over, besides its border and shadow.
  ["--color-menu", "--color-card", 1.02],
];
// Steps a skin keeps flat on purpose. Midnight's card, composer, menu and raised
// fill are Simple mode's one raised surface, one 8-bit step apart.
const FLAT_BY_DESIGN = new Set(["midnight|--color-raised|--color-card", "midnight|--color-menu|--color-card"]);

/** OKLab coordinates of an opaque hex, for telling two colours apart beyond their luminance. */
function oklab(value) {
  const { r, g, b } = parseHex(value);
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const distance = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));
const MIN_SUCCESS_DISTANCE = 0.04;
const RADII = ["--radius-xs", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl", "--radius-3xl", "--radius-4xl"];
const cornerPx = (value) => {
  const match = /^([\d.]+)(px|rem)$/.exec(value ?? "");
  return match ? Number(match[1]) * (match[2] === "rem" ? 16 : 1) : null;
};

const skins = parseSkins(css);
// No skin carries a known gap: every below-target pair fails.
let failed = false;
for (const [id, tokens] of skins) {
  const problems = [];
  const missing = [];
  const unmeasurable = [];
  let measured = 0;
  for (const [fg, bg, min] of PAIRS) {
    // A pair we cannot measure is reported, never skipped.
    if (!tokens[fg] || !tokens[bg]) {
      missing.push(!tokens[fg] ? fg : bg);
      continue;
    }
    const ratio = contrast(tokens[fg], tokens[bg]);
    if (ratio === null) {
      unmeasurable.push({ fg, bg, fgValue: tokens[fg], bgValue: tokens[bg] });
      continue;
    }
    measured++;
    if (ratio < min && !FLAT_BY_DESIGN.has(`${id.replace(/ \(phone\)$/, "")}|${fg}|${bg}`)) problems.push({ fg, bg, ratio, min });
  }
  // The float (menus, popovers) sits over cards, so it is never darker than one.
  if (!missing.length && !unmeasurable.length && oklab(tokens["--color-menu"])[0] < oklab(tokens["--color-card"])[0] - 0.002) {
    problems.push({ text: "--color-menu is darker than --color-card: the float sits below the card it floats over" });
  }
  // Success is a state of its own: a working dot next to an unread one must not read as the same colour.
  const apart = missing.length || unmeasurable.length ? Infinity : distance(tokens["--color-success"], tokens["--color-accent"]);
  if (apart < MIN_SUCCESS_DISTANCE) problems.push({ text: `--color-success is ${apart.toFixed(3)} from --color-accent in OKLab (needs ${MIN_SUCCESS_DISTANCE}): success must read as its own colour` });
  // Native controls (date and time pickers, scrollbars, selects) follow the skin's own scheme.
  if (tokens["color-scheme"] !== tokens["--code-color-scheme"]) problems.push({ text: `color-scheme is ${tokens["color-scheme"] ?? "unset"} under --code-color-scheme ${tokens["--code-color-scheme"]}` });
  // Corners: every step of the scale rounder than the one before, and Tailwind's bare `rounded` at the sm step.
  const corners = RADII.map((name) => cornerPx(tokens[name]));
  if (corners.some((size) => size === null)) problems.push({ text: `radius scale incomplete: ${RADII.filter((_, i) => corners[i] === null).join(", ")}` });
  else for (let i = 1; i < corners.length; i++) {
    if (corners[i] <= corners[i - 1]) problems.push({ text: `${RADII[i]} (${corners[i]}px) is not rounder than ${RADII[i - 1]} (${corners[i - 1]}px)` });
  }
  if (cornerPx(tokens["--radius"]) !== cornerPx(tokens["--radius-sm"])) problems.push({ text: "--radius (Tailwind's bare `rounded`) differs from --radius-sm" });
  const skinFailed = missing.length > 0 || unmeasurable.length > 0 || problems.length > 0;
  if (missing.length) {
    console.log(`✗ ${id} — undefined token(s): ${[...new Set(missing)].join(", ")}`);
  }
  for (const { fg, bg, fgValue, bgValue } of unmeasurable) {
    console.log(`✗ ${id} — cannot measure ${fg} on ${bg} (${fgValue} on ${bgValue})`);
  }
  if (!skinFailed) {
    console.log(`✓ ${id} — ${measured} pairs and the corner scale, none below target`);
    continue;
  }
  failed = true;
  if (problems.length) console.log(`✗ ${id}`);
  for (const { fg, bg, ratio, min, text } of problems) {
    console.log(text ? `    ${text}` : `    ${fg} on ${bg}: ${ratio.toFixed(2)}:1 (needs ${min}:1)`);
  }
}

// Team, member and organization tiles: the glyph is the identity hue mixed
// toward the ink, on a wash of the same hue over whatever surface the tile
// sits on. The mix amounts and hues are read from the rule in styles.css.
const glyphInk = Number(/color-mix\(in srgb, var\(--team-glyph\), var\(--color-ink\) (\d+)%\)/.exec(css)?.[1]);
const glyphWash = Number(/color-mix\(in srgb, var\(--team-glyph\) (\d+)%, transparent\)/.exec(css)?.[1]);
const glyphHues = [...css.matchAll(/\.team-glyph-[a-z]+ \{ --team-glyph: var\((--identity-[a-z]+)\); \}/g)].map(([, hue]) => hue);
const mixHex = (a, b, weightOfB) => {
  const [x, y] = [parseHex(a), parseHex(b)];
  if (!x || !y || x.a !== 1 || y.a !== 1) return null;
  const channel = (k) => Math.round(x[k] * (1 - weightOfB) + y[k] * weightOfB).toString(16).padStart(2, "0");
  return `#${channel("r")}${channel("g")}${channel("b")}`;
};
if (!glyphInk || !glyphWash || glyphHues.length === 0) {
  failed = true;
  console.log("✗ team tiles — could not read the .team-glyph-* rule from styles.css");
} else {
  const low = [];
  let measured = 0;
  for (const [id, tokens] of skins) {
    for (const hue of glyphHues) {
      for (const surface of ["--color-app", "--color-panel", "--color-card", "--color-raised", "--color-inset", "--color-menu"]) {
        const ink = tokens["--color-ink"] ?? "";
        const text = mixHex(tokens[hue] ?? "", parseHex(ink)?.a === 1 ? ink : "", glyphInk / 100);
        const wash = mixHex(tokens[surface] ?? "", tokens[hue] ?? "", glyphWash / 100);
        const ratio = text && wash ? contrast(text, wash) : null;
        measured++;
        if (ratio === null || ratio < 4.5) low.push(`${id}: ${hue} tile on ${surface}: ${ratio?.toFixed(2) ?? "unmeasurable"}:1 (needs 4.5:1)`);
      }
    }
  }
  if (low.length) {
    failed = true;
    for (const line of low) console.log(`✗ team tiles — ${line}`);
  } else console.log(`✓ team tiles — ${measured} hue/surface pairs in every skin above 4.5:1`);
}

// The inverted bubbles (Daylight's ink-black, Pop's ink) have
// their own inherited context: the editor, labels, quotes and file chips
// explicitly use these tokens, not parent color.
for (const skinId of ["daylight", "pop"]) {
  const scope = css.match(new RegExp(`@scope \\(\\[data-skin="${skinId}"\\]\\) to \\(\\[data-skin\\]\\)\\s*\\{\\s*\\.bg-bubble-user\\s*\\{([^}]*)\\}`))?.[1];
  if (!scope) {
    failed = true;
    console.log(`✗ ${skinId} bubble — no @scope block for the inverted bubble`);
    continue;
  }
  const bubble = { ...skins.get(skinId), ...declarations(scope) };
  let bubbleFailed = false;
  for (const [fg, bg] of [
    ["--color-ink", "--color-bubble-user"],
    ["--color-ink-secondary", "--color-bubble-user"],
    ["--color-ink", "--color-raised"],
    ["--color-ink-secondary", "--color-raised-hover"],
    ["--color-ink-secondary", "--color-inset"],
    ["--color-ink-tertiary", "--color-bubble-user"],
    ["--color-ink-tertiary", "--color-raised-hover"],
    ["--color-ink-tertiary", "--color-inset"],
    ["--color-accent", "--color-inset"],
    ["--color-accent-text", "--color-bubble-user"],
    ["--color-danger-text", "--color-bubble-user"],
    ["--color-warning-text", "--color-bubble-user"],
    ["--color-warning-ink", "--color-warning"],
    ["--color-ink", "--color-control"],
    ["--color-danger-text", "--color-control"],
    ["--color-accent-ink", "--color-accent"],
    ["--color-danger-ink", "--color-danger"],
    ["--color-success-ink", "--color-success"],
  ]) {
    const ratio = contrast(bubble[fg] ?? "", bubble[bg] ?? "");
    if (ratio === null || ratio < 4.5) {
      failed = true;
      bubbleFailed = true;
      console.log(`✗ ${skinId} bubble — ${fg} on ${bg}: ${ratio?.toFixed(2) ?? "unmeasurable"}:1 (needs 4.5:1)`);
    }
  }
  if (!bubbleFailed) console.log(`✓ ${skinId} bubble — editor, controls and paired fills above 4.5:1`);
}

// MausBot Cloud's night card paints its own sky in every skin: an indigo dusk in the light scheme, a deep night in the
// dark one. Its text sits between the sky's first two stops; the close button's glyph also lands on the far stop.
const night = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(([, body]) => declarations(body)).find(tokens => tokens["--cloud-night-from"]);
if (!night) {
  failed = true;
  console.log("✗ night card — no :root block defines --cloud-night-from");
} else {
  for (const [scheme, pick] of [["dusk", 1], ["night", 2]]) {
    const value = (token) => /^light-dark\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/.exec(night[token] ?? "")?.[pick] ?? night[token] ?? "";
    let schemeFailed = false;
    for (const [fg, bg, min] of [
      ["--cloud-night-ink", "--cloud-night-from", 4.5],
      ["--cloud-night-ink", "--cloud-night-mid", 4.5],
      ["--cloud-night-ink-quiet", "--cloud-night-from", 4.5],
      ["--cloud-night-ink-quiet", "--cloud-night-mid", 4.5],
      ["--cloud-night-ink-quiet", "--cloud-night-to", 3],
    ]) {
      const ratio = contrast(value(fg), value(bg));
      if (ratio === null || ratio < min) {
        failed = true;
        schemeFailed = true;
        console.log(`✗ night card (${scheme}) — ${fg} on ${bg}: ${ratio?.toFixed(2) ?? "unmeasurable"}:1 (needs ${min}:1)`);
      }
    }
    if (!schemeFailed) console.log(`✓ night card (${scheme}) — its text and close button clear the sky behind them`);
  }
}

// A Cloud's sidebar lays a wash of one night colour over its panel (src/styles.css [data-cloud-sky]::before): every ink
// must read on the panel with that wash at its strongest.
const washOf = (rule) => ({ token: /var\((--cloud-night-[\w-]+)\)\)/.exec(rule ?? "")?.[1], strength: Number(/opacity: ([\d.]+);/.exec(rule ?? "")?.[1]) });
const washLight = washOf(/\n\[data-cloud-sky\]::before \{([^}]*)\}/.exec(css)?.[1]);
const washDark = washOf(/@container style\(--code-color-scheme: dark\) \{\s*\[data-cloud-sky\]::before \{([^}]*)\}/.exec(css)?.[1]);
if (!night || !washLight.token || !washDark.token || !(washLight.strength > 0) || !(washDark.strength > 0)) {
  failed = true;
  console.log("✗ Cloud sidebar — cannot read the wash's strength or the night tokens");
} else {
  const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  let washFailed = false;
  for (const [id, tokens] of skins) {
    const dark = tokens["--code-color-scheme"] === "dark";
    const pick = (token) => /^light-dark\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/.exec(night[token] ?? "")?.[dark ? 2 : 1];
    const panel = parseHex(tokens["--color-panel"] ?? "");
    const problems = [];
    const wash = dark ? washDark : washLight;
    const tint = parseHex(pick(wash.token) ?? "");
    if (!panel || !tint) problems.push(`cannot measure ${wash.token} over --color-panel`);
    else {
      const washed = hex(flatten({ ...tint, a: wash.strength }, panel));
      for (const fg of ["--color-ink", "--color-ink-secondary", "--color-ink-tertiary"]) {
        const ratio = contrast(tokens[fg] ?? "", washed);
        if (ratio === null || ratio < 4.5) problems.push(`${fg} on the panel under ${wash.token}: ${ratio?.toFixed(2) ?? "unmeasurable"}:1 (needs 4.5:1)`);
      }
    }
    if (problems.length) {
      failed = true;
      washFailed = true;
      for (const problem of problems) console.log(`✗ ${id} Cloud sidebar — ${problem}`);
    }
  }
  if (!washFailed) console.log(`✓ Cloud sidebar — every skin's inks read under the night wash (${washLight.token} at ${washLight.strength} light, ${washDark.token} at ${washDark.strength} dark)`);
}

process.exit(failed ? 1 : 0);
