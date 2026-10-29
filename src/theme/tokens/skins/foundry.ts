import { GEIST } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * Night shift. The third corner of the grid: Midnight is dark and cool, Atelier light and warm — this one is dark
 * and warm, which is the register most of this app's actual use falls into. Its one structural idea, and the thing
 * that makes it read as metal rather than as "Atelier with the lights off": the accent is the brightest thing on
 * screen, not a darker patch of it. Brass at #d99a3e glows against the ground at 7.9:1 and carries near-black
 * lettering at 7.4:1 — so filled buttons read as lit, not as painted. That inversion is only possible because
 * --color-accent-ink exists; with hardcoded white text the accent would have to stay dark and the skin would lose
 * its point. Surfaces warm up as they rise (#100e0b → #262019), the way material does as it comes closer to the
 * lamp. Corners are tighter than Atelier's — 4px and 8px — because sheet metal doesn't round the way paper does.
 */
export default {
  id: "foundry",
  label: "Foundry",
  mode: "dark",
  colors: {
    // deepest ground, warm black
    app: "#100e0b",
    // sidebar
    panel: "#171410",
    // raised means warmer, not just lighter
    raised: "#262019",
    "raised-hover": "#322b21",
    composer: "#262019",
    "composer-ring": "transparent",
    card: "#1e1a14",
    // the float, a step above the card it floats over and under raised, which stays the row hover; it was #1e1a14, the card
    menu: "#211d16",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    // inset sinks below the ground
    inset: "#0b0a08",
    control: "#262019",
    // visible on purpose — this UI has edges
    hairline: "#3d352973",
    edge: "#3d3529",
    // warm off-white, never pure #fff
    ink: "#f4efe4",
    // 6.7:1 on raised, 5.9:1 on hover
    "ink-secondary": "#b0a696",
    "ink-tertiary": "#9c9384",
    // Brass. Bright fill, dark lettering — the inversion described above.
    accent: "#d99a3e",
    "accent-border": "#e8b25e",
    // 8.6:1 on the ground, for links
    "accent-text": "#e0a44c",
    // the ring rides the accent, not Grok blue
    focus: "#e0a44c",
    // 7.4:1 on the brass fill
    "accent-ink": "#1c150c",
    // your own messages, one step out of the card
    "bubble-user": "#2a2318",
    "bubble-user-ink": "#f4efe4",
    success: "#57b078",
    "success-ink": "#1c150c",
    // a lamp, not a paint chip
    danger: "#e0685e",
    "danger-text": "#e0685e",
    "danger-ink": "#1c0d0b",
    warning: "#dfa441",
    "warning-text": "#dfa441",
    "warning-ink": "#2b1400",
    scrollbar: "#3d3529",
    "maus-line": "#b0a696",
    // no shadows on a dark ground: surfaces part by tone and rim, as Midnight does in Simple mode
    shadow: "transparent",
  },
  font: GEIST,
  radius: { lg: "4px", xl: "8px" },
  identity: {
    green: "#009957",
    blue: "#377FE6",
    red: "#D94B52",
    orange: "#E78531",
    purple: "#8c67cd",
    cyan: "#0EA5C6",
    pink: "#D84F8B",
    yellow: "#D8A729",
    teal: "#01A492",
    coral: "#E5634E",
    silver: "#A8ADB4",
    chrome: "#B3BAC4",
  },
  captionSymbol: "#b0a696",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
