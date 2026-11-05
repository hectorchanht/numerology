import type { Dizhi, Tiangan } from "@numerology/knowledge";

/**
 * 八字神煞(常用標準集,非窮盡)。
 * 說明:神煞流派眾多、定義有差異;此處只實現規則較一致、爭議較小的常用神煞,
 * 對定義分歧大的(福星/德秀/童子/血刃等)從略,避免臆造。
 */

/** 日干 → 觸發該神煞的地支集合 */
type GanMap = Partial<Record<Tiangan, Dizhi[]>>;

const TIANYI: GanMap = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["卯", "巳"], 癸: ["卯", "巳"],
  辛: ["寅", "午"],
};
const TAIJI: GanMap = {
  甲: ["子", "午"], 乙: ["子", "午"],
  丙: ["卯", "酉"], 丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"], 辛: ["寅", "亥"],
  壬: ["巳", "申"], 癸: ["巳", "申"],
};
const WENCHANG: GanMap = {
  甲: ["巳"], 乙: ["午"], 丙: ["申"], 戊: ["申"], 丁: ["酉"], 己: ["酉"],
  庚: ["亥"], 辛: ["子"], 壬: ["寅"], 癸: ["卯"],
};
const GUOYIN: GanMap = {
  甲: ["戌"], 乙: ["亥"], 丙: ["丑"], 丁: ["寅"], 戊: ["丑"], 己: ["寅"],
  庚: ["辰"], 辛: ["巳"], 壬: ["未"], 癸: ["申"],
};
const LUSHEN: GanMap = {
  甲: ["寅"], 乙: ["卯"], 丙: ["巳"], 戊: ["巳"], 丁: ["午"], 己: ["午"],
  庚: ["申"], 辛: ["酉"], 壬: ["亥"], 癸: ["子"],
};
const YANGREN: GanMap = {
  甲: ["卯"], 丙: ["午"], 戊: ["午"], 庚: ["酉"], 壬: ["子"],
};
const JINYU: GanMap = {
  甲: ["辰"], 乙: ["巳"], 丙: ["未"], 丁: ["申"], 戊: ["未"], 己: ["申"],
  庚: ["戌"], 辛: ["亥"], 壬: ["丑"], 癸: ["寅"],
};
const HONGYAN: GanMap = {
  甲: ["午"], 乙: ["午"], 丙: ["寅"], 丁: ["未"], 戊: ["辰"], 己: ["辰"],
  庚: ["戌"], 辛: ["酉"], 壬: ["子"], 癸: ["申"],
};

/**
 * 學堂:日干長生位(支)。
 * 出處核對(zh.wikisource《三命通會》卷三〈論學堂詞館〉):原文以「五行長生為學堂正位」(納音五行長生,如金命見巳),
 * 與此處「日干長生」取法有出入;此表採通行日干長生法,屬流派差異。
 */
const XUETANG: GanMap = {
  甲: ["亥"], 乙: ["午"], 丙: ["寅"], 丁: ["酉"], 戊: ["寅"], 己: ["酉"],
  庚: ["巳"], 辛: ["子"], 壬: ["申"], 癸: ["卯"],
};

const GAN_SHENSHA: { name: string; map: GanMap }[] = [
  { name: "天乙贵人", map: TIANYI },
  { name: "太极贵人", map: TAIJI },
  { name: "文昌贵人", map: WENCHANG },
  { name: "国印贵人", map: GUOYIN },
  { name: "禄神", map: LUSHEN },
  { name: "羊刃", map: YANGREN },
  { name: "金舆", map: JINYU },
  { name: "红艳煞", map: HONGYAN },
  { name: "学堂", map: XUETANG },
];

/** 三合局:首字(代表) → 局內地支,用於將星/華蓋/驛馬/桃花等。 */
const SANHE_GROUP: Record<string, Dizhi[]> = {
  申子辰: ["申", "子", "辰"],
  亥卯未: ["亥", "卯", "未"],
  寅午戌: ["寅", "午", "戌"],
  巳酉丑: ["巳", "酉", "丑"],
};
/** 由某地支找其所屬三合局 key */
function groupOf(zhi: Dizhi): string | undefined {
  for (const [k, arr] of Object.entries(SANHE_GROUP)) if (arr.includes(zhi)) return k;
  return undefined;
}
/** 三合局 key → 各神煞對應地支 */
const SANHE_SHENSHA: Record<string, Record<string, Dizhi>> = {
  申子辰: { 将星: "子", 华盖: "辰", 驿马: "寅", 桃花: "酉", 劫煞: "巳", 灾煞: "午", 亡神: "亥" },
  亥卯未: { 将星: "卯", 华盖: "未", 驿马: "巳", 桃花: "子", 劫煞: "申", 灾煞: "酉", 亡神: "寅" },
  寅午戌: { 将星: "午", 华盖: "戌", 驿马: "申", 桃花: "卯", 劫煞: "亥", 灾煞: "子", 亡神: "巳" },
  巳酉丑: { 将星: "酉", 华盖: "丑", 驿马: "亥", 桃花: "午", 劫煞: "寅", 灾煞: "卯", 亡神: "申" },
};

/** 年支 → 孤辰、寡宿 */
const GUGUA: Record<string, { 孤辰: Dizhi; 寡宿: Dizhi }> = {
  亥: { 孤辰: "寅", 寡宿: "戌" }, 子: { 孤辰: "寅", 寡宿: "戌" }, 丑: { 孤辰: "寅", 寡宿: "戌" },
  寅: { 孤辰: "巳", 寡宿: "丑" }, 卯: { 孤辰: "巳", 寡宿: "丑" }, 辰: { 孤辰: "巳", 寡宿: "丑" },
  巳: { 孤辰: "申", 寡宿: "辰" }, 午: { 孤辰: "申", 寡宿: "辰" }, 未: { 孤辰: "申", 寡宿: "辰" },
  申: { 孤辰: "亥", 寡宿: "未" }, 酉: { 孤辰: "亥", 寡宿: "未" }, 戌: { 孤辰: "亥", 寡宿: "未" },
};

/**
 * 天德貴人:月支 → 干或支。核對〈論天月德〉所載天德合(正月丁合壬、二月坤合巽、三月壬合丁、四月辛合丙…)
 * 與此表寅丁/卯申/辰壬/巳辛 一致;原文無完整月支表,餘月沿通行表。
 */
const TIANDE: Record<Dizhi, string> = {
  寅: "丁", 卯: "申", 辰: "壬", 巳: "辛", 午: "亥", 未: "甲",
  申: "癸", 酉: "寅", 戌: "丙", 亥: "乙", 子: "巳", 丑: "庚",
};
/**
 * 月德貴人:月支三合局 → 干。核對〈論天月德〉:申子辰壬、亥卯未甲、寅午戌丙、巳酉丑庚,與原文一致。
 */
const YUEDE: Record<string, string> = { 寅午戌: "丙", 申子辰: "壬", 亥卯未: "甲", 巳酉丑: "庚" };
/**
 * 紅鸞:年支 → 支(子卯、丑寅…逆數);天喜 = 紅鸞對沖。
 * 核對:〈論天月德〉等頁查無紅鸞;原文另有「天喜神:春戊夏丑秋辰冬未」(以季論),與通行「紅鸞對沖」法不同。
 * 無法以原文驗證,沿用通行表,屬流派差異。
 */
const HONGLUAN: Record<Dizhi, Dizhi> = {
  子: "卯", 丑: "寅", 寅: "丑", 卯: "子", 辰: "亥", 巳: "戌",
  午: "酉", 未: "申", 申: "未", 酉: "午", 戌: "巳", 亥: "辰",
};
const DIZHI12: Dizhi[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const chong = (z: Dizhi): Dizhi => DIZHI12[(DIZHI12.indexOf(z) + 6) % 12]!;

export interface ShenShaContext {
  dayGan: Tiangan;
  monthZhi: Dizhi;
  yearZhi: Dizhi;
  dayZhi: Dizhi;
}

/**
 * 求某地支(某一柱)上坐落的神煞。以日干 + 月支 + 年支/日支(三合)+ 年支(孤寡)為依據。
 * 返回去重後的神煞名數組。
 */
export function shenShaForPillar(ctx: ShenShaContext, gan: string, zhi: Dizhi): string[] {
  const out = new Set<string>();

  // 日干派
  for (const { name, map } of GAN_SHENSHA) {
    if (map[ctx.dayGan]?.includes(zhi)) out.add(name);
  }

  // 三合派:以年支、日支為基準各取一遍
  for (const base of [ctx.yearZhi, ctx.dayZhi]) {
    const g = groupOf(base);
    if (!g) continue;
    for (const [name, target] of Object.entries(SANHE_SHENSHA[g]!)) {
      if (target === zhi) out.add(name);
    }
  }

  // 孤辰寡宿:以年支為基準
  const gg = GUGUA[ctx.yearZhi];
  if (gg) {
    if (gg.孤辰 === zhi) out.add("孤辰");
    if (gg.寡宿 === zhi) out.add("寡宿");
  }

  // 月支派:天德(干或支)、月德(干)
  const td = TIANDE[ctx.monthZhi];
  if (td === gan || td === zhi) out.add("天德贵人");
  const g = groupOf(ctx.monthZhi);
  if (g && YUEDE[g] === gan) out.add("月德贵人");

  // 年支派:紅鸞、天喜
  const hl = HONGLUAN[ctx.yearZhi];
  if (hl === zhi) out.add("红鸾");
  if (chong(hl) === zhi) out.add("天喜");

  return [...out];
}
