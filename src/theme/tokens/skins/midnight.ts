import { GEIST } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * The upstream palette, pixel-sampled from the real Grok app, as retuned for Simple mode. Repeated in its own
 * block (rather than relying on the `@theme` defaults) so that a `[data-skin]` subtree can switch *back* to it — the
 * picker needs that. Upstream's fills, #1084fe and #ff5667, carried white at 3.65:1 and 3.10:1; they move to the same
 * hues at a lower lightness so a white label clears AA, while words keep the bright hues through accent-text and
 * danger-text.
 */
export default {
  id: "midnight",
  label: "Midnight",
  mode: "dark",
  colors: {
    app: "#121212",
    panel: "#0e0e0e",
    raised: "#202020",
    "raised-hover": "#2c2c2c",
    composer: "#1f1f1f",
    "composer-ring": "#2a2a2a",
    card: "#1f1f1f",
    // the float, one step off the card: card, composer and menu stay one raised surface; the phones
    // use the same value
    menu: "#202020",
    "menu-hover": "#f5f5f50f",
    "menu-active": "#f5f5f514",
    inset: "#1b1b1b",
    control: "#282828",
    hairline: "#38383873",
    edge: "#383838",
    ink: "#f5f5f5",
    "ink-secondary": "#f5f5f5a8",
    "ink-tertiary": "#f5f5f591",
    // white 4.62:1; was #1084fe (3.65:1)
    accent: "#0071ea",
    "accent-border": "#459ffe",
    "accent-text": "#7fc0ff",
    focus: "#459ffe",
    "accent-ink": "#ffffff",
    "bubble-user": "#5a5a5a",
    "bubble-user-ink": "#f5f5f5",
    success: "#38d591",
    "success-ink": "#072114",
    // white 4.61:1; was #ff5667 (3.10:1)
    danger: "#db314b",
    // the bright red as words, a touch lighter than #ff5667 so it also reads on the phone's raised menu (4.93:1);
    // the phone apps use the same value
    "danger-text": "#f86e68",
    "danger-ink": "#ffffff",
    warning: "#ff9800",
    "warning-text": "#ff9800",
    "warning-ink": "#2b1400",
    scrollbar: "#3d3d3d",
    "maus-line": "#f5f5f5",
    // no shadows on a dark ground: surfaces part by tone and rim, as Midnight does in Simple mode
    shadow: "transparent",
  },
  font: GEIST,
  radius: { lg: "0.5rem", xl: "0.75rem" },
  identity: {
    green: "#009957",
    blue: "#377FE6",
    red: "#D94B52",
    orange: "#E78531",
    purple: "#8d69ce",
    cyan: "#0EA5C6",
    pink: "#D84F8B",
    yellow: "#D8A729",
    teal: "#01A492",
    coral: "#E5634E",
    silver: "#A8ADB4",
    chrome: "#B3BAC4",
  },
  captionSymbol: "#b5b5b5",
  wideGamut: {
    tokens: ["accent", "accent-border", "accent-text", "success", "danger", "danger-text", "warning", "warning-text"],
    pinned: {
      "accent-border": "color(display-p3 0.3457 0.6136 0.9909)",
      "accent-text": "color(display-p3 0.5417 0.7465 0.9948)",
    },
  },
  phone: {
    colors: {
      app: "#141414",
      panel: "#1c1c1e",
      raised: "#2c2c2e",
      "raised-hover": "#3a3a3c",
      composer: "#2c2c2e",
      "composer-ring": "#3a3a3c",
      card: "#242426",
      menu: "#2c2c2e",
      inset: "#1c1c1e",
      control: "#2c2c2e",
      hairline: "#3a3a3c73",
      // a step brighter than the divider, so a control's edge still shows on the raised phone menu (1.39:1)
      edge: "#424244",
    },
    radius: {
      lg: "12px",
      xl: "18px",
      "2xl": "22px",
      "3xl": "28px",
      menu: "22px",
    },
  },
  phones: true,
} satisfies SkinSource;
