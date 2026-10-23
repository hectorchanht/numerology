"use client";

import type { BaziChart } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";

/** 八字四柱卡(五行分佈同重點已移去命盤頂部嘅 ChartSummary / WuxingChart)。 */
export function BaziTable({ bazi }: { bazi: BaziChart }) {
  const { t } = useLocale();
  const { z } = useScript();
  const P = bazi.fourPillars;
  const cols: { labelKey: TKey; p: (typeof P)["year"]; day?: boolean }[] = [
    { labelKey: "bazi.yearPillar", p: P.year },
    { labelKey: "bazi.monthPillar", p: P.month },
    { labelKey: "bazi.dayPillar", p: P.day, day: true },
    { labelKey: "bazi.hourPillar", p: P.hour },
  ];

  return (
    <>
      <h2 className="group-title">{t("chart.pillars")}</h2>
      <div className="pillars">
        {cols.map((c) => (
          <div className={`pillar${c.day ? " day" : ""}`} key={c.labelKey}>
            <div className="h">{t(c.labelKey)}</div>
            <div className="gz"><span>{c.p.gan}</span><span>{c.p.zhi}</span></div>
            <div className="ss">{c.day ? t("baziT.colDayMaster") : z(c.p.shiShenGan)}</div>
            <div className="ny">{z(c.p.naYin)}</div>
          </div>
        ))}
      </div>

    </>
  );
}
