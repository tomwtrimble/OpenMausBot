import type { CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { IconButton } from "./ui/IconButton";

export function JumpToLatestButton({ onClick, className, style }: { onClick: () => void; className?: string; style?: CSSProperties }) {
  return (
    <IconButton label={t("chat.jumpToLatestAria")} tooltip={t("chat.jumpToLatest")}
      onClick={onClick}
      className={cn("animate-pop-in absolute left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-hairline bg-raised text-ink shadow-lg hover:bg-raised-hover", className)}
      style={style}
    >
      <ArrowDown size={18} aria-hidden="true" />
    </IconButton>
  );
}
