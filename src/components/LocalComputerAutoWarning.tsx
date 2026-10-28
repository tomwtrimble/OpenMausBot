import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { Dialog } from "./ui/Dialog";

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
          <h2 id="local-auto-warning-title" className="text-[15px] font-semibold text-ink">
            {t("permissions.localAuto.title")}
          </h2>
          <p id="local-auto-warning-body" className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
            {t("permissions.localAuto.body")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-[13px] text-ink-secondary hover:bg-raised hover:text-ink"
        >
          {t("common.cancel")}
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-accent px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
        >
          {t("common.ok")}
        </button>
      </div>
    </Dialog>
  );
}
