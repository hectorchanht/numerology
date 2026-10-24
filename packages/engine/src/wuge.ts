import { kangxiStrokes } from "@numerology/knowledge";
import { sancaiOf, type SancaiResult } from "./sancai.js";

/**
 * 姓名學·五格剖象引擎(純函數,確定性)。
 *
 * 口徑:
 * - 筆畫一律用康熙筆畫(knowledge 包 kRSUnicode 推算);簡體輸入請先轉繁體再調用。
 * - 五格:天格(單姓+1/複姓相加)、人格(姓末+名首)、地格(名相加,單名+1)、
 *   外格(總格-人格+1;單姓單名取 2)、總格(全加)。
 * - 81 數理:超過 81 減 80;吉凶用傳統八十一數吉凶表。
 * - 三才:天人地五行組合,125 格表見 sancai.ts。
 */

export type Wuxing5 = "木" | "火" | "土" | "金" | "水";
export type WugeLuck = "吉" | "半吉" | "半凶" | "凶";

export interface WugeChar {
  char: string;
  strokes: number;
}

export interface WugeGe {
  /** 格名:天格/人格/地格/外格/總格 */
  key: "tian" | "ren" | "di" | "wai" | "zong";
  strokes: number;
  wuxing: Wuxing5;
  /** 81 數理(1-81) */
  shuli: number;
  luck: WugeLuck;
  /** 數理名稱,如 旱苗逢雨 */
  shuliName: string;
  /** 一句解說 */
  text: string;
}

export interface WugeResult {
  surname: string;
  given: string;
  chars: WugeChar[];
  tian: WugeGe;
  ren: WugeGe;
  di: WugeGe;
  wai: WugeGe;
  zong: WugeGe;
  /** 三才:天格/人格/地格五行組合吉凶 */
  sancai: SancaiResult;
  /** 0-100;權重 天10/人30/地20/外5/總25/三才10(吉=1,半吉=0.6,半凶=0.3,凶=0) */
  score: number;
}

/** 筆畫尾數 → 五行:1/2木 3/4火 5/6土 7/8金 9/0水 */
export function wuxingOfStrokes(n: number): Wuxing5 {
  const r = n % 10;
  if (r === 1 || r === 2) return "木";
  if (r === 3 || r === 4) return "火";
  if (r === 5 || r === 6) return "土";
  if (r === 7 || r === 8) return "金";
  return "水";
}

/** 八十一數吉凶表:[數, 吉凶, 名稱, 一句解說] */
const SHULI_81: [number, WugeLuck, string, string][] = [
  [1, "吉", "太極之數", "太極生兩儀，草木逢春，萬事亨通"],
  [2, "凶", "兩儀之數", "混沌未定，進退宜守"],
  [3, "吉", "三才之數", "立身出世，吉祥如意"],
  [4, "凶", "四象之數", "日被雲遮，苦難折磨"],
  [5, "吉", "五行之數", "福祿長壽，福祉無窮"],
  [6, "吉", "六爻之數", "安穩餘慶，吉人天相"],
  [7, "吉", "七政之數", "剛毅果斷，勇往直前"],
  [8, "吉", "八卦之數", "意志堅剛，勤勉發展"],
  [9, "凶", "大成之數", "縱有大才，難望成功"],
  [10, "凶", "終焉之數", "烏雲遮月，空費心力"],
  [11, "吉", "旱苗逢雨", "挽回家運，順利發展"],
  [12, "凶", "掘井無泉", "無理之數，發展薄弱"],
  [13, "吉", "智略超群", "智謀奇略，忍柔當事"],
  [14, "凶", "淪落天涯", "失意浮沉，困難重重"],
  [15, "吉", "福壽", "慈祥有德，晦而轉明"],
  [16, "吉", "貴人得助", "貴人扶持，天惠吉慶"],
  [17, "吉", "剛柔兼備", "突破萬難，剛柔並濟"],
  [18, "吉", "有志竟成", "有志竟成，內外有運"],
  [19, "凶", "多難", "風雲蔽日，辛苦重來"],
  [20, "凶", "破滅", "非業破運，空虛寂寞"],
  [21, "吉", "明月中天", "光風霽月，萬物確立"],
  [22, "凶", "秋草逢霜", "秋草逢霜，懷才不遇"],
  [23, "吉", "旭日東昇", "旭日東昇，名顯四方"],
  [24, "吉", "家門餘慶", "家門餘慶，錢財豐盈"],
  [25, "吉", "資性英敏", "資性英敏，才能奇特"],
  [26, "凶", "變怪", "波瀾起伏，千變萬化"],
  [27, "半吉", "欲望無止", "自我心重，易受抨擊"],
  [28, "凶", "闊水浮萍", "遭難之數，豪傑氣概"],
  [29, "吉", "不露鋒芒", "財力歸集，名聞海內"],
  [30, "半吉", "一成一敗", "吉凶參半，得失相伴"],
  [31, "吉", "智勇得志", "智仁勇全，意志堅固"],
  [32, "吉", "寶馬金鞍", "僥倖多望，貴人得助"],
  [33, "吉", "旭日升天", "家門隆昌，才德開展"],
  [34, "凶", "破家", "破家亡身，財命危險"],
  [35, "吉", "高樓望月", "溫和平靜，智達通暢"],
  [36, "凶", "波瀾重疊", "波瀾重疊，常陷窮困"],
  [37, "吉", "慈祥忠順", "逢凶化吉，吉人天相"],
  [38, "半吉", "磨鐵成針", "意志薄弱，刻意經營"],
  [39, "吉", "富貴榮華", "富貴榮華，財帛豐盈"],
  [40, "凶", "退安", "智謀膽力，冒險投機"],
  [41, "吉", "德望高大", "德望高大，名利雙收"],
  [42, "凶", "寒蟬在柳", "博識多能，時運不濟"],
  [43, "凶", "散財", "雨夜之花，外祥內苦"],
  [44, "凶", "煩悶", "鬚眉難展，力量有限"],
  [45, "吉", "順風揚帆", "新生泰和，順風揚帆"],
  [46, "凶", "浪裡淘金", "載寶沉舟，浪裡淘金"],
  [47, "吉", "點鐵成金", "花開之象，點鐵成金"],
  [48, "吉", "青松立鶴", "青松立鶴，德智兼備"],
  [49, "凶", "轉變", "吉凶互見，一成一敗"],
  [50, "半吉", "小舟入海", "一盛一衰，浮沉不常"],
  [51, "半吉", "沉浮", "盛衰交加，壞劫半吉"],
  [52, "吉", "達眼獨步", "卓識達眼，先見之明"],
  [53, "凶", "曲捲難星", "外祥內患，前途堪憂"],
  [54, "凶", "石上栽花", "石上栽花，難得有運"],
  [55, "凶", "善惡", "外美內苦，和順不實"],
  [56, "凶", "浪裡行舟", "歷盡艱辛，四周障礙"],
  [57, "吉", "寒雪青松", "寒雪青松，夜鶯之象"],
  [58, "半吉", "晚行遇月", "遇事猶豫，信念不堅"],
  [59, "凶", "寒蟬悲風", "寒蟬悲風，意志衰退"],
  [60, "凶", "無謀", "無謀之數，漂泊不定"],
  [61, "吉", "牡丹芙蓉", "牡丹芙蓉，名利雙收"],
  [62, "凶", "衰敗", "衰敗之象，徒勞無功"],
  [63, "吉", "舟歸平海", "富貴榮華，身心安泰"],
  [64, "凶", "非命", "骨肉分離，孤獨悲愁"],
  [65, "吉", "富貴長壽", "富貴長壽，福祉無窮"],
  [66, "凶", "黑夜長空", "黑夜長空，進退維谷"],
  [67, "吉", "通達大道", "敏銳察世，通達大道"],
  [68, "吉", "順風吹帆", "順風吹帆，智謀奮進"],
  [69, "凶", "非業", "非業之數，難享其成"],
  [70, "凶", "殘菊逢霜", "殘菊逢霜，寂寞無助"],
  [71, "半吉", "石上金花", "石上金花，乏耐久力"],
  [72, "凶", "勞而無功", "勞而無功，徒費心力"],
  [73, "半吉", "無勇無謀", "志高力微，乏實行力"],
  [74, "凶", "殘菊經霜", "殘菊經霜，秋葉寂寞"],
  [75, "半吉", "退守", "退守保吉，吉中帶凶"],
  [76, "凶", "傾覆", "傾覆之數，乏獨立力"],
  [77, "半吉", "家庭有悅", "家庭有悅，半吉半凶"],
  [78, "半吉", "前進不知", "前進不息，先苦後甘"],
  [79, "凶", "雲頭望月", "雲頭望月，身疲力盡"],
  [80, "凶", "遁吉", "遁吉之數，空虛寂寞"],
  [81, "吉", "還本歸元", "還本歸元，大吉大利"],
];

const SHULI_MAP = new Map(SHULI_81.map(([n, luck, name, text]) => [n, { luck, name, text }]));

/** 筆畫數 → 81 數理(超過 81 減 80) */
export function shuliOf(strokes: number): number {
  return strokes > 81 ? strokes - 80 : strokes;
}

export function shuliInfo(strokes: number): { shuli: number; luck: WugeLuck; name: string; text: string } {
  const n = shuliOf(strokes);
  const info = SHULI_MAP.get(n)!;
  return { shuli: n, luck: info.luck, name: info.name, text: info.text };
}

function makeGe(
  key: WugeGe["key"],
  strokes: number,
): WugeGe {
  const info = shuliInfo(strokes);
  return {
    key,
    strokes,
    wuxing: wuxingOfStrokes(strokes),
    shuli: info.shuli,
    luck: info.luck,
    shuliName: info.name,
    text: info.text,
  };
}

const LUCK_SCORE: Record<WugeLuck, number> = { 吉: 1, 半吉: 0.6, 半凶: 0.3, 凶: 0 };

/**
 * 五格剖象:姓(1-2字) + 名(1-2字),須為繁體(簡體請先轉換)。
 * 查無筆畫的字會拋錯,列明邊隻字。
 */
export function analyzeName(surname: string, given: string): WugeResult {
  const s = [...surname.trim()];
  const g = [...given.trim()];
  if (s.length < 1 || s.length > 2) throw new Error(`姓氏須為一至二字(收到「${surname}」)`);
  if (g.length < 1 || g.length > 2) throw new Error(`名字須為一至二字(收到「${given}」)`);

  const chars: WugeChar[] = [];
  for (const ch of [...s, ...g]) {
    const st = kangxiStrokes(ch);
    if (st === undefined) throw new Error(`查無「${ch}」字康熙筆畫,未能評分`);
    chars.push({ char: ch, strokes: st });
  }
  const ss = s.map((_, i) => chars[i]!.strokes);
  const gs = g.map((_, i) => chars[s.length + i]!.strokes);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const tianStrokes = s.length === 1 ? ss[0]! + 1 : sum(ss);
  const renStrokes = ss[ss.length - 1]! + gs[0]!;
  const diStrokes = g.length === 1 ? gs[0]! + 1 : sum(gs);
  const zongStrokes = sum(ss) + sum(gs);
  const waiStrokes = s.length === 1 && g.length === 1 ? 2 : zongStrokes - renStrokes + 1;

  const tian = makeGe("tian", tianStrokes);
  const ren = makeGe("ren", renStrokes);
  const di = makeGe("di", diStrokes);
  const wai = makeGe("wai", waiStrokes);
  const zong = makeGe("zong", zongStrokes);

  const sancai = sancaiOf(tian.wuxing, ren.wuxing, di.wuxing);

  // 權重合計 100:天10/人30/地20/外5/總25/三才10。
  const score = Math.round(
    10 * LUCK_SCORE[tian.luck] +
    30 * LUCK_SCORE[ren.luck] +
    20 * LUCK_SCORE[di.luck] +
    5 * LUCK_SCORE[wai.luck] +
    25 * LUCK_SCORE[zong.luck] +
    10 * LUCK_SCORE[sancai.luck],
  );

  return { surname: s.join(""), given: g.join(""), chars, tian, ren, di, wai, zong, sancai, score };
}
