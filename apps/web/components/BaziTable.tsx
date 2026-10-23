"use client";

import type { BaziChart, ZiweiChart } from "@numerology/engine";
import { useLocale, type TKey } from "@/lib/i18n";
import { WUXING, wuxingCount } from "@/lib/ganzhi";

/** 八字概覽:四柱卡 + 五行分佈 + 重點(日主/調候/命身/命主)。 */
export function BaziTable({ bazi, ziwei }: { bazi: BaziChart; ziwei: ZiweiChart }) {
  const { t } = useLocale();
  const P = bazi.fourPillars;
  const cols: { labelKey: TKey; p: (typeof P)["year"]; day?: boolean }[] = [
    { labelKey: "bazi.yearPillar", p: P.year },
    { labelKey: "bazi.monthPillar", p: P.month },
    { labelKey: "bazi.dayPillar", p: P.day, day: true },
    { labelKey: "bazi.hourPillar", p: P.hour },
  ];
  const wx = wuxingCount(cols.map((c) => c.p));
  const max = Math.max(4, ...WUXING.map((k) => wx[k]));
  const top = Math.max(...WUXING.map((k) => wx[k]));

  return (
    <>
      <h2 className="group-title">{t("chart.pillars")}</h2>
      <div className="pillars">
        {cols.map((c) => (
          <div className={`pillar${c.day ? " day" : ""}`} key={c.labelKey}>
            <div className="h">{t(c.labelKey)}</div>
            <div className="gz"><span>{c.p.gan}</span><span>{c.p.zhi}</span></div>
            <div className="ss">{c.day ? t("baziT.colDayMaster") : c.p.shiShenGan}</div>
            <div className="ny">{c.p.naYin}</div>
          </div>
        ))}
      </div>

      <h2 className="group-title">{t("chart.wuxing")}</h2>
      <div className="card wx">
        {WUXING.map((k) => (
          <div className={`wx-row${wx[k] === top && top > 0 ? " hi" : ""}`} key={k}>
            <span>{k}</span>
            <div className="wx-bar"><i style={{ width: `${(wx[k] / max) * 100}%` }} /></div>
            <span className="n">{wx[k]}</span>
          </div>
        ))}
      </div>

      <h2 className="group-title">{t("chart.keyPoints")}</h2>
      <div className="list">
        <div className="row plain">
          <span className="lbl">{t("baziT.kvDayMaster")}</span>
          <span className="val">{bazi.dayMaster}（{bazi.dayWuXing}）· {t("baziT.yueling")} {bazi.monthBranch}</span>
        </div>
        <div className="row plain">
          <span className="lbl">{t("baziT.kvTiaohou")}</span>
          <span className="val">{bazi.tiaohou.useGods.join("、")}{bazi.tiaohou.reviewed ? "" : t("baziT.pending")}</span>
        </div>
        <div className="row plain">
          <span className="lbl">{t("baziT.kvSoulBody")}</span>
          <span className="val">{ziwei.soulPalaceBranch} / {ziwei.bodyPalaceBranch} · {ziwei.fiveElementsClass}</span>
        </div>
        <div className="row plain">
          <span className="lbl">{t("baziT.kvSoulLord")}</span>
          <span className="val">{ziwei.soul} · {t("baziT.kvBodyLord")} {ziwei.body}</span>
        </div>
      </div>
    </>
  );
}
