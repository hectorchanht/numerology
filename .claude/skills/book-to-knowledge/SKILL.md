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

| Agrippa, *Three Books*, 1651 tr. via Wikisource (public domain; all 3 books) | facts + cross-check | Book I re-checked against 1651 text (herbs, fumes, stars match). Book II kameas match `planetary-squares.json` cell-for-cell (Moon table missing on Wikisource). New `agrippa-cabala.json` (planetary names, 28 mansions, Sephiroth), `docs/agrippa-cabala.md`. Later: `agrippa-scales.json`, `docs/agrippa-scales.md` (scales of numbers 1–12 from Book II ch. 4–14, 72 Shem ha-Mephorash angels from Book III ch. 25) |

| Agrippa *De occulta philosophia*, Cologne 1533 (LOC scan, archive.org DeOccultaPhilosophiaLoc1533; public domain, Latin) | verification only | Kameas checked against the first edition (Book II ch. 22, PDF pp. 165-169). The Moon table prints 45 for 54 (row 1, col 8) in both its Arabic and Hebrew forms; recorded as `erratum` |
| *Fourth Book* compilation, tr. Turner 1655 (Cornell scan of 1978 Askin facsimile; 1655 text public domain, **1978 intro skipped**) | facts | `fourth-book.json`, `docs/fourth-book.md`: 16 geomantic figures (rows read from the p. 41 table image), Heptameron days/planetary hours, Arbatel Olympic spirits |
| 《管子·地員》《呂氏春秋·音律》《淮南子·天文訓》(zh.wikisource, public domain) | facts | `lulu.json`, `docs/lulu.md`: 五音、十二律、律數、月令 |
| 邵雍《皇極經世書》(zh.wikisource 四庫本, public domain) | facts | `huangji-jingshi.json`, `docs/huangji-jingshi.md`: 元會運世、紀年錨點、外篇數 |
| *Sepher Yetzirah*, tr. Westcott 1893 (Wikisource, public domain) | facts | `sefer-yetzirah.json`, `docs/sefer-yetzirah.md`: 3/7/12 letters, 231 gates, six seals; Westcott's ch. IV–V supplements kept as tier modern |
| Ptolemy, *Tetrabiblos* Book I, tr. Ashmand 1822 (archive.org ptolemystetrabi00procgoog, public domain) | facts | `tetrabiblos.json`, `docs/tetrabiblos.md`: houses, triplicities, exaltations, Egyptian/Ptolemaic/Chaldean terms, aspects. Term tables read from page images; Robbins' 1940 Loeb translation avoided |

## Chinese classics lessons

- zh.wikisource titles are often not the obvious ones (e.g. `管子/第58篇地員`, `呂氏春秋/卷六`). Find them with `list=search` first, then fetch with `action=parse&prop=wikitext`.
- Number tables (e.g. 皇極經世 以會經運) give the structure in the headers. Store the rule plus a few anchor years, and let the test recompute their index, 干支 and year number from each other. Don't transcribe the whole table.

## Archive.org lessons

- `https://archive.org/metadata/<id>` gives title, date, publisher, rights and the file list. `<id>_djvu.txt` is archive.org's own OCR. It is a free **second, independent OCR** for cross-checking MinerU, but it has no page breaks.
- A facsimile reprint wraps a public-domain text in modern, possibly copyrighted front matter (introductions, notes). Use only the original text, and say so in `meta.source`.
- Old-print OCR misreads digits in tables (e.g. 24 → 14). For any number grid, view the page image. If there is a parallel Hebrew-numeral table, use it as a tie-breaker.

## Wikisource lessons

- A Wikisource epub export can be **truncated**: it only contains what is transcluded into mainspace subpages, e.g. Book II ch. 1–3 only. The full text lives in the `Page:` namespace of the scan's djvu index. Fetch it with the MediaWiki API: `list=allpages&apnamespace=104&apprefix=<djvu name>/`, then `prop=revisions&rvslots=main` in batches of 50 titles. Send a User-Agent and sleep 1 s between batches.
- Check `<pagequality level="N">` per page: 1 = raw OCR (not proofread), 3 = proofread, 4 = validated. Report the mix to the user, and treat level-1 pages like any OCR.
- Wiki tables (`{| … |}`) parse cleanly into number grids. `{{missing table}}` / `{{missing image}}` means no data, so say so instead of guessing.

## OCR lessons

- MinerU's VLM can invent filler on blank pages ("The image contains no text…"). Drop it, never treat it as source.
- PaddleOCR vs MinerU A/B test (2026-11-04) on the 1533 kamea pages, PP-OCRv5 server models via `uv run --no-project --python 3.12 --with paddleocr --with paddlepaddle`:
  - **Accuracy on tables both engines read:** MinerU got 152/155 cells right and PaddleOCR 131/155. PaddleOCR often confuses 3 and 5 in old type.
  - **Missed tables:** MinerU skipped the whole Sun square on p. 166, while PaddleOCR read 35/36 cells of it.
  - **Agreement:** every cell where the two engines agreed was correct, and the cells where they disagreed caught all of MinerU's errors.
  - **Hebrew:** PaddleOCR has no Hebrew model and turns the glyphs into CJK look-alikes.
  - **Use:** keep MinerU as the main engine. Run PaddleOCR only on number-grid pages, check every cell where they disagree against the page image, and use PaddleOCR to find tables MinerU dropped.
- When a table's glyphs are missing but the book gives the rule that generates them, derive them instead of guessing, and let the test re-derive them. Examples: the 72 Shem ha-Mephorash triplets come from Exodus 14:19–21 (72 letters per verse; Sefaria API `api/v3/texts/Exodus.14.19-21?version=hebrew`, strip vowels). The twelve banners are the 12 distinct permutations of יהוה. A divine name in the scale of n has n Hebrew letters.
- Non-Latin glyphs inside tables (Hebrew) may come out as `✕`. Check the page image and supply the glyphs from the standard alphabet. A test then checks them against known values (e.g. נכיאל = 111, סורת = 666).
