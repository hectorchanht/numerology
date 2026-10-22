"use client";

import { useState } from "react";
import type { BirthInput, ChartResult } from "@numerology/engine";
import type { BirthFormValue } from "@/lib/formTypes";
import { useLocale, LocaleSwitch } from "@/lib/i18n";
import { BirthForm } from "@/components/BirthForm";
import { ZiweiBoard } from "@/components/ZiweiBoard";
import { BaziTable } from "@/components/BaziTable";
import { BaziDetail } from "@/components/BaziDetail";
import { StreamedReport } from "@/components/StreamedReport";
import { ChatPanel } from "@/components/ChatPanel";
import { TimeInferPanel } from "@/components/TimeInferPanel";
import { SettingsPanel } from "@/components/SettingsPanel";

type Mode = "known" | "infer";

export default function Home() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("known");
  const [input, setInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<ChartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 分段并行:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,各节 <60s 绕开 Vercel 函数上限。
  const REPORT_SEGS = [
    { key: "personality", label: t("seg.personality") },
    { key: "career", label: t("seg.career") },
    { key: "wealth", label: t("seg.wealth") },
    { key: "relationship", label: t("seg.relationship") },
    { key: "health", label: t("seg.health") },
    { key: "luck", label: t("seg.luck") },
    { key: "advice", label: t("seg.advice") },
  ] as const;

  const FORTUNE_SEGS = [
    { key: "overview", label: t("seg.overview") },
    { key: "dayun", label: t("seg.dayun") },
    { key: "review", label: t("seg.review") },
    { key: "future", label: t("seg.future") },
    { key: "rhythm", label: t("seg.rhythm") },
    { key: "action", label: t("seg.action") },
  ] as const;

  const onSubmit = async (birth: BirthFormValue) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birth),
      });
      const data = (await res.json()) as { chart?: ChartResult; error?: string };
      if (!res.ok || !data.chart) throw new Error(data.error ?? t("chart.errorFallback"));
      setChart(data.chart);
      // 用服务端解析后的阳历输入(农历已转换),供后续报告/对话复用
      setInput(data.chart.input);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("chart.errorFallback"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <header className="masthead">
        <div className="seal">{t("app.seal")}</div>
        <h1>{t("app.title")}</h1>
        <div className="sub">{t("app.subtitle")}</div>
        <LocaleSwitch />
      </header>

      <div className="mode-switch">
        <button className={mode === "known" ? "active" : ""} onClick={() => setMode("known")}>
          {t("mode.known")}
        </button>
        <button className={mode === "infer" ? "active" : ""} onClick={() => setMode("infer")}>
          {t("mode.infer")}
        </button>
      </div>

      {mode === "infer" ? (
        <TimeInferPanel
          onAdopt={(birth) => { setMode("known"); onSubmit(birth); }}
        />
      ) : (
        <BirthForm loading={loading} onSubmit={onSubmit} />
      )}

      <SettingsPanel />

      {error ? <p className="notice" style={{ textAlign: "center" }}>{error}</p> : null}

      {mode === "known" && chart && input ? (
        <div className="cross-flow">
          {/* 汇流·并置带:八字 ⇄ 紫微,同源合参 */}
          <div className="flow-systems">
            <div className="sys sys-a">
              <span className="sys-tag">八字</span>
              <span className="sys-sub">{t("flow.baziSub")}</span>
            </div>
            <div className="flow-x" aria-hidden>⇄</div>
            <div className="sys sys-b">
              <span className="sys-tag">紫微</span>
              <span className="sys-sub">{t("flow.ziweiSub")}</span>
            </div>
            <div className="flow-moment">{t("flow.moment")}</div>
          </div>

          <div className="card" style={{ marginTop: "var(--space)" }}>
            <h2 className="section-title"><span className="sys-chip is-b">紫微</span>{t("chart.ziweiTitle")}</h2>
            <ZiweiBoard
              ziwei={chart.ziwei}
              center={<BaziTable bazi={chart.bazi} ziwei={chart.ziwei} />}
            />
            <p className="muted" style={{ marginTop: "0.8rem" }}>
              {chart.input.year}-{chart.input.month}-{chart.input.day}{" "}
              {String(chart.input.hour).padStart(2, "0")}:
              {String(chart.input.minute ?? 0).padStart(2, "0")} {chart.input.gender} ·{" "}
              {chart.bazi.lunarDate} ·{" "}
              {chart.meta.trueSolarTimeApplied
                ? t("chart.corrected", { lon: chart.meta.correction?.longitude ?? "", off: chart.meta.correction?.offsetMinutes ?? "" })
                : t("chart.notCorrected")}
            </p>
            <p className="muted">
              {t("chart.palaceNote")}
            </p>
          </div>

          <div style={{ marginTop: "var(--space)" }}>
            <BaziDetail bazi={chart.bazi} />
          </div>

          {/* 汇流箭头:两盘 → 合参解读 */}
          <div className="flow-funnel" aria-hidden>
            <span className="ff-a" />
            <span className="ff-b" />
          </div>

          {/* 解读:八字 / 紫微 / 合参,各自独立可选 */}
          <div className="synthesis">
            <div className="synthesis-head">
              <span className="dot" />
              <h2>{t("chart.readingTitle")}</h2>
              <span className="who">{t("chart.readingSub")}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space)" }}>
            <StreamedReport
              input={input}
              endpoint="/api/report"
              title={t("card.chartTitle")}
              description={t("card.chartDesc")}
              segments={REPORT_SEGS}
            />
            <StreamedReport
              input={input}
              endpoint="/api/fortune"
              title={t("card.fortuneTitle")}
              description={t("card.fortuneDesc")}
              segments={FORTUNE_SEGS}
            />
            <ChatPanel input={input} />
            </div>
          </div>
        </div>
      ) : null}

      <p className="disclaimer">
        {t("app.disclaimer1")}<br />
        {t("app.disclaimer2")}
      </p>
    </div>
  );
}
