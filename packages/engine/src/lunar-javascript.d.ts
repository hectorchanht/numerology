/**
 * lunar-javascript 不自带 TS 类型,这里只声明本引擎用到的方法(最小面)。
 * 完整 API 见 https://6tail.cn/calendar/api.html
 */
declare module "lunar-javascript" {
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
  }

  export class Lunar {
    /** month 为负数表示闰月(如 -2 = 闰二月) */
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getEightChar(): EightChar;
    toString(): string;
    getYearInGanZhi(): string;
    /** 农历年/月/日数字(月为负=闰月) */
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    /** 农历年地支,如 "辰" */
    getYearZhi(): string;
    /** 生肖,如 "龙" */
    getYearShengXiao(): string;
    /** 上一個節氣(如立春/驚蟄等,含節) */
    getPrevJieQi(): JieQi;
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
  }

  export class LiuNian {
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
  }
}
