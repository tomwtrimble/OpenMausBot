/**
 * The product type scale. Each step is a Tailwind `text-*` utility that sets the size and its line height; a
 * `leading-*` beside it still wins. Captions and badges; secondary lines; compact controls and settings rows; labels,
 * the text of what you pick, press or type into (a bot's name, a menu row, a button, the composer); reading text;
 * dialog and card titles; page titles.
 */
export const TYPE_SCALE = {
  caption: { size: 11, lineHeight: 16 },
  small: { size: 12, lineHeight: 18 },
  ui: { size: 13, lineHeight: 20 },
  label: { size: 14, lineHeight: 20 },
  body: { size: 15, lineHeight: 22 },
  title: { size: 17, lineHeight: 24 },
  display: { size: 20, lineHeight: 28 },
} as const satisfies Record<string, { size: number; lineHeight: number }>;

export type TypeStep = keyof typeof TYPE_SCALE;

export const TYPE_STEPS = Object.keys(TYPE_SCALE) as TypeStep[];
