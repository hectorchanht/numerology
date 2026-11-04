import { favorableDirections, MAYA_META, type ChartResult, type CrossSystemResult, type FortuneAnalysis, type MayaResult, type TaixuanResult } from "@numerology/engine";
import { SCIENCE_NOTES } from "@numerology/knowledge";
import type { AiLocale } from "./prompts.js";

/** 上下文包:命盤事實 + 注意事項,供報告與對話共享同一份"真相"。 */
export interface ContextPack {
  /** 餵給模型的緊湊命盤事實(Markdown) */
  markdown: string;
  /** 精度/可信度邊界提示(真太陽時、未校對數據等) */
  caveats: string[];
}

/**
 * 動態運勢的作用域——分節生成時只喂該節需要的數據,而不是每次都把整份
 * fortune 倒給模型(2026-10-23 honest finding:模型會把逐運/逐年清單當填空模板
 * 走,越全越罐頭)。結構輸入,而不是加指令。
 * - full: 全部(整篇模式/對話,默認,保持舊行爲)
 * - dayun: 僅八字大運各步(+確定性信號 digest);不要流年
 * - review: 僅已過流年(+年份→大運映射);不要未來年
 * - future: 僅參考年/未來流年(+年份→大運映射);不要已過年
 * - current: 僅當前大運/大限各一行(靜態報告各節的動靜結合一瞥)
 * - none: 不要動態段(純靜態節)
 */
export type FortuneScope = "full" | "dayun" | "review" | "future" | "current" | "none";

export interface ContextPackOptions {
  fortuneScope?: FortuneScope;
}

/**
 * 命盤 JSON(+ 可選動態運勢) → 緊湊上下文包。純函數,不調用網絡/AI,可單測。
 * 報告與對話共用此包,確保兩者基於同一命盤事實,不自相矛盾。
 */
export function buildContextPack(chart: ChartResult, fortune?: FortuneAnalysis, opts?: ContextPackOptions): ContextPack {
  const { input, bazi: b, ziwei: z, meta } = chart;
  const caveats: string[] = [];

  if (!meta.trueSolarTimeApplied) {
    caveats.push(
      "出生时间按时钟时间起盘,未做真太阳时校正;若出生时刻接近时辰交界,时柱/命宫可能有偏差,解读时辰相关结论请留有余地。",
    );
  }

  const favDirs = favorableDirections(b.tiaohou.useGods);
  const favLine = favDirs
    .map((d) => `${d.wuxing}(${d.gans.join("")})→${d.direction}・宜${d.color}`)
    .join(";");
  const solarLine = meta.trueSolarTimeApplied
    ? `已校正(经度 ${meta.correction?.longitude}°,偏移 ${meta.correction?.offsetMinutes} 分钟)`
    : "未校正(按时钟时间起盘)";
  if (!b.tiaohou.reviewed) {
    caveats.push(
      `调候用神数据(${b.tiaohou.useGods.join("")})来自古籍诀文提取,尚未逐条人工校对,作为参考而非定论。`,
    );
  }

  const P = b.fourPillars;
  const pillar = (name: string, p: typeof P.year) =>
    `| ${name} | ${p.ganZhi} | ${p.shiShenGan || "—(日主)"} | ${p.hideGan.join("")} | ${p.shiShenZhi.join(" ")} | ${p.xingYun} | ${p.ziZuo} | ${p.xunKong} | ${p.naYin} |`;
  const shenShaLine = ([name, p]: [string, typeof P.year]) =>
    p.shenSha.length ? `  - ${name}柱(${p.ganZhi}): ${p.shenSha.join("、")}` : "";
  const shenShaBlock = (
    [["年", P.year], ["月", P.month], ["日", P.day], ["时", P.hour]] as [string, typeof P.year][]
  )
    .map(shenShaLine)
    .filter(Boolean)
    .join("\n");

  const daYun = b.daYun
    .filter((d) => d.ganZhi.trim().length === 2)
    .slice(0, 8)
    .map((d) => `${d.ganZhi}(${d.startAge}岁起/${d.startYear}年)`)
    .join("、");

  const palaceLine = (name: string) => {
    const p = z.palaces.find((x) => x.name === name);
    if (!p) return `${name}:—`;
    const stars = [...p.majorStars, ...p.minorStars]
      .map((s) => s.name + (s.brightness ? `(${s.brightness})` : "") + (s.mutagen ? `[${s.mutagen}]` : ""))
      .join(" ");
    const adj = p.adjectiveStars.map((s) => s.name).join(" ");
    return `${name}(${p.heavenlyStem}${p.earthlyBranch}): ${stars || "空宫"}${adj ? " · 杂曜:" + adj : ""}`;
  };

  const ORDER = [
    "命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
    "迁移", "仆役", "官禄", "田宅", "福德", "父母",
  ];

  const markdown = `# 命盘事实(确定性排盘结果,勿改动数字)

## 基本信息
- 公历:${input.year}-${input.month}-${input.day} ${input.hour}:${String(input.minute ?? 0).padStart(2, "0")} ${input.gender}
- 农历:${b.lunarDate}
- 真太阳时:${solarLine}

## 八字四柱
| 柱 | 干支 | 天干十神 | 藏干 | 藏干十神 | 星运 | 自坐 | 空亡 | 纳音 |
|---|---|---|---|---|---|---|---|---|
${pillar("年", P.year)}
${pillar("月", P.month)}
${pillar("日", P.day)}
${pillar("时", P.hour)}
${shenShaBlock ? "\n神煞:\n" + shenShaBlock : ""}

- 日主(日元):${b.dayMaster}(${b.dayWuXing})
- 月令:${b.monthBranch}
- 调候用神(穷通宝鉴):${b.tiaohou.useGods.join("、")}${b.tiaohou.reviewed ? "" : "(待校对)"}
- 喜用神方位(开运参考,由用神五行推):${favLine || "—"}
- 起运:${b.startLuck.description}(${b.startLuck.solarDate})
- 大运:${daYun}

## 紫微斗数
- 命宫:${z.soulPalaceBranch} | 身宫:${z.bodyPalaceBranch} | ${z.fiveElementsClass}
- 命主:${z.soul} | 身主:${z.body}
- 命宫三方四正(判格局的依据):本宫${z.soulSanFang.palaceNames.self} + 对宫${z.soulSanFang.palaceNames.opposite} + 三合${z.soulSanFang.palaceNames.trine.join("/")};四宫合看主星:${z.soulSanFang.majorStars.join("、")}
- 十二宫主星(含生年四化标注):
${ORDER.map((n) => "  - " + palaceLine(n)).join("\n")}
${fortune ? renderFortuneSection(fortune, opts?.fortuneScope ?? "full") : ""}`;

  return { markdown, caveats };
}

/** 按 scope 決定動態段的取捨;none → 空字符串(調用方直接不拼動態段)。 */
function renderFortuneSection(f: FortuneAnalysis, scope: FortuneScope): string {
  if (scope === "none") return "";
  return "\n" + renderFortune(f, scope);
}

/** 渲染動態運勢(大運/流年 + 紫微大限/流年四化飛宮)。 */
function renderFortune(f: FortuneAnalysis, scope: FortuneScope = "full"): string {
  const u = (b: boolean) => (b ? "✓引动用神" : "");
  const cur = (b: boolean) => (b ? " 【当前运】" : "");

  const sihua = (s: { type: string; star: string; intoPalace: string }[]) =>
    s.map((x) => `${x.type}→${x.star}(入${x.intoPalace})`).join(" ");

  const daYun = f.bazi.daYun
    .map((d) => {
      const dec = d.ziweiDecadal;
      return (
        `  - ${d.ganZhi}(${d.startAge}-${d.endAge}岁/${d.startYear}-${d.endYear}) ` +
        `天干${d.ganShiShen}、支藏${d.hideShiShen.map((h) => h.gan + h.shiShen).join("")} ${u(d.suppliesUseGod)}${cur(d.isCurrent)}` +
        `【同期大限${dec.heavenlyStem}${dec.earthlyBranch}(行${dec.palaceName}):${sihua(dec.sihua)}】`
      );
    })
    .join("\n");

  const liuNianLine = (y: (typeof f.bazi.liuNian)[number]) =>
    `${y.year}(${y.age}岁)${y.ganZhi}·${y.ganShiShen}${y.suppliesUseGod ? "✓" : ""}${y.isReference ? "【参考年/今年】" : y.isPast ? "(已过)" : ""}`;

  const yearlyLine = (y: (typeof f.ziwei.yearly)[number]) =>
    `  - ${y.year} ${y.heavenlyStem}${y.earthlyBranch}(行${y.palaceName}):${sihua(y.sihua)}`;

  const useGodHeader = `> 喜用神(调候):${f.bazi.useGods.join("")}${f.bazi.useGodsReviewed ? "" : "(待校对)"}。"引动用神"=该运/年补益命局(补救信号);反之多为受困或需谨慎。`;

  /** 年份→所屬大運干支的緊湊映射(回看/未來節用,讓模型知道某年落在哪步運)。 */
  const yearToStep = (years: number[]) => {
    const parts = years.map((yr) => {
      const d = f.bazi.daYun.find((s) => s.startYear <= yr && yr <= s.endYear);
      return d ? `${yr}→${d.ganZhi}运` : `${yr}→?`;
    });
    return parts.length ? `  年份所属大运:${parts.join("、")}\n` : "";
  };

  /** 確定性信號 digest:引動用神的步 + 大限化忌的步(純數據,不做價值判斷)。 */
  const signalDigest = () => {
    const yongSteps = f.bazi.daYun.filter((d) => d.suppliesUseGod).map((d) => d.ganZhi);
    const jiSteps = f.bazi.daYun
      .map((d) => {
        const ji = d.ziweiDecadal.sihua.filter((s) => s.type === "忌");
        return ji.length ? `${d.ganZhi}(忌${ji.map((s) => `→${s.star}入${s.intoPalace}`).join("")})` : "";
      })
      .filter(Boolean);
    const lines: string[] = [];
    if (yongSteps.length) lines.push(`引动用神: ${yongSteps.join("、")}`);
    if (jiSteps.length) lines.push(`大限化忌: ${jiSteps.join("、")}`);
    return lines.length ? `【确定性信号·全局一览】${lines.join("；")}\n` : "";
  };

  if (scope === "current") {
    const cur = f.bazi.daYun.find((d) => d.isCurrent);
    const curLine = cur
      ? `  - 当前八字大运:${cur.ganZhi}(${cur.startAge}-${cur.endAge}岁/${cur.startYear}-${cur.endYear}) 天干${cur.ganShiShen} ${u(cur.suppliesUseGod)}`
      : `  - 当前八字大运:—`;
    return `## 动态运势(当前运总览)
${useGodHeader}
${curLine}
  - 当前紫微大限:${f.ziwei.decadal.heavenlyStem}${f.ziwei.decadal.earthlyBranch}(行${f.ziwei.decadal.palaceName}):${sihua(f.ziwei.decadal.sihua)}
`;
  }

  if (scope === "dayun") {
    return `## 动态运势(大运逐步)
${useGodHeader}
${signalDigest()}
### 八字大运(相对日主${f.bazi.dayMaster})
${daYun}
`;
  }

  if (scope === "review" || scope === "future") {
    const years = f.bazi.liuNian.filter((y) => (scope === "review" ? y.isPast : !y.isPast));
    const yearNums = years.map((y) => y.year);
    const yearlyLines = f.ziwei.yearly.filter((y) => y.year !== undefined && yearNums.includes(y.year!)).map(yearlyLine).join("\n");
    const title = scope === "review" ? "已过流年·回看验证" : "参考年/未来流年";
    return `## 动态运势(${title})
${useGodHeader}
${yearToStep(yearNums)}
### 八字流年
  ${years.map(liuNianLine).join(" | ")}

### 紫微流年四化(飞入本命宫,化忌冲宫尤需留意)
${yearlyLines}
`;
  }

  // full:舊行爲(整篇模式/對話)
  const liuNian = f.bazi.liuNian.map(liuNianLine).join(" | ");
  const yearly = f.ziwei.yearly.map(yearlyLine).join("\n");

  return `## 动态运势(动静结合的关键——运在一生中占主导)
${useGodHeader}

### 八字大运(相对日主${f.bazi.dayMaster})
${daYun}

### 八字流年(含已过年份,供回看验证)
  ${liuNian}

### 紫微大限四化(当前大限,仅用于"当前总览";各步大运的同期大限见上面每步行末【同期大限…】,两者不要混用)
  - 大限 ${f.ziwei.decadal.heavenlyStem}${f.ziwei.decadal.earthlyBranch}(行${f.ziwei.decadal.palaceName}):${sihua(f.ziwei.decadal.sihua)}

### 紫微流年四化(飞入本命宫,化忌冲宫尤需留意)
${yearly}
`;
}

const SYS_ZH: Record<string, string> = { bazi: "八字日主", ziwei: "紫微五行局", ninestar: "九星年星", lifepath: "生命靈數" };
const REL_ZH: Record<string, string> = { same: "印證(同五行)", sheng: "相生", ke: "分歧(相剋)" };
const TIER_ZH: Record<string, string> = { classical: "原典", scholarly: "學者詮釋", modern: "近現代", science: "科學研究" };
const FIT_ZH: Record<string, string> = { favorable: "喜", unfavorable: "忌", neutral: "閒" };
const VERDICT_ZH: Record<string, string> = { strong: "身強", weak: "身弱", neutral: "中和" };

/**
 * 多體系事實區塊(Markdown):只列引擎已算好的事實,不含解讀。
 * 只附在 crosssystem 一節的 user prompt,不進 system(保持 prompt cache 前綴不變、其他節不受影響)。
 */
export function crossSystemFacts(
  r: CrossSystemResult,
  locale: AiLocale,
  cycles?: { taixuan: TaixuanResult; maya: MayaResult },
): string {
  const cite = (c: { work: string; author?: string; year?: number | string; locator?: string }) =>
    [c.author, c.work, c.year, c.locator].filter(Boolean).join(",");
  const f = r.fuyi;
  const neutral = f.verdict === "neutral";
  // 中和盤不定喜忌,各體系一律為閒(與頁面對照卡同一規則)。
  const fitOf = (s: CrossSystemResult["signals"][number]) =>
    s.system === "bazi" ? "錨點" : neutral ? "閒" : FIT_ZH[s.fit ?? "neutral"];
  const rows = r.signals.map((s) =>
    `| ${SYS_ZH[s.system] ?? s.system} | ${s.value} | ${s.wuxing} | ${s.relation ? REL_ZH[s.relation] : "錨點"} | ${fitOf(s)} | ${s.bridge ? `經${s.bridge}橋接` : "—"} | ${s.tier ? TIER_ZH[s.tier] : "未分級"} | ${cite(s.cite)} |`,
  );
  const score = f.score >= 0 ? `+${f.score}` : `−${-f.score}`;
  const fuyiLines = [
    `- 判定:${VERDICT_ZH[f.verdict]},評分 ${score}(> +1.5 身強,< −1.5 身弱,其間中和)。層級 ${TIER_ZH[f.tier]};出處 ${cite(f.cite)}。`,
    neutral
      ? "- 喜忌:中和,以調候為參,不定喜忌;各體系「對八字喜忌」皆為閒,不計第二軸基率。"
      : `- 喜忌:喜用 ${f.favorable.join("、")};忌 ${f.unfavorable.join("、")}。\n`
        + `- 第二軸基率(按此盤):任一體系隨機落喜用約 ${f.favorable.length}/5,落忌約 ${f.unfavorable.length}/5。`,
    `- 可能從格:${f.possibleCong ? "是(評分達 ±6,從格喜忌與扶抑相反,本節結論僅供參考)" : "否"}。`,
    "- 步驟:",
    ...f.steps.map((x) => `  - ${x}`),
  ];
  const k = r.kamea;
  const marks = k.marks.map((m) => `${m.system === "lifepath" ? "生命靈數" : "九星年星"} ${m.value} 落第 ${m.row + 1} 行第 ${m.col + 1} 列`);
  const dist = Object.entries(r.distribution).map(([w, n]) => `${w} ${n}`).join("、");
  const notes = SCIENCE_NOTES.map((n) => `- [${n.id}] ${n.claim[locale]}(${cite(n.cite)})${n.reviewed ? "" : "(待校對)"}`);
  // 時間週期:與頁面週期卡同一引擎結果;只作位置對照,不進上方五行表。
  let cycleBlock = "";
  if (cycles) {
    const { taixuan: tx, maya: m } = cycles;
    const pos = tx.head ? `第 ${tx.head} 首「${tx.headName}」第 ${tx.zan} 贊` : `${tx.extra}(81 首 × 9 贊之外)`;
    const step = (xs: string[]) => xs.map((x) => `  - ${x}`).join("\n");
    cycleBlock = `

## 時間週期(週期定位,不入五行比對)
- 太玄:${pos};半日序 ${tx.halfDayIndex}。層級 ${TIER_ZH[tx.tier]};出處 ${cite(tx.cite)}。
${step(tx.steps)}
- 瑪雅:長紀曆 ${m.longCount.join(".")};Tzolk'in ${m.tzolkin.number} ${m.tzolkin.dayName};Haab ${m.haab.day} ${m.haab.monthName};GMT 對應常數 ${m.correlation}。層級 ${MAYA_META.tier ? TIER_ZH[MAYA_META.tier] : "未分級"};出處 ${cite(m.cite)}。
${step(m.steps)}`;
  }
  return `# 多體系事實(確定性計算結果,勿改動數字)

錨點:八字日主五行 ${r.anchor}。各體系按自身規則求出核心五行,再與錨點比對。

| 體系 | 計出值 | 五行 | 與日主關係 | 對八字喜忌 | 橋接 | 層級 | 出處 |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

- 五行分佈:${dist}

## 扶抑喜忌(第二軸;本站簡化評分,非古籍原文)
${fuyiLines.join("\n")}

## 宇宙幾何(本節可用的數)
- 洛書(即 Saturn 3 階幻方):每行和 15,總和 45。
- 出生星期:星期${"日一二三四五六"[k.weekday]} → 守護行星 ${k.planet} → ${k.order} 階幻方:每行和 ${k.lineSum},總和 ${k.total}。
${marks.length ? `- 落點:${marks.join(";")}。` : "- 落點:無(數值超出方陣範圍)。"}

## 科學研究條目(science-notes,本站唯一可引用的研究)
${notes.join("\n")}${cycleBlock}`;
}
