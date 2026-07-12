/**
 * Host authentication via Supabase magic-link (passwordless email).
 *
 * Flow:
 *   1. sendMagicLink(email) — Supabase emails a login link.
 *   2. User taps it. On web the session is picked up automatically; on native
 *      the `evently://auth-callback` deep link is handled by handleAuthUrl().
 *   3. useSession() exposes the current session reactively.
 *
 * Supabase dashboard setup (Authentication → URL Configuration):
 *   - Add redirect URLs: your web origin, and `evently://auth-callback`.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from './client';

/** Redirect target the magic link returns to. */
function redirectTo(): string {
  // On web, come back to the current origin; on native, our custom scheme.
  return Platform.OS === 'web'
    ? Linking.createURL('/')
    : Linking.createURL('auth-callback');
}

/** Email a magic login link to `email`. Throws on Supabase error. */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
}

/** Sign the host out. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Complete a magic-link login from a deep-link URL (native). Exchanges the
 * code in the URL for a session. No-op if the URL has no auth params.
 */
export async function handleAuthUrl(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const code = (parsed.queryParams?.code as string | undefined) ?? undefined;
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
}

/** Current user id, or null when signed out / unconfigured. */
export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Ensure there's a host session, creating a throwaway anonymous one if needed.
 *
 * Publishing an event needs an owner (RLS: owner_id = auth.uid()), but we don't
 * want to force a magic-link login just to share a link. So the first time a
 * host publishes we sign them in anonymously — the session persists in
 * AsyncStorage, so the same device keeps owning its events. Requires
 * "Anonymous sign-ins" to be enabled in the Supabase dashboard
 * (Authentication → Providers → Anonymous). Returns the host user id, or null
 * when Supabase isn't configured / sign-in fails.
 */
export async function ensureHost(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const existing = await currentUserId();
  if (existing) return existing;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

/** Reactive session hook. `undefined` = still loading, `null` = signed out. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}
