---
target: YIJING/QIPAN PAGE
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/yijing/page.tsx"
target_fingerprint: "sha256:dfe0711fe4462f975aa8a88ad7f8c15b7b33effb7a570b01dd8ee4ae22b0c548"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/yijing/page.tsx
timestamp: 2026-11-03T05-23-20Z
slug: app-yijing-page-tsx
---
# Critique: /yijing (三錢起卦) — app/yijing/page.tsx + tool.tsx
Method: dual-agent (A: design review · B: detector + CDP)

## Heuristics (22/40, Acceptable)
1 Status 2 — after 6 lines heading/disabled button still "擲第 6 爻"; result below fold on mobile, no scroll/announce
2 Real world 3 — 字/花 values unexplained
3 Control 2 — 再占一卦 mid-cast wipes without confirm
4 Consistency 2 — amber on coins/CTAs/moving/errors; native blue checkbox; same-colour nested card
5 Error prevention 2 — destructive reset next to primary
6 Recognition 3 — old=moving not inline
7 Flexibility 3
8 Minimal 2 — glyph column noise; 互卦 equal weight to 本卦
9 Error recovery 1 — raw backend error string in accent colour
10 Help 2 — no casting explainer, no academy link

## Specificity
Chrome on-system; HexFigure authored; rest generic (inline-styled result stack, Unicode ⚊/⚋ ~8px). Reads as form + log, not oracle.
Detector: 13 advisory (10 font-size, 3 radius) in tool.tsx = DESIGN.md scale gaps. In-page: #yj-q placeholder 3.0:1; tab bar idle 4.0:1 (global); 1 false positive (overlay label).

## Priority issues
- [P0] Privacy copy contradicts behaviour: label "不會上傳" (lib/yijingStrings.ts:35) but sendQ defaults on (tool.tsx:83-89, owner decision 2026-10-23). Fix copy in 3 locales. /impeccable clarify
- [P1] AI error raw string in --cinnabar (AiInterpret.tsx:73-79). Map 429/provider errors to friendly copy + action, coral, detail fold; drop no-op borderColor. /impeccable harden
- [P1] Completion state stale + reveal invisible on mobile (tool.tsx:262-278,326). Hide toss button, heading 六爻已成, scrollIntoView .yj-result (reduced-motion aware), aria-live summary. /impeccable layout
- [P2] ⚊/⚋ illegible; no reduced-motion on coin flip/pop (tool.tsx:31-36,189-204,309). Mini bars like HexFigure. /impeccable polish
- [P2] One Gold Rule dilution: 18 amber coins, amber 再占一卦; native checkbox (tool.tsx:191-196,241). /impeccable quieter

## Personas
Jordan: 字/花/老陽/互卦 unexplained; empty state repeats subtitle. Sam: no live region for tosses; rows lack accessible summary. Casey: result under fixed tab bar; 再占一卦 adjacent to primary.

## Minor
en: 初/上 hardcoded, 本卦/卦辭/互卦/問卦 untranslated, "Young Yin" wraps. Nested card same colour (use card-2). page.tsx:8 says AI 即將推出 (shipped). Side-tool disclaimer missing. Placeholder colour unstyled. AI checkbox hit ~20px; provider pills 28px.

## Questions
Coins as hero? 全部自動 equal weight to ritual toss? Result replaces log on mobile?

Unverified: moving-line/變卦 state (no moving line in 3 casts), light theme.
