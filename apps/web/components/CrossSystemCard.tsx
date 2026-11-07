"use client";

import { useMemo, useRef } from "react";
import { castCrossSystem, type ChartResult, type FuyiResult, type KameaResult } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { crossRows, luoshuMarks, LUOSHU, type CrossRow, type LuoshuSystem } from "@/lib/crossView";
import { FloatingCard, useFloatPopup } from "@/lib/floatPopup";

/*
 * 多體系對照卡:全部由引擎確定性計算,零 AI。
 * 四塊:洛書九宮(三種標記)、扶抑喜忌(第二軸)、對照矩陣(關係 / 喜忌 / 層級 / 出處 / 步驟)、行星幻方。
 * 舊歷史紀錄只存 chart,於此即場重算,同樣可顯示。
 */

const CELL = 60;
const REL_ICON: Record<CrossRow["relation"], string> = { anchor: "◆", same: "✓", sheng: "↻", ke: "≠" };

/** 標記:年九星 = 實心圓、月九星 = 虛線圓、生命靈數 = 方框。 */
function Mark({ system, cx, cy, r }: { system: LuoshuSystem | "ninestar"; cx: number; cy: number; r: number }) {
  if (system === "lifepath") {
    return <rect className="xs-mk xs-mk-lp" x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.2} />;
  }
  return <circle className={`xs-mk ${system === "ninestar-month" ? "xs-mk-month" : "xs-mk-year"}`} cx={cx} cy={cy} r={r} />;
}

function Legend() {
  const { t } = useLocale();
  return (
    <div className="viz-legend" aria-hidden="true">
      <span><i className="sw xs-sw-year" />{t("cross.mkYear")}</span>
      <span><i className="sw xs-sw-month" />{t("cross.mkMonth")}</span>
      <span><i className="sw xs-sw-lp" />{t("cross.mkLp")}</span>
    </div>
  );
}

function Luoshu({ marks }: { marks: ReturnType<typeof luoshuMarks> }) {
  const { t } = useLocale();
  const v = (s: LuoshuSystem) => marks.find((m) => m.system === s)?.value ?? "-";
  const label = t("cross.luoshuAria", { y: v("ninestar-year"), m: v("ninestar-month"), lp: v("lifepath") });
  const size = CELL * 3;
  return (
    <svg className="xs-grid xs-luoshu" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <title>{label}</title>
      {LUOSHU.map((row, r) => row.map((n, c) => (
        <g key={n}>
          <rect className="xs-cell" x={c * CELL} y={r * CELL} width={CELL} height={CELL} />
          {/* 同格多個標記時按序縮小半徑,互不遮蓋。 */}
          {marks.filter((m) => m.row === r && m.col === c).map((m, i) => (
            <Mark key={m.system} system={m.system} cx={c * CELL + CELL / 2} cy={r * CELL + CELL / 2} r={22 - i * 5} />
          ))}
          <text className="xs-num" x={c * CELL + CELL / 2} y={r * CELL + CELL / 2} fontSize={20}>{n}</text>
        </g>
      )))}
    </svg>
  );
}

export function CitePop({ cite }: { cite: CrossRow["cite"] }) {
  const { t } = useLocale();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const { open, setOpen, floatingRef, floatingStyles } = useFloatPopup(anchorRef);
  const { work, author, year, locator } = cite;
  return (
    <>
      <button ref={anchorRef} type="button" className="xs-cite" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t("cross.source")}
      </button>
      {open ? (
        <FloatingCard floatingRef={floatingRef} floatingStyles={floatingStyles}>
          <div>{work}</div>
          {author || year ? <div>{[author, year].filter(Boolean).join(", ")}</div> : null}
          {locator ? <div style={{ color: "var(--label-2)" }}>{locator}</div> : null}
        </FloatingCard>
      ) : null}
    </>
  );
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);
/** 評分條刻度 ±10;超出者貼邊顯示,數值仍見文字與步驟。 */
const FY_MAX = 10;
const FY_W = 300;
const FY_H = 44;
const fyX = (v: number) => ((Math.max(-FY_MAX, Math.min(FY_MAX, v)) + FY_MAX) / (FY_MAX * 2)) * FY_W;

function Fuyi({ f }: { f: FuyiResult }) {
  const { t } = useLocale();
  const { z } = useScript();
  const v = t(`cross.fuyiVerdict.${f.verdict}` as TKey);
  const s = signed(f.score);
  const label = t("cross.fuyiAria", { s, v });
  const x0 = fyX(0);
  const x = fyX(f.score);
  return (
    <>
      <p className="xs-sub">{t("cross.fuyiSub")}</p>
      <p className="xs-fy-verdict">{t("cross.fuyiScore", { v, s })}</p>
      <svg className="xs-fy" viewBox={`0 0 ${FY_W} ${FY_H}`} role="img" aria-label={label}>
        <title>{label}</title>
        <rect className="xs-fy-track" x={0} y={8} width={FY_W} height={12} rx={6} />
        <rect className="xs-fy-band" x={fyX(-1.5)} y={8} width={fyX(1.5) - fyX(-1.5)} height={12} />
        <line className="xs-fy-band-tick" x1={fyX(-1.5)} x2={fyX(-1.5)} y1={5} y2={23} />
        <line className="xs-fy-band-tick" x1={fyX(1.5)} x2={fyX(1.5)} y1={5} y2={23} />
        <rect className="xs-fy-bar" x={Math.min(x0, x)} y={8} width={Math.abs(x - x0)} height={12} />
        <line className="xs-fy-tick" x1={x0} x2={x0} y1={4} y2={24} />
        <circle className="xs-fy-dot" cx={x} cy={14} r={7} />
        <text className="xs-fy-lbl" x={0} y={38}>{t("cross.fuyiVerdict.weak")}</text>
        <text className="xs-fy-lbl" x={x0} y={38} textAnchor="middle">0</text>
        <text className="xs-fy-lbl" x={FY_W} y={38} textAnchor="end">{t("cross.fuyiVerdict.strong")}</text>
      </svg>
      {f.verdict === "neutral" ? (
        <p className="xs-sub">{t("cross.fuyiNeutral")}</p>
      ) : (
        <>
          <p className="xs-sub">{z(t("cross.fuyiFav", { f: f.favorable.join("、"), u: f.unfavorable.join("、") }))}</p>
          <p className="xs-note">{t("cross.fuyiBase", { nf: f.favorable.length, nu: f.unfavorable.length })}</p>
        </>
      )}
      {f.possibleCong ? <p className="xs-warn" role="note">{t("cross.fuyiCong")}</p> : null}
      <div className="xs-meta">
        <span className={`xs-tier tier-${f.tier}`}>{t(`cross.tier.${f.tier}` as TKey)}</span>
        <span className="xs-basis">{t("cross.fuyiTier")}</span>
        <CitePop cite={f.cite} />
      </div>
      <details className="xs-steps">
        <summary>{t("cross.steps")}</summary>
        <ol>{f.steps.map((st, i) => <li key={i}>{z(st)}</li>)}</ol>
      </details>
    </>
  );
}

function Matrix({ rows }: { rows: CrossRow[] }) {
  const { t } = useLocale();
  const { z } = useScript();
  return (
    <ul className="xs-matrix">
      {rows.map((r) => (
        <li key={r.system} className={`xs-row rel-${r.relation}`}>
          <div className="xs-head">
            <span className="xs-sys">{t(`cross.sys.${r.system}` as TKey)}</span>
            <span className="xs-val">{z(r.value)}</span>
            <span className="xs-wx">{z(r.wuxing)}{r.bridge ? <small>({z(r.bridge)})</small> : null}</span>
            <span className="xs-rel"><span aria-hidden="true">{REL_ICON[r.relation]}</span>{t(`cross.rel.${r.relation}` as TKey)}</span>
          </div>
          <div className="xs-meta">
            {r.fit === "anchor" ? null : (
              <span className={`xs-fit fit-${r.fit}`}>
                {t("cross.fitQ")} <b>{t(`cross.fit.${r.fit}` as TKey)}</b>
              </span>
            )}
            <span className={`xs-tier tier-${r.tier}`}>{t(`cross.tier.${r.tier}` as TKey)}</span>
            <span className="xs-basis">{t(`cross.basis.${r.dateBasis}` as TKey)}</span>
            <CitePop cite={r.cite} />
          </div>
          <details className="xs-steps">
            <summary>{t("cross.steps")}</summary>
            <ol>{r.steps.map((s, i) => <li key={i}>{z(s)}</li>)}</ol>
          </details>
        </li>
      ))}
    </ul>
  );
}

function Kamea({ k }: { k: KameaResult }) {
  const { t } = useLocale();
  const { z } = useScript();
  const planet = t(`cross.planet.${k.planet}` as TKey);
  const vars = { planet, n: k.order, line: k.lineSum, total: k.total };
  const label = t("cross.kameaAria", {
    ...vars,
    marks: k.marks.map((m) => `${t(m.system === "lifepath" ? "cross.mkLpPlain" : "cross.mkYear")} ${m.value}`).join("、") || "-",
  });
  const size = CELL * k.order;
  const fs = Math.max(14, 30 - k.order * 2);
  return (
    <>
      <p className="xs-sub">{t("cross.kameaSub", { ...vars, wd: t("cross.wd").split("|")[k.weekday] ?? "" })}</p>
      <svg className="xs-grid xs-kamea" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <title>{label}</title>
        {k.rows.map((row, r) => row.map((n, c) => {
          const hits = k.marks.filter((m) => m.row === r && m.col === c);
          return (
            <g key={n}>
              <rect className={`xs-cell${hits.length ? " hit" : ""}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} />
              {hits.map((m, i) => (
                <Mark key={m.system} system={m.system} cx={c * CELL + CELL / 2} cy={r * CELL + CELL / 2} r={24 - i * 5} />
              ))}
              <text className="xs-num" x={c * CELL + CELL / 2} y={r * CELL + CELL / 2} fontSize={fs}>{n}</text>
            </g>
          );
        }))}
      </svg>
      <h3 className="xs-h">{t("cross.kameaNames")}</h3>
      <ul className="xs-matrix">
        {k.names.map((x, i) => (
          <li key={i} className="xs-row">
            <div className="xs-head">
              <span className="xs-sys">{t(`cross.role.${x.role}` as TKey)}</span>
              <span className="xs-val">{x.name} <span lang="he" dir="rtl">{x.hebrew}</span></span>
              <span className="xs-note">{x.value}{x.ref ? ` ${t(`cross.ref.${x.ref}` as TKey)}` : ""}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="xs-meta">
        <span className="xs-tier tier-classical">{t("cross.tier.classical")}</span>
        <CitePop cite={k.namesCite} />
      </div>
      <p className="xs-note">{t("cross.kameaNamesNote")}</p>
      <details className="xs-steps">
        <summary>{t("cross.steps")}</summary>
        <ol>{k.steps.map((s, i) => <li key={i}>{z(s)}</li>)}</ol>
      </details>
    </>
  );
}

export function CrossSystemCard({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const r = useMemo(() => castCrossSystem(chart), [chart]);
  const rows = useMemo(() => crossRows(r), [r]);
  const marks = useMemo(() => luoshuMarks(r), [r]);
  return (
    <div className="card viz xs">
      <p className="xs-sub">{t("cross.intro")}</p>
      <h3 className="xs-h">{t("cross.luoshu")}</h3>
      <Legend />
      <Luoshu marks={marks} />
      <h3 className="xs-h">{t("cross.fuyi")}</h3>
      <Fuyi f={r.fuyi} />
      <h3 className="xs-h">{t("cross.matrix")}</h3>
      <Matrix rows={rows} />
      <p className="xs-note">{t("cross.bridge")}</p>
      <h3 className="xs-h">{t("cross.kamea")}</h3>
      <Kamea k={r.kamea} />
    </div>
  );
}
