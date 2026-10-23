"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartResult } from "@numerology/engine";
import { useLocale } from "@/lib/i18n";
import { currentLuckStep, luckSteps, stepYears, yearGanZhi } from "@/lib/ganzhi";

/** 大運時間線(橫向捲動,當前大運高亮)+ 所選大運的逐年流年。純排盤數據,唔叫 AI。 */
export function FortuneTimeline({ chart, visible }: { chart: ChartResult; visible: boolean }) {
  const { t } = useLocale();
  const steps = luckSteps(chart.bazi);
  const thisYear = new Date().getFullYear();
  const now = currentLuckStep(chart.bazi, thisYear);
  const [picked, setPicked] = useState<number>(() => Math.max(0, now ? steps.indexOf(now) : 0));
  const stripRef = useRef<HTMLDivElement>(null);

  // 換命盤 → 重新對準當前大運。
  useEffect(() => {
    const i = now ? steps.indexOf(now) : 0;
    setPicked(Math.max(0, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  // 畫面可見時,把當前大運捲到時間線中間(只捲橫向 strip,唔郁成頁)。
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>(".dy.now");
    if (!visible || !strip || !el) return;
    strip.scrollLeft = el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2;
  }, [visible, chart]);

  const step = steps[picked];
  if (!step) return null;
  const birthYear = chart.input.year;

  return (
    <>
      {now ? (
        <>
          <h1 className="large">{t("fortune.now", { gz: now.ganZhi })}</h1>
          <p className="lede">
            {t("fortune.nowMeta", {
              from: now.startYear,
              to: now.startYear + now.endAge - now.startAge,
              a: now.startAge,
              b: now.endAge,
              n: steps.indexOf(now) + 1,
            })}
          </p>
        </>
      ) : (
        <h1 className="large">{t("fortune.none")}</h1>
      )}

      <h2 className="group-title">{t("fortune.timeline")}</h2>
      <div className="strip dayun" ref={stripRef}>
        {steps.map((d, i) => (
          <button
            key={d.startYear}
            type="button"
            className={`dy${d === now ? " now" : ""}${i === picked ? " picked" : ""}`}
            aria-pressed={i === picked}
            onClick={() => setPicked(i)}
          >
            <span className="age">{t("fortune.ageRange", { a: d.startAge, b: d.endAge })}</span>
            <span className="gz">{d.ganZhi}</span>
            <span className="yr">{d.startYear}</span>
          </button>
        ))}
      </div>
      <p className="note">{t("fortune.startLuck")}:{chart.bazi.startLuck.description}</p>

      <h2 className="group-title">{t("fortune.years", { gz: step.ganZhi })}</h2>
      <div className="list ly">
        {stepYears(step).map((y) => (
          <div className={`row plain${y === thisYear ? " cur" : ""}`} key={y}>
            <span className="yr">{y}</span>
            <span className="gz">{yearGanZhi(y)}</span>
            <span className="lbl">{t("fortune.age", { n: y - birthYear + 1 })}</span>
            {y === thisYear ? <span className="tag accent">{t("fortune.thisYear")}</span> : null}
          </div>
        ))}
      </div>
    </>
  );
}
