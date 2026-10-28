import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Share } from "lucide-react";

import { cn } from "@/lib/cn";
import {
  copyTranscriptToClipboard,
  downloadMarkdownTranscript,
  formatTranscriptMarkdown,
  slugifyTranscriptFilename,
} from "@/lib/export-transcript";
import type { Message } from "@/state/store";
import { Menu, MenuHeading, MenuItem } from "./ui/Menu";
import { IconButton } from "./ui/IconButton";

export interface ExportTranscriptMenuProps {
  title: string;
  messages: readonly Message[];
  botName?: string;
  isGroup?: boolean;
  className?: string;
}

export function ExportTranscriptMenu({
  title,
  messages,
  botName,
  isGroup = false,
  className,
}: ExportTranscriptMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyboardOpen = useRef(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const hasMessages = messages && messages.length > 0;

  const handleCopy = async () => {
    if (!hasMessages) return;
    const markdown = formatTranscriptMarkdown({
      title,
      messages,
      botName,
      isGroup,
    });
    const success = await copyTranscriptToClipboard(markdown);
    setCopyFailed(!success);
    if (success) {
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    }
  };

  const handleDownload = () => {
    if (!hasMessages) return;
    const markdown = formatTranscriptMarkdown({
      title,
      messages,
      botName,
      isGroup,
    });
    const filename = slugifyTranscriptFilename(title);
    downloadMarkdownTranscript(filename, markdown);
  };

  return (
    <div className="relative">
      <IconButton ref={triggerRef} label="Export conversation" tooltip="Export conversation as Markdown"
        onClick={(event) => { keyboardOpen.current = event.detail === 0; setOpen((prev) => !prev); }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex size-8 items-center justify-center rounded-full transition-colors hover:bg-ink/[0.06]",
          open ? "text-accent-text" : "text-ink-secondary hover:text-ink",
          className,
        )}
      >
        <Share size={18} />
      </IconButton>

      <Menu open={open} onClose={() => setOpen(false)} anchor={triggerRef} placement="below-end" autoFocus={keyboardOpen.current}
        label="Export options" className="w-[220px] overflow-hidden">
        <MenuHeading>Export Conversation</MenuHeading>
        {!hasMessages ? (
          <div className="px-2 py-1.5 text-[12px] text-ink-secondary">
            No messages to export yet.
          </div>
        ) : (
          <>
            <MenuItem keepOpen onSelect={() => void handleCopy()}
              icon={copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}>
              {copied ? "Copied to clipboard!" : "Copy as Markdown"}
            </MenuItem>
            {copyFailed && (
              <div role="status" className="px-2 py-1.5 text-[12px] text-ink-secondary">
                Clipboard unavailable. Download the Markdown file instead.
              </div>
            )}
            <MenuItem onSelect={handleDownload} icon={<Download size={16} />}>Download as .md</MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}
