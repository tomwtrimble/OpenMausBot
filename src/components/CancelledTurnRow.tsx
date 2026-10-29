import { RefreshCw } from "lucide-react";
import { t } from "@/lib/i18n";
import { PERSON_STOPPED_TURN_NAME } from "../../shared/client-cancel";
import { Button } from "./ui/Button";

/** A stopped turn, never an error. `name` is the row's tool name: a turn the person stopped says so. */
export function CancelledTurnRow({ onRetry, name }: { onRetry?: () => void; name?: string }) {
  return (
    <div role="status" className="flex w-fit max-w-full flex-wrap items-center gap-2 text-ui text-ink-secondary">
      <span>{t(name === PERSON_STOPPED_TURN_NAME ? "chat.turnStoppedByYou" : "chat.turnStopped")}</span>
      {onRetry && (
        <Button variant="ghost" size="md"
          onClick={onRetry}
          className="gap-1 rounded-full border border-hairline font-normal"
        >
          <RefreshCw size={12} /> {t("chat.retry")}
        </Button>
      )}
    </div>
  );
}
