import { SYSTEM } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * A neutral daylight skin: less cream than Atelier and less blue-green than Lagoon. Navy is used as ink rather than
 * decoration, keeping the workspace crisp and familiar instead of colourful.
 */
export default {
  id: "linen",
  label: "Linen",
  mode: "light",
  colors: {
    app: "#eceff3",
    panel: "#f5f6f8",
    raised: "#ffffff",
    "raised-hover": "#e1e6ed",
    composer: "#ffffff",
    "composer-ring": "transparent",
    // a step under white (1.05:1), so a white hover, chip or selected row shows on a card; it was white,
    // the same as raised and menu
    card: "#f8fafc",
    menu: "#ffffff",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    inset: "#e6e9ee",
    control: "#d3d9e1",
    hairline: "#b4bbc573",
    edge: "#b4bbc5",
    ink: "#1d2229",
    "ink-secondary": "#59616c",
    "ink-tertiary": "#5f6671",
    accent: "#355f8a",
    "accent-border": "#4978a6",
    "accent-text": "#2c5680",
    focus: "#2c5680",
    "accent-ink": "#ffffff",
    "bubble-user": "#e1e6ed",
    "bubble-user-ink": "#1d2229",
    success: "#2f704f",
    "success-ink": "#ffffff",
    danger: "#a83d48",
    // a shade further from the ground than #a83d48, so an error also reads on a control (4.5:1)
    "danger-text": "#a43944",
    "danger-ink": "#ffffff",
    // the needs-you fill, an amber that marks the page at 3:1 and carries the dark ink; was #765b2b, now the words
    warning: "#be7b00",
    "warning-text": "#765b2b",
    "warning-ink": "#2b1400",
    scrollbar: "#aeb6c0",
    "maus-line": "#59616c",
    // shadows in the ink's own tint, never raw black
    shadow: "#1d2229",
  },
  font: SYSTEM,
  radius: { lg: "8px", xl: "12px" },
  identity: {
    green: "#007d47",
    blue: "#1b68d7",
    red: "#ce2c34",
    orange: "#a75713",
    purple: "#7f55c8",
    cyan: "#0a778e",
    pink: "#c72c70",
    yellow: "#886819",
    teal: "#017a6d",
    coral: "#c9361e",
    silver: "#676d77",
    chrome: "#626d7e",
  },
  captionSymbol: "#59616c",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
