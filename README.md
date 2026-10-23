# 命理 · Numerology

**[繁體中文](README.md) | [简体中文](README.zh-Hans.md) | [English](README.en.md)**

> 🔗 **線上體驗（免安裝，預設免費模型）：** https://numerology-7v4.pages.dev/
> 排盤即時出；AI 解讀預設走免費的 Cloudflare Workers AI（每月 $2 預算上限，用完即停），亦可喺「設定」入面揀其他 provider、填自己嘅 API key 換更強模型。

AI 輔助的中國命理工具：**八字四柱 + 紫微斗數**。幫助人們了解自己的性格傾向與人生格局，定位為**傳統文化 + 自我反思工具**，而非宿命論預測。

改寫自 [Crazycreate/Numerology](https://github.com/Crazycreate/Numerology)（MIT），在其基礎上修復多個服務層 bug、重構錯誤處理，並持續加入新功能。

## 核心設計原則

> **排盤要「算」，解讀才「用 AI」。**

- **排盤（起盤）是確定性計算**：公曆/農曆→干支、節氣定月、真太陽時校正、安星、四化、十神、大運起運。有唯一正確答案，絕不交給 LLM。
- **AI 只做解讀層**：把結構化命盤 + 命中的規則，合成個性化、可溯源的敘事與對話。

## 功能

- 🧮 **雙盤排盤**：八字四柱（十神/藏干/星運/自坐/空亡/神煞/納音）+ 紫微斗數（十二宮全要素、四化、四套十二神、大限小限、三方四正）
- 🌙 **曆法**：公曆 / 農曆（含閏月）輸入；出生地省→市二級聯動做**真太陽時校正**
- 🔮 **動靜結合解讀**：大運流年十神 + 引動喜用神、紫微大限/流年四化飛宮，運為主導
- 📜 **三份 AI 產出**：命盤格局解讀、大運流年深析（回看 + 前瞻）、就命盤對話追問；均流式輸出
- 🕰️ **時辰推斷**：不知出生時辰時，AI 據已知人生事實比對當日 12 時辰命盤反推
- 🪙 **易經占卦**：三枚銅錢起卦，自動排出本卦 / 變卦 / 互卦
- 🖼️ **命盤海報**：一鍵生成可分享的命盤圖
- 🗂️ **歷史記錄**：讀過的命盤存喺本機（IndexedDB），一點即還原，唔使重新跑 AI，記錄唔離開部機
- ⚡ **AI 快取**：相同命盤 + 相同章節直接命中伺服器快取（90 日），慳預算、秒出結果
- 📄 **導出 PDF**
- 🌐 **三語界面**：繁體中文（預設）/ 简体中文 / English，一鍵切換

## 線上版本

- **網址**：https://numerology-7v4.pages.dev/（Cloudflare Pages，GitHub 自動部署）
- **AI 預設**：Cloudflare Workers AI（`@cf/mistralai/mistral-small-3.1-24b-instruct`），免 key
- **預算上限**：每月 $2 硬上限（KV 計量，超額回 429），$0 成本營運
- **無付費牆**：全部功能免費

## 快速開始

### 前置要求

- Node.js **≥ 18.17**（Pages 上用 Node 20）

### 安裝與運行

```bash
# 1. 克隆
git clone https://github.com/hectorchanht/numerology.git
cd numerology

# 2. 安裝依賴（npm workspaces 單倉）
npm install

# 3. 構建核心包（排盤 + 知識庫 + AI 層）
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 4. 啟動 Web
npm run dev -w @numerology/web
# 打開 http://localhost:3000
```

本地開發預設 provider 為 Pollinations（免 key）；線上版本預設 Workers AI。

### 部署到 Cloudflare Pages

```bash
npm install && npm run cf:pages
```

API 路由已轉為 edge runtime；Workers AI 需要綁定 `AI` binding，預算計量需要 KV namespace（`numerology-ai-budget`）。

### 配置 AI provider

排盤唔花錢、唔需要 key；只有 **AI 解讀 / 對話**走 provider。喺 `.env` 用 `AI_PROVIDER` 揀一家，或喺網頁「設定」入面用分頁切換：

| provider | 費用 | 需要 key | 說明 |
|----------|------|---------|------|
| `workers-ai`（預設） | **免費** | **否** | Cloudflare Workers AI，每月 $2 預算上限；預設模型寫繁體最穩 |
| `pollinations` | **免費** | 否 | 免 key 開箱即用；匿名層會限速、輸出偏短 |
| `glm` | 免費額度 | 是 | 智譜 GLM，中文強：[open.bigmodel.cn](https://open.bigmodel.cn/) |
| `gemini` | 免費額度 | 是 | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `groq` | 免費 | 是 | 極快：[console.groq.com](https://console.groq.com/keys) |
| `openrouter` | 免費（`:free` 模型） | 是 | 模型多：[openrouter.ai](https://openrouter.ai/keys) |
| `anthropic` | 付費 | 是 | 中文質量最高：[console.anthropic.com](https://console.anthropic.com/) |
| `custom` | 睇端點 | 睇情況 | 任意 OpenAI 兼容服務：`AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL_REPORT`/`AI_MODEL_CHAT` |

- 每個 provider 嘅 key 獨立記住，唔會串；冇填就係空輸入。
- 模型列表動態拉取（`/api/models`，24 小時快取 + 靜態回落）。
- 「設定」入面可以自訂 meta prompt（系統提示詞），一鍵還原預設。

### 測試

```bash
npm test            # 全部 workspace 測試
```

## 項目結構

```
packages/
  knowledge/   @numerology/knowledge  結構化規則：調候用神 / 格局 / 十神 / 四化
  engine/      @numerology/engine     純 TS：出生信息 → 排雙盤 → 標準命盤 JSON（無 UI / 無網絡）
  ai/          @numerology/ai         命盤 JSON + 規則 → 上下文包 → AI provider（報告 / 對話 / 時辰推斷）
apps/
  web/         @numerology/web        Next.js 前端（Cloudflare Pages 部署）
```

`engine` 與 `knowledge` 與平台無關。

## 技術棧

- **語言/構建**：TypeScript（strict）、npm workspaces
- **排盤庫**（成熟開源，不自研）：[`iztro`](https://github.com/SylarLong/iztro)（紫微）、[`lunar-javascript`](https://github.com/6tail/lunar-javascript)（八字/曆法）
- **AI**：多 provider 可切換；除 Claude 外統一走 OpenAI 兼容協議
- **前端**：Next.js 14 + React 18，edge runtime
- **部署**：Cloudflare Pages + Workers AI + KV（預算計量與快取）

## 知識庫來源

古籍原文屬公有領域（窮通寶鑑 / 滴天髓 / 三命通會 / 紫微斗數全書）。
**蒸餾成結構化規則**，而非原文堆疊做 RAG。詳見 [`docs/knowledge-base.md`](docs/knowledge-base.md)。

## 免責聲明

本工具僅供**傳統文化學習與自我反思**之用。所有解讀均為基於命理的**傾向性參考，非宿命預測**，不構成醫療、法律、投資等任何專業建議，決策請以自身判斷為準。

## License

MIT
