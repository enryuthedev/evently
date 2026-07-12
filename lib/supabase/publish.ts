/**
 * Bridge between the local Evently store and Supabase.
 *
 *   publishEvent(event)      host → server: upsert the event, return share token
 *   fetchPublicEvent(token)  guest ← server: read a published event by token
 *   submitRsvp(token, ...)   guest → server: record an RSVP
 *
 * Everything degrades gracefully when Supabase isn't configured: publishEvent
 * throws a clear error, the fetch/submit calls return null / throw so the UI
 * can fall back to local-only behaviour.
 */
import { supabase, isSupabaseConfigured } from './client';
import { ensureHost } from './auth';
import type { EventModel, MealChoice, RSVPStatus } from '@/lib/data/types';

export interface PublishResult {
  remoteId: string;
  shareToken: string;
}

/** Map a local EventModel to the server row shape (snake_case columns). */
function toRow(event: EventModel, ownerId: string) {
  return {
    owner_id: ownerId,
    local_id: event.id,
    mode: event.mode,
    occasion: event.occasion,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    date_undecided: event.dateUndecided,
    poll: event.poll,
    invitation: event.invitation,
    cover_image_uri: event.coverImageUri ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Upsert an event to Supabase and return its server id + share token.
 * Requires a signed-in host. Idempotent per (owner, local id).
 */
export async function publishEvent(event: EventModel): Promise<PublishResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  // Auto-creates an anonymous host session on first publish (no login screen).
  const ownerId = await ensureHost();
  if (!ownerId) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('events')
    .upsert(toRow(event, ownerId), { onConflict: 'owner_id,local_id' })
    .select('id, share_token')
    .single();

  if (error) throw error;
  return { remoteId: data.id as string, shareToken: data.share_token as string };
}

/** Guest-safe event shape returned by the public RPC. */
export type PublicEvent = Pick<
  EventModel,
  | 'id'
  | 'shareToken'
  | 'mode'
  | 'occasion'
  | 'title'
  | 'description'
  | 'date'
  | 'time'
  | 'location'
  | 'dateUndecided'
  | 'poll'
  | 'invitation'
  | 'coverImageUri'
>;

/** Fetch a published event by its share token. null if not found/unconfigured. */
export async function fetchPublicEvent(
  token: string,
): Promise<PublicEvent | null> {
  if (!isSupabaseConfigured() || !token) return null;
  const { data, error } = await supabase.rpc('event_by_token', {
    p_token: token,
  });
  if (error || !data) return null;
  return data as PublicEvent;
}

export interface RsvpInput {
  name?: string;
  status: Exclude<RSVPStatus, 'pending'>;
  partySize?: number;
  meal?: MealChoice;
  allergies?: string;
  note?: string;
}

/** Submit a guest RSVP against a share token. Returns the new guest id. */
export async function submitRsvp(
  token: string,
  input: RsvpInput,
): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('submit_rsvp', {
    p_token: token,
    p_name: input.name ?? 'Gast',
    p_status: input.status,
    p_party_size: input.partySize ?? 1,
    p_meal: input.meal ?? 'none',
    p_allergies: input.allergies ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data as string;
}
