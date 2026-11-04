import type { Dizhi, Tiangan, TiaohouResult } from "@numerology/knowledge";

export type Gender = "男" | "女";

/** 出生信息(公曆)。 */
export interface BirthInput {
  /** 公曆年(四位) */
  year: number;
  /** 公曆月 1-12 */
  month: number;
  /** 公曆日 1-31 */
  day: number;
  /** 24 小時制 0-23 */
  hour: number;
  /** 分鐘 0-59,默認 0 */
  minute?: number;
  gender: Gender;
  /**
   * 出生地經度(東經為正,如北京約 116.4)。
   * 預留給真太陽時校正;當前版本【尚未應用】,見 ChartMeta.trueSolarTimeApplied。
   */
  longitude?: number;
}

/** 單柱(年/月/日/時)。 */
export interface Pillar {
  gan: string;
  zhi: string;
  ganZhi: string;
  naYin: string;
  /** 天干十神(日柱為日主本身,留空) */
  shiShenGan: string;
  /** 地支藏干 */
  hideGan: string[];
  /** 地支藏干對應十神 */
  shiShenZhi: string[];
  /** 星運:日主在本柱地支的十二長生 */
  xingYun: string;
  /** 自坐:本柱天干在本柱地支的十二長生 */
  ziZuo: string;
  /** 空亡(旬空)地支,如「寅卯」 */
  xunKong: string;
  /** 本柱地支坐落的神煞 */
  shenSha: string[];
}

export interface DaYunStep {
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
}

/** 八字四柱命盤。 */
export interface BaziChart {
  fourPillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  /** 日主(日干) */
  dayMaster: Tiangan;
  /** 月支(用於調候) */
  monthBranch: Dizhi;
  dayWuXing: string;
  /** 調候用神(來自窮通寶鑑知識庫,含 reviewed 標記) */
  tiaohou: TiaohouResult;
  startLuck: { description: string; solarDate: string };
  daYun: DaYunStep[];
  lunarDate: string;
}

export interface ZiweiStar {
  name: string;
  brightness?: string;
  /** 四化:祿/權/科/忌,空串表示無 */
  mutagen?: string;
}

export interface ZiweiPalace {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isSoulPalace: boolean;
  isBodyPalace: boolean;
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  /** 雜曜(龍池鳳閣、三台八座、天刑、孤辰寡宿等) */
  adjectiveStars: ZiweiStar[];
  /** 大限範圍 [起, 止] 歲 */
  decadal: { range: [number, number]; heavenlyStem: string; earthlyBranch: string };
  /** 長生十二神(長生/沐浴/…) */
  changsheng12: string;
  /** 博士十二神(博士/力士/青龍/…) */
  boshi12: string;
  /** 將前十二神(將星/攀鞍/…) */
  jiangqian12: string;
  /** 歲前十二神(歲建/晦氣/…) */
  suiqian12: string;
  /** 小限對應的虛歲列表 */
  ages: number[];
}

/** 三方四正:本宮 + 對宮 + 兩三合宮 的合看。 */
export interface SanFangSiZheng {
  branches: { self: string; opposite: string; trine: [string, string] };
  palaceNames: { self: string; opposite: string; trine: [string, string] };
  /** 四宮合看的主星(去重) */
  majorStars: string[];
}

/** 紫微斗數命盤。 */
export interface ZiweiChart {
  /** 命宮地支 */
  soulPalaceBranch: string;
  /** 身宮地支 */
  bodyPalaceBranch: string;
  /** 五行局(如「水二局」) */
  fiveElementsClass: string;
  /** 命主 */
  soul: string;
  /** 身主 */
  body: string;
  sign: string;
  zodiac: string;
  lunarDate: string;
  chineseDate: string;
  palaces: ZiweiPalace[];
  /** 命宮三方四正(判斷格局的依據) */
  soulSanFang: SanFangSiZheng;
}

export interface ChartMeta {
  /** 真太陽時是否已校正(提供出生地經度則為 true)。 */
  trueSolarTimeApplied: boolean;
  /** 真太陽時校正詳情 */
  correction?: import("./solartime.js").SolarTimeCorrection;
  engine: { iztro: string; lunar: string };
}

/** 一次排盤的完整結果:同一出生信息的八字 + 紫微雙盤。 */
export interface ChartResult {
  input: BirthInput;
  meta: ChartMeta;
  bazi: BaziChart;
  ziwei: ZiweiChart;
}
