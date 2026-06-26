import { create } from 'zustand';
import { buildDeck, drawNext, ROUND_SECONDS, type Mode, type Problem } from '@/game/facts';
import type { OperationKey } from '@/theme';

type Status = 'idle' | 'running' | 'done';

interface RoundState {
  status: Status;
  operation: OperationKey;
  mode: Mode;
  practiceNumber: number; // anchor for practice; ignored for faceoff

  deck: Problem[]; // shuffled bag of facts; drawn without replacement
  pos: number; // next index into `deck`

  a: number;
  b: number;
  answer: number;
  sym: string;
  input: string;
  wrong: boolean; // drives the shake animation
  correct: boolean; // pause on the right answer for a beat of celebration

  score: number;
  wrongCount: number;
  problemMisses: number; // wrong answers on the *current* fact; gates the Skip button
  streak: number;

  timeLeft: number;
  roundLen: number;

  start: (operation: OperationKey, mode: Mode, practiceNumber?: number) => void;
  press: (digit: string) => void;
  del: () => void;
  clear: () => void;
  skip: () => void;
  advance: () => void;
  tick: () => void;
  clearWrong: () => void;
}

export const useRound = create<RoundState>((set, get) => ({
  status: 'idle',
  operation: 'add',
  mode: 'faceoff',
  practiceNumber: 7,
  deck: [],
  pos: 0,
  a: 0,
  b: 0,
  answer: 0,
  sym: '+',
  input: '',
  wrong: false,
  correct: false,
  score: 0,
  wrongCount: 0,
  problemMisses: 0,
  streak: 0,
  timeLeft: ROUND_SECONDS,
  roundLen: ROUND_SECONDS,

  start: (operation, mode, practiceNumber) => {
    const n = practiceNumber ?? get().practiceNumber;
    const { problem: p, deck, pos } = drawNext(buildDeck(operation, mode, n), 0);
    set({
      status: 'running',
      operation,
      mode,
      practiceNumber: n,
      deck,
      pos,
      a: p.a,
      b: p.b,
      answer: p.answer,
      sym: p.sym,
      input: '',
      wrong: false,
      correct: false,
      score: 0,
      wrongCount: 0,
      problemMisses: 0,
      streak: 0,
      timeLeft: ROUND_SECONDS,
      roundLen: ROUND_SECONDS,
    });
  },

  press: (digit) => {
    const s = get();
    if (s.status !== 'running' || s.correct) return;
    const next = s.input + digit;

    if (Number(next) === s.answer) {
      // Keep the correct answer on screen for a beat of celebration;
      // `advance` swaps in the next problem once the moment passes.
      set({
        input: next,
        score: s.score + 1,
        streak: s.streak + 1,
        wrong: false,
        correct: true,
      });
      return;
    }

    if (next.length >= String(s.answer).length) {
      set({
        input: '',
        streak: 0,
        wrong: true,
        wrongCount: s.wrongCount + 1,
        problemMisses: s.problemMisses + 1,
      });
      return;
    }

    set({ input: next, wrong: false });
  },

  del: () => {
    const s = get();
    if (s.status !== 'running' || s.correct) return;
    set({ input: s.input.slice(0, -1) });
  },

  clear: () => {
    const s = get();
    if (s.status !== 'running' || s.correct) return;
    set({ input: '' });
  },

  skip: () => {
    const s = get();
    if (s.status !== 'running' || s.correct) return;
    // A skip is a miss: reset the streak and record it like a wrong answer.
    const current: Problem = { a: s.a, b: s.b, answer: s.answer, sym: s.sym };
    // Move to a fresh problem first (this also handles a reshuffle at the seam),
    // then drop the dodged fact back into the still-undrawn part of the bag so
    // it comes back around — you can't skip-fish your way to only easy problems.
    const { problem: p, deck: drawn, pos } = drawNext(s.deck, s.pos);
    const deck = drawn.slice();
    const insertAt = pos + Math.floor(Math.random() * (deck.length - pos + 1));
    deck.splice(insertAt, 0, current);
    set({
      input: '',
      deck,
      pos,
      a: p.a,
      b: p.b,
      answer: p.answer,
      sym: p.sym,
      streak: 0,
      wrongCount: s.wrongCount + 1,
      problemMisses: 0,
      wrong: false,
      correct: false,
    });
  },

  advance: () => {
    const s = get();
    if (s.status !== 'running') return;
    const { problem: p, deck, pos } = drawNext(s.deck, s.pos);
    set({ input: '', deck, pos, a: p.a, b: p.b, answer: p.answer, sym: p.sym, problemMisses: 0, correct: false });
  },

  tick: () => {
    const s = get();
    if (s.status !== 'running') return;
    if (s.timeLeft <= 1) {
      set({ timeLeft: 0, status: 'done' });
      return;
    }
    set({ timeLeft: s.timeLeft - 1 });
  },

  clearWrong: () => set({ wrong: false }),
}));
