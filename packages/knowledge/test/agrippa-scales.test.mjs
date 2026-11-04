import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const S = load("agrippa-scales.json");
const A = load("agrippa-correspondences.json");
const C = load("agrippa-cabala.json");

const letters = (s) => s.replace(/[^א-ת]/g, "");
const scale = (n) => S.scales.find((s) => s.n === n);
const row = (n, label) => scale(n).rows.find((r) => r.label === label).items;

test("刻度表 1–10 同 12 齊,每行項目數 = 該數", () => {
  assert.deepEqual(S.scales.map((s) => s.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
  for (const s of S.scales)
    for (const r of s.rows) if (!r.note) assert.equal(r.items.length, s.n, `${s.n} ${r.label}`);
  for (const r of S.orphicTwelve.rows) assert.equal(r.items.length, 12, r.label);
});

test("神名希伯來字母數 = 刻度數", () => {
  for (const s of S.scales)
    for (const d of s.divineNames) if (d.hebrew) assert.equal(letters(d.hebrew).length, s.n, `${s.n} ${d.name}`);
});

test("十字母神名:collected = יהוה + יהו + יה + י", () => {
  assert.equal(scale(10).divineNames[0].hebrew, ["יהוה", "יהו", "יה", "י"].join(""));
});

test("十二旗 = יהוה 嘅 12 個唔同排列", () => {
  const perms = new Set();
  const go = (rest, acc) => (rest.length ? [...rest].forEach((c, i) => go(rest.slice(0, i) + rest.slice(i + 1), acc + c)) : perms.add(acc));
  go("יהוה", "");
  const b = scale(12).banners.items;
  assert.equal(new Set(b).size, 12);
  assert.deepEqual([...b].sort(), [...perms].sort());
});

test("七數刻度嘅行星、金屬同 Book I 對應表一致", () => {
  assert.deepEqual(row(7, "seven planets"), Object.keys(A.planets));
  const metal = row(7, "metals");
  const off = Object.entries(A.planets).filter(([, x], i) => !x.metals.some((m) => m.includes(metal[i]))).map(([p]) => p);
  assert.deepEqual(off, Object.keys(scale(7).variance)); // 書內不一致,已記錄
});

test("十二宮次序同 Book I 黃道表一致,兩個十二刻度用同一個宮序", () => {
  assert.deepEqual(scale(12).signs, A.zodiac.map((z) => z.sign));
  assert.deepEqual(S.orphicTwelve.signs, scale(12).signs);
  assert.deepEqual(row(12, "twelve principal members"), S.orphicTwelve.rows.at(-1).items);
});

test("十數刻度嘅輝耀次序同 agrippa-cabala.json 一致", () => {
  assert.deepEqual(scale(10).sephiroth, C.sephiroth.items.map((s) => s.sephirah));
});

test("72 天使:三節經文各 72 字母,推出嘅首尾三字母組正確", () => {
  const { verses, angels } = S.shemHaMephorash;
  for (const v of verses) assert.equal(letters(v).length, 72);
  assert.equal(angels.length, 72);
  assert.equal(new Set(angels.map((a) => a.n)).size, 72);
  const fin = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
  angels.forEach((a, i) => {
    const t = [verses[0][i], verses[1][71 - i], verses[2][i]].map((c) => fin[c] ?? c).join("");
    assert.equal(a.triplet, t, a.name);
    assert.equal(a.suffix, a.name.endsWith("ah") ? "יה" : "אל", a.name);
  });
  assert.equal(angels[0].triplet, "והו"); // Vehuiah
  assert.equal(angels[41].triplet + angels[41].suffix, "מיכאל"); // Michael
  assert.equal(angels[71].triplet, "מומ"); // Mumiah
});
