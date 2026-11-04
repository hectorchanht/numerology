"use client";

import { useMemo, useRef } from "react";
import { castCrossSystem, type ChartResult, type KameaResult } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { crossRows, luoshuMarks, LUOSHU, type CrossRow, type LuoshuSystem } from "@/lib/crossView";
import { FloatingCard, useFloatPopup } from "@/lib/floatPopup";

/*
 * 多體系對照卡:全部由引擎確定性計算,零 AI。
 * 三塊:洛書九宮(三種標記)、對照矩陣(關係 / 層級 / 出處 / 步驟)、行星幻方。
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

function CitePop({ row }: { row: CrossRow }) {
  const { t } = useLocale();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const { open, setOpen, floatingRef, floatingStyles } = useFloatPopup(anchorRef);
  const { work, author, year, locator } = row.cite;
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
            <span className="xs-wx">{r.wuxing}{r.bridge ? <small>({r.bridge})</small> : null}</span>
            <span className="xs-rel"><span aria-hidden="true">{REL_ICON[r.relation]}</span>{t(`cross.rel.${r.relation}` as TKey)}</span>
          </div>
          <div className="xs-meta">
            <span className={`xs-tier tier-${r.tier}`}>{t(`cross.tier.${r.tier}` as TKey)}</span>
            <span className="xs-basis">{t(`cross.basis.${r.dateBasis}` as TKey)}</span>
            <CitePop row={r} />
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
  const planet = t(`cross.planet.${k.planet}` as TKey);
  const vars = { planet, n: k.order, line: k.lineSum, total: k.total };
  const label = t("cross.kameaAria", {
    ...vars,
    marks: k.marks.map((m) => `${t(m.system === "lifepath" ? "cross.mkLp" : "cross.mkYear")} ${m.value}`).join("、") || "-",
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
      <h3 className="xs-h">{t("cross.matrix")}</h3>
      <Matrix rows={rows} />
      <p className="xs-note">{t("cross.bridge")}</p>
      <h3 className="xs-h">{t("cross.kamea")}</h3>
      <Kamea k={r.kamea} />
    </div>
  );
}
