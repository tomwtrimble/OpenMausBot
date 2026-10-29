import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";

export function LocalComputerAutoWarning({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      initialFocus={confirmRef}
      aria-labelledby="local-auto-warning-title"
      aria-describedby="local-auto-warning-body"
      className="w-full max-w-[420px] rounded-2xl border border-hairline bg-panel p-5 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-text" />
        <div>
          <h2 id="local-auto-warning-title" className="text-body font-semibold text-ink">
            {t("permissions.localAuto.title")}
          </h2>
          <p id="local-auto-warning-body" className="mt-1.5 text-ui leading-relaxed text-ink-secondary">
            {t("permissions.localAuto.body")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="lg"
          onClick={onCancel}
          className="rounded-xl font-normal"
        >
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="lg"
          ref={confirmRef}
          onClick={onConfirm}
          className="rounded-xl"
        >
          {t("common.ok")}
        </Button>
      </div>
    </Dialog>
  );
}
