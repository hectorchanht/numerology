"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CoinLine } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { useLocale } from "@/lib/i18n";
import { AiModelNote } from "@/components/AiModelNote";
import { Icon } from "@/components/Icon";
import { aiRequestParts, loadAi, DEFAULT_AI } from "@/lib/aiSettings";
import { go } from "@/lib/nav";

/**
 * AI 解卦按鈕:走 /api/yijing/interpret。
 * 用戶 AI 設定(經 AI 設定頁揀嘅 provider/model/key/人設)由 aiRequestParts() 帶上;
 * 冇改過設定就默認 Workers AI(共用 $2/月預算守衛 + KV 緩存)。
 * 預算耗盡(code AI_BUDGET)→ 額度卡(同 StreamedReport 一致);其他錯誤 → 人話 + 重試,原文收入「技術細節」。
 */
export function AiInterpret({
  hexagram,
  lines,
  locale,
  question,
}: {
  hexagram: number;
  lines: CoinLine[];
  locale: YijingLocale;
  /** 用戶問題(選填):有傳先會送去 server,冇就唔送(privacy) */
  question?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");
  const [err, setErr] = useState<{ message: string; code?: string } | null>(null);

  const start = async () => {
    setState("loading");
    setText("");
    setErr(null);
    try {
      await streamPost(
        "/api/yijing/interpret",
        { hexagram, lines, locale, question, ...aiRequestParts() },
        (full) => setText(full),
      );
      setState("done");
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      setErr({ message: e instanceof Error ? e.message : String(e), code });
      setState("error");
    }
  };

  const custom = state === "error" && loadAi().provider !== DEFAULT_AI.provider;

  const openSettings = () => {
    go("settings");
    if (pathname !== "/") router.push("/");
  };

  return (
    <div className="yj-ai">
      {state === "idle" && (
        <button type="button" className="btn block" onClick={start}>
          <Icon name="spark" />
          {yjT("ai.interpret", locale)}
        </button>
      )}
      {state === "loading" && !text && (
        <p className="muted" role="status">
          {yjT("ai.loading", locale)}
        </p>
      )}
      {text && (
        <div className="yj-sub" aria-busy={state === "loading"}>
          <h3 className="yj-sub-h">{yjT("ai.interpretTitle", locale)}</h3>
          <p className="yj-ai-text">{text}</p>
          {state === "done" && (
            <button type="button" className="text-btn" onClick={start}>
              {yjT("ai.retry", locale)}
            </button>
          )}
        </div>
      )}
      {state === "error" && err && (
        <div className="yj-sub" role="alert">
          {err.code === "AI_BUDGET" ? (
            <>
              <h3 className="yj-sub-h">{t("report.budgetTitle")}</h3>
              <p className="note">{t("report.budgetBody")}</p>
              <button type="button" className="btn secondary block" onClick={openSettings}>
                <Icon name="gear" />
                {t("report.budgetSettings")}
              </button>
            </>
          ) : (
            <>
              <h3 className="yj-sub-h">{yjT("ai.failTitle", locale)}</h3>
              {/* 用緊預設免費 AI 就唔好叫人查 API key;自訂 provider 先提設定 */}
              <p className="note">{yjT(custom ? "ai.failCustom" : "ai.failBody", locale)}</p>
              <div className="btn-row">
                <button type="button" className="btn secondary" onClick={start}>
                  <Icon name="refresh" />
                  {yjT("ai.retry", locale)}
                </button>
                {custom ? (
                  <button type="button" className="btn secondary" onClick={openSettings}>
                    <Icon name="gear" />
                    {t("report.budgetSettings")}
                  </button>
                ) : null}
              </div>
            </>
          )}
          <details className="yj-detail">
            <summary>{yjT("ai.failDetail", locale)}</summary>
            <p>{err.message}</p>
          </details>
        </div>
      )}
      <AiModelNote />
    </div>
  );
}
