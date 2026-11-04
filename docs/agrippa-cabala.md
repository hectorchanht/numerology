# Agrippa Books II–III — planetary names, lunar mansions, Sephiroth

Data: `packages/knowledge/data/agrippa-cabala.json`; checks: `packages/knowledge/test/agrippa-cabala.test.mjs`.
Source: Agrippa, *Three Books of Occult Philosophy*, tr. J. F. 1651 (public domain), via Wikisource's page transcriptions. Most Book II–III pages there are unproofread OCR; the kamea tables are proofread. `reviewed: false`.

## How the planetary names work

Each planet's magic square yields four key numbers: its order *n*, its cell count *n²*, its line sum and its total. Agrippa's divine names, Intelligence and Spirit for that planet are Hebrew words whose letter sum equals one of those numbers. The Intelligence usually matches the line or total and governs the good side; the Spirit matches the total and governs the harmful side.

| Planet | Role | Name | Hebrew | Value | Matches | Note |
|---|---|---|---|---:|---|---|
| Saturn | divine name | Ab | אב | 3 | order |  |
| Saturn | divine name | Hod | הד | 9 | cells |  |
| Saturn | divine name | Iah | יה | 15 | line |  |
| Saturn | divine name | Hod | הוד | 15 | line |  |
| Saturn | divine name | YHVH extended | יוד הא ואו הא | 45 | total |  |
| Saturn | intelligence | Agiel | אגיאל | 45 | total |  |
| Saturn | spirit | Zazel | זאזל | 45 | total |  |
| Jupiter | divine name | Abba | אבא | 4 | order |  |
| Jupiter | divine name | (He-Vau-He) | הוה | 16 | cells |  |
| Jupiter | divine name | (Aleph-He-Yod) | אהי | 16 | cells |  |
| Jupiter | divine name | El Ab | אל אב | 34 | line |  |
| Jupiter | intelligence | Johphiel | יהפיאל | 136 | total |  |
| Jupiter | spirit | Hismael | הסמאל | 136 | total |  |
| Mars | divine name | He | ה | 5 | order |  |
| Mars | divine name | (Yod-He-Yod) | יהי | 25 | cells |  |
| Mars | divine name | Adonai | אדני | 65 | line |  |
| Mars | intelligence | Graphiel | גראפיאל | 325 | total |  |
| Mars | spirit | Barzabel | ברצבאל | 325 | total | 1651 prints ברצאבאל (= 326); without the extra aleph it equals the Mars total 325 |
| Sun | divine name | Vau | ו | 6 | order |  |
| Sun | divine name | He extended | הא | 6 | order |  |
| Sun | divine name | Eloh | אלה | 36 | cells |  |
| Sun | intelligence | Nachiel | נכיאל | 111 | line |  |
| Sun | spirit | Sorath | סורת | 666 | total |  |
| Venus | divine name | (Aleph-He-Aleph) | אהא | 7 | order |  |
| Venus | intelligence | Hagiel | הגיאל | 49 | cells |  |
| Venus | spirit | Kedemel | קדמאל | 175 | line | 1651 prints 157; the Hebrew sums to 175, the Venus line sum |
| Venus | intelligences | Bne Seraphim | בני שרפים | 1252 | — | Printed 1252 (Venus total is 1225); the Hebrew as printed sums to 692. No spelling in the source reconciles it |
| Mercury | divine name | Asboga (eight extended) | אזבוגה | 8 | order | Hebrew sums to 24; Agrippa means 8 in an 'extended' sense, not plain gematria |
| Mercury | divine name | Din | דין | 64 | cells |  |
| Mercury | divine name | Doni | דני | 64 | cells |  |
| Mercury | intelligence | Tiriel | טיריאל | 260 | line |  |
| Mercury | spirit | Taphthartharath | תפתרתרת | 2080 | total |  |
| Moon | divine name | Hod | הד | 9 | order |  |
| Moon | divine name | Elim | אלים | 81 | cells |  |
| Moon | spirit | Hasmodai | חשמודאי | 369 | line | Wikisource OCR has השמודאי (= 366); with Cheth it equals the Moon line sum 369 |
| Moon | spirit of spirits | Schedbarschemoth Schartathan | שדברשהמעת שרתתן | 3321 | total | Hebrew as printed sums to 2671; long-standing unresolved spelling |
| Moon | intelligence of intelligences | Malcha betharsisim hed beruah schehakim | מלכא בתרשיסים עד ברוה שהקים | 3321 | total | Hebrew as printed sums to 1855; long-standing unresolved spelling |

## 28 mansions of the Moon

Each spans 360°/28 = 12°51′26″ from the head of Aries.

| # | Names | Meaning | Used for |
|---:|---|---|---|
| 1 | Alnath | horns of Aries | discord, journeys |
| 2 | Allothaim, Albochan | belly of Aries | finding treasure, holding captives |
| 3 | Achaomazon, Athoray | showering / Pleiades | sailors, hunters, alchemists |
| 4 | Aldebaran, Aldelamen | eye or head of Taurus | ruin of buildings, discord |
| 5 | Alchatay, Albachay | — | safe return, study, health, goodwill |
| 6 | Alhanna, Alchaya | little star of great light | hunting, sieges, revenge |
| 7 | Aldimiach, Alarzach | arm of Gemini | gain, friendship, lovers |
| 8 | Alnaza, Anatrachya | misty or cloudy | love, friendship, travel companions |
| 9 | Archaam, Arcaph | eye of the Lion | hinders harvests and travel, discord |
| 10 | Algelioche, Albgebh | neck or forehead of Leo | strong buildings, love, help against enemies |
| 11 | Azobra, Ardaf | hair of the Lion's head | voyages, trade, ransom |
| 12 | Alzarpha, Azarpha | tail of Leo | harvests, planting, servants |
| 13 | Alhaire | dog-stars / wings of Virgo | goodwill, gain, voyages, freeing captives |
| 14 | Achureth, Arimet, Azimeth, Alhumech, Alcheymech | spike of Virgo | married love, healing, sailors |
| 15 | Agrapha, Algarpha | covered / covered flying | treasure, digging, divorce |
| 16 | Azubene, Ahubene | horns of Scorpio | hinders journeys and marriage, ransom |
| 17 | Alchil | crown of Scorpio | improves fortune, lasting love, buildings, sailors |
| 18 | Alchas, Altob | heart of Scorpio | sedition, revenge, freeing captives |
| 19 | Allatha, Achala, Hycula, Axala | tail of Scorpio | sieges, expulsion |
| 20 | Abnahaya | a beam | taming beasts, strengthening prisons |
| 21 | Abeda, Albeldach | a desert | harvests, gain, travellers, divorce |
| 22 | Sadahacha, Zodeboluch, Zandeldena | a shepherd | escape of captives, curing disease |
| 23 | Zabadola, Zobrach | swallowing | divorce, freeing captives, health |
| 24 | Sadabath, Chadezoad | star of fortune | married goodwill, victory |
| 25 | Sadalabra, Sadalachia | butterfly / spreading forth | sieges, revenge, binding |
| 26 | Alpharg, Phragal Mocaden | first drawing | union and love, health of captives |
| 27 | Alcharya, Alhalgalmoad | second drawing | harvests, revenue, healing |
| 28 | Albotham, Alchalcy | Pisces | harvests, trade, safe travel, married joy |

## Ten Sephiroth (Agrippa's attribution)

| # | Sephirah | Meaning | Divine name | Order | Sphere | Intelligence |
|---:|---|---|---|---|---|---|
| 1 | Kether | crown | Eheieh | Seraphim / Haioth ha-Kodesh | Primum Mobile | Metatron |
| 2 | Chokmah | wisdom | Yah (Tetragrammaton with Yod) | Cherubim / Ophanim | Fixed stars | Raziel |
| 3 | Binah | understanding, providence | Tetragrammaton Elohim | Thrones / Aralim | Saturn | Zaphkiel (also Jophiel) |
| 4 | Chesed | mercy, goodness | El | Dominations / Hashmalim | Jupiter | Zadkiel |
| 5 | Geburah | power, judgement (also Pachad, fear) | Elohim Gibor | Powers / Seraphim | Mars | Camael |
| 6 | Tiphereth | beauty, glory | Eloah (with Vaudaath) | Virtues / Malachim | Sun | Raphael (also Peliel) |
| 7 | Netzach | victory | Tetragrammaton Sabaoth | Principalities / Elohim | Venus | Haniel (also Cerviel) |
| 8 | Hod | splendour, praise | Elohim Sabaoth | Archangels / Bene Elohim | Mercury | Michael |
| 9 | Yesod | foundation | Shaddai / El Chai | Angels / Cherubim | Moon | Gabriel |
| 10 | Malkuth | kingdom | Adonai Melech | Blessed souls / Ishim | Mankind (sublunary) | Soul of the Messiah, or Metatron |

Agrippa's own attribution of choirs differs from later Golden Dawn tables (e.g. Seraphim appear at both Kether and Geburah). Kept as printed.
