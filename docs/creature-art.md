# Prochoro creatures

Updated 16 October 2026. The illustrated field guide has 12 pets and 60 distinct boss rivals. Each uses hollow monochrome line art with transparent interiors, so the page background shows through the character rather than becoming a gray or white silhouette.

## Pets

Ellie, Buddy, Penny, Benny, Stella, Bruno, Toby, Daisy, Oakley, Remy, Wally and Leo are twelve distinct drawings on `src/assets/characters/prochoro/companions.png`. Their existing saved IDs, unlocks, equipment and abilities remain stable. Names changed; earned progress did not.

`CompanionSprite` uses explicit bounds in `src/data/companionFrames.json`, preserving full accessories and aspect ratio. The same art appears in the HUD, profile, roster and session ability controls.

## Boss rivals

Ten atlases under `src/assets/characters/prochoro/bosses/` contain six different portraits each. Shore, library, lab, field, workshop, ocean, discovery, garden, insect and summit rivals use grumpy expressions and study accessories. Each course path contains all 60 bosses; the courses share the art catalog. There are not 480 different character drawings.

`BossSprite` clips explicit, non-overlapping bounds from `src/data/bossFrames.json`. Node IDs remain unchanged. The same portrait follows a boss through its map stop, details, encounter, rematch, result and field guide. Atlas bounds are measured without altering pixels. Artwork was generated with the built-in image tool; the latest fill/gutter correction prompts are in [prochoro-art-prompts.json](prochoro-art-prompts.json).

## Platypus expressions

Three transparent sheets hold 27 separate expressions and activities. Correct answers, missed answers, streak changes, wins and losses choose an appropriate drawing. Expressions change with the event; characters do not float up and down at rest.

## Duel behavior

Questions remain the source of progress. Checking a correct answer immediately damages the boss; a missed answer triggers a counterattack and reduces player health. A brief horizontal hit/recoil reacts to the result. The glass arena stays visible while questions and explanations scroll below it. Completing the question set with at least 60% correct unlocks a final strike against any remaining boss HP. Repeated presses during a move are ignored. Reduce Motion skips the transform and resolves immediately.

A disposable local play-through verified one miss, six correct answers, a single +60 XP reward and advancement to the next stop. This is browser acceptance with in-memory sample data; native and authenticated cross-device acceptance remain separate release checks. A failed 0/7 run, Benny retry and Remy extra review round were also checked. Review rounds preserve previously dealt damage and cannot claim victory before completion.
