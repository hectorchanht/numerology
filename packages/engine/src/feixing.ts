/**
 * 玄空飛星·宅命盤 v1(下卦)。純函數,確定性,零 AI。
 *
 * 口徑:
 * - 坐向取八卦(如坐坎向離);建造年份定元運(三元九運,1864 年起每 20 年一運)。
 * - 運盤:運星入中宮順飛;山盤:坐卦數入中,按坐卦陰陽順逆飛;
 *   向盤:向卦數入中,按向卦陰陽順逆飛。
 * - 後天八卦陰陽(飛星順逆用):乾陽、兌陰、離陰、震陽、巽陰、坎陽、艮陽、坤陰。
 * - 旺衰以當運論(簡化):當旺/生氣/退氣/死氣/平。
 * - 24 山、替卦、城門訣等留待 v2(v1 只做八卦坐向)。
 */

export type FeixingGua = "坎" | "坤" | "震" | "巽" | "乾" | "兌" | "艮" | "離";

export interface FeixingInput {
  /** 坐卦 */
  sit: FeixingGua;
  /** 建造/入伙年份(定元運) */
  builtYear: number;
}

export type StarState = "當旺" | "生氣" | "退氣" | "死氣" | "平";

export interface FeixingPalace {
  gong: number;
  gongName: string;
  /** 運星 */
  yun: number;
  /** 山星 */
  shan: number;
  /** 向星 */
  xiang: number;
  shanState: StarState;
  xiangState: StarState;
  /** 一句斷(旺丁/旺財/煞) */
  note: string;
}

export interface FeixingResult {
  input: FeixingInput;
  /** 元運 1-9 */
  yunNum: number;
  /** 向卦 */
  xiangGua: FeixingGua;
  /** 按宮號 1-9 排序 */
  palaces: FeixingPalace[];
}

const GUA_NUM: Record<FeixingGua, number> = {
  坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兌: 7, 艮: 8, 離: 9,
};
/** 後天八卦陰陽(玄空飛星順逆用) */
const GUA_YANG: Record<FeixingGua, boolean> = {
  乾: true, 兌: false, 離: false, 震: true,
  巽: false, 坎: true, 艮: true, 坤: false,
};
const DUI_GUA: Record<FeixingGua, FeixingGua> = {
  坎: "離", 離: "坎", 坤: "艮", 艮: "坤",
  震: "兌", 兌: "震", 巽: "乾", 乾: "巽",
};
const GONG_NAME: Record<number, string> = {
  1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兌", 8: "艮", 9: "離",
};

/** 飛星:star 入中宮,陽順陰逆,布九宮。回傳 宮號→星 */
function flyStar(star: number, yang: boolean): Record<number, number> {
  const order = [5, 6, 7, 8, 9, 1, 2, 3, 4];
  const out: Record<number, number> = {};
  let s = star;
  for (const gong of order) {
    out[gong] = s;
    s = yang ? (s % 9) + 1 : ((s + 7) % 9) + 1;
  }
  return out;
}

function starState(star: number, yun: number): StarState {
  const d = (((star - yun) % 9) + 9) % 9;
  if (d === 0) return "當旺";
  if (d === 1) return "生氣";
  if (d === 8) return "退氣";
  if (d === 6 || d === 7) return "死氣";
  return "平";
}

export function castFeixing(input: FeixingInput): FeixingResult {
  const yunNum = Math.min(9, Math.max(1, Math.floor((input.builtYear - 1864) / 20) + 1));
  const xiangGua = DUI_GUA[input.sit]!;
  const yunPan = flyStar(yunNum, true);
  const shanPan = flyStar(GUA_NUM[input.sit]!, GUA_YANG[input.sit]!);
  const xiangPan = flyStar(GUA_NUM[xiangGua]!, GUA_YANG[xiangGua]!);

  const palaces: FeixingPalace[] = [];
  for (let gong = 1; gong <= 9; gong++) {
    const yun = yunPan[gong]!;
    const shan = shanPan[gong]!;
    const xiang = xiangPan[gong]!;
    const shanState = starState(shan, yunNum);
    const xiangState = starState(xiang, yunNum);
    const notes: string[] = [];
    if (xiangState === "當旺") notes.push("旺財");
    else if (xiangState === "生氣") notes.push("財漸旺");
    if (shanState === "當旺") notes.push("旺丁");
    else if (shanState === "生氣") notes.push("丁漸旺");
    if ((xiang === 5 || xiang === 2) && xiangState !== "當旺" && xiangState !== "生氣") notes.push("煞宜化");
    if (shan === xiang && shanState === "當旺") notes.push("雙星會向");
    palaces.push({
      gong,
      gongName: GONG_NAME[gong]!,
      yun, shan, xiang,
      shanState, xiangState,
      note: notes.join("·") || "平",
    });
  }
  return { input, yunNum, xiangGua, palaces };
}
