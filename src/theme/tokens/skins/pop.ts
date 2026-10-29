import { ROUNDED } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * Cream paper, white cards, ink outlines and hard offset shadows. Light-only, with an ink bubble for your own
 * messages, so it takes the same @scope treatment as Daylight. The brand grape #8b5cf6 carries white at only 4.2:1,
 * so the filled accent is one step deeper; the brand grape stays as the accent border. Mint, butter and coral are
 * fills for ink text only.
 */
export default {
  id: "pop",
  label: "Pop",
  mode: "light",
  colors: {
    // the page
    app: "#fdf5ea",
    // sidebar
    panel: "#f6ebdb",
    raised: "#efe3d1",
    // the selected row
    "raised-hover": "#e4d4bc",
    composer: "#ffffff",
    "composer-ring": "#1b1613",
    // the sticker card, a step under the white menu that floats over it; it was white too
    card: "#fffbf7",
    menu: "#ffffff",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    inset: "#f2e8d7",
    control: "#ece0cc",
    hairline: "#1b161373",
    edge: "#1b1613",
    ink: "#1b1613",
    "ink-secondary": "#3a322d",
    "ink-tertiary": "#5f5650",
    accent: "#7f52f0",
    "accent-border": "#8b5cf6",
    "accent-text": "#6d28d9",
    focus: "#7f52f0",
    "accent-ink": "#ffffff",
    // your own messages, inverted
    "bubble-user": "#1b1613",
    "bubble-user-ink": "#ffffff",
    success: "#1f7a4d",
    "success-ink": "#ffffff",
    danger: "#d93a2b",
    // the coral as words, darker than the fill so it reads on the sidebar and on a control (4.55:1)
    "danger-text": "#c32015",
    "danger-ink": "#ffffff",
    // the needs-you fill, an amber that marks the page at 3:1 and carries the dark ink; was #8a5a00, now the words
    warning: "#bc7a00",
    "warning-text": "#8a5a00",
    "warning-ink": "#2b1400",
    scrollbar: "#d0bfa6",
    "maus-line": "#6b625b",
    // shadows in the ink's own tint, never raw black
    shadow: "#1b1613",
  },
  font: ROUNDED,
  radius: { lg: "12px", xl: "18px" },
  identity: {
    green: "#00824a",
    blue: "#1c6de0",
    red: "#d4323a",
    orange: "#ae5b14",
    purple: "#8057C8",
    cyan: "#0a7b94",
    pink: "#cf2e75",
    yellow: "#8d6c1a",
    teal: "#017f72",
    coral: "#d1381f",
    silver: "#6a727c",
    chrome: "#667284",
  },
  captionSymbol: "#3a322d",
  wideGamut: {
    pinned: {
      accent: "color(display-p3 0.4751 0.2990 0.9505)",
      "accent-border": "color(display-p3 0.5215 0.3418 0.9730)",
      "accent-text": "color(display-p3 0.4002 0.1038 0.8623)",
      focus: "color(display-p3 0.4751 0.2990 0.9505)",
      success: "color(display-p3 0.2127 0.4772 0.3073)",
      danger: "color(display-p3 0.8102 0.2412 0.1727)",
      "warning-text": "color(display-p3 0.5248 0.3557 0.0473)",
    },
  },
  invertedBubble: {
    ink: "#ffffff",
    "ink-secondary": "#e4dad0",
    "ink-tertiary": "#bdb1a6",
    panel: "#2a221d",
    inset: "#2f2722",
    raised: "#3a322d",
    "raised-hover": "#4a4039",
    control: "#3a322d",
    hairline: "#8a7e7473",
    edge: "#8a7e74",
    accent: "#ffd966",
    "accent-text": "#ffd966",
    "accent-ink": "#1b1613",
    focus: "#ffd966",
    danger: "#ff7a66",
    "danger-text": "#ff7a66",
    "danger-ink": "#1b1613",
    // needs-you words on the dark bubble; the amber fill and its dark ink read there as they are
    "warning-text": "#ffae33",
    success: "#8ee3b0",
    "success-ink": "#1b1613",
  },
  phones: false,
} satisfies SkinSource;
