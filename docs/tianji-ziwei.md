# 倪海廈《天紀》紫微原話(知識條目)

資料:`packages/knowledge/data/tianji-ziwei.json`,測試 `packages/knowledge/test/tianji-ziwei.test.mjs`。

## 收咗乜
倪海廈 1994 年《天紀》紫微斗數講次(2上至15上,另 19上、24下兩段補充)嘅短引文,共 1848 條。每條帶 B 站分 P 同秒數,可以直接跳去原片嗰一秒核對:
`https://www.bilibili.com/video/BV1KJsLekEfA?p={p}&t={t}`。

來源係 [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) 嘅 `docs/tianji-ziwei/entries.jsonl`(該倉庫再取自 nihai-tianji-corpus)。文字保留上游簡體原樣;上游改過嘅錯字記喺 `note`。

| 主題冊 | 內容 | 條數 |
|---|---|---|
| `01-stars` | 主星 | 378 |
| `02-palaces` | 宮位 | 366 |
| `03-patterns` | 格局 | 127 |
| `04-sihua` | 四化 | 174 |
| `05-illness` | 疾病 | 80 |
| `07-methodology` | 方法論 | 673 |
| `08-yili` | 義理 | 7 |
| `10-divination` | 占卜 | 24 |
| `11-fengshui` | 風水 | 19 |

同一句可以同時歸入幾個主題,所以有重複句子,但主題唔同。

## 層級同授權
- `tier: modern`:倪師係近人,講法屬三合派一家之言,唔等同《紫微斗數全書》原典。判格邏輯仍然只跟 `ziwei-geju.json`(《全書》)。
- 授權 **CC BY-NC-SA 4.0**(非商業),唔適用本倉庫其他授權。原課程著作權屬倪師及其權利繼承人;權利方有異議即下架。
- `reviewed: false`:轉寫未經本站逐條對片。

## 冇從上游收嘅嘢
上游 `lib/classics/`(標稱《全書》《全集》《骨髓賦》原文)同 `lib/ziwei/heming-knowledge.ts` 嘅「倪海厦原话」都係現代白話改寫,唔係古籍原文,亦冇時間戳可查,一律唔收。名人命盤時辰屬估算,唔收。
