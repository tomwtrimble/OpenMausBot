import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]';

export interface ModalDialogOptions {
  /** Where focus lands on open. Without it focus stays on a field already inside (autoFocus), else goes to the dialog. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Where focus goes on close when the control that opened the dialog has left the page. */
  returnFocus?: RefObject<HTMLElement | null>;
}

/** The dialog element needs `tabIndex={-1}` so it can take focus when it has no field to start in. */
export function useModalDialog(dialogRef: RefObject<HTMLElement | null>, onClose: () => void, options: ModalDialogOptions = {}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const start = optionsRef.current.initialFocus?.current;
    if (start && dialog.contains(start)) start.focus();
    else if (!dialog.contains(document.activeElement)) dialog.focus();
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.getAttribute("tabindex") !== "-1" && !element.closest("[hidden], [inert]"));
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return event.preventDefault();
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement) || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onKey);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      // `isConnected` is false only once the opener has left the page.
      const opener = previousFocus && previousFocus.isConnected !== false && previousFocus !== document.body ? previousFocus : null;
      (opener ?? optionsRef.current.returnFocus?.current)?.focus();
    };
  }, [dialogRef]);
}
