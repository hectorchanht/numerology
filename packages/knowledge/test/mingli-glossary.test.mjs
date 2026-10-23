import { test } from "node:test";
import assert from "node:assert/strict";
import { MINGLI_GLOSSARY, YIJING_GLOSSARY } from "../dist/index.js";

const PLACEHOLDERS = ["TODO", "TBD", "FIXME", "待補", "待补充", "待補充", "XXX", "..."];

test("術語唯一、數量 ≥ 50", () => {
  assert.ok(MINGLI_GLOSSARY.length >= 50, `只有 ${MINGLI_GLOSSARY.length} 條`);
  const terms = MINGLI_GLOSSARY.map((g) => g.term);
  assert.equal(new Set(terms).size, terms.length, "有重複 term");
});

test("每條三地釋義皆非空(一行短釋義)", () => {
  for (const g of MINGLI_GLOSSARY) {
    for (const k of ["term", "zht", "zhs", "en"]) {
      const v = g[k];
      assert.ok(typeof v === "string" && v.trim().length > 0, `${g.term}.${k} 為空`);
      assert.ok(!v.includes("\n"), `${g.term}.${k} 應為一行`);
    }
  }
});

test("無佔位文字", () => {
  for (const g of MINGLI_GLOSSARY) {
    for (const k of ["zht", "zhs", "en"]) {
      for (const p of PLACEHOLDERS) {
        assert.ok(!g[k].includes(p), `${g.term}.${k} 含佔位文字 ${p}`);
      }
    }
  }
});

test("十神 ×10 齊全,七殺一條兼顧兩義", () => {
  for (const t of ["正官", "七殺", "正印", "偏印", "正財", "偏財", "食神", "傷官", "比肩", "劫財"]) {
    assert.ok(MINGLI_GLOSSARY.some((g) => g.term === t), `缺 ${t}`);
  }
  const qisha = MINGLI_GLOSSARY.find((g) => g.term === "七殺");
  assert.ok(qisha.zht.includes("主星"), "七殺釋義應提及紫微主星義");
  assert.ok(qisha.zht.includes("十神") || qisha.zht.includes("剋日主"), "七殺釋義應提及十神義");
});

test("十二宮 / 十四主星(除七殺) / 四化齊全", () => {
  for (const t of ["命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母"]) {
    assert.ok(MINGLI_GLOSSARY.some((g) => g.term === t), `缺 ${t}`);
  }
  for (const t of ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "破軍"]) {
    assert.ok(MINGLI_GLOSSARY.some((g) => g.term === t), `缺 ${t}`);
  }
  for (const t of ["化祿", "化權", "化科", "化忌"]) {
    assert.ok(MINGLI_GLOSSARY.some((g) => g.term === t), `缺 ${t}`);
  }
});

test("核心概念抽查:釋義非空且切題", () => {
  const get = (t) => MINGLI_GLOSSARY.find((g) => g.term === t);
  assert.ok(get("日主").zht.includes("出生日"), "日主釋義應提出生日天干");
  assert.ok(get("大運").zht.includes("十年"), "大運釋義應提十年");
  assert.ok(get("用神").en.toLowerCase().includes("balance"), "用神英文釋義應提 balance");
  assert.ok(get("空宮").zht.includes("對宮"), "空宮釋義應提對宮");
  for (const t of ["天干", "地支", "刑", "沖", "合", "會"]) {
    assert.ok(get(t), `缺 ${t}`);
  }
});

test("與 YIJING_GLOSSARY 無 term 碰撞(合併時 yijing 優先有定義可循)", () => {
  const yj = new Set(YIJING_GLOSSARY.map((g) => g.term));
  const dupes = MINGLI_GLOSSARY.filter((g) => yj.has(g.term)).map((g) => g.term);
  assert.deepEqual(dupes, [], `碰撞: ${dupes.join(",")}`);
});
