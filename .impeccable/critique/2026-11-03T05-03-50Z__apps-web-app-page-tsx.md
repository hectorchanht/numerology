---
target: app/page.tsx
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/page.tsx"
target_fingerprint: "sha256:abd30518873d4d53ecc8d58fd340f33518210213a2fed6543d5dd5043ba97628"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/page.tsx
timestamp: 2026-11-03T05-03-50Z
slug: apps-web-app-page-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector + headless Chrome CDP sub-agent)

## Design Health Score — 23/40 (Acceptable)
1 Visibility 3 — no aria-live; no duration hint (report.generating unused)
2 Real world 2 — jargon card.chartDesc on idle; hour 0–23 no 時辰 map; hard-coded "TL;DR" in zht
3 Control 2 — known/infer switch wipes form (page.tsx:266-270); no cancel during generation
4 Consistency 2 — view Seg and lens Seg stacked, same style, different meaning; .notice errors amber
5 Error prevention 2 — gender defaults 男 (BirthForm.tsx:33); no day-vs-month validation; true solar silent until city
6 Recognition 3 — 時辰→24h mental conversion
7 Flexibility 3 — strong
8 Minimalist 2 — home stack heavy; report header ~10 controls
9 Error recovery 1 — 429 over-budget; server errors hard-coded zhs
10 Help 3 — FAQ good

## Specificity
Partly specific: chart layer authored; shell category-generic; report never shows 合參 provenance (which conclusion from 八字 vs 紫微) or links to chart cells.
Detector: page.tsx + 15 imported components clean (exit 0). YijingHistoryPanel.tsx 11× design-system-font-size advisory (line 107 2rem glyph = false positive). Browser 390px: low-contrast placeholder input#chart-name 2.8:1; low-contrast p.disclaimer 3.0:1; undersized-ui-text 10px tab bar labels ×4. 1280px: the 2 contrast issues.

## Priority Issues
[P0] 429 over-budget: 7 parallel sections fail at once, each with retry, "neurons" text, dev providerHint (StreamedReport.tsx:408), zht-only message (budget.ts:39), no code (http.ts:66). Fix: code AI_BUDGET + one calm locale-aware card + 去設定; hide per-section retry; drop providerHint. → harden
[P1] Chart→reading handoff broken + forced lens choice: lands on chart view (page.tsx:137), readings list only links chat (page.tsx:402-409). Fix: primary "生成 AI 解讀" row auto-starting 合參; lens Seg becomes post-run "換視角重新生成". → distill
[P1] Birth input error prevention: gender unselected+required; preserve state across known/infer; day/month validation; aria-invalid/describedby + focus; show 時辰 next to hour. → harden
[P1] Binding disclaimers weak: disclaimer2 absent from report screen (health/wealth sections); home disclaimer 3.0:1 fails AA. Fix: add to health/wealth foot + report end; label-2 ≥13px. → clarify
[P2] Amber overuse breaks One Gold Rule inside report card (icon, TL;DR badge+edge, every verdict edge, prose h3, blockquote, caret, .notice, .sec.failed). Fix: amber only TL;DR; verdict edge --line-strong; h3 --label; errors coral/label+icon; use t("report.tldr"). → quieter

## Persona Red Flags
Jordan: hero exit before form; jargon lens choice; no cue that reading lives in 報告; 思考過程 above TL;DR.
Casey: top-of-screen Seg controls; mode Seg wipes dates; ~11-row form no next-field; 10px tab labels.
Sam: no live region; screen change only scrollTo (nav.ts:62); aria-pressed not tabs; aria-label on role-less skeleton div (StreamedReport.tsx:387); field errors unassociated.
命理 learner: 依據 fold weakest element (12.5px label-3 dashed); thinking above conclusion; no rule→chart-cell link; restored reading loses lens (StreamedReport.tsx:118).

## Minor
zht register mixing (信息/請填寫有效的/implementation-speak; half/full-width commas); creed "no bullshit"/"beginner to master" vs no-hype; en creed.evidence ungrammatical; Who card date not zero-padded; inconsistent fold styles; reduced-motion misses .stream-tail/caret; chart error far from CTA; placeholder contrast 2.8:1; YijingHistoryPanel inline font sizes.

## Questions
- Why must the user pick a lens and press generate at all — land on 合參 TL;DR after 排盤?
- Should model scratchpad sit above the conclusion while citations are faintest?
- When the $2 cap hits, is the chart alone a complete product, said with confidence?
