import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { MausMotion, MausState } from "@/lib/mascot";
import { Button } from "../../ui/Button";

export interface BeatProps {
  onNext: () => void;
  onSkip: () => void;
  setMascot: (state: MausState) => void;
  bump: (motion: Exclude<MausMotion, "none">) => void;
}

export const inputClass =
  "w-full rounded-lg border border-hairline bg-inset px-3 py-2.5 text-body text-ink placeholder:text-ink-secondary focus:outline-none";

export function staggerIndex(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      variant="primary"
      size="lg"
      data-primary=""
      {...rest}
      className={cn("min-h-10 w-full shrink-0 text-body transition-[transform,opacity] duration-150 active:scale-[0.98]", className)}
    >
      {children}
    </Button>
  );
}

export function QuietButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn("text-small text-ink-secondary transition-colors hover:text-ink", className)}
    >
      {children}
    </button>
  );
}

