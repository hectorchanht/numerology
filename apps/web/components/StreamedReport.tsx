"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { printReport } from "@/lib/exportPdf";
import { loadAi } from "@/lib/aiSettings";
import { useLocale, type Locale } from "@/lib/i18n";

/** 分段定义:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,label 用于占位标题。 */
export interface ReportSeg {
  key: string;
  label: string;
}

/** 解读视角:纯八字 / 纯紫微 / 合参。 */
type Lens = "bazi" | "ziwei" | "both";
const LENSES: { key: Lens; labelKey: "report.lensBazi" | "report.lensZiwei" | "report.lensBoth"; tagKey: "report.lensBazi" | "report.lensZiwei" | "report.lensBoth" }[] = [
  { key: "bazi", labelKey: "report.lensBazi", tagKey: "report.lensBazi" },
  { key: "ziwei", labelKey: "report.lensZiwei", tagKey: "report.lensZiwei" },
  { key: "both", labelKey: "report.lensBoth", tagKey: "report.lensBoth" },
];

interface Props {
  input: BirthInput;
  endpoint: string;
  title: string;
  description: string;
  buttonLabel: string;
  /** 传入则启用「分段并行」:各节并发请求、按序就位,绕开 Vercel 60s 上限。不传则整篇一次生成。 */
  segments?: readonly ReportSeg[];
}

type State = "idle" | "streaming" | "done" | "error";

/** 通用流式报告卡:选视角(八字/紫微/合参)→ 调指定 endpoint → 逐字渲染 Markdown。支持分段并行。 */
export function StreamedReport({ input, endpoint, title, description, segments }: Props) {
  const { t, locale } = useLocale();
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [lens, setLens] = useState<Lens>("both");
  const startedFor = useRef<string>("");
  const proseRef = useRef<HTMLDivElement>(null);

  const lensTag = t(LENSES.find((l) => l.key === lens)?.tagKey ?? "report.lensBoth");

  const exportPdf = () => {
    const html = proseRef.current?.innerHTML;
    if (!html) return;
    const d = input;
    const meta = `${d.year}-${d.month}-${d.day} ${String(d.hour).padStart(2, "0")}:${String(d.minute ?? 0).padStart(2, "0")} ${d.gender} · ${lensTag}`;
    printReport(`${title} · ${lensTag}`, html, meta);
  };

  const key = JSON.stringify(input);
  if (startedFor.current && startedFor.current !== key && state !== "streaming") {
    startedFor.current = "";
    if (text) setText("");
    if (progress) setProgress(null);
    if (state !== "idle") setState("idle");
  }

  // 按固定顺序拼接各节;未到/吐空/失败的节给占位,保证顺序与可读性。
  const combine = (segs: readonly ReportSeg[], slots: Slot[]): string =>
    segs
      .map((seg, i) => {
        const sl = slots[i]!;
        if (sl.text.trim()) return sl.text;
        if (sl.status === "error") return `## ${seg.label}\n\n${t("report.segFail", { err: sl.err })}`;
        if (sl.status === "done") return `## ${seg.label}\n\n${t("report.segEmpty")}`;
        return `## ${seg.label}\n\n${t("report.segWorking")}`;
      })
      .join("\n\n");

  const postBody = (extra: Record<string, unknown>, loc: Locale) => ({ input, ai: loadAi(), locale: loc, ...extra });

  const generateSegmented = async (segs: readonly ReportSeg[], useLens: Lens, loc: Locale) => {
    setError("");
    setText("");
    setState("streaming");
    startedFor.current = key;
    const slots: Slot[] = segs.map(() => ({ text: "", status: "streaming", err: "" }));
    setProgress({ done: 0, total: segs.length });
    setText(combine(segs, slots));
    let settled = 0;
    const bump = () => setProgress({ done: ++settled, total: segs.length });

    await Promise.all(
      segs.map((seg, i) =>
        streamPost(endpoint, postBody({ section: seg.key, lens: useLens }, loc), (full) => {
          slots[i] = { ...slots[i], text: full };
          setText(combine(segs, slots));
        })
          .then(() => {
            slots[i] = { ...slots[i], status: "done" };
          })
          .catch((e: unknown) => {
            slots[i] = { ...slots[i], status: "error", err: e instanceof Error ? e.message : t("report.segFailShort") };
          })
          .finally(() => {
            bump();
            setText(combine(segs, slots));
          }),
      ),
    );
    setProgress(null);
    setState("done");
  };

  const generateSingle = async (useLens: Lens, loc: Locale) => {
    setText("");
    setError("");
    setState("streaming");
    startedFor.current = key;
    try {
      await streamPost(endpoint, postBody({ lens: useLens }, loc), (full) => setText(full));
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("report.genFail"));
      setState("error");
    }
  };

  const generate = (useLens: Lens) => {
    setLens(useLens);
    return segments && segments.length ? generateSegmented(segments, useLens, locale) : generateSingle(useLens, locale);
  };

  return (
    <div className="card">
      <h2 className="section-title">
        {title}
        {state !== "idle" ? <span className={`lens-tag is-${lens}`}>{lensTag}</span> : null}
      </h2>

      {state === "idle" ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>{description}</p>
          <p className="muted" style={{ marginTop: "0.4rem" }}>
            {t("report.pickLens")}<strong>{t("report.lensBazi")}</strong>{t("report.hintBazi")}、<strong>{t("report.lensZiwei")}</strong>{t("report.hintZiwei")}、<strong>{t("report.lensBoth")}</strong>{t("report.hintBoth")}。
          </p>
          <div className="lens-row">
            {LENSES.map((l) => (
              <button key={l.key} className={`btn lens-btn is-${l.key}`} onClick={() => generate(l.key)}>
                {t(l.labelKey)}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {state === "streaming" && progress ? (
        <p className="muted" style={{ marginTop: 0 }}>
          {t("report.progress", { done: progress.done, total: progress.total })}
        </p>
      ) : null}

      {error ? <p className="notice">{error}{t("report.providerHint")}</p> : null}

      {text ? (
        <div ref={proseRef} className={`prose ${state === "streaming" ? "cursor" : ""}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      ) : state === "streaming" ? (
        <p className="muted">{t("report.generating")}</p>
      ) : null}

      {state === "done" || state === "error" ? (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <span className="muted" style={{ marginRight: "0.2rem" }}>{t("report.regen")}</span>
          {LENSES.map((l) => (
            <button key={l.key} className={`btn ghost ${l.key === lens ? "lens-active" : ""}`} onClick={() => generate(l.key)}>
              {t(l.labelKey)}
            </button>
          ))}
          {state === "done" ? (
            <button className="btn ghost" onClick={exportPdf}>{t("report.exportPdf")}</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface Slot {
  text: string;
  status: "streaming" | "done" | "error";
  err: string;
}
