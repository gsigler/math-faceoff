import { create } from 'zustand';
import { makeProblem, ROUND_SECONDS, type Mode } from '@/game/facts';
import type { OperationKey } from '@/theme';

type Status = 'idle' | 'running' | 'done';

interface RoundState {
  status: Status;
  operation: OperationKey;
  mode: Mode;
  practiceNumber: number; // anchor for practice; ignored for faceoff

  a: number;
  b: number;
  answer: number;
  sym: string;
  input: string;
  wrong: boolean; // drives the shake animation

  score: number;
  wrongCount: number;
  streak: number;

  timeLeft: number;
  roundLen: number;

  start: (operation: OperationKey, mode: Mode, practiceNumber?: number) => void;
  press: (digit: string) => void;
  del: () => void;
  clear: () => void;
  tick: () => void;
  clearWrong: () => void;
}

export const useRound = create<RoundState>((set, get) => ({
  status: 'idle',
  operation: 'add',
  mode: 'faceoff',
  practiceNumber: 7,
  a: 0,
  b: 0,
  answer: 0,
  sym: '+',
  input: '',
  wrong: false,
  score: 0,
  wrongCount: 0,
  streak: 0,
  timeLeft: ROUND_SECONDS,
  roundLen: ROUND_SECONDS,

  start: (operation, mode, practiceNumber) => {
    const n = practiceNumber ?? get().practiceNumber;
    const p = makeProblem(operation, mode, n);
    set({
      status: 'running',
      operation,
      mode,
      practiceNumber: n,
      a: p.a,
      b: p.b,
      answer: p.answer,
      sym: p.sym,
      input: '',
      wrong: false,
      score: 0,
      wrongCount: 0,
      streak: 0,
      timeLeft: ROUND_SECONDS,
      roundLen: ROUND_SECONDS,
    });
  },

  press: (digit) => {
    const s = get();
    if (s.status !== 'running') return;
    const next = s.input + digit;

    if (Number(next) === s.answer) {
      const p = makeProblem(s.operation, s.mode, s.practiceNumber);
      set({
        input: '',
        score: s.score + 1,
        streak: s.streak + 1,
        a: p.a,
        b: p.b,
        answer: p.answer,
        sym: p.sym,
        wrong: false,
      });
      return;
    }

    if (next.length >= String(s.answer).length) {
      set({ input: '', streak: 0, wrong: true, wrongCount: s.wrongCount + 1 });
      return;
    }

    set({ input: next, wrong: false });
  },

  del: () => {
    const s = get();
    if (s.status !== 'running') return;
    set({ input: s.input.slice(0, -1) });
  },

  clear: () => {
    const s = get();
    if (s.status !== 'running') return;
    set({ input: '' });
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
