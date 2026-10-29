import { CornerDownRight, Pencil, Trash2 } from "lucide-react";

import type { SteerQueueReason } from "../../shared/wire";
import { t } from "@/lib/i18n";
import { replySnippet } from "@/lib/replies";
import { splitTranscriptCitations } from "@/lib/citations";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";

const ATTACHMENT_TAG = /<attached-(?:image|file)\s/;

function queuedMessageLabel(text: string): string {
  return splitTranscriptCitations(text).citations.length || ATTACHMENT_TAG.test(text) ? replySnippet(text, 500) : text;
}

export function composerCanSteerQueuedMessages(
  busy: boolean,
  locked: boolean,
  pendingCount: number,
  approvalPending = false,
): boolean {
  return busy && !locked && !approvalPending && pendingCount > 0;
}

export const DOUBLE_ENTER_STEER_WINDOW_MS = 1_500;

export function doubleEnterSteerWindowExpiresAt(
  prevPendingCount: number,
  pendingCount: number,
  busy: boolean,
  canSteer: boolean,
  now = Date.now(),
): number | null {
  if (!busy || !canSteer) return null;
  return pendingCount > prevPendingCount ? now + DOUBLE_ENTER_STEER_WINDOW_MS : null;
}

export function doubleEnterSteersQueue(
  windowExpiresAt: number,
  now: number,
  pendingCount: number,
  hasContent: boolean,
): boolean {
  return !hasContent && pendingCount > 0 && now < windowExpiresAt;
}

export function QueuedComposerMessages({
  items,
  onSteer,
  steerMode = "all",
  steering = false,
  steerInterrupts = false,
  onCancel,
  onEdit,
}: {
  items: Array<{ queueId: string; text: string; reason?: SteerQueueReason }>;
  onSteer?: () => void;
  steerMode?: "all" | "next";
  steering?: boolean;
  steerInterrupts?: boolean;
  onCancel: (queueId: string) => void;
  onEdit?: (queueId: string) => void;
}) {
  if (!items.length) return null;

  const multiple = items.length > 1;
  const steerLabel = steering
    ? t("composer.queued.steering")
    : multiple
      ? steerMode === "all"
        ? t("composer.queued.steerAll")
        : t("composer.queued.steerNext")
      : t("composer.queued.steer");
  const steerDescription = steerInterrupts
    ? multiple
      ? steerMode === "all"
        ? t("composer.queued.steerAllInterruptHint", { count: items.length })
        : t("composer.queued.steerNextInterruptHint")
      : t("composer.queued.steerInterruptHint")
    : multiple
      ? steerMode === "all"
        ? t("composer.queued.steerAllHint", { count: items.length })
        : t("composer.queued.steerNextHint")
      : t("composer.queued.steerHint");

  return (
    <div
      className="relative z-[1] mx-3 -mb-3 max-h-36 overflow-y-auto rounded-t-2xl border border-b-0 border-hairline bg-raised/95 pb-3 shadow-sm backdrop-blur-sm"
      aria-label={
        items.length === 1
          ? t("composer.queued.regionOne")
          : t("composer.queued.regionMany", { count: items.length })
      }
      aria-live="polite"
    >
      {items.some((item) => item.reason === "group-turn") && (
        <p className="px-3 pt-2 text-small text-ink-secondary">{t("composer.queued.groupTurn")}</p>
      )}
      {items.some((item) => item.reason === "capacity") && (
        <p className="px-3 pt-2 text-small text-ink-secondary">{t("composer.queued.capacity")}</p>
      )}
      <ul className="divide-y divide-hairline" aria-label={t("composer.queued.list")}>
        {items.map((item, index) => {
          const label = queuedMessageLabel(item.text);
          return <li key={item.queueId} className="flex min-h-10 min-w-0 items-center gap-2 px-2.5 py-1.5">
            <CornerDownRight
              size={14}
              strokeWidth={1.8}
              className="shrink-0 text-ink-secondary"
              aria-hidden="true"
            />
            <span dir="auto" className="min-w-0 flex-1 truncate text-label text-ink" title={label}>
              {label}
            </span>
            {index === 0 && onSteer && (
              <Button variant="ghost" size="md"
                onClick={onSteer}
                disabled={steering}
                aria-label={steering ? t("composer.queued.steeringAria") : steerDescription}
                title={steerDescription}
                className="flex shrink-0 gap-1 outline-none disabled:cursor-wait"
              >
                <CornerDownRight
                  size={13}
                  strokeWidth={2}
                  className={steering ? "animate-pulse" : undefined}
                  aria-hidden="true"
                />
                {steerLabel}
              </Button>
            )}
            {onEdit && (
              <IconButton label={t("composer.queued.editAria", { index: index + 1, count: items.length })} tooltip={t("composer.queued.editTitle")}
                onClick={() => onEdit(item.queueId)}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-secondary outline-none hover:bg-raised-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-focus/60"
              >
                <Pencil size={14} aria-hidden="true" />
              </IconButton>
            )}
            <IconButton label={t("composer.queued.deleteAria", { index: index + 1, count: items.length })} tooltip={t("composer.queued.deleteTitle")}
              onClick={() => onCancel(item.queueId)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-secondary outline-none hover:bg-raised-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-focus/60"
            >
              <Trash2 size={14} aria-hidden="true" />
            </IconButton>
          </li>;
        })}
      </ul>
    </div>
  );
}
