/**
 * Template gallery — browse curated invitation looks (InvitationStyle × occasion)
 * and start a new event draft pre-seeded with the chosen template (style, font,
 * headline, occasion and event details). All styles are free. See CONTRACT.md
 * §2, §5, §7.
 */

import { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { InvitationCard } from '@/components/invitation/InvitationCard';
import { useStore } from '@/lib/store/useStore';
import { occasionMeta } from '@/lib/utils/occasions';
import type {
  InvitationStyle,
  OccasionType,
  InvitationDesign,
  EventModel,
} from '@/lib/data/types';

interface TemplateDef {
  id: string;
  style: InvitationStyle;
  occasion: OccasionType;
  headline: string;
  subline: string;
  date: string;
  time: string;
  location: string;
}

/** Curated style × occasion combos. All styles are free (CONTRACT §9). */
const TEMPLATES: TemplateDef[] = [
  { id: 't-wed-elegant', style: 'elegant', occasion: 'wedding', headline: 'Anna & Lukas', subline: 'Wir heiraten', date: '2026-09-12', time: '15:00', location: 'Schloss Belvedere' },
  { id: 't-wed-floral', style: 'floral', occasion: 'wedding', headline: 'Mia & Jonas', subline: 'Save the Date', date: '2026-06-20', time: '14:30', location: 'Gut Rosenau' },
  { id: 't-wed-luxury', style: 'luxury', occasion: 'wedding', headline: 'Sophie & Paul', subline: 'Hochzeitsgala', date: '2026-10-03', time: '18:00', location: 'Grand Hotel' },
  { id: 't-bday-modern', style: 'modern', occasion: 'birthday', headline: '30 Jahre', subline: 'Lass uns feiern', date: '2026-07-05', time: '19:00', location: 'Loft Berlin' },
  { id: 't-bday-casual', style: 'casual', occasion: 'birthday', headline: 'Happy Birthday', subline: 'Party Time', date: '2026-08-15', time: '20:00', location: 'Bei uns zuhause' },
  { id: 't-dinner-minimal', style: 'minimal', occasion: 'dinner', headline: 'Dinner Abend', subline: 'Gemeinsam genießen', date: '2026-06-30', time: '19:30', location: 'Restaurant Lume' },
  { id: 't-dinner-elegant', style: 'elegant', occasion: 'dinner', headline: 'Galadinner', subline: 'Ein festlicher Abend', date: '2026-09-01', time: '19:00', location: 'Villa Sole' },
  { id: 't-baby-floral', style: 'floral', occasion: 'baby_shower', headline: 'Baby Shower', subline: 'Willkommen Schatz', date: '2026-07-20', time: '15:00', location: 'Im Garten' },
  { id: 't-corp-modern', style: 'modern', occasion: 'corporate', headline: 'Sommerfest', subline: 'Firmenfeier 2026', date: '2026-08-28', time: '17:00', location: 'Eventhalle 7' },
  { id: 't-friends-casual', style: 'casual', occasion: 'friends', headline: 'Get-together', subline: 'Zeit für Freunde', date: '2026-07-12', time: '18:00', location: 'Stadtpark' },
];

interface FilterDef {
  key: OccasionType | 'all';
  labelKey: string;
}

const FILTERS: FilterDef[] = [
  { key: 'all', labelKey: 'common.all' },
  { key: 'wedding', labelKey: 'templates.filterWedding' },
  { key: 'birthday', labelKey: 'templates.filterBirthday' },
  { key: 'dinner', labelKey: 'templates.filterDinner' },
  { key: 'baby_shower', labelKey: 'templates.filterBaby' },
  { key: 'corporate', labelKey: 'templates.filterBusiness' },
  { key: 'friends', labelKey: 'templates.filterCasual' },
];

const SM_CARD_WIDTH = 180;
const CARD_ASPECT = 4 / 3; // height / width

function templateDesign(tpl: TemplateDef): InvitationDesign {
  return {
    style: tpl.style,
    accent: 'primary',
    fontPair: 'classic',
    layout: 'centered',
    headline: tpl.headline,
    subline: tpl.subline,
    body: '',
    showQr: false,
  };
}

function templateEvent(
  tpl: TemplateDef,
): Pick<EventModel, 'title' | 'date' | 'time' | 'location' | 'occasion'> {
  return {
    title: tpl.headline,
    date: tpl.date,
    time: tpl.time,
    location: { name: tpl.location },
    occasion: tpl.occasion,
  };
}

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const startDraft = useStore((s) => s.startDraft);
  const updateDraft = useStore((s) => s.updateDraft);
  const updateDraftInvitation = useStore((s) => s.updateDraftInvitation);

  const [filter, setFilter] = useState<FilterDef['key']>('all');

  // Two-column grid: scale the fixed 180px sm card down to the column width.
  const GAP = 16;
  const SCREEN_PAD = 40; // px-5 on both sides
  const colWidth = Math.floor((width - SCREEN_PAD - GAP) / 2);
  const scale = colWidth / SM_CARD_WIDTH;
  const previewHeight = Math.round(SM_CARD_WIDTH * CARD_ASPECT * scale);

  const filtered = useMemo(
    () => TEMPLATES.filter((tpl) => filter === 'all' || tpl.occasion === filter),
    [filter],
  );

  const handleUse = (tpl: TemplateDef) => {
    // Seed the draft with the full curated template: occasion + event details
    // and the complete invitation design (style, font, headline, subline).
    startDraft(occasionMeta(tpl.occasion).defaultMode);
    updateDraft(templateEvent(tpl));
    updateDraftInvitation(templateDesign(tpl));
    router.push('/create/occasion');
  };

  return (
    <Screen scroll edges={['top']}>
      <AppHeader title={t('templates.title')} />

      {/* Horizontal occasion filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
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

      {filtered.length === 0 ? (
        <View className="px-5 pt-12">
          <EmptyState
            icon="dashboard_customize"
            title={t('templates.emptyTitle')}
            message={t('templates.empty')}
          />
        </View>
      ) : (
        <View
          className="px-5 pb-8 pt-4 flex-row flex-wrap"
          style={{ gap: GAP }}
        >
          {filtered.map((tpl) => (
            <View key={tpl.id} style={{ width: colWidth }}>
              {/* Card preview (scaled sm InvitationCard) */}
              <View
                style={{ width: colWidth, height: previewHeight }}
                className="overflow-hidden rounded-3xl"
              >
                <View
                  style={{
                    width: SM_CARD_WIDTH,
                    height: SM_CARD_WIDTH * CARD_ASPECT,
                    transform: [{ scale }],
                    transformOrigin: 'top left',
                  }}
                >
                  <InvitationCard
                    design={templateDesign(tpl)}
                    event={templateEvent(tpl)}
                    size="sm"
                  />
                </View>
              </View>

              {/* Style + occasion meta */}
              <View className="mt-3 px-1">
                <Text variant="label-md" color="on-surface" numberOfLines={1}>
                  {t(`designer.styles.${tpl.style}`)}
                </Text>
                <Text
                  variant="label-sm"
                  color="on-surface-variant"
                  numberOfLines={2}
                >
                  {t(`occasions.${tpl.occasion}`)}
                </Text>
              </View>

              <Button
                label={t('templates.use')}
                onPress={() => handleUse(tpl)}
                variant="primary"
                size="sm"
                leftIcon="auto_awesome"
                className="mt-2"
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
