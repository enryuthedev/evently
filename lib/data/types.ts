/**
 * Evently domain model. Single source of truth for all entity shapes.
 * Screens and the store import from here — do not redefine these locally.
 * See CONTRACT.md §Data model.
 */

/** Planning complexity. Drives progressive disclosure (quick = minimal UI). */
export type EventMode = 'quick' | 'special' | 'wedding';

/** Occasion picked in the wizard (anlass_waehlen). `custom` = Eigener Anlass. */
export type OccasionType =
  | 'wedding'
  | 'birthday'
  | 'dinner'
  | 'friends'
  | 'corporate'
  | 'engagement'
  | 'baby_shower'
  | 'baptism'
  | 'graduation'
  | 'anniversary'
  | 'custom';

export type RSVPStatus = 'yes' | 'no' | 'maybe' | 'pending';

export type GuestGroup = 'family' | 'friends' | 'work' | 'vip' | 'kids' | 'vendor';

export type MealChoice = 'meat' | 'vegetarian' | 'vegan' | 'kids' | 'none';

export type ChecklistCategory =
  | 'location'
  | 'invitation'
  | 'food'
  | 'decor'
  | 'music'
  | 'guests'
  | 'other';

export type BringCategory = 'food' | 'drinks' | 'games' | 'music' | 'decor' | 'other';

export type Priority = 'low' | 'medium' | 'high';

/** Invitation card visual styles (einladung_gestalten). */
export type InvitationStyle =
  | 'elegant'
  | 'floral'
  | 'modern'
  | 'minimal'
  | 'luxury'
  | 'casual';

export type FontPair =
  | 'grotesk'
  | 'classic'
  | 'elegant'
  | 'modern'
  | 'script'
  | 'playful'
  | 'minimal'
  | 'bold'
  | 'refined';

export type CardLayout = 'centered' | 'topPhoto' | 'framed';

export type PrintFormat = 'a6' | 'a5' | 'square' | 'story';

export interface EventLocation {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

/** A proposed date/time the host offers for voting (termin_abstimmen). */
export interface DateOption {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** "HH:mm" or undefined if any time works. */
  time?: string;
  /** guest ids who voted they can attend this slot. */
  votes: string[];
}

export interface DatePoll {
  options: DateOption[];
  /** id of the DateOption the host finalized, if any. */
  finalizedOptionId?: string;
}

export interface InvitationDesign {
  style: InvitationStyle;
  /** Accent color token name (see lib/theme/tokens) or a hex string. */
  accent: string;
  fontPair: FontPair;
  layout: CardLayout;
  headline: string;
  subline: string;
  body: string;
  /** Local uri of an attached photo, if any. */
  photoUri?: string;
  showQr: boolean;
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  group: GuestGroup;
  status: RSVPStatus;
  /** total heads incl. the guest (1 = just them). */
  partySize: number;
  /** names of accompanying people, optional. */
  companions: string[];
  meal: MealChoice;
  allergies?: string;
  note?: string;
  invitedAt: string;
  respondedAt?: string;
}

export interface ChecklistItem {
  id: string;
  eventId: string;
  category: ChecklistCategory;
  title: string;
  done: boolean;
  dueDate?: string;
  priority: Priority;
}

export interface TimelineItem {
  id: string;
  eventId: string;
  /** "HH:mm". */
  time: string;
  title: string;
  description?: string;
}

export interface BringItem {
  id: string;
  eventId: string;
  category: BringCategory;
  title: string;
  /** guest id or free-text name who claimed it. */
  claimedBy?: string;
  quantity?: number;
}

export interface EventModel {
  id: string;
  mode: EventMode;
  occasion: OccasionType;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) or null when not yet decided. */
  date: string | null;
  /** "HH:mm" or null. */
  time: string | null;
  location: EventLocation | null;
  /** When true, the date is open and `poll` collects availability. */
  dateUndecided: boolean;
  poll: DatePoll;
  invitation: InvitationDesign;
  coverImageUri?: string;
  /** Server row id once published to Supabase (see lib/supabase/publish). */
  remoteId?: string;
  /** Public share token; present after publishing. Drives the invite link. */
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export type Language = 'de' | 'en' | 'tr' | 'fr' | 'es';

export interface UserProfile {
  name: string;
  defaultStyle: InvitationStyle;
  language: Language;
  notificationsEnabled: boolean;
  /** Mirrors the active RevenueCat entitlement (see lib/purchases). */
  isPremium: boolean;
}

/** Aggregate RSVP counts for an event (computed selector). */
export interface RSVPSummary {
  yes: number;
  no: number;
  maybe: number;
  pending: number;
  /** total heads from guests who said yes (sum of partySize). */
  attending: number;
  total: number;
}
