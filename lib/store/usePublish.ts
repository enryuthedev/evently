/**
 * usePublishEvent — publish an event to Supabase and get its guest RSVP url.
 *
 * The share link MUST carry a real server `share_token` (not the local device
 * id), otherwise a guest on another device can't resolve the event and the
 * `/rsvp/<token>` page shows "not found". This hook makes sharing publish-first:
 *
 *   const publish = usePublishEvent();
 *   const url = await publish(event);   // upserts to Supabase, returns the url
 *
 * It's idempotent (reuses an existing token) and degrades gracefully: with
 * Supabase unconfigured it returns the local-id url so host preview still works.
 */
import { useCallback } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase/client';
import { publishEvent } from '@/lib/supabase/publish';
import { buildRsvpUrl } from '@/lib/utils/share';
import type { EventModel } from '@/lib/data/types';
import { useStore } from './useStore';

/** Returns `publish(event) → Promise<rsvpUrl>`. */
export function usePublishEvent() {
  const applyRemote = useStore((s) => s.applyRemote);

  return useCallback(
    async (event: EventModel): Promise<string> => {
      // Already published — reuse the server token.
      if (event.shareToken) return buildRsvpUrl(event.shareToken);
      // No backend — fall back to the local id (host-preview only).
      if (!isSupabaseConfigured()) return buildRsvpUrl(event.id);
      try {
        const { remoteId, shareToken } = await publishEvent(event);
        applyRemote(event.id, remoteId, shareToken);
        return buildRsvpUrl(shareToken);
      } catch {
        // Network / auth error — degrade to the local url rather than blocking.
        return buildRsvpUrl(event.id);
      }
    },
    [applyRemote],
  );
}
