"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  castYijing,
  type CastResult,
  type CoinLine,
} from "@numerology/engine";
import { getHexagram, yaoName, LEGGE, LEGGE_SOURCE } from "@numerology/knowledge";
import { useLocale, useScript, HTML_LANG } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { yjT, yjFmt, type YijingLocale } from "@/lib/yijingStrings";
import { AiInterpret } from "./AiInterpret";
import { Term, withTermHighlights } from "@/lib/highlightTerms";
import { saveYijingCast, getYijingCast } from "@/lib/yijingHistory";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ToggleRow } from "@/components/ui";
import { GroupTabs } from "@/components/GroupTabs";
import { CASTING_TABS } from "@/lib/navGroups";

interface TossedLine {
  value: CoinLine;
  /** true=字(heads,3) false=花(tails,2) */
  coins: [boolean, boolean, boolean];
}

const LINE_LABEL: Record<CoinLine, string> = {
  9: "yijing.line.oldYang",
  7: "yijing.line.youngYang",
  8: "yijing.line.youngYin",
  6: "yijing.line.oldYin",
};
function rollLine(): TossedLine {
  const coins = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5] as [
    boolean,
    boolean,
    boolean,
  ];
  const sum = coins.reduce((a, c) => a + (c ? 3 : 2), 0);
  return { value: sum as CoinLine, coins };
}

export default function YijingTool({ historyId }: { historyId?: string }) {
  const { locale } = useLocale();
  // 卦爻辭係繁體正本 → zT(只喺 zhs 轉)
  const { zT } = useScript();
  const router = useRouter();
  const loc = locale as YijingLocale;
  const [question, setQuestion] = useState("");
  /** AI 解卦時係咪將問題一併送去 — Hector 2026-10-23:default 開,分析要對住具體問題 */
  const [sendQ, setSendQ] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("numerology-yj-sendq") !== "0";
    } catch {
      return true;
    }
  });
  const [lines, setLines] = useState<TossedLine[]>([]);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const resultHeadRef = useRef<HTMLHeadingElement | null>(null);
  /** 讀屏通知:每擲一爻 / 六爻已成(擲錢動畫係 aria-hidden) */
  const [announce, setAnnounce] = useState("");
  /** 歷史回顧模式:由 ?h=<id> 入嚟,唔再存檔 */
  const reviewMode = useRef(false);
  const [reviewAt, setReviewAt] = useState<number | null>(null);

  const done = lines.length === 6;
  const cast: CastResult | null = useMemo(
    () => (done ? castYijing(lines.map((l) => l.value)) : null),
    [done, lines],
  );

  // 歷史回顧:還原問題 + 六爻
  useEffect(() => {
    if (!historyId) return;
    let alive = true;
    getYijingCast(historyId)
      .then((rec) => {
        if (!alive || !rec || rec.kind !== "coin" || !rec.lines) return;
        reviewMode.current = true;
        setReviewAt(rec.at);
        if (rec.question) setQuestion(rec.question);
        setLines(
          rec.lines.map((v, i) => ({
            value: v as CoinLine,
            coins: rec.coins?.[i] ?? [true, true, true],
          })),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [historyId]);

  // 起卦完成自動存檔(每組爻值只存一次;回顧模式唔存)
  const savedSig = useRef<string | null>(null);
  useEffect(() => {
    if (!done || !cast || reviewMode.current) return;
    const sig = lines.map((l) => l.value).join(",");
    if (savedSig.current === sig) return;
    savedSig.current = sig;
    saveYijingCast({
      kind: "coin",
      at: Date.now(),
      question: question.trim() || undefined,
      lines: lines.map((l) => l.value),
      coins: lines.map((l) => l.coins),
    }).catch(() => {});
  }, [done, cast, lines, question]);
  const ben = cast ? getHexagram(cast.hexagram) : undefined;
  const bian = cast?.changed ? getHexagram(cast.changed) : undefined;
  const hu = cast ? getHexagram(cast.hu) : undefined;

  const isMoving = (v: CoinLine) => v === 6 || v === 9;
  const posLabel = (pos: number) => yjT(`yijing.pos.${pos}`, loc);
  const coinFace = (heads: boolean) => yjT(heads ? "yijing.coin.heads" : "yijing.coin.tails", loc);
  /** 英文界面:術語前加英文名,中文術語照留(可撳睇解釋) */
  const term = (zh: string, key: string) =>
    loc === "en" ? (
      <>
        {yjT(key, loc)} <Term term={zh} />
      </>
    ) : (
      <Term term={zh} />
    );

  /** 英文界面:Legge 譯文做正文,古文降做下面一行;中文界面照舊只顯示古文 */
  const classic = (zh: string, en: string | undefined) =>
    loc === "en" && en ? (
      <>
        {en}
        <span className="yj-zh">{withTermHighlights(zh, zT)}</span>
      </>
    ) : (
      withTermHighlights(zh, zT)
    );

  const commitLine = (line: TossedLine) => setLines((p) => [...p, line]);

  const tossOne = () => {
    if (rolling || done) return;
    const line = rollLine();
    setRolling(true);
    timer.current = setTimeout(() => {
      commitLine(line);
      setRolling(false);
    }, 650);
  };

  const tossAll = () => {
    if (rolling || done) return;
    const rest: TossedLine[] = [];
    for (let i = lines.length; i < 6; i++) rest.push(rollLine());
    setRolling(true);
    let k = 0;
    const step = () => {
      const l = rest[k];
      if (!l) {
        setRolling(false);
        return;
      }
      commitLine(l);
      k += 1;
      timer.current = setTimeout(step, 320);
    };
    step();
  };

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setLines([]);
    setRolling(false);
    setAnnounce("");
    savedSig.current = null;
    // 由歷史回顧再占:退出回顧模式,新卦照常存檔
    if (reviewMode.current) {
      reviewMode.current = false;
      setReviewAt(null);
      router.replace("/yijing");
    }
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // 六爻已成:讀屏報本卦;手機結果喺下面 → 捲到結果(回顧模式唔捲)
  useEffect(() => {
    if (!done || !ben) return;
    setAnnounce(yjFmt(yjT("yijing.announce.done", loc), { name: loc === "en" ? ben.nameEn : zT(ben.name) }));
    if (reviewMode.current) return;
    // 擲爻掣已卸載 → 焦點交俾結果標題,鍵盤 / 讀屏唔會跌返去 body
    resultHeadRef.current?.focus({ preventScroll: true });
    const el = resultRef.current;
    if (!el) return;
    const below = el.getBoundingClientRect().top > window.innerHeight * 0.55;
    if (!below) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // ben 只隨 cast 變;loc / zT 變唔重新捲
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, ben]);

  const last = lines[lines.length - 1];
  /** 「花花字 = 7 · 少陽」:錢面 + 合數 + 爻名 */
  const lineSummary = (l: TossedLine) =>
    `${l.coins.map((c) => coinFace(c)).join("")} = ${l.value} · ${yjT(LINE_LABEL[l.value], loc)}`;
  const nextN = Math.min(lines.length + 1, 6);

  // 每擲一爻讀屏報一次(第六爻由上面「六爻已成」接手)
  useEffect(() => {
    if (!last || lines.length === 6) return;
    setAnnounce(`${posLabel(lines.length)}:${lineSummary(last)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  return (
    <>
      <GroupTabs links={CASTING_TABS} label={yjT("nav.group.divine", loc)} />

      <div className="masthead">
        <h1>{yjT("yijing.title", loc)}</h1>
        <div className="sub">{yjT("yijing.sub", loc)}</div>
      </div>

      {reviewAt !== null && (
        <p className="yj-review">
          <span className="tag accent">{yjT("yijing.hist.reviewing", loc)}</span>
          <span className="muted">{new Date(reviewAt).toLocaleString(HTML_LANG[locale])}</span>
          <Link href="/yijing/history">{yjT("yijing.hist.backToHistory", loc)}</Link>
        </p>
      )}

      {/* .yj-layout:手機 display:contents;桌面左欄問卦/起卦、右欄卦象結果 */}
      <div className="yj-layout">
        <div className="yj-col">
          <div className="card yj-ask">
            <div className="field">
              <label htmlFor="yj-q">{yjT("yijing.question.label", loc)}</label>
              <input
                id="yj-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={yjT("yijing.question.ph", loc)}
                maxLength={200}
                readOnly={done}
              />
            </div>
          </div>
          <p className="note">
            {term("問卦", "yijing.wenGua")} · {yjT("yijing.askHonest", loc)}
          </p>

          <section className="card yj-stage" aria-labelledby="yj-stage-h">
            <h2 id="yj-stage-h" className="yj-stage-h">
              {done ? yjT("yijing.done", loc) : yjFmt(yjT("yijing.progress", loc), { n: lines.length })}
            </h2>

            {!done && (
              <div className="yj-tray" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={rolling ? `r${i}` : `${lines.length}-${i}`}
                    className={`yj-coin${rolling ? " flipping" : last ? " landed" : ""}`}
                    style={rolling ? { animationDelay: `${i * 0.08}s` } : undefined}
                  >
                    {!rolling && last ? coinFace(last.coins[i]!) : <i className="yj-hole" />}
                  </span>
                ))}
              </div>
            )}

            {!done && (
              <p className="yj-last" aria-hidden="true">
                {!rolling && last ? lineSummary(last) : "\u00a0"}
              </p>
            )}

            {/* 主按鈕緊貼擲錢盤,手機首屏撳得到 */}
            {!done && (
              <button type="button" className="btn block yj-toss" onClick={tossOne} disabled={rolling}>
                {yjFmt(yjT("yijing.toss", loc), { n: nextN })}
              </button>
            )}

            {lines.length === 0 && <p className="note yj-hint">{yjT("yijing.stageHint", loc)}</p>}

            {/* 六爻由下而上疊起:未擲嘅位留空槽 */}
            <ol className={`yj-stack${done ? "" : " casting"}`}>
              {[6, 5, 4, 3, 2, 1].map((pos) => {
                const l = lines[pos - 1];
                const mv = l ? isMoving(l.value) : false;
                const yang = l ? l.value === 7 || l.value === 9 : false;
                const isNext = !done && pos === lines.length + 1;
                return (
                  <li key={pos} className={`yj-slot${l ? " filled" : ""}${isNext ? " next" : ""}${mv ? " moving" : ""}`}>
                    <span className="yj-pos">{posLabel(pos)}</span>
                    <span className="yj-bar" aria-hidden="true">
                      {l ? (
                        yang ? (
                          <i />
                        ) : (
                          <>
                            <i />
                            <i />
                          </>
                        )
                      ) : null}
                    </span>
                    <span className="yj-val">
                      {l ? (
                        <>
                          {yjT(LINE_LABEL[l.value], loc)}
                          {mv ? <span className="yj-mv">{yjT("yijing.moving", loc)}</span> : null}
                        </>
                      ) : null}
                    </span>
                    <span className="yj-faces" aria-hidden="true">
                      {l ? l.coins.map((c) => coinFace(c)).join("") : null}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* 「全部自動」擺喺爻疊之下,同主掣拉開距離,免手指滑錯一次過擲晒 */}
            {!done && (
              <button type="button" className="text-btn yj-auto" onClick={tossAll} disabled={rolling}>
                {yjT("yijing.auto", loc)}
              </button>
            )}

            {done && (
              <button type="button" className="btn secondary block yj-again" onClick={reset}>
                <Icon name="refresh" />
                {yjT("yijing.reset", loc)}
              </button>
            )}

            <details className="yj-how">
              <summary>{yjT("yijing.how.title", loc)}</summary>
              <p>{yjT("yijing.how.body", loc)}</p>
              <Link href="/yijing/academy">{yjT("yijing.how.academy", loc)}</Link>
            </details>

            <p className="sr-only" aria-live="polite">
              {announce}
            </p>
          </section>
        </div>

        {cast && ben && (
          <section className="card yj-result" ref={resultRef} aria-labelledby="yj-res-h">
            <h2 id="yj-res-h" className="sr-only" tabIndex={-1} ref={resultHeadRef}>
              {yjT("yijing.result", loc)}
            </h2>
            {question.trim() ? <p className="yj-q-echo">{question.trim()}</p> : null}
            <div className="yj-ben">
              <span className="yj-sym" aria-hidden="true">
                {ben.symbol}
              </span>
              <div className="yj-ben-t">
                <div className="yj-name">
                  {term("本卦", "yijing.benGua")} · {zT(ben.name)}
                </div>
                <div className="muted">
                  {ben.pinyin} · {ben.nameEn} · #{ben.number}
                </div>
              </div>
            </div>
            <p className="yj-judg">
              <span className="yj-lab">{term("卦辭", "yijing.judgment")}</span>
              {classic(ben.judgment, LEGGE[ben.number]?.judgment)}
            </p>

            {cast.changing.length > 0 ? (
              <div className="yj-moving">
                <h3 className="yj-sub-h">{term("動爻", "yijing.changing")}</h3>
                {cast.changing.map((p) => (
                  <div key={p} className="yj-yao">
                    <div className="yj-yao-n">{zT(yaoName(ben, p))}</div>
                    <div>{classic(ben.lines[p - 1] ?? "", LEGGE[ben.number]?.lines[p - 1])}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="note">{yjT("yijing.noChange", loc)}</p>
            )}

            {bian && (
              <div className="yj-sub">
                <h3 className="yj-sub-h">
                  <span className="yj-sym-sm" aria-hidden="true">
                    {bian.symbol}
                  </span>
                  <span>
                    {term("變卦", "yijing.bianGua")} · {zT(bian.name)}
                  </span>
                </h3>
                <p>
                  <span className="yj-lab">{term("卦辭", "yijing.judgment")}</span>
                  {classic(bian.judgment, LEGGE[bian.number]?.judgment)}
                </p>
              </div>
            )}

            {hu && (
              <details className="yj-adv">
                <summary>
                  <span>
                    {yjT("yijing.huFold", loc)} · {term("互卦", "yijing.huGua")} · {zT(hu.name)}
                  </span>
                </summary>
                <p>
                  <span className="yj-sym-sm" aria-hidden="true">
                    {hu.symbol}
                  </span>
                  <span className="yj-lab">{term("卦辭", "yijing.judgment")}</span>
                  {classic(hu.judgment, LEGGE[hu.number]?.judgment)}
                </p>
              </details>
            )}

            {loc === "en" ? <p className="note yj-src">{yjFmt(yjT("yijing.translation", loc), { src: LEGGE_SOURCE })}</p> : null}

            {/* 有問題先問要唔要送;擺喺 AI 解卦掣隔籬,唔再喺起卦前要人決定 */}
            {question.trim() ? (
              <div className="list yj-send">
                <ToggleRow
                  icon="send"
                  label={yjT("yijing.sendQuestion", loc)}
                  sub={yjT(sendQ ? "yijing.sendQuestion.on" : "yijing.sendQuestion.off", loc)}
                  checked={sendQ}
                  onChange={(v) => {
                    setSendQ(v);
                    try {
                      window.localStorage.setItem("numerology-yj-sendq", v ? "1" : "0");
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              </div>
            ) : null}

            <AiInterpret
              hexagram={cast.hexagram}
              lines={cast.lines}
              locale={loc}
              question={sendQ ? question.trim() || undefined : undefined}
            />
          </section>
        )}
      </div>

      <p className="disclaimer">{yjT("yijing.disclaimer", loc)}</p>
    </>
  );
}
