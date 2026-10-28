// Shallow tests walk the element tree a component returns without rendering it. A control drawn with <Button> or
// <IconButton> is an element of that component, not of "button"; these read it as the button it renders.
import { isValidElement, type ReactElement } from "react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

type Node = { type?: unknown; props?: Record<string, unknown> } | null | undefined;

/** A <button>, or a <Button> or <IconButton> that renders one. */
export function isButton(node: Node): boolean {
  return node?.type === "button" || node?.type === Button || node?.type === IconButton;
}

/** The accessible name a shallow node gives its button: aria-label, or an IconButton's label. */
export function buttonName(node: Node): unknown {
  return node?.type === IconButton ? node.props?.label : node?.props?.["aria-label"];
}

/** The props the rendered <button> carries, for a test that reads its title, aria-label or className. */
export function buttonProps(node: Node): Record<string, unknown> {
  if (node && node.type === Button && isValidElement(node)) return (Button(node.props as Parameters<typeof Button>[0]) as ReactElement<Record<string, unknown>>).props;
  if (node?.type === IconButton) {
    const { label, tooltip, ...rest } = node.props ?? {};
    return { ...rest, "aria-label": label, title: tooltip ?? label };
  }
  return node?.props ?? {};
}
