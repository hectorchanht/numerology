---
target: app/page.tsx
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/page.tsx"
target_fingerprint: "sha256:cf6fb5d008a4cdc749287c42ca02f01db99168558cde5e25731a46e3dfc37710"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/page.tsx
timestamp: 2026-11-03T06-11-38Z
slug: apps-web-app-page-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector + browser sub-agent; final browser numbers from B's own :3000 server)

## Design Health Score — 26/40 (Acceptable; previous 27, independent reviewer; new regression from round-2 lens-tap-generates)
1 Visibility 3 — chart CTA switches view with no announcement/focus target (page.tsx:387)
2 Real world 3 — model id pills; "neurons/provider/key" in budget card
3 Control 2 — lens tap immediately discards current reading, no confirm/undo (StreamedReport.tsx:319); refresh icon same
4 Consistency 3 — TimeInferPanel bottom notice vs BirthForm inline errors; zht punctuation mixed
5 Error prevention 2 — destructive lens tap; true-solar ON but silently inert without city; 23:00 子時 convention unflagged
6 Recognition 3 — lenses unexplained at choice
7 Flexibility 3
8 Minimalist 2 — ~6 control bands before first sentence (first card ~y700); 完成 + 2 TTS on every card
9 Error recovery 3 — bracketed raw per-section errors; budget card only action is own key
10 Help 2 — no help at report decision points

## Specificity
Chart view specific (日主, 窮通寶鑑 citation, 五行局, 大運, 河圖, 時辰 hint, 合參); report view interchangeable — no link from conclusions to pillar/palace.
CLI: page.tsx + 15 components 0 findings. Browser: home 390/1280 0, chart 0, budget 0, report-ok 7× nested-cards on div.tldr-card (SectionBody.tsx:93) = false positive (DESIGN signature).

## Priority Issues
[P1] Lens switch silently destroys current reading + overwrites history (StreamedReport.tsx:315-331). Fix: per-lens slot cache, "未生成 · 撳一下生成" for ungenerated lenses, labelled refresh. → harden
[P1] Reading below fold behind controls (~13 controls). Fix: model pills to one neutral line/settings; hide progress when all done; lens row to report end "換個角度再睇"; state word only when not done. → distill
[P1] Focus lost on view switch; aiSeg rendered per view (page.tsx:216-227,362,477,511); CTA inside hidden view; Seg aria-pressed not tabs; noisy <h3> with state + TTS. Fix: single tablist outside views, focus report heading, move state/TTS out of h3. → audit + harden
[P2] Budget dead end: add 返去睇命盤, state reset (UTC month start), label raw message 技術細節, replace gear glyph. → clarify
[P2] Amber on model pill, progress lens tag, refresh icon → neutral. → quieter

## Persona Red Flags
Jordan: ~10-row form; 真太陽時/lenses/model id unexplained; budget path needs key.
Casey: all view/lens/locale controls top third; stretch-tap wipes report.
Sam: focus loss; noisy h3; segFail no role=alert; infer chat no live region; Seg not tabs.
Learner: evidence fold model-dependent & collapsed; TL;DR not linked to chart; lenses overwrite not compare; 子時 convention unstated.

## Minor
Eyebrow truncation; 完成 repeated; 粵/普 TTS in en; idle 60% empty (preview 7 titles); segEmpty zht written-style; parenthesised error strings.

## Questions
- Side-by-side lens comparison instead of destructive toggle?
- Over-budget moment showcasing the deterministic half?
- Who is the model pill for?
