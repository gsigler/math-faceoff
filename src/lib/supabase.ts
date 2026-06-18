import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

// Anonymous-auth identity persists in AsyncStorage. The token is a device
// passport (not a credential), so AsyncStorage is the right, reliable choice
// and avoids SecureStore's 2KB value limit on session blobs.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep tokens fresh only while the app is foregrounded (Supabase RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

let ensuring: Promise<string | null> | null = null;

/**
 * Silently ensure a session exists. On first launch this signs the device in
 * anonymously — no login UI is ever shown. Returns the user id, or null if
 * Supabase isn't configured yet.
 */
export async function ensureSession(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  if (ensuring) return ensuring;

  ensuring = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user.id;

    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return signed.user?.id ?? null;
  })();

  try {
    return await ensuring;
  } finally {
    ensuring = null;
  }
}
