import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, View } from 'react-native';
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
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEvent, useProfile, useTimeline } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatTime } from '@/lib/utils/format';
import { shadows } from '@/lib/theme/tokens';
import type { TimelineItem } from '@/lib/data/types';

const pad = (n: number): string => String(n).padStart(2, '0');
const toHHMM = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Parse "HH:mm" into a Date today, defaulting to 12:00 on bad input. */
const hhmmToDate = (hhmm: string): Date => {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 12, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
};

type EditorState = {
  id: string | null; // null => creating new
  time: string;
  title: string;
  description: string;
};

/** Run-of-show timeline for an event — vertical rail with editable entries. */
export default function TimelineScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';

  const event = useEvent(eventId);
  const items = useTimeline(eventId);
  const { language } = useProfile();

  const addTimelineItem = useStore((s) => s.addTimelineItem);
  const updateTimelineItem = useStore((s) => s.updateTimelineItem);
  const removeTimelineItem = useStore((s) => s.removeTimelineItem);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const canSave = useMemo(
    () => !!editor && editor.title.trim().length > 0,
    [editor],
  );

  const openCreate = () => {
    setEditor({ id: null, time: '12:00', title: '', description: '' });
  };

  const openEdit = (item: TimelineItem) => {
    setEditor({
      id: item.id,
      time: item.time,
      title: item.title,
      description: item.description ?? '',
    });
  };

  const closeEditor = () => {
    setEditor(null);
    setIosPickerVisible(false);
  };

  const setEditorTime = (hhmm: string) => {
    setEditor((prev) => (prev ? { ...prev, time: hhmm } : prev));
  };

  const openTimePicker = () => {
    if (!editor) return;
    const base = hhmmToDate(editor.time);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'time',
        is24Hour: true,
        onChange: (e: DateTimePickerEvent, selected?: Date) => {
          if (e.type === 'set' && selected) setEditorTime(toHHMM(selected));
        },
      });
    } else {
      setPickerDate(base);
      setIosPickerVisible(true);
    }
  };

  const handleSave = () => {
    if (!editor || !canSave) return;
    const data = {
      time: editor.time,
      title: editor.title.trim(),
      description: editor.description.trim() || undefined,
    };
    if (editor.id) {
      updateTimelineItem(editor.id, data);
    } else {
      addTimelineItem(eventId, data);
    }
    closeEditor();
  };

  return (
    <Screen
      scroll
      contentClassName="pb-8"
      footer={
        items.length > 0 ? (
          <View className="bg-background px-5 pb-6 pt-3 border-t border-surface-variant">
            <Button
              label={t('timeline.addItem')}
              leftIcon="add"
              onPress={openCreate}
            />
          </View>
        ) : undefined
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center px-2 pt-2 pb-4">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          color="on-surface"
          accessibilityLabel={t('common.back')}
        />
        <View className="flex-1 px-1">
          <Text
            variant="headline-md"
            color="on-surface"
            numberOfLines={1}
            accessibilityRole="header"
          >
            {t('timeline.title')}
          </Text>
          {event?.title ? (
            <Text variant="body-sm" color="on-surface-variant" numberOfLines={1}>
              {event.title}
            </Text>
          ) : null}
        </View>
        <View className="w-11" />
      </View>

      {items.length === 0 ? (
        <View className="px-5 pt-8">
          <EmptyState
            icon="schedule"
            title={t('timeline.empty')}
            message={t('timeline.emptyMsg')}
            actionLabel={t('timeline.addItem')}
            onAction={openCreate}
          />
        </View>
      ) : (
        <View className="px-5">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <View key={item.id} className="flex-row">
                {/* Left rail: dot + connecting line */}
                <View className="items-center mr-4" style={{ width: 24 }}>
                  <View className="mt-2 h-3.5 w-3.5 rounded-full bg-primary-container border-2 border-background" />
                  {!isLast ? (
                    <View className="flex-1 w-0.5 bg-surface-variant mt-1" />
                  ) : null}
                </View>

                {/* Entry card */}
                <View className="flex-1 pb-5">
                  <Card>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text variant="headline-md" color="primary">
                          {formatTime(item.time, language)}
                        </Text>
                        <Text
                          variant="body-lg"
                          color="on-surface"
                          className="mt-1"
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        {item.description ? (
                          <Text
                            variant="body-sm"
                            color="on-surface-variant"
                            className="mt-1.5"
                            numberOfLines={3}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                      </View>

                      <View className="flex-row -mr-2">
                        <IconButton
                          name="edit"
                          size={20}
                          onPress={() => openEdit(item)}
                          accessibilityLabel={t('common.edit')}
                        />
                        <IconButton
                          name="delete"
                          size={20}
                          onPress={() =>
                            Alert.alert(
                              t('timeline.title'),
                              t('timeline.deleteConfirm'),
                              [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                  text: t('common.delete'),
                                  style: 'destructive',
                                  onPress: () => removeTimelineItem(item.id),
                                },
                              ],
                            )
                          }
                          accessibilityLabel={t('common.delete')}
                        />
                      </View>
                    </View>
                  </Card>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add / edit editor sheet */}
      <Modal
        transparent
        animationType="slide"
        visible={editor !== null}
        onRequestClose={closeEditor}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View
            className="bg-surface-container-lowest rounded-t-3xl px-5 pt-5 pb-10"
            style={shadows.hero}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text variant="headline-md" color="on-surface">
                {editor?.id ? t('common.edit') : t('timeline.addItem')}
              </Text>
              <IconButton
                name="close"
                onPress={closeEditor}
                accessibilityLabel={t('common.close')}
              />
            </View>

            {editor ? (
              <View className="gap-4">
                {/* Time field — opens platform picker */}
                <View>
                  <Text
                    variant="label-md"
                    color="on-surface-variant"
                    className="mb-2"
                  >
                    {t('timeline.timeLabel')}
                  </Text>
                  <Pressable
                    onPress={openTimePicker}
                    className="flex-row items-center justify-between rounded-xl border border-surface-variant bg-surface-container-lowest px-4 h-14 active:opacity-80"
                  >
                    <View className="flex-row items-center">
                      <Icon
                        name="schedule"
                        size={20}
                        color="on-surface-variant"
                        style={{ marginRight: 10 }}
                      />
                      <Text variant="body-lg" color="on-surface">
                        {formatTime(editor.time, language)}
                      </Text>
                    </View>
                    <Icon
                      name="expand_more"
                      size={20}
                      color="on-surface-variant"
                    />
                  </Pressable>

                  {Platform.OS === 'ios' && iosPickerVisible ? (
                    <DateTimePicker
                      value={pickerDate}
                      mode="time"
                      display="spinner"
                      is24Hour
                      onChange={(_e, value) => {
                        if (value) {
                          setPickerDate(value);
                          setEditorTime(toHHMM(value));
                        }
                      }}
                    />
                  ) : null}
                </View>

                <Input
                  label={t('timeline.titleLabel')}
                  value={editor.title}
                  onChangeText={(title) =>
                    setEditor((prev) => (prev ? { ...prev, title } : prev))
                  }
                  placeholder={t('timeline.titlePlaceholder')}
                  icon="title"
                />

                <Input
                  label={`${t('timeline.descriptionLabel')} (${t('common.optional')})`}
                  value={editor.description}
                  onChangeText={(description) =>
                    setEditor((prev) =>
                      prev ? { ...prev, description } : prev,
                    )
                  }
                  placeholder={t('timeline.descriptionPlaceholder')}
                  multiline
                />

                <Button
                  label={t('common.save')}
                  onPress={handleSave}
                  disabled={!canSave}
                  className="mt-2"
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
