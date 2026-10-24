/**
 * lunar-javascript 最小類型聲明(本 app 用到嘅方法)。
 * 引擎包有自己嘅聲明 (packages/engine/src/lunar-javascript.d.ts);呢度係 web 客戶端用。
 * 完整 API 見 https://6tail.cn/calendar/api.html
 */
declare module "lunar-javascript" {
  export class Solar {
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    toString(): string;
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
  }

  export class LunarTime {
    toString(): string;
    getYi(): string[];
    getJi(): string[];
  }
}
