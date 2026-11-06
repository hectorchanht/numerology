import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castCrossSystem, castTaixuan, castMaya, castHuangji, castPlanetaryHour, castEphemeris, castHeluo, heluoClasses, castQizheng, castLiuren } from "@numerology/engine";
import { LIUREN_METHODS, SCIENCE_NOTES } from "@numerology/knowledge";
import {
  SYSTEM_PERSONA,
  REPORT_SEGMENTS,
  SEGMENT_TITLES,
  buildReportSectionPrompt,
  buildCachedSystem,
  crossSystemFacts,
} from "../dist/index.js";

const chart = castChart({ year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男" });
const cross = castCrossSystem(chart);
const facts = crossSystemFacts(cross, "zht");
const seg = REPORT_SEGMENTS.find((s) => s.key === "crosssystem");
const HEAD = "# 多體系事實(";

test("crosssystem 節:三語標題,位於 advice 之前", () => {
  const t = SEGMENT_TITLES.crosssystem;
  assert.ok(t?.zht && t?.zhs && t?.en);
  const keys = REPORT_SEGMENTS.map((s) => s.key);
  assert.ok(seg, "REPORT_SEGMENTS 應含 crosssystem");
  assert.equal(keys.indexOf("crosssystem"), keys.indexOf("advice") - 1);
});

test("crossSystemFacts:各體系值、五行、橋接、幻方數與科學條目", () => {
  assert.ok(facts.includes(HEAD));
  for (const s of cross.signals) {
    assert.ok(facts.includes(s.value), `缺 ${s.system} 值`);
    assert.ok(facts.includes(s.cite.work), `缺 ${s.system} 出處`);
  }
  assert.ok(facts.includes("河圖"));
  assert.ok(facts.includes("15") && facts.includes("45"), "洛書行和 / 總和");
  assert.ok(facts.includes(String(cross.kamea.lineSum)) && facts.includes(String(cross.kamea.total)));
  for (const n of SCIENCE_NOTES) {
    assert.ok(facts.includes(n.id), `缺 ${n.id}`);
    assert.ok(facts.includes(n.claim.zht));
  }
  assert.ok(facts.includes("待校對"));
  assert.ok(crossSystemFacts(cross, "en").includes(SCIENCE_NOTES[0].claim.en));
});

test("crosssystem prompt 含事實區塊,lens=bazi 亦不隔離", () => {
  const p = buildReportSectionPrompt([], seg, "bazi", "zht", facts);
  assert.ok(p.includes(facts), "應附事實區塊");
  assert.ok(!p.includes("只用八字"), "多體系一節不受 lens 隔離");
  assert.ok(p.includes("## " + SEGMENT_TITLES.crosssystem.zht));
});

test("crosssystem prompt 條款:只引事實區塊、基率、河圖橋接、666 中性", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  for (const must of ["只取自", "science-notes", "基率", "經河圖橋接", "666", "中性", "不重畫表格"]) {
    assert.ok(p.includes(must), `缺條款: ${must}`);
  }
  assert.ok(p.includes("同五行的機會約五分之一"), "同五行基率");
  assert.ok(p.includes("含相生在內的「同向」約五分之三"), "同向基率");
});

test("crosssystem 缺 extraFacts 時報錯", () => {
  assert.throws(() => buildReportSectionPrompt([], seg, "both", "zht"), /extraFacts/);
  assert.throws(() => buildReportSectionPrompt([], seg, "both", "zht", "  "), /extraFacts/);
});

test("人設限定:無多體系事實區塊時不提、不自行推算", () => {
  assert.ok(SYSTEM_PERSONA.includes("只在隨附「多體系事實」區塊時才對照"));
  assert.ok(SYSTEM_PERSONA.includes("沒有該區塊時一律不提、不自行推算"));
});

test("其他節與 buildCachedSystem 不含多體系區塊", () => {
  const other = REPORT_SEGMENTS.find((s) => s.key === "personality");
  assert.ok(!buildReportSectionPrompt([], other, "both", "zht").includes(HEAD));
  const sys = buildCachedSystem(chart, undefined, "zht").map((b) => b.text).join("\n");
  assert.ok(!sys.includes(HEAD));
  assert.ok(!sys.includes("science-notes"));
});

test("crossSystemFacts:附大六壬出生課", () => {
  const liuren = castLiuren(chart.input);
  const f = crossSystemFacts(cross, "zht", { taixuan: castTaixuan(chart.input), maya: castMaya(chart.input.year, chart.input.month, chart.input.day), liuren });
  const sc = liuren.sanChuan;
  assert.ok(f.includes(`月將 ${liuren.yueJiang.zhi}(${liuren.yueJiang.name})`));
  assert.ok(f.includes(`三傳 ${sc.chu}→${sc.zhong}→${sc.mo}`));
  const men = LIUREN_METHODS.find((m) => m.id === sc.method).name;
  assert.ok(f.includes(`課門 ${men}`) && !f.includes(`課門 ${sc.method}`));
  assert.ok(f.includes("本站取法"));
  assert.ok(f.includes("四課") && f.includes("六壬大全"));
  const c0 = liuren.chuan[0];
  assert.ok(f.includes(`旬首 ${liuren.xun.shou}、旬空 ${liuren.xun.kong.join("")}`));
  assert.ok(f.includes(`${c0.zhi}(${c0.dun ? `遁${c0.dun}` : "空亡"}、${c0.qin})`));
  assert.ok(f.includes("神煞落三傳四課"));
  assert.ok(f.includes("遁干算式屬本站取法"));
});

test("crosssystem 指令:幻方落點只稱巧合或象徵,不下統計結論", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  assert.ok(p.includes("巧合或象徵"));
  assert.ok(p.includes("不得宣稱「非隨機」"));
});

test("非 crosssystem 節不含多體系事實區塊", () => {
  const personality = REPORT_SEGMENTS.find((s) => s.key === "personality");
  const p = buildReportSectionPrompt([], personality, "both", "zht");
  assert.ok(!p.includes(HEAD));
});

test("crossSystemFacts:附太玄與瑪雅週期定位,標明不入五行比對", () => {
  const taixuan = castTaixuan(chart.input);
  const maya = castMaya(chart.input.year, chart.input.month, chart.input.day);
  const f = crossSystemFacts(cross, "zht", { taixuan, maya });
  assert.ok(f.startsWith(HEAD), "仍在同一多體系事實區塊");
  assert.ok(f.includes("週期定位,不入五行比對"));
  assert.ok(f.includes("太玄") && f.includes(taixuan.headName ?? taixuan.extra), "太玄首名或踦嬴");
  if (taixuan.zan) assert.ok(f.includes(`第 ${taixuan.zan} 贊`));
  assert.ok(f.includes("冬至"), "冬至基準步驟");
  assert.ok(f.includes("Tzolk'in") && f.includes(`${maya.tzolkin.number} ${maya.tzolkin.dayName}`));
  assert.ok(f.includes(maya.longCount.join(".")) && f.includes(`${maya.haab.day} ${maya.haab.monthName}`));
  assert.ok(f.includes("584283"));
  assert.ok(f.includes("原典") && f.includes("學者詮釋"), "tier");
  assert.ok(f.includes("揚雄") || f.includes("太玄經"), "太玄出處");
  assert.ok(!facts.includes("Tzolk'in"), "未傳入週期時不附");
});

test("crossSystemFacts:附皇極經世會運世同行星時;冇緯度就唔附行星時", () => {
  const taixuan = castTaixuan(chart.input);
  const maya = castMaya(chart.input.year, chart.input.month, chart.input.day);
  const huangji = castHuangji(chart.input);
  const planetaryHour = castPlanetaryHour({ ...chart.input, latitude: 22.3, longitude: 114.17 });
  const f = crossSystemFacts(cross, "zht", { taixuan, maya, huangji, planetaryHour });
  assert.ok(f.includes(`${huangji.huiName}會第 ${huangji.yun} 運`) && f.includes(`第 ${huangji.shi} 世`));
  assert.ok(f.includes("邵雍") && f.includes("唐堯"), "出處與錨點步驟");
  assert.ok(f.includes(`行星日 ${planetaryHour.dayPlanet}`) && f.includes(`時主 ${planetaryHour.hourPlanet}`));
  assert.ok(f.includes("Heptameron") && f.includes("日出"));
  const noLat = crossSystemFacts(cross, "zht", { taixuan, maya, huangji, planetaryHour: castPlanetaryHour(chart.input) });
  assert.ok(!noLat.includes("行星時(Heptameron)"));
});

test("crossSystemFacts:附七曜位置同月宿", () => {
  const ephemeris = castEphemeris({ ...chart.input, latitude: 22.3, longitude: 114.17 });
  const f = crossSystemFacts(cross, "zht", { taixuan: castTaixuan(chart.input), maya: castMaya(chart.input.year, chart.input.month, chart.input.day), ephemeris });
  const sun = ephemeris.planets[0];
  assert.ok(f.includes(`Sun ${sun.sign} ${sun.degree.toFixed(1)}°`));
  assert.ok(f.includes(`第 ${ephemeris.moonMansion.n} 宿 ${ephemeris.moonMansion.names[0]}`));
  assert.ok(f.includes("Tetrabiblos") && f.includes("Agrippa") && /[晝夜]生/.test(f));
  assert.ok(f.includes(`上升 ${ephemeris.angles.ascSign}`) && f.includes(`第${sun.house}宮`));
});

test("crossSystemFacts:附河洛理數先後天卦同大運", () => {
  const heluo = castHeluo(chart.input);
  const f = crossSystemFacts(cross, "zht", { taixuan: castTaixuan(chart.input), maya: castMaya(chart.input.year, chart.input.month, chart.input.day), heluo });
  assert.ok(f.includes(`先天 ${heluo.xiantian.name}(元堂第 ${heluo.yuantang} 爻)`));
  assert.ok(f.includes(`${heluo.houtianAge} 歲換後天 ${heluo.houtian.name}`));
  assert.ok(f.includes("陳摶") && f.includes("遇十不用"));
  assert.ok(f.includes(`順數 ${heluo.jinsuo.forward}、逆數 ${heluo.jinsuo.reverse}`));
  assert.ok(f.includes(`積 ${heluo.guangxiang.branch.product},256 卦中 ${heluo.guangxiang.dist[heluo.guangxiang.branch.product]} 卦同積`));
  const ln = heluo.liunian.find((y) => y.year === new Date().getFullYear());
  if (ln) assert.ok(f.includes(`流年卦 ${ln.hex.name} 第 ${ln.line} 爻`));
  assert.ok(!f.includes("河洛天地數分類"));
  const g = crossSystemFacts(cross, "zht", { taixuan: castTaixuan(chart.input), maya: castMaya(chart.input.year, chart.input.month, chart.input.day), heluo, heluoClasses: heluoClasses(heluo, chart.input) });
  assert.ok(g.includes("河洛天地數分類") && g.includes(`元堂第 ${heluo.yuantang} 爻,爻位等第`));
});

test("crossSystemFacts:附七政四餘宿度同羅計分歧", () => {
  const qizheng = castQizheng(chart.input);
  const f = crossSystemFacts(cross, "zht", { taixuan: castTaixuan(chart.input), maya: castMaya(chart.input.year, chart.input.month, chart.input.day), qizheng });
  assert.ok(f.includes("七政四餘") && f.includes("推步捷例") && f.includes("流派公式"));
  const sun = qizheng.bodies.find((b) => b.id === "Sun");
  assert.ok(f.includes(`古宿度 ${sun.ancient.name}宿`));
  assert.ok(f.includes(`${sun.gong.zhi}宮${sun.gong.ci}`));
  assert.ok(f.includes(`命宮在${qizheng.minggong.zhi}`) && f.includes("曆象考成") && f.includes("恆逆") && f.includes("本站讀法"));
});

test("crosssystem 指令:太玄與瑪雅只作週期定位", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  for (const must of ["週期定位", "不推五行", "不作吉凶斷語", "贊辭", "皇極經世", "不推治亂興衰", "行星時", "不寫天使職能", "七曜位置", "不推宮位主事吉凶", "河洛理數", "不作富貴壽夭斷語", "詩表未入庫", "256 卦中所佔比例", "七政四餘", "紫氣為流派公式", "命宮與十二宮名的落點", "大六壬", "不作占斷", "未附上升時不講宮位", "太玄首名、首辭、贊辭原文未附,不得引述或釋義", "Dreamspell"]) {
    assert.ok(p.includes(must), `缺條款: ${must}`);
  }
});

const signedScore = (n) => (n >= 0 ? `+${n}` : `−${-n}`);
const FIT_LABEL = { favorable: "喜", unfavorable: "忌", neutral: "閒" };
const REL_LABEL = { same: "印證(同五行)", sheng: "相生", ke: "分歧(相剋)" };

test("crossSystemFacts:第二軸扶抑喜忌(身強弱、評分、喜忌五行、各 signal fit、按盤基率)", () => {
  const f = cross.fuyi;
  assert.ok(facts.includes("扶抑喜忌"));
  assert.ok(facts.includes("本站簡化評分"));
  assert.ok(facts.includes({ strong: "身強", weak: "身弱", neutral: "中和" }[f.verdict]));
  assert.ok(facts.includes(`評分 ${signedScore(f.score)}`));
  assert.ok(facts.includes("對八字喜忌"), "表格新欄");
  for (const s of cross.signals) {
    if (s.system === "bazi") continue;
    assert.ok(facts.includes(`| ${s.wuxing} | ${REL_LABEL[s.relation]} | ${FIT_LABEL[s.fit]} |`), `缺 ${s.system} fit`);
  }
  if (f.verdict !== "neutral") {
    assert.ok(facts.includes(`喜用 ${f.favorable.join("、")}`));
    assert.ok(facts.includes(`忌 ${f.unfavorable.join("、")}`));
    assert.ok(facts.includes(`${f.favorable.length}/5`) && facts.includes(`${f.unfavorable.length}/5`));
  }
  for (const st of f.steps) assert.ok(facts.includes(st), "扶抑步驟");
});

test("crossSystemFacts:中和盤不列基率,可能從格時標明", () => {
  const neutral = { ...cross, fuyi: { ...cross.fuyi, verdict: "neutral", favorable: [], unfavorable: [], possibleCong: false } };
  const n = crossSystemFacts(neutral, "zht");
  assert.ok(n.includes("中和") && n.includes("不定喜忌"));
  assert.ok(!n.includes("第二軸基率(按此盤)"), "中和不列第二軸基率");
  assert.ok(!n.includes("可能從格:是"));
  for (const s of neutral.signals.filter((x) => x.system !== "bazi")) {
    assert.ok(n.includes(`| ${s.wuxing} | ${REL_LABEL[s.relation]} | 閒 |`), "中和時各體系皆為閒");
  }
  const cong = { ...cross, fuyi: { ...cross.fuyi, verdict: "weak", score: -6.5, possibleCong: true } };
  assert.ok(crossSystemFacts(cong, "zht").includes("可能從格:是"));
});

test("crosssystem 指令:第二軸說明、按盤基率、從格警示、不自行計算扶抑", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  for (const must of ["第二軸", "對八字喜忌", "照抄事實區塊", "按此盤", "可能從格", "從格喜忌與扶抑相反", "本站簡化評分、非古籍原文", "各體系皆為閒", "兩套不同方法,並列陳述各自結論,不合併也不互相修正"]) {
    assert.ok(p.includes(must), `缺條款: ${must}`);
  }
});

test("數之學:事實區塊附你的數、基率、律呂、恆星;指令要求同句講基率", async () => {
  const { castNumberLore, castBirthLore } = await import("@numerology/engine");
  const sky = castEphemeris(chart.input);
  const f = crossSystemFacts(cross, "zht", {
    taixuan: castTaixuan(chart.input),
    maya: castMaya(1990, 3, 18),
    lore: { numbers: castNumberLore(chart), birth: castBirthLore(chart, sky) },
  });
  assert.ok(f.includes("## 數之學"));
  assert.ok(f.includes("幻方總和 666"));
  assert.ok(f.includes("ΣΥΗΝΗ"));
  assert.ok(f.includes("gematria 基率"));
  assert.ok(f.includes("夾鐘,律數 68"));
  assert.ok(f.includes("Behenian 恆星合相"));
  const p = buildReportSectionPrompt([], seg, "both", "zht", f);
  assert.ok(p.includes("同句講事實區塊所列的基率與期望數"));
  assert.ok(!facts.includes("## 數之學"), "未傳 lore 時不出數之學段");
});

test("曆法三系:事實區塊附宿位、Vimshottari、民用曆、金數;指令限定只對照年份", async () => {
  const { castJyotish, castEgyptian, castMetonic } = await import("@numerology/engine");
  const sky = castEphemeris(chart.input);
  const f = crossSystemFacts(cross, "zht", {
    taixuan: castTaixuan(chart.input),
    maya: castMaya(1990, 3, 18),
    calendars: { jyotish: castJyotish(sky), egyptian: castEgyptian(chart.input, sky), metonic: castMetonic({ year: 1990, month: 3, day: 18 }) },
  });
  assert.ok(f.includes("## 曆法三系"));
  assert.ok(f.includes("Vimshottari 大運"));
  assert.ok(f.includes("Nabonassar 紀元第 2738 年"));
  assert.ok(f.includes("金數 15"));
  const p = buildReportSectionPrompt([], seg, "both", "zht", f);
  assert.ok(p.includes("不以一方印證或否定另一方"));
  assert.ok(!facts.includes("## 曆法三系"));
});
