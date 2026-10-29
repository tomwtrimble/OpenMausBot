#!/usr/bin/env node
// Writes the skins from src/theme/tokens into src/styles.css and electron/skin-overlay.cjs, between their
// `@generated tokens:*` markers. --check fails instead of writing when a file is out of date. --phones-out DIR also
// writes the phone apps' AppearanceSkin.kt and MausTheme.swift there; phone code lives in the mobile repo
// (SupaMaus/mausbot-mobile), so they are never written into this one.
//
//   node scripts/tokens/generate.mjs [--check] [--phones-out DIR]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { generateDesktop, generatePhones } from "../../src/theme/tokens/generate.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { values } = parseArgs({ options: { check: { type: "boolean" }, "phones-out": { type: "string" } } });

const paths = { styles: join(root, "src/styles.css"), overlay: join(root, "electron/skin-overlay.cjs") };
const current = { styles: readFileSync(paths.styles, "utf8"), overlay: readFileSync(paths.overlay, "utf8") };
const next = generateDesktop(current);

let stale = false;
for (const key of Object.keys(paths)) {
  if (current[key] === next[key]) continue;
  if (values.check) {
    stale = true;
    console.error(`✗ ${relative(root, paths[key])} is out of date: run node scripts/tokens/generate.mjs`);
  } else {
    writeFileSync(paths[key], next[key]);
    console.log(`wrote ${relative(root, paths[key])}`);
  }
}
if (values.check && !stale) console.log("✓ src/styles.css and electron/skin-overlay.cjs match src/theme/tokens");

if (values["phones-out"]) {
  const out = resolve(values["phones-out"]);
  const inside = relative(root, out);
  if (!inside.startsWith("..") && !isAbsolute(inside)) throw new Error("--phones-out must be outside this repo: phone code lives in mausbot-mobile");
  mkdirSync(out, { recursive: true });
  for (const [name, text] of Object.entries(generatePhones())) {
    writeFileSync(join(out, name), text);
    console.log(`wrote ${join(out, name)}`);
  }
}
if (stale) process.exit(1);
