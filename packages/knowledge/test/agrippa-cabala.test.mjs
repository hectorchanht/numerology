import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const C = load("agrippa-cabala.json");
const A = load("agrippa-correspondences.json");
const P = load("planetary-squares.json");

const V = new Map(A.hebrew.letters.flatMap((l) => [[l.glyph, l.value], ...(l.final ? [[l.final.glyph, l.value]] : [])]));
const gem = (s) => [...s].reduce((n, ch) => n + (V.get(ch) ?? 0), 0);

test("行星神名:希伯來字母和 = 標示數值(未解嘅 1651 錯誤除外)", () => {
  for (const [planet, names] of Object.entries(C.planetaryNames))
    for (const x of names) if (!x.unresolved) assert.equal(gem(x.hebrew), x.value, `${planet} ${x.name}`);
});

test("行星神名數值 = 對應方陣嘅階 / 格數 / 線和 / 總和", () => {
  for (const s of P.squares) {
    const n = s.order, ref = { order: n, cells: n * n, line: (n * (n * n + 1)) / 2, total: (n * n * (n * n + 1)) / 2 };
    for (const x of C.planetaryNames[s.planet]) if (x.ref) assert.equal(x.value, ref[x.ref], `${s.planet} ${x.name}`);
  }
});

test("月宿 28 個,原文起點 = (n−1)×360°/28(誤差 < 5″)", () => {
  assert.equal(C.lunarMansions.mansions.length, 28);
  for (const [n, d, m, s] of C.lunarMansions.statedStarts) {
    const exact = ((n - 1) * 360 * 3600) / 28;
    assert.ok(Math.abs(d * 3600 + m * 60 + s - exact) < 5, `mansion ${n}`);
  }
});

test("十質點:3-9 依次落七曜天", () => {
  assert.deepEqual(C.sephiroth.items.slice(2, 9).map((x) => x.sphere), ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]);
});
