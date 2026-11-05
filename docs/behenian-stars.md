# Behenian 十五恆星

資料:`packages/knowledge/data/behenian-stars.json`;驗證:`packages/engine/test/lore.test.mjs`(2020 黃經回算)。

## 來源

- 名稱同次序:Agrippa, *Three Books of Occult Philosophy* I.32(J.F. 1651 英譯),見 `agrippa-correspondences.json` 的 `fixedStars`。
- 座標:英文維基百科各星條目資訊框(J2000,ICRS),來源為 van Leeuwen (2007), "Validation of the new Hipparcos reduction", *A&A* 474: 653–664;Sirius 資訊框引 Tycho-2。
- 容許度 6°:英文維基百科 "Behenian fixed star"("When a planet was within six degrees of an associated star…"),屬近代整理,tier modern。

## 計法

1. J2000 赤經赤緯 → 單位向量(astronomy-engine `VectorFromSphere`)。
2. `Ecliptic()` 轉到出生時刻的真黃道(含歲差、章動),得黃經。不計自行:兩百年內最大是 Arcturus,約 0.1°。
3. 與七曜、上升、天頂逐一比黃經差,≤ 6° 為合相。
4. 基率:十五顆星各 ±6° 弧的聯集佔黃道比例 p(約四成),n 個點期望命中 n × p 個。

只比黃經:Vega、Capella、Alkaid、Polaris 黃緯高,天球上實際距離遠大於黃經差。

## 校驗

以 2020-01-01 計算的黃經,對維基百科表列 2020 黃經(astro-seek 計算),十五顆星全部相差 < 5′。

## 已知分歧

第 8 顆:1651 英譯作 "Tail of the Lesser Bear"(即 Polaris);Hermes / Thebit 傳統與維基百科作 Alkaid(η UMa,大熊尾)。資料兩者並列(`alt`),引擎兩個都算,基率只用十五顆主讀。
