import { Solar } from "lunar-javascript";
import {
  allHexagrams, HELUO_BRANCH_NUMBER, HELUO_DAYUN, HELUO_FIVE, HELUO_HUAGONG, HELUO_LUOSHU_TRIGRAM, HELUO_PURE_ORDER,
  HELUO_STEM_NUMBER, HELUO_UPPER_ANCHOR, HELUO_YUANQI, HELUO_ZHIZUN, TIANGAN, DIZHI,
  type Cite, type TrigramName,
} from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface HeluoHex {
  number: number;
  name: string;
  /** 由下而上,1 = 陽 */
  bits: number[];
}

export interface HeluoYun {
  phase: "先天" | "後天";
  /** 第幾爻(1–6) */
  line: number;
  yang: boolean;
  /** 虛歲起訖 */
  fromAge: number;
  toAge: number;
}

export interface HeluoYear {
  /** 虛歲 */
  age: number;
  /** 干支年(立春分界)的公曆年 */
  year: number;
  hex: HeluoHex;
  /** 當年所坐之爻 */
  line: number;
}

export interface HeluoResult {
  pillars: [string, string, string, string];
  heaven: number;
  earth: number;
  heavenNumber: number;
  earthNumber: number;
  heavenTrigram: TrigramName;
  earthTrigram: TrigramName;
  yuan: "上元" | "中元" | "下元";
  xiantian: HeluoHex;
  yuantang: number;
  houtian: HeluoHex;
  houtianYuantang: number;
  /** 後天由第幾歲起(虛歲) */
  houtianAge: number;
  yuanqi: { stem: TrigramName; branch: TrigramName; tian: boolean; di: boolean; reversed: boolean };
  huagong: { trigrams: TrigramName[]; has: boolean; reversed: boolean };
  dayun: HeluoYun[];
  /** 小象流年:每個大運爻內逐年游變之卦 */
  liunian: HeluoYear[];
  steps: string[];
  tier: "classical";
  cite: Cite;
}

const TRI: Record<TrigramName, number[]> = {
  乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
/** 先天對宮(元氣相反、化工反) */
const OPP: Record<TrigramName, TrigramName> = { 乾: "坤", 坤: "乾", 艮: "兌", 兌: "艮", 坎: "離", 離: "坎", 震: "巽", 巽: "震" };
const triOf = (bits: number[]) => (Object.keys(TRI) as TrigramName[]).find((k) => TRI[k].join("") === bits.join(""))!;
const hexOf = (bits: number[]): HeluoHex => {
  const h = allHexagrams().find((x) => x.bits.join("") === bits.join(""))!;
  return { number: h.number, name: h.name, bits };
};
const BRANCH = "子丑寅卯辰巳午未申酉戌亥";
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** 遇十不用:超過基數減基數;10、20、30 取 1、2、3,其餘取個位。 */
export function heluoReduce(sum: number, base: number): number {
  const n = sum > base ? sum - base : sum;
  return n % 10 === 0 ? n / 10 : n % 10;
}

const flip = (bits: number[], line: number) => bits.map((b, i) => (i + 1 === line ? 1 - b : b));
/** 由第 line 爻往上數 k 位(循環) */
const up = (line: number, k: number) => ((line - 1 + k) % 6) + 1;

/**
 * 小象流年(卷一 pp. 37–38):陰爻六年,由本爻起逐年變一爻向上;
 * 陽爻九年,本爻一年(陽年不變、陰年即變)、應爻一年、本爻一年,再由上一爻起逐年變六爻。
 */
export function heluoYears(bits: number[], line: number, yangYear: boolean): { bits: number[]; line: number }[] {
  const out: { bits: number[]; line: number }[] = [];
  let b = bits;
  const step = (l: number) => out.push({ bits: (b = flip(b, l)), line: l });
  if (bits[line - 1] === 0) {
    for (let k = 0; k < 6; k++) step(up(line, k));
    return out;
  }
  if (yangYear) out.push({ bits: b, line });
  else step(line);
  step(up(line, 3));
  step(line);
  for (let k = 1; k <= 6; k++) step(up(line, k));
  return out;
}

/**
 * 月卦(卷一 p. 39):流年卦元堂上進一位變爻為正月,單月逐月再上進一位;
 * 雙月取前一單月卦之應爻變之。回傳正月至十二月(節月)。
 */
export function heluoMonths(bits: number[], line: number): { bits: number[]; line: number }[] {
  const out: { bits: number[]; line: number }[] = [];
  let b = bits;
  for (let k = 1; k <= 6; k++) {
    const l = up(line, k);
    b = flip(b, l);
    out.push({ bits: b, line: l }, { bits: flip(b, up(l, 3)), line: up(l, 3) });
  }
  return out;
}

/**
 * 日卦(卷一 p. 40):月卦本爻不變,其餘五爻由上一位起各變一卦,
 * 每卦由初爻至上爻一爻管一日,五卦共三十日,由交節時刻起算。
 */
export function heluoDays(bits: number[], line: number): { bits: number[]; line: number }[] {
  const out: { bits: number[]; line: number }[] = [];
  for (let k = 1; k <= 5; k++) {
    const b = flip(bits, up(line, k));
    for (let d = 1; d <= 6; d++) out.push({ bits: b, line: d });
  }
  return out;
}

/** 元堂:按時辰陰陽數同性爻(由下而上),一二重而寄、三重不寄、四五不重而寄。 */
function yuantangOf(bits: number[], branchIdx: number, pure: "順" | "逆"): number {
  const yangHour = branchIdx < 6;
  const k = branchIdx % 6;
  if (bits.every((b) => b === bits[0])) return HELUO_PURE_ORDER[pure][yangHour ? "陽" : "陰"][k]!;
  const L: number[] = [], O: number[] = [];
  bits.forEach((b, i) => (b === (yangHour ? 1 : 0) ? L : O).push(i + 1));
  const seq = [[], [L[0]!, L[0]!, ...O.slice(0, 4)], [...L, ...L, ...O.slice(0, 2)], [...L, ...L], [...L, ...O.slice(0, 2)], [...L, ...O.slice(0, 1)]][L.length]!;
  return seq[k]!;
}

/** 收集前後三年嘅節氣(簡體鍵,lunar-javascript 原樣)。 */
function terms(year: number): { name: string; ms: number }[] {
  const out = new Map<number, string>();
  for (const y of [year - 1, year, year + 1]) {
    const table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
    for (const [name, s] of Object.entries(table)) {
      if (!/^[一-鿿]+$/.test(name)) continue;
      out.set(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute()), name);
    }
  }
  return [...out].map(([ms, name]) => ({ name, ms })).sort((a, b) => a.ms - b.ms);
}

/**
 * 河洛理數(陳摶、邵雍題):八字干支取天地數 → 先天卦 → 時辰定元堂 → 換後天卦;
 * 元氣看生年、化工看生月節氣;大運由元堂起陽爻九年、陰爻六年。
 * 時辰用真太陽時(有經度時),與八字時柱一致。
 */
export function castHeluo(input: BirthInput): HeluoResult {
  const t = resolveBirthDateTime(input);
  const ec = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0).getLunar().getEightChar();
  const pillars = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()] as [string, string, string, string];
  const male = input.gender === "男";
  const yangYear = "甲丙戊庚壬".includes(pillars[0][0]!);

  let heaven = 0, earth = 0;
  for (const [g, z] of pillars) for (const v of [HELUO_STEM_NUMBER[g!]!, ...HELUO_BRANCH_NUMBER[z!]!]) v % 2 ? (heaven += v) : (earth += v);
  const heavenNumber = heluoReduce(heaven, 25), earthNumber = heluoReduce(earth, 30);

  // 干支年(立春分界)定三元
  const gzYear = TIANGAN[mod(t.year - 4, 10)]! + DIZHI[mod(t.year - 4, 12)]! === pillars[0] ? t.year : t.year - 1;
  const yuanIdx = Math.floor(mod(gzYear - HELUO_UPPER_ANCHOR, 180) / 60);
  const yuan = (["上元", "中元", "下元"] as const)[yuanIdx]!;
  const five = (): TrigramName => {
    if (yuanIdx === 0) return male ? HELUO_FIVE.upper.male : HELUO_FIVE.upper.female;
    if (yuanIdx === 2) return male ? HELUO_FIVE.lower.male : HELUO_FIVE.lower.female;
    return yangYear === male ? HELUO_FIVE.middle.yangMale : HELUO_FIVE.middle.yinMale;
  };
  const trigramOf = (n: number) => (n === 5 ? five() : HELUO_LUOSHU_TRIGRAM[String(n)]!);
  const heavenTrigram = trigramOf(heavenNumber), earthTrigram = trigramOf(earthNumber);

  const heavenUp = yangYear === male;
  const bits = heavenUp ? [...TRI[earthTrigram], ...TRI[heavenTrigram]] : [...TRI[heavenTrigram], ...TRI[earthTrigram]];
  const xiantian = hexOf(bits);

  // 節氣:冬至後夏至前 = 陽令
  const birthMs = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  const ts = terms(t.year);
  const last = (names: string[]) => [...ts].reverse().find((x) => x.ms <= birthMs && names.includes(x.name))!;
  const yangSeason = last(["冬至", "夏至"]).name === "冬至";
  // 純卦:乾女冬至後夏至前、坤男夏至後冬至前由上而下,其餘由下而上
  const allYang = bits.every((b) => b === 1), allYin = bits.every((b) => b === 0);
  const pure: "順" | "逆" = (allYang && !male && yangSeason) || (allYin && male && !yangSeason) ? "逆" : "順";

  const branchIdx = BRANCH.indexOf(pillars[3][1]!);
  const yuantang = yuantangOf(bits, branchIdx, pure);

  // 換後天:變元堂爻、內外互換;三至尊卦九五陰令 / 上六陽月只變不換
  const flipped = bits.map((b, i) => (i + 1 === yuantang ? 1 - b : b));
  const noSwap = HELUO_ZHIZUN.includes(xiantian.name) && ((yuantang === 5 && !yangSeason) || (yuantang === 6 && yangSeason));
  const houBits = noSwap ? flipped : [...flipped.slice(3), ...flipped.slice(0, 3)];
  const houtian = hexOf(houBits);
  const houtianYuantang = noSwap ? yuantang : yuantang > 3 ? yuantang - 3 : yuantang + 3;

  const dayun: HeluoYun[] = [];
  let age = 1;
  for (const [phase, b, start] of [["先天", bits, yuantang], ["後天", houBits, houtianYuantang]] as const) {
    for (let k = 0; k < 6; k++) {
      const line = ((start - 1 + k) % 6) + 1;
      const yang = b[line - 1] === 1;
      const n = yang ? HELUO_DAYUN.yang : HELUO_DAYUN.yin;
      dayun.push({ phase, line, yang, fromAge: age, toAge: age + n - 1 });
      age += n;
    }
  }
  const houtianAge = dayun[6]!.fromAge;

  const liunian: HeluoYear[] = dayun.flatMap((y) => {
    const year = gzYear + y.fromAge - 1;
    return heluoYears(y.phase === "先天" ? bits : houBits, y.line, mod(year - 4, 2) === 0)
      .map((x, i) => ({ age: y.fromAge + i, year: year + i, hex: hexOf(x.bits), line: x.line }));
  });

  // 元氣:生年干支
  const [ys, yb] = [pillars[0][0]!, pillars[0][1]!];
  const both = [bits.slice(0, 3), bits.slice(3), houBits.slice(0, 3), houBits.slice(3)].map(triOf);
  const stem = HELUO_YUANQI.stems[ys]!, branch = HELUO_YUANQI.branches[yb]!;
  const yuanqi = {
    stem, branch, tian: both.includes(stem), di: both.includes(branch),
    reversed: both.includes(OPP[stem]) || both.includes(OPP[branch]),
  };

  // 化工:四正節氣段;四立前十八日為坤艮土旺
  const next4 = ts.find((x) => x.ms > birthMs && ["立春", "立夏", "立秋", "立冬"].includes(x.name))!;
  const earthDays = next4.ms - birthMs <= 18 * 86400000;
  const period = HELUO_HUAGONG.periods.find((p) => p.from === last(["冬至", "春分", "夏至", "秋分"]).name)!;
  const hg = earthDays ? HELUO_HUAGONG.earth.trigrams : [period.trigram];
  const hgRev = earthDays ? HELUO_HUAGONG.earth.reverse : [period.reverse];
  const huagong = { trigrams: hg, has: hg.some((x) => both.includes(x)), reversed: hgRev.some((x) => both.includes(x)) };

  const steps = [
    `八字 ${pillars.join(" ")}:天干取洛書數、地支取河圖生成數,單數合為天數 ${heaven},雙數合為地數 ${earth}。`,
    `天數 ${heaven}${heaven > 25 ? " 減 25" : ""}、地數 ${earth}${earth > 30 ? " 減 30" : ""},遇十不用 → 天 ${heavenNumber}、地 ${earthNumber}。`,
    heavenNumber === 5 || earthNumber === 5
      ? `得五寄宮:${gzYear} 年屬${yuan},${yangYear ? "陽" : "陰"}${male ? "男" : "女"}取 ${five()}。`
      : `洛書配卦:天 ${heavenNumber} 為 ${heavenTrigram}、地 ${earthNumber} 為 ${earthTrigram}。`,
    `${yangYear ? "陽" : "陰"}${male ? "男" : "女"}:天數卦在${heavenUp ? "上" : "下"},盪成先天 ${xiantian.name} 卦。`,
    `${pillars[3][1]}時屬${branchIdx < 6 ? "陽" : "陰"}時,數${branchIdx < 6 ? "陽" : "陰"}爻${allYang || allYin ? `(純卦,${pure === "順" ? "由下而上" : "由上而下"})` : ""},元堂在第 ${yuantang} 爻。`,
    noSwap
      ? `${xiantian.name}為三至尊卦,元堂在${yuantang === 5 ? "九五、生於陰令" : "上六、生於陽月"},只變爻不換內外,後天 ${houtian.name},元堂仍在第 ${houtianYuantang} 爻。`
      : `元堂爻變、內外互換,後天 ${houtian.name},元堂移至第 ${houtianYuantang} 爻。`,
    `大運由元堂起陽爻九年、陰爻六年:先天行至 ${houtianAge - 1} 歲,${houtianAge} 歲換後天。`,
    "流年用小象:陰爻六年逐年由本爻向上各變一爻;陽爻九年,本爻(陽年不變、陰年即變)、應爻、本爻各一年,再向上逐爻變六年。",
    `元氣:年干 ${ys} 屬 ${stem}、年支 ${yb} 屬 ${branch};先後天卦${yuanqi.tian || yuanqi.di ? `有${[yuanqi.tian && "天元氣", yuanqi.di && "地元氣"].filter(Boolean).join("、")}` : "無元氣"}${yuanqi.reversed ? ",且逢元氣相反之卦" : ""}。`,
    `化工:生於${earthDays ? `${next4.name}前十八日土旺` : `${period.from}後${period.to}前`},化工屬 ${hg.join("、")};先後天卦${huagong.has ? "有化工" : "無化工"}${huagong.reversed ? ",且逢化工反" : ""}。`,
  ];

  return {
    pillars, heaven, earth, heavenNumber, earthNumber, heavenTrigram, earthTrigram, yuan,
    xiantian, yuantang, houtian, houtianYuantang, houtianAge, yuanqi, huagong, dayun, liunian, steps,
    tier: "classical",
    cite: { work: "河洛理數", author: "題陳摶、邵雍", year: 1632, locator: "卷一起例(陳仁錫刻本,文明書局石印)" },
  };
}
