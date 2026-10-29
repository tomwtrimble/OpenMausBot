import type { SkinSource } from "./skin.ts";
import midnight from "./skins/midnight.ts";
import atelier from "./skins/atelier.ts";
import foundry from "./skins/foundry.ts";
import lagoon from "./skins/lagoon.ts";
import graphite from "./skins/graphite.ts";
import linen from "./skins/linen.ts";
import dusk from "./skins/dusk.ts";
import daylight from "./skins/daylight.ts";
import meadow from "./skins/meadow.ts";
import pop from "./skins/pop.ts";
import halloween from "./skins/halloween.ts";

/** Picker order, the same as SKIN_IDS in src/lib/skins.ts. */
export const SKINS: readonly SkinSource[] = [midnight, atelier, foundry, lagoon, graphite, linen, dusk, daylight, meadow, pop, halloween];

/** The skin that fills `@theme` and the bare `:root`, so nothing renders unstyled before a skin is stamped. */
export const THEME_DEFAULT = "midnight";

export function skin(id: string): SkinSource {
  const found = SKINS.find((entry) => entry.id === id);
  if (!found) throw new Error(`no skin ${id}`);
  return found;
}
