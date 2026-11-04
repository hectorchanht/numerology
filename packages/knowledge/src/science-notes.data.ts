// AUTO-GENERATED from data/science-notes.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/science-notes.json 後重新生成本文件。
import type { KnowledgeMeta } from "./types.js";

const SCIENCE_NOTES_DATA = {
  "meta": {
    "name": "Science notes",
    "schema": "id -> claim(zht/zhs/en), relatesTo, cite, reviewed",
    "source": "Peer-reviewed literature, cited per entry.",
    "version": "0.1.0",
    "reviewed": false
  },
  "notes": [
    {
      "id": "forer-1949",
      "claim": {
        "zht": "受試者常把籠統的描述當作專屬於自己;此即巴納姆效應。",
        "zhs": "受试者常把笼统的描述当作专属于自己;此即巴纳姆效应。",
        "en": "People readily accept vague, general descriptions as personally accurate (the Barnum or Forer effect)."
      },
      "relatesTo": [
        "personality"
      ],
      "cite": {
        "work": "The fallacy of personal validation",
        "author": "Forer, B. R.",
        "year": 1949,
        "locator": "J. Abnormal and Social Psychology 44(1):118–123"
      },
      "reviewed": false
    },
    {
      "id": "carlson-1985",
      "claim": {
        "zht": "雙盲測試中,占星師無法憑星盤配對出受測者的性格檔案,結果與隨機相若。",
        "zhs": "双盲测试中,占星师无法凭星盘配对出受测者的性格档案,结果与随机相若。",
        "en": "In a double-blind test, astrologers could not match natal charts to personality profiles beyond chance."
      },
      "relatesTo": [
        "personality",
        "birth-timing"
      ],
      "cite": {
        "work": "A double-blind test of astrology",
        "author": "Carlson, S.",
        "year": 1985,
        "locator": "Nature 318:419–425"
      },
      "reviewed": false
    },
    {
      "id": "dean-kelly-2003",
      "claim": {
        "zht": "出生時間與性格或能力的關聯,在大樣本研究中未見可靠證據。",
        "zhs": "出生时间与性格或能力的关联,在大样本研究中未见可靠证据。",
        "en": "Large-sample studies find no reliable link between birth time and personality or ability."
      },
      "relatesTo": [
        "birth-timing"
      ],
      "cite": {
        "work": "Is astrology relevant to consciousness and psi?",
        "author": "Dean, G. & Kelly, I. W.",
        "year": 2003,
        "locator": "J. Consciousness Studies 10(6–7):175–198"
      },
      "reviewed": false
    },
    {
      "id": "look-elsewhere",
      "claim": {
        "zht": "巧合在大量比對下必然出現;解讀巧合時須先估算基準率。",
        "zhs": "巧合在大量比对下必然出现;解读巧合时须先估算基准率。",
        "en": "With enough comparisons, coincidences are expected; estimate the base rate before reading meaning into one."
      },
      "relatesTo": [
        "coincidence"
      ],
      "cite": {
        "work": "Methods for studying coincidences",
        "author": "Diaconis, P. & Mosteller, F.",
        "year": 1989,
        "locator": "J. American Statistical Association 84(408):853–861"
      },
      "reviewed": false
    }
  ]
} as unknown as { meta: KnowledgeMeta; notes: unknown[] };

export default SCIENCE_NOTES_DATA;
