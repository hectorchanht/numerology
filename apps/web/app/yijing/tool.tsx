"use client";

import { useMemo, useRef, useState } from "react";
import {
  castYijing,
  type CastResult,
  type CoinLine,
} from "@numerology/engine";
import { getHexagram, yaoName } from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, yjFmt, type YijingLocale } from "@/lib/yijingStrings";
import { AiInterpret } from "./AiInterpret";
import { Term, withTermHighlights } from "@/lib/highlightTerms";

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
const LINE_GLYPH: Record<CoinLine, string> = {
  9: "⚊○",
  7: "⚊",
  8: "⚋",
  6: "⚋×",
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

/** 經典卦形:陽爻一橫,陰爻兩截(由下而上 render 時傳 reversed)。 */
function HexFigure({ bits, moving }: { bits: number[]; moving?: boolean[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "84px" }}>
      {[...bits].reverse().map((b, i) => (
        <div key={i} style={{ display: "flex", gap: "6px", height: "9px" }}>
          {b === 1 ? (
            <div
              style={{
                flex: 1,
                background: "var(--ink)",
                borderRadius: "2px",
                outline: moving?.[5 - i] ? "2px solid var(--cinnabar)" : "none",
                outlineOffset: "2px",
              }}
            />
          ) : (
            <>
              <div style={{ flex: 1, background: "var(--ink)", borderRadius: "2px" }} />
              <div style={{ flex: 1, background: "var(--ink)", borderRadius: "2px" }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function YijingTool() {
  const { locale } = useLocale();
  // 卦爻辭係繁體正本 → zT(只喺 zhs 轉)
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [question, setQuestion] = useState("");
  const [lines, setLines] = useState<TossedLine[]>([]);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = lines.length === 6;
  const cast: CastResult | null = useMemo(
    () => (done ? castYijing(lines.map((l) => l.value)) : null),
    [done, lines],
  );
  const ben = cast ? getHexagram(cast.hexagram) : undefined;
  const bian = cast?.changed ? getHexagram(cast.changed) : undefined;
  const hu = cast ? getHexagram(cast.hu) : undefined;
  const movingFlags = useMemo(
    () => (cast ? cast.lines.map((v) => v === 6 || v === 9) : []),
    [cast],
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
  };

  return (
    <>
      <style>{`
        .yj-coins { display: inline-flex; gap: 6px; }
        .yj-coin {
          width: 34px; height: 34px; border-radius: 50%;
          display: grid; place-items: center;
          font-size: 15px; font-weight: 600;
          background: var(--accent); color: var(--on-accent);
        }
        .yj-coin.flipping { animation: yj-flip 0.32s linear infinite; }
        .yj-coin.pop { animation: yj-pop 0.4s ease-out; }
        @keyframes yj-flip { from { transform: rotateY(0); } to { transform: rotateY(360deg); } }
        @keyframes yj-pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .yj-line-row { display: flex; align-items: center; gap: 0.9rem; padding: 0.5rem 0; border-bottom: 0.5px solid var(--line); overflow-x: auto; }
        .yj-line-row:last-child { border-bottom: none; }
        .yj-glyph { font-size: 1.5rem; min-width: 3.2em; text-align: center; letter-spacing: 0.1em; }
      `}</style>

      <div className="masthead">
        <h1>{yjT("yijing.title", loc)}</h1>
        <div className="sub">{yjT("yijing.sub", loc)}</div>
      </div>

      {/* .yj-layout:手機 display:contents;桌面左欄問卦/起卦、右欄卦象結果 */}
      <div className="yj-layout">
        <div className="yj-col">
          <div className="card">
            <div className="field">
              <label htmlFor="yj-q">{yjT("yijing.question.label", loc)}</label>
              <input
                id="yj-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={yjT("yijing.question.ph", loc)}
              />
            </div>
            <p className="muted" style={{ marginTop: "0.7rem", marginBottom: 0 }}>
              <Term term="問卦" /> · {yjT("yijing.askHonest", loc)}
            </p>
          </div>

          <div className="card">
            <h2 className="section-title">
              {yjFmt(yjT("yijing.toss", loc), { n: Math.min(lines.length + 1, 6) })}
            </h2>
            <div className="strip" style={{ marginBottom: "1rem" }}>
              <button className="btn" onClick={tossOne} disabled={rolling || done}>
                {yjFmt(yjT("yijing.toss", loc), { n: Math.min(lines.length + 1, 6) })}
              </button>
              <button className="btn ghost" onClick={tossAll} disabled={rolling || done}>
                {yjT("yijing.auto", loc)}
              </button>
              {(done || lines.length > 0) && (
                <button className="btn ghost" onClick={reset}>
                  {yjT("yijing.reset", loc)}
                </button>
              )}
            </div>

            {rolling && lines.length < 6 && (
              <div className="yj-coins" aria-hidden style={{ marginBottom: "0.8rem" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="yj-coin flipping" style={{ animationDelay: `${i * 0.08}s` }}>
                    {i % 2 ? yjT("yijing.coin.tails", loc) : yjT("yijing.coin.heads", loc)}
                  </span>
                ))}
              </div>
            )}

            <div>
              {[...lines].reverse().map((l, ri) => {
                const pos = lines.length - ri; // 1..6 由下而上
                return (
                  <div className="yj-line-row" key={pos}>
                    <span className="muted" style={{ minWidth: "2.6em" }}>
                      {pos === 1 || pos === 6
                        ? pos === 1
                          ? "初"
                          : "上"
                        : String(pos)}
                    </span>
                    <span className="yj-coins">
                      {l.coins.map((c, i) => (
                        <span key={i} className="yj-coin pop" style={{ width: "26px", height: "26px", fontSize: "0.8rem" }}>
                          {c ? yjT("yijing.coin.heads", loc) : yjT("yijing.coin.tails", loc)}
                        </span>
                      ))}
                    </span>
                    <span className="yj-glyph">{LINE_GLYPH[l.value]}</span>
                    <span style={{ color: "var(--ink-soft)" }}>{yjT(LINE_LABEL[l.value], loc)}</span>
                    {(l.value === 6 || l.value === 9) && (
                      <span className="badge badge-warn">
                        <Term term="動爻" />
                      </span>
                    )}
                  </div>
                );
              })}
              {lines.length === 0 && !rolling && (
                <p className="muted">{yjT("yijing.sub", loc)}</p>
              )}
            </div>
          </div>
        </div>

        {cast && ben && (
          <div className="card yj-result">
            <h2 className="section-title">{yjT("yijing.result", loc)}</h2>
            <div style={{ display: "flex", gap: "1.2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <HexFigure bits={ben.bits} moving={movingFlags} />
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{ben.symbol}</span>
                  <span style={{ fontFamily: "var(--serif)", fontSize: "1.5rem" }}>
                    <Term term="本卦" /> · {zT(ben.name)}
                  </span>
                  <span className="muted">
                    {ben.pinyin} · {ben.nameEn} · #{ben.number}
                  </span>
                </div>
                <p style={{ marginTop: "0.7rem" }}>
                  <Term term="卦辭" />:{` `}
                  <span style={{ fontFamily: "var(--serif)", fontSize: "1.05rem" }}>{withTermHighlights(ben.judgment, zT)}</span>
                </p>
              </div>
            </div>

            {cast.changing.length > 0 ? (
              <div style={{ marginTop: "1.2rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                  <Term term="動爻" />
                </h3>
                {cast.changing.map((p) => (
                  <div
                    key={p}
                    style={{
                      borderRadius: "12px",
                      padding: "0.6rem 0.8rem",
                      marginBottom: "0.5rem",
                      background: "var(--accent-soft)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--serif)", color: "var(--cinnabar)", marginBottom: "0.2rem" }}>
                      {zT(yaoName(ben, p))}
                    </div>
                    <div style={{ fontSize: "0.92rem" }}>{withTermHighlights(ben.lines[p - 1] ?? "", zT)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: "1rem" }}>
                {yjT("yijing.noChange", loc)}
              </p>
            )}

            {(bian || hu) && (
              <div className="grid-2" style={{ marginTop: "1.2rem" }}>
                {bian && (
                  <div className="card" style={{ marginTop: 0 }}>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
                      <span style={{ fontSize: "1.8rem", marginRight: "0.5rem" }}>{bian.symbol}</span>
                      <Term term="變卦" /> · {zT(bian.name)}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.92rem" }}>
                      <Term term="卦辭" />: {withTermHighlights(bian.judgment, zT)}
                    </p>
                  </div>
                )}
                {hu && (
                  <div className="card" style={{ marginTop: 0 }}>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
                      <span style={{ fontSize: "1.8rem", marginRight: "0.5rem" }}>{hu.symbol}</span>
                      <Term term="互卦" /> · {zT(hu.name)}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.92rem" }}>
                      <Term term="卦辭" />: {withTermHighlights(hu.judgment, zT)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <AiInterpret hexagram={cast.hexagram} lines={cast.lines} locale={loc} />
          </div>
        )}
      </div>
    </>
  );
}
