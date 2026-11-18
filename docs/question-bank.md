# Original AP practice

Updated 18 November 2026. The app covers ten courses. These are original practice questions informed by College Board’s public course frameworks and sample-exam formats. They are not official, copied, licensed, or endorsed College Board questions. Historical summaries, writing passages, and datasets are authored for practice and labeled accordingly.

| Course | Official units | Distinct items | Public framework and sample reference |
| --- | ---: | ---: | --- |
| Biology | 8 | 73 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf) |
| Calculus AB | 8 | 114 | [AB/BC Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf) — AB units only |
| Chemistry | 9 | 80 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf) |
| Computer Science A | 4 | 112 | [Revised Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-computer-science-a-course-and-exam-description.pdf) |
| Computer Science Principles | 5 big ideas | 120 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf) |
| English Language | 9 | 92 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-and-exam-description.pdf), [unit skill progression](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-at-a-glance.pdf) |
| Psychology | 5 | 82 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-psychology-course-and-exam-description.pdf) |
| Statistics | 9 | 119 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-and-exam-description.pdf) |
| U.S. History | 9 | 78 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-us-history-course-and-exam-description.pdf) |
| World History: Modern | 9 | 82 | [Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-world-history-modern-course-and-exam-description.pdf) |

The 952 items come from 400 reasoning families with up to three variants each. A variant only counts when it is a different problem: one that repeats a sibling’s choices, answer and material with a relabelled stem (“sample B” for “sample A”) is discarded. That rule removed 154 relabelled copies from the original eight banks on 18 November 2026; Psychology then gained one new scenario per family. Questions recur across the 180 game levels per course. Each item has four distinct choices, a worked explanation, a primary reference link, a practice-format tag, and an official-unit tag.

## Writing rules

- Wrong answers are believable mistakes a student could make: the reversed conditional, the missing square root, a misread proclamation. They do not lean on “always”, “never”, “immediately” or “impossible”, which let students eliminate a choice without knowing the content. A test enforces this for every course.
- Computed answers (code tracing, binary, probability, intervals) are generated from the same arithmetic the question describes, and tests check selected results against independent calculations.
- No question is copied from a College Board exam. Items follow the public frameworks’ skills and the published question formats.

## Alignment choices

- Biology uses applications, constructed data, experimental controls, genetics, and ecological reasoning. Public sample formats begin on PDF page 211.
- Calculus uses symbolic, tabular, theorem, rate, accumulation, and differential-equation problems. AB/BC sample formats begin on PDF page 208; BC-only units are excluded.
- Chemistry uses particle-level explanations, calculations, experimental design, and constructed measurements. Public examples include multiple-choice items and laboratory reasoning near the end of the CED. The app supplies choices rather than claiming to grade full written FRQs.
- Computer Science A follows the current four-unit framework, including text-file input, collections, and recursion. Inheritance is no longer taught as a standalone unit. Scanner examples do not combine line-based input with other Scanner parsing methods, consistent with the stated scope.
- Psychology applies concepts to scenarios and asks about evidence, statistics, operational definitions, causation, and research safeguards. Vignettes are not personal diagnoses.
- English Language follows the nine-unit progression of recurring rhetorical situation, claims/evidence, reasoning/organization, and style skills. Units do not have invented official content-topic names. All writing and source sets are original.
- Computer Science Principles follows the five big ideas. Code uses the exam reference sheet’s pseudocode: ← for assignment, lists that start at index 1, DISPLAY, REPEAT UNTIL, FOR EACH, and / as ordinary division. Big Idea 3 spans four map areas, reflecting its exam weighting.
- Statistics follows the nine units, with a tenth map area of mixed review tagged to its official units. Answers use AP conventions: hypotheses about parameters, conclusions in context, and confidence statements about the method.
- History questions emphasize context, cause, comparison, continuity/change, sourcing, and evidence. Original explanatory summaries are not represented as primary-source quotations. Constructed numerical examples are labeled, rather than presented as actual historical measurements.

## Unit bosses and compatibility

`courseFrameworks.ts` separates official AP units from the ten illustrated game areas. Each official unit has a designated final boss that samples that unit’s introduced material. Courses with fewer units group areas or place extra material under Review. Psychology’s saved area IDs are traversed in the current five-unit sequence. All 180 saved level IDs per course remain intact; earned rewards and completed levels are not reset.

## Answer order and validation

Choices shuffle once per attempt using the navigation attempt key. Each four-question block of four-choice items uses all four correct-answer positions; distractors also shuffle. Replaying creates a fresh arrangement. Hints, retries, rerenders, and appended review questions preserve existing order. Grading uses stable choice IDs, not visible letters.

Automated checks cover every level’s playable question count, all official unit bosses, source/unit tags, distinct choice text, duplicate-item removal, choice-order balance, immutable bank data, and independently calculated examples in biology, chemistry, calculus, and Java tracing. These checks do not certify academic completeness or calibrate difficulty. A qualified subject review and broader stimulus/FRQ coverage remain necessary before marketing this as comprehensive AP exam preparation. The starting check is a practice-route suggestion, not an AP-score prediction.
