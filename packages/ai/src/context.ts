import { castZiweiFeixing, castZiweiHoroscope, favorableDirections, MAYA_META, type ChartResult, type CrossSystemResult, type EphemerisResult, type GanzhiRelation, type FortuneAnalysis, type HeluoResult, type QizhengResult, type HuangjiResult, type LiurenResult, type MayaResult, type PlanetaryHourResult, type TaixuanResult, type NumberLoreResult, type BirthLoreResult, type JyotishResult, type EgyptianResult, type MetonicResult } from "@numerology/engine";
import { Solar } from "lunar-javascript";
import { LIUREN_METHODS, SCIENCE_NOTES } from "@numerology/knowledge";
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
 * - full: 全部(整篇模式/對話,默認,保持舊行為)
 * - dayun: 僅八字大運各步(+確定性信號 digest);不要流年
 * - review: 僅已過流年(+年份→大運映射);不要未來年
 * - future: 僅參考年/未來流年(+年份→大運映射);不要已過年
 * - current: 僅當前大運/大限各一行(靜態報告各節的動靜結合一瞥)
 * - none: 不要動態段(純靜態節)
 */
export type FortuneScope = "full" | "dayun" | "review" | "future" | "current" | "none";

export interface ContextPackOptions {
  fortuneScope?: FortuneScope;
  /** 紫微運限(小限/斗君/疊宮/流月)嘅「而家」;默認 new Date()。測試傳固定值確保確定性。 */
  now?: Date;
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
- 大运:${daYun}${baziExtra(b)}

## 紫微斗数
- 命宫:${z.soulPalaceBranch} | 身宫:${z.bodyPalaceBranch} | ${z.fiveElementsClass}
- 命主:${z.soul} | 身主:${z.body}
- 命宫三方四正(判格局的依据):本宫${z.soulSanFang.palaceNames.self} + 对宫${z.soulSanFang.palaceNames.opposite} + 三合${z.soulSanFang.palaceNames.trine.join("/")};四宫合看主星:${z.soulSanFang.majorStars.join("、")}
- 十二宫主星(含生年四化标注):
${ORDER.map((n) => "  - " + palaceLine(n)).join("\n")}${ziweiExtra(chart, fortune, opts)}
${fortune ? renderFortuneSection(fortune, opts?.fortuneScope ?? "full") : ""}`;

  return { markdown, caveats };
}

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const SIHUA_SHORT = (l: { sihua: { type: string; star: string; intoPalace: string }[] }) =>
  l.sihua.map((s) => `${s.star}化${s.type}入${s.intoPalace}`).join("、");

/** 紫微附加事實(格局、神煞、飛星派、運限疊宮…);append-only,接喺現有紫微段之後。純計算。 */
function ziweiExtra(chart: ChartResult, fortune: FortuneAnalysis | undefined, opts?: ContextPackOptions): string {
  const { input, ziwei: z } = chart;
  const scope = opts?.fortuneScope ?? "full";
  const out: string[] = [];
  if (z.geju.length) out.push(`- 格局(《紫微斗数全书》):${z.geju.map((g) => `${g.name}(${g.verdict})`).join("、")}`);
  out.push(
    "- 十二宫神煞(长生/博士/将星/岁建):" +
      z.palaces.map((p) => `${p.name} ${p.changsheng12}/${p.boshi12}/${p.jiangqian12}/${p.suiqian12}`).join(";"),
  );
  if (scope !== "none") {
    const now = opts?.now ?? new Date();
    const refYear = fortune?.referenceYear ?? now.getFullYear();
    const hNow = castZiweiHoroscope(input, ymd(now));
    const hRef = castZiweiHoroscope(input, `${refYear}-6-1`); // 小限/流耀以參考年年中計
    const L = (h: typeof hNow, k: string) => h.layers.find((l) => l.key === k)!;
    const age = L(hRef, "age");
    if (age.active) out.push(`- 小限:${age.nominalAge}岁行${age.natalPalaceName}(${refYear}年)`);
    out.push(`- 斗君:${hNow.douJun.branch}(本命${hNow.douJun.natalPalaceName})`);
    out.push(
      `- 运限叠宫(当前):大限命宫=本命${L(hNow, "decadal").natalPalaceName}、流年命宫=本命${L(hNow, "yearly").natalPalaceName}、流月命宫=本命${L(hNow, "monthly").natalPalaceName}`,
    );
    if (hNow.overlaps.length)
      out.push(`- 四化叠化:${hNow.overlaps.map((o) => `${o.star}(本命${o.natalPalaceName}) ${o.tag}(${o.layers.map((l) => l.layer + l.type).join("+")})`).join(";")}`);
    const ys = L(hRef, "yearly").stars;
    const yStar = (n: string) => ys.find((s) => s.name === n)?.natalPalaceName;
    if (yStar("流禄") && yStar("流羊") && yStar("流陀"))
      out.push(`- 流耀(流年):流禄入${yStar("流禄")}、流羊入${yStar("流羊")}、流陀入${yStar("流陀")}(${refYear}年)`);
  }
  // 飛星派:標流派,只列四宮化忌落宮 + 自化 + 祿忌交馳
  const fx = castZiweiFeixing(input);
  const KEY = ["命宫", "财帛", "官禄", "夫妻"];
  const ji = KEY.map((n) => fx.flies.find((f) => f.from === n && f.type === "忌"))
    .filter((f) => f !== undefined)
    .map((f) => `${f.from}(${f.stem})化忌${f.star}入${f.intoPalace}`);
  out.push(
    "### 飞星派(流派说法,非《全书》,仅作参考,不作主要判断)",
    `- 四宫宫干化忌:${ji.join("、") || "—"}`,
    `- 自化:${fx.selfMutaged.map((s) => `${s.palace}自化${s.type}(${s.star})`).join("、") || "无"}`,
    `- 禄忌交驰:${fx.luJiJiaoChi.map((x) => `${x.luPalace}化禄入${x.jiPalace}且${x.jiPalace}化忌入${x.luPalace}`).join("、") || "无"}`,
  );
  if (scope === "full") {
    // 精確取鄰月:以今日回推當月初一,上月 = 初一前一日,下月 = 初一後 29 日(若仍同月再 +1,即大月 30 日)。
    const now = opts?.now ?? new Date();
    const lunarOf = (d: Date) => Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).getLunar();
    const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const cur = lunarOf(now);
    const first = addDays(now, -(cur.getDay() - 1));
    let next = addDays(first, 29);
    if (lunarOf(next).getMonth() === cur.getMonth()) next = addDays(next, 1);
    const months = [addDays(first, -1), now, next].map((d) => {
      const m = castZiweiHoroscope(input, ymd(d)).layers.find((l) => l.key === "monthly")!;
      return `  - 农历${lunarOf(d).getMonthInChinese()}月(${m.heavenlyStem}${m.earthlyBranch}):流月命宫落本命${m.natalPalaceName}:${SIHUA_SHORT(m) || "—"}`;
    });
    out.push("### 紫微流月(当前月±1)", ...months);
  }
  return "\n" + out.join("\n");
}

const PILLAR_ZH: Record<string, string> = { year: "年", month: "月", day: "日", hour: "时" };
/** 動態段只摘 冲/刑/合/会(含半合/三会等)。 */
const REL_KEEP = /冲|刑|合|会/;

/** 八字附加事實(格局、原局干支關係、胎元命宮);append-only,原有行不動。 */
function baziExtra(b: ChartResult["bazi"]): string {
  const g = b.geju;
  const rel = b.relations
    .map((r) => `${r.kind} ${r.chars.join("")}(${r.kind === "三会" ? r.hua : r.between.map((w) => PILLAR_ZH[w]).join("-")})`)
    .join(";");
  const x = b.extraPalaces;
  return `
- 格局(本站按《子平真诠》月令取格简化,不含成败救应):${g.main}(${g.basis})${g.also.length ? `;兼:${g.also.join("、")}` : ""}${g.possibleCong ? ";可能从格,格局仅供参考" : ""}${rel ? `\n- 原局干支关系:${rel}` : ""}
- 胎元 ${x.taiYuan.ganZhi}(${x.taiYuan.naYin}) | 胎息 ${x.taiXi.ganZhi} | 命宫 ${x.mingGong.ganZhi} | 身宫 ${x.shenGong.ganZhi}(古法,《三命通会》提要谓多有不验)`;
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

  /** 關係摘要〔冲年柱子午;岁运并临〕,無則空。 */
  const relTail = (rels: GanzhiRelation[], keChong: string[], bing = false) => {
    const parts = rels
      .filter((r) => REL_KEEP.test(r.kind))
      .map((r) => `${r.kind}${r.between.map((w) => PILLAR_ZH[w] ?? "").join("")}柱${r.chars.join("")}`);
    if (bing) parts.push("岁运并临");
    if (keChong.length) parts.push(`天克地冲${keChong.map((w) => PILLAR_ZH[w]).join("")}柱`);
    return parts.length ? `〔${parts.join(";")}〕` : "";
  };

  const daYun = f.bazi.daYun
    .map((d) => {
      const dec = d.ziweiDecadal;
      return (
        `  - ${d.ganZhi}(${d.startAge}-${d.endAge}岁/${d.startYear}-${d.endYear}) ` +
        `天干${d.ganShiShen}、支藏${d.hideShiShen.map((h) => h.gan + h.shiShen).join("")} ${u(d.suppliesUseGod)}${cur(d.isCurrent)}${relTail(d.relations, d.tianKeDiChong)}` +
        `【同期大限${dec.heavenlyStem}${dec.earthlyBranch}(行${dec.palaceName}):${sihua(dec.sihua)}】`
      );
    })
    .join("\n");

  const liuNianLine = (y: (typeof f.bazi.liuNian)[number]) =>
    `${y.year}(${y.age}岁)${y.ganZhi}·${y.ganShiShen}${y.suppliesUseGod ? "✓" : ""}${y.isReference ? "【参考年/今年】" : y.isPast ? "(已过)" : ""}${relTail(y.relations, y.tianKeDiChong, y.suiYunBingLin)}`;

  /** 流月(当前月±1);無 isCurrent 則不出。 */
  const liuYue = () => {
    const i = f.bazi.liuYue.findIndex((m) => m.isCurrent);
    if (i < 0) return "";
    const lines = f.bazi.liuYue.slice(Math.max(0, i - 1), i + 2).map((m) => `  - ${m.monthName}月 ${m.ganZhi}·${m.ganShiShen}${m.isCurrent ? " 【当前月】" : ""}${relTail(m.relations, [])}`);
    return `\n### 八字流月(当前月±1)\n${lines.join("\n")}`;
  };

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
  - 当前紫微大限:${f.ziwei.decadal.heavenlyStem}${f.ziwei.decadal.earthlyBranch}(行${f.ziwei.decadal.palaceName}):${sihua(f.ziwei.decadal.sihua)}${liuYue()}
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

  // full:舊行為(整篇模式/對話)
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
${yearly}${liuYue()}
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
  cycles?: { taixuan: TaixuanResult; maya: MayaResult; huangji?: HuangjiResult; planetaryHour?: PlanetaryHourResult | null; ephemeris?: EphemerisResult; heluo?: HeluoResult; qizheng?: QizhengResult; lore?: { numbers: NumberLoreResult; birth: BirthLoreResult }; calendars?: { jyotish: JyotishResult; egyptian: EgyptianResult; metonic: MetonicResult }; liuren?: LiurenResult },
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
    const hj = cycles.huangji;
    if (hj) {
      cycleBlock += `
- 皇極經世:${hj.huiName}會第 ${hj.yun} 運(${hj.yunName})第 ${hj.shi} 世(${hj.shiName}),世內第 ${hj.yearInShi} 年;年柱 ${hj.ganzhi}。層級 ${TIER_ZH[hj.tier]};出處 ${cite(hj.cite)}。
${step(hj.steps)}`;
    }
    const ph = cycles.planetaryHour;
    if (ph) {
      const where = ph.hour
        ? `${ph.half === "day" ? "日間" : "夜間"}第 ${ph.hour} 時「${ph.hourName}」,時主 ${ph.hourPlanet}(天使 ${ph.hourAngel})`
        : "當日極晝或極夜,無行星時";
      cycleBlock += `
- 行星時(Heptameron):行星日 ${ph.dayPlanet}(天使 ${ph.dayAngel});${where}。層級 ${TIER_ZH[ph.tier]};出處 ${cite(ph.cite)}。
${step(ph.steps)}`;
    }
    const ep = cycles.ephemeris;
    if (ep) {
      const SECT = { day: "晝生", night: "夜生" } as const;
      const DIG = { domicile: "入廟", exaltation: "入旺", fall: "落陷" } as const;
      const pos = ep.planets.map((p) =>
        `${p.planet} ${p.sign} ${p.degree.toFixed(1)}°${p.retrograde ? "(逆)" : ""}${p.house ? ` 第${p.house}宮` : ""} 宮主 ${p.ruler}${p.dignities.map((d) => ` ${DIG[d]}`).join("")} 界主 ${p.termRuler}`).join(";");
      const asp = ep.aspects.map((a) => `${a.a}–${a.b} ${a.type}`).join("、") || "無";
      const mm = ep.moonMansion;
      cycleBlock += `
- 七曜位置(Tetrabiblos 卷一,回歸黃道):${pos}。${ep.angles ? `上升 ${ep.angles.ascSign} ${(ep.angles.ascendant % 30).toFixed(1)}°、天頂 ${ep.angles.mcSign} ${(ep.angles.mc % 30).toFixed(1)}°(整宮制)` : "未填經緯度,無上升與宮位"};${ep.sect ? SECT[ep.sect] : "晝夜生未判"};整宮相位:${asp}。層級 ${TIER_ZH[ep.tier]};出處 ${cite(ep.cite)}。
- 月宿(Agrippa 二十八宿):第 ${mm.n} 宿 ${mm.names.join(" / ")}${mm.meaning ? `(${mm.meaning})` : ""},起於黃經 ${mm.start.toFixed(2)}°。出處 ${cite(ep.mansionCite)}。
${step(ep.steps)}`;
    }
    const hl = cycles.heluo;
    if (hl) {
      const yun = hl.dayun.map((d) => `${d.phase}第${d.line}爻 ${d.fromAge}–${d.toAge} 歲`).join(";");
      const ln = hl.liunian.find((y) => y.year === new Date().getFullYear());
      cycleBlock += `
- 河洛理數:天數 ${hl.heaven}、地數 ${hl.earth};先天 ${hl.xiantian.name}(元堂第 ${hl.yuantang} 爻),${hl.houtianAge} 歲換後天 ${hl.houtian.name}(元堂第 ${hl.houtianYuantang} 爻);元氣${hl.yuanqi.tian || hl.yuanqi.di ? "有" : "無"}${hl.yuanqi.reversed ? "(逢相反)" : ""},化工${hl.huagong.has ? "有" : "無"}${hl.huagong.reversed ? "(逢反)" : ""}。大運:${yun}。${ln ? `${ln.year} 年(${ln.age} 歲)流年卦 ${ln.hex.name} 第 ${ln.line} 爻(小象)。` : ""}層級 ${TIER_ZH[hl.tier]};出處 ${cite(hl.cite)}。
${step(hl.steps)}`;
    }
    const qz = cycles.qizheng;
    if (qz) {
      const rows = qz.bodies.map((b) => `${b.name}(${b.kind === "政" ? "七政" : "四餘推算點"}${b.id === "ziqi" ? ",流派公式、無實象" : ""}) 黃經 ${b.longitude.toFixed(2)}° 古宿度 ${b.ancient.name}宿 ${b.ancient.degree.toFixed(1)} 度、現代宿度 ${b.mansion.name}宿 ${b.mansion.degree.toFixed(1)}°、${b.gong.zhi}宮${b.gong.ci}(${b.house})${b.retrograde ? (b.kind === "政" ? "(逆)" : "(恆逆)") : ""}`).join(";");
      cycleBlock += `
- 七政四餘(回歸黃經;古宿度按《六壬大全》卷十一周天 365 度,現代宿度按距星歲差推算):${rows}。羅睺、計都、月孛、紫氣均為推算點、非實體天體,羅計恆逆行;${qz.variants.join(";")}。十二宮按《星學大成》卷一過宮度於古宿度上分界(界度讀作宿內古度 ≥ N 入下一宮,為本站讀法);命宮在${qz.minggong.zhi}宮${qz.minggong.ci}(太陽在${qz.minggong.sunZhi}宮加生時${qz.minggong.hourZhi},數至卯;鐘面時支,只定到宮),十二宮由命宮逆排:${qz.houses.map((h) => `${h.name}${h.zhi}`).join("、")}。層級 ${TIER_ZH[qz.tier]};出處 ${cite(qz.cite)}。
${step(qz.steps)}`;
    }
  }
  const lore = cycles?.lore;
  if (lore) {
    const PAR: Record<string, string> = { unit: "一", prime: "質數", composite: "合數", evenTimesEven: "偶偶數", evenTimesOdd: "偶奇數", oddTimesEven: "奇偶數" };
    const PARTS: Record<string, string> = { perfect: "完全數", superabundant: "盈數", deficient: "虧數" };
    const SRC: Record<string, string> = { lifepath: "生命靈數", kameaLine: "幻方行和", kameaTotal: "幻方總和", mayaKin: "瑪雅 Kin", heluoHeaven: "河洛天數", heluoEarth: "河洛地數" };
    const GRP: Record<string, string> = { mother: "母字母", double: "雙字母", simple: "單字母" };
    const items = lore.numbers.items.map((i) => {
      const cls = [PAR[i.cls.parity], i.cls.parts && PARTS[i.cls.parts], ...i.cls.figurate.map((f) => `${f.sides} 邊形數第 ${f.index} 項`), i.cls.cube && `${i.cls.cube}³`].filter(Boolean).join("、");
      const heb = i.hebrew ? `;希伯來字母 ${i.hebrew.name}(${GRP[i.hebrew.group]})` : "";
      const gem = i.gematria.length ? `;同值希臘詞 ${i.gematria.map((g) => `${g.greek}(${g.gloss})`).join("、")}` : "";
      const sc = i.scale ? `;Agrippa 數階 ${i.scale.n}(卷二第 ${i.scale.chapter} 章,象徵對應)` : "";
      return `  - ${SRC[i.source]} ${i.value}:${cls}${heb}${gem}${sc}`;
    });
    const b = lore.numbers.baseRate, bl = lore.birth, st = bl.stars;
    const hits = st.hits.map((h) => `${h.body} 合 ${h.star}(${h.bayer})${h.orb}°`).join("、") || "無";
    cycleBlock += `

## 數之學(確定性計算;象徵對應,不入五行比對)
- 你的數(Nicomachus 分類;出處 ${cite(lore.numbers.cites.nicomachus)}、${cite(lore.numbers.cites.scales)}、${cite(lore.numbers.cites.gematria)}):
${items.join("\n")}
- gematria 基率:詞表 ${b.distinct} 個不同數值分佈於 1–${b.max},隨機撞中約 ${b.distinct}/${b.max};${b.eligible} 個數期望撞中約 ${b.expected.toFixed(2)} 個,實際 ${b.hits} 個。詞表由 Fideler 挑選,偏向特定數。
- 律呂:夏曆 ${bl.lulu.lunarMonth} 月(${bl.lulu.branch}月)→ ${bl.lulu.pipe},律數 ${bl.lulu.value};《呂氏春秋》${bl.lulu.group === "upper" ? "上" : "下"}組,主${bl.lulu.season}。出處 ${cite(bl.cites.lulu)}。
- 黃道對應:太陽 ${bl.zodiac.sign},Agrippa 守護 ${bl.zodiac.ruler}、草 ${bl.zodiac.herb}、薰香 ${bl.zodiac.fume}${bl.zodiac.letter ? `;Sefer Yetzirah 單字母 ${bl.zodiac.letter.glyph}(${bl.zodiac.letter.faculty})` : ""}${bl.dayPlanet.letter ? `;出生星期 ${bl.dayPlanet.planet} 配雙字母 ${bl.dayPlanet.letter.glyph}(${bl.dayPlanet.letter.quality})` : ""}。字母配法出自 Westcott 1893 補表(近代),其他傳統不同。
- Behenian 恆星合相(±${st.orb}°,只比黃經):${hits}。基率:十五顆星覆蓋黃道約 ${(st.p * 100).toFixed(1)}%,${st.points} 個點期望命中約 ${st.expected.toFixed(1)} 個。出處 ${cite(bl.cites.stars)};容許度 ${cite(bl.cites.orb)}(近代)。`;
  }
  const cal = cycles?.calendars;
  if (cal) {
    const { jyotish: jy, egyptian: eg, metonic: me } = cal;
    const n = jy.nakshatra;
    const dashas = jy.dashas.map((d) => `${d.lord} ${d.start.slice(0, 4)}–${d.end.slice(0, 4)}(${d.startAge.toFixed(1)}–${d.endAge.toFixed(1)} 歲${d.partial ? ",首運折算" : ""})`).join(";");
    cycleBlock += `

## 曆法三系(確定性計算;週期定位,不入五行比對)
- Jyotish:ayanamsa(Lahiri / Chitrapaksha)${jy.ayanamsa.toFixed(2)}°;月亮恆星黃經 ${jy.moonSidereal.toFixed(2)}°,第 ${n.n} 宿 ${n.iast},宿內已行 ${(jy.elapsed * 100).toFixed(1)}%,宿主 ${n.lord}。出處 ${cite(jy.cite)}。
- Vimshottari 大運(年長 365.25 日):${dashas}。
- 埃及民用曆:Nabonassar 紀元第 ${eg.year} 年 ${eg.month} ${eg.day} 日;太陽在 ${eg.face.sign} 第 ${eg.face.index + 1} 個 face,主星 ${eg.face.ruler}。出處 ${cite(eg.cite)};face ${cite(eg.faceCite)}。
- 十九年週期:金數 ${me.golden}、Gregorian epact ${me.epact};出生年復活節 ${me.easter.month} 月 ${me.easter.day} 日;農曆 ${me.lunarYear} 年起 19 年現行農曆實有閏月 ${me.leapCount} 個(四分曆章法 7 個)。出處 ${cite(me.cite)};${cite(me.chineseCite)}。
${jy.steps.map((x) => `  - ${x}`).join("\n")}`;
  }
  const lr = cycles?.liuren;
  if (lr) {
    const sc = lr.sanChuan;
    const ke = lr.ke.map((k) => `${k.up}/${k.down}`).join("、");
    const men = LIUREN_METHODS.find((m) => m.id === sc.method)?.name ?? sc.method;
    cycleBlock += `

## 大六壬(確定性計算;只列起課結果,不入五行比對)
- 大六壬(出生時刻起課;日 ${lr.dayGanZhi}、占時 ${lr.hourZhi}):當令中氣 ${lr.zhongQi},月將 ${lr.yueJiang.zhi}(${lr.yueJiang.name});天地盤(地盤子→亥之天盤支)${lr.tianPan.join("")};四課(上/下)${ke};三傳 ${sc.chu}→${sc.zhong}→${sc.mo},課門 ${men}${sc.sub && sc.sub !== men ? `(${sc.sub})` : ""};天乙貴人 ${lr.guiren.zhi}(${lr.guiren.daytime ? "晝貴" : "夜貴"}、${lr.guiren.forward ? "順布" : "逆布"});天將落三傳:${[sc.chu, sc.zhong, sc.mo].map((z) => `${z}${lr.jiang[z]}`).join("、")}。層級 ${TIER_ZH[lr.tier]};出處 ${cite(lr.cite)}。四課起法、晝夜界、遙剋多神涉害剋向、涉害同深多孟、伏吟自刑用日判屬本站取法,非書明文。
${lr.steps.map((x) => `  - ${x}`).join("\n")}`;
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
