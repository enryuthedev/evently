# Evently — Build Contract (single source of truth)

> Every agent (foundation + screens) MUST follow this. It pins the shared API so
> files written in parallel compile together. If something is ambiguous, prefer
> the rule here over inventing a new pattern. Do NOT redefine shared types,
> components, store actions, or i18n keys locally.

## 0. Mission & stack

Evently = event-planning app (weddings → casual meetups). Plan events, design
digital invitation cards, collect RSVPs, poll for dates, manage guests, print/
export cards. German-first, multilingual.

- **Expo SDK 54**, expo-router v6 (file-based, typed routes), React 19 / RN 0.81.
- **Must run in Expo Go** (SDK 54). No custom native modules at runtime.
- **NativeWind v4** for styling (Tailwind classes via `className`). Theme tokens
  in `tailwind.config.js` + `lib/theme/tokens.ts` (kept in sync).
- State: **zustand** + persist (AsyncStorage). i18n: **i18next/react-i18next**.
- Payments: **RevenueCat**, abstracted in `lib/purchases` (mock in Expo Go).
- Language: **TypeScript, strict**. Functional components, hooks.

## 1. Conventions

- Imports use the `@/` alias → repo root. e.g. `import { Text } from '@/components/ui/Text'`.
- **Typography & color → `<Text>`/`<Icon>` components**, NOT raw RN `<Text>` or
  inline fontFamily. Use `className` only for layout/spacing/background/border.
- Fonts: Hanken Grotesk (headlines) + Inter (body). Loaded in root layout; refer
  to families via tokens, never hardcode the font string in screens.
- **No `react-native-reanimated`** (not installed). For animation use RN
  `Animated` from `react-native`.
- Icons: Material *Symbols* snake_case names via `<Icon name="calendar_today" />`.
- Every user-facing string goes through i18n `t()`. No hardcoded German in JSX.
- Money/dates/relative labels via `lib/utils/format.ts` (locale-aware).
- Screens are presentational + call store actions/selectors. No data logic inline.
- Safe areas: wrap screen content in `<Screen>` (handles SafeArea + bg + scroll).
- Default export each route component. Components in `components/` use named exports
  (a default re-export is fine too).

## 2. Routes (expo-router, `app/`)

| Route file | Purpose | Stitch HTML source |
|---|---|---|
| `app/_layout.tsx` | Root: providers, fonts, i18n, store hydrate gate, Stack | — |
| `app/index.tsx` | Redirect: onboardingComplete ? `/(tabs)` : `/onboarding` | — |
| `app/onboarding.tsx` | Welcome/hero | `willkommen_bei_eventique_new_font` |
| `app/(tabs)/_layout.tsx` | Bottom tabs (custom bar) | dashboard bottom nav |
| `app/(tabs)/index.tsx` | Home dashboard | `dashboard_new_font` |
| `app/(tabs)/events.tsx` | All events list | (new, match system) |
| `app/(tabs)/templates.tsx` | Template gallery | (new) |
| `app/(tabs)/profile.tsx` | Profile / settings | (new) |
| `app/create/_layout.tsx` | Wizard stack (headerless) | — |
| `app/create/occasion.tsx` | Step 1 — choose occasion | `anlass_w_hlen_new_font` |
| `app/create/details.tsx` | Step 2 — event details | `event_details_new_font` |
| `app/create/poll.tsx` | Step 3 — propose dates (if undecided) | `termin_abstimmen_new_font` |
| `app/create/design.tsx` | Step 4 — invitation designer | `einladung_gestalten_new_font` |
| `app/create/review.tsx` | Preview + finish/share | uses `InvitationCard` |
| `app/event/[id]/_layout.tsx` | Event hub stack | — |
| `app/event/[id]/index.tsx` | Host command center | (new, match system) |
| `app/event/[id]/guests.tsx` | Guest management | `g_steliste_new_font` |
| `app/event/[id]/poll.tsx` | Date voting (existing event) | `termin_abstimmen_new_font` |
| `app/event/[id]/checklist.tsx` | Checklist | `checkliste_new_font` |
| `app/event/[id]/timeline.tsx` | Run-of-show timeline | (new) |
| `app/event/[id]/bring.tsx` | Bring-list (potluck) | (new) |
| `app/event/[id]/print.tsx` | Print/export card | `karte_drucken_new_font` |
| `app/rsvp/[id].tsx` | Guest RSVP view (deep link target) | `deine_einladung_new_font` |
| `app/paywall.tsx` | Premium upgrade | (new) |
| `app/+not-found.tsx` | 404 | — |

**Navigation:** use `router` from `expo-router` (`import { router } from 'expo-router'`).
- New event → `router.push('/create/occasion')`.
- Open event → `router.push(\`/event/\${id}\`)`.
- Guest link → `buildRsvpUrl(id)` from `lib/utils/share.ts`.
- Typed routes are ON; string paths above are valid.

## 3. Theme (`lib/theme/tokens.ts` ↔ `tailwind.config.js`)

- Colors: use NativeWind classes `bg-primary`, `text-on-surface`,
  `border-surface-variant`, etc. Full token list in `tokens.ts` `palette`.
  Programmatic color → `palette['primary']` or `color('primary')`.
- Key brand tokens: `primary` #596244 (sage), `primary-container` #8e9775,
  `secondary` #7d562d, `tertiary` #765a05 (gold), `background` #fcf9f8,
  `surface-container-lowest` #ffffff (cards), `surface-variant` #e4e2e1 (borders),
  `on-surface` #1b1c1c, `on-surface-variant` #46483f (muted text).
- Typography variants (pass to `<Text variant>`): `headline-xl`,
  `headline-xl-mobile`, `headline-lg`, `headline-md`, `body-lg`, `body-md`,
  `body-sm`, `label-md`, `label-sm`.
- Radii: cards = `rounded-3xl` (24px) or `rounded-2xl` (16px); buttons/inputs =
  `rounded-xl` (12px) per designs. Pills = `rounded-full`.
- Shadows: import `shadows` from tokens and apply via `style={shadows.card}` (RN
  shadow props don't come from className reliably). Variants: `card`, `cardHover`,
  `float`, `hero`.
- Spacing: screen horizontal padding = `px-5` (20px, the mobile container pad).

## 4. Components (`components/ui/`)

All take an optional `className` (merged last) unless noted. Props are exhaustive.

- **`Text`** (DONE) — `{ variant?, color?, className?, ...RNTextProps }`.
- **`Icon`** (DONE) — `{ name: string /*material symbol*/, size?=24, color?='on-surface', style? }`.
- **`Screen`** — page wrapper. `{ scroll?=false, edges?=['top'], className?, contentClassName?, children, footer? }`. Applies SafeArea + `bg-background`, flex-1. `scroll` → ScrollView with `contentContainerClassName`. `footer` renders a sticky bottom area outside the scroll.
- **`Button`** — `{ label?, children?, onPress, variant?='primary'('primary'|'secondary'|'outline'|'ghost'|'danger'), size?='lg'('sm'|'md'|'lg'), leftIcon?:string, rightIcon?:string, loading?=false, disabled?=false, fullWidth?=true, className? }`. Primary = `bg-primary-container` text `on-primary-container`, h-14 rounded-xl. Secondary = `bg-surface-container`. Outline = border. Ghost = transparent.
- **`IconButton`** — `{ name, onPress, size?=24, color?='on-surface-variant', accessibilityLabel, className? }`. Circular hit area.
- **`Card`** — `{ onPress?, children, className?, padded?=true, elevated?=true }`. White `surface-container-lowest`, `rounded-3xl`, border `surface-variant`, `shadows.card` when elevated. Pressable when `onPress`.
- **`Chip`** — `{ label, selected?=false, onPress?, icon?:string, className? }`. Pill, `label-sm`. Selected = `bg-primary-container/20` text `on-primary-container`; unselected = `bg-surface-container` text `on-surface-variant`.
- **`Badge`** — status pill. `{ status: RSVPStatus | 'neutral', label?, className? }`. Color by status: yes→primary tint, no→error tint, maybe→tertiary/secondary tint, pending→outline tint.
- **`Input`** — `{ label?, value, onChangeText, placeholder?, icon?:string, multiline?=false, keyboardType?, autoCapitalize?, error?, className? }`. Border `surface-variant`, focus border `primary`, `rounded-xl`, label above in `label-md`.
- **`SegmentedControl`** — `{ options: {value:string,label:string}[], value, onChange, className? }`.
- **`ProgressBar`** — `{ value /*0..1*/, className? }`. Track `surface-variant`, fill `primary-container`, h-1 rounded-full.
- **`Avatar`** — `{ uri?, name?, size?=40, className? }`. Image or initials fallback.
- **`ListRow`** — `{ title, subtitle?, left?, right?, onPress?, className? }`. Borderless row, 16px vertical padding.
- **`SectionHeader`** — `{ title, actionLabel?, onActionPress? }`. `headline-md` title + optional "Alle ansehen →" action.
- **`EmptyState`** — `{ icon:string, title, message?, actionLabel?, onAction? }`.
- **`StatPill`** — small count display for RSVP stats. `{ value:number|string, label, tone?:'yes'|'no'|'maybe'|'pending'|'neutral' }`.
- **`AppHeader`** — tab screens top bar. `{ title?, showLogo?=false, avatarUri?, onAvatarPress?, right? }`. Sticky, `bg-background`. Logo variant shows avatar + "Evently" + notification bell.
- **`WizardHeader`** — `{ onBack?, onCancel?, title?='Evently' }`. Back (left) + brand (center) + close (right). Used by create/* screens.
- **`BottomTabBar`** — custom tab bar for `(tabs)/_layout`. 4 items: Home, Events, Vorlagen, Profil (icons: home, calendar_today, dashboard_customize, person). Active item = filled pill `bg-primary-container`. (Built in foundation; layout wires it.)

## 5. Invitation system (`components/invitation/`)

- **`InvitationCard`** — renders the stylized card everywhere (designer preview,
  review, guest view, print). Props:
  `{ design: InvitationDesign, event: Pick<EventModel,'title'|'date'|'time'|'location'|'occasion'>, size?: 'sm'|'md'|'lg'|'full', showQr?: boolean, qrValue?: string, className? }`.
  Aspect ratio ~3/4. Reads `design.style` to pick a preset from `stylePresets.ts`.
- **`stylePresets.ts`** — exports `INVITATION_STYLES: Record<InvitationStyle, {
  bg: string /*hex or token*/, text: string, accent: string, headlineFont, bodyFont,
  decoration?: 'floral'|'frame'|'none'|'gold' }>`. 6 styles: elegant, floral,
  modern, minimal, luxury, casual. Use tasteful color combos from the theme +
  a couple of refined extras (deep green, champagne/gold, blush). Render with
  `react-native-svg` decorations where helpful; keep it lightweight.

## 6. Data model

All entity types in `lib/data/types.ts` (DONE). Import from there. Key types:
`EventModel`, `Guest`, `ChecklistItem`, `TimelineItem`, `BringItem`,
`InvitationDesign`, `DateOption`, `DatePoll`, `RSVPSummary`, `UserProfile`,
`EventMode`, `OccasionType`, `RSVPStatus`, `GuestGroup`, `MealChoice`,
`InvitationStyle`, `Language`.

## 7. Store (`lib/store/useStore.ts` + `lib/store/selectors.ts`)

Zustand store, `persist` middleware with AsyncStorage (key `evently-store`),
`partialize` to exclude `draft` and `_hydrated`. On first run (no events) it
seeds demo data from `lib/data/seed.ts`. Expose `useStore` (the hook).

State: `events, guests, checklist, timeline, bringList, profile, draft (EventModel|null), onboardingComplete (boolean), _hydrated (boolean)`.

Actions (exact names & signatures — screens call these):
```
setOnboardingComplete(v: boolean): void
// wizard draft (draft is a full EventModel with defaults)
startDraft(mode?: EventMode): void
updateDraft(patch: Partial<EventModel>): void
updateDraftInvitation(patch: Partial<InvitationDesign>): void
addDraftDateOption(date: string, time?: string): void
removeDraftDateOption(optionId: string): void
commitDraft(): string                 // pushes draft → events, returns new id, clears draft
cancelDraft(): void
// events
updateEvent(id: string, patch: Partial<EventModel>): void
deleteEvent(id: string): void
// guests
addGuest(eventId: string, data: Partial<Guest> & { name: string }): string
updateGuest(id: string, patch: Partial<Guest>): void
removeGuest(id: string): void
setRSVP(guestId: string, status: RSVPStatus, extra?: Partial<Guest>): void
// poll
addDateOption(eventId: string, date: string, time?: string): void
removeDateOption(eventId: string, optionId: string): void
toggleVote(eventId: string, optionId: string, guestId: string): void
finalizePoll(eventId: string, optionId: string): void   // sets event date/time, dateUndecided=false
// checklist
addChecklistItem(eventId: string, data: Partial<ChecklistItem> & { title: string; category: ChecklistCategory }): string
toggleChecklistItem(id: string): void
updateChecklistItem(id: string, patch: Partial<ChecklistItem>): void
removeChecklistItem(id: string): void
seedChecklistForOccasion(eventId: string, occasion: OccasionType): void
// timeline
addTimelineItem(eventId: string, data: Partial<TimelineItem> & { time: string; title: string }): string
updateTimelineItem(id: string, patch: Partial<TimelineItem>): void
removeTimelineItem(id: string): void
// bring
addBringItem(eventId: string, data: Partial<BringItem> & { title: string; category: BringCategory }): string
claimBringItem(id: string, claimedBy: string): void
removeBringItem(id: string): void
// profile
updateProfile(patch: Partial<UserProfile>): void
```

Selector hooks in `lib/store/selectors.ts` (use these in screens; they subscribe
narrowly):
```
useEvents(): EventModel[]
useEvent(id: string): EventModel | undefined
useGuests(eventId: string): Guest[]
useRSVPSummary(eventId: string): RSVPSummary
useChecklist(eventId: string): ChecklistItem[]
useTimeline(eventId: string): TimelineItem[]
useBringList(eventId: string): BringItem[]
useDraft(): EventModel | null
useProfile(): UserProfile
usePremium(): boolean
```
`rsvpSummary` derives counts + `attending` (sum of partySize where status==='yes').

## 8. i18n (`lib/i18n/`)

- `lib/i18n/index.ts` configures i18next with 5 resources and exports `initI18n()`
  (reads saved lang from AsyncStorage key `evently-lang`, else device locale via
  `expo-localization`, else `de`). `de` is `fallbackLng`. Uses `intl-pluralrules`.
- Locales: `lib/i18n/locales/{de,en,tr,fr,es}.json`. **`de.json` is the source of
  truth** — authored comprehensively in foundation. The other 4 mirror its key
  structure exactly (translated).
- In components: `const { t } = useTranslation();` → `t('dashboard.greeting', { name })`.
- **Key convention:** `namespace.camelCaseKey`. Namespaces: `common`, `nav`,
  `status`, `occasions`, `modes`, `groups`, `meals`, `onboarding`, `dashboard`,
  `events`, `wizard`, `details`, `poll`, `designer`, `templates`, `guests`,
  `guestView`, `eventHub`, `checklist`, `timeline`, `bring`, `print`, `profile`,
  `paywall`, `errors`.
- **Screen agents:** READ `lib/i18n/locales/de.json` (it exists before screens are
  built) to use exact keys. Do NOT add keys. If a needed string is missing, pick
  the closest existing key; the verify pass reconciles. Use interpolation
  (`{{name}}`, `{{count}}`) and i18next plurals where counts appear.

## 9. Purchases (`lib/purchases/index.ts`)

RevenueCat is NOT available in Expo Go. This module detects the runtime and mocks.
```
PREMIUM_ENTITLEMENT = 'premium'
isExpoGo(): boolean                       // Constants.executionEnvironment === 'storeClient' OR appOwnership === 'expo'
initPurchases(): Promise<void>            // no-op + log in Expo Go; configures Purchases otherwise (lazy require)
getOfferings(): Promise<PaywallPackage[]> // mock 2 packages in Expo Go: monthly/yearly with priceString
purchasePackage(id: string): Promise<{ success: boolean }>  // mock success in Expo Go
restorePurchases(): Promise<boolean>
```
`PaywallPackage = { id: 'monthly'|'yearly', priceString: string, period: 'month'|'year', highlighted?: boolean }`.
Paywall screen: on success → `updateProfile({ isPremium: true })`. Premium gates
(designer extra styles, print PDF, seating, etc.) check `usePremium()`; when false
and user taps a locked feature → `router.push('/paywall')`. Lazy-require
`react-native-purchases` ONLY inside non-Expo-Go branch so Metro doesn't choke in
Expo Go.

## 10. Utilities (`lib/utils/`)

- `ids.ts`: `genId(prefix?: string): string` (runtime `Date.now`/`Math.random` OK).
- `format.ts`: `formatDate(iso, lang, opts?)`, `formatTime(hhmm, lang)`,
  `formatDateShort(iso, lang)`, `relativeLabel(iso, lang): string` ("In 3 Wochen",
  "Nächste Woche", "Heute"). Use `date-fns` + locale objects (de, enUS, tr, fr, es).
- `share.ts`: `buildRsvpUrl(eventId): string` (→ `https://evently.app/rsvp/<id>`),
  `shareEvent(event): Promise<void>` (RN `Share.share` with message + url),
  `copyLink(eventId): Promise<void>` (expo-clipboard + returns), 
  `shareImageOrPdf(uri): Promise<void>` (expo-sharing).
- `print.ts`: `buildInvitationHtml(event, design, opts?): string`,
  `printInvitation(event): Promise<void>` (expo-print `printAsync`),
  `exportInvitationPdf(event): Promise<string>` (`printToFileAsync` → uri, then share).
- `occasions.ts`: `OCCASIONS: { type: OccasionType; icon: string; defaultMode: EventMode }[]`
  and `occasionMeta(type)`. Icons: wedding→favorite, birthday→cake, dinner→restaurant,
  friends→group, corporate→business_center, engagement→diamond/favorite, baby_shower→child_friendly,
  baptism→water_drop, graduation→school, anniversary→celebration, custom→add. Label via
  `t('occasions.<type>')`.

## 11. Patterns & gotchas

- Expo Go: avoid any native-only API outside expo modules. expo-print,
  expo-sharing, expo-image-picker, expo-clipboard, datetimepicker, svg, qrcode-svg
  all work in Expo Go SDK 54.
- Date picker: `@react-native-community/datetimepicker` — on Android it's a
  dialog (imperative), iOS inline. Wrap in a small reusable picker if helpful
  (screen-local is fine).
- QR: `react-native-qrcode-svg` (`import QRCode from 'react-native-qrcode-svg'`).
- Use `SafeAreaView`/`useSafeAreaInsets` from `react-native-safe-area-context`
  (already a dep) — but prefer the `<Screen>` wrapper.
- Keep screens runnable even with empty data (show `EmptyState`).
- Progressive disclosure: `mode === 'quick'` hides checklist/timeline/seating
  affordances on the event hub; `wedding` shows all.
- Don't import from `stitch_*` folder at runtime — it's reference only.

## 12. Definition of done (per screen)

A screen compiles, uses `<Screen>`, pulls text from i18n, pulls data from store
selectors, wires its primary actions to store actions / router, matches the
Stitch layout (where one exists) in structure, spacing, and the warm sage theme,
and renders sensibly with the seeded demo data.
