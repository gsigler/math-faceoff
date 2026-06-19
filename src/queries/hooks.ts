import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllTimeRecords,
  fetchMe,
  fetchOperationLeaderboard,
  fetchWeeklyByOperation,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import type { OperationKey } from '@/theme';

export const qk = {
  me: (uid: string) => ['me', uid] as const,
  weekly: (familyId: string) => ['weekly', familyId] as const,
  records: (familyId: string) => ['records', familyId] as const,
  opBoard: (familyId: string, op: OperationKey) => ['opBoard', familyId, op] as const,
};

/** Current device's player (+ family), or null when onboarding isn't done. */
export function useMe() {
  const { uid, ready } = useSession();
  return useQuery({
    queryKey: qk.me(uid ?? 'anon'),
    queryFn: () => fetchMe(uid!),
    enabled: ready && !!uid,
  });
}

export function useWeeklyByOperation(familyId?: string) {
  return useQuery({
    queryKey: qk.weekly(familyId ?? 'none'),
    queryFn: () => fetchWeeklyByOperation(familyId!),
    enabled: !!familyId,
  });
}

export function useAllTimeRecords(familyId?: string) {
  return useQuery({
    queryKey: qk.records(familyId ?? 'none'),
    queryFn: () => fetchAllTimeRecords(familyId!),
    enabled: !!familyId,
  });
}

export function useOperationLeaderboard(familyId: string | undefined, op: OperationKey) {
  return useQuery({
    queryKey: qk.opBoard(familyId ?? 'none', op),
    queryFn: () => fetchOperationLeaderboard(familyId!, op),
    enabled: !!familyId,
  });
}

/**
 * Live leaderboard: when any round is inserted for this family, refresh the
 * leaderboard queries. Drives the sub-second cross-device updates.
 */
export function useLeaderboardRealtime(familyId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!familyId) return;
    // Unique channel name per subscription: reusing a topic name returns an
    // already-subscribed channel, and adding `.on()` after subscribe() throws.
    const channel = supabase
      .channel(`rounds:${familyId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rounds', filter: `family_id=eq.${familyId}` },
        () => {
          qc.invalidateQueries({ queryKey: qk.weekly(familyId) });
          qc.invalidateQueries({ queryKey: qk.records(familyId) });
          qc.invalidateQueries({ queryKey: ['opBoard', familyId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, qc]);
}
