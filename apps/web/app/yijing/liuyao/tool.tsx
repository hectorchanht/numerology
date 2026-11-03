"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GroupTabs } from "@/components/GroupTabs";
import { CASTING_TABS } from "@/lib/navGroups";
import {
  paigua,
  ganzhiForDate,
  castYijing,
  type YaoValue,
  type LiuyaoResult,
} from "@numerology/engine";
import { getHexagram } from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, yjFmt, type YijingLocale } from "@/lib/yijingStrings";
import { Seg } from "@/components/ui";
import { Term } from "@/lib/highlightTerms";
import { saveYijingCast, getYijingCast } from "@/lib/yijingHistory";
import { AiLiuyao } from "./AiLiuyao";

const LINE_OPTS: { v: YaoValue; id: string }[] = [
  { v: 6, id: "yijing.line.oldYin" },
  { v: 7, id: "yijing.line.youngYang" },
  { v: 8, id: "yijing.line.youngYin" },
  { v: 9, id: "yijing.line.oldYang" },
];

const QIN_EN: Record<string, string> = {
  兄弟: "Siblings",
  父母: "Parents",
  子孫: "Children",
  妻財: "Wealth",
  官鬼: "Authority",
};
const BEAST_EN: Record<string, string> = {
  青龍: "Azure Dragon",
  朱雀: "Vermilion Bird",
  勾陳: "Curved Array",
  螣蛇: "Soaring Serpent",
  白虎: "White Tiger",
  玄武: "Black Tortoise",
};

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function rollLine(): YaoValue {
  const sum = [0, 1, 2].reduce((a) => a + (Math.random() < 0.5 ? 2 : 3), 0);
  return sum as YaoValue;
}

/** 爻形:陽一橫 / 陰兩截 */
function YaoGlyph({ yang, moving }: { yang: boolean; moving: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        gap: "5px",
        width: "52px",
        outline: moving ? "2px solid var(--cinnabar)" : "none",
        outlineOffset: "2px",
        borderRadius: "2px",
      }}
    >
      {yang ? (
        <span style={{ flex: 1, height: "8px", background: "var(--ink)", borderRadius: "2px" }} />
      ) : (
        <>
          <span style={{ flex: 1, height: "8px", background: "var(--ink)", borderRadius: "2px" }} />
          <span style={{ flex: 1, height: "8px", background: "var(--ink)", borderRadius: "2px" }} />
        </>
      )}
    </span>
  );
}

export default function LiuyaoTool({ historyId }: { historyId?: string }) {
  const { locale } = useLocale();
  // 六爻引擎 / 卦名係繁體正本 → zT(只喺 zhs 轉)
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [date, setDate] = useState(todayStr());
  const [mode, setMode] = useState<"coin" | "manual">("coin");
  const [lines, setLines] = useState<YaoValue[]>([]);
  const [manual, setManual] = useState<(YaoValue | 0)[]>([0, 0, 0, 0, 0, 0]);
  const [rolling, setRolling] = useState(false);
  /** 歷史回顧模式:由 ?h=<id> 入嚟,唔再存檔 */
  const reviewMode = useRef(false);
  const [reviewAt, setReviewAt] = useState<number | null>(null);

  const done = lines.length === 6;

  // 歷史回顧:還原日期 + 六爻
  useEffect(() => {
    if (!historyId) return;
    let alive = true;
    getYijingCast(historyId)
      .then((rec) => {
        if (!alive || !rec || rec.kind !== "liuyao" || !rec.lines) return;
        reviewMode.current = true;
        setReviewAt(rec.at);
        if (rec.date) setDate(rec.date);
        setLines(rec.lines as YaoValue[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [historyId]);

  const result: { r: LiuyaoResult; hexName: string; err: string } = useMemo(() => {
    if (!done) return { r: null as unknown as LiuyaoResult, hexName: "", err: "" };
    try {
      const [y, m, d] = date.split("-").map(Number);
      const gz = ganzhiForDate(y, m, d);
      const tup = lines as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];
      const r = paigua(tup, gz.dayStem, gz.dayBranch, gz.monthBranch);
      const hex = getHexagram(castYijing(tup).hexagram);
      return { r, hexName: hex ? `${hex.symbol} ${hex.name}` : "", err: "" };
    } catch (e) {
      return {
        r: null as unknown as LiuyaoResult,
        hexName: "",
        err: e instanceof Error ? e.message : String(e),
      };
    }
  }, [done, lines, date]);
  const showResult = done && !result.err && result.r;

  // 起卦完成自動存檔(每組爻值+日期只存一次;回顧模式唔存)
  const savedSig = useRef<string | null>(null);
  useEffect(() => {
    if (!showResult || reviewMode.current) return;
    const sig = `${date}:${lines.join(",")}`;
    if (savedSig.current === sig) return;
    savedSig.current = sig;
    saveYijingCast({ kind: "liuyao", at: Date.now(), date, lines: [...lines] }).catch(() => {});
  }, [showResult, date, lines]);

  const tossOne = () => {
    if (rolling || done) return;
    setRolling(true);
    setTimeout(() => {
      setLines((p) => [...p, rollLine()]);
      setRolling(false);
    }, 450);
  };
  const tossAll = () => {
    if (rolling || done) return;
    setRolling(true);
    const rest: YaoValue[] = [];
    for (let i = lines.length; i < 6; i++) rest.push(rollLine());
    let k = 0;
    const step = () => {
      const v = rest[k];
      if (v === undefined) {
        setRolling(false);
        return;
      }
      setLines((p) => [...p, v]);
      k += 1;
      setTimeout(step, 260);
    };
    step();
  };
  const reset = () => {
    setLines([]);
    setManual([0, 0, 0, 0, 0, 0]);
    setRolling(false);
    savedSig.current = null;
  };
  const resultRef = useRef<HTMLDivElement | null>(null);
  const resultHeadRef = useRef<HTMLHeadingElement | null>(null);
  const [announce, setAnnounce] = useState("");
  // 六爻已成:讀屏報本卦、焦點交俾結果標題(擲爻掣會 disabled)、結果喺下面就捲落去(回顧模式唔捲)
  useEffect(() => {
    if (!showResult) return;
    const hex = getHexagram(castYijing(lines as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue]).hexagram);
    if (hex) setAnnounce(yjFmt(yjT("yijing.announce.done", loc), { name: loc === "en" ? hex.nameEn : zT(hex.name) }));
    if (reviewMode.current) return;
    resultHeadRef.current?.focus({ preventScroll: true });
    const el = resultRef.current;
    if (!el) return;
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.55) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // 只隨起卦結果變;loc / zT 變唔重新捲
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, lines, date]);

  const manualReady = manual.every((v) => v !== 0);
  const castManual = () => {
    if (!manualReady) return;
    setLines(manual as YaoValue[]);
  };

  return (
    <>
      <GroupTabs links={CASTING_TABS} label={yjT("nav.group.divine", loc)} />

      <div className="masthead" style={{ paddingTop: "1.2rem" }}>
        <h1 style={{ letterSpacing: "0.28em" }}>{yjT("liuyao.title", loc)}</h1>
        <div className="sub">{yjT("liuyao.sub", loc)}</div>
      </div>

      {reviewAt !== null && (
        <div className="card" style={{ boxShadow: "inset 0 0 0 1px var(--accent-line)", marginBottom: "1rem" }}>
          <span className="badge">{yjT("yijing.hist.reviewing", loc)}</span>{" "}
          <span className="muted">{new Date(reviewAt).toLocaleString()}</span>{" "}
          <Link href="/yijing/history" style={{ marginLeft: "0.5rem" }}>
            {yjT("yijing.hist.backToHistory", loc)}
          </Link>
        </div>
      )}

      <div className="card">
        <div className="field">
          <label htmlFor="ly-date">{yjT("liuyao.dateLabel", loc)}</label>
          <input
            id="ly-date"
            type="date"
            value={date}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(e) => setDate(e.target.value)}
            style={{
              font: "inherit",
              padding: "0.55rem 0.65rem",
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--r)",
            }}
          />
        </div>
        <p className="muted" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
          {yjT("liuyao.dateHint", loc)}
        </p>
      </div>

      <div className="card">
        <div style={{ marginBottom: "1rem" }}>
          <Seg
            value={mode}
            onChange={setMode}
            label={yjT("liuyao.modeLabel", loc)}
            options={[
              { value: "coin", label: yjT("liuyao.modeCoin", loc) },
              { value: "manual", label: yjT("liuyao.modeManual", loc) },
            ]}
          />
        </div>

        {mode === "coin" ? (
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn" onClick={tossOne} disabled={rolling || done}>
              {yjT("liuyao.toss", loc)} ({Math.min(lines.length + 1, 6)}/6)
            </button>
            <button className="btn ghost" onClick={tossAll} disabled={rolling || done}>
              {yjT("yijing.auto", loc)}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {[5, 4, 3, 2, 1, 0].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <span className="muted" style={{ minWidth: "3em" }}>
                    {i === 5 ? yjT("liuyao.yaoTop", loc) : i === 0 ? yjT("liuyao.yaoBottom", loc) : `${i + 1}`}
                  </span>
                  <select
                    aria-label={
                      i === 5
                        ? yjT("liuyao.yaoTop", loc)
                        : i === 0
                          ? yjT("liuyao.yaoBottom", loc)
                          : yjFmt(yjT("liuyao.yaoN", loc), { n: i + 1 })
                    }
                    value={manual[i]}
                    onChange={(e) =>
                      setManual((p) =>
                        p.map((v, j) => (j === i ? (Number(e.target.value) as YaoValue | 0) : v)),
                      )
                    }
                    style={{
                      font: "inherit",
                      minHeight: "44px",
                      padding: "0.4rem 0.6rem",
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--line-strong)",
                      borderRadius: "var(--r)",
                    }}
                  >
                    <option value={0}>—</option>
                    {LINE_OPTS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.v} · {yjT(o.id, loc)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button className="btn" onClick={castManual} disabled={!manualReady || done} style={{ marginTop: "0.8rem" }}>
              {yjT("liuyao.cast", loc)}
            </button>
          </>
        )}

        {(done || lines.length > 0) && (
          <button className="btn ghost" onClick={reset} style={{ marginTop: "0.8rem", marginLeft: mode === "manual" ? "0.6rem" : 0 }}>
            {yjT("yijing.reset", loc)}
          </button>
        )}
        <p className="muted" role="status" style={rolling ? undefined : { margin: 0 }}>
          {rolling ? yjT("liuyao.rolling", loc) : ""}
        </p>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        {result.err && (
          <p className="notice" role="alert">
            {result.err}
          </p>
        )}
      </div>

      {showResult && (
        <div className="card" ref={resultRef}>
          <h2 className="section-title" tabIndex={-1} ref={resultHeadRef}>
            {yjT("liuyao.result", loc)}
          </h2>
          <div style={{ marginBottom: "0.8rem", lineHeight: 1.9 }}>
            <span style={{ fontSize: "1.6rem", marginRight: "0.5rem" }}>{zT(result.hexName)}</span>
            <span className="badge">{zT(result.r.shape)}</span>{" "}
            <span className="muted">
              <Term term="卦宮" />: {zT(result.r.palace)}({zT(result.r.palaceWuxing)})
            </span>
          </div>
          <p style={{ margin: "0 0 1rem" }}>
            <Term term="日辰" />: {result.r.dayGanzhi} ·{" "}
            <Term term="月建" />: {result.r.monthBranch} ·{" "}
            <Term term="旬空" />: {result.r.kong.join("")}
          </p>
          <div>
            {[...result.r.yaos].reverse().map((y) => (
              <div
                key={y.position}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  padding: "0.55rem 0",
                  borderBottom: "1px dashed var(--line)",
                  flexWrap: "wrap",
                }}
              >
                {y.shiYing ? (
                  <span className="badge" style={{ minWidth: "2.2em", textAlign: "center" }}>
                    {zT(y.shiYing)}
                  </span>
                ) : (
                  <span style={{ minWidth: "2.2em" }} />
                )}
                <span style={{ minWidth: "3em", color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                  {loc === "en" ? BEAST_EN[y.beast] : zT(y.beast)}
                </span>
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", minWidth: "3.4em" }}>
                  {y.ganzhi}
                </span>
                <span style={{ color: "var(--accent-text)", minWidth: "3em" }}>
                  {loc === "en" ? QIN_EN[y.qin] : zT(y.qin)}
                </span>
                <YaoGlyph yang={y.yinYang === "陽"} moving={y.moving} />
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {y.moving ? yjT("liuyao.moving", loc) : yjT("liuyao.static", loc)}
                </span>
                {y.xunKong && <span className="badge badge-warn">{yjT("liuyao.kong", loc)}</span>}
                {y.yuePo && <span className="badge badge-warn">{yjT("liuyao.yuePo", loc)}</span>}
                {y.riPo && <span className="badge badge-warn">{yjT("liuyao.riPo", loc)}</span>}
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
            {yjT("liuyao.note", loc)}
          </p>
          <AiLiuyao lines={lines} date={date} locale={loc} />
        </div>
      )}
    </>
  );
}
