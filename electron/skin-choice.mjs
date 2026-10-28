// The skin the person chose (or "system"), kept in skin.json beside the window state, so the next window opens on its
// ground instead of flashing another colour before the page stamps its skin.
import fs from "node:fs";
import path from "node:path";
import { isSkinChoice, parseSkinChoice } from "./skin-overlay.cjs";

/** `file` names skin.json (a function, so the user-data folder is read when it is needed); `log` reports a failed save. */
export function createSkinChoiceStore({ file, log }) {
  let choice;
  const read = () => {
    if (choice !== undefined) return choice;
    try {
      choice = parseSkinChoice(fs.readFileSync(file(), "utf8"));
    } catch {
      choice = null;
    }
    return choice;
  };
  const remember = (next) => {
    if (!isSkinChoice(next) || next === read()) return;
    choice = next;
    const target = file();
    const temporary = `${target}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(temporary, JSON.stringify({ choice: next }), { mode: 0o600 });
      fs.renameSync(temporary, target);
    } catch (error) {
      try {
        fs.rmSync(temporary, { force: true });
      } catch {}
      log(`skin choice save failed: ${error?.message ?? error}`);
    }
  };
  return { read, remember };
}

/** Windows shows a new window once its page has stamped the skin, so it never opens on another colour; if the page never
 * says, the window shows after `waitMs` anyway. */
export function showWhenSkinned(win, waitMs = 5_000) {
  const fallback = setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) win.show();
  }, waitMs);
  fallback.unref?.();
  const clear = () => clearTimeout(fallback);
  win.once("show", clear);
  win.once("closed", clear);
}
