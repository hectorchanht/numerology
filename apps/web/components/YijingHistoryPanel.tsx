"use client";

/**
 * 占卦歷史列表(單一來源):首頁「歷史」版的占卦歷史 tab 與 /yijing/history route 共用。
 * 只含列表本體(載入/空狀態/記錄卡),頁面標題由各使用處自行渲染。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getHexagram } from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { Icon } from "@/components/Icon";
import {
  listYijingCasts,
  deleteYijingCast,
  summarizeYijingCast,
  summarizeQimenCast,
  onYijingHistoryChanged,
  type YijingCast,
  type YijingCastKind,
} from "@/lib/yijingHistory";

const KIND_HREF: Record<YijingCastKind, string> = {
  coin: "/yijing",
  meihua: "/yijing/meihua",
  liuyao: "/yijing/liuyao",
  qimen: "/qimen",
};
const KIND_LABEL: Record<YijingCastKind, string> = {
  coin: "yijing.hist.kind.coin",
  meihua: "yijing.hist.kind.meihua",
  liuyao: "yijing.hist.kind.liuyao",
  qimen: "yijing.hist.kind.qimen",
};

function fmtDate(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function CastRow({ rec, loc, zT }: { rec: YijingCast; loc: YijingLocale; zT: (s: string) => string }) {
  const sum = useMemo(() => summarizeYijingCast(rec), [rec]);
  const ben = sum ? getHexagram(sum.hexagram) : undefined;
  const bian = sum?.changed ? getHexagram(sum.changed) : undefined;
  /** 奇門冇卦象摘要,改用盤面摘要(遁局/節氣/元/干支) */
  const qm = useMemo(() => summarizeQimenCast(rec), [rec]);
  /** 兩段式刪除:第一撳變確認掣,第二撳先真刪(唔用 native confirm,手機體驗好啲) */
  const [confirming, setConfirming] = useState(false);

  const onDelete = useCallback(async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await deleteYijingCast(rec.id).catch(() => {});
  }, [rec.id, confirming]);

  return (
    <div className="card" style={{ marginBottom: "0.8rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <span className="badge">{yjT(KIND_LABEL[rec.kind], loc)}</span>
        <span className="muted" style={{ fontSize: "0.85rem" }}>{fmtDate(rec.at)}</span>
        <span style={{ flex: 1 }} />
        {confirming ? (
          <>
            <button
              type="button"
              className="btn"
              onClick={onDelete}
              style={{ color: "var(--cinnabar)", borderColor: "var(--cinnabar-soft)", padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}
            >
              {yjT("yijing.hist.confirmDelete", loc)}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setConfirming(false)}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            type="button"
            className="icon-btn"
            aria-label={yjT("yijing.hist.delete", loc)}
            onClick={onDelete}
            style={{ color: "var(--label-2)" }}
          >
            <Icon name="trash" small />
          </button>
        )}
      </div>

      {rec.question ? (
        <p style={{ margin: "0.6rem 0 0", fontSize: "0.95rem" }}>{rec.question}</p>
      ) : null}

      {ben ? (
        <Link
          href={`${KIND_HREF[rec.kind]}?h=${rec.id}`}
          style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginTop: "0.6rem", textDecoration: "none", color: "inherit" }}
        >
          <span style={{ fontSize: "2rem", lineHeight: 1 }}>{ben.symbol}</span>
          <span style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "1.1rem" }}>
              {zT(ben.name)}
            </span>
            {bian ? (
              <span className="muted"> → {zT(bian.name)}</span>
            ) : null}
            <span className="muted" style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}>
              {sum!.moving.length > 0
                ? `${sum!.moving.length} 動爻`
                : ""}
              {sum!.verdict ? ` · ${zT(sum!.verdict)}` : ""}
            </span>
          </span>
          <span className="muted" style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
            {yjT("yijing.hist.review", loc)} →
          </span>
        </Link>
      ) : qm ? (
        <Link
          href={`${KIND_HREF[rec.kind]}?h=${rec.id}`}
          style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginTop: "0.6rem", textDecoration: "none", color: "inherit" }}
        >
          <span style={{ display: "grid", placeItems: "center", width: "2.6rem", height: "2.6rem", color: "var(--accent)" }}>
            <Icon name="compass" />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "1.1rem" }}>
              {zT(qm.dun)}{qm.ju}局
            </span>
            <span className="muted" style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}>
              {zT(qm.jieqi)} · {zT(qm.yuan)} · {zT(qm.dayGanZhi)}日 {zT(qm.timeGanZhi)}時
            </span>
          </span>
          <span className="muted" style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
            {yjT("yijing.hist.review", loc)} →
          </span>
        </Link>
      ) : (
        <p className="muted" style={{ margin: "0.6rem 0 0" }}>
          {fmtDate(rec.at)}
        </p>
      )}
    </div>
  );
}

export function YijingHistoryPanel() {
  const { locale } = useLocale();
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [recs, setRecs] = useState<YijingCast[] | null>(null);

  const reload = useCallback(() => {
    listYijingCasts()
      .then(setRecs)
      .catch(() => setRecs([]));
  }, []);

  useEffect(() => {
    reload();
    return onYijingHistoryChanged(reload);
  }, [reload]);

  return (
    <>
      {recs === null ? (
        <p className="muted">{yjT("yijing.hist.loading", loc)}</p>
      ) : recs.length === 0 ? (
        <div className="card">
          <p style={{ margin: "0 0 0.4rem" }}>{yjT("yijing.hist.empty", loc)}</p>
          <p className="muted" style={{ margin: 0 }}>
            {yjT("yijing.hist.emptyHint", loc)}
          </p>
        </div>
      ) : (
        recs.map((r) => <CastRow key={r.id} rec={r} loc={loc} zT={zT} />)
      )}
    </>
  );
}
