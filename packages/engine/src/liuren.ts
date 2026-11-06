import { Solar } from "lunar-javascript";
import {
  DIZHI, LIUREN_CITE, LIUREN_DAY_NIGHT, LIUREN_DIRECTION, LIUREN_GUIREN, LIUREN_JIANG, LIUREN_JIGONG, LIUREN_LIUQIN,
  LIUREN_SHEN_NAME, LIUREN_XING, LIUREN_YUEJIANG, TIANGAN,
} from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface LiurenKe { up: string; down: string }
export interface LiurenResult {
  at: { year: number; month: number; day: number; hour: number; minute: number };
  dayGanZhi: string; hourZhi: string;
  /** 當令中氣 */
  zhongQi: string;
  yueJiang: { zhi: string; name: string };
  /** 地盤子→亥 順序,各位之天盤支 */
  tianPan: string[];
  ke: [LiurenKe, LiurenKe, LiurenKe, LiurenKe];
  sanChuan: { chu: string; zhong: string; mo: string; method: string; sub: string };
  guiren: { zhi: string; daytime: boolean; forward: boolean };
  /** 天盤支 → 天將 */
  jiang: Record<string, string>;
  /** 日干支所在旬:旬首、旬空兩支 */
  xun: { shou: string; kong: [string, string] };
  /** 三傳(初中末)逐支:遁干(旬空為 null)、是否旬空、對日干六親 */
  chuan: { zhi: string; dun: string | null; kong: boolean; qin: string }[];
  /** 四課上神是否旬空(一課至四課) */
  keKong: boolean[];
  steps: string[];
  tier: "classical";
  cite: { work: string; locator: string };
}

const Z = DIZHI as readonly string[];
const G = TIANGAN as readonly string[];
const zi = (z: string) => Z.indexOf(z);
const at12 = (i: number) => Z[((i % 12) + 12) % 12]!;
/** 五行序:木火土金水;a 剋 b ⇔ (b − a) mod 5 = 2 */
const WX = "木火土金水";
const ZHI_WX = "水土木木土火火土金金土水";
const wxOf = (c: string) => (Z.includes(c) ? ZHI_WX[zi(c)]! : "木木火火土土金金水水"[G.indexOf(c)]!);
const ke = (a: string, b: string) => (WX.indexOf(wxOf(b)) - WX.indexOf(wxOf(a)) + 5) % 5 === 2;
const yangZhi = (z: string) => zi(z) % 2 === 0;
const MENG = "寅申巳亥", ZHONG = "子午卯酉";
/** 井欄射神所在地盤支(卷05「丑日取巳上神、未日取亥上神」);返吟無剋只得丑未日(全表窮舉驗證) */
const JINGLAN_SHE: Record<string, string> = { 丑: "巳", 未: "亥" };

/** 旬遁(卷09「有遁旬中之干者」):旬首、旬空,及十二支遁干(旬空兩支十干不到,為 null) */
export function liurenXun(dayGan: string, dayZhi: string): { shou: string; kong: [string, string]; dun: Record<string, string | null> } {
  const start = zi(dayZhi) - G.indexOf(dayGan);
  const dun: Record<string, string | null> = {};
  for (let k = 0; k < 12; k++) dun[at12(start + k)] = k < 10 ? G[k]! : null;
  return { shou: "甲" + at12(start), kong: [at12(start + 10), at12(start + 11)], dun };
}

/** 六親(卷07「甲乙日水神發用是父母應也」):日干對支五行 */
export function liurenLiuqin(gan: string, zhi: string): string {
  const d = (WX.indexOf(wxOf(zhi)) - WX.indexOf(wxOf(gan)) + 5) % 5;
  return LIUREN_LIUQIN[(["同類", "日生", "日剋", "剋日", "生日"] as const)[d]!];
}

type Cand = { shen: string; on: string };
type Kind = "下賊上" | "上剋下";

/** 比用 → 涉害:回傳初傳、子格、步驟文字。cands 已按上神去重。 */
function pick(cands: Cand[], kind: Kind, yangDay: boolean, riShang: string, chenShang: string): { chu: string; method: "zeike" | "biyong" | "shehai"; sub: string; note: string } {
  if (cands.length === 1) return { chu: cands[0]!.shen, method: "zeike", sub: kind === "下賊上" ? "重審" : "元首", note: `${kind}唯一:${cands[0]!.shen}加${cands[0]!.on}` };
  const bi = cands.filter((c) => yangZhi(c.shen) === yangDay);
  if (bi.length === 1) return { chu: bi[0]!.shen, method: "biyong", sub: "知一", note: `${kind}${cands.length}神,${yangDay ? "陽" : "陰"}日取比者 ${bi[0]!.shen}` };
  const pool = bi.length ? bi : cands;
  // 涉害:由加臨位之次位順行至本家前一位,逐位計地盤支同寄宮干之剋
  const depth = (c: Cand) => {
    let n = 0;
    for (let i = zi(c.on) + 1; at12(i) !== c.shen; i++) {
      const pos = at12(i);
      for (const x of [pos, ...TIANGAN.filter((g) => LIUREN_JIGONG[g] === pos)]) {
        if (kind === "下賊上" ? ke(x, c.shen) : ke(c.shen, x)) n++;
      }
    }
    return n;
  };
  const d = pool.map(depth);
  const max = Math.max(...d);
  const top = pool.filter((_, i) => d[i] === max);
  const note = `涉害深淺:${pool.map((c, i) => `${c.shen}加${c.on} ${d[i]} 重`).join("、")}`;
  if (top.length === 1) return { chu: top[0]!.shen, method: "shehai", sub: "涉害", note };
  const meng = top.filter((c) => MENG.includes(c.on));
  if (meng.length === 1) return { chu: meng[0]!.shen, method: "shehai", sub: "見機", note: `${note};俱深取四孟上神 ${meng[0]!.shen}` };
  const zhong = top.filter((c) => ZHONG.includes(c.on));
  if (meng.length === 0 && zhong.length === 1) return { chu: zhong[0]!.shen, method: "shehai", sub: "察微", note: `${note};無孟取仲上神 ${zhong[0]!.shen}` };
  const chu = yangDay ? riShang : chenShang;
  return { chu, method: "shehai", sub: "綴瑕", note: `${note};復等,${yangDay ? "剛日取日上神" : "柔日取辰上神"} ${chu}` };
}

/** 純干支核心:日干支、占時支、月將 → 天地盤、四課、三傳、貴人天將。 */
export function castLiurenKe(p: { dayGan: string; dayZhi: string; hourZhi: string; yueJiang: string }): Omit<LiurenResult, "at" | "zhongQi"> {
  const { dayGan, dayZhi, hourZhi, yueJiang } = p;
  const off = zi(yueJiang) - zi(hourZhi);
  const tianPan = Z.map((_, i) => at12(i + off));
  const up = (z: string) => tianPan[zi(z)]!;
  const jg = LIUREN_JIGONG[dayGan]!;
  const k1 = { down: dayGan, up: up(jg) };
  const k2 = { down: k1.up, up: up(k1.up) };
  const k3 = { down: dayZhi, up: up(dayZhi) };
  const k4 = { down: k3.up, up: up(k3.up) };
  const kes = [k1, k2, k3, k4] as LiurenResult["ke"];
  const yangDay = G.indexOf(dayGan) % 2 === 0;
  const riShang = k1.up, chenShang = k3.up;
  const onOf = (s: string) => Z[tianPan.indexOf(s)]!;
  const steps: string[] = [
    `月將 ${yueJiang}(${LIUREN_SHEN_NAME[yueJiang]})加占時 ${hourZhi}:天盤 ${Z.map((z, i) => `${z}上${tianPan[i]}`).join(" ")}`,
    `四課:一課 ${k1.up}/${k1.down}(${dayGan}寄${jg})、二課 ${k2.up}/${k2.down}、三課 ${k3.up}/${k3.down}、四課 ${k4.up}/${k4.down}`,
  ];

  const uniq = (ks: LiurenKe[]): Cand[] => [...new Set(ks.map((k) => k.up))].map((s) => ({ shen: s, on: onOf(s) }));
  const xiaZei = uniq(kes.filter((k) => ke(k.down, k.up)));
  const shangKe = uniq(kes.filter((k) => ke(k.up, k.down)));
  const byKe = () => (xiaZei.length ? pick(xiaZei, "下賊上", yangDay, riShang, chenShang) : shangKe.length ? pick(shangKe, "上剋下", yangDay, riShang, chenShang) : null);
  const general = (chu: string) => ({ chu, zhong: up(chu), mo: up(up(chu)) });

  let sc: LiurenResult["sanChuan"];
  if (off === 0) {
    // 伏吟:有剋照賊剋取初,無剋剛日日上、柔日辰上;中末傳刑
    const r = byKe();
    const chu = r ? r.chu : yangDay ? riShang : chenShang;
    let sub = yangDay ? "自任" : "自信";
    let zhong = LIUREN_XING[chu]!;
    if (zhong === chu) { sub = "杜傳"; zhong = chu === riShang ? chenShang : riShang; }
    let mo = LIUREN_XING[zhong]!;
    if (mo === zhong || mo === chu) mo = at12(zi(zhong) + 6);
    sc = { chu, zhong, mo, method: "fuyin", sub };
    steps.push(`月將同占時,伏吟。${r ? r.note : `無剋,${yangDay ? "剛日取日上神" : "柔日取辰上神"} ${chu}`};中傳取刑${sub === "杜傳" ? "(初傳自刑,杜傳)" : ""},末傳取刑,自刑或回刑初傳則取沖`);
  } else if (Math.abs(off) === 6) {
    const r = byKe();
    if (r) {
      sc = { ...general(r.chu), method: "fanyin", sub: "無依" };
      steps.push(`月將沖占時,返吟有剋。${r.note}`);
    } else {
      // 井欄:丑日取地盤巳上神、未日取地盤亥上神;窮舉 60 日只丁己辛丑未日會返吟無剋,與書合
      const chu = up(JINGLAN_SHE[dayZhi]!);
      sc = { chu, zhong: chenShang, mo: riShang, method: "fanyin", sub: "井欄" };
      steps.push(`月將沖占時,返吟無剋,井欄:${dayZhi}日取射神 ${chu},中傳辰上神、末傳日上神`);
    }
  } else if (jg === dayZhi && !xiaZei.length && !shangKe.length) {
    const chu = yangDay ? at12(zi(riShang) + 2) : at12(zi(k4.up) - 2);
    sc = { chu, zhong: riShang, mo: riShang, method: "bazhuan", sub: "八專" };
    steps.push(`干支同位無剋,八專:${yangDay ? `剛日由日上神 ${riShang} 順數三位` : `柔日由辰上陰神 ${k4.up} 逆數三位`}得 ${chu},中末俱日上神`);
  } else if (xiaZei.length || shangKe.length) {
    const r = byKe()!;
    sc = { ...general(r.chu), method: r.method, sub: r.sub };
    steps.push(`${r.method === "zeike" ? "賊剋" : r.method === "biyong" ? "比用" : "涉害"}:${r.note}`);
  } else {
    const ups = uniq([k2, k3, k4]);
    const haoshi = ups.filter((c) => ke(c.shen, dayGan));
    const tanshe = ups.filter((c) => ke(dayGan, c.shen));
    const distinct = new Set([`${k1.up}${jg}`, ...[k2, k3, k4].map((k) => k.up + k.down)]).size;
    if (haoshi.length || tanshe.length) {
      // 遙剋多神同賊剋:先比後涉害;蒿矢比照上剋下、彈射比照下賊上計涉害(本站取法)
      const r = haoshi.length ? pick(haoshi, "上剋下", yangDay, riShang, chenShang) : pick(tanshe, "下賊上", yangDay, riShang, chenShang);
      const sub = haoshi.length ? "蒿矢" : "彈射";
      sc = { ...general(r.chu), method: "yaoke", sub };
      steps.push(`四課無上下剋,遙剋${sub}:${haoshi.length ? "上神剋日" : "日剋上神"} ${r.note.replace(/^[^:]*:/, "")}`);
    } else if (distinct === 4) {
      const chu = yangDay ? up("酉") : onOf("酉");
      sc = yangDay
        ? { chu, zhong: chenShang, mo: riShang, method: "maoxing", sub: "虎視" }
        : { chu, zhong: riShang, mo: chenShang, method: "maoxing", sub: "冬蛇掩目" };
      steps.push(`無剋無遙剋、四課備,昴星:${yangDay ? `剛日取地盤酉上神 ${chu},中辰上、末日上` : `柔日取天盤酉下神 ${chu},中日上、末辰上`}`);
    } else {
      const he = TIANGAN[(G.indexOf(dayGan) + 5) % 10]!;
      const chu = yangDay ? up(LIUREN_JIGONG[he]!) : at12(zi(dayZhi) + 4);
      sc = { chu, zhong: riShang, mo: riShang, method: "biezhe", sub: "別責" };
      steps.push(`無剋無遙剋、四課不備,別責:${yangDay ? `剛日取${dayGan}合${he}寄${LIUREN_JIGONG[he]}上神` : `柔日取${dayZhi}三合前一辰`} ${chu},中末俱日上神`);
    }
  }
  steps.push(`三傳:${sc.chu} → ${sc.zhong} → ${sc.mo}`);
  const xun = liurenXun(dayGan, dayZhi);
  const chuan = [sc.chu, sc.zhong, sc.mo].map((z) => ({ zhi: z, dun: xun.dun[z] ?? null, kong: xun.dun[z] === null, qin: liurenLiuqin(dayGan, z) }));
  const keKong = kes.map((k) => xun.dun[k.up] === null);
  steps.push(`旬遁:${dayGan}${dayZhi}在${xun.shou}旬,旬空 ${xun.kong.join("")};三傳遁干 ${chuan.map((c) => `${c.zhi}${c.dun ?? "(空亡)"}`).join("、")};六親 ${chuan.map((c) => `${c.zhi}${c.qin}`).join("、")}`);

  const daytime = LIUREN_DAY_NIGHT.day.includes(hourZhi);
  const gz = LIUREN_GUIREN[dayGan]![daytime ? "day" : "night"];
  const gOn = zi(onOf(gz));
  const forward = LIUREN_DIRECTION.forward.includes(Z[gOn]!);
  const jiang: Record<string, string> = {};
  LIUREN_JIANG.forEach((j, i) => { jiang[tianPan[((gOn + (forward ? i : -i)) % 12 + 12) % 12]!] = j; });
  steps.push(`貴人:${dayGan}日${daytime ? "旦" : "夜"}貴 ${gz},臨地盤 ${Z[gOn]},天將${forward ? "順" : "逆"}布`);

  return {
    dayGanZhi: dayGan + dayZhi, hourZhi,
    yueJiang: { zhi: yueJiang, name: LIUREN_SHEN_NAME[yueJiang]! },
    tianPan, ke: kes, sanChuan: sc,
    guiren: { zhi: gz, daytime, forward },
    jiang, xun: { shou: xun.shou, kong: xun.kong }, chuan, keKong, steps, tier: "classical", cite: LIUREN_CITE,
  };
}

/** lunar-javascript 簡體中氣名 → 繁體 */
const ZQ_TRAD: Record<string, string> = { 谷雨: "穀雨", 小满: "小滿", 处暑: "處暑" };

/** 大六壬起課。at 缺省 = 出生時刻(有經度用真太陽時,同八字)。中氣按交氣時刻換將。 */
export function castLiuren(input: BirthInput, at?: { year: number; month: number; day: number; hour: number; minute?: number }): LiurenResult {
  const t = at ? { ...at, minute: at.minute ?? 0 } : resolveBirthDateTime(input);
  const ec = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0).getLunar().getEightChar();
  const ms = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  // 每年表只以中文鍵記上年冬至起之節氣,當年十二月冬至用拼音鍵 DONG_ZHI;故掃前後三年,只取中文鍵
  let zhongQi = "";
  let best = -Infinity;
  for (const y of [t.year - 1, t.year, t.year + 1]) {
    for (const [name, s] of Object.entries(Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable())) {
      const trad = ZQ_TRAD[name] ?? name;
      if (!(trad in LIUREN_YUEJIANG)) continue;
      const m = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());
      if (m <= ms && m > best) { best = m; zhongQi = trad; }
    }
  }
  const r = castLiurenKe({ dayGan: ec.getDayGan(), dayZhi: ec.getDayZhi(), hourZhi: ec.getTimeZhi(), yueJiang: LIUREN_YUEJIANG[zhongQi]! });
  r.steps.unshift(`${t.year}-${t.month}-${t.day} ${t.hour}:${String(t.minute).padStart(2, "0")},當令中氣 ${zhongQi},月將 ${LIUREN_YUEJIANG[zhongQi]}`);
  return { at: { year: t.year, month: t.month, day: t.day, hour: t.hour, minute: t.minute }, zhongQi, ...r };
}
