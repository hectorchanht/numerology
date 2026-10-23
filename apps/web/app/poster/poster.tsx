"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useScript } from "@/lib/i18n";
import { listReadings, type Reading } from "@/lib/history";
import { currentLuckStep, luckSteps, wuxingCount } from "@/lib/ganzhi";
import { go } from "@/lib/nav";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { buildPosterModel, posterFilename, POSTER_PILLARS, type PosterRow, type PosterSource } from "@/lib/poster";
import { renderPosterPng, savePosterPng } from "@/lib/posterExport";
import { Icon } from "@/components/Icon";

function Row({ r }: { r: PosterRow }) {
  return (
    <div className="poster-row">
      <span className="poster-k">{r.label}</span>
      <span className="poster-v2" style={r.accent ? { color: "var(--cinnabar)" } : undefined}>
        {r.value}
        {r.note && (
          <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
            {r.note}
          </span>
        )}
      </span>
    </div>
  );
}

/** 跟 <html data-theme> 變化(導出用色同 logo 跟主題,主題一轉就要重畫)。 */
function useThemeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setTick((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return tick;
}

export default function ChartPoster() {
  const { locale } = useLocale();
  // z 喺簡繁字典熱咗之後換新 identity → model / 預畫 PNG 重建一次,之後點擊導出零等待
  const { z } = useScript();
  const loc = locale as YijingLocale;
  const [reading, setReading] = useState<Reading | null | undefined>(undefined);
  const paperRef = useRef<HTMLDivElement>(null);
  const themeTick = useThemeTick();
  // 預先畫好嘅 PNG:手機分享表要喺點擊手勢內即時調用,唔可以先 await 畫圖
  const pngRef = useRef<Promise<Blob> | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // 用戶自填名字:只存本機 localStorage,唔上傳;屏幕同導出 PNG 都會顯示
  const [name, setName] = useState("");
  useEffect(() => {
    try {
      const v = localStorage.getItem("numerology-poster-name");
      if (v) setName(v);
    } catch {
      /* 無痕/私隱模式,唔理 */
    }
  }, []);
  const onNameChange = (v: string) => {
    setName(v);
    try {
      if (v.trim()) localStorage.setItem("numerology-poster-name", v);
      else localStorage.removeItem("numerology-poster-name");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    listReadings()
      .then((rs) => setReading(rs[0] ?? null))
      .catch(() => setReading(null));
  }, []);

  const src = useMemo<PosterSource | null>(() => {
    if (!reading) return null;
    const chart = reading.chart;
    const wx = wuxingCount(
      POSTER_PILLARS.map((k) => {
        const gz = chart.bazi.fourPillars[k].ganZhi;
        return { gan: gz[0] ?? "", zhi: gz[1] ?? "" };
      }),
    );
    return {
      input: chart.input,
      lunarDate: chart.bazi.lunarDate,
      pillars: chart.bazi.fourPillars,
      dayMaster: chart.bazi.dayMaster,
      soul: chart.ziwei.palaces.find((p) => p.isSoulPalace),
      body: chart.ziwei.palaces.find((p) => p.isBodyPalace),
      dayun: currentLuckStep(chart.bazi),
      allDayun: luckSteps(chart.bazi).map((d) => ({
        ganZhi: d.ganZhi,
        startAge: d.startAge,
        endAge: d.endAge,
      })),
      wuxing: (["木", "火", "土", "金", "水"] as const).map((label) => ({ label, count: wx[label] })),
      generatedAt: new Date(reading.updatedAt),
      name: name.trim() || undefined,
    };
  }, [reading, name]);

  /** 屏幕版:含生辰,方便用戶核對係咪啱嗰個盤。 */
  const screen = useMemo(() => (src ? buildPosterModel(src, loc, { includeBirth: true }) : null), [src, loc, z]);

  /** 導出版:includeBirth:false → model 內根本冇生辰,PNG 唔會洩漏。 */
  const renderPng = useCallback((): Promise<Blob> | null => {
    if (!src || !paperRef.current) return null;
    const p = renderPosterPng(buildPosterModel(src, loc, { includeBirth: false }), paperRef.current);
    p.catch(() => {}); // 錯誤留俾點擊時處理
    return p;
  }, [src, loc, z]);

  useEffect(() => {
    setFailed(false);
    pngRef.current = renderPng();
  }, [renderPng, themeTick]);

  const onDownload = useCallback(async () => {
    if (busy) return;
    const p = pngRef.current ?? renderPng();
    if (!p) return;
    setBusy(true);
    setFailed(false);
    try {
      await savePosterPng(await p, posterFilename(new Date()));
    } catch {
      pngRef.current = null; // 下次撳重新畫
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [busy, renderPng]);

  return (
    <>
      <style>{`
        .poster-wrap { max-width: 460px; margin: 8px auto 0; }
        .poster-paper {
          position: relative;
          background: var(--card);
          border-radius: 20px;
          padding: 24px 20px 20px;
          overflow: hidden;
        }
        .poster-v {
          writing-mode: vertical-rl; letter-spacing: 0.5em;
          color: var(--label-3); font-size: 13px; user-select: none;
        }
        .poster-logo { display: block; width: 52px; height: 52px; border-radius: 14px; flex: none; }
        .poster-logo-light { display: none; }
        [data-theme="light"] .poster-logo-dark { display: none; }
        [data-theme="light"] .poster-logo-light { display: block; }
        .poster-row { display: flex; gap: 12px; align-items: baseline; padding: 7px 0; border-bottom: 0.5px solid var(--sep); }
        .poster-row:last-child { border-bottom: none; }
        .poster-k { min-width: 4.2em; color: var(--label-2); font-size: 13px; }
        .poster-v2 { font-size: 16px; }
        .poster-h { color: var(--accent); font-size: 13px; letter-spacing: 0.04em; margin-bottom: 4px; }
        .poster-pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; }
        .poster-pillar { text-align: center; border-radius: 12px; padding: 10px 4px; background: var(--card-2); }
        .poster-pillar .gz { font-size: 24px; font-weight: 500; color: var(--label); }
        .poster-pillar .ss { font-size: 12px; color: var(--accent); margin-top: 2px; min-height: 1.2em; }
        .poster-pillar .lb { font-size: 11px; color: var(--label-3); margin-top: 2px; }
        .poster-dayun-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; }
        .poster-dayun-cell { text-align: center; border-radius: 10px; padding: 8px 4px; background: var(--card-2); border: 1.5px solid transparent; }
        .poster-dayun-cell.cur { border-color: var(--accent); }
        .poster-dayun-cell .gz { font-size: 15px; font-weight: 500; color: var(--label); }
        .poster-dayun-cell.cur .gz { color: var(--accent); font-weight: 700; }
        .poster-dayun-cell .ag { font-size: 11px; color: var(--label-3); margin-top: 2px; }
        .poster-actions { margin-top: 16px; }
        .poster-actions .muted { text-align: center; margin: 8px 0 0; }
      `}</style>

      {/* 單欄:標題在上、海報置中(同 /yijing/gua) */}
      <div className="masthead">
        <h1>{yjT("poster.title", loc)}</h1>
        <div className="sub">{yjT("poster.sub", loc)}</div>
      </div>

      <div className="poster-wrap">
          {reading === undefined && (
            <p className="muted" style={{ textAlign: "center" }}>
              …
            </p>
          )}

          {reading === null && (
            <div className="card empty">
              <p className="empty-t">{yjT("poster.empty", loc)}</p>
              <p className="muted">{yjT("poster.emptyHint", loc)}</p>
              <Link href="/" className="btn" onClick={() => go("home")}>
                {yjT("poster.goHome", loc)}
              </Link>
            </div>
          )}

          {screen && (
            <>
              <div className="field" style={{ marginBottom: "12px" }}>
                <label htmlFor="poster-name">{yjT("poster.nameLabel", loc)}</label>
                <input
                  id="poster-name"
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={yjT("poster.namePlaceholder", loc)}
                  maxLength={20}
                  autoComplete="off"
                />
                <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                  {yjT("poster.nameHint", loc)}
                </p>
              </div>

              <div className="poster-paper" ref={paperRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "0.04em" }}>{screen.title}</div>
                    {screen.name && (
                      <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "0.2rem" }}>{screen.name}</div>
                    )}
                    <div className="muted" style={{ marginTop: "0.3rem" }}>
                      {screen.generatedAt}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                    <span className="poster-v" aria-hidden>
                      {screen.brand}
                    </span>
                    <img className="poster-logo poster-logo-dark" src="/logo.png" width={52} height={52} alt="" aria-hidden="true" />
                    <img className="poster-logo poster-logo-light" src="/logo-light.png" width={52} height={52} alt="" aria-hidden="true" />
                  </div>
                </div>

                {/* 生辰只喺屏幕顯示;導出 PNG 用另一份冇生辰嘅 model 畫(見 lib/poster.ts) */}
                {screen.birth.length > 0 && (
                  <div style={{ marginTop: "1rem" }} data-export-hide>
                    {screen.birth.map((r) => (
                      <Row key={r.key} r={r} />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "0.8rem" }}>
                  <div className="poster-h">{screen.baziHeading}</div>
                  <div className="poster-pillars">
                    {screen.pillars.map((p) => (
                      <div className="poster-pillar" key={p.key}>
                        <div className="gz">{p.ganZhi}</div>
                        {/* 日柱無十神:用 nbsp 佔位——普通空格會被 CSS 收走,撐唔起行高,標籤就對唔齊 */}
                        <div className="ss">{p.shiShen || " "}</div>
                        <div className="lb">{p.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Row r={screen.dayMaster} />
                    <Row r={screen.wuxing} />
                  </div>
                </div>

                <div style={{ marginTop: "0.8rem" }}>
                  <div className="poster-h">{screen.ziweiHeading}</div>
                  {screen.ziwei.map((r) => (
                    <Row key={r.key} r={r} />
                  ))}
                </div>

                {screen.dayunSteps.length > 0 && (
                  <div style={{ marginTop: "0.8rem" }}>
                    <div className="poster-h">{screen.dayunHeading}</div>
                    <div className="poster-dayun-grid">
                      {screen.dayunSteps.map((s) => (
                        <div className={`poster-dayun-cell${s.current ? " cur" : ""}`} key={s.key}>
                          <div className="gz">{s.ganZhi}</div>
                          <div className="ag">{s.ages}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="muted" style={{ textAlign: "center", marginTop: "1rem", marginBottom: 0, fontSize: "0.72rem" }}>
                  {screen.disclaimer}
                </p>
              </div>

              <div className="poster-actions">
                <button type="button" className="btn block" onClick={onDownload} disabled={busy} aria-busy={busy}>
                  <Icon name="download" />
                  {busy ? yjT("poster.exporting", loc) : yjT("poster.download", loc)}
                </button>
                <p className="muted" role={failed ? "alert" : undefined}>
                  {failed ? yjT("poster.exportFail", loc) : yjT("poster.exportNote", loc)}
                </p>
              </div>
            </>
          )}
      </div>
    </>
  );
}
