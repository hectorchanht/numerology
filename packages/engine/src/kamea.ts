import { planetarySquare, type Planet } from "@numerology/knowledge";

export interface KameaMark { value: number; system: "lifepath" | "ninestar"; row: number; col: number }
export interface KameaResult {
  weekday: number;
  planet: Planet;
  order: number;
  rows: number[][];
  lineSum: number;
  total: number;
  marks: KameaMark[];
  steps: string[];
}

const RULERS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** 依出生星期定主管行星,再於其幻方標出各數位置。 */
export function castKamea(
  year: number, month: number, day: number,
  marks: { value: number; system: "lifepath" | "ninestar" }[],
): KameaResult {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const planet = RULERS[weekday]!;
  const { rows, order } = planetarySquare(planet);
  const n2 = order * order;
  const lineSum = (order * (n2 + 1)) / 2;
  const total = (n2 * (n2 + 1)) / 2;
  const placed: KameaMark[] = [];
  for (const m of marks) {
    if (m.value > n2) continue;
    for (let r = 0; r < rows.length; r++) {
      const c = rows[r]!.indexOf(m.value);
      if (c >= 0) placed.push({ ...m, row: r, col: c });
    }
  }
  const steps = [
    `${year}-${month}-${day} 為星期${"日一二三四五六"[weekday]},主管行星 ${planet}。`,
    `${planet} 幻方為 ${order} 階,每行和 ${lineSum},全部數字和 ${total}。`,
  ];
  return { weekday, planet, order, rows, lineSum, total, marks: placed, steps };
}
