"use client";

import type { ChartResult } from "@numerology/engine";
import { useLocale, type TKey } from "@/lib/i18n";
import {
  WUXING, wuxingCount, wuxingHiddenCount, ganWuXing, currentLuckStep, useGodSignal, yearGanZhi,
  type UseGodSignal,
} from "@/lib/ganzhi";

/*
 * 命盤視覺摘要:全部由引擎已排好嘅確定性數據計出,零 AI 調用。
 * 純 inline SVG + CSS 變數(深淺兩套主題自動跟),無第三方圖表庫。
 * 條形用 SVG 百分比長度,任何闊度都清晰、文字唔會被 viewBox 縮放。
 */

const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

/** 五行分佈:每行一條堆疊條 = 天干地支(實色)+ 藏干(淡色),日主五行加標記。 */
export function WuxingChart({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const ps = PILLAR_KEYS.map((k) => chart.bazi.fourPillars[k]);
  const vis = wuxingCount(ps);
  const hid = wuxingHiddenCount(ps);
  const max = Math.max(4, ...WUXING.map((k) => vis[k] + hid[k]));
  const top = Math.max(...WUXING.map((k) => vis[k]));
  const dm = ganWuXing(chart.bazi.dayMaster);

  return (
    <div className="card viz wxc">
      <div className="viz-legend" aria-hidden="true">
        <span><i className="sw sw-vis" />{t("viz.wxVisible")}</span>
        <span><i className="sw sw-hid" />{t("viz.wxHidden")}</span>
      </div>
      {WUXING.map((k) => {
        const v = (vis[k] / max) * 100;
        const h = (hid[k] / max) * 100;
        const label = t("viz.wxRowAria", { el: k, v: vis[k], h: hid[k] });
        return (
          <div className={`wxc-row${vis[k] === top && top > 0 ? " hi" : ""}`} key={k}>
            <span className="wxc-el">
              {k}
              {k === dm ? <span className="wxc-dm">{t("baziT.kvDayMaster")}</span> : null}
            </span>
            <svg className="wxc-bar" role="img" aria-label={label} preserveAspectRatio="none">
              <title>{label}</title>
              <rect className="track" x="0" y="0" width="100%" height="100%" rx="4" />
              {/* 先畫總長(淡),再疊天干地支(實):兩段圓角唔會互相咬缺口。 */}
              {hid[k] > 0 ? <rect className="seg-hid" x="0" y="0" width={`${v + h}%`} height="100%" rx="4" /> : null}
              {vis[k] > 0 ? <rect className="seg-vis" x="0" y="0" width={`${v}%`} height="100%" rx="4" /> : null}
            </svg>
            <span className="wxc-n">
              {vis[k]}
              {hid[k] ? <span className="wxc-h">+{hid[k]}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 命盤摘要卡:日主/月令、調候用神、五行旺缺、紫微命宮、五行局、當前大運——一眼睇晒。 */
export function ChartSummary({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const { bazi, ziwei } = chart;
  const ps = PILLAR_KEYS.map((k) => bazi.fourPillars[k]);
  const vis = wuxingCount(ps);
  const hid = wuxingHiddenCount(ps);
  const top = Math.max(...WUXING.map((k) => vis[k]));
  const strongest = WUXING.filter((k) => vis[k] === top);
  const missing = WUXING.filter((k) => vis[k] + hid[k] === 0);
  const soul = ziwei.palaces.find((p) => p.isSoulPalace);
  const soulStars = soul?.majorStars.map((s) => s.name).join("、") || t("zw.noMajor");
  const now = currentLuckStep(bazi);

  const tiles: { k: TKey; v: string; sub?: string; accent?: boolean }[] = [
    { k: "baziT.kvDayMaster", v: `${bazi.dayMaster} · ${bazi.dayWuXing}`, sub: `${t("baziT.yueling")} ${bazi.monthBranch}`, accent: true },
    {
      k: "viz.useGod",
      v: bazi.tiaohou.useGods.join("、"),
      sub: bazi.tiaohou.reviewed ? t("viz.useGodSub") : t("baziT.pending"),
    },
    {
      k: "viz.wxBalance",
      v: t("viz.wxStrong", { el: strongest.join("") }),
      sub: missing.length ? t("viz.wxMissing", { el: missing.join("") }) : t("viz.wxAll"),
    },
    { k: "viz.soulStars", v: soulStars, sub: t("zw.soulBody", { a: ziwei.soulPalaceBranch, b: ziwei.bodyPalaceBranch }) },
    { k: "viz.fiveClass", v: ziwei.fiveElementsClass, sub: `${t("baziT.kvSoulLord")} ${ziwei.soul} · ${t("baziT.kvBodyLord")} ${ziwei.body}` },
    {
      k: "viz.nowLuck",
      v: now ? now.ganZhi : "—",
      sub: now ? t("fortune.ageRange", { a: now.startAge, b: now.endAge }) : t("fortune.none"),
    },
  ];

  return (
    <div className="stat-grid">
      {tiles.map((x) => (
        <div className={`stat${x.accent ? " accent" : ""}`} key={x.k}>
          <div className="stat-k">{t(x.k)}</div>
          <div className="stat-v">{x.v}</div>
          {x.sub ? <div className="stat-s">{x.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

const SIGNAL_KEY: Record<UseGodSignal, TKey> = { 2: "viz.sig2", 1: "viz.sig1", 0: "viz.sig0" };

/** 引動度三級圖例(文字 + 色塊,唔淨靠顏色)。 */
export function SignalLegend() {
  const { t } = useLocale();
  return (
    <div className="viz-legend" aria-hidden="true">
      {([2, 1, 0] as const).map((s) => (
        <span key={s}><i className={`sw sig-${s}`} />{t(SIGNAL_KEY[s])}</span>
      ))}
    </div>
  );
}

/** 大運卡內嘅細引動度計(兩格):2 = 兩格滿、1 = 一格、0 = 空。 */
export function SignalMeter({ level }: { level: UseGodSignal }) {
  const { t } = useLocale();
  return (
    <svg className={`sig-meter sig-${level}`} viewBox="0 0 30 6" role="img" aria-label={t(SIGNAL_KEY[level])}>
      <title>{t(SIGNAL_KEY[level])}</title>
      <rect className={level >= 1 ? "on" : "off"} x="0" y="0" width="14" height="6" rx="3" />
      <rect className={level >= 2 ? "on" : "off"} x="16" y="0" width="14" height="6" rx="3" />
    </svg>
  );
}

/** 流年柱狀圖:某步大運嘅逐年調候用神引動度(高度 + 顏色兩重編碼),今年加框。 */
export function YearBars({ years, useGods, thisYear }: { years: number[]; useGods: readonly string[]; thisYear: number }) {
  const { t } = useLocale();
  // 0 級都畫一截矮柱,保持基線連貫、睇得出係「有呢年但未引動」。
  const H: Record<UseGodSignal, number> = { 2: 100, 1: 60, 0: 22 };
  return (
    <div className="card viz">
      <SignalLegend />
      <div className="yb" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}>
        {years.map((y) => {
          const gz = yearGanZhi(y);
          const s = useGodSignal(gz, useGods);
          const label = `${y} ${gz} · ${t(SIGNAL_KEY[s])}`;
          return (
            <div className={`yb-col${y === thisYear ? " cur" : ""}`} key={y}>
              <svg className="yb-svg" role="img" aria-label={label} preserveAspectRatio="none">
                <title>{label}</title>
                <rect className={`sig-${s}`} x="12%" y={`${100 - H[s]}%`} width="76%" height={`${H[s]}%`} rx="4" />
              </svg>
              <span className="yb-gz">{gz}</span>
              <span className="yb-yr">{String(y).slice(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
