import { t } from "@/lib/i18n";
import { Button } from "./ui/Button";

export function NewConversationInstead({ onNew }: { onNew: () => void }) {
  return (
    <div className="pointer-events-auto mx-5 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-raised px-4 py-3" data-testid="cloud-guest-composer">
      <p className="text-[13px] text-ink-secondary">{t("chat.cloudGuest.notYours")}</p>
      <Button variant="primary" size="md" onClick={onNew} className="shrink-0 rounded-full">
        {t("chat.cloudGuest.newConversation")}
      </Button>
    </div>
  );
}
