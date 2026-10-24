"use client";

import { useRef, useState } from "react";
import { useLocale, useScript } from "@/lib/i18n";
import { BirthForm } from "@/components/BirthForm";
import type { BirthFormValue } from "@/lib/formTypes";
import type { ChartResult, ZiweiPalace } from "@numerology/engine";
import { renderShareCardPng, savePosterPng } from "@/lib/posterExport";
import { type ShareCardModel } from "@/lib/shareCard";
import { SITE_BASE } from "@/lib/yijingSite";

interface Side {
  name: string;
  input: BirthFormValue | null;
  chart: ChartResult | null;
}

function palaceOf(chart: ChartResult, pred: (p: ZiweiPalace) => boolean): ZiweiPalace | undefined {
  return chart.ziwei.palaces.find(pred);
}

function stars(p: ZiweiPalace | undefined, empty: string): string {
  const s = (p?.majorStars ?? []).map((x) => x.name).join(" ");
  return s || empty;
}

export default function HepanTool() {
  const { t } = useLocale();
  const { z } = useScript();
  const cardRef = useRef<HTMLDivElement>(null);
  const [a, setA] = useState<Side>({ name: "", input: null, chart: null });
  const [b, setB] = useState<Side>({ name: "", input: null, chart: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const pair = async () => {
    if (!a.input || !b.input) {
      setError(t("hepan.fillBoth"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fetchChart = async (input: BirthFormValue): Promise<ChartResult> => {
        const r = await fetch("/api/chart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!r.ok) throw new Error(`排盤失敗(${r.status})`);
        const j = await r.json();
        return j.chart as ChartResult;
      };
      const [ca, cb] = await Promise.all([fetchChart(a.input), fetchChart(b.input)]);
      setA((s) => ({ ...s, chart: ca }));
      setB((s) => ({ ...s, chart: cb }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const ready = a.chart && b.chart;
  const noStar = t("hepan.noStar");

  const cmp = ready
    ? (() => {
        const ca = a.chart!;
        const cb = b.chart!;
        const soulA = palaceOf(ca, (p) => p.isSoulPalace);
        const soulB = palaceOf(cb, (p) => p.isSoulPalace);
        const bodyA = palaceOf(ca, (p) => p.isBodyPalace);
        const bodyB = palaceOf(cb, (p) => p.isBodyPalace);
        const spouseA = palaceOf(ca, (p) => p.name === "夫妻");
        const spouseB = palaceOf(cb, (p) => p.name === "夫妻");
        return { ca, cb, soulA, soulB, bodyA, bodyB, spouseA, spouseB };
      })()
    : null;

  const sideBlock = (
    side: Side,
    setSide: (s: Side) => void,
    personKey: "hepan.personA" | "hepan.personB",
  ) => (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>{t(personKey)}</strong>
        {side.input && <span className="muted" style={{ fontSize: "0.8rem" }}>✓</span>}
      </div>
      <input
        className="input"
        value={side.name}
        onChange={(e) => setSide({ ...side, name: e.target.value })}
        placeholder={t("hepan.namePh")}
        maxLength={8}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <BirthForm
        loading={false}
        onSubmit={(input) => setSide({ ...side, input, chart: null })}
      />
    </div>
  );

  const buildCard = (): ShareCardModel | null => {
    if (!cmp) return null;
    const nameA = a.name.trim() || t("hepan.personA");
    const nameB = b.name.trim() || t("hepan.personB");
    const sA = stars(cmp.soulA, noStar);
    const sB = stars(cmp.soulB, noStar);
    return {
      title: t("hepan.title"),
      heroName: `${z(nameA)} × ${z(nameB)}`,
      heroValue: `${z(sA)} · ${z(sB)}`,
      heroUnit: t("hepan.soulMatch"),
      heroNote: `${t("hepan.wuxingju")}: ${z(cmp.ca.ziwei.fiveElementsClass)} · ${z(cmp.cb.ziwei.fiveElementsClass)}`,
      rows: [
        {
          label: t("hepan.spousePalace"),
          value: `${z(stars(cmp.spouseA, noStar))} · ${z(stars(cmp.spouseB, noStar))}`,
        },
        {
          label: t("hepan.bodyPalace"),
          value: `${z(cmp.bodyA?.name ?? "")} · ${z(cmp.bodyB?.name ?? "")}`,
        },
        {
          label: t("hepan.dayMaster"),
          value: `${z(cmp.ca.bazi.dayMaster)} · ${z(cmp.cb.bazi.dayMaster)}`,
        },
      ],
      disclaimer: t("hepan.disclaimer"),
      cta: t("hepan.cta"),
      url: `${SITE_BASE}/hepan`.replace("https://", ""),
      brand: t("app.title"),
    };
  };

  const onDownload = async () => {
    const m = buildCard();
    if (!m || !cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderShareCardPng(m, cardRef.current);
      await savePosterPng(blob, `hepan-${Date.now()}.png`);
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_BASE}/hepan`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪貼簿被拒,唔理 */
    }
  };

  const row = (label: string, va: string, vb: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--sep)" }}>
      <span className="muted">{label}</span>
      <span style={{ textAlign: "right" }}>
        {z(va)} <span className="muted">·</span> {z(vb)}
      </span>
    </div>
  );

  return (
    <div ref={cardRef}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("hepan.title")}</h1>
      <p className="muted" style={{ margin: "4px 0 16px", fontSize: "0.9rem" }}>{t("hepan.disclaimer")}</p>

      {sideBlock(a, setA, "hepan.personA")}
      {sideBlock(b, setB, "hepan.personB")}

      <button className="btn-primary" style={{ width: "100%", marginBottom: 16 }} disabled={loading} onClick={pair}>
        {loading ? t("form.submitting") : t("hepan.start")}
      </button>
      {error && <p style={{ color: "#ff453a", marginBottom: 12 }}>{error}</p>}

      {cmp && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
              {z(a.name.trim() || t("hepan.personA"))} × {z(b.name.trim() || t("hepan.personB"))}
            </div>
            {row(t("hepan.wuxingju"), cmp.ca.ziwei.fiveElementsClass, cmp.cb.ziwei.fiveElementsClass)}
            {row(t("hepan.soulPalace"), stars(cmp.soulA, noStar), stars(cmp.soulB, noStar))}
            {row(t("hepan.bodyPalace"), cmp.bodyA?.name ?? "", cmp.bodyB?.name ?? "")}
            {row(t("hepan.spousePalace"), stars(cmp.spouseA, noStar), stars(cmp.spouseB, noStar))}
            {row(t("hepan.dayMaster"), cmp.ca.bazi.dayMaster, cmp.cb.bazi.dayMaster)}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={onDownload}>
              {busy ? t("name.downloading") : t("name.download")}
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={onCopyLink}>
              {copied ? t("name.copied") : t("name.copyLink")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
