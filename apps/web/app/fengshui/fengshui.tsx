"use client";

import { useRef, useState } from "react";
import { useLocale, useScript } from "@/lib/i18n";
import { castFeixing, type FeixingGua, type FeixingResult, type StarState } from "@numerology/engine";
import { renderShareCardPng, savePosterPng } from "@/lib/posterExport";
import { type ShareCardModel } from "@/lib/shareCard";
import { SITE_BASE } from "@/lib/yijingSite";

const GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const GUAS: FeixingGua[] = ["坎", "坤", "震", "巽", "乾", "兌", "艮", "離"];

const STATE_COLOR: Record<StarState, string> = {
  當旺: "var(--ok-text)",
  生氣: "var(--accent-text)",
  退氣: "var(--label-2)",
  死氣: "var(--warn-text)",
  平: "var(--label-2)",
};
/** 星曜狀態短字:唔淨靠顏色分(色盲 / 黑白截圖都睇得出) */
const STATE_SHORT: Record<StarState, string> = { 當旺: "旺", 生氣: "生", 退氣: "退", 死氣: "死", 平: "平" };

export default function FengshuiTool() {
  const { t } = useLocale();
  const { z } = useScript();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sit, setSit] = useState<FeixingGua>("坎");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [result, setResult] = useState<FeixingResult | null>(null);

  const start = () => {
    const y = Number(year);
    if (!Number.isFinite(y) || y < 1864 || y > 2100) return;
    setResult(castFeixing({ sit, builtYear: y }));
  };

  const buildCard = (): ShareCardModel | null => {
    if (!result) return null;
    const wangCai = result.palaces.filter((p) => p.note.includes("旺財")).map((p) => z(p.gongName)).join("");
    const wangDing = result.palaces.filter((p) => p.note.includes("旺丁")).map((p) => z(p.gongName)).join("");
    const sha = result.palaces.filter((p) => p.note.includes("煞")).map((p) => z(p.gongName)).join("");
    return {
      title: t("fengshui.title"),
      heroName: t("fengshui.sitGua", { gua: z(sit) }) + " · " + z(result.xiangGua) + "向",
      heroValue: t("fengshui.yun", { yun: result.yunNum }),
      heroUnit: t("fengshui.title"),
      heroNote: `${t("fengshui.yunStar")}${result.palaces[4]!.yun}`,
      rows: [
        { label: "旺財", value: wangCai || "—", accent: true },
        { label: "旺丁", value: wangDing || "—", accent: true },
        { label: "煞位", value: sha || "—" },
      ],
      disclaimer: t("fengshui.disclaimer"),
      cta: t("fengshui.cta"),
      url: `${SITE_BASE}/fengshui`.replace("https://", ""),
      brand: t("app.title"),
    };
  };

  const onDownload = async () => {
    const m = buildCard();
    if (!m || !cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderShareCardPng(m, cardRef.current);
      await savePosterPng(blob, `feixing-${Date.now()}.png`);
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_BASE}/fengshui`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪貼簿被拒,唔理 */
    }
  };

  const star = (n: number, st: StarState) => (
    <span style={{ color: STATE_COLOR[st] }}>
      {n} <span style={{ fontSize: 11 }}>{z(STATE_SHORT[st])}</span>
    </span>
  );

  return (
    <div ref={cardRef}>
      <h1 className="large">{t("fengshui.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 16px" }}>{t("fengshui.scopeNote")}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted" id="fengshui-sit" style={{ marginBottom: 8 }}>{t("fengshui.sit")}</div>
        <div role="group" aria-labelledby="fengshui-sit" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {GUAS.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip${sit === g ? " on" : ""}`}
              aria-pressed={sit === g}
              onClick={() => setSit(g)}
            >
              {t("fengshui.sitGua", { gua: z(g) })}
            </button>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="fengshui-year">{t("fengshui.builtYear")}</label>
          <input
            id="fengshui-year"
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1864}
            max={2100}
          />
        </div>
        <button type="button" className="btn block" onClick={start}>
          {t("fengshui.start")}
        </button>
      </div>

      {result && (
        <div>
          <div className="card" style={{ marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>
              {t("fengshui.sitGua", { gua: z(sit) })} · {z(result.xiangGua)}向
            </div>
            <div style={{ color: "var(--accent-text)", fontWeight: 700, marginTop: 4 }}>
              {t("fengshui.yun", { yun: result.yunNum })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {GRID.map((g) => {
              const p = result.palaces.find((x) => x.gong === g)!;
              return (
                <div key={g} style={{ background: "var(--card)", borderRadius: "var(--radius)", padding: "10px 8px", minHeight: 104, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {z(p.gongName)}{g}宮
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.yunStar")}</span><span>{p.yun}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.shanStar")}</span>
                    {star(p.shan, p.shanState)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.xiangStar")}</span>
                    {star(p.xiang, p.xiangState)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent-text)", marginTop: 2 }}>{z(p.note)}</div>
                </div>
              );
            })}
          </div>

          <p className="muted" style={{ margin: "4px 2px 14px" }}>{t("fengshui.disclaimer")}</p>

          <div className="btn-row" style={{ marginBottom: 24 }}>
            <button type="button" className="btn" disabled={busy} onClick={onDownload}>
              {busy ? t("name.downloading") : t("name.download")}
            </button>
            <button type="button" className="btn secondary" onClick={onCopyLink}>
              {copied ? t("name.copied") : t("name.copyLink")}
            </button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">{copied ? t("name.copied") : ""}</span>
        </div>
      )}
    </div>
  );
}
