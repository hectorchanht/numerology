# Greek gematria & planetary squares — domain notes

Structured data: `packages/knowledge/data/greek-gematria.json`, `packages/knowledge/data/planetary-squares.json`.
Every value below is recomputed by `packages/knowledge/test/greek-gematria.test.mjs`.
Facts only (values, ratios, squares); source pages refer to Fideler, *Jesus Christ, Sun of God* (1993). `reviewed: false` — interpretive glosses are the author's thesis, weight them accordingly.

## How isopsephy works

Greek letters double as numerals (Milesian system): units α–θ (with obsolete ϛ = 6), tens ι–ϙ (ϙ = 90), hundreds ρ–ϡ (ϡ = 900). A word's value is the plain sum of its letters; words with equal sums were read as related. Fideler's thesis is that core divine names were chosen so their values approximate geometric constants scaled to 1000 (the Monad) and the string ratios of Pythagorean tuning.

| Letter | Α | Β | Γ | Δ | Ε | Ϛ | Ζ | Η | Θ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Value | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| Letter | Ι | Κ | Λ | Μ | Ν | Ξ | Ο | Π | Ϙ |
| Value | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 |
| Letter | Ρ | Σ | Τ | Υ | Φ | Χ | Ψ | Ω | Ϡ |
| Value | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |

## Canon of names

| Greek | Gloss | Value | p. |
|---|---|---:|---:|
| ΑΜΗΝ | Amen | 99 | 54 |
| ΒΙΟΣ | Life (bios) | 282 | 134 |
| ΘΕΟΣ | God | 284 | 52 |
| ΗΛΙΟΣ | Helios, the Sun | 318 | 103 |
| ΘΗΤΑ | Theta (letter-name) | 318 | 449 |
| Η ΟΔΟΣ | the Path | 352 | 449 |
| ΕΡΜΗΣ | Hermes | 353 | 103 |
| Ο ΘΕΟΣ | the God | 354 | 448 |
| ΜΙΘΡΑΣ | Mithras (common spelling) | 360 | 93 |
| ΑΒΡΑΞΑΣ | Abraxas, gnostic ruler of 365 heavens | 365 | 48 |
| ΜΕΙΘΡΑΣ | Mithras (spelling reported by Jerome) | 365 | 48 |
| ΝΕΙΛΟΣ | Nile | 365 | 270 |
| ΝΟΜΟΣ | Law | 430 | 54 |
| Ο ΛΟΓΟΣ | the Logos | 443 | 448 |
| Η ΜΗΤΗΡ | the Mother | 464 | 238 |
| Ο ΚΟΚΚΟΣ | the Seed | 470 | 449 |
| ΚΑΡΠΟΣ | Fruit | 471 | 448 |
| ΑΡΤΟΙ | Loaves | 481 | 136 |
| ΠΕΤΡΑ | Rock | 486 | 297 |
| ΠΑΡΘΕΝΟΣ | Virgin | 515 | 449 |
| ΛΥΡΑ | Lyre | 531 | 449 |
| ΑΛΦΑ | Alpha | 532 | 447 |
| ΑΤΛΑΣ | Atlas | 532 | 447 |
| ΚΟΣΜΟΣ | Kosmos, world-order | 600 | 290 |
| ΖΕΥΣ | Zeus | 612 | 103 |
| ΔΕΛΦΟΙ | Delphi | 619 | 298 |
| ΠΥΘΙΟΝ | Pythion, temple of Apollo Pythios | 619 | 397 |
| ΣΥΗΝΗ | Syene (solstice city) | 666 | 272 |
| Ο ΘΕΟΣ ΕΡΜΗΣ | the God Hermes | 707 | 103 |
| ΚΗΦΑΣ | Cephas (Peter) | 729 | 297 |
| ΔΕΛΦΙΝΙΟΝ | Delphinion, temple of Apollo Delphinios | 729 | 298 |
| ΠΥΘΙΟΣ | Pythios, Apollo at Delphi | 769 | 103 |
| ΚΥΡΙΟΣ | Lord | 800 | 290 |
| ΠΕΡΙΣΤΕΡΑ | Dove | 801 | 50 |
| ΑΩ | Alpha-Omega | 801 | 55 |
| ΩΜΕΓΑ | Omega, 'the Last Mystery' | 849 | 97 |
| ΜΕΓΑΣ ΚΟΣΜΟΣ | Macrocosm | 849 | 449 |
| ΙΗΣΟΥΣ | Jesus | 888 | 49 |
| ΩΛΗΝ | Olen, legendary founder of Apollo's oracle at Delphi | 888 | 103 |
| ΟΥΡΑΝΟΣ | Heaven | 891 | 52 |
| ΑΞΩΝ | Axis | 911 | 447 |
| ΟΜΦΑΛΟΣ | Omphalos, navel-stone | 911 | 449 |
| ΜΙΚΡΟΣ ΚΟΣΜΟΣ | Microcosm | 1040 | 449 |
| ΠΛΗΡΩΜΑ | Pleroma, gnostic fullness | 1059 | 320 |
| ΑΠΟΛΛΩΝ | Apollo | 1061 | 103 |
| Ο ΜΙΚΡΟΣ ΚΟΣΜΟΣ | the Microcosm | 1110 | 343 |
| ΙΩΤΑ | Iota, vowel of the Sun | 1111 | 343 |
| ΙΧΘΥΕΣ | Fishes | 1224 | 103 |
| ΤΟ ΔΙΚΤΥΟΝ | the Net | 1224 | 103 |
| Ο ΘΕΟΣ ΑΠΟΛΛΩΝ | the God Apollo | 1415 | 103 |
| ΧΡΙΣΤΟΣ | Christ | 1480 | 284 |
| ΣΙΜΩΝ Ο ΠΕΤΡΟΣ | Simon Peter | 1925 | 312 |
| ΙΗΣΟΥΣ ΧΡΙΣΤΟΣ | Jesus Christ | 2368 | 284 |

## Geometric and harmonic relations

| Relation | Target | Names | Note |
|---|---:|---|---|
| $\sqrt{2} \times 1000 \approx 1414.2 \to 1415$ | 1415 | Ο ΘΕΟΣ ΑΠΟΛΛΩΝ |  |
| $\tfrac{3}{4}\sqrt{2} \times 1000 \approx 1060.7$ | 1061 | ΑΠΟΛΛΩΝ |  |
| $\tfrac{1}{2}\sqrt{2} \times 1000 \approx 707.1$ | 707 | Ο ΘΕΟΣ ΕΡΜΗΣ |  |
| $\tfrac{1}{4}\sqrt{2} \times 1000 \approx 353.6$ | 353 | ΕΡΜΗΣ |  |
| $\tfrac{1}{2}\sqrt{6} \times 1000 \approx 1224.7$ | 1224 | ΙΧΘΥΕΣ, ΤΟ ΔΙΚΤΥΟΝ |  |
| $\tfrac{1}{4}\sqrt{6} \times 1000 \approx 612.4$ | 612 | ΖΕΥΣ |  |
| $\sqrt{6}\,\pi \times 100 \approx 769.5$ | 769 | ΠΥΘΙΟΣ |  |
| $1000 / \pi \approx 318.3$ | 318 | ΗΛΙΟΣ | diameter of a circle whose circumference is the Monad (1000) |
| $891 / \pi \approx 283.6$ | 284 | ΟΥΡΑΝΟΣ, ΘΕΟΣ |  |
| $\tfrac{2}{3} \times 1000 \approx 666.7$ | 666 |  | string ratio of the perfect fifth |
| $\tfrac{8}{9} \times 1000 \approx 888.9$ | 888 | ΙΗΣΟΥΣ, ΩΛΗΝ | string ratio of the Pythagorean whole tone (source prints 9/8; 8/9 is the string ratio) |
| $666 : 888 = 3 : 4$ | 0.75 |  | perfect fourth |
| $\tfrac{3}{2} \big/ \sqrt{2} \approx 1.0607$ | 1061 | ΑΠΟΛΛΩΝ | ratio of arithmetic to geometric mean of 1 and 2; equals GM : HM |
| $\sqrt{3} \approx \tfrac{265}{153}$ | 1.7320508 |  | Archimedes' lower bound; 153 = 'measure of the fish' (vesica piscis), cf. 153 fish, John 21:11 |
| $\sqrt{2} \approx 1;24,51,10_{60} = 1.414213$ | 1.4142136 |  | YBC 7289, c. 1800 BCE |
| $365 + 364 = 729 = 9^3 = 27^2$ | 729 | ΚΗΦΑΣ, ΔΕΛΦΙΝΙΟΝ |  |
| $27^2 + 364^2 = 365^2$ | 0 |  | derived: follows from 365² − 364² = 365 + 364 = 729 = 27² |
| $\sum_{k=1}^{729} k = 729 \times 365$ | 266085 |  |  |
| $666 = 74 \times 9,\; 888 = 74 \times 12,\; 1480 = 74 \times 20$ | 1 |  | 74 = sum of any symmetric group of four cells in the Sun square |

## Planetary magic squares

Each holds 1..n² once; every row, column and main diagonal sums to $n(n^2+1)/2$. Traditional order runs from Saturn (outermost, 3×3) to the Moon (nearest, 9×9).

### Saturn (ΚΡΟΝΟΣ) — 3×3, line 15, total 45

|  |  |  |
|---:|---:|---:|
|  4 |  9 |  2 |
|  3 |  5 |  7 |
|  8 |  1 |  6 |

### Jupiter (ΖΕΥΣ) — 4×4, line 34, total 136

|  |  |  |  |
|---:|---:|---:|---:|
|  4 | 14 | 15 |  1 |
|  9 |  7 |  6 | 12 |
|  5 | 11 | 10 |  8 |
| 16 |  2 |  3 | 13 |

### Mars (ΑΡΗΣ) — 5×5, line 65, total 325

|  |  |  |  |  |
|---:|---:|---:|---:|---:|
| 11 | 24 |  7 | 20 |  3 |
|  4 | 12 | 25 |  8 | 16 |
| 17 |  5 | 13 | 21 |  9 |
| 10 | 18 |  1 | 14 | 22 |
| 23 |  6 | 19 |  2 | 15 |

### Sun (ΗΛΙΟΣ) — 6×6, line 111, total 666

|  |  |  |  |  |  |
|---:|---:|---:|---:|---:|---:|
|  6 | 32 |  3 | 34 | 35 |  1 |
|  7 | 11 | 27 | 28 |  8 | 30 |
| 19 | 14 | 16 | 15 | 23 | 24 |
| 18 | 20 | 22 | 21 | 17 | 13 |
| 25 | 29 | 10 |  9 | 26 | 12 |
| 36 |  5 | 33 |  4 |  2 | 31 |

Intelligence Nakhiel (נכיאל) = 111 (one line); Spirit Sorath (סורת) = 666 (whole square).

### Venus (ΑΦΡΟΔΙΤΗ) — 7×7, line 175, total 1225

|  |  |  |  |  |  |  |
|---:|---:|---:|---:|---:|---:|---:|
| 22 | 47 | 16 | 41 | 10 | 35 |  4 |
|  5 | 23 | 48 | 17 | 42 | 11 | 29 |
| 30 |  6 | 24 | 49 | 18 | 36 | 12 |
| 13 | 31 |  7 | 25 | 43 | 19 | 37 |
| 38 | 14 | 32 |  1 | 26 | 44 | 20 |
| 21 | 39 |  8 | 33 |  2 | 27 | 45 |
| 46 | 15 | 40 |  9 | 34 |  3 | 28 |

### Mercury (ΕΡΜΗΣ) — 8×8, line 260, total 2080

|  |  |  |  |  |  |  |  |
|---:|---:|---:|---:|---:|---:|---:|---:|
|  8 | 58 | 59 |  5 |  4 | 62 | 63 |  1 |
| 49 | 15 | 14 | 52 | 53 | 11 | 10 | 56 |
| 41 | 23 | 22 | 44 | 45 | 19 | 18 | 48 |
| 32 | 34 | 35 | 29 | 28 | 38 | 39 | 25 |
| 40 | 26 | 27 | 37 | 36 | 30 | 31 | 33 |
| 17 | 47 | 46 | 20 | 21 | 43 | 42 | 24 |
|  9 | 55 | 54 | 12 | 13 | 51 | 50 | 16 |
| 64 |  2 |  3 | 61 | 60 |  6 |  7 | 57 |

### Moon (ΣΕΛΗΝΗ) — 9×9, line 369, total 3321

|  |  |  |  |  |  |  |  |  |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 37 | 78 | 29 | 70 | 21 | 62 | 13 | 54 |  5 |
|  6 | 38 | 79 | 30 | 71 | 22 | 63 | 14 | 46 |
| 47 |  7 | 39 | 80 | 31 | 72 | 23 | 55 | 15 |
| 16 | 48 |  8 | 40 | 81 | 32 | 64 | 24 | 56 |
| 57 | 17 | 49 |  9 | 41 | 73 | 33 | 65 | 25 |
| 26 | 58 | 18 | 50 |  1 | 42 | 74 | 34 | 66 |
| 67 | 27 | 59 | 10 | 51 |  2 | 43 | 75 | 35 |
| 36 | 68 | 19 | 60 | 11 | 52 |  3 | 44 | 76 |
| 77 | 28 | 69 | 20 | 61 | 12 | 53 |  4 | 45 |

### 27×27 (729)

27×27 square of 1..729 (book p. 299, after ΚΗΦΑΣ = 729). Any odd-order Siamese (de la Loubère) construction puts (n²+1)/2 = 365 in the centre cell; line sum 9855 = 27 × 365. Generate on demand rather than storing 729 cells.
