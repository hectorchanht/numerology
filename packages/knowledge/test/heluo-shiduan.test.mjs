import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allHexagrams, heluoText } from "../dist/index.js";

const D = JSON.parse(readFileSync(new URL("../data/heluo-shiduan.json", import.meta.url), "utf8"));
// 異體:書作无、床、凶、于、征,yijing 資料作無、牀、兇、於、徵
const norm = (s) => s.replace(/[^一-鿿]/g, "").replace(/[无旡]/g, "無").replace(/牀/g, "床").replace(/兇/g, "凶").replace(/於/g, "于").replace(/徵/g, "征");
// 兩串共同字比例(以較短者計),容許版本異文
const overlap = (a, b) => {
  const pool = [...b];
  let n = 0;
  for (const c of a) { const i = pool.indexOf(c); if (i >= 0) { n++; pool.splice(i, 1); } }
  return n / Math.min(a.length, b.length);
};

test("六十四卦齊全,次序同周易;每卦六爻,爻名合卦畫", () => {
  const hexes = allHexagrams();
  assert.deepEqual(D.hexagrams.map((h) => h.hex), hexes.map((h) => h.name));
  for (const [i, h] of D.hexagrams.entries()) {
    assert.equal(h.lines.length, 6, h.hex);
    for (const l of h.lines) {
      const yy = hexes[i].bits[l.line - 1] ? "九" : "六";
      const want = l.line === 1 ? "初" + yy : l.line === 6 ? "上" + yy : yy + "二三四五"[l.line - 2];
      assert.equal(l.yao, want, `${h.hex}${l.line}`);
    }
  }
});

test("卷二爻辭大致合周易爻辭;爻斷以「此爻」起", () => {
  const hexes = allHexagrams();
  for (const [i, h] of D.hexagrams.entries()) {
    for (const l of h.lines) {
      const r = overlap(norm(l.ci), norm(hexes[i].lines[l.line - 1]));
      assert.ok(r >= 0.6, `${h.hex} ${l.yao} ${l.ci} ${r}`);
      assert.match(l.duan, /^此[爻文]/, `${h.hex} ${l.yao}`);
    }
    assert.ok(h.gua.text.length > 20, h.hex);
  }
});

test("卷三詩訣:每卦有總訣、每爻至少一首,每首以「。」分句", () => {
  let n = 0;
  for (const h of D.hexagrams) {
    for (const p of [...h.zong.poems, ...h.lines.flatMap((l) => l.poems)]) {
      assert.match(p.text, /^([㐀-鿿\u{20000}-\u{2ffff}□]+。)+$/u, `${h.hex} ${p.text}`);
      n++;
    }
    assert.ok(h.zong.poems.length > 0, h.hex);
    for (const l of h.lines) assert.ok(l.poems.length > 0, `${h.hex} ${l.yao}`);
  }
  assert.equal(n, 1140);
});

test("heluoText 按卦名取原文", () => {
  const t = heluoText("乾");
  assert.equal(t.lines[0].ci, "潛龍勿用");
  assert.equal(t.lines[0].poems[0].text.split("。")[0], "陽氣方生昧未明");
});
