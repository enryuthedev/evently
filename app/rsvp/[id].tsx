/**
 * Guest RSVP view — the public deep-link target (`/rsvp/<id>`). This screen is
 * intentionally standalone (no tabs / app chrome), styled like a web invite:
 * a large invitation card, the event details, and a friendly RSVP form. The
 * device keeps a single component-managed guest record so the host sees one
 * response per device. See CONTRACT.md §2 (routes) + Stitch `deine_einladung`.
 */

import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { LocationBlock } from '@/components/ui/LocationBlock';
import { InvitationCard } from '@/components/invitation/InvitationCard';

import { useEvent, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { formatDate, formatTime } from '@/lib/utils/format';
import { buildRsvpUrl } from '@/lib/utils/share';
import { shadows } from '@/lib/theme/tokens';
import {
  fetchPublicEvent,
  submitRsvp,
  type PublicEvent,
} from '@/lib/supabase/publish';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { EventModel, MealChoice, RSVPStatus } from '@/lib/data/types';

/** Event shape the RSVP view renders — local model or remote public event. */
type ViewEvent = EventModel | PublicEvent;

type Choice = 'coming' | 'maybe' | 'cant';

const CHOICE_TO_STATUS: Record<Choice, Exclude<RSVPStatus, 'pending'>> = {
  coming: 'yes',
  maybe: 'maybe',
  cant: 'no',
};

const MIN_PARTY = 1;
const MAX_PARTY = 10;

/** A single big RSVP choice button with a selected highlight. */
function ChoiceButton({
  label,
  icon,
  variant,
  selected,
  selectedHint,
  onPress,
}: {
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'outline';
  selected: boolean;
  selectedHint: string;
  onPress: () => void;
}) {
  // Button doesn't forward accessibilityState.selected, so wrap it in an
  // accessible group that conveys the selected status to screen readers.
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={selected ? `${label}, ${selectedHint}` : label}
    >
      <Button
        label={label}
        variant={variant}
        leftIcon={icon}
        rightIcon={selected ? 'check_circle' : undefined}
        onPress={onPress}
        className={selected ? 'border-2 border-primary' : ''}
      />
    </View>
  );
}

/** Compact +/- stepper for the party size. */
function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const dec = () => onChange(Math.max(MIN_PARTY, value - 1));
  const inc = () => onChange(Math.min(MAX_PARTY, value + 1));
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-surface-container-low p-1">
      <Pressable
        onPress={dec}
        disabled={value <= MIN_PARTY}
        accessibilityRole="button"
        className={`h-9 w-9 items-center justify-center rounded-full ${
          value <= MIN_PARTY ? 'opacity-40' : 'active:opacity-70'
        }`}
      >
        <Icon name="remove" size={20} color="on-surface" />
      </Pressable>
      <Text variant="label-md" color="on-surface" className="w-6 text-center">
        {String(value)}
      </Text>
      <Pressable
        onPress={inc}
        disabled={value >= MAX_PARTY}
        accessibilityRole="button"
        className={`h-9 w-9 items-center justify-center rounded-full ${
          value >= MAX_PARTY ? 'opacity-40' : 'active:opacity-70'
        }`}
      >
        <Icon name="add" size={20} color="on-surface" />
      </Pressable>
    </View>
  );
}

export default function RsvpScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  // The route param is the share token (or a local id when the host previews).
  const token = String(id ?? '');

  const localEvent = useEvent(token);
  const profile = useProfile();
  const lang = profile.language;

  const addGuest = useStore((s) => s.addGuest);
  const setRSVP = useStore((s) => s.setRSVP);

  // When the event isn't in the local store, resolve it from Supabase by token.
  const [remoteEvent, setRemoteEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localEvent || !token || !isSupabaseConfigured()) return;
    let alive = true;
    setLoading(true);
    fetchPublicEvent(token)
      .then((e) => alive && setRemoteEvent(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [localEvent, token]);

  const event: ViewEvent | undefined = localEvent ?? remoteEvent ?? undefined;
  // Remote events are submitted to the server; local ones stay in the store.
  const isRemote = !localEvent && !!remoteEvent;

  // Local, device-scoped RSVP state.
  const [guestId, setGuestId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [partySize, setPartySize] = useState(MIN_PARTY);
  const [meal, setMeal] = useState<MealChoice>('none');
  const [allergies, setAllergies] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (sent) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }
  }, [sent, fade]);

  // Gentle pulse for the loading indicator while a remote token resolves.
  const pulse = useRef(new Animated.Value(0.4)).current;
  const isLoading = !event && loading;
  useEffect(() => {
    if (!isLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading, pulse]);

  // ---- Loading while we resolve a remote token ----
  if (isLoading) {
    return (
      <Screen scroll contentClassName="flex-grow justify-center px-5 py-10">
        <View className="items-center">
          <Animated.View style={{ opacity: pulse }}>
            <Icon name="hourglass_top" size={40} color="secondary" />
          </Animated.View>
          <Text
            variant="body-md"
            color="on-surface-variant"
            className="mt-4 text-center"
          >
            {t('common.loading')}
          </Text>
        </View>
      </Screen>
    );
  }

  // ---- Graceful "not found" when the deep link is stale ----
  if (!event) {
    return (
      <Screen scroll contentClassName="flex-grow justify-center px-5 py-10">
        <EmptyState
          icon="mark_email_unread"
          title={t('errors.notFoundTitle')}
          message={t('errors.notFoundMessage')}
        />
      </Screen>
    );
  }

  const showExtras = choice === 'coming' || choice === 'maybe';

  const mealOptions = [
    { value: 'none', label: t('meals.none') },
    { value: 'meat', label: t('meals.meat') },
    { value: 'vegetarian', label: t('meals.vegetarian') },
    { value: 'vegan', label: t('meals.vegan') },
    { value: 'kids', label: t('meals.kids') },
  ];

  const dateLabel = event.date ? formatDate(event.date, lang) : '';
  const timeLabel = event.time ? formatTime(event.time, lang) : '';

  const handleSend = async () => {
    if (!choice) return;
    setSubmitError(false);
    const status = CHOICE_TO_STATUS[choice];
    const extras = showExtras
      ? {
          partySize,
          meal,
          allergies: allergies.trim() || undefined,
          note: message.trim() || undefined,
        }
      : {
          partySize: MIN_PARTY,
          note: message.trim() || undefined,
        };

    if (isRemote) {
      // Guest on another device — record on the server via the share token.
      setSubmitting(true);
      try {
        await submitRsvp(token, { status, ...extras });
        setSent(true);
      } catch {
        // Network/config error — surface the generic error, keep the form.
        setSubmitError(true);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Local (host preview / offline): keep a single device-scoped guest record.
    if (guestId) {
      setRSVP(guestId, status, extras);
    } else {
      const newId = addGuest(token, {
        name: 'Gast',
        group: 'friends',
        status,
        companions: [],
        invitedAt: new Date().toISOString(),
        respondedAt: new Date().toISOString(),
        ...extras,
      });
      setGuestId(newId);
    }
    setSent(true);
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentClassName="px-5 pb-16 pt-6">
      {/* Invitation card */}
      <View className="items-center">
        <View className="w-full max-w-sm">
          <InvitationCard
            design={event.invitation}
            event={event}
            size="full"
            lang={lang}
            showQr={event.invitation.showQr}
            qrValue={buildRsvpUrl(event.shareToken ?? event.id)}
          />
        </View>
      </View>

      {/* Heading */}
      <View className="mt-8 items-center">
        <Text
          variant="label-sm"
          color="secondary"
          className="uppercase tracking-[2px]"
        >
          {t('guestView.youInvited')}
        </Text>
        <Text
          variant="headline-lg"
          color="primary"
          className="mt-2 text-center"
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {event.title}
        </Text>
      </View>

      {/* Event details */}
      <View className="mt-6 gap-4">
        {!!dateLabel && (
          <View className="flex-row items-center justify-center gap-2">
            <Icon name="calendar_today" size={18} color="secondary" />
            <Text variant="body-lg" color="on-surface-variant">
              {dateLabel}
              {timeLabel ? ` · ${timeLabel}` : ''}
            </Text>
          </View>
        )}
        {event.location ? <LocationBlock location={event.location} /> : null}
      </View>

      <View className="my-8 h-px w-16 self-center bg-surface-variant" />

      {sent ? (
        <Animated.View
          style={{ opacity: fade }}
          className="items-center px-4 py-6"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-container/20">
            <Icon name="celebration" size={38} color="primary" />
          </View>
          <Text
            variant="headline-md"
            color="on-surface"
            className="mt-5 text-center"
          >
            {t('guestView.thanks')}
          </Text>
          <Text
            variant="body-md"
            color="on-surface-variant"
            className="mt-2 text-center"
          >
            {t('guestView.thanksMsg')}
          </Text>
          <View className="mt-7 w-full">
            <Button
              label={t('common.edit')}
              variant="outline"
              leftIcon="edit"
              onPress={() => setSent(false)}
            />
          </View>
        </Animated.View>
      ) : (
        <View className="gap-8">
          {/* Choice prompt */}
          <View className="gap-4">
            <Text
              variant="headline-md"
              color="on-surface"
              className="text-center"
            >
              {t('guestView.rsvpPrompt')}
            </Text>
            <View className="gap-3">
              <ChoiceButton
                label={t('guestView.coming')}
                icon="celebration"
                variant="primary"
                selected={choice === 'coming'}
                selectedHint={t('guestView.selectedHint')}
                onPress={() => setChoice('coming')}
              />
              <ChoiceButton
                label={t('guestView.maybe')}
                icon="help"
                variant="secondary"
                selected={choice === 'maybe'}
                selectedHint={t('guestView.selectedHint')}
                onPress={() => setChoice('maybe')}
              />
              <ChoiceButton
                label={t('guestView.cant')}
                icon="close"
                variant="outline"
                selected={choice === 'cant'}
                selectedHint={t('guestView.selectedHint')}
                onPress={() => setChoice('cant')}
              />
            </View>
          </View>

          {/* Extras — only when coming / maybe */}
          {showExtras && (
            <View className="gap-6">
              {/* Party size */}
              <View
                className="flex-row items-center justify-between rounded-2xl border border-surface-variant bg-surface-container-lowest p-4"
                style={shadows.card}
              >
                <View className="flex-1 pr-3">
                  <Text variant="label-md" color="on-surface">
                    {t('guestView.partySizeLabel')}
                  </Text>
                  <Text
                    variant="body-sm"
                    color="on-surface-variant"
                    className="mt-1"
                  >
                    {t('guests.partySize', { count: partySize })}
                  </Text>
                </View>
                <Stepper value={partySize} onChange={setPartySize} />
              </View>

              {/* Meal preference */}
              <View className="gap-3">
                <Text variant="label-md" color="on-surface">
                  {t('guestView.mealPrompt')}
                </Text>
                <SegmentedControl
                  options={mealOptions}
                  value={meal}
                  onChange={(v) => setMeal(v as MealChoice)}
                />
              </View>

              {/* Allergies / notes */}
              <Input
                label={t('guestView.allergies')}
                value={allergies}
                onChangeText={setAllergies}
                icon="restaurant"
                placeholder={t('common.optional')}
              />

              {/* Message to host */}
              <Input
                label={t('guestView.messagePrompt')}
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder={t('common.optional')}
              />
            </View>
          )}

          {/* Submit */}
          <View>
            <Button
              label={t('guestView.send')}
              rightIcon="send"
              onPress={handleSend}
              disabled={!choice}
              loading={submitting}
            />
            {submitError && (
              <Text
                variant="body-sm"
                color="error"
                className="mt-2 text-center"
              >
                {t('errors.generic')}
              </Text>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}
