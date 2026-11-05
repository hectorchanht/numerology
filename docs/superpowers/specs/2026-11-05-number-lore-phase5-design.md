# 數之學 · 第五期設計(你的數、出生對應、恆星、學院「數與和諧」)

日期:2026-11-05 · 狀態:用戶授權直接開工(「GO, SEARCH AND ADD MORE KNOWLEDGE IF NEEDED」)

沿用第一至三期的 14 條原則、知識庫格式、文風與 repo 繁體規則。不碰另一 session 的第四期(`2026-11-05-mingli-deepening-design.md`,中國命理加深)。

## 為甚麼

`packages/knowledge` 已有七份資料入庫但未有任何地方使用:`agrippa-scales`、`nicomachus`、`greek-gematria`、
`sefer-yetzirah`、`agrippa-correspondences`、`lulu`、`timaeus`。本期將它們接入盤面、AI 與學院。

## 範圍

1. **「你的數」卡**(engine `castNumberLore`):收集盤中已算出的數——生命靈數、出生星期幻方的行和與總和、
   瑪雅 Kin(1–260)、河洛天數與地數——逐個列出:
   - Nicomachus 分類:奇偶三類(偶偶 / 偶奇 / 奇偶)、質數 / 合數、盈 / 虧 / 完全、所屬形數(三角至七角)、立方數。
   - Agrippa 數階(卷二第 4–14 章,1–10 與 12):各「世界」的對應,原文為 1651 英譯,不翻譯。
   - 希伯來字母數值(單一字母值等於此數者)及其 Sefer Yetzirah 分類(母 / 雙 / 單)。
   - Greek gematria:Fideler 所列詞語中數值相同者。
   - 基率(原則 9):詞表共有 D 個不同數值、最大值 M;隨機取 1–M 的整數撞中約 D/M;你的 k 個數期望撞中 k × D/M 個。
2. **出生對應**(engine `castBirthLore`):
   - 律呂:八字月支 → 夏曆月 → 《淮南子·天文訓》該月之律與律數;《呂氏春秋》上 / 下組與季節。
   - 太陽星座 → Agrippa 卷一黃道對應(守護星、草、薰香)與 Sefer Yetzirah 單字母(Westcott 補表,tier modern)。
   - 出生星期行星 → Sefer Yetzirah 雙字母(Westcott 補表,tier modern;註明其他傳統分配不同)。
   - **Behenian 十五恆星合相**(新增知識):J2000 赤經赤緯(Hipparcos,van Leeuwen 2007)經 astronomy-engine 歲差換算至出生時黃經,
     與七曜及上升 / 天頂比對,容許度 6°(Wikipedia「Behenian fixed star」所述傳統,tier modern)。
     基率:十五顆星 ±6° 弧聯集佔黃道比例 p;n 個點期望命中 n × p 個。只比黃經,黃緯高的星(如 Vega)須註明。
     第 8 顆:Agrippa 1651 英譯作 "Tail of the Lesser Bear",Hermes / 現代整理作 Alkaid(η UMa)——兩者並列計算,不合併(原則 8)。
3. **學院「數與和諧」**(`/harmony`):以圖為主——Timaeus λ 圖與世界靈魂七數、十二律三分損益圖(律數柱狀)、
   Nicomachus 形數點陣與完全數主張驗證、Timaeus 四正多面體對四元素並列五行(只並列,不配對)、Fideler 數值關係表(附容許度與選擇偏差說明)。
4. **AI**:crosssystem 一節的事實區塊加「數之學」段,只列引擎結果;指令寫明 gematria 與恆星合相須同時說基率,Agrippa 數階屬象徵對應。

## 非目標

- 名字 gematria(希臘 / 希伯來轉寫規則各家不同);地占工具;72 天使配黃道 5°(後世傳統)。
- 翻譯 Agrippa 英文條目。

## 驗證

- 恆星:計算 2020-01-01 黃經,與 Wikipedia 表所列 2020 黃經相差 < 5′。
- 分類函數:以 Nicomachus 資料內的數列與已知完全數交叉測試。
- 律呂:寅月 → 太蔟 72;子月 → 黃鐘 81。
