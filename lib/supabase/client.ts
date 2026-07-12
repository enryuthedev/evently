/**
 * Supabase client (single instance). Pure JS — works in Expo Go.
 *
 * Config comes from EXPO_PUBLIC_* env vars (see .env.example). If they're
 * missing the client is a no-op stub so the local-first app still runs; call
 * `isSupabaseConfigured()` before invoking any remote feature.
 */
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return url.length > 0 && anonKey.length > 0;
}

// On web the magic-link redirect lands back with the session in the URL hash,
// so let supabase-js parse it. On native we handle the deep link ourselves.
const isWeb = Platform.OS === 'web';

export const supabase: SupabaseClient = createClient(
  url || 'http://localhost',
  anonKey || 'public-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: isWeb,
      flowType: 'pkce',
    },
  },
);
