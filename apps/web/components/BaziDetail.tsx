"use client";

import type { BaziChart, Pillar } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";

const COLS: { key: keyof BaziChart["fourPillars"]; labelKey: TKey }[] = [
  { key: "year", labelKey: "bazi.yearPillar" },
  { key: "month", labelKey: "bazi.monthPillar" },
  { key: "day", labelKey: "bazi.dayPillar" },
  { key: "hour", labelKey: "bazi.hourPillar" },
];

const ROWS: { labelKey: TKey; render: (p: Pillar, d: boolean, t: (k: TKey) => string, z: (s: string) => string) => React.ReactNode }[] = [
  { labelKey: "bazi.rowMain", render: (p, d, t, z) => (
      <span className="shishen">{d ? t("bazi.self") : z(p.shiShenGan)}</span>
    ) },
  { labelKey: "bazi.rowGan", render: (p) => <span className="big-gan">{p.gan}</span> },
  { labelKey: "bazi.rowZhi", render: (p) => <span className="big-zhi">{p.zhi}</span> },
  { labelKey: "bazi.rowHidden", render: (p, _d, _t, z) => (
      <div className="canggan">
        {p.hideGan.map((g, i) => (
          <div key={g}>
            <span className="cg-gan">{g}</span>
            <span className="cg-ss">{z(p.shiShenZhi[i] ?? "")}</span>
          </div>
        ))}
      </div>
    ) },
  { labelKey: "bazi.rowXingyun", render: (p, _d, _t, z) => z(p.xingYun) },
  { labelKey: "bazi.rowZizuo", render: (p, _d, _t, z) => z(p.ziZuo) },
  { labelKey: "bazi.rowXunkong", render: (p, _d, _t, z) => z(p.xunKong) },
  { labelKey: "bazi.rowNayin", render: (p, _d, _t, z) => <span className="muted">{z(p.naYin)}</span> },
  { labelKey: "bazi.rowShensha", render: (p, _d, _t, z) => (
      <div className="shensha">
        {p.shenSha.length ? p.shenSha.map((s) => <span key={s}>{z(s)}</span>) : <span className="muted">—</span>}
      </div>
    ) },
];

export function BaziDetail({ bazi }: { bazi: BaziChart }) {
  const { t } = useLocale();
  const { z } = useScript();
  const ps = COLS.map((c) => bazi.fourPillars[c.key]);
  return (
    <>
      <h2 className="group-title">{t("bazi.title")}</h2>
      <div className="card flush">
        <div className="bazi-detail-wrap">
          <table className="bazi-detail">
            <thead>
              <tr>
                <th></th>
                {COLS.map((c, i) => <th key={c.key} className={`colhead${i === 2 ? " day" : ""}`}>{t(c.labelKey)}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.labelKey}>
                  <th className="rowlabel">{t(r.labelKey)}</th>
                  {ps.map((p, i) => <td key={i}>{r.render(p, i === 2, t, z)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="note">{t("bazi.footnote")}</p>
    </>
  );
}
