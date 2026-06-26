// Problem generation + scoring, ported from the prototype's Component logic.
import { OPERATIONS, type OperationKey } from '@/theme';

export type Mode = 'faceoff' | 'practice';

export interface Problem {
  a: number;
  b: number;
  answer: number;
  sym: string;
}

/** Fisher–Yates shuffle, returning a new array. */
function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Every distinct fact for an operation, as an *ordered* set — `10 + 3` and
 * `3 + 10` are separate entries, so a shuffled pass covers both. Faceoff spans
 * facts 1–12; practice is anchored to the chosen number `n`. Subtraction and
 * division only ever yield whole, non-negative answers.
 */
function factSpace(key: OperationKey, mode: Mode, n: number): Problem[] {
  const sym = OPERATIONS[key].sym;
  const facts: Problem[] = [];

  if (mode === 'practice') {
    if (key === 'add' || key === 'mul' || key === 'div') {
      for (let x = 1; x <= 12; x++) {
        if (key === 'add') facts.push({ a: n, b: x, answer: n + x, sym });
        else if (key === 'mul') facts.push({ a: n, b: x, answer: n * x, sym });
        else facts.push({ a: n * x, b: n, answer: x, sym });
      }
    } else {
      // Subtraction by `n`: answers 0–12 (a = n + answer, b = n).
      for (let answer = 0; answer <= 12; answer++) facts.push({ a: n + answer, b: n, answer, sym });
    }
    return facts;
  }

  if (key === 'add' || key === 'mul') {
    for (let a = 1; a <= 12; a++)
      for (let b = 1; b <= 12; b++)
        facts.push({ a, b, answer: key === 'add' ? a + b : a * b, sym });
  } else if (key === 'sub') {
    // a − b with 2 ≤ a ≤ 12 and 0 ≤ b ≤ a, so the answer stays non-negative.
    for (let a = 2; a <= 12; a++)
      for (let b = 0; b <= a; b++)
        facts.push({ a, b, answer: a - b, sym });
  } else {
    // Division: divisor b (1–12) × quotient q (1–12) → a ÷ b = q, always whole.
    for (let b = 1; b <= 12; b++)
      for (let q = 1; q <= 12; q++)
        facts.push({ a: b * q, b, answer: q, sym });
  }
  return facts;
}

/**
 * A freshly shuffled "bag" of every fact for this operation/mode. Drawing
 * sequentially (see `drawNext`) shows each fact once before any repeats, which
 * is what makes a round feel varied instead of clustering the same handful.
 */
export function buildDeck(key: OperationKey, mode: Mode, n: number): Problem[] {
  return shuffle(factSpace(key, mode, n));
}

/**
 * The next card from the bag. When the bag is exhausted it reshuffles, taking
 * care that the first card of the new pass isn't the one just shown (no repeat
 * across the seam).
 */
export function drawNext(
  deck: Problem[],
  pos: number,
): { problem: Problem; deck: Problem[]; pos: number } {
  if (pos < deck.length) {
    return { problem: deck[pos], deck, pos: pos + 1 };
  }
  const last = deck[deck.length - 1];
  const reshuffled = shuffle(deck);
  if (reshuffled.length > 1 && reshuffled[0].a === last.a && reshuffled[0].b === last.b) {
    const j = 1 + Math.floor(Math.random() * (reshuffled.length - 1));
    [reshuffled[0], reshuffled[j]] = [reshuffled[j], reshuffled[0]];
  }
  return { problem: reshuffled[0], deck: reshuffled, pos: 1 };
}

/** Label for a practice run, e.g. "Adding 8", "7× table", "Dividing by 6". */
export function practiceLabel(key: OperationKey, n: number): string {
  if (key === 'add') return `Adding ${n}`;
  if (key === 'sub') return `Subtracting ${n}`;
  if (key === 'mul') return `${n}× table`;
  return `Dividing by ${n}`;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const ROUND_SECONDS = 120;
