import { BOSS_FAMILIES } from '@/data/bosses';
import type { SkylineKind } from '@/data/tracks';

/**
 * The endless climb: a card battler you play by answering AP questions.
 *
 * Every new card costs one question: answer right and you choose from three
 * rivals; miss and one of them is dealt to you. Build a deck of rival cards
 * (each has Recall, Logic and Insight, 0–20), then climb towers of eight
 * floors. Each floor you choose a room: a battle, a tougher elite, a rest, a
 * shop or a mystery, and the top floor is a boss.
 *
 * A battle is rounds of one card against one, with no questions: you pick
 * the stat both cards compare while the rival's card is still face down. The
 * higher number wins, and the gap is the damage, multiplied by how many
 * rounds that side has won in a row.
 * Your health carries from battle to battle; when it runs out, the climb
 * ends. Towers never run out, and each is harder than the last.
 *
 * Every rule is a pure function of the run, including the randomness, which
 * comes from the run's seed, so a run can be replayed and tested exactly.
 */

export type Stat = 'recall' | 'logic' | 'insight';
export const STATS: Stat[] = ['recall', 'logic', 'insight'];
export const STAT_NAME: Record<Stat, string> = { recall: 'Recall', logic: 'Logic', insight: 'Insight' };

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';
export interface Card { uid: string; kind: SkylineKind; tier: number; name: string; rarity: Rarity; recall: number; logic: number; insight: number }

export type CharmId = 'flashcards' | 'highlighter' | 'graph-paper' | 'margin-notes' | 'study-group' | 'eraser';
export const CHARMS: Record<CharmId, { name: string; detail: string }> = {
  flashcards: { name: 'Flashcards', detail: 'Heal 8 after every battle you win' },
  highlighter: { name: 'Highlighter', detail: '+2 Recall on every card' },
  'graph-paper': { name: 'Graph paper', detail: '+2 Logic on every card' },
  'margin-notes': { name: 'Margin notes', detail: '+2 Insight on every card' },
  'study-group': { name: 'Study group', detail: 'Your winning streaks count one higher' },
  eraser: { name: 'Eraser', detail: 'The first round you lose in each battle does no damage' },
};
const CHARM_IDS = Object.keys(CHARMS) as CharmId[];

export type RoomKind = 'battle' | 'elite' | 'rest' | 'shop' | 'mystery' | 'boss';

export interface Enemy { name: string; kind: SkylineKind; tier: number; hp: number; maxHp: number; deck: Card[]; room: 'battle' | 'elite' | 'boss' }

export interface RoundOutcome {
  stat: Stat; chosenBy: 'me' | 'them'; mine: number; theirs: number;
  winner: 'me' | 'them' | 'tie'; streak: number; damage: number; erased: boolean;
}

export interface Battle {
  enemy: Enemy; mine: Card; theirs: Card;
  myStreak: number; theirStreak: number; round: number;
  outcome: RoundOutcome | null; erased: boolean;
}

export interface ShopItem { kind: 'card' | 'charm' | 'heal'; card?: Card; charm?: CharmId; price: number; sold: boolean }

export type Phase = 'draft' | 'map' | 'battle' | 'reward' | 'rest' | 'shop' | 'mystery' | 'over';

export interface Run {
  seed: string; tick: number;
  tower: number; floor: number;
  hp: number; maxHp: number; coins: number;
  deck: Card[]; charms: CharmId[];
  phase: Phase;
  /** Room choices for the coming floor. */
  rooms: RoomKind[];
  /** Rooms taken in the current tower, floor by floor. */
  path: RoomKind[];
  /** Cards on offer: the draft, a battle's reward, or a mystery find. */
  offer: Card[];
  /** Charms on offer after a boss. */
  charmOffer: CharmId[];
  shop: ShopItem[];
  mystery: 'good' | 'bad' | null;
  /** 1 while a rest's question is unanswered, 0 once it is earned. */
  restLeft: number;
  /** Coins the last battle paid. */
  earned: number;
  battle: Battle | null;
  record: { battles: number; bosses: number };
}

export const FLOORS = 8;
export const RIVAL_STREAK_CAP = 3;
export const DRAFT_SIZE = 5;
export const START_HP = 100;
const REMOVE_PRICE = 50;
const PRICE: Record<Rarity, number> = { common: 30, uncommon: 50, rare: 80, epic: 120 };

/* ---------- randomness ---------- */

function hash(text: string): number {
  let h = 2166136261;
  for (const character of text) h = Math.imul(h ^ character.charCodeAt(0), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
  return h >>> 0;
}
/** A number in [0, 1) fixed by the run's seed, its tick and a label. */
const roll = (run: Pick<Run, 'seed' | 'tick'>, label: string) => hash(`${run.seed}:${run.tick}:${label}`) / 4294967296;
const pick = <T,>(items: readonly T[], value: number): T => items[Math.min(items.length - 1, Math.floor(value * items.length))];

/* ---------- cards ---------- */

const KINDS = Object.keys(BOSS_FAMILIES) as SkylineKind[];
/** What each family is good at, from its lore: [best, next] or null for all-rounders. */
const LEAN: Record<SkylineKind, [Stat, Stat] | null> = {
  waves: ['recall', 'logic'], towers: ['recall', 'insight'], chimneys: ['insight', 'logic'], mesa: ['logic', 'insight'],
  gears: ['logic', 'recall'], islands: null, ridge: ['logic', 'insight'], reeds: ['insight', 'recall'],
  pylons: ['insight', 'logic'], peak: null,
};
const BUDGET = [0, 24, 28, 32, 36, 41, 47];
export const rarityOf = (tier: number): Rarity => tier >= 6 ? 'epic' : tier === 5 ? 'rare' : tier >= 3 ? 'uncommon' : 'common';
const clamp = (value: number) => Math.max(0, Math.min(20, Math.round(value)));

/** The card for a rival: stats follow its family's lean and grow with its rank. */
export function cardFor(kind: SkylineKind, tier: number, uid: string, bonus = 0): Card {
  const level = Math.max(1, Math.min(6, Math.floor(tier)));
  const budget = BUDGET[level];
  const lean = LEAN[kind];
  const order: Stat[] = lean ? [lean[0], lean[1], STATS.find((stat) => !lean.includes(stat))!] : STATS;
  const shares = lean ? [0.44, 0.34, 0.22] : [0.34, 0.33, 0.33];
  const stats = { recall: 0, logic: 0, insight: 0 } as Record<Stat, number>;
  order.forEach((stat, index) => { stats[stat] = budget * shares[index]; });
  // A little variety between the six rivals of one family.
  const nudge = (hash(`${kind}-${level}`) % 3) - 1;
  stats[order[1]] += nudge; stats[order[2]] -= nudge;
  return {
    uid, kind, tier: level, name: BOSS_FAMILIES[kind].names[level - 1], rarity: rarityOf(level),
    recall: clamp(stats.recall + bonus), logic: clamp(stats.logic + bonus), insight: clamp(stats.insight + bonus),
  };
}

/** A random card of a rank between `low` and `high`. */
function randomCard(run: Run, label: string, low: number, high: number, bonus = 0): Card {
  const kind = pick(KINDS, roll(run, label + ':kind'));
  const tier = low + Math.floor(roll(run, label + ':tier') * (high - low + 1));
  return cardFor(kind, tier, `${run.seed}-${run.tick}-${label}`, bonus);
}

/** Three different rivals to choose between. */
function offerOf(run: Run, label: string, low: number, high: number): Card[] {
  const offer: Card[] = [];
  for (let attempt = 0; offer.length < 3 && attempt < 30; attempt += 1) {
    const card = randomCard(run, `${label}${attempt}`, low, high);
    if (!offer.some((item) => item.kind === card.kind && item.tier === card.tier)) offer.push(card);
  }
  return offer;
}

/** A card's stat in battle, with your charms counted. */
export function statOf(card: Card, stat: Stat, charms: readonly CharmId[] = []): number {
  const bonus = (stat === 'recall' && charms.includes('highlighter')) || (stat === 'logic' && charms.includes('graph-paper')) || (stat === 'insight' && charms.includes('margin-notes')) ? 2 : 0;
  return Math.min(20, card[stat] + bonus);
}
/** A rival choosing for itself always takes its best stat. */
export const bestStat = (card: Card): Stat => STATS.reduce((best, stat) => (card[stat] > card[best] ? stat : best), STATS[0]);

/* ---------- the run ---------- */

export function newRun(seed: string): Run {
  const run: Run = {
    seed, tick: 0, tower: 1, floor: 1, hp: START_HP, maxHp: START_HP, coins: 0, deck: [], charms: [],
    phase: 'draft', rooms: [], path: [], offer: [], charmOffer: [], shop: [], mystery: null, restLeft: 0, earned: 0, battle: null,
    record: { battles: 0, bosses: 0 },
  };
  return { ...run, offer: offerOf(run, 'draft', 1, 3) };
}

/** Choices for the coming floor: the top floor is always the boss. */
export function roomsFor(run: Run): RoomKind[] {
  if (run.floor >= FLOORS) return ['boss'];
  const pool: RoomKind[] = ['battle', 'battle', 'battle', 'mystery'];
  if (run.floor >= 2) pool.push('rest', 'shop');
  if (run.floor >= 3) pool.push('elite', 'elite');
  const rooms: RoomKind[] = [];
  for (let attempt = 0; rooms.length < 3 && attempt < 24; attempt += 1) {
    const room = pick(pool, roll(run, `room${attempt}`));
    if (!rooms.includes(room)) rooms.push(room);
  }
  // Always somewhere to fight: battles are how a climb is won.
  if (!rooms.includes('battle') && !rooms.includes('elite')) rooms[rooms.length - 1] = 'battle';
  return rooms;
}

/** After a wrong answer: the offered card you are dealt, chosen by the seed. */
export function dealtCard(run: Run): string | null {
  return run.offer.length ? pick(run.offer, roll(run, 'dealt')).uid : null;
}

/** Add an offered card to the deck. Finishing the draft opens the tower. */
export function takeCard(run: Run, uid: string): Run {
  const card = run.offer.find((item) => item.uid === uid);
  if (!card || !['draft', 'reward', 'mystery'].includes(run.phase)) return run;
  const next = { ...run, deck: [...run.deck, card], offer: [], tick: run.tick + 1 };
  if (run.phase === 'draft') {
    if (next.deck.length >= DRAFT_SIZE) return toMap(next);
    return { ...next, offer: offerOf(next, 'draft', 1, 3) };
  }
  return run.phase === 'reward' && run.charmOffer.length ? next : advance(next);
}

function toMap(run: Run): Run {
  const ready = { ...run, phase: 'map' as Phase, battle: null, mystery: null, offer: [], charmOffer: [], shop: [], restLeft: 0 };
  return { ...ready, rooms: roomsFor(ready) };
}

/** Finish a floor and move up; past the boss is the next, harder tower. */
export function advance(run: Run): Run {
  const top = run.floor >= FLOORS;
  return toMap({ ...run, tick: run.tick + 1, floor: top ? 1 : run.floor + 1, tower: top ? run.tower + 1 : run.tower, path: top ? [] : run.path });
}

export function chooseRoom(run: Run, room: RoomKind): Run {
  if (run.phase !== 'map' || !run.rooms.includes(room)) return run;
  const entered = { ...run, path: [...run.path, room], tick: run.tick + 1 };
  if (room === 'battle' || room === 'elite' || room === 'boss') return startBattle(entered, room);
  if (room === 'rest') return { ...entered, phase: 'rest', restLeft: 1 };
  if (room === 'shop') return { ...entered, phase: 'shop', shop: stockFor(entered) };
  const lucky = roll(entered, 'mystery') < 0.55;
  return {
    ...entered, phase: 'mystery', mystery: lucky ? 'good' : 'bad',
    offer: [lucky ? randomCard(entered, 'find', 4, 5) : randomCard(entered, 'dud', 1, 1, -3)],
  };
}

/* ---------- battles ---------- */

/** Who you meet: everyday rivals, a family's best as elites, its head as the boss. */
export function enemyFor(run: Run, room: 'battle' | 'elite' | 'boss'): Enemy {
  const kind = room === 'boss' ? KINDS[(run.tower - 1) % KINDS.length] : pick(KINDS, roll(run, 'foe'));
  const bonus = Math.min(6, run.tower - 1);
  // The first boss's crew is a step gentler; from the second tower they are the best there is.
  const ranks = room === 'boss' ? (run.tower === 1 ? [3, 5] : run.tower === 2 ? [4, 6] : [5, 6]) : room === 'elite' ? [3, 5] : [1, 3];
  const size = room === 'boss' ? 4 : 3;
  const deck = Array.from({ length: size }, (_, index) => {
    const tier = ranks[0] + Math.floor(roll(run, `foe${index}`) * (ranks[1] - ranks[0] + 1));
    const card = cardFor(pick(KINDS, roll(run, `foeKind${index}`)), tier, `${run.seed}-${run.tick}-foe${index}`, bonus);
    // Each enemy's cards lean the way its family does.
    return index === 0 ? cardFor(kind, tier, card.uid, bonus) : card;
  });
  const leader = room === 'boss' ? 6 : room === 'elite' ? 4 + Math.floor(roll(run, 'lead') * 2) : 1 + Math.floor(roll(run, 'lead') * 3);
  const hp = room === 'boss'
    ? [70, 100, 150][run.tower - 1] ?? 150 + 50 * (run.tower - 3)
    : (room === 'elite' ? 45 : 25) + Math.floor(roll(run, 'hp') * 16) + 10 * (run.tower - 1);
  return { name: BOSS_FAMILIES[kind].names[leader - 1], kind, tier: leader, hp, maxHp: hp, deck, room };
}

function startBattle(run: Run, room: 'battle' | 'elite' | 'boss'): Run {
  const enemy = enemyFor(run, room);
  const battle: Battle = { enemy, mine: run.deck[0], theirs: enemy.deck[0], myStreak: 0, theirStreak: 0, round: 0, outcome: null, erased: false };
  return deal({ ...run, phase: 'battle', battle });
}

/** Draw the next round's two cards: one of yours, one of theirs, face down. */
export function deal(run: Run): Run {
  if (!run.battle) return run;
  const round = run.battle.round + 1;
  const mine = pick(run.deck, roll(run, `mine${round}`));
  const theirs = pick(run.battle.enemy.deck, roll(run, `theirs${round}`));
  return { ...run, tick: run.tick + 1, battle: { ...run.battle, round, mine, theirs, outcome: null } };
}

/**
 * Play the round on one stat. `chosenBy` is who picked it: you, after a
 * right answer, or the rival, after a wrong one.
 */
export function fight(run: Run, stat: Stat, chosenBy: 'me' | 'them'): Run {
  const battle = run.battle;
  if (run.phase !== 'battle' || !battle || battle.outcome) return run;
  const mine = statOf(battle.mine, stat, run.charms);
  const theirs = battle.theirs[stat];
  const winner = mine > theirs ? 'me' : mine < theirs ? 'them' : 'tie';
  const myStreak = winner === 'me' ? battle.myStreak + 1 : 0;
  const theirStreak = winner === 'them' ? battle.theirStreak + 1 : 0;
  const boost = run.charms.includes('study-group') ? 1 : 0;
  // Your streaks can run as long as your answers do; a rival's stops at ×3,
  // so a run of misses hurts without wiping out a climb in one go.
  const streak = winner === 'me' ? myStreak + boost : winner === 'them' ? Math.min(RIVAL_STREAK_CAP, theirStreak) : 0;
  const erased = winner === 'them' && run.charms.includes('eraser') && !battle.erased;
  const damage = winner === 'tie' || erased ? 0 : Math.abs(mine - theirs) * streak;
  const enemyHp = winner === 'me' ? Math.max(0, battle.enemy.hp - damage) : battle.enemy.hp;
  const hp = winner === 'them' ? Math.max(0, run.hp - damage) : run.hp;
  const outcome: RoundOutcome = { stat, chosenBy, mine, theirs, winner, streak, damage, erased };
  const fought = { ...run, hp, battle: { ...battle, myStreak, theirStreak, erased: battle.erased || erased, outcome, enemy: { ...battle.enemy, hp: enemyHp } } };
  if (hp <= 0) return { ...fought, phase: 'over' };
  if (enemyHp <= 0) return win(fought);
  return fought;
}

function win(run: Run): Run {
  const room = run.battle!.enemy.room;
  const earned = (room === 'boss' ? 75 : room === 'elite' ? 35 : 20) + 5 * (run.tower - 1);
  const heal = run.charms.includes('flashcards') ? 8 : 0;
  const ranks: [number, number] = room === 'boss' ? [4, 6] : room === 'elite' ? [3, 5] : [1, 4];
  const charmOffer = room === 'boss' ? CHARM_IDS.filter((id) => !run.charms.includes(id)).sort((a, b) => hash(run.seed + run.tick + a) - hash(run.seed + run.tick + b)).slice(0, 2) : [];
  return {
    ...run, phase: 'reward', coins: run.coins + earned, earned, hp: Math.min(run.maxHp, run.hp + heal),
    offer: offerOf(run, 'loot', ranks[0], ranks[1]), charmOffer,
    record: { battles: run.record.battles + 1, bosses: run.record.bosses + (room === 'boss' ? 1 : 0) },
  };
}

export function takeCharm(run: Run, id: CharmId): Run {
  if (run.phase !== 'reward' || !run.charmOffer.includes(id)) return run;
  const next = { ...run, charms: [...run.charms, id], charmOffer: [] };
  return next.offer.length ? next : advance(next);
}

/** Leave a reward behind; the climb goes on. */
export function skipReward(run: Run): Run {
  if (run.phase !== 'reward' && run.phase !== 'mystery') return run;
  if (run.phase === 'reward' && run.charmOffer.length) return { ...run, charmOffer: [] };
  return advance({ ...run, offer: [] });
}

/* ---------- rest, shop, mystery ---------- */

/** A rest's one question: right earns the choice to heal or train; a miss still heals a little. */
export const REST_MISS_HEAL = 10;
export function restAnswer(run: Run, correct: boolean): Run {
  if (run.phase !== 'rest' || run.restLeft <= 0) return run;
  if (correct) return { ...run, restLeft: 0 };
  return advance({ ...run, hp: Math.min(run.maxHp, run.hp + REST_MISS_HEAL) });
}
export function restHeal(run: Run): Run {
  if (run.phase !== 'rest' || run.restLeft > 0) return run;
  return advance({ ...run, hp: Math.min(run.maxHp, run.hp + 25) });
}
/** +2 to every stat of one card. */
export function restTrain(run: Run, uid: string): Run {
  if (run.phase !== 'rest' || run.restLeft > 0 || !run.deck.some((card) => card.uid === uid)) return run;
  return advance({ ...run, deck: run.deck.map((card) => card.uid === uid ? { ...card, recall: clamp(card.recall + 2), logic: clamp(card.logic + 2), insight: clamp(card.insight + 2) } : card) });
}

function stockFor(run: Run): ShopItem[] {
  const cards = [0, 1, 2, 3].map((index) => randomCard(run, `shop${index}`, 2, 5)).map((card) => ({ kind: 'card' as const, card, price: PRICE[card.rarity], sold: false }));
  const free = CHARM_IDS.filter((id) => !run.charms.includes(id));
  const charm = free.length ? [{ kind: 'charm' as const, charm: pick(free, roll(run, 'shopCharm')), price: 100, sold: false }] : [];
  return [...cards, ...charm, { kind: 'heal', price: 40, sold: false }];
}

export function buy(run: Run, index: number): Run {
  const item = run.shop[index];
  if (run.phase !== 'shop' || !item || item.sold || run.coins < item.price) return run;
  const shop = run.shop.map((entry, i) => i === index ? { ...entry, sold: true } : entry);
  const paid = { ...run, coins: run.coins - item.price, shop };
  if (item.kind === 'card' && item.card) return { ...paid, deck: [...paid.deck, item.card] };
  if (item.kind === 'charm' && item.charm) return { ...paid, charms: [...paid.charms, item.charm] };
  return { ...paid, hp: Math.min(paid.maxHp, paid.hp + 25) };
}

/** Thin the deck so your best cards come up more often. */
export function removeCard(run: Run, uid: string): Run {
  if (run.phase !== 'shop' || run.coins < REMOVE_PRICE || run.deck.length <= 1) return run;
  return { ...run, coins: run.coins - REMOVE_PRICE, deck: run.deck.filter((card) => card.uid !== uid) };
}
export const REMOVE_COST = REMOVE_PRICE;
export const leaveShop = (run: Run): Run => (run.phase === 'shop' ? advance(run) : run);

/** A mystery: good luck offers a strong card or health; bad luck, a weak card or a cut. */
export function mysteryHealth(run: Run): Run {
  if (run.phase !== 'mystery') return run;
  const change = run.mystery === 'good' ? 15 : -10;
  const hp = Math.max(1, Math.min(run.maxHp, run.hp + change));
  return advance({ ...run, hp, offer: [] });
}

/* ---------- scoring ---------- */

/** Floors finished over the whole climb. */
export const floorsClimbed = (run: Pick<Run, 'tower' | 'floor'>): number => (run.tower - 1) * FLOORS + run.floor - 1;
/** Practice XP: a little per right answer, more per floor and per boss. */
export const climbXp = (run: Run, correctAnswers: number): number => correctAnswers * 4 + floorsClimbed(run) * 5 + run.record.bosses * 25;
/** "Tower 2 · Floor 3" for a count of floors climbed. */
export const heightLabel = (climbed: number): string => `Tower ${Math.floor(climbed / FLOORS) + 1} · Floor ${(climbed % FLOORS) + 1}`;

/** A repeatable shuffle: the same seed always deals the same order. */
export function shuffleWith<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = hash(`${seed}:${i}`) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
