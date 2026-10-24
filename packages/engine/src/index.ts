import { DEPENDENCY_VERSIONS } from "./versions.generated.js";
import { castBazi } from "./bazi.js";
import { castZiwei } from "./ziwei.js";
import { validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";
import type { ChartResult, BirthInput } from "./types.js";

export * from "./types.js";
export { castBazi } from "./bazi.js";
export { castZiwei, computeSanFangSiZheng } from "./ziwei.js";
export { hourToTimeIndex, validateBirthInput, daysInMonth } from "./time.js";
export { shiShen, shiShenOf, dizhiHideGan, type ShiShen } from "./shishen.js";
export { changSheng, changShengOf, CHANGSHENG_STAGES, type ChangSheng } from "./changsheng.js";
export { shenShaForBranch, type ShenShaContext } from "./shensha.js";
export {
  resolveBirthDateTime,
  favorableDirections,
  type SolarTimeCorrection,
  type ResolvedDateTime,
  type FavorableDirection,
} from "./solartime.js";
export { analyzeFortune } from "./fortune.js";
export { castHourCandidates, type HourInferInput, type HourCandidate } from "./hourinfer.js";
export { solarFromLunar, type LunarDate, type SolarDate } from "./calendar.js";
export { tossCoins, castYijing, divine, trigramOfBits, type CoinLine, type CastResult, type TrigramKey } from "./yijing.js";
export {
  timeNumbers, guaFromNumbers, castMeihua,
  type MeihuaNumbers, type MeihuaResult, type MeihuaVerdict, type VerdictLevel,
} from "./meihua.js";
export {
  paigua, ganzhiForDate, palaceOf, qinOf, beastOf, xunKong, chong,
  type YaoValue, type Qin, type PalaceInfo, type LiuyaoYao, type LiuyaoResult,
} from "./liuyao.js";
export type {
  FortuneAnalysis,
  DaYunAnalysis,
  LiuNianAnalysis,
  ZiweiScopeFortune,
  Sihua,
  SihuaType,
} from "./fortune.js";

/**
 * 读依赖版本,仅作元信息展示。
 * 版本号由构建时脚本 scripts/gen-versions.mjs 注入 src/versions.generated.ts,
 * 运行时只做查表 —— Edge/Workers 没有 node:module(createRequire),不能在运行时
 * 读依赖的 package.json。查不到就降级为 "unknown",绝不影响确定性排盘本身。
 */
function depVersion(name: string): string {
  return DEPENDENCY_VERSIONS[name] ?? "unknown";
}

/**
 * 一次排出同一出生信息的【八字 + 紫微】双盘,返回标准命盘 JSON。
 * 这是引擎对外的主入口。纯确定性,无网络、无 AI。
 */
export function castChart(input: BirthInput): ChartResult {
  validateBirthInput(input);
  const { correction } = resolveBirthDateTime(input);
  return {
    input,
    meta: {
      trueSolarTimeApplied: correction.applied,
      correction,
      engine: {
        iztro: depVersion("iztro"),
        lunar: depVersion("lunar-javascript"),
      },
    },
    bazi: castBazi(input),
    ziwei: castZiwei(input),
  };
}

export {
  analyzeName,
  wuxingOfStrokes,
  shuliOf,
  shuliInfo,
  type Wuxing5,
  type WugeLuck,
  type WugeChar,
  type WugeGe,
  type WugeResult,
} from "./wuge.js";

export {
  castQimen,
  isWuBuYuShi,
  type QimenInput,
  type QimenPalace,
  type QimenResult,
} from "./qimen.js";

export {
  castFeixing,
  type FeixingGua,
  type FeixingInput,
  type FeixingPalace,
  type FeixingResult,
  type StarState,
} from "./feixing.js";

export {
  sancaiOf,
  sancaiSize,
  type SancaiResult,
} from "./sancai.js";
