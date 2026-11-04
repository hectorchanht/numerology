import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const G = load("greek-gematria.json");
const P = load("planetary-squares.json");

const isopsephy = (s) =>
  [...s.replace(/\s/g, "")].reduce((n, ch) => {
    assert.ok(ch in G.letters, `unknown letter ${ch} in ${s}`);
    return n + G.letters[ch];
  }, 0);

test("每個希臘詞嘅 gematria 數值同字母相加一致", () => {
  for (const t of G.terms) assert.equal(isopsephy(t.greek), t.value, t.greek);
});

test("幾何/音律關係數值成立", () => {
  for (const r of G.relations) {
    const v = Function(`return (${r.expr})`)();
    assert.ok(Math.abs(v - r.target) <= r.tol + 1e-9, `${r.id}: ${v} vs ${r.target}`);
    for (const g of r.terms ?? []) assert.ok(G.terms.some((t) => t.greek === g), `${r.id}: ${g} missing`);
  }
});

const sums = (rows) => {
  const n = rows.length;
  const col = (j) => rows.reduce((s, r) => s + r[j], 0);
  return [
    ...rows.map((r) => r.reduce((a, b) => a + b, 0)),
    ...rows.map((_, j) => col(j)),
    rows.reduce((s, r, i) => s + r[i], 0),
    rows.reduce((s, r, i) => s + r[n - 1 - i], 0),
  ];
};

test("行星魔方陣:1..n² 各一次,所有行列對角同和", () => {
  for (const { planet, order: n, rows } of P.squares) {
    assert.deepEqual([...rows.flat()].sort((a, b) => a - b), Array.from({ length: n * n }, (_, i) => i + 1), planet);
    const line = (n * (n * n + 1)) / 2;
    for (const s of sums(rows)) assert.equal(s, line, planet);
  }
  const sun = P.squares.find((s) => s.planet === "Sun");
  assert.equal(sun.rows.flat().reduce((a, b) => a + b, 0), sun.spirit.value);
  assert.equal(sums(sun.rows)[0], sun.intelligence.value);
});

test("27×27 Siamese 方陣:中心 365,線和 9855", () => {
  const n = 27, m = Array.from({ length: n }, () => Array(n).fill(0));
  let i = 0, j = (n - 1) / 2;
  for (let k = 1; k <= n * n; k++) {
    m[i][j] = k;
    const [ni, nj] = [(i - 1 + n) % n, (j + 1) % n];
    if (m[ni][nj]) i = (i + 1) % n; else [i, j] = [ni, nj];
  }
  assert.equal(m[13][13], 365);
  for (const s of sums(m)) assert.equal(s, 9855);
});
