import { supabase } from './supabase';
import type {
  Family,
  FamilyLookup,
  FinishResult,
  FinishRoundInput,
  OperationRow,
  Player,
  RecordRow,
  WeeklyOpRow,
} from './types';
import type { OperationKey } from '@/theme';

/** Current device's player (or null if onboarding isn't finished). */
export async function fetchMe(uid: string): Promise<(Player & { family: Family }) | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*, family:families(*)')
    .eq('auth_uid', uid)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { family, ...player } = data as Player & { family: Family };
  return { ...player, family };
}

export async function createFamily(name: string): Promise<Family> {
  const { data, error } = await supabase.rpc('create_family', { p_name: name });
  if (error) throw error;
  return data as Family;
}

export async function lookupFamily(code: string): Promise<FamilyLookup | null> {
  const { data, error } = await supabase.rpc('lookup_family', { p_code: code });
  if (error) throw error;
  return (data as FamilyLookup | null) ?? null;
}

export async function createPlayer(
  familyId: string,
  name: string,
  color: string,
): Promise<Player> {
  const { data, error } = await supabase.rpc('create_player', {
    p_family_id: familyId,
    p_name: name,
    p_color: color,
  });
  if (error) throw error;
  return data as Player;
}

export async function finishRound(input: FinishRoundInput): Promise<FinishResult> {
  const { data, error } = await supabase.rpc('finish_round', {
    p_operation: input.operation,
    p_mode: input.mode,
    p_score: input.score,
    p_wrong_count: input.wrongCount,
    p_practice_number: input.practiceNumber ?? null,
    p_duration_seconds: input.durationSeconds,
  });
  if (error) throw error;
  return data as FinishResult;
}

export async function fetchWeeklyByOperation(familyId: string): Promise<WeeklyOpRow[]> {
  const { data, error } = await supabase
    .from('v_weekly_by_operation')
    .select('operation, player_id, name, color, points')
    .eq('family_id', familyId)
    .order('points', { ascending: false });
  if (error) throw error;
  return (data as WeeklyOpRow[]) ?? [];
}

export async function fetchOperationLeaderboard(
  familyId: string,
  operation: OperationKey,
): Promise<OperationRow[]> {
  const { data, error } = await supabase
    .from('v_operation_leaderboard')
    .select('player_id, name, color, best')
    .eq('family_id', familyId)
    .eq('operation', operation)
    .order('best', { ascending: false });
  if (error) throw error;
  return (data as OperationRow[]) ?? [];
}

export async function fetchAllTimeRecords(familyId: string): Promise<RecordRow[]> {
  const { data, error } = await supabase
    .from('v_all_time_records')
    .select('operation, best, holder_name, holder_color')
    .eq('family_id', familyId);
  if (error) throw error;
  return (data as RecordRow[]) ?? [];
}
