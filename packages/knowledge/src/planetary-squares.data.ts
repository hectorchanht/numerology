// AUTO-GENERATED from data/planetary-squares.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/planetary-squares.json 後重新生成本文件。
import type { KnowledgeMeta } from "./types.js";

const PLANETARY_SQUARES_DATA = {
  "meta": {
    "name": "Planetary magic squares (kameas)",
    "schema": "planet -> order n, rows (n×n, numbers 1..n²), lineSum = n(n²+1)/2, total = n²(n²+1)/2",
    "source": "Traditional layouts as published in Agrippa, De occulta philosophia II.22 (1533), public domain. Planet order and symbolism as summarised in Fideler, Jesus Christ, Sun of God (1993), PDF pp. 258-263. Verified by test/planetary-squares.test.mjs.",
    "version": "0.1.0",
    "reviewed": false
  },
  "squares": [
    {
      "planet": "Saturn",
      "greek": "ΚΡΟΝΟΣ",
      "order": 3,
      "rows": [
        [
          4,
          9,
          2
        ],
        [
          3,
          5,
          7
        ],
        [
          8,
          1,
          6
        ]
      ],
      "note": "Lo Shu; total 45"
    },
    {
      "planet": "Jupiter",
      "greek": "ΖΕΥΣ",
      "order": 4,
      "rows": [
        [
          4,
          14,
          15,
          1
        ],
        [
          9,
          7,
          6,
          12
        ],
        [
          5,
          11,
          10,
          8
        ],
        [
          16,
          2,
          3,
          13
        ]
      ],
      "note": "total 136 = 4 × 34"
    },
    {
      "planet": "Mars",
      "greek": "ΑΡΗΣ",
      "order": 5,
      "rows": [
        [
          11,
          24,
          7,
          20,
          3
        ],
        [
          4,
          12,
          25,
          8,
          16
        ],
        [
          17,
          5,
          13,
          21,
          9
        ],
        [
          10,
          18,
          1,
          14,
          22
        ],
        [
          23,
          6,
          19,
          2,
          15
        ]
      ]
    },
    {
      "planet": "Sun",
      "greek": "ΗΛΙΟΣ",
      "order": 6,
      "rows": [
        [
          6,
          32,
          3,
          34,
          35,
          1
        ],
        [
          7,
          11,
          27,
          28,
          8,
          30
        ],
        [
          19,
          14,
          16,
          15,
          23,
          24
        ],
        [
          18,
          20,
          22,
          21,
          17,
          13
        ],
        [
          25,
          29,
          10,
          9,
          26,
          12
        ],
        [
          36,
          5,
          33,
          4,
          2,
          31
        ]
      ],
      "intelligence": {
        "name": "Nakhiel",
        "hebrew": "נכיאל",
        "value": 111
      },
      "spirit": {
        "name": "Sorath",
        "hebrew": "סורת",
        "value": 666
      },
      "note": "line 111, total 666 = 9 × 74; 74 = any symmetric group of four cells"
    },
    {
      "planet": "Venus",
      "greek": "ΑΦΡΟΔΙΤΗ",
      "order": 7,
      "rows": [
        [
          22,
          47,
          16,
          41,
          10,
          35,
          4
        ],
        [
          5,
          23,
          48,
          17,
          42,
          11,
          29
        ],
        [
          30,
          6,
          24,
          49,
          18,
          36,
          12
        ],
        [
          13,
          31,
          7,
          25,
          43,
          19,
          37
        ],
        [
          38,
          14,
          32,
          1,
          26,
          44,
          20
        ],
        [
          21,
          39,
          8,
          33,
          2,
          27,
          45
        ],
        [
          46,
          15,
          40,
          9,
          34,
          3,
          28
        ]
      ]
    },
    {
      "planet": "Mercury",
      "greek": "ΕΡΜΗΣ",
      "order": 8,
      "rows": [
        [
          8,
          58,
          59,
          5,
          4,
          62,
          63,
          1
        ],
        [
          49,
          15,
          14,
          52,
          53,
          11,
          10,
          56
        ],
        [
          41,
          23,
          22,
          44,
          45,
          19,
          18,
          48
        ],
        [
          32,
          34,
          35,
          29,
          28,
          38,
          39,
          25
        ],
        [
          40,
          26,
          27,
          37,
          36,
          30,
          31,
          33
        ],
        [
          17,
          47,
          46,
          20,
          21,
          43,
          42,
          24
        ],
        [
          9,
          55,
          54,
          12,
          13,
          51,
          50,
          16
        ],
        [
          64,
          2,
          3,
          61,
          60,
          6,
          7,
          57
        ]
      ],
      "note": "total 2080 = 16 × 130"
    },
    {
      "planet": "Moon",
      "greek": "ΣΕΛΗΝΗ",
      "order": 9,
      "rows": [
        [
          37,
          78,
          29,
          70,
          21,
          62,
          13,
          54,
          5
        ],
        [
          6,
          38,
          79,
          30,
          71,
          22,
          63,
          14,
          46
        ],
        [
          47,
          7,
          39,
          80,
          31,
          72,
          23,
          55,
          15
        ],
        [
          16,
          48,
          8,
          40,
          81,
          32,
          64,
          24,
          56
        ],
        [
          57,
          17,
          49,
          9,
          41,
          73,
          33,
          65,
          25
        ],
        [
          26,
          58,
          18,
          50,
          1,
          42,
          74,
          34,
          66
        ],
        [
          67,
          27,
          59,
          10,
          51,
          2,
          43,
          75,
          35
        ],
        [
          36,
          68,
          19,
          60,
          11,
          52,
          3,
          44,
          76
        ],
        [
          77,
          28,
          69,
          20,
          61,
          12,
          53,
          4,
          45
        ]
      ]
    }
  ],
  "square729": {
    "order": 27,
    "note": "27×27 square of 1..729 (book p. 299, after ΚΗΦΑΣ = 729). Any odd-order Siamese (de la Loubère) construction puts (n²+1)/2 = 365 in the centre cell; line sum 9855 = 27 × 365. Generate on demand rather than storing 729 cells."
  }
} as unknown as { meta: KnowledgeMeta; squares: unknown[] };

export default PLANETARY_SQUARES_DATA;
