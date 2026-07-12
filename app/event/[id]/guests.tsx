import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatPill } from '@/components/ui/StatPill';
import { EmptyState } from '@/components/ui/EmptyState';

import { useEvent, useGuests, useRSVPSummary } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { usePublishEvent } from '@/lib/store/usePublish';
import { copyRsvpUrl } from '@/lib/utils/share';
import type {
  Guest,
  GuestGroup,
  MealChoice,
  RSVPStatus,
} from '@/lib/data/types';

type FilterKey =
  | 'all'
  | 'family'
  | 'friends'
  | 'work'
  | 'vip'
  | 'kids'
  | 'vendor'
  | 'open';

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'guests.filterAll' },
  { key: 'family', labelKey: 'guests.filterFamily' },
  { key: 'friends', labelKey: 'guests.filterFriends' },
  { key: 'work', labelKey: 'guests.filterWork' },
  { key: 'vip', labelKey: 'groups.vip' },
  { key: 'kids', labelKey: 'groups.kids' },
  { key: 'vendor', labelKey: 'groups.vendor' },
  { key: 'open', labelKey: 'guests.filterOpen' },
];

const STATUS_ORDER: RSVPStatus[] = ['yes', 'maybe', 'pending', 'no'];
const GROUP_ORDER: GuestGroup[] = ['family', 'friends', 'work', 'vip', 'kids', 'vendor'];
const MEAL_ORDER: MealChoice[] = ['meat', 'vegetarian', 'vegan', 'kids', 'none'];

const MEAL_ICON: Record<MealChoice, string> = {
  meat: 'restaurant',
  vegetarian: 'eco',
  vegan: 'grass',
  kids: 'child_care',
  none: 'help',
};

export default function GuestsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';

  const event = useEvent(eventId);
  const guests = useGuests(eventId);
  const summary = useRSVPSummary(eventId);

  const addGuest = useStore((s) => s.addGuest);
  const updateGuest = useStore((s) => s.updateGuest);
  const removeGuest = useStore((s) => s.removeGuest);
  const setRSVP = useStore((s) => s.setRSVP);
  const publish = usePublishEvent();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // add-form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGroup, setNewGroup] = useState<GuestGroup>('friends');
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const selected = useMemo(
    () => guests.find((g) => g.id === selectedId) ?? null,
    [guests, selectedId],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return guests;
    if (filter === 'open') return guests.filter((g) => g.status === 'pending');
    return guests.filter((g) => g.group === filter);
  }, [guests, filter]);

  const handleShareLink = async () => {
    if (!event) return;
    const url = await publish(event);
    await copyRsvpUrl(url);
    Alert.alert(t('guests.shareLink'), t('guests.linkCopied'));
  };

  const handleSendReminder = (guest: Guest) => {
    Alert.alert(t('guests.sendReminder'), guest.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: () =>
          Alert.alert(t('guests.sendReminder'), t('guestView.thanks')),
      },
    ]);
  };

  const resetAddForm = () => {
    setNewName('');
    setNewEmail('');
    setNewGroup('friends');
    setNameError(undefined);
  };

  const handleAddGuest = () => {
    if (!newName.trim()) {
      setNameError(t('guests.nameRequired'));
      return;
    }
    addGuest(eventId, {
      name: newName.trim(),
      email: newEmail.trim() || undefined,
      group: newGroup,
      status: 'pending',
      partySize: 1,
      companions: [],
      meal: 'none',
      invitedAt: new Date().toISOString(),
    });
    resetAddForm();
    setAddOpen(false);
  };

  const handleRemove = (guest: Guest) => {
    Alert.alert(t('guests.remove'), guest.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeGuest(guest.id);
          setSelectedId(null);
        },
      },
    ]);
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-12"
      footer={
        <View
          className="flex-row gap-3 border-t border-surface-variant bg-background px-5 pb-8 pt-3"
        >
          <Button
            label={t('guests.shareLink')}
            variant="secondary"
            leftIcon="share"
            onPress={handleShareLink}
            className="flex-1"
            fullWidth={false}
          />
          <Button
            label={t('guests.add')}
            leftIcon="person_add"
            onPress={() => setAddOpen(true)}
            className="flex-[1.4]"
            fullWidth={false}
          />
        </View>
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center py-2">
        <IconButton
          name="arrow_back"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
        <Text variant="headline-md" className="ml-1 flex-1" numberOfLines={1}>
          {t('guests.title')}
        </Text>
      </View>

      {event ? (
        <Text variant="body-md" color="on-surface-variant" className="mb-5">
          {event.title}
        </Text>
      ) : null}

      {/* Stats row */}
      <View className="mb-6 flex-row gap-2">
        <StatPill value={summary.yes} label={t('status.yes')} tone="yes" className="flex-1" />
        <StatPill value={summary.no} label={t('status.no')} tone="no" className="flex-1" />
        <StatPill value={summary.pending} label={t('status.pending')} tone="pending" className="flex-1" />
        <StatPill value={summary.maybe} label={t('status.maybe')} tone="maybe" className="flex-1" />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mb-5"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={t(f.labelKey)}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {/* Guest list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={t('guests.empty')}
          message={t('guests.emptyMsg')}
          actionLabel={t('guests.add')}
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <View className="gap-4">
          {filtered.map((guest) => (
            <Card key={guest.id} onPress={() => setSelectedId(guest.id)}>
              <View className="flex-row items-center">
                <Avatar name={guest.name} size={44} />
                <View className="ml-3 flex-1">
                  <Text
                    variant="label-md"
                    color="on-surface"
                    numberOfLines={1}
                    style={guest.status === 'no' ? { textDecorationLine: 'line-through' } : undefined}
                  >
                    {guest.name}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <Icon name="group" size={15} color="outline" />
                      <Text variant="label-sm" color="on-surface-variant" numberOfLines={1}>
                        {t('guests.partySize', { count: guest.partySize })}
                      </Text>
                    </View>
                    {guest.meal !== 'none' ? (
                      <View className="min-w-0 flex-shrink flex-row items-center gap-1">
                        <Icon name={MEAL_ICON[guest.meal]} size={15} color="outline" />
                        <Text
                          variant="label-sm"
                          color="on-surface-variant"
                          numberOfLines={1}
                          className="flex-shrink"
                        >
                          {t(`meals.${guest.meal}`)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Badge
                  status={guest.status}
                  label={t(`status.${guest.status}`)}
                  className="ml-2 shrink-0"
                />
              </View>

              {guest.note ? (
                <Text variant="body-sm" color="on-surface-variant" className="mt-3">
                  {guest.note}
                </Text>
              ) : null}

              {guest.status === 'pending' ? (
                <Pressable
                  onPress={() => handleSendReminder(guest)}
                  accessibilityRole="button"
                  accessibilityLabel={t('guests.sendReminder')}
                  className="mt-3 flex-row items-center gap-1.5 self-start rounded-full bg-surface-container px-3 py-2 active:opacity-70"
                >
                  <Icon name="schedule_send" size={16} color="primary" />
                  <Text variant="label-sm" color="primary">
                    {t('guests.sendReminder')}
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          ))}
        </View>
      )}

      {/* Edit guest modal */}
      <Modal
        visible={selected != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedId(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-background px-5 pb-10 pt-4">
            {selected ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="mb-4 flex-row items-center">
                  <Avatar name={selected.name} size={44} />
                  <Text variant="headline-md" className="ml-3 flex-1" numberOfLines={1}>
                    {selected.name}
                  </Text>
                  <IconButton
                    name="close"
                    accessibilityLabel={t('common.close')}
                    onPress={() => setSelectedId(null)}
                  />
                </View>

                <Text variant="label-md" color="on-surface-variant" className="mb-2">
                  {t('eventHub.rsvpStatus')}
                </Text>
                <SegmentedControl
                  className="mb-5"
                  value={selected.status}
                  options={STATUS_ORDER.map((s) => ({ value: s, label: t(`status.${s}`) }))}
                  onChange={(value) => setRSVP(selected.id, value as RSVPStatus)}
                />

                <Text variant="label-md" color="on-surface-variant" className="mb-2">
                  {t('guests.groupLabel')}
                </Text>
                <View className="mb-5 flex-row flex-wrap gap-2">
                  {GROUP_ORDER.map((g) => (
                    <Chip
                      key={g}
                      label={t(`groups.${g}`)}
                      selected={selected.group === g}
                      onPress={() => updateGuest(selected.id, { group: g })}
                    />
                  ))}
                </View>

                <Text variant="label-md" color="on-surface-variant" className="mb-2">
                  {t('guestView.mealPrompt')}
                </Text>
                <View className="mb-6 flex-row flex-wrap gap-2">
                  {MEAL_ORDER.map((m) => (
                    <Chip
                      key={m}
                      label={t(`meals.${m}`)}
                      icon={MEAL_ICON[m]}
                      selected={selected.meal === m}
                      onPress={() => updateGuest(selected.id, { meal: m })}
                    />
                  ))}
                </View>

                <Button
                  label={t('guests.remove')}
                  variant="danger"
                  leftIcon="delete"
                  onPress={() => handleRemove(selected)}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add guest modal */}
      <Modal
        visible={addOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-background px-5 pb-10 pt-4">
            <View className="mb-5 flex-row items-center">
              <Text variant="headline-md" className="flex-1">
                {t('guests.add')}
              </Text>
              <IconButton
                name="close"
                accessibilityLabel={t('common.close')}
                onPress={() => {
                  resetAddForm();
                  setAddOpen(false);
                }}
              />
            </View>

            <Input
              label={t('guests.nameLabel')}
              value={newName}
              onChangeText={(v) => {
                setNewName(v);
                if (nameError) setNameError(undefined);
              }}
              icon="person"
              error={nameError}
              className="mb-4"
            />

            <Input
              label={t('guests.emailLabel')}
              value={newEmail}
              onChangeText={setNewEmail}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-4"
            />

            <Text variant="label-md" color="on-surface-variant" className="mb-2">
              {t('guests.groupLabel')}
            </Text>
            <SegmentedControl
              className="mb-6"
              value={newGroup}
              options={(['family', 'friends', 'work'] as GuestGroup[]).map((g) => ({
                value: g,
                label: t(`groups.${g}`),
              }))}
              onChange={(value) => setNewGroup(value as GuestGroup)}
            />

            <Button label={t('common.add')} leftIcon="person_add" onPress={handleAddGuest} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
