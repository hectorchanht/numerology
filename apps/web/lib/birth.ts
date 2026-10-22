import { solarFromLunar, type BirthInput, type HourInferInput } from "@numerology/engine";

/** 引擎支持的公历年份范围(与 @numerology/engine 的 validateBirthInput 一致)。 */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/** 若 body 标记为农历,把 year/month/day 转成阳历;否则原样返回。 */
function resolveCalendar(b: Record<string, unknown>, y: number, m: number, d: number) {
  if (b.calendar === "lunar") {
    const isLeap = b.isLeapMonth === true;
    const s = solarFromLunar({ year: y, month: m, day: d, isLeapMonth: isLeap });
    // 农历→公历换算可能跨年(如农历 2100 年腊月 → 公历 2101 年):换算后仍需在引擎范围内,
    // 否则下游会报一句看不懂的「非法出生信息:年 2101」。
    if (s.year < MIN_YEAR || s.year > MAX_YEAR) {
      throw new Error(
        `农历${y}年${isLeap ? "闰" : ""}${m}月${d}日换算为公历${s.year}年${s.month}月${s.day}日,` +
          `超出引擎支持范围(${MIN_YEAR}-${MAX_YEAR})`,
      );
    }
    return s;
  }
  return { year: y, month: m, day: d };
}

/** 整数域:拒绝非整数(如 1990.5),在边界给出明确报错。 */
function intNum(b: Record<string, unknown>, key: string): number {
  const v = Number(b[key]);
  if (!Number.isFinite(v)) throw new Error(`字段 ${key} 非数字`);
  if (!Number.isInteger(v)) throw new Error(`字段 ${key} 必须为整数(收到 ${String(b[key])})`);
  return v;
}

/** 经度域:允许小数,但必须在 -180~180 范围内。 */
function longitudeNum(b: Record<string, unknown>): number | undefined {
  const raw = b.longitude;
  if (raw === undefined || raw === "" || raw === null) return undefined;
  const v = Number(raw);
  if (!Number.isFinite(v)) throw new Error("字段 longitude 非数字");
  if (v < -180 || v > 180) throw new Error(`经度 ${v} 超出范围(-180~180)`);
  return v;
}

/** 把任意外部输入(API body)安全解析为 BirthInput,在边界快速失败。 */
export function parseBirthInput(body: unknown): BirthInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("请求体格式错误");
  }
  const b = body as Record<string, unknown>;
  const gender = b.gender;
  if (gender !== "男" && gender !== "女") throw new Error("性别必须为 男/女");

  const { year, month, day } = resolveCalendar(b, intNum(b, "year"), intNum(b, "month"), intNum(b, "day"));
  const longitude = longitudeNum(b);
  const input: BirthInput = {
    year,
    month,
    day,
    hour: intNum(b, "hour"),
    minute: b.minute === undefined || b.minute === "" ? 0 : intNum(b, "minute"),
    gender,
  };
  if (longitude !== undefined) input.longitude = longitude;
  return input;
}

/** 时辰推断输入(无时辰):年月日 + 性别(+可选经度)。 */
export function parseHourInferInput(body: unknown): HourInferInput {
  if (typeof body !== "object" || body === null) throw new Error("请求体格式错误");
  const b = body as Record<string, unknown>;
  if (b.gender !== "男" && b.gender !== "女") throw new Error("性别必须为 男/女");
  const sd = resolveCalendar(b, intNum(b, "year"), intNum(b, "month"), intNum(b, "day"));
  const longitude = longitudeNum(b);
  const input: HourInferInput = {
    year: sd.year, month: sd.month, day: sd.day, gender: b.gender,
  };
  if (longitude !== undefined) input.longitude = longitude;
  return input;
}
