"use client";

import { useState } from "react";
import {
  getHexagram,
  ZHANLI_CASES,
  type ZhanliCase,
  type ZhanliQuoteRef,
} from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { withQuoteRefs, type QuoteRefEntry } from "@/lib/quoteRef";
import { withTermHighlights } from "@/lib/highlightTerms";

function HexFigure({ bits }: { bits: number[] }) {
  // bits 由下而上
  return (
    <span className="inline-flex flex-col gap-[3px]" aria-hidden>
      {[...bits].reverse().map((b, i) => (
        <span key={i} className="flex gap-[3px]">
          {b === 1 ? (
            <span className="block h-[3px] w-10 rounded-full bg-current" />
          ) : (
            <>
              <span className="block h-[3px] w-[18px] rounded-full bg-current" />
              <span className="block h-[3px] w-[18px] rounded-full bg-current" />
            </>
          )}
        </span>
      ))}
    </span>
  );
}

const VERDICT_KEY: Record<ZhanliCase["outcome"]["verdict"], string> = {
  "應驗": "cases.verdict.fulfilled",
  "部分應驗": "cases.verdict.partial",
  "存疑": "cases.verdict.unrecorded",
};

function VerdictBadge({
  verdict,
  loc,
}: {
  verdict: ZhanliCase["outcome"]["verdict"];
  loc: YijingLocale;
}) {
  const cls = {
    "應驗": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "部分應驗": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    "存疑": "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  }[verdict];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {yjT(VERDICT_KEY[verdict], loc)}
    </span>
  );
}

function toQuoteRefEntry(q: ZhanliQuoteRef): QuoteRefEntry {
  return {
    id: q.id,
    quote: q.quote,
    fullText: q.fullText,
    sourceLabel: q.sourceLabel,
    url: q.url,
  };
}

function CaseDetail({ c, loc, onBack }: { c: ZhanliCase; loc: YijingLocale; onBack: () => void }) {
  // 案例係繁體正本(古籍原文 + 白話)→ zT(只喺 zhs 轉)
  const { zT } = useScript();
  const d = c.divination;
  const ben = getHexagram(d.hexagramNum);
  const bian = d.changedToNum ? getHexagram(d.changedToNum) : null;
  const refs = c.quoteRefs.map(toQuoteRefEntry);
  if (!ben) return null;

  return (
    <article className="mx-auto max-w-2xl px-4 pb-16">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← {yjT("cases.title", loc)}
      </button>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{zT(c.title)}</h1>
      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {yjT("cases.source", loc)}：{zT(c.sourceLabel)}
        {" · "}
        <a
          href={c.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          查原文 ↗
        </a>
      </div>

      {/* 占斷資訊 */}
      <section className="mt-6 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            {yjT("cases.method", loc)}：
            <span className="text-zinc-800 dark:text-zinc-200">{zT(d.method)}</span>
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {yjT("cases.moving", loc)}：
            <span className="text-zinc-800 dark:text-zinc-200">{zT(d.movingLines)}</span>
          </span>
          <span className="ml-auto">
            <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-zinc-800 dark:text-zinc-200">
          <div className="flex flex-col items-center gap-2">
            <HexFigure bits={ben.bits} />
            <span className="text-sm font-medium">
              {zT(d.hexagram)} <span className="text-zinc-400">· {yjT("cases.ben", loc)}</span>
            </span>
          </div>
          {bian && (
            <>
              <span className="text-xl text-zinc-400">之</span>
              <div className="flex flex-col items-center gap-2">
                <HexFigure bits={bian.bits} />
                <span className="text-sm font-medium">
                  {zT(d.changedTo)}{" "}
                  <span className="text-zinc-400">· {yjT("cases.bian", loc)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 原文 */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">
          {yjT("cases.original", loc)}
        </h2>
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          {c.originalText.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="mb-4 font-serif text-[17px] leading-9 text-zinc-900 last:mb-0 dark:text-zinc-100"
            >
              {zT(para)}
            </p>
          ))}
        </div>
      </section>

      {/* 本站白話解說 */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">
          {yjT("cases.baihua", loc)}
        </h2>
        <div className="space-y-4">
          {c.baihua.map((p, i) => (
            <p key={i} className="leading-8 text-zinc-700 dark:text-zinc-300">
              {withTermHighlights(withQuoteRefs(p, refs), zT)}
            </p>
          ))}
        </div>
      </section>

      {/* 歷史應驗 */}
      <section className="mt-8 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-widest text-emerald-700 dark:text-emerald-400">
          {yjT("cases.history", loc)} <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
        </h2>
        <p className="font-serif text-[16px] leading-8 text-zinc-800 dark:text-zinc-200">
          {zT(c.outcome.text)}
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          {zT(c.outcome.reason)}
        </p>
      </section>
    </article>
  );
}

export default function CasesPage() {
  const { locale } = useLocale();
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? ZHANLI_CASES.find((c) => c.id === activeId) ?? null : null;

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        {!active ? (
          <>
            <h1 className="text-2xl font-bold">{yjT("cases.title", loc)}</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {yjT("cases.sub", loc)}
            </p>
            <p className="mt-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              {yjT("cases.intro", loc)}
            </p>
            <div className="mt-6 space-y-3">
              {ZHANLI_CASES.map((c) => {
                const ben = getHexagram(c.divination.hexagramNum);
                if (!ben) return null;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 text-left transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                  >
                    <span className="shrink-0 text-zinc-700 dark:text-zinc-300">
                      <HexFigure bits={ben.bits} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">
                        {zT(c.title)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {zT(c.sourceLabel)} · {zT(c.divination.hexagram)}
                        {c.divination.changedTo ? `之${zT(c.divination.changedTo)}` : ""}
                      </span>
                    </span>
                    <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
                    <span className="shrink-0 text-zinc-400">›</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <CaseDetail c={active} loc={loc} onBack={() => setActiveId(null)} />
        )}
      </main>
    </div>
  );
}
