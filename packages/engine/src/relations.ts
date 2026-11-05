import { GANZHI_RELATIONS as R, type Wuxing } from "@numerology/knowledge";
import { KE, WUXING } from "./shishen.js";
import type { Tiangan } from "@numerology/knowledge";

export type PillarKey = "year" | "month" | "day" | "hour";
export type RelationKind =
  | "天干五合" | "天干相冲" | "六合" | "三合" | "半合" | "三会" | "相冲" | "相害" | "相刑" | "自刑" | "相破";
type Who = PillarKey | "dayun" | "liunian" | "liuyue";
export interface GanzhiRelation {
  kind: RelationKind;
  /** 參與者:原局柱用 PillarKey;外來(大運 / 流年 / 流月)用 "dayun" | "liunian" | "liuyue" */
  between: Who[];
  chars: string[];
  hua?: Wuxing;
}
type Natal = Record<PillarKey, { gan: string; zhi: string }>;
interface Item { who: Who; gan: string; zhi: string }

const KEYS: PillarKey[] = ["year", "month", "day", "hour"];
/** 有序對 [a,b](任一方向)對應 [x,y] */
const has = (t: readonly string[], a: string, b: string) => (t[0] === a && t[1] === b) || (t[0] === b && t[1] === a);

function relate(items: Item[]): GanzhiRelation[] {
  const out: GanzhiRelation[] = [];
  const add = (kind: RelationKind, who: Who[], chars: string[], hua?: Wuxing) => out.push({ kind, between: who, chars, ...(hua ? { hua } : {}) });

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!, b = items[j]!, w = [a.who, b.who];
      const gh = R.ganHe.find((x) => has(x.pair, a.gan, b.gan));
      if (gh) add("天干五合", w, [...gh.pair], gh.hua);
      const gc = R.ganChong.find((x) => has(x, a.gan, b.gan));
      if (gc) add("天干相冲", w, [...gc]);

      const lh = R.zhiLiuHe.find((x) => has(x.pair, a.zhi, b.zhi));
      if (lh) add("六合", w, [...lh.pair], lh.hua);
      const zc = R.zhiChong.find((x) => has(x, a.zhi, b.zhi));
      if (zc) add("相冲", w, [...zc]);
      const hai = R.zhiHai.find((x) => has(x, a.zhi, b.zhi));
      if (hai) add("相害", w, [...hai]);
      const po = R.zhiPo.find((x) => has(x, a.zhi, b.zhi));
      if (po) add("相破", w, [...po]);
      if (a.zhi === b.zhi && R.zhiXing.some((x) => x.kind === "自刑" && x.members[0] === a.zhi)) add("自刑", w, [a.zhi, b.zhi]);
      const xg = R.zhiXing.find((x) => x.kind !== "自刑" && a.zhi !== b.zhi && (x.members as string[]).includes(a.zhi) && (x.members as string[]).includes(b.zhi));
      if (xg) add("相刑", w, xg.members.filter((m) => m === a.zhi || m === b.zhi));
    }
  }

  const pick = (zhi: string) => items.find((x) => x.zhi === zhi);
  const triple = (kind: "三合" | "三会", tbl: typeof R.zhiSanHe) => {
    for (const t of tbl) {
      const hit = t.members.map(pick);
      if (hit.every(Boolean)) { add(kind, hit.map((x) => x!.who), [...t.members], t.hua); continue; }
      if (kind === "三会") continue;
      // 半合:兩支且其中一支係中神(members[1])
      const mid = pick(t.members[1]);
      if (!mid) continue;
      for (const m of [t.members[0], t.members[2]]) {
        const o = pick(m);
        if (!o) continue;
        const first = m === t.members[0];
        add("半合", first ? [o.who, mid.who] : [mid.who, o.who], first ? [m, t.members[1]] : [t.members[1], m], t.hua);
      }
    }
  };
  triple("三合", R.zhiSanHe);
  triple("三会", R.zhiSanHui);
  return out;
}

const natalItems = (p: Natal): Item[] => KEYS.map((k) => ({ who: k, gan: p[k].gan, zhi: p[k].zhi }));

export function natalRelations(p: Natal): GanzhiRelation[] {
  return relate(natalItems(p));
}

/** 只列包含外來者嘅關係;外來排最前,令三合 / 三會優先用外來支 */
export function externalRelations(ext: { ganZhi: string; role: "dayun" | "liunian" | "liuyue" }, natal: Natal): GanzhiRelation[] {
  const items = [{ who: ext.role as Who, gan: ext.ganZhi[0]!, zhi: ext.ganZhi[1]! }, ...natalItems(natal)];
  return relate(items).filter((r) => r.between.includes(ext.role));
}

/** 歲運並臨:流年干支 === 大運干支 */
export function suiYunBingLin(dayunGanZhi: string, liunianGanZhi: string): boolean {
  return dayunGanZhi === liunianGanZhi;
}

/** 天剋地沖:外來干剋原局某柱干且支相沖 */
export function tianKeDiChong(extGanZhi: string, natal: Natal): PillarKey[] {
  const [g, z] = [extGanZhi[0] as Tiangan, extGanZhi[1]!];
  return KEYS.filter((k) => KE[WUXING[g]] === WUXING[natal[k].gan as Tiangan] && R.zhiChong.some((c) => has(c, z, natal[k].zhi)));
}
