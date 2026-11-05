// AUTO-GENERATED from data/fourth-book.json(heptameron 段) — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/fourth-book.json(heptameron 段) 後重新生成本文件。
const HEPTAMERON_DATA = {
  "meta": {
    "name": "Heptameron 行星日與行星時(Fourth Book 1655 英譯)",
    "schema": "geomancy.figures: 16 x {name, rows (top→bottom, 1 = single point, 2 = double), planet, house sign, sign (zodiac distribution)}, triplicity schemes ; heptameron: days + Chaldean order + hour names ; arbatel: 7 Olympic spirits",
    "source": "Henry Cornelius Agrippa (pseudo), His Fourth Book of Occult Philosophy … Geomancy … Heptameron (Peter de Abano) … Arbatel, tr. Robert Turner, London 1655; public domain. Read from the Cornell scan of the 1978 Askin facsimile (archive.org cu31924006718757); the 1978 editorial introduction was NOT used. `page` = PDF page (MinerU doc:e501ca4).",
    "version": "0.1.0",
    "reviewed": false,
    "reviewNote": "Attributions are traditional, not historical: the Fourth Book and Heptameron are spurious ascriptions to Agrippa and Abano. Geomantic figure rows read from the printed table image (p. 41). Two OCR passes compared: local MinerU and archive.org's own OCR text.",
    "tier": "classical"
  },
  "heptameron": {
    "page": 128,
    "chaldeanOrder": [
      "Saturn",
      "Jupiter",
      "Mars",
      "Sun",
      "Venus",
      "Mercury",
      "Moon"
    ],
    "angelOfPlanet": {
      "Saturn": "Cassiel",
      "Jupiter": "Sachiel",
      "Mars": "Samael",
      "Sun": "Michael",
      "Venus": "Anael",
      "Mercury": "Raphael",
      "Moon": "Gabriel"
    },
    "days": [
      {
        "day": "Sunday",
        "planet": "Sun",
        "angels": [
          "Michael",
          "Dardiel",
          "Huratapal"
        ],
        "airKing": "Varcan",
        "heaven": 4
      },
      {
        "day": "Monday",
        "planet": "Moon",
        "angels": [
          "Gabriel",
          "Michael",
          "Samael"
        ],
        "airKing": "Arcan",
        "heaven": 1,
        "heavenName": "Shamain"
      },
      {
        "day": "Tuesday",
        "planet": "Mars",
        "angels": [
          "Samael",
          "Satael",
          "Amabiel"
        ],
        "heaven": 5
      },
      {
        "day": "Wednesday",
        "planet": "Mercury",
        "angels": [
          "Raphael",
          "Miel",
          "Seraphiel"
        ],
        "airKing": "Mediat (Modiat)",
        "heaven": 2,
        "heavenName": "Raquie"
      },
      {
        "day": "Thursday",
        "planet": "Jupiter",
        "angels": [
          "Sachiel",
          "Castiel",
          "Asasiel"
        ],
        "airKing": "Suth",
        "heaven": 6
      },
      {
        "day": "Friday",
        "planet": "Venus",
        "angels": [
          "Anael",
          "Rachiel",
          "Sachiel"
        ],
        "airKing": "Sarabotes",
        "heaven": 3
      },
      {
        "day": "Saturday",
        "planet": "Saturn",
        "angels": [
          "Cassiel",
          "Machatan",
          "Uriel"
        ],
        "airKing": "Maymon",
        "heaven": null
      }
    ],
    "hourNames": {
      "day": [
        "Yayn",
        "Janor",
        "Nasnia",
        "Salla",
        "Sadedali",
        "Thamur",
        "Ourer",
        "Tanic",
        "Neron",
        "Jayon",
        "Abay",
        "Natalon"
      ],
      "night": [
        "Beron",
        "Barol",
        "Thanu",
        "Athir",
        "Mathon",
        "Rana",
        "Netos",
        "Tafrac",
        "Sassur",
        "Aglo",
        "Calerna",
        "Salam"
      ]
    },
    "hourRule": "Day and night are each split into 12 unequal hours. The first day-hour belongs to the day's planet; each later hour (day then night, continuing) takes the next planet in Chaldean order.",
    "statedCells": [
      {
        "day": "Friday",
        "half": "day",
        "hour": 1,
        "angel": "Anael"
      },
      {
        "day": "Friday",
        "half": "day",
        "hour": 4,
        "angel": "Cassiel"
      },
      {
        "day": "Friday",
        "half": "night",
        "hour": 1,
        "angel": "Samael"
      },
      {
        "day": "Friday",
        "half": "night",
        "hour": 12,
        "angel": "Gabriel"
      },
      {
        "day": "Saturday",
        "half": "day",
        "hour": 1,
        "angel": "Cassiel"
      },
      {
        "day": "Saturday",
        "half": "day",
        "hour": 4,
        "angel": "Michael"
      },
      {
        "day": "Saturday",
        "half": "night",
        "hour": 1,
        "angel": "Raphael"
      },
      {
        "day": "Thursday",
        "half": "night",
        "hour": 1,
        "angel": "Gabriel"
      },
      {
        "day": "Thursday",
        "half": "night",
        "hour": 12,
        "angel": "Michael"
      }
    ]
  }
} as const;

export default HEPTAMERON_DATA;
