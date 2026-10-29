import { GEIST } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * Neutral charcoal for people who want a dark workspace without Midnight's near-black contrast or Foundry's warmth.
 * Steel blue stays deliberately desaturated: it marks actions and focus without making the chrome glow.
 */
export default {
  id: "graphite",
  label: "Graphite",
  mode: "dark",
  colors: {
    app: "#111214",
    panel: "#181a1d",
    raised: "#2a2d32",
    "raised-hover": "#353941",
    composer: "#2a2d32",
    "composer-ring": "transparent",
    card: "#22252a",
    // the float, a step above the card it floats over and under raised, which stays the row hover; it was #22252a, the card
    menu: "#25282d",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    inset: "#0d0e10",
    control: "#2a2d32",
    hairline: "#3b404873",
    edge: "#3b4048",
    ink: "#f2f4f7",
    "ink-secondary": "#b3b8c2",
    "ink-tertiary": "#9fa4ad",
    accent: "#4f75a2",
    "accent-border": "#698fbb",
    "accent-text": "#8fb4df",
    focus: "#8fb4df",
    "accent-ink": "#ffffff",
    "bubble-user": "#30343a",
    "bubble-user-ink": "#f2f4f7",
    success: "#63b58a",
    "success-ink": "#101a14",
    danger: "#dd6b73",
    // a shade further from the ground than #dd6b73, so an error also reads on a control (4.5:1)
    "danger-text": "#e47179",
    "danger-ink": "#1e0b0e",
    warning: "#d3a150",
    "warning-text": "#d3a150",
    "warning-ink": "#2b1400",
    scrollbar: "#464b54",
    "maus-line": "#b3b8c2",
    // no shadows on a dark ground: surfaces part by tone and rim, as Midnight does in Simple mode
    shadow: "transparent",
  },
  font: GEIST,
  radius: { lg: "6px", xl: "10px" },
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
  captionSymbol: "#b3b8c2",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
