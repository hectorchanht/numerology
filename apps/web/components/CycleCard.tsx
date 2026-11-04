"use client";

import { useMemo } from "react";
import { castMaya, castTaixuan, MAYA_META, TZOLKIN_DAY_NAMES, type ChartResult, type MayaResult, type TaixuanResult } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { taixuanGrid, tzolkinCell } from "@/lib/cycleView";
import { CitePop } from "@/components/CrossSystemCard";

/*
 * 時間週期卡:太玄(81 首 9×9 格)與瑪雅曆(Tzolk'in 13×20 格、長紀曆、Haab)。
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

export function CycleCard({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const tx = useMemo(() => castTaixuan(chart.input), [chart]);
  const maya = useMemo(() => castMaya(chart.input.year, chart.input.month, chart.input.day), [chart]);
  return (
    <div className="card viz xs">
      <p className="xs-sub">{t("cycle.intro")}</p>
      <Taixuan r={tx} solar={chart.meta.trueSolarTimeApplied} />
      <Maya r={maya} />
    </div>
  );
}
