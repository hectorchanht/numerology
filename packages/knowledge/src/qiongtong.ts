import {
  isDizhi,
  isTiangan,
  type Dizhi,
  type Tiangan,
  type TiaohouTable,
} from "./types.js";
import QIONGTONG_TABLE from "./qiongtong.data.js";

/**
 * 調候用神查詢結果。
 * - `useGods`: 調候用神,按重要性排序,首位為最急用神。
 * - `reviewed`: 該數據是否經人工校對(來自數據文件 meta)。false 時解讀層應標註或降權。
 */
export interface TiaohouResult {
  dayGan: Tiangan;
  monthBranch: Dizhi;
  useGods: Tiangan[];
  reviewed: boolean;
}

/**
 * 在調候表中查詢某日干生於某月支的調候用神。純函數,平台無關。
 * @throws 當日干 / 月支不合法,或表中缺失對應條目時拋錯(快速失敗,不靜默返回空)。
 */
export function lookupTiaohou(
  table: TiaohouTable,
  dayGan: string,
  monthBranch: string,
): TiaohouResult {
  if (!isTiangan(dayGan)) {
    throw new Error(`非法日干: "${dayGan}",应为十天干之一`);
  }
  if (!isDizhi(monthBranch)) {
    throw new Error(`非法月支: "${monthBranch}",应为十二地支之一`);
  }
  const byMonth = table.data[dayGan];
  const useGods = byMonth?.[monthBranch];
  if (!useGods || useGods.length === 0) {
    throw new Error(`调候表缺失条目: ${dayGan}日 生 ${monthBranch}月`);
  }
  return {
    dayGan,
    monthBranch,
    useGods: [...useGods],
    reviewed: table.meta.reviewed,
  };
}

/**
 * 加載調候表。數據已內聯為 TS 模塊(qiongtong.data.ts)隨包打包,
 * 故平台無關——Node、Vercel serverless、瀏覽器、小程序均可用,無運行時 fs 依賴。
 */
export function loadQiongtongTable(): TiaohouTable {
  return QIONGTONG_TABLE;
}
