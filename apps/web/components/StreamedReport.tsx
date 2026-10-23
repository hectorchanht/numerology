"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { printReport } from "@/lib/exportPdf";
import { aiRequestParts } from "@/lib/aiSettings";
import { useLocale, HTML_LANG, type Locale, type TKey } from "@/lib/i18n";
import { stripLeadingHeading } from "@/lib/sectionIcons";
import { markdownTermComponents, withTermHighlights } from "@/lib/highlightTerms";
import { splitTldr } from "@/lib/tldr";
import { parseEvidenceBlock } from "@/lib/fortuneBlocks";
import { Icon, SECTION_ICON } from "@/components/Icon";
import { AiModelNote } from "@/components/AiModelNote";
import { Seg, ScreenNav } from "@/components/ui";
import { PronounceButton } from "@dawn-studio/pronounce";
import { speechText } from "@/lib/speechText";

/** 分段定义:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,label 用作章節卡標題。 */
export interface ReportSeg {
  key: string;
  label: string;
}

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
  /** 某节成功生成后回调(供历史记录保存):(sectionKey, 正文 markdown, lens)。 */
  onSectionDone?: (segKey: string, markdown: string, lens: string) => void;
  /** 从历史记录恢复:sectionKey → 正文 markdown(不含 ## 标题,按当前语言重拼)。 */
  restoredSections?: Record<string, string> | null;
  /** 章節可摺疊(大運深析用);預設首節展開。 */
  collapsible?: boolean;
  /** 追問 AI:打開命盤對話。 */
  onAsk?: () => void;
  /** 頂部返回鍵。 */
  onBack?: () => void;
  /** 插喺導航同視角控件之間的內容(例如大運時間線)。 */
  children?: React.ReactNode;
  /**
   * 渲染前對正文做確定性修復(大運流年用:小标题数字、紫微大限:無)。
   * 渲染時應用,故 KV/歷史記錄裡的舊佔位文本也會被修復,不改存檔原文。
   */
  repairText?: (md: string) => string;
  /**
   * 自訂章節正文渲染(傳回 null 即用預設 SectionBody)。
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
}

/**
 * 預設章節正文渲染(「結論先行,證據收納」):
 * TL;DR 切出做摘要卡 + 正文 + 段尾【依据】塊收納為次要樣式。
 * 舊緩存/舊歷史無標記 → 退化為純正文渲染,不吞內容。
 */
function SectionBody({
  segKey,
  md,
  streaming,
  lens,
  renderSectionBody,
}: {
  segKey: string;
  md: string;
  streaming: boolean;
  lens: "bazi" | "ziwei" | "both";
  renderSectionBody?: (
    segKey: string,
    md: string,
    lens: "bazi" | "ziwei" | "both",
  ) => React.ReactNode | null;
}) {
  const { t } = useLocale();
  // TL;DR 先抽出做摘要卡(所有章節通用),再交自訂渲染或預設正文。
  const { tldr, body } = splitTldr(md);
  const custom = renderSectionBody?.(segKey, body, lens);
  const { body: main, evidence } = parseEvidenceBlock(body);
  return (
    <>
      {tldr ? (
        <div className="tldr-card">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
            {tldr}
          </ReactMarkdown>
        </div>
      ) : null}
      {custom !== null && custom !== undefined ? (
        <>{custom}</>
      ) : (
        <>
          <div className={`prose${streaming ? " is-streaming" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
              {main}
            </ReactMarkdown>
          </div>
          {evidence.length > 0 ? (
            <details className="evid">
              <summary>{t("fortune.evidence")}</summary>
              <ul className="evid-list">
                {evidence.map((e, i) => (
                  <li key={i}>{withTermHighlights(e)}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </>
  );
}

/** 通用流式报告:选视角 → 各节并行调 endpoint → 每节一张卡,逐字渲染 Markdown。 */
export function StreamedReport({
  input, endpoint, title, description, segments, onSectionDone, restoredSections,
  collapsible, onAsk, onBack, children, repairText, renderSectionBody,
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

  const idBase = endpoint.replace(/\W/g, "");
  const running = !!slots?.some((s) => s.status === "streaming");
  const settled = slots ? slots.filter((s) => s.status !== "streaming").length : 0;
  const lensLabel = (l: Lens) => t(LENSES.find((x) => x.key === l)!.labelKey);

  const key = JSON.stringify(input);
  // 換咗命盤 → 作廢舊一輪並清空。
  useEffect(() => {
    if (startedFor.current && startedFor.current !== key) {
      run.current += 1;
      generating.current = false;
      startedFor.current = "";
      setSlots(null);
      setShownLens(null);
    }
  }, [key]);

  // 从历史记录恢复:直接显示为完成态,零 API 调用。
  useEffect(() => {
    if (!restoredSections) return;
    if (generating.current && startedFor.current === key) return;
    run.current += 1;
    startedFor.current = key;
    setSlots(segments.map((seg): Slot => ({ text: restoredSections[seg.key] ?? "", status: "done", err: "" })));
    setShownLens(null);
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
            if (live() && local[i]!.text.trim()) onSectionDone?.(seg.key, local[i]!.text, useLens);
          })
          .catch((e: unknown) => {
            local[i] = { ...local[i]!, status: "error", err: e instanceof Error ? e.message : t("report.segFailShort") };
          })
          .finally(() => {
            if (live()) setSlots([...local]);
          }),
      ),
    );
    if (live()) generating.current = false;
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
      document.getElementById(`${idBase}-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const anyError = !!slots?.some((s) => s.status === "error");

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

  return (
    <>
      <ScreenNav eyebrow={title} onBack={onBack}>
        <button
          type="button"
          className="icon-btn"
          onClick={exportPdf}
          disabled={!slots || running}
          aria-label={t("report.exportPdf")}
        >
          <Icon name="download" />
        </button>
      </ScreenNav>

      {children}

      <div className="report-controls">
        <Seg
          compact
          label={t("report.pickLens")}
          value={lens}
          onChange={setLens}
          options={LENSES.map((l) => ({ value: l.key, label: t(l.labelKey) }))}
        />
        <button type="button" className="btn block" onClick={() => generate(lens)} disabled={running}>
          <Icon name={slots ? "refresh" : "spark"} />
          {slots ? t("report.regenShort") : t("report.generate")}
        </button>
        <AiModelNote />
      </div>

      {!slots ? (
        <>
          <p className="note">{description}</p>
          <p className="note">{t("report.idleHint")}</p>
        </>
      ) : (
        <>
          <div className="progress">
            <span>
              {running || anyError
                ? t("report.progressShort", { done: running ? settled : slots.filter((s) => s.status === "done").length, total: segments.length })
                : t("report.stateDone")}
            </span>
            <div className="bar"><i style={{ width: `${(settled / segments.length) * 100}%` }} /></div>
            {shownLens ? <span className="tag accent">{lensLabel(shownLens)}</span> : null}
          </div>

          {/* 手機:頂部 sticky 章節 strip;桌面:左側 sticky 目錄 + 右側正文(.report-body grid) */}
          <div className="report-body">
            <div className="strip sticky-strip">
              {segments.map((seg, i) => {
                const s = slots[i];
                return (
                  <button
                    key={seg.key}
                    type="button"
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
                    <span className="sec-state">{t(`report.${state}` as TKey)}</span>
                  </>
                );
                return (
                  <article className={cls} id={`${idBase}-${seg.key}`} key={seg.key}>
                    <h3 className="sec-hd" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {collapsible ? (
                        <button
                          type="button"
                          className="sec-h"
                          style={{ flex: 1, minWidth: 0 }}
                          aria-expanded={isOpen}
                          aria-controls={`${idBase}-${seg.key}-b`}
                          onClick={() => toggle(seg.key)}
                        >
                          {head}
                          <Icon name="chevDown" small className={`caret-ic${isOpen ? " up" : ""}`} />
                        </button>
                      ) : (
                        <span className="sec-h" style={{ flex: 1, minWidth: 0 }}>{head}</span>
                      )}
                      {readText ? (
                        <span style={{ flex: "none" }} title={t("select.readSection")}>
                          <PronounceButton text={readText} locale={locale} mode="all" />
                        </span>
                      ) : null}
                    </h3>
                    <div className="sec-b" id={`${idBase}-${seg.key}-b`} hidden={!isOpen}>
                      {has ? (
                        <SectionBody
                          segKey={seg.key}
                          md={repairText ? repairText(stripLeadingHeading(s.text)) : stripLeadingHeading(s.text)}
                          streaming={s.status === "streaming"}
                          lens={shownLens ?? "both"}
                          renderSectionBody={renderSectionBody}
                        />
                      ) : s.status === "streaming" ? (
                        <div aria-label={t("report.stateQueued")}>
                          <div className="skel" /><div className="skel w80" /><div className="skel w60" />
                        </div>
                      ) : s.status === "error" ? (
                        <p className="notice">{t("report.segFail", { err: s.err })}</p>
                      ) : (
                        <p className="note">{t("report.segEmpty")}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {anyError ? <p className="note">{t("report.providerHint")}</p> : null}

          <div className="btn-row">
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
        </>
      )}
    </>
  );
}
