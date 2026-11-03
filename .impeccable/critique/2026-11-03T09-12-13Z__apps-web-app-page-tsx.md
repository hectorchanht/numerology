---
target: app/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/page.tsx"
target_fingerprint: "sha256:21e24e967537dfa547e3da3c2da652483babfcd10be55460649e220d4f45fcd8"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/page.tsx
timestamp: 2026-11-03T09-12-13Z
slug: apps-web-app-page-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector + browser sub-agent, own :3000 server)

## Design Health Score — 27/40 (Acceptable)
1 Visibility 3 — progress hidden when done, completion never announced (StreamedReport.tsx:369); active chip scrolls off strip
2 Real world 3 — chart jargon tiles unexplained; 日主 "辛 · 金水" odd (Charts.tsx:78)
3 Control 3 — per-lens cache/retry good; lens Seg dead-but-live during streaming; no stop
4 Consistency 2 — two CTA labels (生成 AI 合參解讀 / 生成 7 節解讀); tablist no arrow keys/aria-controls; zht punctuation mixed
5 Error prevention 3 — TimeInferPanel weak validation
6 Recognition 3 — lens-idle Seg below CTA with "撳上面生成"
7 Flexibility 3 — en TTS only zh voices
8 Minimalist 2 — 14 TTS buttons; chart view ~13 tappables
9 Error recovery 3 — budget tech text duplicates body (accepted)
10 Help 2 — no inline term help; dotted terms no tap hint

## Specificity
Mostly specific (logo, 窮通寶鑑 tile, 真太陽時 meta, 粵/普, lenses); report drifts generic; evidence only when model emits markers (SectionBody.tsx:16-29).
CLI: page.tsx + 14 components 0; YijingHistoryPanel.tsx 11× design-system-font-size (real drift, off-flow).
Browser: home 390/1280 0, chart 0, budget 0, report-ok 7× nested-cards (TL;DR card, false positive). Functional: lens switch 0 fetch, back 7 secs, focus tab:命盤, budget 2 exits, errs [].

## Priority Issues
[P1] Evidence invisible in report. Fix: deterministic 依據 row per section from chart facts + KB source, collapsed under prose; AI evidence appends. → shape
[P1] Mobile home: form after intro + academy detour card (page.tsx:258-283). Fix: phone order h1 → lede → form → hero → 點用. → layout
[P2] Reading chrome heavy: 14 TTS buttons; chip strip doesn't follow. Fix: one 朗讀 per section (or report-level), hide in en; scrollIntoView active chip. → distill
[P2] Lens/CTA order & labels inconsistent; Seg dead during streaming. Fix: one label pattern; Seg above CTA on idle; disabled while running. → clarify
[P3] No forward path at report end; 大運 section duplicates tab; TimeInferPanel validation/live region. Fix: "睇大運流年 →"; reuse fail/errSub; aria-live chat log. → harden

## Persona Red Flags
Jordan: form below fold; jargon tiles; 辛·金水; 7-tool grid distraction.
Casey: top tabs/locale out of reach; fortune TTS next to collapsible headers.
Sam: completion unannounced; tablist no arrows; mode/sys Seg unlabelled (page.tsx:286,423); 14 TTS stops; folds ~30px; infer chat silent.
Learner: no visible chart-fact/rule basis per TL;DR.

## Minor
Eyebrow truncation; PDF twice; amber avatar text; idle notes below CTA; budget card could point to model line.

## Questions
- Would report have anything true without AI? Lead each section with its chart facts?
- Seven amber TL;DR = gold leaf or gold paint? Only 總體建議 amber?
- Chart view: destination or launchpad?
