"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useScript } from "@/lib/i18n";
import { lockScript, warmScriptFor } from "@/lib/script";
import { analyzeName, type WugeResult, type WugeGe, type WugeLuck } from "@numerology/engine";
import { renderShareCardPng, savePosterPng } from "@/lib/posterExport";
import { type ShareCardModel } from "@/lib/shareCard";
import { SITE_BASE } from "@/lib/yijingSite";

const LUCK_COLOR: Record<WugeLuck, string> = {
  吉: "var(--ok-text)",
  半吉: "var(--accent-text)",
  半凶: "var(--label-2)",
  凶: "var(--warn-text)",
};

const GE_KEYS = ["tian", "ren", "di", "wai", "zong"] as const;
const GE_TKEY = {
  tian: "name.ge.tian",
  ren: "name.ge.ren",
  di: "name.ge.di",
  wai: "name.ge.wai",
  zong: "name.ge.zong",
} as const;

function GeRow({ ge, geName, strokesText, z }: {
  ge: WugeGe;
  geName: string;
  strokesText: (n: number) => string;
  z: (s: string) => string;
}) {
  return (
    <div className="card" style={{ padding: "12px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 700 }}>{geName}</span>
        <span style={{ color: LUCK_COLOR[ge.luck], fontWeight: 700 }}>{ge.luck}</span>
      </div>
      <div className="muted" style={{ marginTop: 4, fontSize: 15 }}>
        {strokesText(ge.strokes)} · {z(ge.wuxing)} · {z(ge.shuliName)}
      </div>
      <div className="muted" style={{ marginTop: 2 }}>{z(ge.text)}</div>
    </div>
  );
}

export default function NameTool() {
  const { t } = useLocale();
  const { z } = useScript();
  const params = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const [surname, setSurname] = useState("");
  const [given, setGiven] = useState("");
  const [result, setResult] = useState<WugeResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    void warmScriptFor("zh-Hant").then(() => setScriptReady(true));
  }, []);

  const doScore = (s: string, g: string) => {
    const ss = s.trim();
    const gg = g.trim();
    if ([...ss].length < 1 || [...ss].length > 2 || [...gg].length < 1 || [...gg].length > 2) {
      setError(t("name.invalid"));
      setResult(null);
      return;
    }
    try {
      // 引擎口徑:一律繁體(簡體輸入自動轉)
      const r = analyzeName(lockScript(ss, "zht"), lockScript(gg, "zht"));
      setResult(r);
      setError("");
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // 分享連結帶參數進入:自動填表並測分
  useEffect(() => {
    const s = params.get("s") ?? "";
    const n = params.get("n") ?? "";
    if (!s || !n || !scriptReady) return;
    setSurname(s);
    setGiven(n);
    doScore(s, n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  const shareUrl =
    result != null
      ? `${SITE_BASE}/name?s=${encodeURIComponent(surname.trim())}&n=${encodeURIComponent(given.trim())}`
      : "";

  const buildCard = (): ShareCardModel | null => {
    if (!result) return null;
    return {
      title: t("name.title"),
      heroName: z(result.surname + result.given),
      heroValue: String(result.score),
      heroUnit: t("name.scoreUnit"),
      heroNote: t("name.heroNote", { luck: result.zong.luck, name: z(result.zong.shuliName) }),
      rows: [
        ...GE_KEYS.map((k) => ({
          label: t(GE_TKEY[k]),
          value: t("name.strokes", { n: result[k].strokes }) + " · " + z(result[k].wuxing) + " · " + result[k].luck,
          accent: k === "ren" || k === "zong",
        })),
        {
          label: t("name.sancai"),
          value: z(result.sancai.combo) + " · " + result.sancai.luck,
          accent: true,
        },
      ],
      disclaimer: t("name.disclaimer"),
      cta: t("name.cta"),
      url: shareUrl.replace("https://", ""),
      brand: t("app.title"),
    };
  };

  const onDownload = async () => {
    const m = buildCard();
    if (!m || !cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderShareCardPng(m, cardRef.current);
      await savePosterPng(blob, `name-score-${Date.now()}.png`);
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪貼簿被拒,唔理 */
    }
  };

  const card = buildCard();
  const strokesText = (n: number) => t("name.strokes", { n });

  return (
    <div>
      <h1 className="large">{t("name.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 16px" }}>
        {t("name.subtitle")} · {t("name.kangxiNote")}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1, minWidth: 0 }}>
            <label htmlFor="name-surname">{t("name.surname")}</label>
            <input
              id="name-surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder={t("name.surnamePh")}
              maxLength={2}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 0 }}>
            <label htmlFor="name-given">{t("name.given")}</label>
            <input
              id="name-given"
              type="text"
              value={given}
              onChange={(e) => setGiven(e.target.value)}
              placeholder={t("name.givenPh")}
              maxLength={2}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn block"
          style={{ marginTop: 14 }}
          disabled={!scriptReady}
          onClick={() => doScore(surname, given)}
        >
          {t("name.submit")}
        </button>
        {error && <p className="notice" role="alert">{error}</p>}
      </div>

      {result && (
        <div ref={cardRef}>
          <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{z(result.surname + result.given)}</div>
            <div style={{ margin: "8px 0" }}>
              <span style={{ fontSize: "4rem", fontWeight: 800, color: "var(--accent-text)" }}>{result.score}</span>
              <span className="muted" style={{ marginLeft: 6 }}>{t("name.scoreUnit")}</span>
            </div>
            <div style={{ fontWeight: 700, color: LUCK_COLOR[result.zong.luck] }}>
              {t("name.heroNote", { luck: result.zong.luck, name: z(result.zong.shuliName) })}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>{z(result.zong.text)}</div>
            <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}>
              {t("name.sancai")} <span style={{ color: LUCK_COLOR[result.sancai.luck] }}>{z(result.sancai.combo)} · {result.sancai.luck}</span>
            </div>
          </div>

          {GE_KEYS.map((k) => (
            <GeRow
              key={k}
              ge={result[k]}
              geName={t(GE_TKEY[k])}
              strokesText={strokesText}
              z={z}
            />
          ))}

          <p className="muted" style={{ margin: "14px 2px" }}>{t("name.disclaimer")}</p>

          <div className="btn-row" style={{ marginBottom: 24 }}>
            <button type="button" className="btn" disabled={busy} onClick={onDownload}>
              {busy ? t("name.downloading") : t("name.download")}
            </button>
            <button type="button" className="btn secondary" onClick={onCopyLink}>
              {copied ? t("name.copied") : t("name.copyLink")}
            </button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">{copied ? t("name.copied") : ""}</span>
        </div>
      )}
      {card == null && <span style={{ display: "none" }} ref={cardRef} />}
    </div>
  );
}
