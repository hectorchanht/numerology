---
target: app/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/page.tsx"
target_fingerprint: "sha256:cf6fb5d008a4cdc749287c42ca02f01db99168558cde5e25731a46e3dfc37710"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/page.tsx
timestamp: 2026-11-03T05-30-56Z
slug: apps-web-app-page-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent); B's browser step failed (shared 3123 server went down), parent re-ran browser detector after A finished.

## Design Health Score — 27/40 (Acceptable; previous 23)
1 Visibility 3 — pending lens Seg shows 按八字 while content/tag still 合參 (StreamedReport.tsx:305-334)
2 Real world 3 — model pills / "neurons" jargon; hour still 0–23
3 Control 2 — 重新生成 is the solid amber primary on a finished report, no confirm; infer can't go back to edit date
4 Consistency 2 — TimeInferPanel gender defaults 男 (TimeInferPanel.tsx:29) vs BirthForm required; PDF twice
5 Error prevention 3 — regenerate/ask/PDF stay live in budget state
6 Recognition 3 — pending lens must be remembered
7 Flexibility 3
8 Minimalist 2 — report first viewport ~16 controls, content starts y≈820; 7 失敗 cards in budget state
9 Error recovery 3 — form error far from field and not cleared after fix
10 Help 3 — 合參/按八字/按紫微 unexplained at choice

## Specificity
Content specific (洛書 hero, 干支 glyphs, 窮通寶鑑 citation card, 子時 hint, 真太陽時 meta, 粵/普 TTS); chrome generic; amber diluted across nav icons, 7 section icons, 7 TL;DR washes.
Detector CLI: page.tsx + 14 components clean; YijingHistoryPanel.tsx 11× design-system-font-size advisory.
Browser: home 390/1280 0 findings. Chart view 13: 12× low-contrast 3.2:1 (#6b6b70 label-3 on #1c1c1e card), undersized 10px "日主", tab idle 4.0:1. Report view 16: 7× undersized 10.5px "重點", label-3 state text low-contrast, 1 text-occlusion = detector overlay false positive.

## Priority Issues
[P1] Form error far from field (BirthForm.tsx:201) + not cleared after correction (edit() clears errField only) + grey invalid ring indistinct + TimeInferPanel gender default 男. Fix: inline .sub error under offending row, clear error on valid edit, infer gender required. → harden
[P1] 重新生成 solid amber primary on finished report, live during budget, two amber primaries in budget state. Fix: post-run "換視角重睇: [按八字][按紫微]" secondary that generates on tap; disable regen/ask/PDF when budget. → distill
[P1] --label-3 low contrast systemic on card (13 detector hits), chart micro-labels, tab idle 4.0:1, 重點 10.5px, 日主 10px. Fix: functional text on cards → label-2, label-3 decorative/disabled only (or raise token ~0.5); 11px floor; tab-idle ~55%. → audit + polish
[P2] Budget state 7 失敗 cards duplicate budget card. Fix: collapse/hide section list, state 未生成, hide PDF. → distill
[P2] Amber repetition (nav icons, section icons, progress when done) + zht register (infer copy, form.hintSolar 書面普通話) + mixed punctuation. → quieter + clarify

## Persona Red Flags
Jordan: CTA ~2 screens down; model id unexplained; lenses unexplained; 時(0-23); thinking above conclusion (owner's order).
Casey: Segs + chips top-reach; adjacent 44px TTS buttons; five number fields.
Sam: view switcher group+aria-pressed not tabs; 7 role=status skeletons; chips no aria-current; ThinkingFold no aria-controls; infer chat no live region; label-3 contrast.
Learner: evidence depends on model markers (SectionBody.tsx:57-61); no global show-evidence; report never matches the 窮通寶鑑 summary card.

## Minor
View Seg triplicated + overlaps 解讀 tab; eyebrow truncates; idle 60% empty, CTA "生成" vague; chartDesc + idleHint overlap; inline styles StreamedReport.tsx:396-413; end disclaimer under tab bar; no per-section reassurance on 感情 / 未來.

## Questions
- Why is AI regenerate the loudest element rather than the chart fact each section rests on?
- One cross-section 一句總結 at top instead of 7 equal gold TL;DR cards?
- Evidence as a persistent reading mode instead of per-block folds?
