"use client";

import type { BaziChart, ZiweiChart } from "@numerology/engine";
import { useLocale, type TKey } from "@/lib/i18n";

/** 中宫:八字四柱 + 紫微基本信息。 */
export function BaziTable({ bazi, ziwei }: { bazi: BaziChart; ziwei: ZiweiChart }) {
  const { t } = useLocale();
  const P = bazi.fourPillars;
  const cols: { labelKey: TKey; p: (typeof P)["year"]; day?: boolean }[] = [
    { labelKey: "baziT.colYear", p: P.year },
    { labelKey: "baziT.colMonth", p: P.month },
    { labelKey: "baziT.colDay", p: P.day, day: true },
    { labelKey: "baziT.colHour", p: P.hour },
  ];
  return (
    <>
      <table className="bazi">
        <thead>
          <tr>{cols.map((c) => <th key={c.labelKey}>{t(c.labelKey)}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((c) => (
              <td key={c.labelKey}>
                <div className={`gz ${c.day ? "daymaster" : ""}`}>{c.p.ganZhi}</div>
              </td>
            ))}
          </tr>
          <tr>
            {cols.map((c) => (
              <td key={c.labelKey} className="muted" style={{ fontSize: "0.7rem" }}>
                {c.day ? t("baziT.colDayMaster") : c.p.shiShenGan}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div className="kv"><span className="k">{t("baziT.kvDayMaster")}</span><span>{bazi.dayMaster}（{bazi.dayWuXing}）· {t("baziT.yueling")} {bazi.monthBranch}</span></div>
        <div className="kv"><span className="k">{t("baziT.kvTiaohou")}</span><span>{bazi.tiaohou.useGods.join("、")}{bazi.tiaohou.reviewed ? "" : t("baziT.pending")}</span></div>
        <div className="kv"><span className="k">{t("baziT.kvSoulBody")}</span><span>{ziwei.soulPalaceBranch} / {ziwei.bodyPalaceBranch} · {ziwei.fiveElementsClass}</span></div>
        <div className="kv"><span className="k">{t("baziT.kvSoulLord")}</span><span>{ziwei.soul} · {t("baziT.kvBodyLord")} {ziwei.body}</span></div>
      </div>
    </>
  );
}
