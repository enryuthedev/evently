/**
 * Evently global store (zustand + persist/AsyncStorage). Single source of truth
 * for events, guests, checklist, timeline, bring-list, profile, the wizard draft
 * and onboarding/hydration flags. See CONTRACT.md §6, §7, §10.
 *
 * Screens never mutate this directly — they call the actions below or read via
 * the narrow selector hooks in `selectors.ts`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { seed } from '@/lib/data/seed';
import type {
  BringCategory,
  BringItem,
  ChecklistCategory,
  ChecklistItem,
  EventMode,
  EventModel,
  Guest,
  InvitationDesign,
  OccasionType,
  Priority,
  RSVPStatus,
  TimelineItem,
  UserProfile,
} from '@/lib/data/types';
import { genId } from '@/lib/utils/ids';

const nowIso = (): string => new Date().toISOString();

const DEFAULT_PROFILE: UserProfile = {
  name: 'Sarah',
  defaultStyle: 'elegant',
  language: 'de',
  notificationsEnabled: true,
  isPremium: false,
};

const DEFAULT_INVITATION: InvitationDesign = {
  style: 'elegant',
  // Accent is stored as a hex everywhere (see ACCENTS in create/design.tsx) so a
  // fresh draft opens the colour tab with the first swatch already selected.
  accent: '#596244',
  // First entry in FONT_PAIRS — matches the top option in the designer's font tab.
  fontPair: 'grotesk',
  layout: 'centered',
  headline: '',
  subline: '',
  body: '',
  showQr: true,
};

/** Build a fresh, fully-defaulted draft event. */
function buildDraftEvent(mode: EventMode): EventModel {
  const ts = nowIso();
  return {
    id: genId('evt'),
    mode,
    occasion: 'custom',
    title: '',
    description: '',
    date: null,
    time: null,
    location: null,
    dateUndecided: false,
    poll: { options: [] },
    invitation: { ...DEFAULT_INVITATION },
    createdAt: ts,
    updatedAt: ts,
  };
}

// ---- Occasion-specific starter checklists ---------------------------------
type ChecklistSeedEntry = { title: string; category: ChecklistCategory; priority: Priority };

const CHECKLIST_TEMPLATES: Record<OccasionType, ChecklistSeedEntry[]> = {
  wedding: [
    { title: 'Location buchen', category: 'location', priority: 'high' },
    { title: 'Einladungen verschicken', category: 'invitation', priority: 'high' },
    { title: 'Catering & Menü abstimmen', category: 'food', priority: 'high' },
    { title: 'DJ oder Band buchen', category: 'music', priority: 'medium' },
    { title: 'Blumendekoration planen', category: 'decor', priority: 'medium' },
    { title: 'Sitzordnung festlegen', category: 'guests', priority: 'low' },
  ],
  engagement: [
    { title: 'Location festlegen', category: 'location', priority: 'high' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Catering organisieren', category: 'food', priority: 'medium' },
    { title: 'Dekoration besorgen', category: 'decor', priority: 'low' },
  ],
  birthday: [
    { title: 'Location oder Zuhause vorbereiten', category: 'location', priority: 'medium' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Torte & Essen organisieren', category: 'food', priority: 'high' },
    { title: 'Musik-Playlist erstellen', category: 'music', priority: 'low' },
    { title: 'Deko & Luftballons besorgen', category: 'decor', priority: 'low' },
  ],
  anniversary: [
    { title: 'Restaurant oder Location reservieren', category: 'location', priority: 'high' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'medium' },
    { title: 'Menü auswählen', category: 'food', priority: 'medium' },
    { title: 'Deko vorbereiten', category: 'decor', priority: 'low' },
  ],
  dinner: [
    { title: 'Tisch reservieren oder zu Hause decken', category: 'location', priority: 'medium' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Menü planen', category: 'food', priority: 'high' },
    { title: 'Getränke besorgen', category: 'food', priority: 'medium' },
  ],
  friends: [
    { title: 'Treffpunkt festlegen', category: 'location', priority: 'medium' },
    { title: 'Freunde einladen', category: 'invitation', priority: 'high' },
    { title: 'Essen & Getränke organisieren', category: 'food', priority: 'medium' },
    { title: 'Playlist vorbereiten', category: 'music', priority: 'low' },
  ],
  corporate: [
    { title: 'Veranstaltungsort buchen', category: 'location', priority: 'high' },
    { title: 'Einladungen versenden', category: 'invitation', priority: 'high' },
    { title: 'Catering beauftragen', category: 'food', priority: 'high' },
    { title: 'Technik & Präsentation prüfen', category: 'other', priority: 'medium' },
    { title: 'Teilnehmerliste pflegen', category: 'guests', priority: 'medium' },
  ],
  baby_shower: [
    { title: 'Location vorbereiten', category: 'location', priority: 'medium' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Snacks & Torte planen', category: 'food', priority: 'medium' },
    { title: 'Spiele & Deko vorbereiten', category: 'decor', priority: 'low' },
  ],
  baptism: [
    { title: 'Kirche & Termin abstimmen', category: 'location', priority: 'high' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Festessen organisieren', category: 'food', priority: 'medium' },
    { title: 'Dekoration vorbereiten', category: 'decor', priority: 'low' },
  ],
  graduation: [
    { title: 'Feier-Location wählen', category: 'location', priority: 'medium' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Essen & Getränke besorgen', category: 'food', priority: 'medium' },
    { title: 'Musik vorbereiten', category: 'music', priority: 'low' },
  ],
  custom: [
    { title: 'Ort festlegen', category: 'location', priority: 'medium' },
    { title: 'Gäste einladen', category: 'invitation', priority: 'high' },
    { title: 'Verpflegung planen', category: 'food', priority: 'medium' },
    { title: 'Letzte Details klären', category: 'other', priority: 'low' },
  ],
};

// ---- State & actions -------------------------------------------------------
export interface AppState {
  // data
  events: EventModel[];
  guests: Guest[];
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  bringList: BringItem[];
  profile: UserProfile;
  draft: EventModel | null;
  onboardingComplete: boolean;
  _hydrated: boolean;

  // hydration
  setHydrated: (v: boolean) => void;

  // onboarding
  setOnboardingComplete: (v: boolean) => void;

  // wizard draft
  startDraft: (mode?: EventMode) => void;
  updateDraft: (patch: Partial<EventModel>) => void;
  updateDraftInvitation: (patch: Partial<InvitationDesign>) => void;
  addDraftDateOption: (date: string, time?: string) => void;
  removeDraftDateOption: (optionId: string) => void;
  commitDraft: () => string;
  cancelDraft: () => void;

  // events
  updateEvent: (id: string, patch: Partial<EventModel>) => void;
  deleteEvent: (id: string) => void;
  /** Store the Supabase remote id + share token after publishing. */
  applyRemote: (localId: string, remoteId: string, shareToken: string) => void;

  // guests
  addGuest: (eventId: string, data: Partial<Guest> & { name: string }) => string;
  updateGuest: (id: string, patch: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  setRSVP: (guestId: string, status: RSVPStatus, extra?: Partial<Guest>) => void;

  // poll
  addDateOption: (eventId: string, date: string, time?: string) => void;
  removeDateOption: (eventId: string, optionId: string) => void;
  toggleVote: (eventId: string, optionId: string, guestId: string) => void;
  finalizePoll: (eventId: string, optionId: string) => void;

  // checklist
  addChecklistItem: (
    eventId: string,
    data: Partial<ChecklistItem> & { title: string; category: ChecklistCategory },
  ) => string;
  toggleChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, patch: Partial<ChecklistItem>) => void;
  removeChecklistItem: (id: string) => void;
  seedChecklistForOccasion: (eventId: string, occasion: OccasionType) => void;

  // timeline
  addTimelineItem: (
    eventId: string,
    data: Partial<TimelineItem> & { time: string; title: string },
  ) => string;
  updateTimelineItem: (id: string, patch: Partial<TimelineItem>) => void;
  removeTimelineItem: (id: string) => void;

  // bring
  addBringItem: (
    eventId: string,
    data: Partial<BringItem> & { title: string; category: BringCategory },
  ) => string;
  claimBringItem: (id: string, claimedBy: string) => void;
  removeBringItem: (id: string) => void;

  // profile
  updateProfile: (patch: Partial<UserProfile>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- initial state ----
      events: [],
      guests: [],
      checklist: [],
      timeline: [],
      bringList: [],
      profile: { ...DEFAULT_PROFILE },
      draft: null,
      onboardingComplete: false,
      _hydrated: false,

      // ---- hydration ----
      setHydrated: (v) => set({ _hydrated: v }),

      // ---- onboarding ----
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),

      // ---- wizard draft ----
      startDraft: (mode = 'special') => set({ draft: buildDraftEvent(mode) }),

      updateDraft: (patch) =>
        set((s) =>
          s.draft ? { draft: { ...s.draft, ...patch, updatedAt: nowIso() } } : {},
        ),

      updateDraftInvitation: (patch) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  invitation: { ...s.draft.invitation, ...patch },
                  updatedAt: nowIso(),
                },
              }
            : {},
        ),

      addDraftDateOption: (date, time) =>
        set((s) => {
          if (!s.draft) return {};
          const option = { id: genId('opt'), date, time, votes: [] };
          return {
            draft: {
              ...s.draft,
              poll: { ...s.draft.poll, options: [...s.draft.poll.options, option] },
              updatedAt: nowIso(),
            },
          };
        }),

      removeDraftDateOption: (optionId) =>
        set((s) => {
          if (!s.draft) return {};
          return {
            draft: {
              ...s.draft,
              poll: {
                ...s.draft.poll,
                options: s.draft.poll.options.filter((o) => o.id !== optionId),
              },
              updatedAt: nowIso(),
            },
          };
        }),

      commitDraft: () => {
        const draft = get().draft;
        if (!draft) return '';
        const committed: EventModel = { ...draft, updatedAt: nowIso() };
        set((s) => ({ events: [...s.events, committed], draft: null }));
        return committed.id;
      },

      cancelDraft: () => set({ draft: null }),

      // ---- events ----
      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e,
          ),
        })),

      applyRemote: (localId, remoteId, shareToken) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === localId ? { ...e, remoteId, shareToken } : e,
          ),
          // Publishing can happen before the draft is committed (the review
          // screen publishes up-front for the QR). Patch the in-flight draft too
          // so the token is carried through commitDraft instead of being dropped.
          draft:
            s.draft && s.draft.id === localId
              ? { ...s.draft, remoteId, shareToken }
              : s.draft,
        })),

      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          guests: s.guests.filter((g) => g.eventId !== id),
          checklist: s.checklist.filter((c) => c.eventId !== id),
          timeline: s.timeline.filter((t) => t.eventId !== id),
          bringList: s.bringList.filter((b) => b.eventId !== id),
        })),

      // ---- guests ----
      addGuest: (eventId, data) => {
        const id = genId('g');
        const guest: Guest = {
          id,
          eventId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          group: data.group ?? 'friends',
          status: data.status ?? 'pending',
          partySize: data.partySize ?? 1,
          companions: data.companions ?? [],
          meal: data.meal ?? 'none',
          allergies: data.allergies,
          note: data.note,
          invitedAt: data.invitedAt ?? nowIso(),
          respondedAt: data.respondedAt,
        };
        set((s) => ({ guests: [...s.guests, guest] }));
        return id;
      },

      updateGuest: (id, patch) =>
        set((s) => ({
          guests: s.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      removeGuest: (id) =>
        set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),

      setRSVP: (guestId, status, extra) =>
        set((s) => ({
          guests: s.guests.map((g) =>
            g.id === guestId
              ? { ...g, status, ...extra, respondedAt: nowIso() }
              : g,
          ),
        })),

      // ---- poll ----
      addDateOption: (eventId, date, time) =>
        set((s) => {
          const ts = nowIso();
          return {
            events: s.events.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    poll: {
                      ...e.poll,
                      options: [
                        ...e.poll.options,
                        { id: genId('opt'), date, time, votes: [] },
                      ],
                    },
                    updatedAt: ts,
                  }
                : e,
            ),
          };
        }),

      removeDateOption: (eventId, optionId) =>
        set((s) => {
          const ts = nowIso();
          return {
            events: s.events.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    poll: {
                      ...e.poll,
                      options: e.poll.options.filter((o) => o.id !== optionId),
                    },
                    updatedAt: ts,
                  }
                : e,
            ),
          };
        }),

      toggleVote: (eventId, optionId, guestId) =>
        set((s) => {
          const ts = nowIso();
          return {
            events: s.events.map((e) => {
              if (e.id !== eventId) return e;
              return {
                ...e,
                poll: {
                  ...e.poll,
                  options: e.poll.options.map((o) => {
                    if (o.id !== optionId) return o;
                    const has = o.votes.includes(guestId);
                    return {
                      ...o,
                      votes: has
                        ? o.votes.filter((v) => v !== guestId)
                        : [...o.votes, guestId],
                    };
                  }),
                },
                updatedAt: ts,
              };
            }),
          };
        }),

      finalizePoll: (eventId, optionId) =>
        set((s) => {
          const ts = nowIso();
          return {
            events: s.events.map((e) => {
              if (e.id !== eventId) return e;
              const option = e.poll.options.find((o) => o.id === optionId);
              return {
                ...e,
                date: option ? option.date : e.date,
                time: option ? option.time ?? e.time : e.time,
                dateUndecided: false,
                poll: { ...e.poll, finalizedOptionId: optionId },
                updatedAt: ts,
              };
            }),
          };
        }),

      // ---- checklist ----
      addChecklistItem: (eventId, data) => {
        const id = genId('c');
        const item: ChecklistItem = {
          id,
          eventId,
          category: data.category,
          title: data.title,
          done: data.done ?? false,
          dueDate: data.dueDate,
          priority: data.priority ?? 'medium',
        };
        set((s) => ({ checklist: [...s.checklist, item] }));
        return id;
      },

      toggleChecklistItem: (id) =>
        set((s) => ({
          checklist: s.checklist.map((c) =>
            c.id === id ? { ...c, done: !c.done } : c,
          ),
        })),

      updateChecklistItem: (id, patch) =>
        set((s) => ({
          checklist: s.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeChecklistItem: (id) =>
        set((s) => ({ checklist: s.checklist.filter((c) => c.id !== id) })),

      seedChecklistForOccasion: (eventId, occasion) =>
        set((s) => {
          const template = CHECKLIST_TEMPLATES[occasion] ?? CHECKLIST_TEMPLATES.custom;
          const items: ChecklistItem[] = template.map((t) => ({
            id: genId('c'),
            eventId,
            category: t.category,
            title: t.title,
            done: false,
            priority: t.priority,
          }));
          return { checklist: [...s.checklist, ...items] };
        }),

      // ---- timeline ----
      addTimelineItem: (eventId, data) => {
        const id = genId('t');
        const item: TimelineItem = {
          id,
          eventId,
          time: data.time,
          title: data.title,
          description: data.description,
        };
        set((s) => ({
          timeline: [...s.timeline, item].sort((a, b) =>
            a.eventId === b.eventId ? a.time.localeCompare(b.time) : 0,
          ),
        }));
        return id;
      },

      updateTimelineItem: (id, patch) =>
        set((s) => ({
          timeline: s.timeline.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTimelineItem: (id) =>
        set((s) => ({ timeline: s.timeline.filter((t) => t.id !== id) })),

      // ---- bring ----
      addBringItem: (eventId, data) => {
        const id = genId('br');
        const item: BringItem = {
          id,
          eventId,
          category: data.category,
          title: data.title,
          claimedBy: data.claimedBy,
          quantity: data.quantity,
        };
        set((s) => ({ bringList: [...s.bringList, item] }));
        return id;
      },

      claimBringItem: (id, claimedBy) =>
        set((s) => ({
          bringList: s.bringList.map((b) =>
            b.id === id ? { ...b, claimedBy } : b,
          ),
        })),

      removeBringItem: (id) =>
        set((s) => ({ bringList: s.bringList.filter((b) => b.id !== id) })),

      // ---- profile ----
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    {
      name: 'evently-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Persist everything EXCEPT draft and _hydrated.
        const { draft: _draft, _hydrated, ...rest } = state;
        void _draft;
        void _hydrated;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // If there's no event data after rehydrate (first run), load the seed.
        if (!state.events || state.events.length === 0) {
          const data = seed();
          useStore.setState({
            events: data.events,
            guests: data.guests,
            checklist: data.checklist,
            timeline: data.timeline,
            bringList: data.bringList,
          });
        }
        useStore.setState({ _hydrated: true });
      },
    },
  ),
);
