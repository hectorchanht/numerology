/**
 * lunar-javascript 不自帶 TS 類型,這裡只聲明 monorepo 用到的方法(最小面)。
 * 唯一來源:packages/ai 與 apps/web 經各自 tsconfig 的 include 共用此檔,唔好另寫一份。
 * 完整 API 見 https://6tail.cn/calendar/api.html
 */
declare module "lunar-javascript" {
  export class LunarYear {
    static fromYear(lunarYear: number): LunarYear;
    /** 閏月月份;無閏月 → 0 */
    getLeapMonth(): number;
  }
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
    toYmdHms(): string;
    static fromYmd(year: number, month: number, day: number): Solar;
    /** 以本地時區讀取 Date */
    static fromDate(date: Date): Solar;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
  }

  export interface NineStar {
    getNumber(): string;
    getColor(): string;
    getWuXing(): string;
    getPosition(): string;
    getPositionDesc(): string;
  }

  export class Lunar {
    /** month 為負數表示閏月(如 -2 = 閏二月) */
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getYearNineStar(): NineStar;
    getMonthNineStar(): NineStar;
    toString(): string;
    getYearInGanZhi(): string;
    /** 農曆年/月/日數字(月為負=閏月) */
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    /** 農曆月中文,如 "正" */
    getMonthInChinese(): string;
    /** 日宜,如 ["嫁娶","納采",…](簡體輸出,顯示層記得轉字形) */
    getDayYi(): string[];
    /** 日忌 */
    getDayJi(): string[];
    /** 日沖描述,如 "(甲子)鼠" */
    getDayChongDesc(): string;
    /** 日煞,如 "北" */
    getDaySha(): string;
    /** 日干支,如 "庚午" */
    getDayInGanZhiExact(): string;
    /** 13 個時辰(早子時起) */
    getTimes(): LunarTime[];
    /** 農曆年地支,如 "辰" */
    getYearZhi(): string;
    /** 生肖,如 "龍" */
    getYearShengXiao(): string;
    /** 上一個節氣(如立春/驚蟄等,含節) */
    getPrevJieQi(): JieQi;
    /**
     * 本農曆年節氣表(公曆時刻)。鍵含中文名與拼音大寫:
     * "冬至" = 上一個冬至(前一公曆年 12 月),"DONG_ZHI" = 本年 12 月冬至。
     */
    getJieQiTable(): Record<string, Solar>;
  }

  export class LunarTime {
    toString(): string;
    getYi(): string[];
    getJi(): string[];
  }

  export class JieQi {
    /** 節氣名,如 "寒露" */
    getName(): string;
    /** 節氣交接時刻(公曆) */
    getSolar(): Solar;
  }

  export class EightChar {
    setSect(sect: number): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearXunKong(): string;
    getMonthXunKong(): string;
    getDayXunKong(): string;
    getTimeXunKong(): string;
    getDayWuXing(): string;
    getTaiYuan(): string;
    getTaiYuanNaYin(): string;
    getTaiXi(): string;
    getTaiXiNaYin(): string;
    getMingGong(): string;
    getMingGongNaYin(): string;
    getShenGong(): string;
    getShenGongNaYin(): string;
    /** sex: 1=男, 0=女 */
    getYun(sex: number, sect?: number): Yun;
  }

  export class Yun {
    getStartSolar(): Solar;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getDaYun(): DaYun[];
  }

  export class DaYun {
    getGanZhi(): string;
    getStartAge(): number;
    getEndAge(): number;
    getStartYear(): number;
    getLiuNian(): LiuNian[];
    getXiaoYun(): XiaoYun[];
  }

  export class XiaoYun {
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
  }

  export class LiuYue {
    getIndex(): number;
    getMonthInChinese(): string;
    getGanZhi(): string;
  }

  export class LiuNian {
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
    getLiuYue(): LiuYue[];
  }
}
