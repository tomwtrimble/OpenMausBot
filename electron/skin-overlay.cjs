// The native chrome CSS cannot reach (the Windows caption-button overlay accepts no alpha, so opaque hex).
// The entries are generated with the skins (scripts/tokens/generate.mjs); keep the ids in step with src/lib/skins.ts.
"use strict";

const SKIN_CHROME = Object.freeze({
// @generated tokens:chrome start
  midnight: Object.freeze({ color: "#121212", symbolColor: "#b5b5b5" }),
  atelier: Object.freeze({ color: "#f5f1eb", symbolColor: "#6b6559" }),
  foundry: Object.freeze({ color: "#100e0b", symbolColor: "#b0a696" }),
  lagoon: Object.freeze({ color: "#dfeceb", symbolColor: "#4d5c5b" }),
  graphite: Object.freeze({ color: "#111214", symbolColor: "#b3b8c2" }),
  linen: Object.freeze({ color: "#eceff3", symbolColor: "#59616c" }),
  dusk: Object.freeze({ color: "#121014", symbolColor: "#b9afbd" }),
  daylight: Object.freeze({ color: "#fcfcfc", symbolColor: "#575757" }),
  meadow: Object.freeze({ color: "#ffffff", symbolColor: "#4d5a52" }),
  pop: Object.freeze({ color: "#fdf5ea", symbolColor: "#3a322d" }),
  halloween: Object.freeze({ color: "#110d16", symbolColor: "#c2b3cc" }),
// @generated tokens:chrome end
});

const DEFAULT_SKIN = "midnight";
/** The "system" choice (src/lib/skins.ts): its light or dark skin follows the system appearance. */
const SYSTEM_SKIN = "system";
const THEME_SKINS = Object.freeze({ light: "daylight", dark: "midnight" });

function skinChrome(skin) {
  return Object.hasOwn(SKIN_CHROME, skin) ? SKIN_CHROME[skin] : SKIN_CHROME[DEFAULT_SKIN];
}

function isKnownSkin(skin) {
  return Object.hasOwn(SKIN_CHROME, skin);
}

/** A light skin: its page colour is nearer white than black. */
function skinIsLight(skin) {
  const hex = skinChrome(skin).color;
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 127.5;
}

function isSkinChoice(choice) {
  return choice === SYSTEM_SKIN || isKnownSkin(choice);
}

/** The stored choice from skin.json, or null when there is none or it is not one. */
function parseSkinChoice(raw) {
  try {
    const choice = JSON.parse(raw)?.choice;
    return isSkinChoice(choice) ? choice : null;
  } catch {
    return null;
  }
}

/** The colour a window paints before its page has loaded: the chosen skin's ground. With no choice stored yet, or the
 * system choice, it is Daylight's or Midnight's as the system appearance says, the default for a new install. */
function launchGround(choice, prefersDark) {
  const skin = isKnownSkin(choice) ? choice : THEME_SKINS[prefersDark ? "dark" : "light"];
  return SKIN_CHROME[skin].color;
}

module.exports = { SKIN_CHROME, DEFAULT_SKIN, SYSTEM_SKIN, THEME_SKINS, skinChrome, isKnownSkin, skinIsLight, isSkinChoice, parseSkinChoice, launchGround };
