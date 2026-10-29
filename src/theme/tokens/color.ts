export type Oklch = { l: number; c: number; h: number };
type Linear = [number, number, number];

const GAMUT_EPSILON = 1e-4;

function oklabToLinearSrgb(l: number, a: number, b: number): Linear {
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

function linearSrgbToP3([r, g, b]: Linear): Linear {
  return [
    0.8224621209 * r + 0.1775378791 * g,
    0.0331941989 * r + 0.9668058011 * g,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
  ];
}

function toLinear({ l, c, h }: Oklch): Linear {
  const rad = (h * Math.PI) / 180;
  return oklabToLinearSrgb(l, c * Math.cos(rad), c * Math.sin(rad));
}

const inGamut = (rgb: Linear) => rgb.every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON);

/** The colour with its chroma reduced, hue and lightness held, until it fits the gamut. */
function fit(color: Oklch, gamut: "srgb" | "p3"): Oklch {
  const test = (c: number) => {
    const linear = toLinear({ ...color, c });
    return inGamut(gamut === "srgb" ? linear : linearSrgbToP3(linear));
  };
  if (test(color.c)) return color;
  let lo = 0;
  let hi = color.c;
  for (let step = 0; step < 32; step += 1) {
    const mid = (lo + hi) / 2;
    if (test(mid)) lo = mid;
    else hi = mid;
  }
  return { ...color, c: lo };
}

const encode = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
};
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

export function hex(color: Oklch): string {
  const channels = toLinear(fit(color, "srgb")).map((v) => Math.round(encode(v) * 255));
  return `#${channels.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function p3(color: Oklch): string {
  const [r, g, b] = linearSrgbToP3(toLinear(fit(color, "p3"))).map((v) => encode(v).toFixed(4));
  return `color(display-p3 ${r} ${g} ${b})`;
}

function channels(value: string): Linear {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) throw new Error(`not a 6-digit hex colour: ${value}`);
  const n = parseInt(match[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => decode(v / 255)) as Linear;
}

export function oklch(value: string): Oklch {
  return fromLinear(channels(value));
}

/** A `color(display-p3 r g b)` value in OKLCH, so a pinned wide-gamut twin can be compared with its sRGB hex. */
export function oklchOfP3(value: string): Oklch {
  const match = /^color\(display-p3 ([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!match) throw new Error(`not a display-p3 colour: ${value}`);
  const [pr, pg, pb] = [match[1], match[2], match[3]].map((v) => decode(Number(v)));
  return fromLinear([
    1.2249401 * pr! - 0.2249404 * pg!,
    -0.0420569 * pr! + 1.0420571 * pg!,
    -0.0196376 * pr! - 0.0786361 * pg! + 1.0982735 * pb!,
  ]);
}

function fromLinear([r, g, b]: Linear): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

export function luminance(value: string): number {
  const [r, g, b] = channels(value);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Euclidean distance in OKLab: how far apart two colours look, hue and chroma included. */
export function distance(a: string | Oklch, b: string | Oklch): number {
  const [x, y] = [a, b].map((value) => (typeof value === "string" ? oklch(value) : value)) as [Oklch, Oklch];
  const ab = (o: Oklch) => [o.c * Math.cos((o.h * Math.PI) / 180), o.c * Math.sin((o.h * Math.PI) / 180)];
  const [xa, xb] = ab(x);
  const [ya, yb] = ab(y);
  return Math.hypot(x.l - y.l, xa! - ya!, xb! - yb!);
}

export function mix(foreground: string, background: string, weight: number): string {
  const [f, b] = [foreground, background].map((value) => {
    const n = parseInt(value.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  return `#${f!.map((v, i) => Math.round(v * weight + b![i]! * (1 - weight)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The lightness furthest toward `prefer` in [lo, hi] whose colour passes `ok`, assuming `ok` holds on one side of a
 * single threshold. Null when no lightness in the range passes.
 */
export function solveLightness(
  base: Omit<Oklch, "l">,
  lo: number,
  hi: number,
  prefer: "light" | "dark",
  ok: (value: string) => boolean,
): number | null {
  const passes = (l: number) => ok(hex({ ...base, l }));
  const strict = prefer === "light" ? hi : lo;
  if (passes(strict)) return strict;
  const loose = prefer === "light" ? lo : hi;
  if (!passes(loose)) return null;
  let good = loose;
  let bad = strict;
  for (let step = 0; step < 40; step += 1) {
    const mid = (good + bad) / 2;
    if (passes(mid)) good = mid;
    else bad = mid;
  }
  return good;
}

/** An 8-digit `#rrggbbaa` composited over an opaque ground, as the eye sees it; 6-digit values pass through. */
export function opaque(value: string, ground: string): string {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(value);
  if (!match) return value;
  return mix(`#${match[1]}`, ground, parseInt(match[2]!, 16) / 255);
}
