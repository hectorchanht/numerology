"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useScript } from "@/lib/i18n";
import { castQimen, isWuBuYuShi, type QimenResult } from "@numerology/engine";
import { renderShareCardPng, savePosterPng } from "@/lib/posterExport";
import { type ShareCardModel } from "@/lib/shareCard";
import { SITE_BASE } from "@/lib/yijingSite";
import { saveYijingCast, getYijingCast } from "@/lib/yijingHistory";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/** 九宮格顯示序(洛書方位) */
const GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];

function toInput(y: number, m: number, d: number, h: number, mi: number) {
  return { year: y, month: m, day: d, hour: h, minute: mi };
}

/** "YYYY-MM-DDTHH:mm" → castQimen 輸入(解析失敗回 null)。 */
function parseDt(dt: string) {
  const m = dt.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
  if (!m) return null;
  return toInput(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}

export default function QimenTool({ historyId }: { historyId?: string }) {
  const { t, locale } = useLocale();
  const { z } = useScript();
  const loc = locale as YijingLocale;
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  /** 歷史回顧模式:由 ?h=<id> 入嚟,唔再存檔 */
  const reviewMode = useRef(false);
  const [reviewAt, setReviewAt] = useState<number | null>(null);
  /** 已存檔的輸入 key(同一 dt+問題重撳唔重複存) */
  const savedKey = useRef<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [dt, setDt] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QimenResult | null>(null);

  // 歷史回顧:還原起局時間 + 問題,castQimen 純函數原樣重現成盤
  useEffect(() => {
    if (!historyId) return;
    let alive = true;
    getYijingCast(historyId)
      .then((rec) => {
        if (!alive || !rec || rec.kind !== "qimen" || !rec.datetime) return;
        const input = parseDt(rec.datetime);
        if (!input) return;
        reviewMode.current = true;
        setReviewAt(rec.at);
        setDt(rec.datetime);
        setQuestion(rec.question ?? "");
        setResult(castQimen(input));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [historyId]);

  const start = () => {
    const input = parseDt(dt);
    if (!input) return;
    setResult(castQimen(input));
    // 起局自動存入占卦歷史(同一輸入只存一次;回顧模式唔存)
    if (reviewMode.current) return;
    const key = `${dt}|${question.trim()}`;
    if (savedKey.current === key) return;
    savedKey.current = key;
    saveYijingCast({
      kind: "qimen",
      at: Date.now(),
      datetime: dt,
      question: question.trim() || undefined,
    }).catch(() => {});
  };

  const wubuyu = result
    ? isWuBuYuShi(result.timeGanZhi[0]!, result.dayGanZhi[0]!)
    : false;

  const buildCard = (): ShareCardModel | null => {
    if (!result) return null;
    const pats = result.palaces.flatMap((p) => p.patterns);
    const patCount: Record<string, number> = {};
    for (const p of pats) patCount[p] = (patCount[p] ?? 0) + 1;
    const topPats = Object.entries(patCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${z(k)}×${v}`)
      .join(" ");
    return {
      title: t("qimen.title"),
      heroName: question.trim() ? question.trim().slice(0, 12) : dt.replace("T", " "),
      heroValue: t("qimen.dunju", { dun: z(result.dun), ju: result.ju }),
      heroUnit: t("qimen.yuanju", { jieqi: z(result.jieqi), yuan: z(result.yuan) }),
      heroNote: `${t("qimen.zhiFu")}${z(result.zhiFu)} · ${t("qimen.zhiShi")}${z(result.zhiShi)}`,
      rows: [
        { label: t("qimen.askTime"), value: `${z(result.dayGanZhi)}日 ${z(result.timeGanZhi)}時` },
        { label: t("qimen.xunkong"), value: z(result.xunKong) },
        { label: t("qimen.patterns"), value: topPats || "—", accent: true },
      ],
      disclaimer: t("qimen.disclaimer"),
      cta: t("qimen.cta"),
      url: `${SITE_BASE}/qimen`.replace("https://", ""),
      brand: t("app.title"),
    };
  };

  const onDownload = async () => {
    const m = buildCard();
    if (!m || !cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderShareCardPng(m, cardRef.current);
      await savePosterPng(blob, `qimen-${Date.now()}.png`);
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_BASE}/qimen`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪貼簿被拒,唔理 */
    }
  };

  return (
    <div ref={cardRef}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("qimen.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 16px", fontSize: "0.9rem" }}>
        時家轉盤 · 拆補定局
      </p>

      {reviewAt !== null && (
        <div className="card" style={{ borderColor: "var(--cinnabar-soft)", padding: 16, marginBottom: 16 }}>
          <span className="badge">{yjT("yijing.hist.reviewing", loc)}</span>{" "}
          <span className="muted">{new Date(reviewAt).toLocaleString()}</span>{" "}
          <Link href="/yijing/history" style={{ marginLeft: "0.5rem" }}>
            {yjT("yijing.hist.backToHistory", loc)}
          </Link>
        </div>
      )}

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>{t("qimen.askTime")}</div>
        <input
          type="datetime-local"
          className="input"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>{t("qimen.question")}</div>
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("qimen.questionPh")}
          maxLength={20}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={start}>
          {t("qimen.start")}
        </button>
      </div>

      {result && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent)" }}>
              {t("qimen.dunju", { dun: z(result.dun), ju: result.ju })}
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: "0.9rem" }}>
              {t("qimen.yuanju", { jieqi: z(result.jieqi), yuan: z(result.yuan) })}
              {" · "}{z(result.dayGanZhi)}日 {z(result.timeGanZhi)}時
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: "0.9rem" }}>
              {t("qimen.zhiFu")}{z(result.zhiFu)} · {t("qimen.zhiShi")}{z(result.zhiShi)}
              {" · "}{t("qimen.xunkong")}{z(result.xunKong)}
              {wubuyu && <span style={{ color: "#ff453a" }}> · {t("qimen.wubuyushi")}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {GRID.map((g) => {
              const p = result.palaces.find((x) => x.gong === g)!;
              return (
                <div key={g} className="card" style={{ padding: "10px 8px", minHeight: 118 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>
                    {z(p.gongName)}{g}宮
                    {p.maXing && <span style={{ color: "var(--accent)" }}> 馬</span>}
                    {p.kongWang && <span style={{ color: "#ff9f0a" }}> 空</span>}
                  </div>
                  <div style={{ fontSize: "0.82rem" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>{z(p.tianPan)}</span>
                    <span className="muted"> {z(p.star)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {z(p.diPan)} <span style={{ color: "var(--text)" }}>{z(p.men)}</span>
                  </div>
                  {p.patterns.length > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "#ff453a", marginTop: 2 }}>
                      {p.patterns.map((x) => z(x)).join(" ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="muted" style={{ fontSize: "0.82rem", margin: "4px 2px 14px" }}>{t("qimen.disclaimer")}</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={onDownload}>
              {busy ? t("name.downloading") : t("name.download")}
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={onCopyLink}>
              {copied ? t("name.copied") : t("name.copyLink")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
