/**
 * Wizard step 5 — Review & finish (app/create/review.tsx).
 *
 * Final preview of the draft event: a full InvitationCard (with the RSVP QR)
 * plus a tidy summary of the key details. The footer commits the draft into
 * the events list and opens the new event hub, or shares the invite.
 *
 * No Stitch source — composed to match the established sage/champagne system
 * (dashboard + wizard header + InvitationCard).
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { WizardHeader } from '@/components/ui/WizardHeader';
import { InvitationCard } from '@/components/invitation/InvitationCard';
import { useDraft, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { usePublishEvent } from '@/lib/store/usePublish';
import { formatDate, formatTime } from '@/lib/utils/format';
import { occasionMeta } from '@/lib/utils/occasions';
import { shareEvent } from '@/lib/utils/share';

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
}

/** One labelled detail row inside the summary card. */
function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
        <Icon name={icon} size={20} color="primary" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label-sm" color="outline">
          {label}
        </Text>
        <Text variant="body-md" color="on-surface" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const profile = useProfile();
  const lang = profile.language;
  const commitDraft = useStore((s) => s.commitDraft);
  const cancelDraft = useStore((s) => s.cancelDraft);
  const publish = usePublishEvent();

  // Publish up-front so the rendered/printed QR carries a real server
  // share_token (not the local device id, which won't resolve for a guest on
  // another device). Falls back to the local-id url when Supabase is
  // unconfigured. Empty until resolved so the QR only shows a working link.
  const [rsvpUrl, setRsvpUrl] = useState('');
  const draftId = draft?.id;
  useEffect(() => {
    if (!draft) return;
    let active = true;
    void publish(draft).then((url) => {
      if (active) setRsvpUrl(url);
    });
    return () => {
      active = false;
    };
    // Re-publish only when the draft identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, publish]);

  const handleCancel = () => {
    cancelDraft();
    router.replace('/(tabs)');
  };

  // No draft in progress (e.g. opened directly / after reload) — guide back.
  if (!draft) {
    return (
      <Screen>
        <WizardHeader onBack={() => router.back()} onCancel={() => router.replace('/(tabs)')} />
        <View className="flex-1 justify-center">
          <EmptyState
            icon="celebration"
            title={t('dashboard.emptyTitle')}
            message={t('dashboard.emptyMsg')}
            actionLabel={t('dashboard.newEvent')}
            onAction={() => router.replace('/create/occasion')}
          />
        </View>
      </Screen>
    );
  }

  const handleCreate = () => {
    // draft is guaranteed non-null here, so commit always yields an id;
    // navigate unconditionally so the button is never a silent no-op.
    const id = commitDraft();
    router.replace(id ? `/event/${id}` : '/(tabs)');
  };

  const handleShare = async () => {
    const url = await publish(draft);
    setRsvpUrl(url);
    void shareEvent(draft, { lang, url });
  };

  const occasion = t(`occasions.${draft.occasion}` as const);
  const title = draft.title.trim() || occasion;

  const dateValue = draft.dateUndecided || !draft.date
    ? t('details.dateUndecided')
    : `${formatDate(draft.date, lang, { weekday: true })}${
        draft.time ? ` · ${formatTime(draft.time, lang)}` : ''
      }`;

  const locationValue = draft.location?.name?.trim() || t('common.optional');

  return (
    <Screen
      scroll
      contentClassName="pb-6"
      footer={
        <View className="gap-3 border-t border-surface-variant bg-background px-5 pb-2 pt-4">
          <Button label={t('common.create')} leftIcon="celebration" onPress={handleCreate} />
          <Button
            label={t('eventHub.shareInvite')}
            variant="secondary"
            leftIcon="ios_share"
            onPress={handleShare}
          />
        </View>
      }
    >
      <WizardHeader onBack={() => router.back()} onCancel={handleCancel} />

      {/* Intro */}
      <View className="gap-2 px-5 pb-6">
        <Text variant="label-md" color="primary">
          {t('designer.preview')}
        </Text>
        <Text variant="headline-xl-mobile" color="on-background">
          {t('wizard.reviewTitle')}
        </Text>
      </View>

      {/* Centered full invitation card with RSVP QR */}
      <View className="items-center px-5">
        <View className="w-72">
          <InvitationCard
            design={draft.invitation}
            event={draft}
            size="full"
            lang={lang}
            showQr={draft.invitation.showQr}
            qrValue={rsvpUrl}
          />
        </View>
      </View>

      {/* Event summary */}
      <View className="mt-8 px-5">
        <Card className="gap-5">
          <View className="gap-1">
            <Text variant="label-sm" color="outline">
              {occasion}
            </Text>
            <Text variant="headline-md" color="on-surface" numberOfLines={2}>
              {title}
            </Text>
          </View>

          <View className="gap-4 border-t border-surface-variant pt-4">
            <SummaryRow
              icon={occasionMeta(draft.occasion).icon}
              label={t('wizard.step1')}
              value={occasion}
            />
            <SummaryRow icon="calendar_today" label={t('details.dateLabel')} value={dateValue} />
            <SummaryRow
              icon="location_on"
              label={t('details.locationLabel')}
              value={locationValue}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
