# Original AP practice

Updated 16 October 2026. The first release covers eight courses. These are original practice questions informed by College Board’s public course frameworks and sample-exam formats. They are not official, copied, licensed, or endorsed College Board questions. Historical summaries, writing passages, and datasets are authored for practice and labeled accordingly.

| Course | Official units | Available items | Public framework and sample reference |
| --- | ---: | ---: | --- |
| Biology | 8 | 120 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf) |
| Calculus AB | 8 | 120 | [AB/BC Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf) — AB units only |
| Chemistry | 9 | 102 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf) |
| Computer Science A | 4 | 120 | [Revised Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-computer-science-a-course-and-exam-description.pdf) |
| English Language | 9 | 100 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-and-exam-description.pdf), [unit skill progression](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-at-a-glance.pdf) |
| Psychology | 5 | 98 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-psychology-course-and-exam-description.pdf) |
| U.S. History | 9 | 78 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-us-history-course-and-exam-description.pdf) |
| World History: Modern | 9 | 84 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-world-history-modern-course-and-exam-description.pdf) |

The 822 items comprise 320 reasoning families with up to three scenario, numerical, or code variants per family. Identical variants are removed. Variants are not 822 distinct concepts. Questions recur across the 180 game levels per course. Each item has four distinct choices, a worked explanation, a primary reference link, a practice-format tag, and an official-unit tag.

## Alignment choices

- Biology uses applications, constructed data, experimental controls, genetics, and ecological reasoning. Public sample formats begin on PDF page 211.
- Calculus uses symbolic, tabular, theorem, rate, accumulation, and differential-equation problems. AB/BC sample formats begin on PDF page 208; BC-only units are excluded.
- Chemistry uses particle-level explanations, calculations, experimental design, and constructed measurements. Public examples include multiple-choice items and laboratory reasoning near the end of the CED. The app supplies choices rather than claiming to grade full written FRQs.
- Computer Science A follows the current four-unit framework, including text-file input, collections, and recursion. Inheritance is no longer taught as a standalone unit. Scanner examples do not combine line-based input with other Scanner parsing methods, consistent with the stated scope.
- Psychology applies concepts to scenarios and asks about evidence, statistics, operational definitions, causation, and research safeguards. Vignettes are not personal diagnoses.
- English Language follows the nine-unit progression of recurring rhetorical situation, claims/evidence, reasoning/organization, and style skills. Units do not have invented official content-topic names. All writing and source sets are original.
- History questions emphasize context, cause, comparison, continuity/change, sourcing, and evidence. Original explanatory summaries are not represented as primary-source quotations. Constructed numerical examples are labeled, rather than presented as actual historical measurements.

## Unit bosses and compatibility

`courseFrameworks.ts` separates official AP units from the ten illustrated game areas. Each official unit has a designated final boss that samples that unit’s introduced material. Courses with fewer units group areas or place extra material under Review. Psychology’s saved area IDs are traversed in the current five-unit sequence. All 180 saved level IDs per course remain intact; earned rewards and completed levels are not reset.

## Answer order and validation

Choices shuffle once per attempt using the navigation attempt key. Each four-question block of four-choice items uses all four correct-answer positions; distractors also shuffle. Replaying creates a fresh arrangement. Hints, retries, rerenders, and appended review questions preserve existing order. Grading uses stable choice IDs, not visible letters.

Automated checks cover every level’s playable question count, all official unit bosses, source/unit tags, distinct choice text, duplicate-item removal, choice-order balance, immutable bank data, and independently calculated examples in biology, chemistry, calculus, and Java tracing. These checks do not certify academic completeness or calibrate difficulty. A qualified subject review and broader stimulus/FRQ coverage remain necessary before marketing this as comprehensive AP exam preparation. The starting check is a practice-route suggestion, not an AP-score prediction.
