import { Solar } from "lunar-javascript";
import { HELUO_CLASSES } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import type { HeluoResult } from "./heluo.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface HeluoClasses {
  /** 天數強弱(至弱/不足/足);超過 25 未入表為 null */
  heaven: string | null;
  /** 地數強弱;13–17、31 以上為 null(原文未歸屬) */
  earth: string | null;
  /** 陽太過、陰太過(已扣除時令不忌) */
  excess: string[];
  /** 數已太過,但生於不忌之時 */
  exempt: string[];
  /** 卷一 pp. 69–74 格局名 */
  patterns: string[];
  /** 元堂爻位等第:1 = 五爻,2 = 二爻,3 = 三、四爻,4 = 初、上爻 */
  lineRank: number;
  /** 元堂有應(有援):元堂爻同應爻一陰一陽 */
  youyuan: boolean;
}

type Range = (number | null)[];
const inR = (v: number, r: Range) =>
  r.length === 2 ? (r[0] == null || v >= r[0]) && (r[1] == null || v <= r[1]) : r.includes(v);
const label = (v: number, t: Record<string, [number, number]>) =>
  Object.entries(t).find(([, r]) => inR(v, r))?.[0] ?? null;
const RANK: Record<number, number> = { 5: 1, 2: 2, 3: 3, 4: 3, 1: 4, 6: 4 };

/**
 * 天地數分類(卷一論篇):用未化簡的天數、地數。
 * 太過不忌之時按本站讀法:「三、四月」取節月辰、巳;「立冬至冬至前」取亥月及子月冬至前。
 */
export function heluoClasses(r: HeluoResult, input: BirthInput): HeluoClasses {
  const C = HELUO_CLASSES;
  const { heaven: H, earth: E } = r;
  const t = resolveBirthDateTime(input);
  const lunar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0).getLunar();
  const mb = r.pillars[1][1]!;
  const exemptH = mb === "辰" || mb === "巳";
  const exemptE = mb === "亥" || (mb === "子" && lunar.getPrevJieQi().getName() === "大雪");

  const over: [string, boolean][] = [];
  if (inR(H, C.excess.heaven["陽太過"] as Range)) over.push(["陽太過", exemptH]);
  if (inR(E, C.excess.earth["陰太過"] as Range)) over.push(["陰太過", exemptE]);

  let patterns = C.patterns.items.filter((p) => inR(H, p.heaven) && inR(E, p.earth)).map((p) => p.name);
  // 孤陽自耦同孤陽不耦重疊,原文取自耦
  if (patterns.includes("孤陽自耦")) patterns = patterns.filter((p) => p !== "孤陽不耦");

  const y = r.yuantang;
  const bits = r.xiantian.bits;
  return {
    heaven: label(H, C.strength.heaven),
    earth: label(E, C.strength.earth),
    excess: over.filter(([, ex]) => !ex).map(([n]) => n),
    exempt: over.filter(([, ex]) => ex).map(([n]) => n),
    patterns,
    lineRank: RANK[y]!,
    youyuan: bits[y - 1] !== bits[((y + 2) % 6)],
  };
}
