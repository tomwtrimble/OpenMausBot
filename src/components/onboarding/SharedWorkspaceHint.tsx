import { useId, useState } from "react";
import { MausAvatar } from "@/components/Avatar";
import { t } from "@/lib/i18n";
import { Button } from "../ui/Button";

const DISMISSED_KEY = "omb.onboarding.sharedWorkspaceHint";

export function sharedHintDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
  }
}

export function SharedWorkspaceHint({
  replay,
  onClose,
}: {
  replay: boolean;
  onClose: () => void;
}) {
  const [dismissed, setDismissed] = useState(sharedHintDismissed);
  const titleId = useId();
  if (dismissed && !replay) return null;
  const close = () => {
    rememberDismissed();
    setDismissed(true);
    onClose();
  };
  return (
    <aside
      aria-labelledby={titleId}
      className="fixed inset-x-3 top-14 z-40 flex items-start gap-3 rounded-2xl border border-hairline bg-panel p-3.5 shadow-[0_24px_60px_-20px_color-mix(in_srgb,var(--color-shadow)_60%,transparent)] sm:inset-x-auto sm:right-5 sm:top-16 sm:w-[360px]"
    >
      <div className="shrink-0">
        <MausAvatar color="green" state="happy" size={36} trackPointer={false} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-label font-semibold text-ink">
          {t("onboarding.shared.title")}
        </h2>
        <p className="mt-1 text-ui leading-relaxed text-ink-secondary">{t("onboarding.shared.body")}</p>
        <Button variant="primary"
          onClick={close}
          className="mt-2.5 transition-transform duration-150 active:scale-[0.98]"
        >
          {t("onboarding.spot.gotIt")}
        </Button>
      </div>
    </aside>
  );
}
