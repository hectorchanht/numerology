"use client";

import { useEffect, useState } from "react";
import {
  listReadings,
  deleteReading,
  clearReadings,
  renameReading,
  onHistoryChanged,
  summarizeInput,
  displayName,
  type Reading,
} from "@/lib/history";
import { useLocale, useScript } from "@/lib/i18n";
import { Icon } from "@/components/Icon";

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

function countSections(r: Reading, prefix: "report:" | "fortune:"): number {
  return Object.keys(r.sections).filter((k) => k.startsWith(prefix)).length;
}

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
              return (
                <div className="row hist-row" key={r.id}>
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
