"use client";

import { GEMATRIA_RELATIONS, LULU, NICOMACHUS, TIMAEUS, type Cite } from "@numerology/knowledge";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { latexPlain, perfectNumbers, pythagoreanComma } from "@/lib/loreView";
import { CitePop } from "@/components/CrossSystemCard";
import { GroupTabs } from "@/components/GroupTabs";
import { STUDY_TABS } from "@/lib/navGroups";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/*
 * 學院「數與和諧」:Timaeus 世界靈魂、十二律三分損益、Nicomachus 形數與完全數、正多面體、Fideler 數值關係。
 * 全部數值由知識庫資料即場重算(原則 13),圖附文字替代(原則 14)。
 */

function Meta({ tier, cites }: { tier: string; cites: Cite[] }) {
  const { t } = useLocale();
  return (
    <div className="xs-meta">
      <span className={`xs-tier tier-${tier}`}>{t(`cross.tier.${tier}` as TKey)}</span>
      {cites.map((c, i) => <CitePop key={i} cite={c} />)}
    </div>
  );
}

/* λ 圖:頂點 1,左臂倍數、右臂三倍。 */
function Lambda() {
  const { t } = useLocale();
  const W = 260, H = 200, top = 22, gap = 52;
  const [, ...dbl] = TIMAEUS.worldSoul.double;
  const [, ...tri] = TIMAEUS.worldSoul.triple;
  const node = (x: number, y: number, v: number, k: string) => (
    <g key={k}>
      <circle className="hm-node" cx={x} cy={y} r={15} />
      <text className="cy-axis" x={x} y={y} fontSize={12}>{v}</text>
    </g>
  );
  const pos = (side: -1 | 1, i: number) => ({ x: W / 2 + side * (i + 1) * 34, y: top + (i + 1) * gap });
  const label = t("harmony.lambdaAria");
  return (
    <svg className="xs-grid hm-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      <line className="hm-edge" x1={W / 2} y1={top} x2={pos(-1, 2).x} y2={pos(-1, 2).y} />
      <line className="hm-edge" x1={W / 2} y1={top} x2={pos(1, 2).x} y2={pos(1, 2).y} />
      {node(W / 2, top, 1, "apex")}
      {dbl.map((v, i) => node(pos(-1, i).x, pos(-1, i).y, v, `d${v}`))}
      {tri.map((v, i) => node(pos(1, i).x, pos(1, i).y, v, `t${v}`))}
    </svg>
  );
}

const BW = 343, BH = 180, BL = 4, BB = 36;

/* 十二律按相生次序排列,柱高 = 律數 / 81。 */
function LuluBars() {
  const { t } = useLocale();
  const { z } = useScript();
  const pipes = LULU.huainanzi.pipes;
  const gw = (BW - BL) / pipes.length, ph = BH - BB - 14;
  const rows = pipes.map((p) => `${z(p.pipe)} ${p.value}`).join(";");
  const label = t("harmony.luluAria", { rows });
  return (
    <svg className="xs-grid sci-chart" viewBox={`0 0 ${BW} ${BH}`} role="img" aria-label={label}>
      <title>{label}</title>
      {pipes.map((p, i) => {
        const h = (ph * p.value) / 81, x = BL + gw * i;
        return (
          <g key={p.pipe}>
            <rect className="hm-bar" x={x + 3} y={14 + ph - h} width={gw - 6} height={h} rx={2} />
            <text className="cy-axis" x={x + gw / 2} y={8 + ph - h} fontSize={9}>{p.value}</text>
            <text className="cy-axis" x={x + gw / 2} y={BH - BB + 10} fontSize={10}>{z(p.pipe[0]!)}</text>
            <text className="cy-axis" x={x + gw / 2} y={BH - BB + 26} fontSize={9}>{p.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* 三角形數與平方數頭五項點陣。 */
function Dots({ sides }: { sides: 3 | 4 }) {
  const { t } = useLocale();
  const item = NICOMACHUS.figurate.items.find((f) => f.sides === sides)!;
  const n = 5, d = 9, gap = 14;
  const blocks = Array.from({ length: n }, (_, k) => {
    const pts: [number, number][] = [];
    for (let r = 0; r <= k; r++) for (let c = 0; c < (sides === 3 ? r + 1 : k + 1); c++) pts.push([c, r]);
    return pts;
  });
  let x0 = 0;
  const label = t("harmony.figAria", { name: item.name, seq: item.seq.slice(0, n).join(", ") });
  return (
    <svg className="xs-grid hm-chart" viewBox={`0 0 ${blocks.reduce((a, b, k) => a + (k + 1) * d + gap, 0)} ${n * d + 18}`} role="img" aria-label={label}>
      <title>{label}</title>
      {blocks.map((pts, k) => {
        const ox = x0;
        x0 += (k + 1) * d + gap;
        return (
          <g key={k}>
            {pts.map(([c, r], i) => <circle key={i} className="hm-dot" cx={ox + c * d + d / 2} cy={r * d + d / 2} r={3} />)}
            <text className="cy-axis" x={ox + ((k + 1) * d) / 2} y={n * d + 10} fontSize={10}>{item.seq[k]}</text>
          </g>
        );
      })}
    </svg>
  );
}

const WX_ROW = ["fire", "air", "water", "earth"];

export default function HarmonyTool() {
  const { locale, t } = useLocale();
  const { z } = useScript();
  const comma = pythagoreanComma();
  return (
    <>
      <GroupTabs links={STUDY_TABS} label={yjT("nav.group.study", locale as YijingLocale)} />
      <h1 className="large">{t("harmony.title")}</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>{t("harmony.intro")}</p>

      <div className="card viz xs">
        <h2 className="xs-h">{t("harmony.lambda")}</h2>
        <Meta tier="classical" cites={[{ work: "Timaeus", author: "Plato", locator: `${TIMAEUS.worldSoul.stephanus}(Jowett 1871)` }]} />
        <Lambda />
        <p className="xs-note">{t("harmony.lambdaNote")}</p>
        <p className="xs-note">{t("harmony.filled")}:{TIMAEUS.worldSoul.filledDouble.join(" · ")}</p>
      </div>

      <div className="card viz xs">
        <h2 className="xs-h">{t("harmony.lulu")}</h2>
        <Meta tier="classical" cites={[{ work: "淮南子·天文訓" }, { work: "呂氏春秋·音律" }, { work: "管子·地員" }]} />
        <LuluBars />
        <p className="cy-val">{t("harmony.comma", { c: comma.ratio.toFixed(5), cents: comma.cents.toFixed(2) })}</p>
        <p className="xs-note">{z(t("harmony.luluNote"))}</p>
      </div>

      <div className="card viz xs">
        <h2 className="xs-h">{t("harmony.figurate")}</h2>
        <Meta tier="classical" cites={[{ work: "Introduction to Arithmetic", author: "Nicomachus", year: 1926, locator: "D'Ooge 英譯,頁 209、243–247" }]} />
        <Dots sides={3} />
        <Dots sides={4} />
        <p className="xs-note">{t("harmony.figurateNote")}</p>
        <h3 className="xs-h">{t("harmony.perfect")}</h3>
        <div className="bazi-detail-wrap">
          <table className="bazi-detail">
            <thead><tr>{(["harmony.colN", "harmony.colPerfect", "harmony.colDigits", "harmony.colLast"] as const).map((k) => <th key={k} className="colhead">{t(k)}</th>)}</tr></thead>
            <tbody>
              {perfectNumbers().map((p) => (
                <tr key={p.n}><th className="rowlabel">{p.n}</th><td>{p.value.toLocaleString("en-US")}</td><td>{p.digits}</td><td>{p.last}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xs-note">{t("harmony.perfectNote")}</p>
      </div>

      <div className="card viz xs">
        <h2 className="xs-h">{t("harmony.solids")}</h2>
        <Meta tier="classical" cites={[{ work: "Timaeus", author: "Plato", locator: `${TIMAEUS.solids.stephanus}(Jowett 1871)` }]} />
        <div className="bazi-detail-wrap">
          <table className="bazi-detail">
            <thead><tr>{(["harmony.colElement", "harmony.colSolid", "harmony.colFaces", "harmony.colFace"] as const).map((k) => <th key={k} className="colhead">{t(k)}</th>)}</tr></thead>
            <tbody>
              {WX_ROW.map((el) => {
                const s = TIMAEUS.solids.items.find((x) => x.element === el)!;
                return <tr key={el}><th className="rowlabel">{t(`harmony.el.${s.element}` as TKey)}</th><td>{t(`harmony.solid.${s.solid}` as TKey)}</td><td>{s.faces}</td><td>{t(s.faceShape === "square" ? "harmony.face.square" : "harmony.face.triangle")}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="xs-note"><b>{t("harmony.wuxing")}</b>:{t("harmony.wuxingList")}</p>
        <p className="xs-note">{t("harmony.solidsNote")}</p>
      </div>

      <div className="card viz xs">
        <h2 className="xs-h">{t("harmony.gematria")}</h2>
        <Meta tier="scholarly" cites={[{ work: "Jesus Christ, Sun of God", author: "David Fideler", year: 1993 }]} />
        <div className="bazi-detail-wrap">
          <table className="bazi-detail">
            <thead><tr>{(["harmony.colRelation", "harmony.colTarget", "harmony.colTol", "harmony.colTerms"] as const).map((k) => <th key={k} className="colhead">{t(k)}</th>)}</tr></thead>
            <tbody>
              {GEMATRIA_RELATIONS.map((r) => (
                <tr key={r.id}>
                  <td>{latexPlain(r.latex)}</td>
                  <td>{r.target}</td>
                  <td>{r.tol ? `±${r.tol}` : "0"}</td>
                  <td>{r.terms?.join("、") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xs-note">{t("harmony.gematriaNote")}</p>
      </div>
    </>
  );
}
