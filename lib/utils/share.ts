/**
 * Sharing helpers (CONTRACT §10).
 *
 * - buildRsvpUrl: canonical deep-link target for a guest RSVP view.
 * - shareEvent: native share sheet (RN Share) with a message + url.
 * - copyLink: copies the RSVP url to the clipboard (expo-clipboard).
 * - shareImageOrPdf: shares a local file uri (expo-sharing), guarded by
 *   isAvailableAsync so it no-ops gracefully where unsupported.
 *
 * Messages are localized defensively from a small built-in table; callers may
 * pass an already-localized message via shareEvent's options if preferred.
 */

import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

import type { EventModel, Language } from '@/lib/data/types';

/** Base host for guest-facing RSVP deep links. */
export const RSVP_BASE_URL = 'https://evently.app/rsvp/';

/**
 * Canonical RSVP url. Pass the event's `shareToken` once published; falls back
 * to any id-like string for local previews (won't resolve on the server).
 */
export function buildRsvpUrl(tokenOrId: string): string {
  return RSVP_BASE_URL + tokenOrId;
}

/** Best link for an event: share token if published, else the local id. */
export function eventShareTarget(event: EventModel): string {
  return event.shareToken ?? event.id;
}

interface ShareStrings {
  invite: (title: string) => string;
  fallbackTitle: string;
}

const SHARE_STRINGS: Record<Language, ShareStrings> = {
  de: {
    invite: (title) => `Du bist eingeladen zu „${title}". Sag uns Bescheid:`,
    fallbackTitle: 'unserer Veranstaltung',
  },
  en: {
    invite: (title) => `You're invited to "${title}". Let us know if you can make it:`,
    fallbackTitle: 'our event',
  },
  tr: {
    invite: (title) => `"${title}" etkinliğine davetlisin. Bize haber ver:`,
    fallbackTitle: 'etkinliğimize',
  },
  fr: {
    invite: (title) => `Vous êtes invité à « ${title} ». Faites-nous savoir :`,
    fallbackTitle: 'notre événement',
  },
  es: {
    invite: (title) => `Estás invitado a "${title}". Avísanos:`,
    fallbackTitle: 'nuestro evento',
  },
};

const stringsFor = (lang?: Language): ShareStrings =>
  SHARE_STRINGS[lang ?? 'de'] ?? SHARE_STRINGS.de;

export interface ShareEventOptions {
  /** Language for the default message. Defaults to 'de'. */
  lang?: Language;
  /** Fully override the share message (already localized). */
  message?: string;
  /**
   * Pre-built RSVP url (e.g. from `usePublishEvent`, carrying the server
   * share_token). Preferred over the event's possibly-stale local token.
   */
  url?: string;
}

/**
 * Open the native share sheet for an event. Builds a friendly invite message
 * plus the RSVP url. Swallows the user-cancelled case.
 */
export async function shareEvent(
  event: EventModel,
  opts?: ShareEventOptions
): Promise<void> {
  const strings = stringsFor(opts?.lang);
  const title = event.title?.trim() || strings.fallbackTitle;
  const url = opts?.url ?? buildRsvpUrl(eventShareTarget(event));
  const message = opts?.message ?? `${strings.invite(title)} ${url}`;

  try {
    await Share.share({ message, url, title });
  } catch {
    // User dismissed the sheet, or sharing unavailable — non-fatal.
  }
}

/** Copy an event's RSVP link to the clipboard. */
export async function copyLink(eventId: string): Promise<void> {
  await Clipboard.setStringAsync(buildRsvpUrl(eventId));
}

/** Copy an already-built RSVP url (e.g. from `usePublishEvent`) to clipboard. */
export async function copyRsvpUrl(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
}

/**
 * Share a local image or PDF file (e.g. exported invitation). Guarded by
 * Sharing.isAvailableAsync; no-ops where the platform can't share files.
 */
export async function shareImageOrPdf(uri: string): Promise<void> {
  if (!uri) return;
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return;
    await Sharing.shareAsync(uri);
  } catch {
    // Non-fatal — sharing dismissed or unsupported.
  }
}
