import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allHexagrams,
  getHexagram,
  searchHexagrams,
  yaoName,
  interpOf,
  TRIGRAMS,
  TRIGRAM_INFO,
  YIJING_GLOSSARY,
  lookupGlossary,
  YIJING_META,
} from "../dist/index.js";

test("64 卦齊全,卦序 1–64 唯一", () => {
  const all = allHexagrams();
  assert.equal(all.length, 64);
  const nums = all.map((h) => h.number).sort((a, b) => a - b);
  assert.deepEqual(nums, Array.from({ length: 64 }, (_, i) => i + 1));
});

test("每卦:卦辭/大象非空、6 條爻辭、卦符在易經符號區", () => {
  for (const h of allHexagrams()) {
    assert.ok(h.judgment.length > 0, `#${h.number} 卦辭為空`);
    assert.equal(h.lines.length, 6, `#${h.number} 爻辭不是 6 條`);
    assert.ok(h.lines.every((l) => l.length > 0), `#${h.number} 有空爻辭`);
    assert.ok(h.image.length > 0, `#${h.number} 大象為空`);
    const cp = h.symbol.codePointAt(0);
    assert.ok(cp >= 0x4dc0 && cp <= 0x4dff, `#${h.number} 卦符 ${h.symbol} 不在易經區`);
    assert.ok(TRIGRAMS.includes(h.upperTrigram) && TRIGRAMS.includes(h.lowerTrigram));
    assert.ok(["金", "木", "水", "火", "土"].includes(h.element));
  }
});

test("bits 與上下卦一致(下卦 bits[0..2]、上卦 bits[3..5])", () => {
  const BITS = {
    乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0],
    巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
  };
  for (const h of allHexagrams()) {
    assert.deepEqual(
      h.bits,
      [...BITS[h.lowerTrigram], ...BITS[h.upperTrigram]],
      `#${h.number} bits 與卦象不符`,
    );
  }
});

test("已知卦:乾 #1 / 坤 #2 / 屯 #3 / 既濟 #63 / 未濟 #64", () => {
  assert.equal(getHexagram(1).name, "乾");
  assert.equal(getHexagram(1).symbol, "䷀");
  assert.equal(getHexagram(2).name, "坤");
  assert.equal(getHexagram(3).name, "屯");
  assert.equal(getHexagram(63).name, "既濟");
  assert.equal(getHexagram(64).name, "未濟");
  assert.equal(getHexagram(999), undefined);
});

test("三地解讀齊全:coreMeaning + 事業/感情/財運/健康/建議", () => {
  for (const h of allHexagrams()) {
    for (const loc of ["zht", "zhs", "en"]) {
      const it = interpOf(h, loc);
      for (const k of ["coreMeaning", "career", "love", "wealth", "health", "advice"]) {
        assert.ok(it[k].length > 0, `#${h.number} ${loc}.${k} 為空`);
      }
    }
  }
});

test("yaoName:乾初爻=初九、上爻=上九;坤二爻=六二、中爻陰陽在前", () => {
  const qian = getHexagram(1);
  assert.equal(yaoName(qian, 1), "初九");
  assert.equal(yaoName(qian, 6), "上九");
  const kun = getHexagram(2);
  assert.equal(yaoName(kun, 2), "六二");
  assert.equal(yaoName(kun, 6), "上六");
  const tun = getHexagram(3); // 屯:初九 六二 六三 六四 九五 上六
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((p) => yaoName(tun, p)),
    ["初九", "六二", "六三", "六四", "九五", "上六"],
  );
  assert.throws(() => yaoName(qian, 0));
  assert.throws(() => yaoName(qian, 7));
});

test("searchHexagrams:卦名/拼音/英文/數字", () => {
  assert.ok(searchHexagrams("乾").some((h) => h.number === 1));
  assert.ok(searchHexagrams("qian").some((h) => h.number === 1));
  assert.ok(searchHexagrams("creative").some((h) => h.number === 1));
  assert.deepEqual(searchHexagrams("64").map((h) => h.number), [64]);
  assert.equal(searchHexagrams("").length, 64);
});

test("TRIGRAM_INFO:八卦符號/拼音/英文齊全", () => {
  assert.equal(TRIGRAM_INFO["乾"].symbol, "☰");
  assert.equal(TRIGRAM_INFO["坤"].symbol, "☷");
  assert.equal(TRIGRAM_INFO["坎"].element, "水");
  for (const t of TRIGRAMS) {
    const info = TRIGRAM_INFO[t];
    assert.ok(info.pinyin && info.en && info.nature && info.element, `${t} 資訊不全`);
  }
});

test("術語表:非空、三地釋義、lookup 命中", () => {
  assert.ok(YIJING_GLOSSARY.length >= 15);
  for (const g of YIJING_GLOSSARY) {
    assert.ok(g.term && g.zht.length > 0 && g.zhs.length > 0 && g.en.length > 0, `${g.term} 釋義不全`);
  }
  assert.ok(lookupGlossary("變卦").zht.includes("翻轉"));
  assert.equal(lookupGlossary("不存在"), undefined);
});

test("YIJING_META 標註來源與授權", () => {
  assert.ok(YIJING_META.sources.join(" ").includes("MIT"));
  assert.ok(YIJING_META.sources.join(" ").includes("CC0"));
  assert.equal(YIJING_META.reviewed, false);
});

test("拼音勘誤 + 粵拼齊全(2026-10-23)", () => {
  const byName = new Map(allHexagrams().map((h) => [h.name, h]));
  assert.equal(byName.get("小畜").pinyin, "Xiǎo Xù");
  assert.equal(byName.get("大畜").pinyin, "Dà Xù");
  assert.equal(byName.get("噬嗑").pinyin, "Shì Kè");
  for (const h of allHexagrams()) {
    assert.ok(typeof h.jyutping === "string" && h.jyutping.length > 0, `#${h.number} jyutping 為空`);
    assert.match(h.jyutping, /^[a-z]+[1-6]( [a-z]+[1-6])*$/, `#${h.number} jyutping 格式錯: ${h.jyutping}`);
  }
  // 易經特殊讀音(多音字正音)
  assert.equal(byName.get("乾").jyutping, "kin4");
  assert.equal(byName.get("屯").jyutping, "zeon1");
  assert.equal(byName.get("否").jyutping, "pei2");
  assert.equal(byName.get("賁").jyutping, "bei3");
  assert.equal(byName.get("解").jyutping, "haai6");
  assert.equal(byName.get("小畜").jyutping, "siu2 cuk1");
});
