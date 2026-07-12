/**
 * Locale-aware date/time formatting for Evently (CONTRACT §10).
 *
 * Backed by date-fns + its locale objects. All public functions accept a
 * `Language` and degrade gracefully on invalid input (returning '' rather than
 * throwing) so screens can call them with partial draft data.
 */

import {
  format,
  parseISO,
  isValid,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  startOfDay,
} from 'date-fns';
import { de, enUS, tr, fr, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

import type { Language } from '@/lib/data/types';

/** Map an app Language to the matching date-fns Locale object. */
const LOCALES: Record<Language, Locale> = {
  de,
  en: enUS,
  tr,
  fr,
  es,
};

export const localeFor = (lang: Language): Locale => LOCALES[lang] ?? de;

/** Parse an ISO date (YYYY-MM-DD) or full ISO string into a Date, or null. */
const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

export interface FormatDateOptions {
  /** Override the date-fns format pattern. */
  pattern?: string;
  /** Include the weekday in the default long format. */
  weekday?: boolean;
}

/**
 * Long, human date — e.g. "Samstag, 12. September 2026" (de) /
 * "Saturday, September 12, 2026" (en). Falls back to a sensible per-language
 * pattern when no explicit `pattern` is given.
 */
export function formatDate(
  iso: string | null | undefined,
  lang: Language,
  opts?: FormatDateOptions
): string {
  const d = toDate(iso);
  if (!d) return '';
  const locale = localeFor(lang);
  if (opts?.pattern) return format(d, opts.pattern, { locale });
  const base = lang === 'en' ? 'MMMM d, yyyy' : 'd. MMMM yyyy';
  const pattern = opts?.weekday ? `EEEE, ${base}` : base;
  return format(d, pattern, { locale });
}

/** Compact date — e.g. "12. Sep 2026" / "Sep 12, 2026". */
export function formatDateShort(
  iso: string | null | undefined,
  lang: Language
): string {
  const d = toDate(iso);
  if (!d) return '';
  const locale = localeFor(lang);
  const pattern = lang === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy';
  return format(d, pattern, { locale });
}

/**
 * Format a "HH:mm" time string. German/most EU locales use 24h ("19:30 Uhr"
 * style without the suffix here); English uses 12h ("7:30 PM").
 */
export function formatTime(
  hhmm: string | null | undefined,
  lang: Language
): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const ref = new Date();
  ref.setHours(h, m, 0, 0);
  const locale = localeFor(lang);
  const pattern = lang === 'en' ? 'h:mm a' : 'HH:mm';
  return format(ref, pattern, { locale });
}

interface RelativeStrings {
  today: string;
  tomorrow: string;
  yesterday: string;
  inDays: (n: number) => string;
  daysAgo: (n: number) => string;
  nextWeek: string;
  inWeeks: (n: number) => string;
  weeksAgo: (n: number) => string;
  nextMonth: string;
  inMonths: (n: number) => string;
  monthsAgo: (n: number) => string;
}

const RELATIVE: Record<Language, RelativeStrings> = {
  de: {
    today: 'Heute',
    tomorrow: 'Morgen',
    yesterday: 'Gestern',
    inDays: (n) => `In ${n} Tagen`,
    daysAgo: (n) => `Vor ${n} Tagen`,
    nextWeek: 'Nächste Woche',
    inWeeks: (n) => `In ${n} Wochen`,
    weeksAgo: (n) => `Vor ${n} Wochen`,
    nextMonth: 'Nächsten Monat',
    inMonths: (n) => `In ${n} Monaten`,
    monthsAgo: (n) => `Vor ${n} Monaten`,
  },
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    inDays: (n) => `In ${n} days`,
    daysAgo: (n) => `${n} days ago`,
    nextWeek: 'Next week',
    inWeeks: (n) => `In ${n} weeks`,
    weeksAgo: (n) => `${n} weeks ago`,
    nextMonth: 'Next month',
    inMonths: (n) => `In ${n} months`,
    monthsAgo: (n) => `${n} months ago`,
  },
  tr: {
    today: 'Bugün',
    tomorrow: 'Yarın',
    yesterday: 'Dün',
    inDays: (n) => `${n} gün içinde`,
    daysAgo: (n) => `${n} gün önce`,
    nextWeek: 'Gelecek hafta',
    inWeeks: (n) => `${n} hafta içinde`,
    weeksAgo: (n) => `${n} hafta önce`,
    nextMonth: 'Gelecek ay',
    inMonths: (n) => `${n} ay içinde`,
    monthsAgo: (n) => `${n} ay önce`,
  },
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    yesterday: 'Hier',
    inDays: (n) => `Dans ${n} jours`,
    daysAgo: (n) => `Il y a ${n} jours`,
    nextWeek: 'La semaine prochaine',
    inWeeks: (n) => `Dans ${n} semaines`,
    weeksAgo: (n) => `Il y a ${n} semaines`,
    nextMonth: 'Le mois prochain',
    inMonths: (n) => `Dans ${n} mois`,
    monthsAgo: (n) => `Il y a ${n} mois`,
  },
  es: {
    today: 'Hoy',
    tomorrow: 'Mañana',
    yesterday: 'Ayer',
    inDays: (n) => `En ${n} días`,
    daysAgo: (n) => `Hace ${n} días`,
    nextWeek: 'La próxima semana',
    inWeeks: (n) => `En ${n} semanas`,
    weeksAgo: (n) => `Hace ${n} semanas`,
    nextMonth: 'El próximo mes',
    inMonths: (n) => `En ${n} meses`,
    monthsAgo: (n) => `Hace ${n} meses`,
  },
};

/**
 * Localized relative label — "Heute" / "Today", "In 3 Wochen" / "In 3 weeks",
 * "Nächste Woche" / "Next week". Falls back to a formatted short date for
 * distances beyond a few months.
 */
export function relativeLabel(
  iso: string | null | undefined,
  lang: Language
): string {
  const d = toDate(iso);
  if (!d) return '';
  const strings = RELATIVE[lang] ?? RELATIVE.de;
  const now = startOfDay(new Date());
  const target = startOfDay(d);

  const days = differenceInCalendarDays(target, now);
  if (days === 0) return strings.today;
  if (days === 1) return strings.tomorrow;
  if (days === -1) return strings.yesterday;
  if (days > 1 && days < 7) return strings.inDays(days);
  if (days < -1 && days > -7) return strings.daysAgo(Math.abs(days));

  const weeks = differenceInCalendarWeeks(target, now, {
    locale: localeFor(lang),
  });
  if (weeks === 1) return strings.nextWeek;
  if (weeks > 1 && weeks < 5) return strings.inWeeks(weeks);
  if (weeks <= -1 && weeks > -5) return strings.weeksAgo(Math.abs(weeks));

  const months = differenceInCalendarMonths(target, now);
  if (months === 1) return strings.nextMonth;
  if (months > 1 && months <= 12) return strings.inMonths(months);
  if (months === -1) return strings.monthsAgo(1);
  if (months < -1 && months >= -12) return strings.monthsAgo(Math.abs(months));

  return formatDateShort(iso, lang);
}
