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
  color: string;
}

export interface FamilyLookup extends Family {
  members: Member[];
}

export interface Player {
  id: string;
  family_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WeeklyRow {
  player_id: string;
  name: string;
  color: string;
  points: number;
}

export interface WeeklyOpRow extends WeeklyRow {
  operation: OperationKey;
}

export interface OperationRow {
  player_id: string;
  name: string;
  color: string;
  best: number;
}

export interface RecordRow {
  operation: OperationKey;
  best: number;
  holder_name: string;
  holder_color: string;
}

export interface FinishResult {
  is_record: boolean;
  my_rank: number | null;
  family_best: number;
}

export interface FinishRoundInput {
  operation: OperationKey;
  mode: Mode;
  score: number;
  wrongCount: number;
  practiceNumber?: number | null;
  durationSeconds: number;
}
