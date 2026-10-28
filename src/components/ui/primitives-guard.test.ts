// Keeps the renderer on its shared primitives (src/components/ui). Two rules, each with the few places that are allowed
// to differ and why:
// - a primary action is a <Button variant="primary">, never a <button> painted with a solid accent fill, unless it is
//   listed below because its design keeps the accent in every skin;
// - a dialog keeps Tab inside itself: it is a <Dialog>, calls useModalDialog, or is listed below with its own trap or as a
//   non-modal surface (a popover, a side panel) where focus may leave.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../../../", import.meta.url).pathname;

function sources(dir = join(ROOT, "src")): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "testing" ? [] : sources(path);
    return /\.tsx?$/.test(name) && !name.includes(".test.") ? [relative(ROOT, path)] : [];
  });
}

/** Each <button>, <Button> or <IconButton> opening tag in a file, braces balanced. */
function buttonTags(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(/<(?:button|Button|IconButton)\b/g)) {
    let depth = 0;
    let end = match.index!;
    for (; end < text.length; end++) {
      const char = text[end];
      if (char === "{") depth++;
      else if (char === "}") depth--;
      else if (char === ">" && depth === 0) break;
    }
    tags.push(text.slice(match.index!, end + 1));
  }
  return tags;
}

const ACCENT_FILL = /(?<![\w:/-])bg-accent(?![\w/-])/;
const ON_ACCENT = /(?<![\w:/-])text-(?:white|accent-ink)(?![\w/-])/;

/** Buttons that may still paint the accent themselves: controls filled by their state or shape, and the actions on
 * Milind's sign-in card, which keep the accent fill in every skin where <Button variant="primary"> would be the ink
 * pill in Midnight and Daylight. (A bot's own send and answer buttons wear its colour through botButton, not the accent.) */
const ACCENT_BUTTONS: Record<string, { count: number; why: string }> = {
  "src/components/CloudIntent.tsx": { count: 1, why: "a round send arrow that fills only once there is something to send" },
  "src/components/MapComposer.tsx": { count: 1, why: "the team map's round send arrow, filled by state" },
  "src/components/VoiceNoteBubble.tsx": { count: 1, why: "the round play and pause control inside a voice note" },
  "src/components/LiveDesktop.tsx": { count: 1, why: "an icon control that shows a held state" },
  "src/components/RoutineCalendarPage.tsx": { count: 2, why: "weekday toggles, filled while chosen" },
  "src/components/widget/WidgetDayPicker.tsx": { count: 1, why: "day toggles, filled while chosen" },
  "src/components/PhoneAppDialog.tsx": { count: 1, why: "a two-line card (Connect your phone and where), not a button-shaped control" },
  "src/components/SignInRequestCard.tsx": { count: 2, why: "the sign-in card's Take control and Done, accent in every skin as main draws them" },
};

/** Dialogs that keep Tab inside with a trap of their own, from before <Dialog>. New dialogs use <Dialog>. */
const OWN_TRAP = new Set([
  "src/components/AttachmentPreview.tsx", "src/components/BotInstructionsDialog.tsx", "src/components/BotProjects.tsx",
  "src/components/CloudAddDialog.tsx", "src/components/CloudProPopup.tsx", "src/components/CommandAllowlistDialog.tsx",
  "src/components/ConfirmDialog.tsx", "src/components/ManageMembersPanel.tsx", "src/components/NewBotDialog.tsx",
  "src/components/PluginsPanel.tsx", "src/components/SettingsModal.tsx", "src/components/SharePresetDialog.tsx",
  "src/components/ShareTeamDialog.tsx", "src/components/SimpleModePrompt.tsx", "src/components/TeamDialog.tsx",
  "src/components/TeamLibraryPanel.tsx", "src/components/TeamMapPage.tsx", "src/components/TeamMemoryDialog.tsx",
  "src/components/UpdateIndicator.tsx", "src/components/VoiceSetupDialog.tsx", "src/components/bot-settings/SkillsSection.tsx",
  "src/components/onboarding/WelcomeFlow.tsx", "src/components/ModelPicker.tsx",
  // drawn inside WelcomeFlow, whose root traps Tab around it
  "src/components/onboarding/ChiefIntro.tsx",
  // the cancel-plan survey and the rail's add sheet cycle Tab themselves, as the buying sheet does
  "src/components/CloudCancelPlan.tsx", "src/components/PlaceAddSheet.tsx",
]);

/** role="dialog" surfaces that are not modal: focus may leave them, so they close on Escape but trap nothing. */
const NON_MODAL: Record<string, string> = {
  "src/components/BotSettingsDialog.tsx": "the bot panel beside the chat",
  "src/components/room-panel/RoomPanel.tsx": "the room panel beside the chat",
  "src/components/SidebarNewChatPanel.tsx": "the New chat panel over the sidebar, aria-modal false",
  "src/components/CitationUI.tsx": "a citation's hover card and its editor popover",
  "src/components/LiveCallSettings.tsx": "a call's settings popover",
  "src/components/bot-panel/AvatarEditorCard.tsx": "the avatar editor popover in the bot panel",
  "src/components/onboarding/Spotlight.tsx": "a tour card beside what it points at",
  "src/components/browser/AuthPrompt.tsx": "a sign-in prompt over the bot's browser",
  "src/components/browser/StreamSurface.tsx": "prompts over the bot's browser",
  "src/components/data/DataFilter.tsx": "a column filter popover",
  "src/components/PlacesRail.tsx": "a place's menu and Find a Cloud, popovers beside the rail",
};

/** Files that only name dialogs in a selector. */
const MENTIONS = new Set(["src/components/LocalVmWorkspace.tsx", "src/components/bot-panel/PanelShell.tsx"]);

describe("shared primitives", () => {
  const files = sources().map((file) => ({ file, text: readFileSync(join(ROOT, file), "utf8") }));

  it("draws primary actions with <Button variant=\"primary\">, not a hand-rolled accent fill", () => {
    const found: Record<string, number> = {};
    for (const { file, text } of files) {
      const count = buttonTags(text).filter((tag) => ACCENT_FILL.test(tag) && ON_ACCENT.test(tag)).length;
      if (count) found[file] = count;
    }
    const over = Object.entries(found).filter(([file, count]) => count > (ACCENT_BUTTONS[file]?.count ?? 0))
      .map(([file, count]) => `${file}: ${count} button(s) painting their own accent fill; use <Button variant="primary">`);
    expect(over).toEqual([]);
    // A file that no longer needs its exemption drops it, so the list only shrinks.
    const stale = Object.keys(ACCENT_BUTTONS).filter((file) => (found[file] ?? 0) < ACCENT_BUTTONS[file]!.count);
    expect(stale).toEqual([]);
  });

  it("keeps Tab inside every modal dialog", () => {
    const untrapped = files.filter(({ file, text }) => {
      const dialog = /role="(?:dialog|alertdialog)"|aria-modal=(?:"true"|\{true\})/.test(text);
      if (!dialog || MENTIONS.has(file) || file.startsWith("src/components/ui/")) return false;
      const trapped = /\buseModalDialog\(/.test(text) || /<Dialog\b/.test(text);
      return !trapped && !OWN_TRAP.has(file) && !(file in NON_MODAL);
    }).map(({ file }) => `${file}: a dialog with no focus trap; use <Dialog> or useModalDialog`);
    expect(untrapped).toEqual([]);
  });

  it("lists non-modal surfaces only while they stay non-modal", () => {
    const modal = Object.keys(NON_MODAL).filter((file) => /aria-modal=(?:"true"|\{true\})/.test(files.find((entry) => entry.file === file)?.text ?? ""));
    expect(modal).toEqual([]);
  });
});
