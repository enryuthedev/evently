import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';

import { useChecklist, useEvent, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import type {
  ChecklistCategory,
  ChecklistItem,
  Priority,
} from '@/lib/data/types';
import { formatDateShort } from '@/lib/utils/format';
import { palette, shadows, type ColorName } from '@/lib/theme/tokens';

const CATEGORY_ORDER: ChecklistCategory[] = [
  'location',
  'invitation',
  'food',
  'decor',
  'music',
  'guests',
  'other',
];

const CATEGORY_META: Record<
  ChecklistCategory,
  { icon: string; labelKey: string; tint: ColorName }
> = {
  location: { icon: 'location_on', labelKey: 'checklist.catLocation', tint: 'primary' },
  invitation: { icon: 'mail', labelKey: 'checklist.catInvitation', tint: 'secondary' },
  food: { icon: 'restaurant', labelKey: 'checklist.catFood', tint: 'tertiary' },
  decor: { icon: 'local_florist', labelKey: 'checklist.catDecor', tint: 'secondary' },
  music: { icon: 'music_note', labelKey: 'checklist.catMusic', tint: 'primary' },
  guests: { icon: 'group', labelKey: 'checklist.catGuests', tint: 'tertiary' },
  other: { icon: 'checklist', labelKey: 'checklist.catOther', tint: 'on-surface-variant' },
};

const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high'];
const PRIORITY_COLOR: Record<Priority, ColorName> = {
  low: 'outline',
  medium: 'tertiary',
  high: 'error',
};
const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'checklist.prioLow',
  medium: 'checklist.prioMedium',
  high: 'checklist.prioHigh',
};

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const { t } = useTranslation();
  const { language } = useProfile();

  const event = useEvent(eventId);
  const items = useChecklist(eventId);

  const toggleChecklistItem = useStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useStore((s) => s.addChecklistItem);
  const removeChecklistItem = useStore((s) => s.removeChecklistItem);
  const seedChecklistForOccasion = useStore((s) => s.seedChecklistForOccasion);

  const isQuick = event?.mode === 'quick';

  // ---- add-task form state ----
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChecklistCategory>('location');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [showPicker, setShowPicker] = useState(false);

  const total = items.length;
  const done = items.filter((c) => c.done).length;

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      list: items.filter((c) => c.category === cat),
    })).filter((g) => g.list.length > 0);
  }, [items]);

  const resetForm = () => {
    setTitle('');
    setCategory('location');
    setPriority('medium');
    setDueDate(undefined);
    setFormOpen(false);
  };

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addChecklistItem(eventId, {
      title: trimmed,
      category,
      priority,
      done: false,
      dueDate,
    });
    resetForm();
  };

  const onPickDate = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (e.type === 'set' && date) {
      setDueDate(date.toISOString().slice(0, 10));
    }
  };

  return (
    <Screen scroll contentClassName="pb-12">
      {/* Top bar */}
      <View className="flex-row items-center px-5 pb-2 pt-1">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
        />
        <Text variant="headline-md" className="ml-1 flex-1">
          {t('checklist.title')}
        </Text>
      </View>

      {/* Event title + progress */}
      <View className="px-5">
        {event ? (
          <Text variant="body-md" color="on-surface-variant" className="mb-4">
            {event.title}
          </Text>
        ) : null}

        <View className="mb-2 flex-row items-center justify-between">
          <Text variant="label-md" color="on-surface-variant">
            {t('checklist.progress', { done, total })}
          </Text>
          <Text variant="label-md" color="primary">
            {total > 0 ? `${Math.round((done / total) * 100)}%` : '0%'}
          </Text>
        </View>
        <ProgressBar value={total > 0 ? done / total : 0} />
      </View>

      {total === 0 ? (
        <View className="mt-6">
          <EmptyState
            icon="checklist"
            title={t('checklist.empty')}
            message={t('wizard.occasionSubtitle')}
            actionLabel={t('checklist.useTemplate')}
            onAction={() =>
              seedChecklistForOccasion(eventId, event?.occasion ?? 'custom')
            }
          />
        </View>
      ) : isQuick ? (
        // Quick mode: minimal flat list
        <View className="mt-5 px-5">
          <Card padded={false} className="overflow-hidden">
            {items.map((item, idx) => (
              <TaskRow
                key={item.id}
                item={item}
                language={language}
                minimal
                onToggle={() => toggleChecklistItem(item.id)}
                onRemove={() => removeChecklistItem(item.id)}
                divider={idx > 0}
                t={t}
              />
            ))}
          </Card>
        </View>
      ) : (
        // Full mode: grouped by category
        <View className="mt-5 px-5">
          {grouped.map((group) => {
            const meta = CATEGORY_META[group.category];
            const gDone = group.list.filter((c) => c.done).length;
            return (
              <Card key={group.category} className="mb-4" padded>
                <View className="mb-4 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-container/20">
                      <Icon name={meta.icon} size={20} color={meta.tint} />
                    </View>
                    <Text
                      variant="headline-md"
                      className="ml-3 flex-1"
                      numberOfLines={1}
                    >
                      {t(meta.labelKey)}
                    </Text>
                  </View>
                  <View className="ml-3 rounded-full bg-surface-container px-3 py-1">
                    <Text variant="label-sm" color="on-surface-variant">
                      {gDone}/{group.list.length}
                    </Text>
                  </View>
                </View>

                <View>
                  {group.list.map((item, idx) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      language={language}
                      onToggle={() => toggleChecklistItem(item.id)}
                      onRemove={() => removeChecklistItem(item.id)}
                      divider={idx > 0}
                      t={t}
                    />
                  ))}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Add task: button or inline form */}
      <View className="mt-2 px-5">
        {formOpen ? (
          <Card className="mt-2" padded>
            <Input
              label={t('checklist.titleLabel')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('checklist.addTask')}
              autoCapitalize="sentences"
            />

            {!isQuick ? (
              <View className="mt-4">
                <Text variant="label-md" color="on-surface-variant" className="mb-2">
                  {t('checklist.categoryLabel')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORY_ORDER.map((cat) => (
                    <Chip
                      key={cat}
                      label={t(CATEGORY_META[cat].labelKey)}
                      icon={CATEGORY_META[cat].icon}
                      selected={category === cat}
                      onPress={() => setCategory(cat)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mt-4">
              <Text variant="label-md" color="on-surface-variant" className="mb-2">
                {t('checklist.priorityLabel')}
              </Text>
              <SegmentedControl
                value={priority}
                onChange={(v) => setPriority(v as Priority)}
                options={PRIORITY_ORDER.map((p) => ({
                  value: p,
                  label: t(PRIORITY_LABEL[p]),
                }))}
              />
            </View>

            <Pressable
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('checklist.dueDate')}
              className="mt-4 h-14 flex-row items-center rounded-xl border border-surface-variant bg-surface-container-lowest px-4"
            >
              <Icon name="event" size={20} color="on-surface-variant" />
              <Text
                variant="body-md"
                color={dueDate ? 'on-surface' : 'outline'}
                className="ml-3"
              >
                {dueDate
                  ? `${t('checklist.dueDate')}: ${formatDateShort(dueDate, language)}`
                  : `${t('checklist.dueDate')} (${t('common.optional')})`}
              </Text>
            </Pressable>

            {showPicker ? (
              <DateTimePicker
                value={dueDate ? new Date(dueDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onPickDate}
              />
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  onPress={resetForm}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('common.add')}
                  leftIcon="check"
                  onPress={handleAdd}
                  disabled={!title.trim()}
                />
              </View>
            </View>
          </Card>
        ) : (
          <View className="gap-3">
            <Button
              label={t('checklist.addTask')}
              leftIcon="add"
              variant="secondary"
              onPress={() => setFormOpen(true)}
            />
            {total > 0 ? (
              <Button
                label={t('checklist.useTemplate')}
                leftIcon="playlist_add"
                variant="ghost"
                onPress={() =>
                  seedChecklistForOccasion(eventId, event?.occasion ?? 'custom')
                }
              />
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

// ---- task row -------------------------------------------------------------
interface TaskRowProps {
  item: ChecklistItem;
  language: ReturnType<typeof useProfile>['language'];
  onToggle: () => void;
  onRemove: () => void;
  divider?: boolean;
  minimal?: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function TaskRow({
  item,
  language,
  onToggle,
  onRemove,
  divider,
  minimal,
  t,
}: TaskRowProps) {
  return (
    <View
      className={[
        'flex-row items-start',
        divider ? 'border-t border-surface-variant' : '',
        minimal ? 'px-5' : '',
      ].join(' ')}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done }}
        accessibilityLabel={item.title}
        className="flex-1 flex-row items-start py-3"
      >
        <View
          className={[
            'mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2',
            item.done
              ? 'border-primary-container bg-primary-container'
              : 'border-surface-variant bg-transparent',
          ].join(' ')}
          style={item.done ? shadows.card : undefined}
        >
          {item.done ? (
            <Icon name="check" size={16} color="on-primary-container" />
          ) : null}
        </View>

        <View className="ml-3 min-w-0 flex-1">
          <Text
            variant="label-md"
            color={item.done ? 'outline' : 'on-surface'}
            style={item.done ? { textDecorationLine: 'line-through' } : undefined}
          >
            {item.title}
          </Text>

          <View className="mt-1 flex-row items-center">
            {item.dueDate ? (
              <View className="mr-3 flex-row items-center">
                <Icon name="event" size={14} color="on-surface-variant" />
                <Text
                  variant="label-sm"
                  color="on-surface-variant"
                  className="ml-1"
                  numberOfLines={1}
                >
                  {`${t('checklist.dueDate')} ${formatDateShort(item.dueDate, language)}`}
                </Text>
              </View>
            ) : null}

            {!minimal ? (
              <View className="flex-row items-center">
                <View
                  className="mr-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: palette[PRIORITY_COLOR[item.priority]] }}
                />
                <Text variant="label-sm" color={PRIORITY_COLOR[item.priority]}>
                  {t(PRIORITY_LABEL[item.priority])}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <IconButton
        name="delete"
        size={20}
        onPress={onRemove}
        accessibilityLabel={t('common.delete')}
        className="mt-1.5"
      />
    </View>
  );
}
