"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/lib/i18n";
import { stripLeadingHeading } from "@/lib/sectionIcons";
import { markdownTermComponents, withTermHighlights } from "@/lib/highlightTerms";
import { splitTldr } from "@/lib/tldr";
import { splitThinking } from "@/lib/thinking";
import { parseSectionBlocks, type SectionNode } from "@/lib/fortuneBlocks";
import ThinkingFold from "@/components/ThinkingFold";
import { Icon } from "@/components/Icon";

/** 證據收納:dimmed + 預設折疊(同思考折疊同一個 pattern),永遠唔以正文亮度出現。 */
function EvidenceFold({ items }: { items: string[] }) {
  const { t } = useLocale();
  if (items.length === 0) return null;
  return (
    <details className="evid">
      <summary><Icon name="chevDown" small className="caret-ic" />{t("fortune.evidence")}</summary>
      <ul className="evid-list">
        {items.map((e, i) => (
          <li key={i}>{withTermHighlights(e)}</li>
        ))}
      </ul>
    </details>
  );
}

function Md({ text, className }: { text: string; className: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** 一嚿正文塊:va = 定性 headline + 分析 + 證據折疊;plain = 無標記文字 + 證據折疊。 */
function BlockNode({ node, tail }: { node: SectionNode; tail: boolean }) {
  const tailCls = tail ? " stream-tail" : "";
  if (node.kind === "va") {
    return (
      <div className="va-block">
        {node.verdict ? (
          <Md text={node.verdict} className={`verdict${node.analysis ? "" : tailCls}`} />
        ) : null}
        {node.analysis ? (
          <Md text={node.analysis} className={`prose sm va-analysis${tailCls}`} />
        ) : null}
        <EvidenceFold items={node.evidence} />
      </div>
    );
  }
  return (
    <div className="plain-block">
      {node.md ? <Md text={node.md} className={`prose${tailCls}`} /> : null}
      <EvidenceFold items={node.evidence} />
    </div>
  );
}

/**
 * 章節正文共用渲染(直播章節同歷史版本查看共用呢一套,唔好再分叉):
 * 版面次序(Hector 2026-11-02 定死) = 折疊思考 → TL;DR 卡 → 正文分塊。
 *
 * 處理次序有講究:先分思考——<think> 頂住首行嗰陣 stripLeadingHeading 會失效,
 * 令節標題殘留正文、連帶錨定開頭嘅 splitTldr 一齊 miss(2026-11-02 截圖
 * 文字牆的成因之一);再去標題、抽 TL;DR,最後先逐塊切正文。
 * 舊緩存/舊歷史無標記 → parseSectionBlocks 退化做一個 plain 塊原樣渲染,唔吞內容。
 */
export function SectionBodyView({
  md,
  streaming = false,
  renderCustom,
}: {
  md: string;
  streaming?: boolean;
  /** 自訂渲染(大運雙軌圖等結構化卡):回傳非 null 即接管正文部分;思考/TL;DR 照常置頂。 */
  renderCustom?: (body: string) => ReactNode | null;
}) {
  const { t } = useLocale();
  const { thinking, content, open } = splitThinking(md);
  const { tldr, body } = splitTldr(stripLeadingHeading(content));
  const custom = renderCustom?.(body);
  const nodes = custom === null || custom === undefined ? parseSectionBlocks(body) : null;
  return (
    <>
      <ThinkingFold thinking={thinking} active={streaming && open} />
      {tldr ? (
        <div className="tldr-card">
          <span className="tldr-tag">{t("report.tldr")}</span>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
            {tldr}
          </ReactMarkdown>
        </div>
      ) : null}
      {nodes === null ? (
        <>{custom}</>
      ) : (
        <div className="sec-blocks">
          {nodes.map((n, i) => (
            <BlockNode key={i} node={n} tail={streaming && i === nodes.length - 1} />
          ))}
        </div>
      )}
    </>
  );
}
