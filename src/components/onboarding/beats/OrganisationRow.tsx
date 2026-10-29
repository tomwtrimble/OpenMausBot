import { useEffect, useRef, useState } from "react";
import { Building2, Check } from "lucide-react";
import type { ManagedDesktopBridge, ManagedDesktopState } from "../../../../electron/managed-desktop.mjs";
import { productName } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { companyModelCount, DEFAULT_ADMIN_ORIGIN } from "@/lib/onboarding";
import { staggerIndex } from "./shared";
import { Button } from "../../ui/Button";

const linkClass = "w-fit text-small text-ink-secondary underline-offset-2 transition-colors hover:text-ink hover:underline";

export function OrganisationRow({
  bridge,
  onOpenSettings,
  onConnected,
}: {
  bridge: ManagedDesktopBridge;
  onOpenSettings: () => void;
  onConnected?: () => void;
}) {
  const [connection, setConnection] = useState<ManagedDesktopState | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const revision = useRef(0);
  const status = useRef<ManagedDesktopState["status"] | undefined>(undefined);
  const connected = useRef(onConnected);
  connected.current = onConnected;

  const accept = (next: ManagedDesktopState) => {
    const changed = status.current !== next.status;
    const arrived = changed && next.status === "connected" && status.current !== undefined;
    status.current = next.status;
    setConnection(next);
    if (changed) setFailed(false);
    if (arrived) connected.current?.();
  };

  useEffect(() => {
    const current = ++generation.current;
    const initialRevision = revision.current;
    const receive = (next: ManagedDesktopState) => {
      if (generation.current !== current) return;
      revision.current++;
      accept(next);
    };
    const unsubscribe = bridge.onState(receive);
    void bridge
      .state()
      .then((next) => {
        if (revision.current === initialRevision) receive(next);
      })
      .catch(() => {});
    return () => {
      generation.current++;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge]);

  const perform = async (action: () => Promise<ManagedDesktopState>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    const current = generation.current;
    const startedRevision = revision.current;
    try {
      const next = await action();
      if (generation.current === current && revision.current === startedRevision) accept(next);
    } catch {
      // IPC errors can carry internal detail; show product copy only.
      if (generation.current === current && revision.current === startedRevision) setFailed(true);
    } finally {
      pending.current = false;
      if (generation.current === current) setBusy(false);
    }
  };

  if (!connection) return null;
  const count = companyModelCount(connection);
  const name = connection.organization?.name;

  let body: React.ReactNode;
  let action: React.ReactNode = null;
  if (connection.status === "signed-out") {
    body = (
      <>
        <p className="text-ui leading-snug text-ink-secondary">
          <span className="font-medium text-ink">{t("onboarding.org.title", { app: productName() })}</span>{" "}
          {t("onboarding.org.body")}
        </p>
        <button type="button" onClick={onOpenSettings} className={linkClass}>
          {t("onboarding.org.otherAddress")}
        </button>
      </>
    );
    action = (
      <Button variant="primary"
        disabled={busy}
        onClick={() => void perform(() => bridge.begin({ portalOrigin: DEFAULT_ADMIN_ORIGIN }))}
        className="shrink-0 transition-[filter]"
      >
        {busy ? t("organization.working") : t("onboarding.org.signIn")}
      </Button>
    );
  } else if (connection.status === "connecting") {
    body = (
      <>
        <p role="status" className="text-ui font-medium text-ink">{t("onboarding.org.finish")}</p>
        {connection.enrollment && (
          <p className="text-small text-ink-secondary">
            {t("onboarding.org.finishHelp")}{" "}
            <code dir="ltr" className="select-all rounded bg-inset px-1.5 py-0.5 tracking-widest text-ink">
              {connection.enrollment.userCode}
            </code>
          </p>
        )}
      </>
    );
    action = (
      <Button variant="ghost" size="md"
        disabled={busy}
        onClick={() => void perform(() => bridge.cancelEnrollment())}
        className="shrink-0 text-small font-normal"
      >
        {t("organization.cancel")}
      </Button>
    );
  } else if (connection.status === "connected") {
    body = (
      <>
        <p className="truncate text-ui font-medium text-ink">{t("onboarding.org.connected", { organization: name ?? "" })}</p>
        <p className="text-small text-ink-secondary">
          {count > 0 ? t("onboarding.org.models", { count }) : t("organization.noModels")}
        </p>
      </>
    );
    action = count > 0 ? <Check size={16} strokeWidth={2.5} className="shrink-0 text-success" aria-hidden="true" /> : null;
  } else {
    body = (
      <>
        {name && <p className="truncate text-ui font-medium text-ink">{name}</p>}
        <button type="button" onClick={onOpenSettings} className={linkClass}>
          {t("onboarding.org.manage")}
        </button>
      </>
    );
  }

  return (
    <div
      className="animate-rise mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-card px-3.5 py-3"
      style={staggerIndex(1)}
    >
      <Building2 size={18} className="shrink-0 text-ink-secondary" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {body}
        {connection.message && (
          <p role="status" className="text-small text-ink-secondary">{connection.message}</p>
        )}
        {failed && <p role="alert" className="text-small text-danger-text">{t("organization.actionFailed")}</p>}
      </div>
      {action}
    </div>
  );
}
