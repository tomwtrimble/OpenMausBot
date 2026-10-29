import { GEIST } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * The MausBot brand look: a white page, a sidebar washed in the faintest green, mint for the selected row and a calm
 * green accent. The brand green #1f8a52 carries white at only 4.3:1, so the filled accent is one step deeper; the
 * brand green stays as the accent border.
 */
export default {
  id: "meadow",
  label: "Meadow",
  mode: "light",
  colors: {
    // the thread
    app: "#ffffff",
    // sidebar
    panel: "#f6f8f6",
    raised: "#e9eeea",
    // the selected row, mint
    "raised-hover": "#d6efdf",
    composer: "#ffffff",
    "composer-ring": "#e3e9e4",
    // what a bot says
    card: "#f1f5f2",
    menu: "#ffffff",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    // the search field
    inset: "#e7ece8",
    // a chip on a card
    control: "#dce3de",
    hairline: "#c9d3cc73",
    edge: "#c9d3cc",
    ink: "#0f1a13",
    "ink-secondary": "#3e4a42",
    "ink-tertiary": "#4f5c54",
    accent: "#1a7a48",
    "accent-border": "#1f8a52",
    "accent-text": "#176b3f",
    focus: "#1a7a48",
    "accent-ink": "#ffffff",
    // your own messages, a step under a bot's card
    "bubble-user": "#e1e9e3",
    "bubble-user-ink": "#0f1a13",
    // a teal of its own: it was the accent green, so a working dot and an unread dot were one colour
    success: "#007671",
    "success-ink": "#ffffff",
    danger: "#c02b3a",
    // a shade further from the ground than #c02b3a, the fill, so an error also reads on a control (4.5:1)
    "danger-text": "#bd2838",
    "danger-ink": "#ffffff",
    // the needs-you fill, an amber that marks the page at 3:1 and carries the dark ink; was #8a5a00, now the words
    warning: "#c68100",
    "warning-text": "#8a5a00",
    "warning-ink": "#2b1400",
    scrollbar: "#c3cdc6",
    "maus-line": "#5a675f",
    // shadows in the ink's own tint, never raw black
    shadow: "#0f1a13",
  },
  font: GEIST,
  radius: { lg: "10px", xl: "16px" },
  identity: {
    green: "#00884e",
    blue: "#2573e4",
    red: "#d63f47",
    orange: "#b65f15",
    purple: "#8057C8",
    cyan: "#0b819b",
    pink: "#d3397d",
    yellow: "#93721b",
    teal: "#018577",
    coral: "#db3a20",
    silver: "#707782",
    chrome: "#6b778a",
  },
  captionSymbol: "#4d5a52",
  wideGamut: {
  },
  phone: {
    colors: {
      app: "#f6f8f6",
      panel: "#fcfdfc",
      // bot messages a step under the white menus that float over them (1.02:1); they were white too
      card: "#fbfdfb",
      inset: "#e9eeea",
      "composer-ring": "#cfd8d1",
      hairline: "#c1ccc473",
      edge: "#c1ccc4",
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
