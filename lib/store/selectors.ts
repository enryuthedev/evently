/**
 * Narrow selector hooks over the Evently store. Screens use these instead of
 * reading the whole store, so they only re-render when their slice changes.
 * See CONTRACT.md §7.
 */
import { useMemo } from 'react';

import type {
  BringItem,
  ChecklistItem,
  EventModel,
  Guest,
  RSVPSummary,
  TimelineItem,
  UserProfile,
} from '@/lib/data/types';
import { useStore } from '@/lib/store/useStore';
import { ALL_FEATURES_FREE } from '@/lib/config';

export function useEvents(): EventModel[] {
  return useStore((s) => s.events);
}

export function useEvent(id: string): EventModel | undefined {
  return useStore((s) => s.events.find((e) => e.id === id));
}

export function useGuests(eventId: string): Guest[] {
  const guests = useStore((s) => s.guests);
  return useMemo(() => guests.filter((g) => g.eventId === eventId), [guests, eventId]);
}

export function useRSVPSummary(eventId: string): RSVPSummary {
  const guests = useStore((s) => s.guests);
  return useMemo(() => {
    const summary: RSVPSummary = {
      yes: 0,
      no: 0,
      maybe: 0,
      pending: 0,
      attending: 0,
      total: 0,
    };
    for (const g of guests) {
      if (g.eventId !== eventId) continue;
      summary.total += 1;
      summary[g.status] += 1;
      if (g.status === 'yes') summary.attending += g.partySize;
    }
    return summary;
  }, [guests, eventId]);
}

export function useChecklist(eventId: string): ChecklistItem[] {
  const checklist = useStore((s) => s.checklist);
  return useMemo(
    () => checklist.filter((c) => c.eventId === eventId),
    [checklist, eventId],
  );
}

export function useTimeline(eventId: string): TimelineItem[] {
  const timeline = useStore((s) => s.timeline);
  return useMemo(
    () =>
      timeline
        .filter((t) => t.eventId === eventId)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [timeline, eventId],
  );
}

export function useBringList(eventId: string): BringItem[] {
  const bringList = useStore((s) => s.bringList);
  return useMemo(
    () => bringList.filter((b) => b.eventId === eventId),
    [bringList, eventId],
  );
}

export function useDraft(): EventModel | null {
  return useStore((s) => s.draft);
}

export function useProfile(): UserProfile {
  return useStore((s) => s.profile);
}

export function usePremium(): boolean {
  // While ALL_FEATURES_FREE is on, everything is unlocked regardless of the
  // stored entitlement. Flip the flag in lib/config.ts to restore gating.
  const stored = useStore((s) => s.profile.isPremium);
  return ALL_FEATURES_FREE || stored;
}
