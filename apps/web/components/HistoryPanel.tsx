"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThinkingFold from "./ThinkingFold";
import {
  listReadings,
  deleteReading,
  deleteSectionVersion,
  clearReadings,
  renameReading,
  onHistoryChanged,
  summarizeInput,
  displayName,
  versionsOf,
  type HistorySection,
  type Reading,
} from "@/lib/history";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { PROVIDER_META } from "@/lib/providerMeta";
import { markdownTermComponents } from "@/lib/highlightTerms";
import { Icon } from "@/components/Icon";

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

function countSections(r: Reading, prefix: "report:" | "fortune:"): number {
  return Object.keys(r.sections).filter((k) => k.startsWith(prefix)).length;
}

/** 章節顯示順序:報告 7 節行先,大運 6 節跟尾(同生成嗰陣嘅次序一致)。 */
const SECTION_ORDER: string[] = [
  "report:personality", "report:career", "report:wealth", "report:relationship",
  "report:health", "report:luck", "report:advice",
  "fortune:overview", "fortune:dayun", "fortune:review", "fortune:future",
  "fortune:rhythm", "fortune:action",
];

/** 有 AI 版本嘅章節(按固定順序;report 行先、fortune 跟尾,未知 key 排最後)。 */
function versionGroups(r: Reading): { key: string; versions: HistorySection[] }[] {
  const keys = new Set<string>([
    ...Object.keys(r.sections ?? {}),
    ...Object.keys(r.sectionHistory ?? {}),
  ]);
  const groups = [...keys]
    .map((key) => ({ key, versions: versionsOf(r, key) }))
    .filter((g) => g.versions.length > 0);
  const rank = (k: string) => {
    const i = SECTION_ORDER.indexOf(k);
    return i >= 0 ? i : SECTION_ORDER.length;
  };
  return groups.sort((a, b) => rank(a.key) - rank(b.key));
}

const LENS_KEYS: Record<string, TKey> = {
  bazi: "report.lensBazi",
  ziwei: "report.lensZiwei",
  both: "report.lensBoth",
};

/**
 * 历史记录:搜尋 + 列表,点击即恢复命盘 + 已生成的章节(零 API 调用)。
 * 记录只存在本机 IndexedDB,不上传。
 */
export function HistoryPanel({ onRestore }: { onRestore: (r: Reading) => void }) {
  const { t } = useLocale();
  const { z } = useScript();
  const [items, setItems] = useState<Reading[]>([]);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  /** 邊份記錄展開咗 AI 解讀記錄(一次一份)。 */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 邊一版內文展開緊:`${readingId}|${sectionKey}|${at}`,一次一版。 */
  const [viewId, setViewId] = useState<string | null>(null);

  const refresh = () => {
    listReadings()
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    refresh();
    return onHistoryChanged(refresh);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteReading(id).catch(() => {});
    refresh();
  };

  const startRename = (r: Reading) => {
    setEditingId(r.id);
    setEditValue(r.name ?? "");
  };

  const saveRename = async (id: string) => {
    await renameReading(id, editValue).catch(() => {});
    setEditingId(null);
    refresh();
  };

  const handleClear = async () => {
    if (!window.confirm(t("history.clearConfirm"))) return;
    await clearReadings().catch(() => {});
    refresh();
  };

  const handleDeleteVersion = async (r: Reading, key: string, at: number) => {
    if (!window.confirm(t("history.deleteVersionConfirm"))) return;
    await deleteSectionVersion(r.id, key, at).catch(() => {});
    refresh();
  };

  /** 版本來源一行:provider(短名或原 id) · model(空白就唔顯示) · 視角。 */
  const versionSource = (v: HistorySection): string => {
    const meta = PROVIDER_META.find((p) => p.name === v.provider);
    const prov = meta ? t(meta.shortKey) : v.provider;
    const parts = [prov];
    if (v.model?.trim()) parts.push(v.model.trim());
    const lensKey = LENS_KEYS[v.lens];
    if (lensKey) parts.push(t(lensKey));
    return parts.join(" · ");
  };

  /** 章節標題:`報告 · 性格特質`(key 前綴揀返 tab 名,後半揀 seg.* label)。 */
  const sectionTitle = (key: string): string => {
    const [prefix, seg] = key.split(":", 2);
    const group = prefix === "fortune" ? t("tab.fortune") : t("tab.report");
    const segKey = `seg.${seg}` as TKey;
    const segLabel = t(segKey);
    return `${group} · ${segLabel === segKey ? (seg ?? key) : segLabel}`;
  };

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? items.filter((r) => `${r.name ?? ""} ${summarizeInput(r.input)} ${r.chart?.bazi?.lunarDate ?? ""}`.toLowerCase().includes(needle))
    : items;

  // .split:手機 display:contents(版面不變);桌面左欄搜尋/說明、右欄列表。
  return (
    <div className="split split-hist">
      <div className="split-a">
        <label className="search">
          <Icon name="search" small />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("history.search")} aria-label={t("history.search")} />
        </label>
      </div>

      <div className="split-main">
        {items.length === 0 ? (
          <div className="card empty">
            <Icon name="history" />
            <div className="empty-t">{t("history.empty")}</div>
          </div>
        ) : shown.length === 0 ? (
          <p className="note">{t("history.noMatch")}</p>
        ) : (
          <div className="list hist">
            {shown.map((r) => {
              const rep = countSections(r, "report:");
              const fot = countSections(r, "fortune:");
              const named = Boolean(r.name?.trim());
              const editing = editingId === r.id;
              const groups = versionGroups(r);
              const totalVersions = groups.reduce((n, g) => n + g.versions.length, 0);
              const expanded = expandedId === r.id;
              return (
                <div className={`row hist-row${expanded ? " open" : ""}`} key={r.id}>
                  {editing ? (
                    <>
                      <input
                        className="input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveRename(r.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        placeholder={t("history.namePh")}
                        maxLength={20}
                        autoFocus
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <button type="button" className="btn-primary" onClick={() => void saveRename(r.id)}>
                        {t("history.save")}
                      </button>
                      <button type="button" className="btn" onClick={() => setEditingId(null)}>
                        {t("history.cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="hist-main" onClick={() => onRestore(r)}>
                        <span className="avatar" aria-hidden="true">{r.input.gender}</span>
                        <span className="lbl hist-text">
                          <span className="hist-name">{displayName(r)}</span>
                          <span className="sub">
                            {named ? `${summarizeInput(r.input)} · ` : ""}{z(r.chart?.bazi?.lunarDate)}
                          </span>
                          <span className="hist-meta">
                            <span className="when">{fmtTime(r.updatedAt)}</span>
                            {rep || fot ? (
                              <span className="badges">
                                {rep ? <span className="tag">{t("history.reportBadge", { n: rep })}</span> : null}
                                {fot ? <span className="tag">{t("history.fortuneBadge", { n: fot })}</span> : null}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                      {groups.length > 0 ? (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setExpandedId(expanded ? null : r.id);
                            setViewId(null);
                          }}
                          aria-label={`${t("history.versions")} (${totalVersions})`}
                          aria-expanded={expanded}
                          title={t("history.versions")}
                        >
                          <Icon name="file" small />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => startRename(r)}
                        aria-label={t("history.rename")}
                      >
                        <Icon name="edit" small />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleDelete(r.id)}
                        aria-label={t("history.delete")}
                      >
                        <Icon name="trash" small />
                      </button>
                      {expanded && groups.length > 0 ? (
                        <div className="hist-vers">
                          <div className="hist-vers-title">{t("history.versions")}</div>
                          {groups.map((g) => (
                            <div className="hist-ver-group" key={g.key}>
                              <div className="hist-ver-seg">{sectionTitle(g.key)}</div>
                              {g.versions.map((v, i) => {
                                const vid = `${r.id}|${g.key}|${v.at}`;
                                const viewing = viewId === vid;
                                return (
                                  <div className="hist-ver" key={`${v.at}-${i}`}>
                                    <div className="hist-ver-line">
                                      <span className="hist-ver-meta">
                                        <span>{versionSource(v)}</span>
                                        {i === 0 ? <span className="tag">{t("history.versionCurrent")}</span> : null}
                                        <span className="when">{fmtTime(v.at)}</span>
                                      </span>
                                      <span className="hist-ver-actions">
                                        <button
                                          type="button"
                                          className="hist-ver-btn"
                                          aria-expanded={viewing}
                                          onClick={() => setViewId(viewing ? null : vid)}
                                        >
                                          {viewing ? t("history.hideVersion") : t("history.viewVersion")}
                                        </button>
                                        <button
                                          type="button"
                                          className="hist-ver-btn danger"
                                          onClick={() => void handleDeleteVersion(r, g.key, v.at)}
                                        >
                                          {t("history.deleteVersion")}
                                        </button>
                                      </span>
                                    </div>
                                    {viewing ? (
                                      <div className="hist-ver-body">
                                        {/* 同正文版面:思考折疊置頂(舊版本冇 thinking 就唔顯示)。 */}
                                        <ThinkingFold thinking={v.thinking ?? ""} />
                                        <div className="prose">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
                                            {v.markdown}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="split-b">
        <p className="note">{t("history.restoreNote")}</p>

        {items.length > 0 ? (
          <button type="button" className="btn secondary block danger-text" onClick={handleClear}>
            <Icon name="trash" />
            {t("history.clear")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
