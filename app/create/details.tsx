import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { MapView } from '@/components/ui/MapView';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { WizardHeader } from '@/components/ui/WizardHeader';
import type { EventLocation } from '@/lib/data/types';
import { useDraft, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatDate, formatTime } from '@/lib/utils/format';

const pad = (n: number): string => String(n).padStart(2, '0');
const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHmm = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Parse a stored ISO date (YYYY-MM-DD) into a Date for the picker. */
const dateFromIso = (iso: string | null): Date => {
  if (iso) {
    const [y, m, d] = iso.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
};

/** Parse a stored "HH:mm" into a Date for the picker. */
const dateFromHHmm = (hhmm: string | null): Date => {
  const ref = new Date();
  if (hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) ref.setHours(h, m, 0, 0);
  }
  return ref;
};

/**
 * Wizard step 2/4 — event details. Captures name, date, time, location and
 * description into the draft (CONTRACT §2, §7). Matches `event_details_new_font`.
 */
export default function DetailsScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const { language } = useProfile();
  const updateDraft = useStore((s) => s.updateDraft);
  const cancelDraft = useStore((s) => s.cancelDraft);

  // iOS renders the picker inline; Android uses the imperative dialog.
  const [iosPicker, setIosPicker] = useState<'date' | 'time' | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const handleCancel = () => {
    cancelDraft();
    router.replace('/(tabs)');
  };

  if (!draft) {
    return (
      <Screen>
        <WizardHeader onBack={() => router.back()} onCancel={handleCancel} />
        <View className="flex-1 items-center justify-center px-5">
          <Text variant="body-lg" color="on-surface-variant" className="text-center">
            {t('errors.generic')}
          </Text>
          <View className="mt-6 w-full">
            <Button
              label={t('common.back')}
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const dateUndecided = draft.dateUndecided;

  const commitDate = (d: Date) => updateDraft({ date: toIsoDate(d) });
  const commitTime = (d: Date) => updateDraft({ time: toHHmm(d) });

  const onAndroidChange =
    (mode: 'date' | 'time') => (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type !== 'set' || !selected) return;
      if (mode === 'date') commitDate(selected);
      else commitTime(selected);
    };

  const openDate = () => {
    if (dateUndecided) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateFromIso(draft.date),
        mode: 'date',
        onChange: onAndroidChange('date'),
      });
    } else {
      setIosPicker('date');
    }
  };

  const openTime = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateFromHHmm(draft.time),
        mode: 'time',
        is24Hour: language !== 'en',
        onChange: onAndroidChange('time'),
      });
    } else {
      setIosPicker('time');
    }
  };

  const onIosChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    if (iosPicker === 'date') commitDate(selected);
    else if (iosPicker === 'time') commitTime(selected);
  };

  const toggleUndecided = () => {
    // When the date becomes undecided, clear any picked date.
    updateDraft({ dateUndecided: !dateUndecided, ...(!dateUndecided ? { date: null } : {}) });
  };

  const dateDisplay = dateUndecided ? '' : formatDate(draft.date, language);
  const timeDisplay = formatTime(draft.time, language);

  const onNext = () => {
    if (draft.dateUndecided) router.push('/create/poll');
    else router.push('/create/design');
  };

  const hasPin = draft.location?.lat != null && draft.location?.lng != null;

  /** Apply a map-picked location, keeping a user-typed name if present. */
  const onSelectLocation = (loc: EventLocation) => {
    const keepName = draft.location?.name?.trim();
    updateDraft({ location: { ...loc, name: keepName || loc.name } });
  };

  /** Drop the GPS pin but keep the typed name (or clear if there is none). */
  const removePin = () =>
    updateDraft({ location: draft.location?.name ? { name: draft.location.name } : null });

  return (
    <Screen
      scroll
      contentClassName="pb-10"
      footer={
        <View
          className="border-t border-surface-variant bg-background px-5 pb-6 pt-4"
        >
          <Button label={t('common.next')} rightIcon="arrow_forward" onPress={onNext} />
        </View>
      }
    >
      <WizardHeader onBack={() => router.back()} onCancel={handleCancel} />

      <View className="px-5">
        {/* Progress */}
        <View className="mb-8">
          <Text variant="label-sm" color="outline" className="mb-3 uppercase">
            {t('wizard.stepOf', { current: 2, total: 4 })} · {t('wizard.step2')}
          </Text>
          <ProgressBar value={0.5} />
        </View>

        {/* Heading */}
        <Text variant="headline-xl-mobile" color="on-surface">
          {t('details.title')}
        </Text>
        <Text variant="body-lg" color="on-surface-variant" className="mt-2 mb-8">
          {t('details.subtitle')}
        </Text>

        {/* Form */}
        <View className="gap-6">
          {/* Name */}
          <Input
            label={t('details.nameLabel')}
            value={draft.title}
            onChangeText={(text) => updateDraft({ title: text })}
            placeholder={t('details.namePlaceholder')}
            icon="celebration"
            autoCapitalize="sentences"
          />

          {/* Date + Time */}
          <View className="flex-row gap-4">
            <Pressable
              className="flex-1"
              onPress={openDate}
              disabled={dateUndecided}
              accessibilityRole="button"
              accessibilityLabel={t('details.dateLabel')}
              accessibilityValue={dateDisplay ? { text: dateDisplay } : undefined}
              style={dateUndecided ? { opacity: 0.5 } : undefined}
            >
              <View pointerEvents="none">
                <Input
                  label={t('details.dateLabel')}
                  value={dateDisplay}
                  onChangeText={() => {}}
                  editable={false}
                  placeholder={t('details.datePlaceholder')}
                  icon="calendar_today"
                />
              </View>
            </Pressable>

            <Pressable
              className="flex-1"
              onPress={openTime}
              accessibilityRole="button"
              accessibilityLabel={t('details.timeLabel')}
              accessibilityValue={timeDisplay ? { text: timeDisplay } : undefined}
            >
              <View pointerEvents="none">
                <Input
                  label={t('details.timeLabel')}
                  value={timeDisplay}
                  onChangeText={() => {}}
                  editable={false}
                  placeholder={t('details.timePlaceholder')}
                  icon="schedule"
                />
              </View>
            </Pressable>
          </View>

          {/* iOS inline picker */}
          {Platform.OS === 'ios' && iosPicker ? (
            <View className="items-center rounded-xl border border-surface-variant bg-surface-container-lowest p-2">
              <DateTimePicker
                value={
                  iosPicker === 'date'
                    ? dateFromIso(draft.date)
                    : dateFromHHmm(draft.time)
                }
                mode={iosPicker}
                display="spinner"
                is24Hour={language !== 'en'}
                onChange={onIosChange}
              />
              <Button
                label={t('common.done')}
                variant="ghost"
                size="md"
                onPress={() => setIosPicker(null)}
              />
            </View>
          ) : null}

          {/* Date-undecided toggle */}
          <Pressable
            onPress={toggleUndecided}
            accessibilityRole="switch"
            accessibilityState={{ checked: dateUndecided }}
            accessibilityLabel={t('details.dateUndecided')}
            className="flex-row items-center justify-between rounded-xl border border-surface-variant bg-surface-container-lowest px-4 py-4"
          >
            <Text variant="body-md" color="on-surface-variant" className="flex-1 pr-3">
              {t('details.dateUndecided')}
            </Text>
            <View
              className={[
                'h-7 w-12 justify-center rounded-full px-0.5',
                dateUndecided ? 'bg-primary-container' : 'bg-surface-variant',
              ].join(' ')}
            >
              <View
                className={[
                  'h-6 w-6 rounded-full bg-surface-container-lowest',
                  dateUndecided ? 'self-end' : 'self-start',
                ].join(' ')}
              />
            </View>
          </Pressable>

          {/* Location */}
          <View className="gap-3">
            <Input
              label={t('details.locationLabel')}
              value={draft.location?.name ?? ''}
              onChangeText={(text) =>
                updateDraft({ location: { ...(draft.location ?? {}), name: text } })
              }
              placeholder={t('details.locationPlaceholder')}
              icon="location_on"
              autoCapitalize="sentences"
            />

            {hasPin ? (
              <View className="overflow-hidden rounded-2xl border border-surface-variant">
                <MapView
                  lat={draft.location!.lat!}
                  lng={draft.location!.lng!}
                  height={140}
                  zoom={15}
                />
                <View className="flex-row items-center gap-2 bg-surface-container-lowest px-4 py-3">
                  <Icon name="place" size={18} color="primary" />
                  <Text
                    variant="body-sm"
                    color="on-surface-variant"
                    numberOfLines={1}
                    className="flex-1"
                  >
                    {draft.location?.address ?? t('location.onMap')}
                  </Text>
                  <Pressable
                    onPress={removePin}
                    accessibilityRole="button"
                    accessibilityLabel={t('location.removePin')}
                    hitSlop={8}
                  >
                    <Icon name="close" size={18} color="on-surface-variant" />
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Button
              label={hasPin ? t('location.title') : t('location.pickOnMap')}
              variant="secondary"
              leftIcon="map"
              onPress={() => setMapOpen(true)}
            />
          </View>

          {/* Description */}
          <Input
            label={`${t('details.descriptionLabel')} (${t('common.optional')})`}
            value={draft.description}
            onChangeText={(text) => updateDraft({ description: text })}
            placeholder={t('details.descriptionPlaceholder')}
            icon="notes"
            multiline
            autoCapitalize="sentences"
          />
        </View>
      </View>

      <LocationPickerModal
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={onSelectLocation}
        initial={draft.location}
      />
    </Screen>
  );
}
