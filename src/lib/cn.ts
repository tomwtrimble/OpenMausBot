import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { TYPE_STEPS } from "@/theme/tokens/type";

// tailwind-merge reads an unknown `text-*` as a colour, so `text-ui text-ink` would lose its size.
const twMerge = extendTailwindMerge({ extend: { theme: { text: TYPE_STEPS } } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
