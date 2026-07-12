import { useState } from 'react';
import { Modal, Platform, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { WizardHeader } from '@/components/ui/WizardHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDraft, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatDate, formatTime } from '@/lib/utils/format';
import { shadows } from '@/lib/theme/tokens';

const pad = (n: number): string => String(n).padStart(2, '0');
const toISODate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHMM = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Wizard step 3/4 — propose date options for the event poll (creation setup). */
export default function PollScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const { language } = useProfile();
  const addDraftDateOption = useStore((s) => s.addDraftDateOption);
  const removeDraftDateOption = useStore((s) => s.removeDraftDateOption);
  const cancelDraft = useStore((s) => s.cancelDraft);

  // iOS uses a state-driven inline spinner; Android uses the imperative dialog.
  const [iosStage, setIosStage] = useState<'date' | 'time' | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const commitOption = (date: Date, time: Date | null) => {
    addDraftDateOption(toISODate(date), time ? toHHMM(time) : undefined);
  };

  const openAndroidPicker = () => {
    const base = new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type !== 'set' || !selectedDate) return;
        const chosenDate = selectedDate;
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, selectedTime?: Date) => {
            if (timeEvent.type !== 'set') {
              commitOption(chosenDate, null);
              return;
            }
            commitOption(chosenDate, selectedTime ?? null);
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
      setIosStage('date');
    }
  };

  const onIosChange = (_event: DateTimePickerEvent, value?: Date) => {
    if (value) setPickerDate(value);
  };

  const onIosNext = () => {
    if (iosStage === 'date') {
      setIosStage('time');
    } else if (iosStage === 'time') {
      commitOption(pickerDate, pickerDate);
      setIosStage(null);
    }
  };

  // iOS: add the option with a date only (time undecided), mirroring the
  // Android "dismiss time dialog" path so the optional-time state is reachable.
  const onIosSkipTime = () => {
    commitOption(pickerDate, null);
    setIosStage(null);
  };

  const handleCancel = () => {
    cancelDraft();
    router.replace('/(tabs)');
  };

  const options = draft?.poll.options ?? [];

  return (
    <Screen
      scroll
      contentClassName="pb-8"
      footer={
        <View className="bg-background px-5 pb-6 pt-3 border-t border-surface-variant">
          <Button
            label={t('common.next')}
            rightIcon="arrow_forward"
            onPress={() => router.push('/create/design')}
          />
        </View>
      }
    >
      <WizardHeader onBack={() => router.back()} onCancel={handleCancel} />

      <View className="px-5">
        {/* Progress 3/4 */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <Text variant="label-sm" color="primary">
              {t('wizard.step3').toUpperCase()}
            </Text>
            <Text variant="label-sm" color="on-surface-variant">
              {t('wizard.stepOf', { current: 3, total: 4 })}
            </Text>
          </View>
          <ProgressBar value={0.75} />
        </View>

        {/* Title */}
        <Text variant="headline-xl-mobile" color="on-background" className="mb-3">
          {t('poll.title')}
        </Text>
        <Text variant="body-md" color="on-surface-variant" className="mb-8">
          {t('poll.subtitle')}
        </Text>

        {/* Options list */}
        {options.length === 0 ? (
          <EmptyState
            icon="event"
            title={t('poll.emptyTitle')}
            message={t('poll.emptyMsg')}
            actionLabel={t('poll.addProposal')}
            onAction={handleAddProposal}
          />
        ) : (
          <>
            <Text variant="label-md" color="on-surface-variant" className="mb-3">
              {t('poll.proposals')}
            </Text>

            <View className="gap-4">
              {options.map((option) => (
                <Card key={option.id}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text
                        variant="headline-md"
                        color="on-background"
                        className="mb-1"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {formatDate(option.date, language, { weekday: true })}
                      </Text>
                      <Text variant="body-md" color="on-surface-variant">
                        {option.time
                          ? t('common.oClock', { time: formatTime(option.time, language) })
                          : t('common.optional')}
                      </Text>
                    </View>

                    <IconButton
                      name="close"
                      onPress={() => removeDraftDateOption(option.id)}
                      color="on-surface-variant"
                      accessibilityLabel={t('common.delete')}
                    />
                  </View>
                </Card>
              ))}
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
              className="bg-surface-container-lowest rounded-t-3xl px-5 pt-5 pb-10"
              style={shadows.hero}
            >
              <View className="flex-row items-center justify-between mb-2">
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

              {iosStage === 'time' ? (
                <Button
                  label={t('poll.withoutTime')}
                  variant="ghost"
                  onPress={onIosSkipTime}
                  className="mt-2"
                />
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
}
