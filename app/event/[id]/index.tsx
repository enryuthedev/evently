/**
 * Event hub — the host command center for a single event. A calm overview that
 * surfaces the invitation, RSVP pulse, the next few tasks, and quick links to
 * the management screens, with progressive disclosure by event mode.
 * See CONTRACT.md §2 (routes), §7 (store), §11 (progressive disclosure).
 */
import { Fragment } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { StatPill } from '@/components/ui/StatPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { LocationBlock } from '@/components/ui/LocationBlock';
import { InvitationCard } from '@/components/invitation/InvitationCard';

import {
  useChecklist,
  useEvent,
  useProfile,
  useRSVPSummary,
} from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { usePublishEvent } from '@/lib/store/usePublish';
import { buildRsvpUrl, shareEvent } from '@/lib/utils/share';
import { formatDate, relativeLabel } from '@/lib/utils/format';
import type { EventMode } from '@/lib/data/types';

interface HubAction {
  key: string;
  icon: string;
  /** i18n key under eventHub.* */
  label: string;
  /** Modes this action is offered in. */
  modes: EventMode[];
  /** When set, only show if event.dateUndecided. */
  requiresUndecided?: boolean;
  onPress: () => void;
}

export default function EventHubScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const rsvp = useRSVPSummary(id);
  const checklist = useChecklist(id);
  const lang = useProfile().language;
  const deleteEvent = useStore((s) => s.deleteEvent);
  const publish = usePublishEvent();

  if (!event) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <EmptyState
            icon="event_busy"
            title={t('events.empty')}
            message={t('events.emptyMsg')}
            actionLabel={t('common.back')}
            onAction={() => router.replace('/(tabs)')}
          />
        </View>
      </Screen>
    );
  }

  const onDelete = () => {
    Alert.alert(t('eventHub.deleteEvent'), t('eventHub.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteEvent(event.id);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const dateLabel = event.date
    ? formatDate(event.date, lang, { weekday: true })
    : t('details.dateUndecided');
  const relLabel = event.date ? relativeLabel(event.date, lang) : null;

  const undoneTasks = checklist.filter((c) => !c.done).slice(0, 3);
  const showTasks = event.mode !== 'quick';

  const actions: HubAction[] = [
    {
      key: 'shareInvite',
      icon: 'ios_share',
      label: 'shareInvite',
      modes: ['quick', 'special', 'wedding'],
      onPress: async () => {
        const url = await publish(event);
        void shareEvent(event, { lang, url });
      },
    },
    {
      key: 'viewGuests',
      icon: 'group',
      label: 'viewGuests',
      modes: ['quick', 'special', 'wedding'],
      onPress: () => router.push(`/event/${event.id}/guests`),
    },
    {
      key: 'poll',
      icon: 'how_to_vote',
      label: 'poll',
      modes: ['quick', 'special', 'wedding'],
      requiresUndecided: true,
      onPress: () => router.push(`/event/${event.id}/poll`),
    },
    {
      key: 'schedule',
      icon: 'schedule',
      label: 'schedule',
      modes: ['special', 'wedding'],
      onPress: () => router.push(`/event/${event.id}/timeline`),
    },
    {
      key: 'checklist',
      icon: 'checklist',
      label: 'checklist',
      modes: ['special', 'wedding'],
      onPress: () => router.push(`/event/${event.id}/checklist`),
    },
    {
      key: 'bringList',
      icon: 'redeem',
      label: 'bringList',
      modes: ['quick', 'wedding'],
      onPress: () => router.push(`/event/${event.id}/bring`),
    },
    {
      key: 'printCard',
      icon: 'print',
      label: 'printCard',
      modes: ['quick', 'special', 'wedding'],
      onPress: () => router.push(`/event/${event.id}/print`),
    },
  ];

  const visibleActions = actions.filter(
    (a) =>
      a.modes.includes(event.mode) &&
      (!a.requiresUndecided || event.dateUndecided),
  );

  return (
    <Screen scroll contentClassName="px-5 pb-12">
      {/* Top bar */}
      <View className="flex-row items-center justify-between py-2">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
        />
        <Text
          variant="label-md"
          color="on-surface"
          numberOfLines={1}
          className="mx-2 flex-1 text-center"
        >
          {event.title}
        </Text>
        <IconButton
          name="delete_outline"
          onPress={onDelete}
          accessibilityLabel={t('eventHub.deleteEvent')}
        />
      </View>

      {/* Title + date */}
      <View className="mt-2">
        <Text variant="headline-lg" color="on-surface">
          {event.title}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Icon name="calendar_today" size={18} color="primary" />
          <Text
            variant="body-md"
            color="on-surface-variant"
            numberOfLines={1}
            ellipsizeMode="tail"
            className="flex-shrink"
          >
            {dateLabel}
          </Text>
          {relLabel ? (
            <View className="shrink-0 rounded-full bg-primary-container/20 px-2.5 py-0.5">
              <Text variant="label-sm" color="primary">
                {relLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Location with map + directions */}
      {event.location ? (
        <View className="mt-6">
          <LocationBlock location={event.location} />
        </View>
      ) : null}

      {/* Invitation preview */}
      <View className="mt-7 items-center">
        <Pressable
          onPress={() => router.push(`/event/${event.id}/print`)}
          accessibilityRole="button"
          accessibilityLabel={t('eventHub.invitationPreview')}
          className="active:opacity-90"
        >
          <InvitationCard
            design={event.invitation}
            event={event}
            size="md"
            lang={lang}
            showQr={event.invitation.showQr}
            qrValue={buildRsvpUrl(event.shareToken ?? event.id)}
          />
        </Pressable>
        <Text variant="label-sm" color="on-surface-variant" className="mt-3 uppercase">
          {t('eventHub.invitationPreview')}
        </Text>
      </View>

      {/* RSVP status */}
      <View className="mt-8">
        <Text variant="headline-md" color="on-surface">
          {t('eventHub.rsvpStatus')}
        </Text>
        <View className="mt-3 flex-row gap-2">
          <StatPill value={rsvp.yes} label={t('status.yes')} tone="yes" className="flex-1" />
          <StatPill value={rsvp.maybe} label={t('status.maybe')} tone="maybe" className="flex-1" />
          <StatPill value={rsvp.no} label={t('status.no')} tone="no" className="flex-1" />
          <StatPill
            value={rsvp.pending}
            label={t('status.pending')}
            tone="pending"
            className="flex-1"
          />
        </View>
      </View>

      {/* Next tasks (special / wedding only) */}
      {showTasks ? (
        <View className="mt-8">
          <Text variant="headline-md" color="on-surface">
            {t('eventHub.nextTasks')}
          </Text>
          <Card className="mt-3" padded={false}>
            {undoneTasks.length > 0 ? (
              <View className="px-5">
                {undoneTasks.map((task, i) => (
                  <Fragment key={task.id}>
                    {i > 0 ? <View className="h-px bg-surface-variant" /> : null}
                    <ListRow
                      title={task.title}
                      onPress={() => router.push(`/event/${event.id}/checklist`)}
                      left={
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-container/20">
                          <Icon name="radio_button_unchecked" size={20} color="primary" />
                        </View>
                      }
                      right={<Icon name="chevron_right" size={22} color="on-surface-variant" />}
                    />
                  </Fragment>
                ))}
              </View>
            ) : (
              <View className="px-5 py-6 items-center">
                <Text variant="body-md" color="on-surface-variant">
                  {t('checklist.empty')}
                </Text>
              </View>
            )}
          </Card>
        </View>
      ) : null}

      {/* Action list */}
      <View className="mt-8">
        <Card className="mt-1" padded={false}>
          <View className="px-5">
            {visibleActions.map((action, i) => (
              <Fragment key={action.key}>
                {i > 0 ? <View className="h-px bg-surface-variant" /> : null}
                <ListRow
                  title={t(`eventHub.${action.label}`)}
                  onPress={action.onPress}
                  left={
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                      <Icon name={action.icon} size={22} color="primary" />
                    </View>
                  }
                  right={
                    <Icon name="chevron_right" size={22} color="on-surface-variant" />
                  }
                />
              </Fragment>
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}
