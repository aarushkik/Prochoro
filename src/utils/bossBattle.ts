/**
 * Combat mirrors the learning result; it never creates extra rewards or skips questions.
 *
 * `crits` are right answers given fast. Each hits half again as hard, so the
 * boss's bar drops quicker for a student who knows the material, but the boss
 * still cannot fall until the whole set is answered at the passing score.
 */
export function bossBattle(correct: number, attempted: number, total: number, finalStrike = false, damageTotal = total, crits = 0) {
  const count = Math.max(1, Math.floor(Number.isFinite(total) ? total : 1));
  const answered = Math.min(count, Math.max(0, Math.floor(attempted) || 0));
  const hits = Math.min(answered, Math.max(0, Math.floor(correct) || 0));
  const target = Math.ceil(count * 0.6);
  const complete = answered >= count;
  const canFinish = complete && hits >= target;
  // Hit size comes from the original set length, so it never changes mid-fight.
  const hitCount = Math.max(1, Math.floor(Number.isFinite(damageTotal) ? damageTotal : count));
  const fast = Math.min(hits, Math.max(0, Math.floor(crits) || 0));
  const damage = Math.min(100, Math.round((hits + fast * 0.5) * 100 / hitCount));
  return {
    bossHealth: finalStrike && canFinish ? 0 : Math.max(canFinish ? 0 : 1, 100 - damage),
    playerHealth: Math.max(0, 100 - Math.round((answered - hits) * 100 / hitCount)),
    target,
    charge: Math.min(1, hits / target),
    canFinish,
    complete,
    defeated: canFinish && (finalStrike || damage >= 100),
  };
}

export function answerDamage(correctBefore: number, total: number): number {
  return Math.max(0, bossBattle(correctBefore, correctBefore, total).bossHealth
    - bossBattle(correctBefore + 1, correctBefore + 1, total).bossHealth);
}
