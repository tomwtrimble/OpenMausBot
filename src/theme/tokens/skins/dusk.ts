import { GEIST } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * A restrained plum-dark alternative. The violet lives in the neutrals as much as the accent, so the skin feels
 * cohesive rather than neon or themed.
 */
export default {
  id: "dusk",
  label: "Dusk",
  mode: "dark",
  colors: {
    app: "#121014",
    panel: "#19161c",
    raised: "#2b2630",
    "raised-hover": "#37303d",
    composer: "#2b2630",
    "composer-ring": "transparent",
    card: "#231f27",
    // the float, a step above the card it floats over and under raised, which stays the row hover; it was #231f27, the card
    menu: "#26222b",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    inset: "#0d0b0f",
    control: "#2b2630",
    hairline: "#40384773",
    edge: "#403847",
    ink: "#f4eff6",
    "ink-secondary": "#b9afbd",
    "ink-tertiary": "#a199a5",
    // a touch lighter than #765683, so an unread dot reads on the sidebar (3.06:1); white on it 5.86:1
    accent: "#795986",
    "accent-border": "#9670a3",
    "accent-text": "#c49bd2",
    focus: "#c49bd2",
    "accent-ink": "#ffffff",
    "bubble-user": "#332b38",
    "bubble-user-ink": "#f4eff6",
    success: "#6fad83",
    "success-ink": "#101812",
    danger: "#db727a",
    "danger-text": "#db727a",
    "danger-ink": "#210c10",
    warning: "#d0a35d",
    "warning-text": "#d0a35d",
    "warning-ink": "#2b1400",
    scrollbar: "#4a414f",
    "maus-line": "#b9afbd",
    // no shadows on a dark ground: surfaces part by tone and rim, as Midnight does in Simple mode
    shadow: "transparent",
  },
  font: GEIST,
  radius: { lg: "8px", xl: "12px" },
  identity: {
    green: "#009957",
    blue: "#377FE6",
    red: "#D94B52",
    orange: "#E78531",
    purple: "#8d68ce",
    cyan: "#0EA5C6",
    pink: "#D84F8B",
    yellow: "#D8A729",
    teal: "#01A492",
    coral: "#E5634E",
    silver: "#A8ADB4",
    chrome: "#B3BAC4",
  },
  captionSymbol: "#b9afbd",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
