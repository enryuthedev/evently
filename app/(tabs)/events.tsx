import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';

import { useEvents, useProfile, useRSVPSummary } from '@/lib/store/selectors';
import type { EventModel } from '@/lib/data/types';
import { formatDate, relativeLabel } from '@/lib/utils/format';
import { occasionMeta } from '@/lib/utils/occasions';

/** YYYY-MM-DD for the start of today, used to split upcoming vs. past. */
function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Single event card — mirrors the dashboard "Active Events" card layout. */
function EventCard({ event, past }: { event: EventModel; past?: boolean }) {
  const { t } = useTranslation();
  const { language } = useProfile();
  const summary = useRSVPSummary(event.id);
  const meta = occasionMeta(event.occasion);

  const dateText = event.date
    ? formatDate(event.date, language)
    : t('details.dateUndecided');
  const pillLabel = event.date
    ? relativeLabel(event.date, language)
    : t('details.dateUndecided');

  return (
    <Card
      onPress={() => router.push(`/event/${event.id}`)}
      accessibilityLabel={event.title}
      className="gap-4"
    >
      {/* Top row: relative-date pill + occasion icon */}
      <View className="flex-row items-start justify-between">
        <View
          className={[
            'mr-3 max-w-[70%] shrink flex-row items-center gap-2 rounded-full px-3 py-1',
            past ? 'bg-surface-container' : 'bg-primary-container/20',
          ].join(' ')}
        >
          <View
            className={[
              'h-1.5 w-1.5 shrink-0 rounded-full',
              past ? 'bg-outline' : 'bg-primary',
            ].join(' ')}
          />
          <Text
            variant="label-sm"
            color={past ? 'on-surface-variant' : 'on-primary-container'}
            numberOfLines={1}
          >
            {pillLabel}
          </Text>
        </View>
        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low">
          <Icon name={meta.icon} size={20} color="primary" />
        </View>
      </View>

      {/* Title + date */}
      <View className="gap-1">
        <Text variant="headline-md" color="on-background" numberOfLines={2}>
          {event.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <Icon name="calendar_month" size={18} color="on-surface-variant" />
          <Text variant="body-md" color="on-surface-variant">
            {dateText}
          </Text>
        </View>
      </View>

      {/* Footer stats */}
      <View className="mt-1 flex-row items-center justify-between border-t border-surface-variant pt-4">
        <View className="shrink">
          <Text variant="label-sm" color="outline">
            {t('events.invitedLabel').toUpperCase()}
          </Text>
          <Text variant="label-md" color="on-surface" numberOfLines={1}>
            {t('dashboard.guestsInvited', { count: summary.total })}
          </Text>
        </View>
        <View className="shrink-0 items-end pl-3">
          <Text variant="label-sm" color="outline">
            {t('status.yes').toUpperCase()}
          </Text>
          <Text variant="label-md" color="primary" numberOfLines={1}>
            {t('dashboard.confirmed', { count: summary.yes })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function EventsScreen() {
  const { t } = useTranslation();
  const events = useEvents();

  const { upcoming, past } = useMemo(() => {
    const today = todayIso();
    const up: EventModel[] = [];
    const pa: EventModel[] = [];
    for (const e of events) {
      // Events with no decided date count as upcoming.
      if (!e.date || e.date >= today) up.push(e);
      else pa.push(e);
    }
    // Upcoming: undecided first, then ascending by date.
    up.sort((a, b) => {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return a.date.localeCompare(b.date);
    });
    // Past: most recent first.
    pa.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    return { upcoming: up, past: pa };
  }, [events]);

  const isEmpty = events.length === 0;

  return (
    <Screen scroll contentClassName="px-5 pt-2 pb-28">
      <AppHeader title={t('events.title')} />

      <View className="mt-2">
        <Button
          label={t('dashboard.newEvent')}
          leftIcon="add"
          onPress={() => router.push('/create/occasion')}
        />
      </View>

      {isEmpty ? (
        <EmptyState
          icon="celebration"
          title={t('events.empty')}
          message={t('events.emptyMsg')}
          actionLabel={t('dashboard.newEvent')}
          onAction={() => router.push('/create/occasion')}
          className="mt-16"
        />
      ) : (
        <View className="mt-8 gap-10">
          {upcoming.length > 0 ? (
            <View className="gap-4">
              <Text variant="headline-md" color="on-background">
                {t('events.upcoming')}
              </Text>
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </View>
          ) : null}

          {past.length > 0 ? (
            <View className="gap-4">
              <Text variant="headline-md" color="on-background">
                {t('events.past')}
              </Text>
              {past.map((e) => (
                <EventCard key={e.id} event={e} past />
              ))}
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
