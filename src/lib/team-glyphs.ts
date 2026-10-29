// Tinted tiles for teams, their members and organization packages. Each tone is a class in styles.css that
// washes the tile in one of the skin's identity hues and pulls the glyph toward the ink, so the letter or icon
// clears 4.5:1 on light and dark skins alike (pnpm check:contrast measures it). Tailwind's fixed -300 tints
// on -500/15 measured 1.16–1.47:1 on every light skin.
export const TEAM_GLYPHS = ["team-glyph-purple", "team-glyph-cyan", "team-glyph-orange", "team-glyph-green"] as const;

/** The organization shelf starts on a different hue, so it does not read as the team list repeated. */
export const ORG_GLYPHS = ["team-glyph-cyan", "team-glyph-purple", "team-glyph-green", "team-glyph-orange"] as const;
