import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEvent, useGuests, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatDate, formatTime } from '@/lib/utils/format';
import { shadows } from '@/lib/theme/tokens';

/** Stable demo voter id — represents the current host's own availability. */
const VOTER_ID = 'me';

const pad = (n: number): string => String(n).padStart(2, '0');
const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHMM = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Date voting for an existing event (termin_abstimmen). */
export default function EventPollScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';

  const event = useEvent(eventId);
  const guests = useGuests(eventId);
  const { language } = useProfile();

  const addDateOption = useStore((s) => s.addDateOption);
  const removeDateOption = useStore((s) => s.removeDateOption);
  const toggleVote = useStore((s) => s.toggleVote);
  const finalizePoll = useStore((s) => s.finalizePoll);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [iosStage, setIosStage] = useState<'date' | 'time' | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  if (!event) {
    return (
      <Screen contentClassName="justify-center">
        <EmptyState icon="event_busy" title={t('errors.generic')} />
      </Screen>
    );
  }

  const options = event.poll.options;
  const total = guests.length || 1;

  // Best option = most votes (first wins ties). Drives the highlight + default pick.
  const bestId =
    options.length > 0
      ? options.reduce((best, o) => (o.votes.length > best.votes.length ? o : best), options[0]).id
      : null;
  const activeId = selectedId ?? bestId;

  const finalizedOption = event.poll.finalizedOptionId
    ? options.find((o) => o.id === event.poll.finalizedOptionId)
    : undefined;
  const isDecided = !!event.poll.finalizedOptionId || !event.dateUndecided;

  const bannerDate = finalizedOption
    ? `${formatDate(finalizedOption.date, language, { weekday: true })}${
        finalizedOption.time ? ` · ${formatTime(finalizedOption.time, language)}` : ''
      }`
    : `${formatDate(event.date, language, { weekday: true })}${
        event.time ? ` · ${formatTime(event.time, language)}` : ''
      }`;

  const commitOption = (date: Date, time: Date | null) => {
    addDateOption(eventId, toISODate(date), time ? toHHMM(time) : undefined);
  };

  const openAndroidPicker = () => {
    const base = new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (e: DateTimePickerEvent, selectedDate?: Date) => {
        if (e.type !== 'set' || !selectedDate) return;
        const chosen = selectedDate;
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          is24Hour: true,
          onChange: (te: DateTimePickerEvent, selectedTime?: Date) => {
            if (te.type !== 'set') {
              commitOption(chosen, null);
              return;
            }
            commitOption(chosen, selectedTime ?? null);
          },
        });
      },
    });
  };

  const handleAddProposal = () => {
    if (Platform.OS === 'android') {
      openAndroidPicker();
    } else {
      setPickerDate(new Date());
      setPendingDate(null);
      setIosStage('date');
    }
  };

  const onIosChange = (_e: DateTimePickerEvent, value?: Date) => {
    if (value) setPickerDate(value);
  };

  const onIosNext = () => {
    if (iosStage === 'date') {
      setPendingDate(pickerDate);
      setIosStage('time');
    } else if (iosStage === 'time') {
      commitOption(pendingDate ?? pickerDate, pickerDate);
      setIosStage(null);
      setPendingDate(null);
    }
  };

  const handleSetDate = () => {
    if (!activeId) return;
    finalizePoll(eventId, activeId);
    router.back();
  };

  return (
    <Screen
      scroll
      contentClassName="pb-8"
      footer={
        options.length > 0 ? (
          <View className="border-t border-surface-variant bg-background px-5 pb-6 pt-3">
            <Button
              label={t('poll.setDate')}
              rightIcon="arrow_forward"
              onPress={handleSetDate}
              disabled={!activeId}
            />
          </View>
        ) : undefined
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center gap-1 px-3 py-2">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
        />
        <Text variant="headline-md" color="on-background">
          {t('poll.title')}
        </Text>
      </View>

      <View className="px-5">
        <Text variant="body-md" color="on-surface-variant" className="mb-6">
          {t('poll.subtitle')}
        </Text>

        {/* Finalized / decided banner */}
        {isDecided ? (
          <View
            className="mb-6 flex-row items-center rounded-2xl border border-primary-container bg-primary-container/15 p-4"
            style={shadows.card}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-container/30">
              <Icon name="event_available" size={24} color="primary" />
            </View>
            <View className="ml-3 flex-1">
              <Text variant="label-sm" color="primary" className="uppercase">
                {t('poll.finalized')}
              </Text>
              <Text variant="body-md" color="on-background" className="mt-0.5">
                {bannerDate}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Options */}
        {options.length === 0 ? (
          <EmptyState
            icon="event"
            title={t('poll.proposals')}
            message={t('poll.subtitle')}
            actionLabel={t('poll.addProposal')}
            onAction={handleAddProposal}
          />
        ) : (
          <>
            <Text variant="label-md" color="on-surface-variant" className="mb-3">
              {t('poll.proposals')}
            </Text>

            <View className="gap-4">
              {options.map((option) => {
                const isBest = option.id === bestId && option.votes.length > 0;
                const isActive = option.id === activeId;
                const hasVoted = option.votes.includes(VOTER_ID);
                const ratio = option.votes.length / total;
                const optionLabel = formatDate(option.date, language, { weekday: true });
                const isFinalizedOption = option.id === event.poll.finalizedOptionId;

                return (
                  <Card
                    key={option.id}
                    onPress={() => setSelectedId(option.id)}
                    accessibilityLabel={optionLabel}
                    className={
                      isActive ? 'border-2 border-primary-container' : undefined
                    }
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="min-w-0 flex-1 pr-3">
                        {isBest ? (
                          <View className="mb-2 flex-row items-center self-start rounded-full bg-primary-container/20 px-2.5 py-1">
                            <Icon name="star" size={14} color="primary" />
                            <Text variant="label-sm" color="primary" className="ml-1 uppercase">
                              {t('poll.bestTime')}
                            </Text>
                          </View>
                        ) : null}

                        <Text
                          variant="headline-md"
                          color="on-background"
                          className="mb-1"
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {optionLabel}
                        </Text>
                        <Text variant="body-md" color="on-surface-variant">
                          {option.time
                            ? t('poll.timeSuffix', {
                                time: formatTime(option.time, language),
                              })
                            : t('common.optional')}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1">
                        {/* Vote toggle */}
                        <Pressable
                          onPress={() => toggleVote(eventId, option.id, VOTER_ID)}
                          accessibilityRole="button"
                          accessibilityLabel={t('poll.toggleVote', { date: optionLabel })}
                          accessibilityState={{ selected: hasVoted }}
                          hitSlop={8}
                          className={[
                            'h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-70',
                            hasVoted
                              ? 'border-primary-container bg-primary-container/20'
                              : 'border-surface-variant bg-transparent',
                          ].join(' ')}
                        >
                          <Icon
                            name={hasVoted ? 'check' : 'radio_button_unchecked'}
                            size={24}
                            color={hasVoted ? 'primary' : 'on-surface-variant'}
                          />
                        </Pressable>

                        {/* Delete proposal — hidden for the finalized option */}
                        {!isFinalizedOption ? (
                          <IconButton
                            name="delete"
                            size={20}
                            onPress={() => removeDateOption(eventId, option.id)}
                            accessibilityLabel={t('common.delete')}
                          />
                        ) : null}
                      </View>
                    </View>

                    {/* Vote count + progress */}
                    <View className="mt-4">
                      <View className="mb-1.5 flex-row items-center">
                        <Icon name="group" size={16} color="on-surface-variant" />
                        <Text variant="label-md" color="on-surface-variant" className="ml-1.5">
                          {t('poll.canCount', { yes: option.votes.length, total })}
                        </Text>
                      </View>
                      <ProgressBar value={ratio} />
                    </View>
                  </Card>
                );
              })}
            </View>

            <View className="mt-6">
              <Button
                label={t('poll.addProposal')}
                variant="outline"
                leftIcon="add"
                onPress={handleAddProposal}
              />
            </View>
          </>
        )}
      </View>

      {/* iOS inline spinner picker */}
      {Platform.OS === 'ios' && iosStage ? (
        <Modal transparent animationType="slide" visible onRequestClose={() => setIosStage(null)}>
          <View className="flex-1 justify-end bg-black/30">
            <View
              className="rounded-t-3xl bg-surface-container-lowest px-5 pb-10 pt-5"
              style={shadows.hero}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label-md" color="on-surface-variant">
                  {iosStage === 'date' ? t('details.dateLabel') : t('details.timeLabel')}
                </Text>
                <IconButton
                  name="close"
                  onPress={() => setIosStage(null)}
                  accessibilityLabel={t('common.close')}
                />
              </View>

              <DateTimePicker
                value={pickerDate}
                mode={iosStage === 'date' ? 'date' : 'time'}
                display="spinner"
                is24Hour
                onChange={onIosChange}
              />

              <Button
                label={iosStage === 'date' ? t('common.next') : t('common.done')}
                onPress={onIosNext}
                className="mt-4"
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
}
