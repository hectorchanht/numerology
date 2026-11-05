# 曆法三系 · 第六期設計(Jyotish 宿與大運、埃及民用曆與旬星、Metonic 十九年)

日期:2026-11-05 · 狀態:用戶授權直接開工(「清走 worktree,然後按 domains.md 揀下一期開工」)

沿用第一至五期的 14 條原則、知識庫格式、文風與 repo 繁體規則。不碰另一 session 的第四期(中國命理加深)。

## 為甚麼揀這三項

`docs/domains.md` todo 中,這三項全部可由出生資料以固定規則重算,且可直接用現有星曆(`castEphemeris`)與 lunar-javascript:

- **Jyotish 27 宿**(todo:「27 宿與 27 = 729 的立方根」):月亮恆星黃道宿位 → Vimshottari 大運。印度體系有自己的「大運」,可與八字大運、紫微大限、河洛大運並列時間軸,是多體系交叉最直觀的一項。
- **埃及旬星 / 民用曆**(todo:「365 日 = 12 × 30 + 5」):出生日換算 Nabonassar 紀元民用曆(Ptolemy《天文學大成》用的紀年),太陽所在旬星(face)。
- **十九年七閏 / Metonic**(todo):金數、epact(基督教復活節計算法)與中國章法「十九年七閏」並列,閏月以 lunar-javascript 實數驗證。

## 範圍

1. **知識庫**:`jyotish.json`(27 宿、Vimshottari 宿主與年數、Lahiri ayanamsa)、`egyptian-calendar.json`(月名、Nabonassar 紀元、36 face 與行星主)、`metonic.json`(Meton 19 年 = 235 朔望月、金數規則、章蔀紀元)。每項附出處與 tier。
2. **引擎**:
   - `castJyotish(input, sky)`:恆星黃經 = 回歸黃經 − ayanamsa;月亮宿位與宿內進度;Vimshottari 九運起訖年齡(首運按月亮宿內未行部分比例);當前運。
   - `castEgyptian(input, sky)`:民用曆年、月、日(含五個閏餘日);太陽 face 與主星。
   - `castMetonic(year)`:金數、Gregorian epact;中國章內位置,並以 lunar-javascript 數出生年起 19 年內實際閏月數。
3. **網頁**:新卡「曆法」:
   - Vimshottari 時間條(圖),與八字大運並列兩條,標出當前年齡。
   - 民用曆日期與一年 12 × 30 + 5 日年格(圖,標出生日);face 以文字列出(實作時改,年格較能表達「固定 365 日」)。
   - 19 年格(圖),標金數位置與實際閏月年份。
4. **AI**:crosssystem 事實附「曆法」段,只列引擎結果;Vimshottari 只講運序與起訖,不推吉凶(原書斷語未入庫)。

## 非目標

- Jyotish 宮位、分盤(varga)、yoga 判定;Vimshottari 細分(antardasha)可列後續。
- 埃及旬星星名對應(學界未定),只講 face。
- 猶太曆。

## 已知分歧(須在 UI 與 AI 寫明)

- ayanamsa 有多家(Lahiri、Raman、Krishnamurti…),相差可達 1°以上;本站用 Lahiri,並註明宿位落在邊界附近時可能不同。
- Vimshottari 年長(365.25 日或 360 日)各家不同;本站採 365.25 並註明。
