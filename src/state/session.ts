import { useEffect } from 'react';
import { create } from 'zustand';
import { ensureSession } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/env';

interface SessionState {
  uid: string | null;
  ready: boolean; // true once the silent anon sign-in has resolved
  error: string | null;
  configured: boolean;
  init: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  uid: null,
  ready: false,
  error: null,
  configured: isSupabaseConfigured,
  init: async () => {
    if (get().ready) return;
    try {
      const uid = await ensureSession();
      set({ uid, ready: true, error: null });
    } catch (e) {
      set({ ready: true, error: e instanceof Error ? e.message : String(e) });
    }
  },
}));

/** Kick off the silent anonymous sign-in once, then expose session state. */
export function useSession() {
  const state = useSessionStore();
  useEffect(() => {
    void state.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
