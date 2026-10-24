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
  當旺: "var(--ok)",
  生氣: "var(--accent)",
  退氣: "#ff9f0a",
  死氣: "#ff453a",
  平: "var(--label-2)",
};

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

  return (
    <div ref={cardRef}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("fengshui.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 16px", fontSize: "0.9rem" }}>{t("fengshui.scopeNote")}</p>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 8 }}>{t("fengshui.sit")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
          {GUAS.map((g) => (
            <button
              key={g}
              type="button"
              className="btn"
              style={{
                borderColor: sit === g ? "var(--accent)" : undefined,
                color: sit === g ? "var(--accent)" : undefined,
                fontWeight: sit === g ? 700 : 400,
              }}
              onClick={() => setSit(g)}
            >
              {t("fengshui.sitGua", { gua: z(g) })}
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>{t("fengshui.builtYear")}</div>
        <input
          type="number"
          className="input"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={1864}
          max={2100}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={start}>
          {t("fengshui.start")}
        </button>
      </div>

      {result && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
              {t("fengshui.sitGua", { gua: z(sit) })} · {z(result.xiangGua)}向
            </div>
            <div style={{ color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>
              {t("fengshui.yun", { yun: result.yunNum })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {GRID.map((g) => {
              const p = result.palaces.find((x) => x.gong === g)!;
              return (
                <div key={g} className="card" style={{ padding: "10px 8px", minHeight: 104 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>
                    {z(p.gongName)}{g}宮
                  </div>
                  <div style={{ fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.yunStar")}</span><span>{p.yun}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.shanStar")}</span>
                    <span style={{ color: STATE_COLOR[p.shanState] }}>{p.shan}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{t("fengshui.xiangStar")}</span>
                    <span style={{ color: STATE_COLOR[p.xiangState] }}>{p.xiang}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--accent)", marginTop: 2 }}>{z(p.note)}</div>
                </div>
              );
            })}
          </div>

          <p className="muted" style={{ fontSize: "0.82rem", margin: "4px 2px 14px" }}>{t("fengshui.disclaimer")}</p>

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
