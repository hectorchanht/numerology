"use client";

import { useMemo, useState } from "react";
import {
  castEphemeris, castHeluo, heluoClasses, heluoJinsuoLuck, castHuangji, castLiuren, castMaya, castPlanetaryHour, castQizheng, castTaixuan, LIUREN_METHODS, MAYA_META, TZOLKIN_DAY_NAMES,
  type ChartResult, type EphemerisResult, type HeluoResult, type HeluoClasses, type JinsuoLuck, type HuangjiResult, type LiurenResult, type MayaResult, type PlanetaryHourResult, type QizhengResult, type TaixuanResult,
} from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { parseLiurenAt, taixuanGrid, tzolkinCell } from "@/lib/cycleView";
import { CitePop } from "@/components/CrossSystemCard";

/*
 * 時間週期卡:太玄(81 首 9×9 格)、瑪雅曆(Tzolk'in 13×20 格、長紀曆、Haab)、皇極經世、行星時、七曜位置與月宿、河洛理數、大六壬、七政四餘。
 * 全部由引擎確定性計算,零 AI;舊歷史紀錄只存 chart,於此即場重算。
 */

function Meta({ tier, basis, cite }: { tier: string; basis: TKey; cite: TaixuanResult["cite"] }) {
  const { t } = useLocale();
  return (
    <div className="xs-meta">
      <span className={`xs-tier tier-${tier}`}>{t(`cross.tier.${tier}` as TKey)}</span>
      <span className="xs-basis">{t(basis)}</span>
      <CitePop cite={cite} />
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  const { t } = useLocale();
  const { z } = useScript();
  return (
    <details className="xs-steps">
      <summary>{t("cross.steps")}</summary>
      <ol>{steps.map((s, i) => <li key={i}>{z(s)}</li>)}</ol>
    </details>
  );
}

const TX = 30;

function Taixuan({ r, solar }: { r: TaixuanResult; solar: boolean }) {
  const { t } = useLocale();
  const { z } = useScript();
  const g = taixuanGrid(r);
  const name = z(r.headName ?? "");
  const label = g
    ? t("cycle.taixuanAria", { head: g.head, name, zan: g.zan })
    : t("cycle.taixuanAriaExtra", { extra: z(r.extra ?? "") });
  return (
    <>
      <h3 className="xs-h">{t("cycle.taixuan")}</h3>
      <p className="cy-val">{g ? t("cycle.taixuanVal", { head: g.head, name, zan: g.zan }) : t("cycle.taixuanExtra", { extra: z(r.extra ?? "") })}</p>
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.cite} />
      <svg className="xs-grid cy-taixuan" viewBox={`0 0 ${TX * 9} ${TX * 9}`} role="img" aria-label={label}>
        <title>{label}</title>
        {Array.from({ length: 81 }, (_, i) => {
          const row = Math.floor(i / 9), col = i % 9;
          return (
            <g key={i}>
              <rect className="xs-cell" x={col * TX} y={row * TX} width={TX} height={TX} />
              <text className="xs-num" x={col * TX + TX / 2} y={row * TX + TX / 2} fontSize={11}>{i + 1}</text>
            </g>
          );
        })}
        {/* 落點最後畫,外框不被鄰格蓋住。 */}
        {g ? (
          <>
            <rect className="xs-cell cy-hit" x={g.col * TX} y={g.row * TX} width={TX} height={TX} />
            <text className="xs-num cy-hit-num" x={g.col * TX + TX / 2} y={g.row * TX + TX / 2} fontSize={11}>{g.head}</text>
          </>
        ) : null}
      </svg>
      <Steps steps={r.steps} />
    </>
  );
}

/* 13×20 格:左留 16 單位寫數字列號,頂留 14 單位放落點指示;日名只在下方圖例列出,手機上不擠。 */
const MC = 20, GL = 16, GT = 14;

function Maya({ r }: { r: MayaResult }) {
  const { t } = useLocale();
  const c = tzolkinCell(r);
  const { number: n, dayName } = r.tzolkin;
  const label = t("cycle.tzolkinAria", { n, name: dayName, col: c.col + 1 });
  const cx = GL + c.col * MC + MC / 2;
  return (
    <>
      <h3 className="xs-h">{t("cycle.maya")}</h3>
      <p className="cy-val">
        {t("cycle.tzolkin", { n, name: dayName })} · {t("cycle.longCount", { lc: r.longCount.join(".") })} · {t("cycle.haab", { d: r.haab.day, name: r.haab.monthName })}
      </p>
      <Meta tier={MAYA_META.tier ?? "unrated"} basis="cross.basis.civil" cite={r.cite} />
      <svg className="xs-grid cy-tzolkin" viewBox={`0 0 ${GL + MC * 20} ${GT + MC * 13}`} role="img" aria-label={label}>
        <title>{label}</title>
        <path className="cy-pin" d={`M${cx - 5} 2 L${cx + 5} 2 L${cx} ${GT - 3} Z`} />
        {Array.from({ length: 13 }, (_, row) => (
          <g key={row}>
            <text className="cy-axis" x={GL / 2} y={GT + row * MC + MC / 2} fontSize={10}>{row + 1}</text>
            {Array.from({ length: 20 }, (_, col) => (
              <rect key={col} className="xs-cell" x={GL + col * MC} y={GT + row * MC} width={MC} height={MC} />
            ))}
          </g>
        ))}
        <rect className="xs-cell cy-hit" x={GL + c.col * MC} y={GT + c.row * MC} width={MC} height={MC} />
        <text className="xs-num cy-hit-num" x={cx} y={GT + c.row * MC + MC / 2} fontSize={11}>{n}</text>
      </svg>
      <ol className="cy-legend">
        {TZOLKIN_DAY_NAMES.map((d) => <li key={d.n} className={d.n === c.col ? "on" : undefined}>{d.name}</li>)}
      </ol>
      <Steps steps={r.steps} />
      <p className="xs-note">{t("cycle.dreamspell")}</p>
    </>
  );
}

function Huangji({ r, solar }: { r: HuangjiResult; solar: boolean }) {
  const { t } = useLocale();
  return (
    <>
      <h3 className="xs-h">{t("cycle.huangji")}</h3>
      <p className="cy-val">
        {t("cycle.huangjiVal", { hui: r.huiName, yun: r.yun, yunName: r.yunName, shi: r.shi, shiName: r.shiName, y: r.yearInShi })}
      </p>
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.cite} />
      <p className="xs-note">{t("cycle.huangjiNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

function PlanetaryHour({ r, solar }: { r: PlanetaryHourResult | null; solar: boolean }) {
  const { t } = useLocale();
  if (!r) {
    return (
      <>
        <h3 className="xs-h">{t("cycle.hour")}</h3>
        <p className="xs-note">{t("cycle.hourNeedLat")}</p>
      </>
    );
  }
  return (
    <>
      <h3 className="xs-h">{t("cycle.hour")}</h3>
      <p className="cy-val">
        {r.hour
          ? t("cycle.hourVal", {
              day: r.dayPlanet, half: t(r.half === "day" ? "cycle.hourDay" : "cycle.hourNight"), n: r.hour,
              name: r.hourName ?? "", planet: r.hourPlanet ?? "", angel: r.hourAngel ?? "",
            })
          : t("cycle.hourPolar", { day: r.dayPlanet, angel: r.dayAngel })}
      </p>
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.cite} />
      <p className="xs-note">{t("cycle.olympic", { day: r.dayOlympic, hour: r.hourOlympic ? t("cycle.olympicHour", { hour: r.hourOlympic }) : "" })}</p>
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.olympicCite} />
      <p className="xs-note">{t("cycle.olympicNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

const deg = (lon: number) => `${Math.floor(lon % 30)}°${String(Math.floor(((lon % 30) % 1) * 60)).padStart(2, "0")}′`;

/** 七曜位置(星曆 + Tetrabiblos 尊貴)同 Agrippa 月宿;時間按鐘面東八區,不受真太陽時影響。 */
function Sky({ r }: { r: EphemerisResult }) {
  const { t } = useLocale();
  const m = r.moonMansion;
  const aspects = r.aspects.map((a) => `${a.a}–${a.b} ${a.type}`).join(", ");
  return (
    <>
      <h3 className="xs-h">{t("cycle.sky")}</h3>
      <p className="cy-val">
        {r.angles
          ? `${t("cycle.skyAngles", { asc: `${r.angles.ascSign} ${deg(r.angles.ascendant)}`, mc: `${r.angles.mcSign} ${deg(r.angles.mc)}` })} · ${t(r.sect === "day" ? "cycle.sectDay" : "cycle.sectNight")}`
          : t("cycle.skyNeedLat")}
      </p>
      <Meta tier={r.tier} basis="cycle.basis.clock" cite={r.cite} />
      <div className="bazi-detail-wrap">
        <table className="bazi-detail cy-sky">
          <thead>
            <tr>
              {(["cycle.colPlanet", "cycle.colPos", "cycle.colHouse", "cycle.colDig", "cycle.colTerm", "cycle.colNature"] as const).map((k) => <th key={k} className="colhead">{t(k)}</th>)}
            </tr>
          </thead>
          <tbody>
            {r.planets.map((p) => (
              <tr key={p.planet}>
                <th className="rowlabel">{p.planet}</th>
                <td>{p.sign} {deg(p.longitude)}{p.retrograde ? ` ${t("cycle.retro")}` : ""}</td>
                <td>{p.house ?? "—"}</td>
                <td>{p.dignities.map((d) => t(`cycle.dig.${d}` as TKey)).join("、") || "—"}</td>
                <td>{p.termRuler}</td>
                <td>{t(`cycle.nature.${p.nature}` as TKey)}{p.inSect === null ? "" : ` · ${t(p.inSect ? "cycle.inSect" : "cycle.outSect")}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs-note">{aspects ? t("cycle.aspects", { list: aspects }) : t("cycle.aspectsNone")}</p>
      <h3 className="xs-h">{t("cycle.mansion")}</h3>
      <p className="cy-val">{t("cycle.mansionVal", { n: m.n, name: m.names.join(" / "), meaning: m.meaning ? ` (${m.meaning})` : "", start: m.start.toFixed(2) })}</p>
      <Meta tier={r.tier} basis="cycle.basis.clock" cite={r.mansionCite} />
      <p className="xs-note">{t("cycle.skyNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

function Heluo({ r, c, luck, solar }: { r: HeluoResult; c: HeluoClasses; luck: JinsuoLuck; solar: boolean }) {
  const { t } = useLocale();
  const { z } = useScript();
  const has = (b: boolean) => t(b ? "cycle.has" : "cycle.none");
  const ln = r.liunian.find((y) => y.year === new Date().getFullYear());
  return (
    <>
      <h3 className="xs-h">{t("cycle.heluo")}</h3>
      <p className="cy-val">
        {t("cycle.heluoVal", { xt: z(r.xiantian.name), yt: r.yuantang, age: r.houtianAge, ht: z(r.houtian.name), hyt: r.houtianYuantang })}
      </p>
      <p className="xs-note">{t("cycle.heluoNums", { h: r.heaven, e: r.earth, yq: has(r.yuanqi.tian || r.yuanqi.di), hg: has(r.huagong.has) })}</p>
      <p className="xs-note">
        {t("cycle.heluoClass", {
          s: z([c.heaven && `天${c.heaven}`, c.earth && `地${c.earth}`, ...c.excess].filter(Boolean).join("、") || "—"),
          p: z(c.patterns.join("、") || "—"),
          rank: c.lineRank,
          yuan: has(c.youyuan),
        })}
      </p>
      {ln && <p className="xs-note">{t("cycle.heluoYear", { y: ln.year, age: ln.age, hex: z(ln.hex.name), line: ln.line })}</p>}
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.cite} />
      <details className="xs-steps">
        <summary>{t("cycle.heluoYun")}</summary>
        <ol>{r.dayun.map((d, i) => <li key={i}>{z(`${d.phase}第${d.line}爻(${d.yang ? "陽" : "陰"})`)} {d.fromAge}–{d.toAge}</li>)}</ol>
      </details>
      <p className="xs-note">{t("cycle.heluoNote")}</p>
      <Steps steps={r.steps} />
      <Ggz r={r} luck={luck} solar={solar} />
    </>
  );
}

const pct = (n: number) => `${Math.round((n / 256) * 1000) / 10}%`;

/** 金鎖銀匙數同廣象徹微積數;直條為 256 卦各積數的卦數(基率),本命支積、干積加框。 */
function Ggz({ r, luck, solar }: { r: HeluoResult; luck: JinsuoLuck; solar: boolean }) {
  const { t } = useLocale();
  const { z } = useScript();
  const j = r.jinsuo, g = r.guangxiang;
  const bp = g.branch.product, sp = g.stem.product;
  const keys = Object.keys(g.dist).map(Number).sort((a, b) => a - b);
  const max = Math.max(...Object.values(g.dist));
  const W = 343, H = 104, bw = W / keys.length, top = 4, base = H - 28;
  const aria = t("cycle.gxAria", { bp, sp });
  return (
    <>
      <h3 className="xs-h">{t("cycle.ggz")}</h3>
      <p className="cy-val">{t("cycle.jinsuoVal", { wx: t(`cycle.wx.${j.nayin}` as TKey), f: j.forward, r: j.reverse })}</p>
      <p className="xs-note">
        {luck.year
          ? t("cycle.jinsuoYear", { y: luck.year.year, gz: z(luck.year.yun), ts: z(luck.year.taisui), f: luck.year.forward, r: luck.year.reverse })
          : t("cycle.jinsuoNoYun", { y: new Date().getFullYear() })}
      </p>
      {luck.yun.length > 0 && (
        <details className="xs-steps">
          <summary>{t("cycle.jinsuoYunList")}</summary>
          <ol>
            {luck.yun.map((y) => (
              <li key={y.startYear} className={luck.year?.yun === y.ganZhi ? "on" : undefined}>
                {t("cycle.jinsuoYun", { gz: z(y.ganZhi), a: y.startYear, b: y.endYear, f: y.forward, r: y.reverse })}
              </li>
            ))}
          </ol>
        </details>
      )}
      <p className="xs-note">{z(t("cycle.gxVal", { bx: g.branch.xiang.join(""), bp, sx: g.stem.xiang.join(""), sp }))}</p>
      <svg className="xs-fy" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <title>{aria}</title>
        {keys.map((k, i) => {
          const h = ((base - top) * g.dist[k]!) / max;
          const on = k === bp || k === sp;
          return (
            <g key={k}>
              <rect className={on ? "xs-fy-bar" : "xs-fy-track"} x={i * bw + 1} y={base - h} width={bw - 2} height={h} rx={1.5} />
              {on && (
                <text className="cy-axis" x={i * bw + bw / 2} y={k === bp ? base + 8 : base + 21} fontSize={9} textAnchor={i === keys.length - 1 ? "end" : i === 0 ? "start" : "middle"}>{k}</text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="xs-note">{t("cycle.gxBase", { bp, bn: g.dist[bp]!, bpct: pct(g.dist[bp]!), sp, sn: g.dist[sp]!, spct: pct(g.dist[sp]!) })}</p>
      <Meta tier={r.tier} basis={solar ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.ggzCite} />
      <p className="xs-note">{t("cycle.ggzNote")} {t("cycle.jinsuoOrder")}</p>
      <Steps steps={luck.steps} />
    </>
  );
}

const lrMethod = (id: string) => LIUREN_METHODS.find((m) => m.id === id)?.name ?? id;
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 出生時刻課;可選另一時刻起課(只在本頁顯示,不入 AI)。空白、非法或出錯一律退回出生課。 */
function Liuren({ chart, solar }: { chart: ChartResult; solar: boolean }) {
  const { t } = useLocale();
  const { z } = useScript();
  const [val, setVal] = useState("");
  const { r, custom } = useMemo((): { r: LiurenResult; custom: boolean } => {
    const at = parseLiurenAt(val);
    if (at) {
      try {
        return { custom: true, r: castLiuren(chart.input, at) };
      } catch { /* 非法日期:退回出生課 */ }
    }
    return { custom: false, r: castLiuren(chart.input) };
  }, [chart, val]);
  const sc = r.sanChuan;
  const g = r.guiren;
  const mName = lrMethod(sc.method);
  const shaHit = r.shenSha.filter((s) => s.at.length);
  return (
    <>
      <h3 className="xs-h">{t("cycle.liuren")}</h3>
      <div className="lr-at">
        <label>
          {t("cycle.liurenAt")}
          <input type="datetime-local" min="1900-01-01T00:00" max="2100-12-31T23:59" value={val} onChange={(e) => setVal(e.target.value)} />
        </label>
        <button type="button" className="btn secondary small" onClick={() => setVal(toLocalInput(new Date()))}>{t("cycle.liurenNow")}</button>
        {val && <button type="button" className="btn secondary small" onClick={() => setVal("")}>{t("cycle.liurenBirth")}</button>}
      </div>
      <p className="xs-note">{t("cycle.liurenAtNote", { at: `${r.at.year}-${pad(r.at.month)}-${pad(r.at.day)} ${pad(r.at.hour)}:${pad(r.at.minute)}`, day: z(r.dayGanZhi), hour: z(r.hourZhi) })}</p>
      <p className="cy-val">{t("cycle.liurenJiang", { zq: z(r.zhongQi), zhi: z(r.yueJiang.zhi), name: z(r.yueJiang.name) })}</p>
      <div className="lr-ke" role="group" aria-label={t("cycle.liurenKe")}>
        {[...r.ke].reverse().map((k, i) => (
          <div key={i} className="lr-cell">
            <span>{z(k.up)}{r.keKong[3 - i] && <sup className="lr-kong">{t("cycle.liurenKong")}</sup>}</span>
            <span className="lr-down">{z(k.down)}</span>
            <small>{t("cycle.liurenKeN", { n: 4 - i })}</small>
          </div>
        ))}
      </div>
      <p className="cy-val">{t("cycle.liurenSan", { head: z(sc.sub === mName ? mName : `${mName} · ${sc.sub}`) })}</p>
      <ol className="lr-san">
        {(["cycle.liurenChu", "cycle.liurenZhong", "cycle.liurenMo"] as TKey[]).map((k, i) => {
          const c = r.chuan[i]!;
          return (
            <li key={k}>
              {t(k)} {z(c.zhi)} · {z(r.jiang[c.zhi] ?? "")} · {c.dun ? t("cycle.liurenDun", { gan: z(c.dun) }) : t("cycle.liurenKong")} · {z(c.qin)}
            </li>
          );
        })}
      </ol>
      <p className="xs-note">{t("cycle.liurenXun", { shou: z(r.xun.shou), kong: z(r.xun.kong.join("")) })}</p>
      <p className="xs-note">
        {shaHit.length
          ? t("cycle.liurenSha", { list: shaHit.map((s) => `${z(s.name)} ${z(s.zhi)}(${s.at.map((p) => z(p)).join("、")})`).join("、") })
          : t("cycle.liurenShaNone")}
      </p>
      <p className="xs-note">{t("cycle.liurenGui", { zhi: z(g.zhi), dn: t(g.daytime ? "cycle.liurenDay" : "cycle.liurenNight"), dir: t(g.forward ? "cycle.liurenFwd" : "cycle.liurenBack") })}</p>
      <Meta tier={r.tier} basis={solar && !custom ? "cross.basis.solar" : "cycle.basis.clock"} cite={r.cite} />
      <p className="xs-note">{t("cycle.liurenNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

function Qizheng({ r }: { r: QizhengResult }) {
  const { t } = useLocale();
  const { z } = useScript();
  const dms = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′`;
  return (
    <>
      <h3 className="xs-h">{t("cycle.qizheng")}</h3>
      <p className="xs-note">{t("cycle.qizhengIntro")}</p>
      <Meta tier={r.tier} basis="cycle.basis.clock" cite={r.cite} />
      <p className="cy-val">{t("cycle.qzMing", { zhi: z(r.minggong.zhi), ci: z(r.minggong.ci), sun: z(r.minggong.sunZhi), hour: z(r.minggong.hourZhi) })}</p>
      <div className="bazi-detail-wrap">
        <table className="bazi-detail cy-sky">
          <thead>
            <tr>
              {(["cycle.qzColName", "cycle.qzColLon", "cycle.qzColAnc", "cycle.qzColMod", "cycle.qzColGong"] as const).map((k) => <th key={k} className="colhead">{t(k)}</th>)}
            </tr>
          </thead>
          <tbody>
            {r.bodies.map((b) => (
              <tr key={b.id}>
                <th className="rowlabel">{z(b.name)}{b.kind === "餘" ? ` (${t(b.id === "ziqi" ? "cycle.qzSchool" : "cycle.qzCalc")})` : ""}</th>
                <td>{dms(b.longitude)}{b.retrograde ? ` ${t(b.kind === "政" ? "cycle.retro" : "cycle.qzAlwaysRetro")}` : ""}</td>
                <td>{z(b.ancient.name)} {dms(b.ancient.degree)}</td>
                <td>{z(b.mansion.name)} {dms(b.mansion.degree)}</td>
                <td>{z(`${b.gong.zhi} ${b.gong.ci}`)} · {z(b.house)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs-note">{t("cycle.qzNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

export function CycleCard({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const tx = useMemo(() => castTaixuan(chart.input), [chart]);
  const maya = useMemo(() => castMaya(chart.input.year, chart.input.month, chart.input.day), [chart]);
  const huangji = useMemo(() => castHuangji(chart.input), [chart]);
  const hour = useMemo(() => castPlanetaryHour(chart.input), [chart]);
  const sky = useMemo(() => castEphemeris(chart.input), [chart]);
  const heluo = useMemo(() => castHeluo(chart.input), [chart]);
  const heluoCls = useMemo(() => heluoClasses(heluo, chart.input), [heluo, chart]);
  const luck = useMemo(() => heluoJinsuoLuck(heluo, chart.bazi.daYun, new Date().getFullYear()), [heluo, chart]);
  const qizheng = useMemo(() => castQizheng(chart.input), [chart]);
  return (
    <div className="card viz xs">
      <p className="xs-sub">{t("cycle.intro")}</p>
      <Taixuan r={tx} solar={chart.meta.trueSolarTimeApplied} />
      <Maya r={maya} />
      <Huangji r={huangji} solar={chart.meta.trueSolarTimeApplied} />
      <PlanetaryHour r={hour} solar={chart.meta.trueSolarTimeApplied} />
      <Sky r={sky} />
      <Heluo r={heluo} c={heluoCls} luck={luck} solar={chart.meta.trueSolarTimeApplied} />
      <Liuren chart={chart} solar={chart.meta.trueSolarTimeApplied} />
      <Qizheng r={qizheng} />
    </div>
  );
}
