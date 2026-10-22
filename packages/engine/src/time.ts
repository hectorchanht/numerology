import type { BirthInput } from "./types.js";

/**
 * 公历小时 → iztro 时辰序号(0-12)。
 * 0=早子(00-01)、1=丑(01-03)、…、11=亥(21-23)、12=晚子(23-24)。
 */
export function hourToTimeIndex(hour: number): number {
  if (hour < 0 || hour > 23) {
    throw new Error(`非法小时: ${hour},应为 0-23`);
  }
  if (hour === 23) return 12;
  return Math.floor((hour + 1) / 2);
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 某年某月的真实天数(含闰年 2 月)。 */
export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
}

/** 基础输入校验,在系统边界快速失败。日期按真实历法校验(月天数 + 闰年)。 */
export function validateBirthInput(input: BirthInput): void {
  const { year, month, day, hour, minute = 0, gender } = input;
  const fail = (msg: string): never => {
    throw new Error(`非法出生信息: ${msg}`);
  };
  if (!Number.isInteger(year) || year < 1900 || year > 2100) fail(`年 ${year}(支持 1900-2100)`);
  if (!Number.isInteger(month) || month < 1 || month > 12) fail(`月 ${month}`);
  const dim = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > dim) {
    fail(`日 ${day}(${year}年${month}月只有 ${dim} 天)`);
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) fail(`时 ${hour}`);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) fail(`分 ${minute}`);
  if (gender !== "男" && gender !== "女") fail(`性别 ${gender}(应为 男/女)`);
}
