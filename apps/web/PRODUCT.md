# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who reads Traditional Chinese, Simplified Chinese, or English — not only Hong Kong. Each locale is a first-class audience; no locale is a translation afterthought.

Two primary audiences, weighted equally:

- **Curious self-reflectors**: interested in Chinese metaphysics but not versed in it. They enter a birth time and want a readable, grounded interpretation of their chart to reflect on life direction — not a fatalistic prediction. Needs zero barrier to entry.
- **Learners of 命理**: know some 八字 / 紫微斗數 and want evidence — the rules applied, the classical sources cited — so they can go deeper over time (Academy lessons, case library, glossary).

The same surface serves both: the conclusion first for newcomers, the evidence one step away for learners ("零門檻 / 有證據 / 越學越深").

## Product Purpose

洛書命理 (八字紫微合參) is an AI-assisted Chinese metaphysics tool. From one birth moment it computes both a 八字四柱 chart and a 紫微斗數 chart, then streams an AI interpretation that reads them together, plus 大運流年 analysis (look back + look ahead) and follow-up chat about the chart. Positioned as a traditional-culture and self-reflection tool, not fatalistic fortune-telling. Success: a user leaves understanding their chart and trusting the reasoning behind it.

## Positioning

Three things together, equally weighted, that a neighbouring app cannot truthfully copy as a set:

1. **Calculate deterministically, interpret with AI.** "排盤要「算」，解讀才「用 AI」。" Charts come from a pure-TS engine (iztro + lunar-javascript, 真太陽時 by province/city); a structured knowledge base distilled from 窮通寶鑑, 滴天髓, 三命通會, 紫微斗數全書 grounds the AI, which only interprets. "No hallucination，no bullshit，直話直說。"
2. **八字 + 紫微 合參.** Both systems from the same birth moment, cross-read.
3. **Free and private.** No paywall; chart history lives only on the user's device.

## Operating Context

- Main flow (`/`): enter birth data (solar or lunar calendar, birthplace for true solar time; AI 時辰推斷 when the hour is unknown) → both charts → streamed report sections ending in 总体建议 · 开运参考 → fortune sections (overview / dayun / review / future / rhythm / action) → chat.
- Side tools: 今日運勢 (`/daily`), 紫微合盤 (`/hepan`), 姓名測分 by Kangxi strokes (`/name`), 奇門遁甲 (`/qimen`), 玄空飛星 風水 (`/fengshui`), 命盤海報 (`/poster`), 易經 hub (`/yijing`: 三錢起卦, 六爻納甲, 梅花易數, 六十四卦庫, history, cases, academy lessons).
- Users can bring their own AI provider key and edit the meta prompt; default online model is Workers AI.
- History in browser IndexedDB; PDF export; installable PWA.

## Capabilities and Constraints

- Next 14 on Cloudflare Pages (`@cloudflare/next-on-pages`, edge runtime); Workers AI binding + KV for AI cache (90-day) and budget.
- AI spend has a hard monthly cap ($2, KV-metered, returns 429 when exceeded) — interfaces must handle the over-budget state gracefully.
- AI output is streamed; long sectioned text is the core content shape.
- No auth, no accounts, no payments.
- Locales: zht (default; Hong Kong written Traditional, colloquial Cantonese voice, not machine-converted), zhs, en — all three are target audiences, so layouts must hold for CJK and Latin text lengths alike. AI output follows the locale.
- Free to use today; not recorded as a permanent commitment.

## Brand Commitments

- Name: 洛書命理 · 八字紫微合參; publisher Dawn Studio; live at https://numerology.dawnstudio.app. Existing logo, icons, og image in `public/`.
- **Anti-fatalist voice (binding).** All conclusions are tendencies for reference; the decision stays with the user. These disclaimers must remain present:
  - "本工具為傳統文化與自我反思用途,所有結論均為傾向性參考,非宿命預測,決策權始終在你自己手中。"
  - "涉及健康請以專業醫療意見為準;涉及財務請自行評估,不構成投資建議。"
  - Side tools: "傳統民俗趣味參考，結果僅供娛樂".
- **Privacy (binding).** Charts are computed on device / Cloudflare edge and discarded; records stay in the user's IndexedDB and are never uploaded. No future feature may silently change this.
- Voice: plain, direct and conversational in every locale (Cantonese-colloquial in zht); no mystical hype.

## Evidence on Hand

- Classical-text citations from the knowledge base (`packages/knowledge`) — the product's real proof.
- No testimonials, user counts, reviews, or press exist. Do not fabricate any.

## Product Principles

1. **Evidence before eloquence.** Every interpretation should trace to the chart and to a rule or source; show the basis, don't just assert.
2. **Conclusion first, depth on demand.** Newcomers get a readable takeaway; learners can open the reasoning without leaving.
3. **Reflection, not prophecy.** Phrase outcomes as tendencies and choices; never fear-driven or deterministic.
4. **The user's chart is theirs.** Privacy and on-device history are part of the product, not a setting.
5. **Calculation is exact; AI is the interpreter.** Never let AI output stand in for computed chart facts.
