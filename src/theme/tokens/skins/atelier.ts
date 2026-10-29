import { SYSTEM } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * Daylight on paper, and the inverse of Midnight in every axis. Its one structural idea: surfaces get BRIGHTER as
 * they rise — rail, sidebar, content — so the ground closest to the work is the lightest, the opposite of a dark
 * skin where raised means lighter-grey. Four tones were darkened from the first draft to clear AA; the original
 * value is named next to each, so the drift stays auditable.
 */
export default {
  id: "atelier",
  label: "Atelier",
  mode: "light",
  colors: {
    // outermost ground
    app: "#f5f1eb",
    // sidebar
    panel: "#fbf8f2",
    // content — raised means lighter here
    raised: "#ffffff",
    // warm beige doubles as the hover fill
    "raised-hover": "#f2e9dc",
    composer: "#ffffff",
    "composer-ring": "transparent",
    // a step under white (1.05:1), so a white hover, chip or selected row shows on a card; it was white,
    // the same as raised and menu
    card: "#fdf9f3",
    menu: "#ffffff",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    // inset surfaces pick the rail tone back up
    inset: "#f5f1eb",
    // raised is white here and so is a card, so a control needs its own tone: 1.26:1 on a card, and raised-hover still
    // lifts off it
    control: "#ece4d6",
    // #ece7dd was 1.11:1 on the rail → 1.65:1
    hairline: "#c8bda873",
    edge: "#c8bda8",
    // 17.4:1 on white
    ink: "#1a1a18",
    // #8b8578 was 3.67:1 → 5.78:1
    "ink-secondary": "#6b6559",
    "ink-tertiary": "#6d685c",
    // Two accent tones: the fill carries white, the text stands on white. #b06a2c darkened → 5.05:1
    accent: "#a05f25",
    // the original tone lives on as the border
    "accent-border": "#b06a2c",
    // for links on a light ground — 5.81:1
    "accent-text": "#96551f",
    // the ring rides the accent, not Grok blue
    focus: "#96551f",
    "accent-ink": "#ffffff",
    // your own messages in the badge beige
    "bubble-user": "#f2e9dc",
    "bubble-user-ink": "#1a1a18",
    success: "#3f6b47",
    "success-ink": "#ffffff",
    danger: "#a33a32",
    "danger-text": "#a33a32",
    "danger-ink": "#ffffff",
    // the needs-you fill, an amber that marks the page at 3:1 and carries the dark ink; was #7a5f31, now the words
    warning: "#c17d00",
    // darkened → 4.98:1
    "warning-text": "#7a5f31",
    "warning-ink": "#2b1400",
    scrollbar: "#c9c0ae",
    "maus-line": "#6b6559",
    // shadows in the ink's own tint, never raw black
    shadow: "#1a1a18",
  },
  font: SYSTEM,
  radius: { lg: "6px", xl: "10px" },
  identity: {
    green: "#007f48",
    blue: "#1b6adc",
    red: "#d12c34",
    orange: "#a95914",
    purple: "#8057C8",
    cyan: "#0a7891",
    pink: "#ca2d72",
    yellow: "#896a19",
    teal: "#017c6f",
    coral: "#cd361e",
    silver: "#686f79",
    chrome: "#646f80",
  },
  captionSymbol: "#6b6559",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
