import { useRef, type HTMLAttributes, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

import { useModalDialog } from "@/hooks/use-modal-dialog";

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Closed, nothing renders. Defaults to open, for a dialog its caller mounts only while it shows. */
  open?: boolean;
  /** Escape, a press on the backdrop (unless `dismissOnBackdrop` is false) and the caller's own Close all end here. */
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  /** Where focus lands on open; without it a field with autoFocus keeps it, else the dialog itself takes it. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Where focus goes on close when the control that opened the dialog has gone. */
  returnFocus?: RefObject<HTMLElement | null>;
  /** The full-window layer behind the dialog: position, scrim, padding. */
  overlayClassName?: string;
  dismissOnBackdrop?: boolean;
  /** Renders into <body>, out of any transformed or clipped ancestor. */
  portal?: boolean;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

export const DIALOG_OVERLAY = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6";

/** A modal dialog: it takes focus on open, keeps Tab inside, closes on Escape and gives focus back on close
 * (useModalDialog). `className` styles the dialog box itself. */
export function Dialog({ open = true, ...props }: DialogProps) {
  return open ? <DialogLayer {...props} /> : null;
}

function DialogLayer({ onClose, role = "dialog", initialFocus, returnFocus, overlayClassName, dismissOnBackdrop = true, portal = false, ref, className, children, ...rest }: Omit<DialogProps, "open">) {
  const own = useRef<HTMLDivElement>(null);
  useModalDialog(own, onClose, { initialFocus, returnFocus });
  const setRef = (node: HTMLDivElement | null) => {
    own.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const layer = (
    <div
      className={overlayClassName ?? DIALOG_OVERLAY}
      // A press that starts on the backdrop, not a drag out of a field that ends there, dismisses.
      onMouseDown={dismissOnBackdrop ? (event) => { if (event.target === event.currentTarget) onClose(); } : undefined}
    >
      <div ref={setRef} role={role} aria-modal="true" tabIndex={-1} className={className} {...rest}>
        {children}
      </div>
    </div>
  );
  return portal && typeof document !== "undefined" ? createPortal(layer, document.body) : layer;
}
