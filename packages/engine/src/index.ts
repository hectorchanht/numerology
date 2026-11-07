import { DEPENDENCY_VERSIONS } from "./versions.generated.js";
import { castBazi } from "./bazi.js";
import { castZiwei } from "./ziwei.js";
import { castFuyi } from "./fuyi.js";
import { validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";
import type { ChartResult, BirthInput } from "./types.js";

export * from "./types.js";
export { castBazi } from "./bazi.js";
export { castZiwei, computeSanFangSiZheng } from "./ziwei.js";
export { hourToTimeIndex, validateBirthInput, daysInMonth } from "./time.js";
export { shiShen, shiShenOf, dizhiHideGan, type ShiShen } from "./shishen.js";
export { natalRelations, externalRelations, suiYunBingLin, tianKeDiChong, type PillarKey, type RelationKind, type GanzhiRelation } from "./relations.js";
export { changSheng, changShengOf, CHANGSHENG_STAGES, type ChangSheng } from "./changsheng.js";
export { shenShaForPillar, type ShenShaContext } from "./shensha.js";
export {
  resolveBirthDateTime,
  favorableDirections,
  type SolarTimeCorrection,
  type ResolvedDateTime,
  type FavorableDirection,
} from "./solartime.js";
export { detectZiweiGeju, type ZiweiGejuHit } from "./ziwei-geju.js";
export { castZiweiFeixing, findLuJiJiaoChi, type ZiweiFeixing } from "./ziwei-feixing.js";
export { castZiweiHoroscope, computeOverlaps, type ZiweiHoroscope, type ZiweiLayer, type ZiweiLayerKey, type ZiweiOverlap } from "./ziwei-horoscope.js";
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
 * 讀依賴版本,僅作元信息展示。
 * 版本號由構建時腳本 scripts/gen-versions.mjs 注入 src/versions.generated.ts,
 * 運行時只做查表 —— Edge/Workers 沒有 node:module(createRequire),不能在運行時
 * 讀依賴的 package.json。查不到就降級為 "unknown",絕不影響確定性排盤本身。
 */
function depVersion(name: string): string {
  return DEPENDENCY_VERSIONS[name] ?? "unknown";
}

/**
 * 一次排出同一出生信息的【八字 + 紫微】雙盤,返回標準命盤 JSON。
 * 這是引擎對外的主入口。純確定性,無網絡、無 AI。
 */
export function castChart(input: BirthInput): ChartResult {
  validateBirthInput(input);
  const { correction } = resolveBirthDateTime(input);
  const chart: ChartResult = {
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
  if (castFuyi(chart).possibleCong) {
    chart.bazi.geju.possibleCong = true;
    chart.bazi.geju.steps.push("扶抑總分達 ±6,可能從格,格局僅供參考");
  }
  return chart;
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

export { castNineStar, type NineStarInfo, type NineStarResult } from "./ninestar.js";
export { reduceNumber, lifePath, hetuWuxing, type LifePathResult } from "./lifepath.js";
export { castKamea, type KameaMark, type KameaResult } from "./kamea.js";
export { castCrossSystem, wuxingRelation, type CrossSystemResult, type CrossSignal, type CrossSystemId, type Relation } from "./crosssystem.js";
export { castTaixuan, type TaixuanResult } from "./taixuan.js";
export { castMaya, type MayaResult } from "./maya.js";
export { castHuangji, type HuangjiResult } from "./huangji.js";
export { castPlanetaryHour, type PlanetaryHourResult } from "./planetaryhour.js";
export { castEphemeris, type EphemerisResult, type PlanetPosition, type AspectHit } from "./ephemeris.js";
export { castQizheng, qizhengMansionAt, type QizhengResult, type QizhengBody } from "./qizheng.js";
export { castHeluo, heluoReduce, heluoYears, heluoMonths, heluoDays, heluoJinsuo, heluoJinsuoLuck, heluoGuangxiang, type HeluoResult, type HeluoJinsuo, type JinsuoLuck, type JinsuoYun, type HeluoGuangxiang, type HeluoHex, type HeluoYun, type HeluoYear } from "./heluo.js";
export { heluoClasses, type HeluoClasses } from "./heluo-classes.js";
// web 不直接依賴 knowledge,瑪雅 tier 與日名表經此轉出。
export { MAYA_META, TZOLKIN_DAY_NAMES, LIUREN_METHODS } from "@numerology/knowledge";
// 學院科學專區的科學筆記亦經此轉出。
export { SCIENCE_NOTES, type ScienceNote } from "@numerology/knowledge";
export { castFuyi, type FuyiResult } from "./fuyi.js";
export { castGeju, type GejuResult } from "./geju.js";
export { castNumberLore, castBirthLore, classifyNumber, starLongitude, type NumberLoreResult, type NumberLoreItem, type NumberClass, type BirthLoreResult, type StarHit, type LoreSource } from "./lore.js";
export { castJyotish, castEgyptian, castMetonic, type JyotishResult, type Dasha, type EgyptianResult, type MetonicResult } from "./calendars.js";
export { castLiuren, castLiurenKe, liurenXun, liurenLiuqin, type LiurenResult, type LiurenKe } from "./liuren.js";
