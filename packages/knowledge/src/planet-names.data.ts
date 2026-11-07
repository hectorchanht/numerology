// AUTO-GENERATED from data/agrippa-cabala.json(planetaryNames 段)同 data/fourth-book.json(arbatel 段) — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改對應 JSON 後重新生成本文件。
const PLANET_NAMES_DATA = {
  "cabalaMeta": {
    "name": "Agrippa, Occult Philosophy Books II–III — planetary divine names/intelligences/spirits, 28 lunar mansions, ten Sephiroth",
    "schema": "planetaryNames: planet -> [{role,name,hebrew,value,ref}] ; lunarMansions: 28 x {n,names,meaning,startDeg,uses} ; sephiroth: 10 x {n,sephirah,meaning,divineName,order,sphere,intelligence}",
    "source": "Henry Cornelius Agrippa, Three Books of Occult Philosophy, tr. J. F. (London 1651), public domain. Text via Wikisource Page: namespace of 'Three Books of Occult Philosophy (De Occulta Philosophia) (1651).djvu'. `page` = djvu page. Book II ch. 22 (pp. 264-277), ch. 33 (pp. 310-313); Book III ch. 10 (pp. 390-394).",
    "version": "0.1.0",
    "reviewed": false,
    "reviewNote": "Wikisource proofread level for Books II-III is mostly 1 (raw OCR, not proofread); kamea tables on pp. 269-275 are level 3 (proofread). Hebrew recomputed by test; 1651 errata recorded in `erratum`, corrections only where the planetary-square number makes the intended spelling certain."
  },
  "planetaryNames": {
    "Saturn": [
      {
        "role": "divine name",
        "name": "Ab",
        "hebrew": "אב",
        "value": 3,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "Hod",
        "hebrew": "הד",
        "value": 9,
        "ref": "cells"
      },
      {
        "role": "divine name",
        "name": "Iah",
        "hebrew": "יה",
        "value": 15,
        "ref": "line"
      },
      {
        "role": "divine name",
        "name": "Hod",
        "hebrew": "הוד",
        "value": 15,
        "ref": "line"
      },
      {
        "role": "divine name",
        "name": "YHVH extended",
        "hebrew": "יוד הא ואו הא",
        "value": 45,
        "ref": "total"
      },
      {
        "role": "intelligence",
        "name": "Agiel",
        "hebrew": "אגיאל",
        "value": 45,
        "ref": "total"
      },
      {
        "role": "spirit",
        "name": "Zazel",
        "hebrew": "זאזל",
        "value": 45,
        "ref": "total"
      }
    ],
    "Jupiter": [
      {
        "role": "divine name",
        "name": "Abba",
        "hebrew": "אבא",
        "value": 4,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "(He-Vau-He)",
        "hebrew": "הוה",
        "value": 16,
        "ref": "cells"
      },
      {
        "role": "divine name",
        "name": "(Aleph-He-Yod)",
        "hebrew": "אהי",
        "value": 16,
        "ref": "cells"
      },
      {
        "role": "divine name",
        "name": "El Ab",
        "hebrew": "אל אב",
        "value": 34,
        "ref": "line"
      },
      {
        "role": "intelligence",
        "name": "Johphiel",
        "hebrew": "יהפיאל",
        "value": 136,
        "ref": "total"
      },
      {
        "role": "spirit",
        "name": "Hismael",
        "hebrew": "הסמאל",
        "value": 136,
        "ref": "total"
      }
    ],
    "Mars": [
      {
        "role": "divine name",
        "name": "He",
        "hebrew": "ה",
        "value": 5,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "(Yod-He-Yod)",
        "hebrew": "יהי",
        "value": 25,
        "ref": "cells"
      },
      {
        "role": "divine name",
        "name": "Adonai",
        "hebrew": "אדני",
        "value": 65,
        "ref": "line"
      },
      {
        "role": "intelligence",
        "name": "Graphiel",
        "hebrew": "גראפיאל",
        "value": 325,
        "ref": "total"
      },
      {
        "role": "spirit",
        "name": "Barzabel",
        "hebrew": "ברצבאל",
        "value": 325,
        "ref": "total",
        "erratum": "1651 prints ברצאבאל (= 326); without the extra aleph it equals the Mars total 325"
      }
    ],
    "Sun": [
      {
        "role": "divine name",
        "name": "Vau",
        "hebrew": "ו",
        "value": 6,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "He extended",
        "hebrew": "הא",
        "value": 6,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "Eloh",
        "hebrew": "אלה",
        "value": 36,
        "ref": "cells"
      },
      {
        "role": "intelligence",
        "name": "Nachiel",
        "hebrew": "נכיאל",
        "value": 111,
        "ref": "line"
      },
      {
        "role": "spirit",
        "name": "Sorath",
        "hebrew": "סורת",
        "value": 666,
        "ref": "total"
      }
    ],
    "Venus": [
      {
        "role": "divine name",
        "name": "(Aleph-He-Aleph)",
        "hebrew": "אהא",
        "value": 7,
        "ref": "order"
      },
      {
        "role": "intelligence",
        "name": "Hagiel",
        "hebrew": "הגיאל",
        "value": 49,
        "ref": "cells"
      },
      {
        "role": "spirit",
        "name": "Kedemel",
        "hebrew": "קדמאל",
        "value": 175,
        "ref": "line",
        "erratum": "1651 prints 157; the Hebrew sums to 175, the Venus line sum"
      },
      {
        "role": "intelligences",
        "name": "Bne Seraphim",
        "hebrew": "בני שרפים",
        "value": 1252,
        "ref": null,
        "unresolved": true,
        "erratum": "Printed 1252 (Venus total is 1225); the Hebrew as printed sums to 692. No spelling in the source reconciles it"
      }
    ],
    "Mercury": [
      {
        "role": "divine name",
        "name": "Asboga (eight extended)",
        "hebrew": "אזבוגה",
        "value": 8,
        "ref": "order",
        "unresolved": true,
        "erratum": "Hebrew sums to 24; Agrippa means 8 in an 'extended' sense, not plain gematria"
      },
      {
        "role": "divine name",
        "name": "Din",
        "hebrew": "דין",
        "value": 64,
        "ref": "cells"
      },
      {
        "role": "divine name",
        "name": "Doni",
        "hebrew": "דני",
        "value": 64,
        "ref": "cells"
      },
      {
        "role": "intelligence",
        "name": "Tiriel",
        "hebrew": "טיריאל",
        "value": 260,
        "ref": "line"
      },
      {
        "role": "spirit",
        "name": "Taphthartharath",
        "hebrew": "תפתרתרת",
        "value": 2080,
        "ref": "total"
      }
    ],
    "Moon": [
      {
        "role": "divine name",
        "name": "Hod",
        "hebrew": "הד",
        "value": 9,
        "ref": "order"
      },
      {
        "role": "divine name",
        "name": "Elim",
        "hebrew": "אלים",
        "value": 81,
        "ref": "cells"
      },
      {
        "role": "spirit",
        "name": "Hasmodai",
        "hebrew": "חשמודאי",
        "value": 369,
        "ref": "line",
        "erratum": "Wikisource OCR has השמודאי (= 366); with Cheth it equals the Moon line sum 369"
      },
      {
        "role": "spirit of spirits",
        "name": "Schedbarschemoth Schartathan",
        "hebrew": "שדברשהמעת שרתתן",
        "value": 3321,
        "ref": "total",
        "unresolved": true,
        "erratum": "Hebrew as printed sums to 2671; long-standing unresolved spelling"
      },
      {
        "role": "intelligence of intelligences",
        "name": "Malcha betharsisim hed beruah schehakim",
        "hebrew": "מלכא בתרשיסים עד ברוה שהקים",
        "value": 3321,
        "ref": "total",
        "unresolved": true,
        "erratum": "Hebrew as printed sums to 1855; long-standing unresolved spelling"
      }
    ]
  },
  "fourthMeta": {
    "name": "'Fourth Book of Occult Philosophy' compilation (1655) — geomancy figures, Heptameron days and planetary hours, Arbatel Olympic spirits",
    "schema": "geomancy.figures: 16 x {name, rows (top→bottom, 1 = single point, 2 = double), planet, house sign, sign (zodiac distribution)}, triplicity schemes ; heptameron: days + Chaldean order + hour names ; arbatel: 7 Olympic spirits",
    "source": "Henry Cornelius Agrippa (pseudo), His Fourth Book of Occult Philosophy … Geomancy … Heptameron (Peter de Abano) … Arbatel, tr. Robert Turner, London 1655; public domain. Read from the Cornell scan of the 1978 Askin facsimile (archive.org cu31924006718757); the 1978 editorial introduction was NOT used. `page` = PDF page (MinerU doc:e501ca4).",
    "version": "0.1.0",
    "reviewed": false,
    "reviewNote": "Attributions are traditional, not historical: the Fourth Book and Heptameron are spurious ascriptions to Agrippa and Abano. Geomantic figure rows read from the printed table image (p. 41). Two OCR passes compared: local MinerU and archive.org's own OCR text."
  },
  "arbatel": {
    "page": 183,
    "spirits": [
      {
        "name": "Aratron",
        "planet": "Saturn",
        "provinces": 49
      },
      {
        "name": "Bethor",
        "planet": "Jupiter",
        "provinces": 42,
        "erratum": "1655 prints XXXII (32) and a total of 186; the 7-step series and the total 196 require 42"
      },
      {
        "name": "Phaleg",
        "planet": "Mars",
        "provinces": 35
      },
      {
        "name": "Och",
        "planet": "Sun",
        "provinces": 28
      },
      {
        "name": "Hagith",
        "planet": "Venus",
        "provinces": 21
      },
      {
        "name": "Ophiel",
        "planet": "Mercury",
        "provinces": 14
      },
      {
        "name": "Phul",
        "planet": "Moon",
        "provinces": 7
      }
    ],
    "totalProvinces": 196,
    "yearsEach": 490,
    "epochs": {
      "note": "Aphorism 17: Bethor began 60 BC; Och ruled until AD 1410; Hagith until AD 1900.",
      "firstRuler": "Bethor",
      "firstStart": -60,
      "stated": [
        [
          "Och",
          1410
        ],
        [
          "Hagith",
          1900
        ]
      ]
    }
  }
} as const;
export default PLANET_NAMES_DATA;
