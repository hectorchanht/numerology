import type { Wuxing5 } from "./wuge.js";

const isMaster = (n: number) => n === 11 || n === 22 || n === 33;
const digitSum = (n: number) => String(n).split("").reduce((a, d) => a + Number(d), 0);
const last = (a: number[]) => a[a.length - 1]!;

/** 化簡鏈(含起點與終點),至個位數或主數 11/22/33 止。 */
export function reduceNumber(n: number): number[] {
  const chain = [n];
  while (n > 9 && !isMaster(n)) { n = digitSum(n); chain.push(n); }
  return chain;
}

export interface LifePathResult {
  value: number;
  byComponents: number;
  byDigits: number;
  methodsAgree: boolean;
  steps: { components: string[]; digits: string[] };
}

export function lifePath(year: number, month: number, day: number): LifePathResult {
  const parts = [year, month, day].map(reduceNumber);
  const sum = parts.reduce((a, c) => a + last(c), 0);
  const total = reduceNumber(sum);
  const byComponents = last(total);
  const all = `${year}${month}${day}`.split("").map(Number);
  const dsum = all.reduce((a, b) => a + b, 0);
  const dchain = reduceNumber(dsum);
  const byDigits = last(dchain);
  const tail = (c: number[]) => (c.length > 1 ? " → " + c.slice(1).join(" → ") : "");
  return {
    value: byComponents,
    byComponents,
    byDigits,
    methodsAgree: byComponents === byDigits,
    steps: {
      components: [
        ...parts.map((c) => c.join(" → ")),
        `${parts.map(last).join(" + ")} = ${sum}${tail(total)}`,
      ],
      digits: [`${all.join(" + ")} = ${dsum}${tail(dchain)}`],
    },
  };
}

const HETU: Record<number, Wuxing5> = { 1: "水", 2: "火", 3: "木", 4: "金", 5: "土", 6: "水", 7: "火", 8: "木", 9: "金" };

/** 河圖五行;主數先化簡:11→2、22→4、33→6。 */
export function hetuWuxing(n: number): Wuxing5 {
  const m = n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n;
  return HETU[m]!;
}
