import React from 'react';
import { BossSprite } from './BossSprite';
import { Arena, type ArenaMove } from './Arena';
import { bossForNode } from '@/data/bosses';
import { bossBattle } from '@/utils/bossBattle';
import type { Countdown } from '@/hooks/useCountdown';

/** One answer's blow. `crit` was right and fast; `timeout` means the clock ran out first. */
export interface DuelMove { id: number; correct: boolean; damage: number; finisher?: boolean; crit?: boolean; timeout?: boolean }

/**
 * A timed, question-driven boss battle. Every question has a clock; answer
 * before it runs out or the boss strikes first. Right answers hit, fast right
 * answers hit harder, and a passing set charges the final strike.
 */
export function BossEncounter({ nodeId, correct, attempted, total, damageTotal = total, crits = 0, combo = 0, move = null, last = null, finalStrike = false, clock = null, clockLive = false, onMoveComplete }: {
  nodeId: string; correct: number; attempted: number; total: number;
  damageTotal?: number; crits?: number; combo?: number;
  /** `last` is this question's blow, kept for the message after the animation ends. */
  move?: DuelMove | null; last?: DuelMove | null; finalStrike?: boolean;
  clock?: Countdown | null; clockLive?: boolean; onMoveComplete?: () => void;
}) {
  const boss = bossForNode(nodeId)!;
  const battle = bossBattle(correct, attempted, total, finalStrike, damageTotal, crits);
  const danger = Boolean(clock && clockLive && clock.left <= Math.max(5, Math.ceil(clock.total * 0.3)));
  const arenaMove: ArenaMove | null = move ? {
    id: move.id,
    kind: move.finisher ? 'finisher' : move.correct ? move.crit ? 'crit' : 'hit' : move.timeout ? 'timeout' : 'hurt',
    amount: move.finisher ? 'K.O.' : move.correct ? (move.crit ? 'CRIT −' : '−') + move.damage : '−' + move.damage,
  } : null;
  const blow = move ?? last;
  const message = blow?.finisher ? 'Final strike!'
    : battle.defeated ? `${boss.name} defeated.`
    : blow ? blow.correct ? (blow.crit ? `Critical hit! −${blow.damage}` : `Hit! −${blow.damage}`)
      : blow.timeout ? `Too slow! −${blow.damage}` : `Ouch! −${blow.damage}`
    : battle.canFinish ? 'Final strike ready!'
    : danger ? 'Hurry!'
    : correct >= battle.target ? 'Strike charged'
    : 'Answer fast to hit harder';
  return <Arena
    backdrop={boss.kind}
    rival={(size) => <BossSprite nodeId={nodeId} size={size} />}
    rivalName={boss.name}
    rivalHealth={battle.bossHealth / 100}
    rivalLabel={`${battle.bossHealth} HP`}
    playerHealth={battle.playerHealth / 100}
    playerLabel={`You · ${battle.playerHealth} HP`}
    phase={move?.finisher ? 'FINISHER' : battle.defeated ? 'VICTORY' : combo >= 2 ? 'COMBO' : 'BOSS DUEL'}
    headline={battle.defeated && !move?.finisher ? 'Cleared' : combo >= 2 ? '×' + combo : correct >= battle.target ? 'Ready' : `${correct} / ${battle.target}`}
    detail={battle.defeated && !move?.finisher ? 'well played' : combo >= 2 ? 'in a row' : 'final strike'}
    message={message}
    move={arenaMove}
    onMoveComplete={onMoveComplete}
    clock={battle.defeated || battle.complete ? null : clock}
    clockLive={clockLive}
    defeated={battle.defeated}
  />;
}
