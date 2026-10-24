"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Solar } from "lunar-javascript";
import { useLocale, useScript } from "@/lib/i18n";
import { renderShareCardPng, savePosterPng } from "@/lib/posterExport";
import { type ShareCardModel } from "@/lib/shareCard";
import { SITE_BASE } from "@/lib/yijingSite";

/** 十二生肖(地支序) */
const SHENGXIAO = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"] as const;
/** 時辰地支(早子時起,與 getTimes() 13 項對應) */
const TIME_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子"] as const;
const TIME_RANGE = [
  "23:00-01:00", "01:00-03:00", "03:00-05:00", "05:00-07:00", "07:00-09:00", "09:00-11:00",
  "11:00-13:00", "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00", "21:00-23:00", "23:00-01:00",
] as const;

const DATE_LOCALE = { zht: "zh-HK", zhs: "zh-CN", en: "en-US" } as const;
const TIP_TKEY = ["daily.tip0", "daily.tip1", "daily.tip2", "daily.tip3", "daily.tip4"] as const;

export default function DailyTool() {
  const { locale, t } = useLocale();
  const { z } = useScript();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const d = useMemo(() => {
    const now = new Date();
    const lunar = Solar.fromDate(now).getLunar();
    const yi = lunar.getDayYi();
    const ji = lunar.getDayJi();
    const chongDesc: string = lunar.getDayChongDesc(); // 如 "(甲子)鼠"
    const chongSx = chongDesc.replace(/.*\)/, "");
    const sha: string = lunar.getDaySha();
    const dayGZ: string = (lunar as unknown as { getDayInGanZhiExact(): string }).getDayInGanZhiExact();
    const times = lunar.getTimes();
    const ranked = times
      .map((tm, i) => ({ i, yi: tm.getYi() as string[], ji: tm.getJi() as string[] }))
      .sort((a, b) => b.yi.length - a.yi.length || a.ji.length - b.ji.length);
    // 取宜最多嘅兩個唔同時辰
    const best: { zhi: string; range: string; yi: string[] }[] = [];
    for (const r of ranked) {
      const zh = TIME_ZHI[r.i]!;
      if (best.some((b) => b.zhi === zh)) continue;
      best.push({ zhi: zh, range: TIME_RANGE[r.i]!, yi: r.yi });
      if (best.length >= 2) break;
    }
    // 生肖小貼士:沖到的宜靜守,其餘按日序輪換
    const dayIdx = now.getDate() + now.getMonth() * 31;
    const tips = SHENGXIAO.map((sx, i) =>
      sx === chongSx ? t("daily.sxClash") : t(TIP_TKEY[(dayIdx + i) % 5]!),
    );
    return { now, lunar, yi, ji, chongSx, sha, dayGZ, best, tips };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const dateStr = d.now.toLocaleDateString(DATE_LOCALE[locale], {
    month: "long", day: "numeric", weekday: "long",
  });

  const shareUrl = `${SITE_BASE}/daily`;

  const buildCard = (): ShareCardModel => ({
    title: t("daily.title"),
    heroName: dateStr,
    heroValue: z(d.yi[0] ?? "—"),
    heroUnit: t("daily.heroBest"),
    heroNote: `${t("daily.heroAvoid")}: ${(d.ji.slice(0, 3) as string[]).map((x) => z(x)).join(" ")}`,
    rows: [
      { label: t("daily.yi"), value: (d.yi.slice(0, 4) as string[]).map((x) => z(x)).join(" ") },
      { label: t("daily.ji"), value: (d.ji.slice(0, 4) as string[]).map((x) => z(x)).join(" ") },
      {
        label: t("daily.chongSha"),
        value: t("daily.clashNote", { chong: z(d.chongSx) }) + ` · ${t("daily.jishi")}${z(d.best[0]?.zhi ?? "")}`,
      },
    ],
    disclaimer: t("daily.disclaimer"),
    cta: t("daily.cta"),
    url: shareUrl.replace("https://", ""),
    brand: t("app.title"),
  });

  const onDownload = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderShareCardPng(buildCard(), cardRef.current);
      await savePosterPng(blob, `daily-${d.now.getFullYear()}-${d.now.getMonth() + 1}-${d.now.getDate()}.png`);
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪貼簿被拒,唔理 */
    }
  };

  return (
    <div ref={cardRef}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("daily.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 4px" }}>{dateStr} · {z(d.dayGZ)}日</p>
      <p className="muted" style={{ margin: "0 0 16px", fontSize: "0.9rem" }}>
        {t("daily.lunar", { date: z(d.lunar.toString()) })}
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: "var(--ok)", marginBottom: 8 }}>
          {t("daily.yi")} · {(d.yi as string[]).map((x) => z(x)).join(" ")}
        </div>
        <div style={{ fontWeight: 700, color: "#ff453a" }}>
          {t("daily.ji")} · {(d.ji as string[]).map((x) => z(x)).join(" ")}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="muted">{t("daily.chongSha")}</span>
          <span>{t("daily.clashNote", { chong: z(d.chongSx) })} · 煞{z(d.sha)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="muted">{t("daily.jishi")}</span>
          <span>
            {d.best.map((b) => `${z(b.zhi)}時 ${b.range}`).join(" · ")}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("daily.shengxiao")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {SHENGXIAO.map((sx, i) => (
            <div
              key={sx}
              className="card"
              style={{
                padding: "8px 6px",
                textAlign: "center",
                border: sx === d.chongSx ? "1px solid #ff453a" : undefined,
              }}
            >
              <div style={{ fontWeight: 700 }}>{z(sx)}</div>
              <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>{d.tips[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.82rem", margin: "4px 2px 14px" }}>{t("daily.disclaimer")}</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={onDownload}>
          {busy ? t("name.downloading") : t("daily.download")}
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={onCopyLink}>
          {copied ? t("daily.copied") : t("daily.copyLink")}
        </button>
      </div>
    </div>
  );
}
