// AUTO-GENERATED from data/tetrabiblos.json(卷一尊貴表:宮位、三方、廟旺、埃及界、相位) — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/tetrabiblos.json 後重新生成本文件。
const TETRABIBLOS_DATA = {
  "meta": {
    "name": "Ptolemy, Tetrabiblos Book I — planet natures, houses, triplicities, exaltations, terms, aspects",
    "tier": "classical",
    "schema": "natures ; houses:{planet:{day,night}} ; triplicities:[{signs,element?,day,night,participating}] ; exaltations:{planet:{sign,fall}} ; terms:{egyptian,ptolemaic:{sign:[{planet,deg}]},chaldean:{rule,stated}} ; aspects",
    "source": "Ptolemy's Tetrabiblos, tr. J. M. Ashmand (London: Davis and Dickson, 1822), public domain; archive.org ptolemystetrabi00procgoog. `page` = printed page; PDF pp. 86, 90 for the term tables (read from page images).",
    "version": "0.1.0",
    "reviewed": false,
    "reviewNote": "Term tables read from page images, not OCR (MinerU garbled the variant cells). Ashmand prints alternative readings in several Ptolemaic-term cells; `ptolemaic` keeps the reading that matches Ptolemy's own rules in ch. XXIV (e.g. Saturn first in Leo), others in `variants`. Exaltation degrees are not in Ptolemy and are not included."
  },
  "natures": {
    "page": 21,
    "benefic": [
      "Jupiter",
      "Venus",
      "Moon"
    ],
    "malefic": [
      "Saturn",
      "Mars"
    ],
    "common": [
      "Sun",
      "Mercury"
    ],
    "feminine": [
      "Moon",
      "Venus"
    ],
    "masculine": [
      "Sun",
      "Saturn",
      "Jupiter",
      "Mars"
    ],
    "bothSexes": [
      "Mercury"
    ],
    "diurnal": [
      "Sun",
      "Jupiter",
      "Saturn"
    ],
    "nocturnal": [
      "Moon",
      "Venus",
      "Mars"
    ],
    "bothSects": [
      "Mercury"
    ]
  },
  "houses": {
    "page": 42,
    "luminaries": {
      "Sun": "Leo",
      "Moon": "Cancer"
    },
    "planets": {
      "Saturn": {
        "day": "Aquarius",
        "night": "Capricorn"
      },
      "Jupiter": {
        "day": "Sagittarius",
        "night": "Pisces"
      },
      "Mars": {
        "day": "Aries",
        "night": "Scorpio"
      },
      "Venus": {
        "day": "Taurus",
        "night": "Libra"
      },
      "Mercury": {
        "day": "Gemini",
        "night": "Virgo"
      }
    },
    "note": "Day/night houses are from Ashmand's footnote (after Whalley), not Ptolemy's text."
  },
  "triplicities": {
    "page": 44,
    "items": [
      {
        "signs": [
          "Aries",
          "Leo",
          "Sagittarius"
        ],
        "day": "Sun",
        "night": "Jupiter",
        "wind": "north-west"
      },
      {
        "signs": [
          "Taurus",
          "Virgo",
          "Capricorn"
        ],
        "day": "Venus",
        "night": "Moon",
        "wind": "south-east"
      },
      {
        "signs": [
          "Gemini",
          "Libra",
          "Aquarius"
        ],
        "day": "Saturn",
        "night": "Mercury",
        "wind": "north-east"
      },
      {
        "signs": [
          "Cancer",
          "Scorpio",
          "Pisces"
        ],
        "day": "Venus",
        "night": "Moon",
        "participating": "Mars",
        "wind": "south-west"
      }
    ]
  },
  "exaltations": {
    "page": 45,
    "items": {
      "Sun": {
        "sign": "Aries",
        "fall": "Libra"
      },
      "Saturn": {
        "sign": "Libra",
        "fall": "Aries"
      },
      "Moon": {
        "sign": "Taurus",
        "fall": "Scorpio"
      },
      "Jupiter": {
        "sign": "Cancer",
        "fall": "Capricorn"
      },
      "Mars": {
        "sign": "Capricorn",
        "fall": "Cancer"
      },
      "Venus": {
        "sign": "Pisces",
        "fall": "Virgo"
      },
      "Mercury": {
        "sign": "Virgo",
        "fall": "Pisces"
      }
    }
  },
  "signs": [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
  ],
  "egyptianTerms": {
    "page": 49,
    "bySign": {
      "Aries": [
        {
          "planet": "Jupiter",
          "deg": 6
        },
        {
          "planet": "Venus",
          "deg": 6
        },
        {
          "planet": "Mercury",
          "deg": 8
        },
        {
          "planet": "Mars",
          "deg": 5
        },
        {
          "planet": "Saturn",
          "deg": 5
        }
      ],
      "Taurus": [
        {
          "planet": "Venus",
          "deg": 8
        },
        {
          "planet": "Mercury",
          "deg": 6
        },
        {
          "planet": "Jupiter",
          "deg": 8
        },
        {
          "planet": "Saturn",
          "deg": 5
        },
        {
          "planet": "Mars",
          "deg": 3
        }
      ],
      "Gemini": [
        {
          "planet": "Mercury",
          "deg": 6
        },
        {
          "planet": "Jupiter",
          "deg": 6
        },
        {
          "planet": "Venus",
          "deg": 5
        },
        {
          "planet": "Mars",
          "deg": 7
        },
        {
          "planet": "Saturn",
          "deg": 6
        }
      ],
      "Cancer": [
        {
          "planet": "Mars",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 6
        },
        {
          "planet": "Mercury",
          "deg": 6
        },
        {
          "planet": "Jupiter",
          "deg": 7
        },
        {
          "planet": "Saturn",
          "deg": 4
        }
      ],
      "Leo": [
        {
          "planet": "Jupiter",
          "deg": 6
        },
        {
          "planet": "Venus",
          "deg": 5
        },
        {
          "planet": "Saturn",
          "deg": 7
        },
        {
          "planet": "Mercury",
          "deg": 6
        },
        {
          "planet": "Mars",
          "deg": 6
        }
      ],
      "Virgo": [
        {
          "planet": "Mercury",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 10
        },
        {
          "planet": "Jupiter",
          "deg": 4
        },
        {
          "planet": "Mars",
          "deg": 7
        },
        {
          "planet": "Saturn",
          "deg": 2
        }
      ],
      "Libra": [
        {
          "planet": "Saturn",
          "deg": 6
        },
        {
          "planet": "Mercury",
          "deg": 8
        },
        {
          "planet": "Jupiter",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 7
        },
        {
          "planet": "Mars",
          "deg": 2
        }
      ],
      "Scorpio": [
        {
          "planet": "Mars",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 4
        },
        {
          "planet": "Mercury",
          "deg": 8
        },
        {
          "planet": "Jupiter",
          "deg": 5
        },
        {
          "planet": "Saturn",
          "deg": 6
        }
      ],
      "Sagittarius": [
        {
          "planet": "Jupiter",
          "deg": 12
        },
        {
          "planet": "Venus",
          "deg": 5
        },
        {
          "planet": "Mercury",
          "deg": 4
        },
        {
          "planet": "Saturn",
          "deg": 5
        },
        {
          "planet": "Mars",
          "deg": 4
        }
      ],
      "Capricorn": [
        {
          "planet": "Mercury",
          "deg": 7
        },
        {
          "planet": "Jupiter",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 8
        },
        {
          "planet": "Saturn",
          "deg": 4
        },
        {
          "planet": "Mars",
          "deg": 4
        }
      ],
      "Aquarius": [
        {
          "planet": "Mercury",
          "deg": 7
        },
        {
          "planet": "Venus",
          "deg": 6
        },
        {
          "planet": "Jupiter",
          "deg": 7
        },
        {
          "planet": "Mars",
          "deg": 5
        },
        {
          "planet": "Saturn",
          "deg": 5
        }
      ],
      "Pisces": [
        {
          "planet": "Venus",
          "deg": 12
        },
        {
          "planet": "Jupiter",
          "deg": 4
        },
        {
          "planet": "Mercury",
          "deg": 3
        },
        {
          "planet": "Mars",
          "deg": 9
        },
        {
          "planet": "Saturn",
          "deg": 2
        }
      ]
    },
    "statedTotals": {
      "Saturn": 57,
      "Jupiter": 79,
      "Mars": 66,
      "Venus": 82,
      "Mercury": 76
    },
    "erratum": "Virgo's last cumulative figure is printed 50 for 30."
  },
  "aspects": {
    "page": 38,
    "degrees": {
      "opposition": 180,
      "trine": 120,
      "quartile": 90,
      "sextile": 60
    },
    "inconjunct": [
      30,
      150
    ],
    "note": "Aspects divide the circle into aliquot parts; signs one or five apart are inconjunct."
  }
} as const;
export default TETRABIBLOS_DATA;
