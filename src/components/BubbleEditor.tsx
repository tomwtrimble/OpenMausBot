import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { useAdvancedMode } from "@/lib/interface-mode";
import { sendsMessage, useSendKey } from "@/lib/send-key";
import type { userBubbleStyle } from "@/lib/user-bubble-tone";
import { SIMPLE_BUBBLE_MAX, SIMPLE_USER_BUBBLE } from "./chat-bubble";
import { Button } from "./ui/Button";

/** Edits one of your sent messages in place, in the bubble's own shape; the send key resubmits and Escape cancels. */
export function BubbleEditor({
  initial,
  onCancel,
  onSubmit,
  bubbleStyle,
}: {
  initial: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
  bubbleStyle?: ReturnType<typeof userBubbleStyle>;
}) {
  const simple = !useAdvancedMode();
  const [draft, setDraft] = useState(initial);
  const sendKey = useSendKey();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const submit = () => {
    if (draft.trim()) onSubmit(draft.trim());
  };
  return (
    <div
      data-chat-bubble={simple ? "simple" : ""}
      className={cn(
        "w-full",
        simple ? cn(SIMPLE_BUBBLE_MAX, SIMPLE_USER_BUBBLE, "py-2") : "max-w-[min(var(--chat-bubble-max),var(--chat-bubble-pct))] rounded-2xl border border-hairline bg-bubble-user px-4 py-3",
        bubbleStyle && "user-bubble-colored",
      )}
      style={bubbleStyle}
    >
      <textarea
        ref={ref}
        dir="auto"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (sendsMessage(e.nativeEvent, sendKey)) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onCancel();
        }}
        rows={Math.min(10, Math.max(2, draft.split("\n").length))}
        className={cn("w-full resize-none bg-transparent text-ink focus:outline-none", simple ? "leading-[22px]" : "text-body leading-relaxed")}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button variant="ghost" size="md"
          onClick={onCancel}
          className="rounded-full font-normal"
        >
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="md"
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-full"
        >
          {t("chat.send")}
        </Button>
      </div>
    </div>
  );
}
