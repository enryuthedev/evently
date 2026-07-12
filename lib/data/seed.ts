/**
 * Demo seed data. Loaded on first run (when the store has no events) so the
 * dashboard, event hub, guest list, checklist, timeline and bring-list all look
 * alive without the user creating anything. See CONTRACT.md §7.
 *
 * Two events:
 *  1) evt-wedding — "Hochzeit von Julia & Marc" (~3 weeks out, 120 invited / 85 yes).
 *  2) evt-bbq     — "Sommer-Grillabend" (next week, ~15 invited / 12 yes).
 *
 * Dates are computed relative to "now" at call time so the demo always feels
 * near-future. Entity ids are stable strings.
 */
import type {
  BringItem,
  ChecklistItem,
  EventModel,
  Guest,
  InvitationDesign,
  TimelineItem,
} from '@/lib/data/types';

export interface SeedData {
  events: EventModel[];
  guests: Guest[];
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  bringList: BringItem[];
}

/** Format a Date to an ISO date (YYYY-MM-DD), local time. */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Now-relative day helper. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function seed(): SeedData {
  const now = new Date();
  const nowIso = now.toISOString();

  const weddingDate = isoDate(addDays(now, 21)); // ~3 weeks out
  const bbqDate = isoDate(addDays(now, 7)); // next week
  const invitedAt = isoDate(addDays(now, -30));

  // ---- Invitation designs ------------------------------------------------
  const weddingInvitation: InvitationDesign = {
    style: 'elegant',
    accent: 'primary',
    fontPair: 'classic',
    layout: 'centered',
    headline: 'Julia & Marc',
    subline: 'Wir heiraten!',
    body: 'Wir freuen uns, diesen besonderen Tag mit euch zu feiern. Bitte gebt uns bis zwei Wochen vorher Bescheid.',
    showQr: true,
  };

  const bbqInvitation: InvitationDesign = {
    style: 'casual',
    accent: 'secondary',
    fontPair: 'modern',
    layout: 'centered',
    headline: 'Sommer-Grillabend',
    subline: 'Komm vorbei!',
    body: 'Lockerer Grillabend im Garten. Bring gute Laune mit – um den Rest kümmern wir uns gemeinsam.',
    showQr: true,
  };

  // ---- Events ------------------------------------------------------------
  const events: EventModel[] = [
    {
      id: 'evt-wedding',
      mode: 'wedding',
      occasion: 'wedding',
      title: 'Hochzeit von Julia & Marc',
      description: 'Ein unvergesslicher Tag mit Familie und Freunden im Weingut Sonnenhof.',
      date: weddingDate,
      time: '15:00',
      location: {
        name: 'Weingut Sonnenhof',
        address: 'Sonnenhofweg 12, 76829 Landau',
        lat: 49.1987,
        lng: 8.1169,
      },
      dateUndecided: false,
      poll: { options: [] },
      invitation: weddingInvitation,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'evt-bbq',
      mode: 'quick',
      occasion: 'friends',
      title: 'Sommer-Grillabend',
      description: 'Entspannter Grillabend im Garten – wer bringt was mit?',
      date: bbqDate,
      time: '18:30',
      location: {
        name: 'Bei Lena im Garten',
        address: 'Lindenstraße 5, 60311 Frankfurt',
        lat: 50.1183,
        lng: 8.6685,
      },
      dateUndecided: false,
      poll: { options: [] },
      invitation: bbqInvitation,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // ---- Guests ------------------------------------------------------------
  // Representative rows (not literally 120) with mixed status/group/meal so the
  // RSVP summary reads rich. partySize sums to a believable headcount.
  const weddingGuests: Guest[] = [
    {
      id: 'g-w-1',
      eventId: 'evt-wedding',
      name: 'Anna Bauer',
      email: 'anna.bauer@example.de',
      group: 'family',
      status: 'yes',
      partySize: 2,
      companions: ['Thomas Bauer'],
      meal: 'meat',
      invitedAt,
      respondedAt: isoDate(addDays(now, -20)),
    },
    {
      id: 'g-w-2',
      eventId: 'evt-wedding',
      name: 'Lukas Hoffmann',
      email: 'lukas.hoffmann@example.de',
      group: 'friends',
      status: 'yes',
      partySize: 1,
      companions: [],
      meal: 'vegetarian',
      invitedAt,
      respondedAt: isoDate(addDays(now, -18)),
    },
    {
      id: 'g-w-3',
      eventId: 'evt-wedding',
      name: 'Familie Schäfer',
      email: 'schaefer@example.de',
      group: 'family',
      status: 'yes',
      partySize: 4,
      companions: ['Petra Schäfer', 'Jonas Schäfer', 'Mia Schäfer'],
      meal: 'meat',
      allergies: 'Eines der Kinder isst glutenfrei.',
      invitedAt,
      respondedAt: isoDate(addDays(now, -15)),
    },
    {
      id: 'g-w-4',
      eventId: 'evt-wedding',
      name: 'Sophie Wagner',
      email: 'sophie.wagner@example.de',
      group: 'friends',
      status: 'maybe',
      partySize: 1,
      companions: [],
      meal: 'vegan',
      note: 'Versucht es einzurichten, ist aber beruflich unterwegs.',
      invitedAt,
      respondedAt: isoDate(addDays(now, -10)),
    },
    {
      id: 'g-w-5',
      eventId: 'evt-wedding',
      name: 'Michael Becker',
      email: 'michael.becker@example.de',
      group: 'work',
      status: 'no',
      partySize: 1,
      companions: [],
      meal: 'none',
      note: 'Leider im Urlaub.',
      invitedAt,
      respondedAt: isoDate(addDays(now, -12)),
    },
    {
      id: 'g-w-6',
      eventId: 'evt-wedding',
      name: 'Elena Richter',
      email: 'elena.richter@example.de',
      group: 'vip',
      status: 'yes',
      partySize: 2,
      companions: ['David Richter'],
      meal: 'vegetarian',
      invitedAt,
      respondedAt: isoDate(addDays(now, -9)),
    },
    {
      id: 'g-w-7',
      eventId: 'evt-wedding',
      name: 'Familie Klein',
      email: 'klein@example.de',
      group: 'kids',
      status: 'yes',
      partySize: 3,
      companions: ['Sarah Klein', 'Emil Klein'],
      meal: 'kids',
      invitedAt,
      respondedAt: isoDate(addDays(now, -8)),
    },
    {
      id: 'g-w-8',
      eventId: 'evt-wedding',
      name: 'Jan Neumann',
      email: 'jan.neumann@example.de',
      group: 'friends',
      status: 'pending',
      partySize: 1,
      companions: [],
      meal: 'none',
      invitedAt,
    },
    {
      id: 'g-w-9',
      eventId: 'evt-wedding',
      name: 'Clara Vogel',
      email: 'clara.vogel@example.de',
      group: 'family',
      status: 'maybe',
      partySize: 2,
      companions: ['Robert Vogel'],
      meal: 'meat',
      invitedAt,
      respondedAt: isoDate(addDays(now, -6)),
    },
    {
      id: 'g-w-10',
      eventId: 'evt-wedding',
      name: 'Tobias Fuchs',
      email: 'tobias.fuchs@example.de',
      group: 'work',
      status: 'pending',
      partySize: 1,
      companions: [],
      meal: 'none',
      invitedAt,
    },
  ];

  const bbqGuests: Guest[] = [
    {
      id: 'g-b-1',
      eventId: 'evt-bbq',
      name: 'Lena Schmidt',
      group: 'friends',
      status: 'yes',
      partySize: 1,
      companions: [],
      meal: 'meat',
      invitedAt: isoDate(addDays(now, -5)),
      respondedAt: isoDate(addDays(now, -4)),
    },
    {
      id: 'g-b-2',
      eventId: 'evt-bbq',
      name: 'Max Weber',
      group: 'friends',
      status: 'yes',
      partySize: 2,
      companions: ['Nina Weber'],
      meal: 'vegetarian',
      invitedAt: isoDate(addDays(now, -5)),
      respondedAt: isoDate(addDays(now, -3)),
    },
    {
      id: 'g-b-3',
      eventId: 'evt-bbq',
      name: 'Paul Krüger',
      group: 'friends',
      status: 'yes',
      partySize: 1,
      companions: [],
      meal: 'meat',
      invitedAt: isoDate(addDays(now, -5)),
      respondedAt: isoDate(addDays(now, -3)),
    },
    {
      id: 'g-b-4',
      eventId: 'evt-bbq',
      name: 'Marie Lehmann',
      group: 'friends',
      status: 'yes',
      partySize: 2,
      companions: ['Felix Lehmann'],
      meal: 'vegan',
      invitedAt: isoDate(addDays(now, -5)),
      respondedAt: isoDate(addDays(now, -2)),
    },
    {
      id: 'g-b-5',
      eventId: 'evt-bbq',
      name: 'Jonas Braun',
      group: 'work',
      status: 'maybe',
      partySize: 1,
      companions: [],
      meal: 'none',
      invitedAt: isoDate(addDays(now, -5)),
      respondedAt: isoDate(addDays(now, -2)),
    },
    {
      id: 'g-b-6',
      eventId: 'evt-bbq',
      name: 'Hannah Köhler',
      group: 'friends',
      status: 'pending',
      partySize: 1,
      companions: [],
      meal: 'none',
      invitedAt: isoDate(addDays(now, -5)),
    },
  ];

  const guests: Guest[] = [...weddingGuests, ...bbqGuests];

  // ---- Checklist (wedding) ----------------------------------------------
  const checklist: ChecklistItem[] = [
    {
      id: 'c-w-1',
      eventId: 'evt-wedding',
      category: 'location',
      title: 'Location final bestätigen',
      done: true,
      priority: 'high',
      dueDate: isoDate(addDays(now, -14)),
    },
    {
      id: 'c-w-2',
      eventId: 'evt-wedding',
      category: 'invitation',
      title: 'Einladungen verschicken',
      done: true,
      priority: 'high',
      dueDate: isoDate(addDays(now, -7)),
    },
    {
      id: 'c-w-3',
      eventId: 'evt-wedding',
      category: 'food',
      title: 'Catering & Menü abstimmen',
      done: false,
      priority: 'high',
      dueDate: isoDate(addDays(now, 7)),
    },
    {
      id: 'c-w-4',
      eventId: 'evt-wedding',
      category: 'music',
      title: 'DJ / Band buchen',
      done: false,
      priority: 'medium',
      dueDate: isoDate(addDays(now, 5)),
    },
    {
      id: 'c-w-5',
      eventId: 'evt-wedding',
      category: 'decor',
      title: 'Blumendekoration bestellen',
      done: false,
      priority: 'medium',
      dueDate: isoDate(addDays(now, 10)),
    },
    {
      id: 'c-w-6',
      eventId: 'evt-wedding',
      category: 'guests',
      title: 'Sitzordnung festlegen',
      done: false,
      priority: 'low',
      dueDate: isoDate(addDays(now, 14)),
    },
  ];

  // ---- Timeline (wedding run-of-show) -----------------------------------
  const timeline: TimelineItem[] = [
    {
      id: 't-w-1',
      eventId: 'evt-wedding',
      time: '15:00',
      title: 'Trauung',
      description: 'Freie Trauung im Weinberg.',
    },
    {
      id: 't-w-2',
      eventId: 'evt-wedding',
      time: '16:00',
      title: 'Sektempfang',
      description: 'Sekt, Häppchen und Gratulationen.',
    },
    {
      id: 't-w-3',
      eventId: 'evt-wedding',
      time: '18:00',
      title: 'Abendessen',
      description: 'Festliches 3-Gänge-Menü.',
    },
    {
      id: 't-w-4',
      eventId: 'evt-wedding',
      time: '20:30',
      title: 'Eröffnungstanz',
    },
    {
      id: 't-w-5',
      eventId: 'evt-wedding',
      time: '21:00',
      title: 'Party',
      description: 'Tanz und Feier bis in die Nacht.',
    },
  ];

  // ---- Bring-list (BBQ potluck) -----------------------------------------
  const bringList: BringItem[] = [
    {
      id: 'br-b-1',
      eventId: 'evt-bbq',
      category: 'food',
      title: 'Grillfleisch',
      claimedBy: 'g-b-1',
      quantity: 3,
    },
    {
      id: 'br-b-2',
      eventId: 'evt-bbq',
      category: 'food',
      title: 'Gemüsespieße',
      claimedBy: 'g-b-4',
      quantity: 2,
    },
    {
      id: 'br-b-3',
      eventId: 'evt-bbq',
      category: 'food',
      title: 'Salate',
      claimedBy: 'g-b-2',
      quantity: 2,
    },
    {
      id: 'br-b-4',
      eventId: 'evt-bbq',
      category: 'drinks',
      title: 'Getränke & Bier',
      claimedBy: 'g-b-3',
      quantity: 1,
    },
    {
      id: 'br-b-5',
      eventId: 'evt-bbq',
      category: 'drinks',
      title: 'Limonade für Kinder',
      quantity: 1,
    },
    {
      id: 'br-b-6',
      eventId: 'evt-bbq',
      category: 'decor',
      title: 'Lichterkette & Servietten',
      quantity: 1,
    },
    {
      id: 'br-b-7',
      eventId: 'evt-bbq',
      category: 'music',
      title: 'Bluetooth-Box',
      claimedBy: 'g-b-2',
      quantity: 1,
    },
  ];

  return { events, guests, checklist, timeline, bringList };
}
