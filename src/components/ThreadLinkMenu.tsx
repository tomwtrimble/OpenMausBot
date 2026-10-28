import { createContext, useContext, useState, type MouseEvent } from "react";
import { Link2, Link2Off, Pin } from "lucide-react";
import { t } from "@/lib/i18n";
import { copyText } from "@/lib/copy-text";
import { threadLinkUrl } from "../../shared/thread-link";
import { Menu, MenuItem } from "./ui/Menu";

export const ThreadLinkContext = createContext<{ link?: string; assign: (link: string | null) => void } | null>(null);

/** A thread link's own menu, at the pointer: pin it to this thread or copy it. */
export function useThreadLinkMenu(href: string | undefined) {
  const thread = useContext(ThreadLinkContext);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const url = threadLinkUrl(href);
  if (!thread || !url) return { onContextMenu: undefined, menu: null };
  const assigned = thread.link === url;
  return {
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      setAt({ x: event.clientX, y: event.clientY });
    },
    menu: (
      <Menu open={at !== null} onClose={() => setAt(null)} anchor={at ?? { x: 0, y: 0 }} label={url} autoFocus className="w-[220px]">
        <MenuItem icon={assigned ? <Link2Off size={16} /> : <Pin size={16} />} onSelect={() => thread.assign(assigned ? null : url)}>
          {t(assigned ? "task.unassignLink" : "task.assignLink")}
        </MenuItem>
        <MenuItem icon={<Link2 size={16} />} onSelect={() => void copyText(url)}>{t("task.copyLink")}</MenuItem>
      </Menu>
    ),
  };
}
