---
name: book-to-knowledge
description: Use when the user hands over a book/PDF (書, 古籍, occult/numerology/mingli text) and wants it turned into domain knowledge for this platform — 將書轉化成結構化知識. Covers copyright gate, local MinerU parsing, fact extraction, verified JSON data in packages/knowledge, and a docs note.
---

# Book → structured knowledge (將書轉化成結構化知識)

Goal: the platform needs **verifiable domain facts** (values, tables, rules, correspondences), not a copy of the book. Read `docs/knowledge-base.md` first; it defines the two layers (`data/` = structured rules, primary; `corpus/` = optional public-domain original text) and the meta contract.

## 1. Copyright gate (always first)

Parse pages 1–6 and check the edition, publisher, year, and any rights notice.

| Edition | What is allowed |
|---|---|
| Public domain (pre-1930 US, or the scan says "no known copyright restrictions", e.g. archive.org/Cornell scans of old translations) | Structured facts **and** cleaned original text in `packages/knowledge/corpus/` if asked |
| In copyright (modern author, modern translation/annotation, 點校本/白話譯注本), or a pirate source (libgen etc.) | Facts only, in our own words, with page refs. Never transcribe, rewrite or paraphrase whole chapters, never commit the text. Tell the user once, then proceed with facts |

Facts (numbers, letter values, ratios, magic squares, correspondence tables) are not copyrightable. Prose, annotations and an author's original arrangement are.

## 2. Keep the source out of git

- PDFs go in `raw_pdf/` (git-ignored).
- MinerU writes `blobs/` and `.mineru-service.lock` into the cwd. Both are git-ignored. Never `git add -A`; stage files by name.

## 3. Parse locally with MinerU

Load the `mineru` skill. This machine (Apple Silicon, 64 GB) already runs a managed `standard` local parse server; never use `--remote` without asking.

```bash
mineru server status --json                      # check parse_server.local.healthy
mineru parse raw_pdf/<book>.pdf --pages 1-6 --json    # edition / rights check
mineru parse raw_pdf/<book>.pdf --pages all --wait 1800 --output $SCRATCH/<book>.md
```

For old scans, or when the user wants maximum OCR effort: `--tier advanced` is **not** offered by this machine's managed local server (MinerU 4.1.7 reports `tier_mismatch`, supported = flash/basic/standard), and remote also only offers standard. So `standard` is the local ceiling here. Re-check `mineru server status --json` → `supported_tiers` after a MinerU upgrade. For pages with unusual scripts (Hebrew, Greek) or tables, verify against the page image. A/B other OCR engines (e.g. PaddleOCR) only on the pages that fail, not the whole book. A 450-page book takes about 5–15 min. Run long parses in the background and wait for the notification. Write output to the scratchpad, never into the repo.

## 4. Locate the facts. Don't read the whole book into context

1. Tag each line with its PDF page: use `awk` on the `<!-- page N of M -->` markers to produce `page<TAB>line`.
2. Use `grep '^#'` to get the chapter map, then read only the relevant sections.
3. Run a Python sentence filter for numeric claims (`value of`, `number of`, `=`, `ratio`, `√`, `square`), plus the index pages at the back. The index is often the densest list of name→value pairs.
4. Tables (magic squares, correspondence grids) usually come out of MinerU as HTML or Markdown tables. Figures come out as `![Image block](doc:…/page:N/block:K)`. Inspect a figure with `mineru read <locator> --format image` when its numbers matter.

## 5. Write structured data in `packages/knowledge/data/<topic>.json`

```json
{ "meta": { "name": "...", "schema": "...", "source": "author, title (year); page = PDF page in parsed copy (MinerU doc:<id>)", "version": "0.1.0", "reviewed": false, "reviewNote": "..." }, ... }
```

- Each fact gets a `page` field, so the user can trace it.
- Keep scripts (Greek, Hebrew, 漢字) in clean UTF-8. Normalise Greek to uppercase without diacritics, so the test can sum the letters.
- Put formulas in a `latex` field. Also add a machine-checkable `expr` and `target` where possible.
- Prefer public-domain canonical forms over the book's own rendering (e.g. Agrippa 1533 kameas).
- Don't store huge derivable objects, such as a 27×27 square. Store the property and generate the object in the test.
- `reviewed: false` until a human checks it. Mark interpretive claims as the author's thesis.

## 6. Verify mechanically: `packages/knowledge/test/<topic>.test.mjs`

`node:test`, about one file per topic. Recompute everything that can be recomputed: letter sums, numeric relations within tolerance, magic-square permutation and line sums, table completeness. Fix the data when a check fails. Never loosen the check. Record source errata in `note`, e.g. Fideler prints 9/8 where the string ratio is 8/9.

```bash
cd packages/knowledge && npm test
```

## 7. Docs note: `docs/<topic>.md`

Write a short overview in our own words: how the system works, then the tables generated from the JSON (a Python one-off is fine). It must restate facts, not the book.

## 8. Finish

- Add a `*.data.ts` inline module and an `index.ts` export **only** when the engine or web app actually consumes the data (see `qiongtong.data.ts` for the pattern).
- Commit the named files only. This repo has no `dev`, so integrate on `main`. Don't push unless asked.
- Report to the user: what was extracted, errata found, what was skipped, and any MinerU artifacts left in the repo.

## Done so far

| Book | Status | Output |
|---|---|---|
| Fideler, *Jesus Christ, Sun of God* (1993, in copyright, libgen copy) | facts only | `greek-gematria.json`, `planetary-squares.json`, `docs/greek-gematria.md` |
| Agrippa, *Three Books of Occult Philosophy*, 1898 Cornell scan (public domain; **Book I only**) | facts | `agrippa-correspondences.json`, `docs/agrippa-correspondences.md`. Hebrew glyphs OCR'd as ✕; fixed by checking the page image (p. 258) |

## OCR lessons

- MinerU's VLM can invent filler on blank pages ("The image contains no text…"). Drop it, never treat it as source.
- Non-Latin glyphs inside tables (Hebrew) may come out as `✕`. Check the page image and supply the glyphs from the standard alphabet. A test then checks them against known values (e.g. נכיאל = 111, סורת = 666).
