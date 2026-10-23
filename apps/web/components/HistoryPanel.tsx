"use client";

import { useEffect, useState } from "react";
import {
  listReadings,
  deleteReading,
  clearReadings,
  onHistoryChanged,
  summarizeInput,
  type Reading,
} from "@/lib/history";
import { useLocale } from "@/lib/i18n";

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/**
 * 历史记录面板:列出本机保存的排盘,点击即恢复命盘 + 已生成的章节(零 API 调用)。
 * 记录只存在本机 IndexedDB,不上传。
 */
export function HistoryPanel({ onRestore }: { onRestore: (r: Reading) => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Reading[]>([]);

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

  const handleClear = async () => {
    if (!window.confirm(t("history.clearConfirm"))) return;
    await clearReadings().catch(() => {});
    refresh();
  };

  return (
    <div className="settings" style={{ marginTop: "0.6rem" }}>
      <button type="button" className="settings-toggle" onClick={() => setOpen((o) => !o)}>
        {t("history.title")}({items.length})
        <span className="caret">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="settings-body">
          {items.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t("history.empty")}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {items.map((r) => {
                const n = Object.keys(r.sections).length;
                return (
                  <li
                    key={r.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <button
                      type="button"
                      className="btn ghost"
                      style={{ flex: 1, textAlign: "left", justifyContent: "flex-start" }}
                      onClick={() => onRestore(r)}
                      title={fmtTime(r.updatedAt)}
                    >
                      {summarizeInput(r.input)}
                      {n > 0 ? <span className="muted">{t("history.sections", { n })}</span> : null}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => handleDelete(r.id)}
                      aria-label={t("history.delete")}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 0 ? (
            <button type="button" className="btn ghost" style={{ marginTop: "0.6rem" }} onClick={handleClear}>
              {t("history.clear")}
            </button>
          ) : null}

          <p className="settings-note" style={{ marginBottom: 0 }}>🔒 {t("history.privacy")}</p>
        </div>
      ) : null}
    </div>
  );
}
