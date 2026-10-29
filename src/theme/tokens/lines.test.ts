import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const FADED = /(?<![\w-])(?:[\w[\]&>*:-]+:)*[a-z]+(?:-[a-z]+)?-(?:hairline|edge)\/[\w.[\]]+/g;
const BLACK_SHADOW = /(?<![\w-])shadow-black(?![\w-])|(?<![\w-])(?:drop-)?shadow-\[[^\]\s"'`]*rgba?\(0[,_ ]+0[,_ ]+0[^\]\s"'`]*\]/g;

const sources = () => execFileSync("git", ["ls-files", "src"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter((file) => /\.(tsx?|css)$/.test(file) && !file.endsWith("lines.test.ts"));
const hits = (pattern: RegExp) =>
  sources().flatMap((file) => [...readFileSync(`${ROOT}${file}`, "utf8").matchAll(pattern)].map(([match]) => `${file}: ${match}`));

describe("lines and shadows", () => {
  it("draw in the hairline or edge token as each skin tunes it, never faded with an opacity modifier", () => {
    expect(hits(FADED)).toEqual([]);
  });

  it("cast shadows in the skin's tint (--color-shadow), never raw black", () => {
    expect(hits(BLACK_SHADOW)).toEqual([]);
  });
});
