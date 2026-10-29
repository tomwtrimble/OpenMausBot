import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

/** primary: the neutral ink pill in Midnight and Daylight (Simple mode's), the accent fill in the other skins. secondary: the quiet
 * control. ghost: no fill until hovered. danger: a destructive action, filled in the danger tone. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
/** Omitted, a button is 32px; md is 28px, sm 24px, lg 36px (the `.ui-button` scale in styles.css). */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** fully round, at the label step (14px) and regular weight, as Simple mode's first-run and Cloud sheet actions are */
  pill?: boolean;
  /** Busy: keeps its colours, shows a spinner before the label and ignores presses until it is done. */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string | undefined> = {
  primary: "ui-button-primary",
  secondary: undefined,
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
};

const SIZE: Record<ButtonSize, string> = { sm: "ui-button-sm", md: "ui-button-md", lg: "ui-button-lg" };

/** The class list a `<Button>` renders, for the rare control that has to stay another element (a link, a label). */
export function buttonClass({ variant = "secondary", size, pill, className }: Pick<ButtonProps, "variant" | "size" | "pill" | "className"> = {}): string {
  return cn("ui-button", VARIANT[variant], size && SIZE[size], pill && "ui-button-pill", className);
}

export function Button({ variant = "secondary", size, pill, loading = false, type = "button", className, disabled, onClick, children, ref, ...rest }: ButtonProps) {
  const swallow = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      ref={ref}
      // A submit button inside a form stays a submit button only when asked: the default is a plain button.
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-loading={loading ? "" : undefined}
      onClick={swallow}
      className={buttonClass({ variant, size, pill, className })}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="ui-button-spinner size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}
