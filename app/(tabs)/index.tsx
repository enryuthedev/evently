import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import type { EventModel, Language } from '@/lib/data/types';
import { useEvents, useProfile, useRSVPSummary } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatDate, relativeLabel } from '@/lib/utils/format';

interface EventCardProps {
  event: EventModel;
  lang: Language;
}

/** A single tappable event card with status pill, date row and RSVP footer. */
function EventCard({ event, lang }: EventCardProps) {
  const { t } = useTranslation();
  const rsvp = useRSVPSummary(event.id);

  const statusLabel = event.date
    ? relativeLabel(event.date, lang)
    : t('details.dateUndecided');
  const dateLabel = event.date
    ? formatDate(event.date, lang)
    : t('details.dateUndecided');

  return (
    <Card onPress={() => router.push(`/event/${event.id}`)} className="gap-4">
      {/* Status pill */}
      <View className="flex-row items-center self-start gap-2 rounded-full bg-primary-container/20 px-3 py-1">
        <View className="h-1.5 w-1.5 rounded-full bg-primary" />
        <Text variant="label-sm" color="on-primary-container">
          {statusLabel}
        </Text>
      </View>

      {/* Title + date */}
      <View className="gap-1">
        <Text
          variant="headline-md"
          color="on-background"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {event.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <Icon name="calendar_month" size={18} color="on-surface-variant" />
          <Text variant="body-md" color="on-surface-variant">
            {dateLabel}
          </Text>
        </View>
      </View>

      {/* Footer: invited / confirmed */}
      <View className="mt-1 flex-row items-center justify-between gap-3 border-t border-surface-variant pt-4">
        <View className="flex-shrink gap-0.5">
          <Text variant="label-sm" color="outline" numberOfLines={1}>
            {t('guests.title')}
          </Text>
          <Text variant="label-md" color="on-surface" numberOfLines={1}>
            {t('dashboard.guestsInvited', { count: rsvp.total })}
          </Text>
        </View>
        <View className="flex-shrink items-end gap-0.5">
          <Text variant="label-sm" color="outline" numberOfLines={1}>
            {t('eventHub.rsvpStatus')}
          </Text>
          <Text variant="label-md" color="primary" numberOfLines={1}>
            {t('dashboard.confirmed', { count: rsvp.yes })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** A square quick-action tile with a soft icon circle. */
function QuickAction({ icon, label, onPress, disabled = false }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={[
        'w-[48%] items-center gap-3 rounded-2xl border border-surface-variant bg-surface-container-lowest p-5',
        disabled ? 'opacity-50' : 'active:opacity-90',
      ].join(' ')}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container-low">
        <Icon name={icon} size={28} color="primary" />
      </View>
      <Text
        variant="label-md"
        color="on-surface"
        numberOfLines={2}
        className="text-center"
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const profile = useProfile();
  const events = useEvents();
  const startDraft = useStore((s) => s.startDraft);
  const updateDraft = useStore((s) => s.updateDraft);
  const lang = profile.language;

  const firstEvent = events[0];

  const goCreate = () => router.push('/create/occasion');

  // Jump straight into the invitation designer with a fresh draft, skipping the
  // generic occasion picker so the tile actually opens the designer flow.
  const goDesign = () => {
    startDraft('special');
    router.push('/create/design');
  };

  // Seed a date-poll draft (dateUndecided) and open the poll setup step so the
  // tile leads to date voting rather than the generic create wizard.
  const goPoll = () => {
    startDraft('special');
    updateDraft({ dateUndecided: true });
    router.push('/create/poll');
  };

  return (
    <Screen scroll contentClassName="pb-10">
      <AppHeader
        showLogo
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      {/* Greeting + primary action */}
      <View className="gap-6 px-5 pt-2">
        <View className="gap-2">
          <Text variant="headline-xl-mobile" color="on-background">
            {t('dashboard.greeting', { name: profile.name })}
          </Text>
          <Text variant="body-lg" color="on-surface-variant">
            {t('dashboard.subtitle')}
          </Text>
        </View>

        <Button
          label={t('dashboard.newEvent')}
          leftIcon="add"
          onPress={goCreate}
        />
      </View>

      {/* Active events */}
      <View className="mt-8 gap-4 px-5">
        <SectionHeader
          title={t('dashboard.activeEvents')}
          actionLabel={t('common.seeAll')}
          onActionPress={() => router.push('/(tabs)/events')}
        />

        {events.length === 0 ? (
          <Card padded elevated={false} className="px-0 py-2">
            <EmptyState
              icon="celebration"
              title={t('dashboard.emptyTitle')}
              message={t('dashboard.emptyMsg')}
              actionLabel={t('dashboard.newEvent')}
              onAction={goCreate}
            />
          </Card>
        ) : (
          <View className="gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} lang={lang} />
            ))}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View className="mt-8 gap-4 px-5">
        <Text variant="headline-md" color="on-background">
          {t('dashboard.quickActions')}
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          <QuickAction
            icon="diversity_3"
            label={t('dashboard.quickMeet')}
            onPress={goCreate}
          />
          <QuickAction
            icon="drafts"
            label={t('dashboard.designInvite')}
            onPress={goDesign}
          />
          <QuickAction
            icon="event_available"
            label={t('dashboard.pollDate')}
            onPress={goPoll}
          />
          <QuickAction
            icon="print"
            label={t('dashboard.printCard')}
            disabled={!firstEvent}
            onPress={() => {
              if (firstEvent) router.push(`/event/${firstEvent.id}/print`);
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
