import { opaque } from "./color.ts";
import { px, radiusScale } from "./radius.ts";
import type { ColorToken, SkinSource } from "./skin.ts";

// The phone apps' theme files, generated from the same skins as the desktop. Phone colours are opaque: a desktop
// token drawn translucent is written as it looks where the phones draw it (Midnight's inks over the ground, the
// hairline over a card, where a phone's dividers sit), and a transparent shadow (the flat dark skins) as black.

function phoneHex(skin: SkinSource, token: ColorToken): string {
  const value = skin.colors[token];
  if (value === "transparent") return token === "shadow" ? "#000000" : skin.colors.app;
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) throw new Error(`${skin.id} ${token}: ${value} has no phone value`);
  return opaque(value, token === "hairline" ? skin.colors.card : skin.colors.app).toUpperCase();
}

const KOTLIN_FIELDS: Array<[string, ColorToken]> = [
  ["app", "app"], ["panel", "panel"], ["raised", "raised"], ["raisedHover", "raised-hover"],
  ["card", "card"], ["menu", "menu"], ["inset", "inset"], ["control", "control"],
  ["surfaceFloat", "menu"], ["composer", "composer"], ["composerRing", "composer-ring"], ["hairline", "hairline"],
  ["edge", "edge"], ["ink", "ink"], ["secondaryInk", "ink-secondary"], ["tertiaryInk", "ink-tertiary"],
  ["accent", "accent"], ["accentBorder", "accent-border"], ["accentText", "accent-text"], ["accentInk", "accent-ink"],
  ["bubbleUser", "bubble-user"], ["bubbleUserInk", "bubble-user-ink"], ["success", "success"], ["successInk", "success-ink"],
  ["danger", "danger"], ["dangerInk", "danger-ink"], ["dangerText", "danger-text"], ["warning", "warning"],
  ["warningText", "warning-text"], ["warningInk", "warning-ink"], ["mausLine", "maus-line"], ["focus", "focus"],
  ["outline", "edge"],
];

export function kotlin(skins: readonly SkinSource[], header: string): string {
  const shipped = skins.filter((skin) => skin.phones);
  const entries = shipped.map((skin) => {
    const fields = KOTLIN_FIELDS.map(([field, token]) => {
      if (token === "composer-ring" && skin.colors[token] === "transparent") return `${field} = null`;
      return `${field} = "${phoneHex(skin, token).slice(1)}"`;
    });
    const lines: string[] = [];
    for (let i = 0; i < fields.length; i += 4) lines.push(`            ${fields.slice(i, i + 4).join(", ")},`);
    return [
      `    ${skin.id.replace(/-/g, "_").toUpperCase()}(`,
      `        "${skin.id}", "${skin.label}", ${skin.mode === "dark"},`,
      "        SkinColors(",
      ...lines,
      "        ),",
      "    ),",
    ].join("\n");
  });
  return `${header}
package com.openmausbot.companion.ui

/**
 * The desktop skins, generated from the same token source as the desktop's \`src/styles.css\`, in the order of its
 * picker. [SYSTEM_WIRE], a new install's choice, follows the phone's light or dark setting between [DAYLIGHT] and
 * [MIDNIGHT], as the desktop's "Follow system" follows the computer.
 */
enum class AppearanceSkin(
    val wireValue: String,
    val label: String,
    val isDark: Boolean,
    val colors: SkinColors,
) {
${entries.join("\n")}
    ;

    companion object {
        /** A stored value no skin claims falls back to Midnight, as on the desktop. */
        val DEFAULT = MIDNIGHT

        /** The stored value for "Follow system": Daylight or Midnight with the system. */
        const val SYSTEM_WIRE = "system"

        fun fromWire(value: String?): AppearanceSkin =
            entries.firstOrNull { it.wireValue == value } ?: DEFAULT

        fun resolve(value: String?, systemDark: Boolean): AppearanceSkin =
            if (value == SYSTEM_WIRE) (if (systemDark) MIDNIGHT else DAYLIGHT) else fromWire(value)
    }
}

/**
 * One skin's \`--color-*\` tokens as opaque hex (\`RRGGBB\`); a token the desktop draws translucent is written as it
 * looks over [app]. [secondaryInk] / [tertiaryInk] are \`--color-ink-secondary\` / \`--color-ink-tertiary\`; [hairline]
 * is the divider, [edge] and [outline] the firmer line around a control; [menu] and [surfaceFloat] are the float
 * every menu and popover sits on; [warning] is the needs-you fill, carrying [warningInk], and [warningText] the same
 * amber as words. [composerRing] is null where the desktop draws none.
 */
data class SkinColors(
${KOTLIN_FIELDS.map(([field]) => `    val ${field}: String${field === "composerRing" ? "?" : ""},`).join("\n")}
)
`;
}

const SWIFT_FIELDS: Array<[string, ColorToken]> = [
  ["app", "app"], ["panel", "panel"], ["inset", "inset"], ["card", "card"], ["raised", "raised"], ["raisedHover", "raised-hover"],
  ["control", "control"], ["surfaceFloat", "menu"], ["composer", "composer"],
  ["hairline", "hairline"], ["edge", "edge"],
  ["ink", "ink"], ["inkSecondary", "ink-secondary"], ["inkTertiary", "ink-tertiary"],
  ["accent", "accent"], ["accentBorder", "accent-border"], ["accentText", "accent-text"], ["accentInk", "accent-ink"], ["focus", "focus"],
  ["bubbleUser", "bubble-user"], ["bubbleUserInk", "bubble-user-ink"],
  ["success", "success"], ["successInk", "success-ink"],
  ["danger", "danger"], ["dangerText", "danger-text"], ["dangerInk", "danger-ink"],
  ["needsYou", "warning"], ["needsYouText", "warning-text"], ["needsYouInk", "warning-ink"],
  ["shadow", "shadow"],
];

/** Daylight by day and Midnight by night, the desktop's "Follow system" pair, with the phone-width corners. */
export function swift(light: SkinSource, dark: SkinSource, header: string): string {
  const width = Math.max(...SWIFT_FIELDS.map(([field]) => field.length));
  const swiftHex = (skin: SkinSource, token: ColorToken) => `0x${phoneHex(skin, token).slice(1)}`;
  const tokens = SWIFT_FIELDS.map(([field, token]) =>
    `    static let ${field.padEnd(width)} = dynamic(light: ${swiftHex(light, token)}, dark: ${swiftHex(dark, token)})`);
  const corners = radiusScale({ ...dark.radius, ...dark.phone?.radius });
  const radius = (["sm", "md", "lg", "xl", "2xl"] as const).map((size) =>
    `        static let ${size === "2xl" ? "xxl" : size}: CGFloat = ${px(corners[size])}`);
  return `${header}
import SwiftUI
import UIKit

/// Daylight and Midnight, the desktop's "Follow system" pair: the app follows
/// the phone between them, Daylight by day and Midnight by night, as the
/// desktop follows the computer. Each colour follows the system appearance on
/// its own, so a view reads \`MausTheme.card\` and never branches on the colour
/// scheme. \`surfaceFloat\` is every menu and popover; \`needsYou\` is the amber
/// fill that carries \`needsYouInk\`, and \`needsYouText\` the same amber as words.
/// The corners are the ones the desktop uses below its phone width.
enum MausTheme {
${tokens.join("\n")}

    enum Radius {
${radius.join("\n")}
    }

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            let rgb = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(
                red: CGFloat((rgb >> 16) & 0xFF) / 255,
                green: CGFloat((rgb >> 8) & 0xFF) / 255,
                blue: CGFloat(rgb & 0xFF) / 255,
                alpha: 1
            )
        })
    }
}
`;
}
