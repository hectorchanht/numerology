import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import INLINE from "../dist/planet-names.data.js";

const L = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));

test("內聯模組同 JSON 一致", () => {
  const a = L("agrippa-cabala"), f = L("fourth-book");
  assert.deepEqual(JSON.parse(JSON.stringify(INLINE)), { cabalaMeta: a.meta, planetaryNames: a.planetaryNames, fourthMeta: f.meta, arbatel: f.arbatel });
});

test("名數同幻方階、格數、行和、總和一致", async () => {
  const { PLANET_NAMES, planetarySquare } = await import("../dist/index.js");
  for (const [planet, names] of Object.entries(PLANET_NAMES)) {
    const n = planetarySquare(planet).order;
    const want = { order: n, cells: n * n, line: (n * (n * n + 1)) / 2, total: (n * n * (n * n + 1)) / 2 };
    for (const x of names) if (x.ref) assert.equal(x.value, want[x.ref], `${planet} ${x.name}`);
  }
});
