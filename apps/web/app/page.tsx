"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BirthInput, ChartResult, FortuneAnalysis } from "@numerology/engine";
import type { BirthFormValue } from "@/lib/formTypes";
import { useLocale } from "@/lib/i18n";
import { go, goBack, useNav, type Screen } from "@/lib/nav";
import { currentLuckStep } from "@/lib/ganzhi";
import { yjT } from "@/lib/yijingStrings";
import { BirthForm } from "@/components/BirthForm";
import { ZiweiBoard } from "@/components/ZiweiBoard";
import { BaziTable } from "@/components/BaziTable";
import { BaziDetail } from "@/components/BaziDetail";
import { StreamedReport } from "@/components/StreamedReport";
import { ChatPanel } from "@/components/ChatPanel";
import { TimeInferPanel } from "@/components/TimeInferPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { FortuneTimeline } from "@/components/FortuneTimeline";
import { ChartSummary, WuxingChart } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { EmptyChart, ScreenNav, Seg } from "@/components/ui";
import { loadAi } from "@/lib/aiSettings";
import { repairFortuneMarkdown } from "@/lib/fortuneRepair";
import { upsertReading, saveSection, getReading, readingId, type Reading } from "@/lib/history";

type Mode = "known" | "infer";
type Sys = "bazi" | "ziwei";
type Restored = { report: Record<string, string> | null; fortune: Record<string, string> | null };

/** 跨 client 路由保留當前命盤(去 /poster、/yijing 再返嚟唔使重排)。 */
let kept: { input: BirthInput; chart: ChartResult } | null = null;

/** 歷史記錄 → 兩份報告的已存章節(冇就 null,保持未生成狀態)。 */
function sectionsOf(r: Reading): Restored {
  const report: Record<string, string> = {};
  const fortune: Record<string, string> = {};
  for (const [k, s] of Object.entries(r.sections)) {
    if (k.startsWith("report:")) report[k.slice("report:".length)] = s.markdown;
    else if (k.startsWith("fortune:")) fortune[k.slice("fortune:".length)] = s.markdown;
  }
  return {
    report: Object.keys(report).length ? report : null,
    fortune: Object.keys(fortune).length ? fortune : null,
  };
}

export default function Home() {
  const { t, locale } = useLocale();
  const { screen } = useNav();
  const [mode, setMode] = useState<Mode>("known");
  const [sys, setSys] = useState<Sys>("bazi");
  const [input, setInput] = useState<BirthInput | null>(() => kept?.input ?? null);
  const [chart, setChart] = useState<ChartResult | null>(() => kept?.chart ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** 从历史记录恢复的章节正文(sectionKey → markdown),分 report/fortune 两组。 */
  const [restored, setRestored] = useState<Restored | null>(null);

  useEffect(() => {
    kept = input && chart ? { input, chart } : null;
  }, [input, chart]);

  // 由子路由返嚟:從本機歷史補返已生成的章節。
  useEffect(() => {
    if (!kept) return;
    readingId(kept.input)
      .then(getReading)
      .then((r) => { if (r) setRestored(sectionsOf(r)); })
      .catch(() => {});
  }, []);

  // 分段并行:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS。
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
      setRestored(null);
      // 存入本机历史(保留已有章节,只更新命盘/时间)。
      upsertReading({ input: data.chart.input, locale, chart: data.chart }).catch(() => {});
      go("chart");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("chart.errorFallback"));
    } finally {
      setLoading(false);
    }
  };

  /** 从历史记录恢复:命盘 + 已生成的章节即时显示,零 API 调用。 */
  const handleRestore = (r: Reading) => {
    setMode("known");
    setError("");
    setInput(r.input);
    setChart(r.chart);
    setRestored(sectionsOf(r));
    // 頂返做最新一條,令「命盤海報」(取最新記錄)同畫面一致;已存章節照留。
    upsertReading({ input: r.input, locale, chart: r.chart }).catch(() => {});
    go("chart");
  };

  /** 某节成功生成 → 存入本机历史(带当时的 lens/provider/model)。 */
  const handleSectionDone =
    (endpoint: "report" | "fortune") =>
    (segKey: string, markdown: string, lens: string) => {
      if (!input) return;
      const s = loadAi();
      saveSection(input, `${endpoint}:${segKey}`, {
        markdown,
        lens,
        provider: s.provider,
        model: s.model.trim(),
        at: Date.now(),
      }).catch(() => {});
    };

  const ready = chart && input ? { chart, input } : null;
  const nowLuck = chart ? currentLuckStep(chart.bazi) : undefined;
  /** 确定性运势数据(无 AI 调用):渲染前修复小标题数字与紫微大限:無(含旧缓存文本)。 */
  const [fortuneJson, setFortuneJson] = useState<FortuneAnalysis | null>(null);
  const inputKey = input ? JSON.stringify(input) : null;
  useEffect(() => {
    if (!inputKey) {
      setFortuneJson(null);
      return;
    }
    let dead = false;
    fetch("/api/fortune/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!dead) setFortuneJson(d?.fortune ?? null);
      })
      .catch(() => {
        if (!dead) setFortuneJson(null);
      });
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);
  // narrow:桌面用窄欄(設定、對話),其餘畫面用全寬多欄。
  const show = (s: Screen, narrow?: boolean) => ({ className: narrow ? "screen narrow" : "screen", hidden: screen !== s });

  // .split / .split-*:手機 display:contents(版面不變),桌面變多欄 grid。
  return (
    <>
      {/* ============ 起盤 ============ */}
      <section {...show("home")} aria-label={t("tab.home")}>
        <ScreenNav eyebrow={t("app.subtitle")} />
        <div className="split split-home">
          <div className="split-a">
            <h1 className="large">{t("form.title")}</h1>
            <p className="lede">{t("home.lede")}</p>
          </div>

          <div className="split-main">
            <Seg
              value={mode}
              onChange={setMode}
              options={[
                { value: "known", label: t("mode.knownShort") },
                { value: "infer", label: t("mode.inferShort") },
              ]}
            />

            {mode === "infer" ? (
              <TimeInferPanel onAdopt={(birth) => { setMode("known"); onSubmit(birth); }} />
            ) : (
              <BirthForm loading={loading} onSubmit={onSubmit} />
            )}

            {error ? <p className="notice" role="alert">{error}</p> : null}
          </div>

          <div className="split-b">
            <p className="disclaimer">
              {t("app.disclaimer1")}<br />
              {t("app.disclaimer2")}
            </p>
          </div>
        </div>
      </section>

      {/* ============ 命盤 ============ */}
      <section {...show("chart")} aria-label={t("tab.chart")}>
        <ScreenNav eyebrow={t("tab.chart")}>
          {ready ? (
            <Link href="/poster" className="icon-btn" aria-label={t("chart.posterSub")}>
              <Icon name="share" />
            </Link>
          ) : null}
        </ScreenNav>
        {ready ? (
          <div className="split split-chart">
            <div className="split-main">
              <div className="who">
                <div className="avatar" aria-hidden="true">{ready.input.gender}</div>
                <div>
                  <div className="name">
                    {ready.chart.input.year}-{ready.chart.input.month}-{ready.chart.input.day}{" "}
                    {String(ready.chart.input.hour).padStart(2, "0")}:
                    {String(ready.chart.input.minute ?? 0).padStart(2, "0")} · {ready.chart.input.gender}
                  </div>
                  <div className="meta">
                    {ready.chart.bazi.lunarDate} ·{" "}
                    {ready.chart.meta.trueSolarTimeApplied
                      ? t("chart.corrected", { lon: ready.chart.meta.correction?.longitude ?? "", off: ready.chart.meta.correction?.offsetMinutes ?? "" })
                      : t("chart.notCorrected")}
                  </div>
                </div>
              </div>

              {/* 一眼睇晒:摘要卡 + 五行圖(確定性數據,零 AI) */}
              <h2 className="group-title">{t("viz.summary")}</h2>
              <ChartSummary chart={ready.chart} />
              <h2 className="group-title">{t("chart.wuxing")}</h2>
              <WuxingChart chart={ready.chart} />

              <Seg
                value={sys}
                onChange={setSys}
                options={[
                  { value: "bazi", label: t("chart.segBazi") },
                  { value: "ziwei", label: t("chart.segZiwei") },
                ]}
              />

              <div hidden={sys !== "bazi"}>
                <BaziTable bazi={ready.chart.bazi} />
                <BaziDetail bazi={ready.chart.bazi} />
              </div>
              <div hidden={sys !== "ziwei"}>
                <h2 className="group-title">{t("chart.palacesTitle")}</h2>
                <ZiweiBoard key={JSON.stringify(ready.input)} ziwei={ready.chart.ziwei} />
                <p className="note">{t("chart.palaceNote")}</p>
              </div>
            </div>

            <div className="split-a">
              <h2 className="group-title">{t("chart.readings")}</h2>
              <div className="list">
                <button type="button" className="row" onClick={() => go("report")}>
                  <Icon name="file" className="ic" />
                  <span className="lbl">{t("card.chartTitle")}<span className="sub">{t("chart.reportSub")}</span></span>
                  <Icon name="chev" small className="chev" />
                </button>
                <button type="button" className="row" onClick={() => go("fortune")}>
                  <Icon name="trend" className="ic" />
                  <span className="lbl">
                    {t("card.fortuneTitle")}
                    <span className="sub">{nowLuck ? t("chart.fortuneSub", { gz: nowLuck.ganZhi }) : t("chart.fortuneSubNone")}</span>
                  </span>
                  <Icon name="chev" small className="chev" />
                </button>
                <button type="button" className="row" onClick={() => go("chat")}>
                  <Icon name="msg" className="ic" />
                  <span className="lbl">{t("chat.title")}<span className="sub">{t("chat.sub")}</span></span>
                  <Icon name="chev" small className="chev" />
                </button>
              </div>

              <h2 className="group-title">{t("chart.tools")}</h2>
              <div className="tools">
                <Link href="/yijing" className="tool">
                  <Icon name="hex" />
                  <div><div className="t">{yjT("nav.yijing", locale)}</div><div className="d">{t("chart.yijingSub")}</div></div>
                </Link>
                <Link href="/poster" className="tool">
                  <Icon name="image" />
                  <div><div className="t">{yjT("nav.poster", locale)}</div><div className="d">{t("chart.posterSub")}</div></div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>

      {/* ============ 報告 ============ */}
      <section {...show("report")} aria-label={t("tab.report")}>
        {ready ? (
          <StreamedReport
            input={ready.input}
            endpoint="/api/report"
            title={t("card.chartTitle")}
            description={t("card.chartDesc")}
            segments={REPORT_SEGS}
            onSectionDone={handleSectionDone("report")}
            restoredSections={restored?.report ?? null}
            onAsk={() => go("chat")}
          />
        ) : (
          <>
            <ScreenNav eyebrow={t("card.chartTitle")} />
            <EmptyChart />
          </>
        )}
      </section>

      {/* ============ 大運 ============ */}
      <section {...show("fortune")} aria-label={t("tab.fortune")}>
        {ready ? (
          <StreamedReport
            input={ready.input}
            endpoint="/api/fortune"
            title={t("card.fortuneTitle")}
            description={t("card.fortuneDesc")}
            segments={FORTUNE_SEGS}
            onSectionDone={handleSectionDone("fortune")}
            restoredSections={restored?.fortune ?? null}
            onAsk={() => go("chat")}
            collapsible
            repairText={fortuneJson ? (md) => repairFortuneMarkdown(md, fortuneJson, locale) : undefined}
          >
            <FortuneTimeline chart={ready.chart} visible={screen === "fortune"} />
            <h2 className="group-title">{t("card.fortuneTitle")}</h2>
          </StreamedReport>
        ) : (
          <>
            <ScreenNav eyebrow={t("card.fortuneTitle")} />
            <EmptyChart />
          </>
        )}
      </section>

      {/* ============ 歷史 ============ */}
      <section {...show("history")} aria-label={t("tab.history")}>
        <ScreenNav eyebrow={t("history.privacy")}>
          <button type="button" className="icon-btn" onClick={() => go("home")} aria-label={t("history.new")}>
            <Icon name="plus" />
          </button>
        </ScreenNav>
        <h1 className="large">{t("history.title")}</h1>
        <HistoryPanel onRestore={handleRestore} />
      </section>

      {/* ============ 設定(齒輪) ============ */}
      <section {...show("settings", true)} aria-label={t("nav.settings")}>
        <ScreenNav eyebrow={t("nav.settings")} onBack={goBack} gear={false} />
        <SettingsPanel />
        <p className="disclaimer">{t("app.disclaimer1")}</p>
      </section>

      {/* ============ 命盤對話 ============ */}
      <section {...show("chat", true)} aria-label={t("chat.title")}>
        <ScreenNav eyebrow={t("tab.chart")} onBack={goBack} gear={false} />
        {ready ? <ChatPanel key={JSON.stringify(ready.input)} input={ready.input} /> : <EmptyChart />}
      </section>
    </>
  );
}
