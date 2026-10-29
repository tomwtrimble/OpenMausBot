import { SYSTEM } from "../fonts.ts";
import type { SkinSource } from "../skin.ts";

/**
 * Cool daylight — the fourth corner, and the one the grid was missing: Midnight is dark and cool, Atelier light and
 * warm, Foundry dark and warm. Where Atelier is paper, this is glazed ceramic. The neutrals carry a green- blue cast
 * rather than a cream one (#eef2f2, not #f5f1eb), so the whole surface reads cool without a single saturated pixel,
 * and the deep teal accent belongs to the ground instead of sitting on top of it. Even the ink is a very dark petrol
 * rather than a neutral black — on a tinted ground a truly neutral black reads as a foreign object. Corners are the
 * most generous of the four (8px / 14px): glass and ceramic round more than paper does, and far more than sheet
 * metal.
 */
export default {
  id: "lagoon",
  label: "Lagoon",
  mode: "light",
  colors: {
    // The tint is the point, so it is carried by the surfaces, not by a button: the ground sits 13 points of
    // green-blue above its red channel, roughly three times Atelier's cream cast, which is what makes the skin read as
    // teal at a glance. Raised surfaces stay pure white as the contrast anchor — tinting those too turns the whole
    // thing to soup.
    app: "#dfeceb",
    panel: "#ecf4f3",
    raised: "#ffffff",
    "raised-hover": "#cfe4e1",
    composer: "#ffffff",
    "composer-ring": "transparent",
    // a step under white (1.05:1), so a white hover, chip or selected row shows on a card; it was white,
    // the same as raised and menu
    card: "#f3fbfa",
    menu: "#ffffff",
    "menu-hover": "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    "menu-active": "var(--color-raised)",
    inset: "#d5e8e5",
    // Lagoon's surfaces climb white → panel → app → inset → hover in small steps, so a control has to sit below the
    // lot to clear every one it can land on: 1.44:1 on a card, 1.29:1 on the panel, 1.13:1 on an inset row, 1.09:1
    // under the hover tone.
    control: "#c3dcd9",
    // 1.60:1 — level with the other three
    hairline: "#aebfbd73",
    edge: "#aebfbd",
    // dark petrol; a neutral black would read as a foreign object on a tinted ground
    ink: "#14201f",
    // 7.0:1 on white, 5.8:1 on the ground
    "ink-secondary": "#4d5c5b",
    "ink-tertiary": "#566564",
    // deep teal, carries white at 5.68:1
    accent: "#11736d",
    "accent-border": "#14807a",
    // 7.5:1 on a card
    "accent-text": "#0d5f5a",
    // the ring rides the accent, not Grok blue
    focus: "#0d5f5a",
    "accent-ink": "#ffffff",
    "bubble-user": "#cfe4e1",
    "bubble-user-ink": "#14201f",
    success: "#2f6b4f",
    "success-ink": "#ffffff",
    danger: "#a8382f",
    // a shade further from the ground than #a8382f, so an error also reads on a control (4.5:1)
    "danger-text": "#a6362e",
    "danger-ink": "#ffffff",
    // the needs-you fill, an amber that marks the page at 3:1 and carries the dark ink; was #7a5a2a, now the words
    warning: "#b97800",
    "warning-text": "#7a5a2a",
    "warning-ink": "#2b1400",
    scrollbar: "#a6b8b6",
    "maus-line": "#4d5c5b",
    // shadows in the ink's own tint, never raw black
    shadow: "#14201f",
  },
  font: SYSTEM,
  radius: { lg: "8px", xl: "14px" },
  identity: {
    green: "#007945",
    blue: "#1a65d1",
    red: "#c82a32",
    orange: "#a25513",
    purple: "#7c51c6",
    cyan: "#0a738b",
    pink: "#c12b6d",
    yellow: "#836518",
    teal: "#01776a",
    coral: "#c3341d",
    silver: "#646a73",
    chrome: "#5f6a7b",
  },
  captionSymbol: "#4d5c5b",
  wideGamut: {
  },
  phones: true,
} satisfies SkinSource;
