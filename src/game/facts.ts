// Problem generation + scoring, ported from the prototype's Component logic.
import { OPERATIONS, type OperationKey } from '@/theme';

export type Mode = 'faceoff' | 'practice';

export interface Problem {
  a: number;
  b: number;
  answer: number;
  sym: string;
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Faceoff: random facts 1–12. Practice: anchored to the chosen number `n`.
 * Subtraction/division are generated to guarantee whole, non-negative answers.
 */
export function makeProblem(key: OperationKey, mode: Mode, n: number): Problem {
  let a: number, b: number, answer: number;

  if (mode === 'practice') {
    if (key === 'add') {
      a = n; b = rnd(1, 12); answer = a + b;
    } else if (key === 'sub') {
      answer = rnd(0, 12); a = n + answer; b = n;
    } else if (key === 'mul') {
      a = n; b = rnd(1, 12); answer = a * b;
    } else {
      const q = rnd(1, 12); a = n * q; b = n; answer = q;
    }
  } else {
    if (key === 'add') {
      a = rnd(1, 12); b = rnd(1, 12); answer = a + b;
    } else if (key === 'sub') {
      a = rnd(2, 12); b = rnd(1, a); answer = a - b;
    } else if (key === 'mul') {
      a = rnd(1, 12); b = rnd(1, 12); answer = a * b;
    } else {
      b = rnd(1, 12); const q = rnd(1, 12); a = b * q; answer = q;
    }
  }

  return { a, b, answer, sym: OPERATIONS[key].sym };
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
