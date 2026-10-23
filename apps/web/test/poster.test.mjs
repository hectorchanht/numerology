import { test } from "node:test";
import assert from "node:assert/strict";
import {
  posterTerm, posterName, buildPosterModel, posterTexts, posterFilename,
  layoutPoster, paintPoster, wrapText, fitSize, POSTER_COLOR_VARS,
} from "../test-dist/poster.js";
import { lockScript, warmScriptFor } from "../test-dist/script.js";
import { castChart } from "@numerology/engine";
import { currentLuckStep } from "../test-dist/ganzhi.js";


// 預熱字典(所有 lockScript 測試都需要)
await warmScriptFor("zh-Hant");
await warmScriptFor("zh-Hans");

// 獨立於實現字表嘅簡體獨有字清單(海報曾經洩漏 + 十神/宮/主星/農曆會出現嘅字)
const SIMPLIFIED = [..."杀财机阳岁宫伤禄仆迁贪门贞军阴腊闰运时历农权"];
const hasSimplified = (s) => SIMPLIFIED.filter((c) => s.includes(c));

// Hector 截圖嗰張盤嘅字眼(引擎原樣輸出:簡體)
const SRC = {
  input: { year: 1987, month: 6, day: 14, hour: 9, minute: 30, gender: "男" },
  lunarDate: "一九八七年闰六月十九",
  pillars: {
    year: { ganZhi: "丁卯", shiShenGan: "七杀" },
    month: { ganZhi: "丙午", shiShenGan: "劫财" },
    day: { ganZhi: "辛巳", shiShenGan: "" },
    hour: { ganZhi: "癸巳", shiShenGan: "伤官" },
  },
  dayMaster: "辛",
  soul: { name: "命宫", majorStars: [{ name: "天机" }, { name: "太阳" }] },
  body: { name: "官禄" },
  dayun: { ganZhi: "庚戌", startAge: 32, endAge: 41 },
  generatedAt: new Date(2026, 9, 23),
};

// —— 術語轉換 ——

test("poster:posterTerm 十神/宮名跟語言;en 有英譯", () => {
  assert.equal(posterTerm("七杀", "zht"), "七殺");
  assert.equal(posterTerm("七杀", "zhs"), "七杀");
  assert.equal(posterTerm("七杀", "en"), "Seven Killings");
  assert.equal(posterTerm("劫财", "en"), "Rob Wealth");
  assert.equal(posterTerm("命宫", "en"), "Life palace");
  assert.equal(posterTerm("仆役", "zht"), "僕役");
  assert.equal(posterTerm("", "en"), "");
});

test("poster:posterName 干支/星曜唔譯英文,只跟字形", () => {
  assert.equal(posterName("天机", "en"), "天機");
  assert.equal(posterName("天机", "zht"), "天機");
  assert.equal(posterName("天機", "zhs"), "天机");
  assert.equal(posterName("甲子", "zht"), "甲子");
});

// —— 海報 model ——
test("poster:zht 海報全部字眼冇簡體(截圖嗰張盤)", () => {
  const m = buildPosterModel(SRC, "zht", { includeBirth: true });
  const all = posterTexts(m).join("|");
  assert.deepEqual(hasSimplified(all), [], all);
  for (const want of ["七殺", "劫財", "天機", "太陽", "歲", "命宮", "傷官", "官祿", "閏六月"]) {
    assert.ok(all.includes(want), `zht 應含 ${want}: ${all}`);
  }
});

test("poster:zhs 海報用簡體", () => {
  const all = posterTexts(buildPosterModel(SRC, "zhs", { includeBirth: true })).join("|");
  for (const want of ["七杀", "劫财", "天机", "太阳", "岁", "命宫", "命盘海报", "易经学院"]) {
    assert.ok(all.includes(want), `zhs 應含 ${want}: ${all}`);
  }
  assert.ok(!all.includes("歲") && !all.includes("命宮"));
});

test("poster:en 海報 UI 字眼係英文,星曜/干支保留中文(繁體)", () => {
  const m = buildPosterModel(SRC, "en", { includeBirth: true });
  const all = posterTexts(m).join("|");
  for (const want of ["Seven Killings", "Rob Wealth", "Life palace", "Career palace", "ages 32–41", "YI JING ACADEMY", "Male", "天機 太陽"]) {
    assert.ok(all.includes(want), `en 應含 ${want}: ${all}`);
  }
  assert.deepEqual(hasSimplified(all), [], all);
  assert.ok(!/[歲岁]/.test(all), "en 唔應出現 歲/岁");
});

test("poster:真引擎輸出(多個盤)zht 全部冇簡體字", () => {
  const births = [
    [1990, 3, 5, 8, "男"], [1985, 12, 20, 23, "女"], [2001, 7, 9, 14, "男"], [1993, 1, 15, 2, "女"],
    [1976, 9, 30, 11, "男"], [1968, 4, 2, 17, "女"], [2010, 2, 28, 5, "男"], [1955, 11, 11, 20, "女"],
  ];
  for (const [year, month, day, hour, gender] of births) {
    const chart = castChart({ year, month, day, hour, minute: 0, gender });
    // 每個宮都當命宮/身宮試一次,覆蓋全部 12 宮名同 14 主星
    for (const p of chart.ziwei.palaces) {
      const src = {
        input: chart.input, lunarDate: chart.bazi.lunarDate, pillars: chart.bazi.fourPillars,
        dayMaster: chart.bazi.dayMaster, soul: p, body: p,
        dayun: currentLuckStep(chart.bazi, 2026), generatedAt: new Date(2026, 0, 1),
      };
      const all = posterTexts(buildPosterModel(src, "zht", { includeBirth: true })).join("|");
      assert.deepEqual(hasSimplified(all), [], `${year}-${month}-${day}: ${all}`);
    }
  }
});

// —— 生辰私隱 ——
test("poster:includeBirth:false 嘅 model 冇任何生辰資料", () => {
  for (const loc of ["zht", "zhs", "en"]) {
    const m = buildPosterModel(SRC, loc, { includeBirth: false });
    assert.deepEqual(m.birth, []);
    const all = posterTexts(m).join("|");
    for (const leak of ["1987", "06-14", "09:30", "八七", "閏六月", "闰六月", "生辰", "農曆", "农历", "Birth", "Lunar"]) {
      assert.ok(!all.includes(leak), `${loc} 導出 model 洩漏 ${leak}: ${all}`);
    }
  }
});

// —— Canvas 版面 + 繪製(假 measure / 假 ctx,檢查真正落畫布嘅字) ——
const fakeMeasure = (text, size) => [...text].reduce((w, c) => w + (/[⺀-鿿]/.test(c) ? size : size * 0.55), 0);

function recordingCtx() {
  const texts = [];
  const images = [];
  const noop = () => {};
  return {
    texts, images,
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "left", textBaseline: "alphabetic",
    imageSmoothingEnabled: true, imageSmoothingQuality: "low",
    save: noop, restore: noop, scale: noop, translate: noop, rotate: noop, beginPath: noop, moveTo: noop,
    lineTo: noop, arcTo: noop, closePath: noop, fill: noop, stroke: noop, clip: noop, fillRect: noop,
    fillText(t) { texts.push(t); },
    drawImage(img) { images.push(img); },
  };
}

const PALETTE = Object.fromEntries(Object.keys(POSTER_COLOR_VARS).map((k) => [k, "#123456"]));

function paintedText(loc, includeBirth, logo = { fake: true }) {
  const layout = layoutPoster(buildPosterModel(SRC, loc, { includeBirth }), fakeMeasure);
  const ctx = recordingCtx();
  paintPoster(ctx, layout, PALETTE, "sans-serif", 3, logo);
  return { layout, ctx, all: ctx.texts.join("") };
}

test("poster:導出畫布冇生辰、有 logo、zht 字眼正確", () => {
  const { ctx, all } = paintedText("zht", false);
  for (const leak of ["1987", "06-14", "09:30", "閏六月", "生辰", "農曆"]) {
    assert.ok(!all.includes(leak), `畫布洩漏 ${leak}`);
  }
  for (const want of ["七殺", "劫財", "天機", "太陽", "歲", "命宮"]) {
    assert.ok(all.includes(want), `畫布應含 ${want}`);
  }
  assert.ok(!all.includes("印"), "唔應再畫「印」字印章");
  assert.equal(ctx.images.length, 1, "logo 應畫一次");
  assert.deepEqual(hasSimplified(all), []);
});

test("poster:屏幕版 model(含生辰)畫出嚟會有生辰,證明導出係真排除", () => {
  const withBirth = paintedText("zht", true);
  const without = paintedText("zht", false);
  assert.ok(withBirth.all.includes("1987"));
  assert.ok(withBirth.layout.height > without.layout.height);
});

test("poster:logo 載入失敗都照畫(唔 throw,唔畫圖)", () => {
  const { ctx } = paintedText("en", false, null);
  assert.equal(ctx.images.length, 0);
});

test("poster:版面尺寸合理,所有指令喺畫布內", () => {
  for (const loc of ["zht", "zhs", "en"]) {
    const { layout } = paintedText(loc, false);
    assert.equal(layout.width, 430 + 32);
    assert.ok(layout.height > 400 && layout.height < 1200, `${loc} height ${layout.height}`);
    for (const op of layout.ops) {
      assert.ok(op.x >= 0 && op.x <= layout.width, `${loc} x 越界 ${JSON.stringify(op)}`);
      assert.ok(op.y >= 0 && op.y <= layout.height, `${loc} y 越界 ${JSON.stringify(op)}`);
    }
  }
});

test("poster:wrapText / fitSize", () => {
  assert.deepEqual(wrapText("一二三四五", 30, 10, 400, fakeMeasure), ["一二三", "四五"]);
  assert.deepEqual(wrapText("aa bb cc", 12, 10, 400, fakeMeasure), ["aa", "bb", "cc"]);
  assert.equal(fitSize("短", 100, 12, 400, fakeMeasure), 12);
  assert.ok(fitSize("Indirect Resource", 60, 12, 400, fakeMeasure) < 12);
});

test("poster:檔名只含今日日期,唔含生辰", () => {
  assert.equal(posterFilename(new Date(2026, 9, 3)), "chart-poster-2026-10-03.png");
});

// —— 用戶自填名字 ——
test("poster:名字入 model(會 trim);冇填就係空字串", () => {
  const m = buildPosterModel({ ...SRC, name: "  陳大文 " }, "zht", { includeBirth: true });
  assert.equal(m.name, "陳大文");
  assert.ok(posterTexts(m).join("|").includes("陳大文"));
  assert.equal(buildPosterModel(SRC, "zht", { includeBirth: true }).name, "");
  assert.equal(buildPosterModel({ ...SRC, name: "   " }, "zht", { includeBirth: true }).name, "");
});

test("poster:名字會入導出 model(用戶自願分享,唔同生辰要隱藏)", () => {
  for (const loc of ["zht", "zhs", "en"]) {
    const m = buildPosterModel({ ...SRC, name: "陳大文" }, loc, { includeBirth: false });
    assert.equal(m.name, "陳大文");
    assert.deepEqual(m.birth, [], "生辰依然唔入導出 model");
  }
});

function paintedName(name) {
  const layout = layoutPoster(buildPosterModel({ ...SRC, name }, "zht", { includeBirth: false }), fakeMeasure);
  const ctx = recordingCtx();
  paintPoster(ctx, layout, PALETTE, "sans-serif", 3, { fake: true });
  return { layout, texts: ctx.texts };
}

test("poster:有名字先至畫,冇名字唔畫唔佔位", () => {
  const withName = paintedName("陳大文");
  assert.ok(withName.texts.includes("陳大文"), "畫布要有名字");
  const without = paintedName(undefined);
  assert.ok(!without.texts.includes("陳大文"));
  assert.ok(withName.layout.height > without.layout.height, "有名字畫布要高啲");
  // 版面指令唔越界(同上面個尺寸測試一樣嘅檢查)
  for (const op of withName.layout.ops) {
    assert.ok(op.x >= 0 && op.x <= withName.layout.width);
    assert.ok(op.y >= 0 && op.y <= withName.layout.height);
  }
});

test("poster:超長名字會縮細字號,唔撞 logo", () => {
  const long = "陳大文陳大文陳大文陳大文陳大文陳大文陳大文陳大"; // 25 字,20px 會超闊
  const { layout, texts } = paintedName(long);
  const nameOp = layout.ops.find((op) => op.t === "text" && op.text === long);
  assert.ok(nameOp, "長名都要畫");
  assert.ok(nameOp.size < 20, `長名應縮細字號,實際 ${nameOp.size}`);
  assert.ok(texts.includes(long));
});
