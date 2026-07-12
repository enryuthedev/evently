/**
 * Print & export screen (app/event/[id]/print.tsx).
 *
 * Stitch source: karte_drucken_new_font. A centered full InvitationCard preview
 * (whose wrapper width scales with the chosen print format — the card keeps its
 * own fixed aspect, so this is a relative size cue, not a true aspect preview),
 * a format SegmentedControl (A6 / A5 / Quadrat / Story), a QR toggle, and the
 * print / export-PDF / share-link actions. All mutations/IO are wrapped so a
 * failure surfaces a localized alert instead of crashing.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { InvitationCard } from '@/components/invitation/InvitationCard';
import { useEvent, useProfile } from '@/lib/store/selectors';
import { palette } from '@/lib/theme/tokens';
import type { PrintFormat } from '@/lib/data/types';
import {
  exportInvitationPdf,
  printInvitation,
} from '@/lib/utils/print';
import { buildRsvpUrl, shareEvent, shareImageOrPdf } from '@/lib/utils/share';
import { usePublishEvent } from '@/lib/store/usePublish';

/**
 * Relative preview-wrapper width per format — a coarse size cue only. The
 * InvitationCard enforces its own fixed aspect ratio, so this does not render
 * the true printed proportions (e.g. story vs square differ only in width here).
 */
const FORMAT_WIDTH: Record<PrintFormat, string> = {
  a6: 'w-56',
  a5: 'w-64',
  square: 'w-72',
  story: 'w-48',
};

interface ToggleRowProps {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

/** One labelled switch row (e.g. the QR toggle). */
function ToggleRow({ icon, label, value, onValueChange }: ToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-surface-variant bg-surface-container-low p-4">
      <View className="flex-1 flex-row items-center gap-3">
        <Icon name={icon} size={22} color="primary" />
        <Text variant="label-md" color="on-surface">
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityRole="switch"
        accessibilityLabel={label}
        trackColor={{ false: palette['surface-variant'], true: palette.primary }}
        thumbColor={palette['surface-container-lowest']}
      />
    </View>
  );
}

export default function PrintScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const lang = useProfile().language;
  const publish = usePublishEvent();

  const [format, setFormat] = useState<PrintFormat>('a6');
  const [withQr, setWithQr] = useState(true);

  if (!event) {
    return (
      <Screen>
        <View className="flex-row items-center gap-2 px-2 py-3">
          <IconButton
            name="arrow_back"
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          />
          <Text variant="headline-md" color="on-surface">
            {t('print.title')}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <EmptyState icon="print_disabled" title={t('events.empty')} message={t('events.emptyMsg')} />
        </View>
      </Screen>
    );
  }

  const handlePrint = async () => {
    try {
      // Publish first so the QR encodes a resolvable share_token, not a local id.
      const qrValue = withQr ? await publish(event) : undefined;
      await printInvitation(event, { format, withQr, qrValue });
    } catch {
      Alert.alert(t('print.title'), t('errors.printFailed'));
    }
  };

  const handleExportPdf = async () => {
    try {
      const qrValue = withQr ? await publish(event) : undefined;
      const uri = await exportInvitationPdf(event, { format, withQr, qrValue });
      await shareImageOrPdf(uri);
    } catch {
      Alert.alert(t('print.title'), t('errors.printFailed'));
    }
  };

  const handleShareLink = async () => {
    // True bitmap capture needs a native view-shot module (unavailable in Expo
    // Go), so this publishes the event and shares its RSVP link instead.
    try {
      const url = await publish(event);
      await shareEvent(event, { url });
    } catch {
      Alert.alert(t('print.title'), t('errors.printFailed'));
    }
  };

  return (
    <Screen
      scroll
      contentClassName="pb-8"
      footer={
        <View className="gap-3 border-t border-surface-variant bg-background px-5 pb-2 pt-4">
          <Button label={t('print.print')} leftIcon="print" onPress={handlePrint} />
          <Button
            label={t('print.exportPdf')}
            variant="secondary"
            leftIcon="picture_as_pdf"
            onPress={handleExportPdf}
          />
          <Button
            label={t('print.shareLink')}
            variant="outline"
            leftIcon="share"
            onPress={handleShareLink}
          />
        </View>
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center gap-2 px-2 py-3">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
        />
        <Text variant="headline-md" color="on-surface">
          {t('print.title')}
        </Text>
      </View>

      {/* Preview canvas */}
      <View className="mx-5 mt-2 items-center justify-center overflow-hidden rounded-3xl border border-surface-variant bg-surface-container-low px-6 py-8">
        <Text variant="label-md" color="primary" className="mb-4">
          {t('print.preview')}
        </Text>
        <View className={FORMAT_WIDTH[format]}>
          <InvitationCard
            design={event.invitation}
            event={event}
            size="full"
            lang={lang}
            showQr={withQr}
            qrValue={buildRsvpUrl(event.shareToken ?? id)}
          />
        </View>
      </View>

      {/* Format picker */}
      <View className="mt-8 px-5">
        <Text variant="label-md" color="on-surface" className="mb-3">
          {t('print.formatLabel')}
        </Text>
        <SegmentedControl
          value={format}
          onChange={(next) => setFormat(next as PrintFormat)}
          options={[
            { value: 'a6', label: t('print.fmtA6') },
            { value: 'a5', label: t('print.fmtA5') },
            { value: 'square', label: t('print.fmtSquareShort') },
            { value: 'story', label: t('print.fmtStory') },
          ]}
        />
      </View>

      {/* Detail toggles */}
      <View className="mt-6 gap-3 px-5">
        <ToggleRow
          icon="qr_code_2"
          label={t('print.withQr')}
          value={withQr}
          onValueChange={setWithQr}
        />
      </View>
    </Screen>
  );
}
