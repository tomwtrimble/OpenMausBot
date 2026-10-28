import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

import { Tooltip, type TooltipSide } from "./Tooltip";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "title"> {
  /** The button's accessible name, and its tooltip unless `tooltip` says otherwise. Required: an icon has no words. */
  label: string;
  /** What the tooltip shows when it says more than the name (a shortcut, a state); false shows none. */
  tooltip?: ReactNode | false;
  tooltipSide?: TooltipSide;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/**
 * A button that shows only an icon. Without a className it is the 32px `.ui-icon-button`; with one, that className is
 * its whole look, so a control keeps its own size and fill while it gains the label and tooltip.
 */
export function IconButton({ label, tooltip, tooltipSide, type = "button", className, ref, children, ...rest }: IconButtonProps) {
  return (
    <Tooltip content={tooltip === false ? null : tooltip ?? label} side={tooltipSide}>
      <button ref={ref} type={type} aria-label={label} className={className ?? "ui-icon-button"} {...rest}>
        {children}
      </button>
    </Tooltip>
  );
}
