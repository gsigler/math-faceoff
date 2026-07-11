import type { OperationKey } from '@/theme';
import type { Mode } from '@/game/facts';

export interface Family {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface FamilyLookup extends Family {
  members: Member[];
}

export interface Player {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}

export interface WeeklyRow {
  player_id: string;
  name: string;
  points: number;
}

export interface WeeklyOpRow extends WeeklyRow {
  operation: OperationKey;
}

export interface OperationRow {
  player_id: string;
  name: string;
  best: number;
}

export interface RecordRow {
  operation: OperationKey;
  best: number;
  holder_name: string;
}

export interface FinishResult {
  is_record: boolean;
  is_personal_best: boolean;
  my_rank: number | null;
  family_best: number;
  personal_best: number;
}

export interface AttemptRow {
  id: string;
  score: number;
  wrong_count: number;
  duration_seconds: number;
  created_at: string;
}

export interface MyOperationBest {
  operation: OperationKey;
  best: number;
}

export interface FinishRoundInput {
  operation: OperationKey;
  mode: Mode;
  score: number;
  wrongCount: number;
  practiceNumber?: number | null;
  durationSeconds: number;
  localDate: string;
  localHour: number;
}

export type StreakDayStatus = 'played' | 'frozen' | 'missed' | 'future';

export interface StreakDay {
  date: string;
  status: StreakDayStatus;
}

export interface StreakInfo {
  current_streak: number;
  freezes_remaining: number;
  last_play_date: string | null;
  calendar: StreakDay[];
}

export interface BadgeProgress {
  earned: boolean;
  progress?: number;
}

export interface Badges {
  perfect_drill: boolean;
  streak_7: BadgeProgress;
  streak_30: BadgeProgress;
  family_record: boolean;
  all_4_ops: boolean;
  solved_100: BadgeProgress;
  early_bird: boolean;
  family_champion: boolean;
  night_owl: boolean;
  sharpshooter: boolean;
  marathoner: boolean;
  all_rounder: boolean;
}
