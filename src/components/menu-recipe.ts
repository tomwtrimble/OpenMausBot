export const MENU_SHEET = "popover-surface flex flex-col gap-1 rounded-[var(--radius-menu)] border border-hairline bg-menu p-1.5 shadow-lg [&_svg.lucide]:stroke-[1.5]";

export const MENU_ITEM = "flex min-h-[30px] w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-label leading-[18px] focus-visible:bg-menu-hover";

export const MENU_ITEM_SEPARATOR = "mx-1.5 h-px shrink-0 bg-hairline";

export const MENU_HEADING = "px-2 pb-1 pt-2 text-small font-medium leading-4 text-ink-secondary";

export const MENU_ROW =
  "group flex h-[30px] w-full min-w-0 shrink-0 items-center gap-2 rounded-md px-2 text-left text-ui leading-[18px] text-ink hover:bg-ink/[0.06] focus:bg-ink/[0.06] active:bg-ink/[0.08] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent touch:h-10";

/** Simple mode's rows pair a model name with a second line, so they grow with it instead of clipping at 30px. */
export const SIMPLE_MENU_ROW =
  "group flex min-h-[30px] w-full min-w-0 shrink-0 items-center gap-2 rounded-md px-2 py-1 text-left text-ui leading-[18px] text-ink hover:bg-ink/[0.06] focus:bg-ink/[0.06] active:bg-ink/[0.08] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent touch:min-h-10";

export const SIMPLE_MENU_META = "min-w-0 max-w-full truncate text-small leading-4 text-ink-tertiary";

export const MENU_LINE = "flex h-[30px] w-full min-w-0 shrink-0 items-center gap-2 px-2 text-ui leading-[18px] touch:h-10";

export const MENU_GUTTER = "flex size-4 shrink-0 items-center justify-center";

export const MENU_META = "min-w-0 max-w-[45%] shrink truncate text-small leading-4 text-ink-tertiary";

export const MENU_LABEL = "flex h-6 shrink-0 items-end gap-2 px-2 pb-0.5 text-small font-medium leading-4 text-ink-tertiary";

export const MENU_SEPARATOR = "mx-2 my-[5px] h-[0.5px] shrink-0 bg-ink/10";

export const MENU_NOTE = "px-2 py-1 text-small leading-4 text-ink-tertiary";

export const MENU_ICON = "shrink-0 text-ink-secondary";

export const MENU_TRAILING = "shrink-0 text-ink-tertiary rtl:-scale-x-100";

export const MENU_STROKE = 1.75;

/** The item an arrow, Home or End moves a menu's focus to, wrapping; null for any other key. */
export function nextMenuIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  switch (key) {
    case "ArrowDown": return current < 0 ? 0 : (current + 1) % count;
    case "ArrowUp": return current < 0 ? count - 1 : (current - 1 + count) % count;
    case "Home": return 0;
    case "End": return count - 1;
    default: return null;
  }
}
