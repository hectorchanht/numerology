"use client";

import { useEffect, useRef, useState } from "react";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { clearModelsCache } from "@/lib/modelsCache";
import { printReport } from "@/lib/exportPdf";
import { aiRequestParts } from "@/lib/aiSettings";
import { useLocale, HTML_LANG, type Locale, type TKey } from "@/lib/i18n";
import { stripLeadingHeading } from "@/lib/sectionIcons";
import { splitThinking } from "@/lib/thinking";
import { SectionBodyView } from "@/components/SectionBody";
import { Icon, SECTION_ICON } from "@/components/Icon";
import { AiModelNote } from "@/components/AiModelNote";
import { Seg, ScreenNav } from "@/components/ui";
import { go } from "@/lib/nav";
import { PronounceButton } from "@dawn-studio/pronounce";
import { speechText } from "@/lib/speechText";

/** 分段定义:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,label 用作章節卡標題。 */
export interface ReportSeg {
  key: string;
  label: string;
}

/** 減少動態時唔平滑捲動。 */
const scrollBehavior = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** 解读视角:纯八字 / 纯紫微 / 合参。 */
type Lens = "bazi" | "ziwei" | "both";
const LENSES: { key: Lens; labelKey: TKey }[] = [
  { key: "bazi", labelKey: "report.lensBazi" },
  { key: "ziwei", labelKey: "report.lensZiwei" },
  { key: "both", labelKey: "report.lensBoth" },
];

interface Props {
  input: BirthInput;
  endpoint: string;
  title: string;
  description: string;
  /** 分段并行:各节并发请求、各自就位,绕开函数时长上限。 */
  segments: readonly ReportSeg[];
  /** 某节成功生成后回调(供历史记录保存):(sectionKey, 正文 markdown, lens, 思考过程)。 */
  onSectionDone?: (segKey: string, markdown: string, lens: string, thinking?: string) => void;
  /** 从历史记录恢复:sectionKey → 正文 markdown(不含 ## 标题,按当前语言重拼)。 */
  restoredSections?: Record<string, string> | null;
  /** 章節可摺疊(大運深析用);預設首節展開。 */
  collapsible?: boolean;
  /** 追問 AI:打開命盤對話。 */
  onAsk?: () => void;
  /** 頂部返回鍵。 */
  onBack?: () => void;
  /** 歷史恢復內容係用邊個視角生成(冇記錄就 null)。 */
  restoredLens?: string | null;
  /** 額度用晒時「返去睇命盤」。 */
  onShowChart?: () => void;
  /** 報告讀完嘅下一步(例如去大運流年)。 */
  next?: { label: string; onClick: () => void };
  /** 每節嘅命盤依據(確定性,唔靠模型);有正文先顯示。 */
  basis?: (segKey: string) => React.ReactNode;
  /** 章節腳註(例如健康 / 財富節嘅專業意見提示),有正文先顯示。 */
  sectionNotes?: Record<string, string>;
  /** 外部觸發生成(遞增即觸發一次,用合參);已有內容就唔重跑。 */
  startSignal?: number;
  /** 插喺導航同視角控件之間的內容(例如大運時間線)。 */
  children?: React.ReactNode;
  /**
   * 渲染前對正文做確定性修復(大運流年用:小标题数字、紫微大限:無)。
   * 渲染時應用,故 KV/歷史記錄裡的舊佔位文本也會被修復,不改存檔原文。
   */
  repairText?: (md: string) => string;
  /**
   * 自訂章節正文渲染(傳回 null 即用共用 SectionBodyView 的分塊渲染)。
   * 用途:大運流年各節的結構化渲染(定性/分析/依据 pills、雙軌圖、時間線)。
   * lens 為生成該節時用的視角(歷史恢復時為 "both")。
   */
  renderSectionBody?: (
    segKey: string,
    md: string,
    lens: "bazi" | "ziwei" | "both",
  ) => React.ReactNode | null;
}

interface Slot {
  text: string;
  status: "streaming" | "done" | "error";
  err: string;
  /** 服务端错误码(AI_BUDGET = 本月额度用尽,各节收成一张额度卡)。 */
  code?: string;
}

/** 通用流式报告:选视角 → 各节并行调 endpoint → 每节一张卡,逐字渲染 Markdown。 */
export function StreamedReport({
  input, endpoint, title, description, segments, onSectionDone, restoredSections,
  collapsible, onAsk, onBack, children, repairText, renderSectionBody, startSignal, sectionNotes, restoredLens, onShowChart, basis, next,
}: Props) {
  const { t, locale } = useLocale();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [lens, setLens] = useState<Lens>("both");
  /** 當前內容係用邊個視角生成(恢復自歷史則未知)。 */
  const [shownLens, setShownLens] = useState<Lens | null>(null);
  const [active, setActive] = useState<string>(segments[0]?.key ?? "");
  const [open, setOpen] = useState<Set<string>>(() => new Set(segments[0] ? [segments[0].key] : []));
  const startedFor = useRef<string>("");
  /** 每次生成/重置 +1;舊一輪的 stream 回調見到 id 唔對就唔再寫入(避免寫落新命盤)。 */
  const run = useRef(0);
  /** 當前命盤正喺度生成(期間唔俾遲到的歷史恢復蓋過)。 */
  const generating = useRef(false);
  const secRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  /** 每個視角各自嘅結果:換視角唔會冧咗已生成嘅內容,切返轉頭即刻睇返。 */
  const byLens = useRef<Partial<Record<Lens, Slot[]>>>({});

  const idBase = endpoint.replace(/\W/g, "");
  const running = !!slots?.some((s) => s.status === "streaming");
  const settled = slots ? slots.filter((s) => s.status !== "streaming").length : 0;
  const lensLabel = (l: Lens) => t(LENSES.find((x) => x.key === l)!.labelKey);
  /** 朗讀:每節一粒,預設跟介面語言(粵 / 普 / 英),撳開選單可換。 */
  const ttsLangs = locale === "en" ? ["en-US"] : locale === "zhs" ? ["zh-CN", "zh-HK"] : ["zh-HK", "zh-CN"];

  const key = JSON.stringify(input);
  // 換咗命盤 → 作廢舊一輪並清空。
  useEffect(() => {
    if (startedFor.current && startedFor.current !== key) {
      run.current += 1;
      generating.current = false;
      startedFor.current = "";
      byLens.current = {};
      setSlots(null);
      setShownLens(null);
      setLens("both");
    }
  }, [key]);

  // 从历史记录恢复:直接显示为完成态,零 API 调用。
  useEffect(() => {
    if (!restoredSections) return;
    if (generating.current && startedFor.current === key) return;
    run.current += 1;
    startedFor.current = key;
    byLens.current = {};
    setSlots(segments.map((seg): Slot => ({ text: restoredSections[seg.key] ?? "", status: "done", err: "" })));
    const rl = LENSES.find((x) => x.key === restoredLens)?.key ?? null;
    setShownLens(rl);
    setLens(rl ?? "both");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredSections]);

  // 每次请求都重读设置:key 取当前 provider 名下的(没填 → 空),人设为空则省略。
  const postBody = (extra: Record<string, unknown>, loc: Locale) => {
    const { ai, systemPrompt } = aiRequestParts();
    return { input, ai, locale: loc, ...(systemPrompt ? { systemPrompt } : {}), ...extra };
  };

  const generate = async (useLens: Lens) => {
    const myRun = ++run.current;
    const live = () => run.current === myRun;
    generating.current = true;
    startedFor.current = key;
    setLens(useLens);
    setShownLens(useLens);
    const local: Slot[] = segments.map((): Slot => ({ text: "", status: "streaming", err: "" }));
    setSlots([...local]);

    await Promise.all(
      segments.map((seg, i) =>
        streamPost(endpoint, postBody({ section: seg.key, lens: useLens }, locale), (full) => {
          local[i] = { ...local[i]!, text: full };
          if (live()) setSlots([...local]);
        })
          .then(() => {
            local[i] = { ...local[i]!, status: "done" };
            // 成功且有正文 → 通知父组件存入本机历史(失败/吐空/已作廢的不存)。
            // 思考同正文分開存:正文為空(思考食晒)嗰節唔好當成功歸檔。
            if (live() && local[i]!.text.trim()) {
              const sp = splitThinking(local[i]!.text);
              if (sp.content) onSectionDone?.(seg.key, sp.content, useLens, sp.thinking || undefined);
            }
          })
          .catch((e: unknown) => {
            // 模型下架 → 清模型缓存,下次打开设置时重新拉取(已滤走下架模型)。
            if ((e as { code?: string })?.code === "MODEL_NOT_FOUND") clearModelsCache();
            local[i] = {
              ...local[i]!, status: "error", err: e instanceof Error ? e.message : t("report.segFailShort"),
              code: (e as { code?: string })?.code,
            };
          })
          .finally(() => {
            if (live()) setSlots([...local]);
          }),
      ),
    );
    if (live()) generating.current = false;
  };

  // 命盤頁「生成 AI 解讀」:未生成過先開始,已有內容(含歷史恢復)直接睇。
  useEffect(() => {
    if (!startSignal || slots) return;
    void generate("both");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  /**
   * 單節重試:只重跑指定章節,其他章節原樣保留。
   * 用每節獨立嘅 retry id 做作廢判斷,唔干擾整輪 generate 嘅 run id,
   * 所以可以喺其他節仲串流緊嗰陣重試(亦支援多節同時重試)。
   * 命盤一換(run.current 變)就作廢,唔會寫落新命盤。
   */
  const retryIds = useRef(new Map<number, number>());
  const retrySection = async (index: number) => {
    const seg = segments[index];
    if (!seg || !slots) return;
    const useLens = shownLens ?? lens;
    const baseRun = run.current;
    const myId = (retryIds.current.get(index) ?? 0) + 1;
    retryIds.current.set(index, myId);
    const live = () => retryIds.current.get(index) === myId && run.current === baseRun;
    setSlots((prev) => (prev ? prev.map((s, i) => (i === index ? { text: "", status: "streaming", err: "" } : s)) : prev));
    try {
      let full = "";
      await streamPost(endpoint, postBody({ section: seg.key, lens: useLens }, locale), (text) => {
        full = text;
        if (!live()) return;
        setSlots((prev) => (prev ? prev.map((s, i) => (i === index ? { ...s, text } : s)) : prev));
      });
      if (!live()) return;
      setSlots((prev) => (prev ? prev.map((s, i) => (i === index ? { ...s, status: "done" } : s)) : prev));
      if (full.trim()) {
        const sp = splitThinking(full);
        if (sp.content) onSectionDone?.(seg.key, sp.content, useLens, sp.thinking || undefined);
      }
    } catch (e: unknown) {
      if (!live()) return;
      // 模型下架 → 清模型缓存,下次打开设置时重新拉取(已滤走下架模型)。
      if ((e as { code?: string })?.code === "MODEL_NOT_FOUND") clearModelsCache();
      const errMsg = e instanceof Error ? e.message : t("report.segFailShort");
      const code = (e as { code?: string })?.code;
      setSlots((prev) => (prev ? prev.map((s, i) => (i === index ? { ...s, status: "error", err: errMsg, code } : s)) : prev));
    } finally {
      if (retryIds.current.get(index) === myId) retryIds.current.delete(index);
    }
  };

  const exportPdf = () => {
    const html = secRef.current?.innerHTML;
    if (!html) return;
    const d = input;
    const tag = shownLens ? ` · ${lensLabel(shownLens)}` : "";
    const meta = `${d.year}-${d.month}-${d.day} ${String(d.hour).padStart(2, "0")}:${String(d.minute ?? 0).padStart(2, "0")} ${d.gender}${tag}`;
    printReport(`${title}${tag}`, html, meta, {
      lang: HTML_LANG[locale],
      foot: t("app.disclaimer1"),
      blocked: t("report.popupBlocked"),
    });
  };

  const toggle = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  /** 剛手動跳轉(點擊 strip)後 900ms 內不讓 observer 搶 active,避免平滑滾動中途閃爍。 */
  const jumpLock = useRef(0);

  const jump = (k: string) => {
    setActive(k);
    jumpLock.current = Date.now();
    if (collapsible) setOpen((s) => new Set(s).add(k));
    // 等展開後先捲動。
    requestAnimationFrame(() =>
      document.getElementById(`${idBase}-${k}`)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" }),
    );
  };

  const anyError = !!slots?.some((s) => s.status === "error");

  // 章節 strip 跟住當前節橫向捲(只捲 strip,唔郁頁面),讀到後面幾節都見到自己喺邊。
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>(`[data-k="${active}"]`);
    if (!strip || !chip) return;
    const l = chip.offsetLeft;
    const r = l + chip.offsetWidth;
    if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: Math.max(0, l - 16), behavior: scrollBehavior() });
    }
  }, [active]);

  /** 換視角:存低當前結果,有舊結果就即刻顯示,冇就等用戶撳生成(唔會自動覆蓋)。 */
  const switchLens = (l: Lens) => {
    if (running || l === lens) return;
    if (slots) byLens.current[lens] = slots;
    const cached = byLens.current[l];
    setLens(l);
    setSlots(cached ?? null);
    setShownLens(cached ? l : null);
  };
  /** 有任何視角生成過(用嚟決定未生成視角嗰陣都顯示換視角行)。 */
  const anyLensCached = Object.keys(byLens.current).length > 0;
  /** 額度用盡:各節同時失敗,收成一張卡,唔再逐節重試(重試都係 429)。 */
  const budget = slots?.find((s) => s.code === "AI_BUDGET");
  /** 全部節都係額度失敗:章節列表同進度都收起,得返額度卡。 */
  const allBudget = !!slots?.length && slots.every((s) => s.code === "AI_BUDGET");
  /** 非額度錯誤先提示檢查 provider 配置。 */
  const otherError = !!slots?.some((s) => s.status === "error" && s.code !== "AI_BUDGET");

  // scrollspy:單一 IntersectionObserver 監聽各節 <article>;
  // 章節頂部進入視口上方帶即把 strip 高亮切過去。串流中 article 元素不變,照常生效。
  useEffect(() => {
    const root = secRef.current;
    if (!root || !slots) return;
    const articles = Array.from(root.querySelectorAll("article[id]"));
    if (articles.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - jumpLock.current < 900) return;
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis.length === 0) return;
        vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const el = vis[0]!.target as HTMLElement;
        const k = el.id.startsWith(`${idBase}-`) ? el.id.slice(idBase.length + 1) : "";
        if (k) setActive(k);
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    articles.forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, [slots, idBase]);

  const lensRow = budget ? null : (
    <div className="lens-block">
      <div className="lens-row">
        <span className="lens-lbl">{running ? t("report.lensBusy") : t("report.regen")}</span>
        <Seg
          compact
          disabled={running}
          label={t("report.regen")}
          value={lens}
          onChange={switchLens}
          options={LENSES.map((l) => ({ value: l.key, label: t(l.labelKey) }))}
        />
      </div>
      {slots ? (
        <button type="button" className="btn secondary small" onClick={() => generate(lens)} disabled={running}>
          <Icon name="refresh" />
          {t("report.regenThis")}
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <ScreenNav eyebrow={title} onBack={onBack}>
        <button
          type="button"
          className="icon-btn"
          onClick={exportPdf}
          disabled={!slots || running || !!budget}
          aria-label={t("report.exportPdf")}
        >
          <Icon name="download" />
        </button>
      </ScreenNav>

      {children}

      {/* 未生成:先講清楚生成乜(換咗視角就先出視角揀選),主行動喺下面 */}
      {!slots ? (anyLensCached ? lensRow : <p className="note">{description}</p>) : null}

      <div className="report-controls">
        {!slots ? (
          // 未生成(首次,或者換咗去未生成嘅視角):一粒主行動,同命盤頁 CTA 同一個講法。
          <button type="button" className="btn block" onClick={() => generate(lens)}>
            <Icon name="spark" />
            {t("report.generateLens", { lens: lensLabel(lens) })}
          </button>
        ) : null}
        <AiModelNote />
      </div>

      {!slots ? (
        <>
          <p className="note">{anyLensCached ? t("report.lensIdle") : t("report.idleHint")}</p>
        </>
      ) : (
        <>
          {/* 進度完成後收起;完成嗰下用隱藏 live region 讀一次 */}
          <span className="sr-only" role="status">{!running && !anyError && !allBudget ? t("report.stateDone") : ""}</span>
          <div className="progress" hidden={allBudget || !(running || anyError)}>
            <span role="status" aria-live="polite">
              {running || anyError
                ? t("report.progressShort", { done: running ? settled : slots.filter((s) => s.status === "done").length, total: segments.length })
                : t("report.stateDone")}
            </span>
            <div className="bar"><i style={{ width: `${(settled / segments.length) * 100}%` }} /></div>
            {shownLens ? <span className="tag">{lensLabel(shownLens)}</span> : null}
          </div>

          {budget ? (
            <div className="card empty" role="status">
              <Icon name="clock" />
              <div className="empty-t">{t("report.budgetTitle")}</div>
              <p className="note">{t("report.budgetBody")}</p>
              {onShowChart ? (
                <button type="button" className="btn block" onClick={onShowChart}>
                  <Icon name="grid" />
                  {t("report.budgetBack")}
                </button>
              ) : null}
              <button type="button" className="btn secondary block" onClick={() => go("settings")}>
                <Icon name="gear" />
                {t("report.budgetSettings")}
              </button>
              {/* REAL-ERROR RULE:服務端原文照樣顯示(標明係技術細節) */}
              <p className="note budget-tech">{t("report.budgetTech")}{budget.err}</p>
            </div>
          ) : null}

          {/* 手機:頂部 sticky 章節 strip;桌面:左側 sticky 目錄 + 右側正文(.report-body grid) */}
          <div className="report-body" hidden={allBudget}>
            <div className="strip sticky-strip" ref={stripRef}>
              {segments.map((seg, i) => {
                const s = slots[i];
                if (s?.code === "AI_BUDGET") return null;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    data-k={seg.key}
                    aria-current={active === seg.key ? "true" : undefined}
                    className={`chip${active === seg.key ? " on" : ""}`}
                    onClick={() => jump(seg.key)}
                  >
                    {s?.status === "streaming" ? <span className="dot" aria-hidden="true" /> : null}
                    {seg.label}
                  </button>
                );
              })}
            </div>

            <div ref={secRef} className="report-secs">
              {segments.map((seg, i) => {
                const s: Slot = slots[i] ?? { text: "", status: "streaming", err: "" };
                // 額度失敗嘅節唔逐張出「失敗」卡,額度卡已經講晒。
                if (s.code === "AI_BUDGET") return null;
                const has = s.text.trim() !== "";
                const state =
                  s.status === "done" ? "stateDone"
                    : s.status === "error" ? "segFailShort"
                      : has ? "stateStreaming" : "stateQueued";
                const cls = [
                  "sec",
                  s.status === "streaming" ? (has ? "streaming" : "pending") : "",
                  s.status === "error" ? "failed" : "",
                ].filter(Boolean).join(" ");
                const isOpen = !collapsible || open.has(seg.key);
                // 朗讀本節:修復佔位符 → 去 markdown → 分句排隊讀。
                const rawBody = repairText ? repairText(stripLeadingHeading(s.text)) : stripLeadingHeading(s.text);
                const readText = has ? speechText(rawBody) : "";
                const head = (
                  <>
                    <Icon name={SECTION_ICON[seg.key] ?? "spark"} />
                    <span className="sec-title">{seg.label}</span>
                  </>
                );
                return (
                  <article className={cls} id={`${idBase}-${seg.key}`} key={seg.key}>
                    {/* 標題淨係標題(讀屏唔會讀埋狀態同朗讀掣);狀態只喺未完成先顯示 */}
                    <div className="sec-hd-row">
                      <h2 className="sec-hd">
                        {collapsible ? (
                          <button
                            type="button"
                            className="sec-h"
                            aria-expanded={isOpen}
                            aria-controls={`${idBase}-${seg.key}-b`}
                            onClick={() => toggle(seg.key)}
                          >
                            {head}
                            <Icon name="chevDown" small className={`caret-ic${isOpen ? " up" : ""}`} />
                          </button>
                        ) : (
                          <span className="sec-h">{head}</span>
                        )}
                      </h2>
                      {state !== "stateDone" ? <span className="sec-state">{t(`report.${state}` as TKey)}</span> : null}
                      {readText ? (
                        <span className="sec-tts" title={t("select.readSection")}>
                          <PronounceButton text={readText} locale={locale} mode="all" langs={ttsLangs} />
                        </span>
                      ) : null}
                    </div>
                    <div className="sec-b" id={`${idBase}-${seg.key}-b`} hidden={!isOpen}>
                      {has ? (
                        <SectionBodyView
                          md={repairText ? repairText(stripLeadingHeading(s.text)) : stripLeadingHeading(s.text)}
                          streaming={s.status === "streaming"}
                          renderCustom={(body) => renderSectionBody?.(seg.key, body, shownLens ?? "both") ?? null}
                        />
                      ) : null}
                      {has ? basis?.(seg.key) : null}
                      {has && sectionNotes?.[seg.key] ? (
                        <p className="note">{sectionNotes[seg.key]}</p>
                      ) : null}
                      {has ? null : s.status === "streaming" ? (
                        <div aria-hidden="true">
                          <div className="skel" /><div className="skel w80" /><div className="skel w60" />
                        </div>
                      ) : s.status === "error" ? (
                        <div className="sec-error">
                          <p className="notice" role="alert">{t("report.segFail", { err: s.err })}</p>
                          <button type="button" className="btn secondary small" onClick={() => retrySection(i)}>
                            <Icon name="refresh" />
                            {t("report.retrySection")}
                          </button>
                        </div>
                      ) : (
                        <p className="note">{t("report.segEmpty")}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {otherError ? <p className="note">{t("report.providerHint")}</p> : null}

          {/* 換視角放報告尾:讀完先決定要唔要換個角度 */}
          {allBudget ? null : lensRow}

          {next && !budget ? (
            <button type="button" className="btn block next-step" onClick={next.onClick} disabled={running}>
              {next.label}
              <Icon name="chev" />
            </button>
          ) : null}

          <div className="btn-row" hidden={!!budget}>
            {onAsk ? (
              <button type="button" className="btn secondary" onClick={onAsk}>
                <Icon name="msg" />
                {t("report.ask")}
              </button>
            ) : null}
            <button type="button" className="btn secondary" onClick={exportPdf} disabled={running}>
              <Icon name="download" />
              {t("report.exportPdf")}
            </button>
          </div>

          <p className="disclaimer">
            {t("app.disclaimer1")}<br />
            {t("app.disclaimer2")}
          </p>
        </>
      )}
    </>
  );
}
