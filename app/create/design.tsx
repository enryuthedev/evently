/**
 * Wizard step 4/4 — invitation designer (einladung_gestalten).
 *
 * A big live preview of the draft invitation card with an editor sheet: a
 * bottom tab bar (Stil / Farbe / Schrift / Layout / Foto / Text) swaps the panel
 * above it. Style, accent, font, card layout, QR toggle, photo and text all write
 * straight back to the draft via `updateDraftInvitation` / `updateDraft`. All
 * styles are freely selectable. "Weiter" advances to the review step.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { WizardHeader } from '@/components/ui/WizardHeader';
import { InvitationCard } from '@/components/invitation/InvitationCard';
import { getStylePreset } from '@/components/invitation/stylePresets';
import type { CardLayout, InvitationStyle } from '@/lib/data/types';
import { useDraft, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { FONT_PAIRS } from '@/lib/theme/fontPairs';
import { palette, shadows } from '@/lib/theme/tokens';
import { buildRsvpUrl } from '@/lib/utils/share';

type EditorTab = 'style' | 'color' | 'font' | 'layout' | 'photo' | 'text';

const STYLE_ORDER: InvitationStyle[] = [
  'elegant',
  'floral',
  'modern',
  'minimal',
  'luxury',
  'casual',
];

/** Card layouts offered in the "Layout" tab (see InvitationDesign.layout). */
const LAYOUT_ORDER: CardLayout[] = ['centered', 'topPhoto', 'framed'];

/** Preview icon per layout option. */
const LAYOUT_ICONS: Record<CardLayout, string> = {
  centered: 'crop_portrait',
  topPhoto: 'photo_size_select_actual',
  framed: 'filter_frames',
};

/** Accent swatches (stored as hex on the draft invitation). */
const ACCENTS = [
  '#596244', // sage
  '#8e9775', // soft sage
  '#7d562d', // warm brown
  '#765a05', // gold
  '#b08f3b', // champagne
  '#c98986', // blush
  '#1b1c1c', // charcoal
];

export default function DesignScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const lang = useProfile().language;
  const updateDraftInvitation = useStore((s) => s.updateDraftInvitation);
  const cancelDraft = useStore((s) => s.cancelDraft);

  const [tab, setTab] = useState<EditorTab>('style');

  // Subtle cross-fade when the editor panel swaps.
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [tab, fade]);

  // Without a draft there is nothing to design — restart the wizard.
  if (!draft) return <Redirect href="/create/occasion" />;

  const design = draft.invitation;

  const handleCancel = () => {
    cancelDraft();
    router.replace('/(tabs)');
  };

  const handleSelectStyle = (style: InvitationStyle) => {
    updateDraftInvitation({ style });
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      updateDraftInvitation({ photoUri: result.assets[0].uri });
    }
  };

  // `label` = long phrase used for the panel heading + accessibilityLabel;
  // `tab` = short one-word caption shown under the tab-bar icon so the five
  // slots stay legible on narrow phones instead of ellipsizing.
  const TABS: { key: EditorTab; icon: string; label: string; tab: string }[] = [
    { key: 'style', icon: 'palette', label: t('designer.chooseStyle'), tab: t('designer.tabs.style') },
    { key: 'color', icon: 'format_color_fill', label: t('designer.changeColor'), tab: t('designer.tabs.color') },
    { key: 'font', icon: 'text_fields', label: t('designer.changeFont'), tab: t('designer.tabs.font') },
    { key: 'layout', icon: 'dashboard', label: t('designer.changeLayout'), tab: t('designer.tabs.layout') },
    { key: 'photo', icon: 'image', label: t('designer.addPhoto'), tab: t('designer.tabs.photo') },
    { key: 'text', icon: 'edit_note', label: t('designer.editText'), tab: t('designer.tabs.text') },
  ];

  return (
    <Screen
      scroll
      contentClassName="pb-6"
      footer={
        <View
          className="bg-surface-container rounded-t-2xl px-4 pt-2 pb-6"
          style={shadows.float}
        >
          <View className="px-1 pb-3">
            <Button
              label={t('common.next')}
              rightIcon="arrow_forward"
              onPress={() => router.push('/create/review')}
            />
          </View>

          <View className="flex-row items-center justify-between px-1">
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className="flex-1 items-center gap-1 active:opacity-70"
                >
                  <View
                    className={[
                      'h-10 w-14 items-center justify-center rounded-full',
                      active ? 'bg-primary-container' : 'bg-transparent',
                    ].join(' ')}
                  >
                    <Icon
                      name={item.icon}
                      size={22}
                      color={active ? 'on-primary-container' : 'on-surface-variant'}
                    />
                  </View>
                  <Text
                    variant="label-sm"
                    color={active ? 'on-surface' : 'on-surface-variant'}
                    numberOfLines={1}
                    className="text-center"
                  >
                    {item.tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
    >
      <WizardHeader
        onBack={() => router.back()}
        onCancel={handleCancel}
        title={t('designer.title')}
      />

      <Text variant="body-sm" color="on-surface-variant" className="px-5 -mt-2">
        {t('wizard.stepOf', { current: 4, total: 4 })} · {t('wizard.step4')}
      </Text>

      {/* Live preview */}
      <View className="w-full items-center px-5 py-8">
        <InvitationCard
          size="lg"
          lang={lang}
          design={design}
          showQr={design.showQr}
          qrValue={buildRsvpUrl(draft.id)}
          event={{
            title: draft.title,
            date: draft.date,
            time: draft.time,
            location: draft.location,
            occasion: draft.occasion,
          }}
        />
      </View>

      {/* Active editor panel */}
      <Animated.View style={{ opacity: fade }} className="px-5">
        {tab === 'style' ? (
          <StylePanel
            current={design.style}
            heading={t('designer.chooseStyle')}
            styleLabel={(s) => t(`designer.styles.${s}`)}
            onSelect={handleSelectStyle}
          />
        ) : null}

        {tab === 'color' ? (
          <PanelHeading title={t('designer.changeColor')}>
            <View className="flex-row flex-wrap gap-3">
              {ACCENTS.map((hex) => {
                const selected = design.accent === hex;
                return (
                  <Pressable
                    key={hex}
                    onPress={() => updateDraftInvitation({ accent: hex })}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('designer.changeColor')} ${hex}`}
                    accessibilityState={{ selected }}
                    className={[
                      'h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-80',
                      selected ? 'border-primary' : 'border-surface-variant',
                    ].join(' ')}
                  >
                    <View
                      className="h-9 w-9 rounded-full"
                      style={{ backgroundColor: hex }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </PanelHeading>
        ) : null}

        {tab === 'font' ? (
          <PanelHeading title={t('designer.changeFont')}>
            <View className="gap-3">
              {FONT_PAIRS.map((fp) => {
                const selected = design.fontPair === fp.id;
                const fontLabel = t(`designer.fontPairs.${fp.id}`);
                return (
                  <Pressable
                    key={fp.id}
                    onPress={() => updateDraftInvitation({ fontPair: fp.id })}
                    accessibilityRole="button"
                    accessibilityLabel={fontLabel}
                    accessibilityState={{ selected }}
                    className={[
                      'flex-row items-center justify-between gap-3 rounded-xl border bg-surface-container-lowest px-4 py-3 active:opacity-80',
                      selected ? 'border-primary' : 'border-surface-variant',
                    ].join(' ')}
                  >
                    <View className="min-w-0 flex-1">
                      {/* Preview rendered in the pair's own fonts. */}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fp.headline,
                          fontSize: 24,
                          lineHeight: 30,
                          color: palette['on-surface'],
                        }}
                      >
                        {fontLabel}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fp.body,
                          fontSize: 13,
                          lineHeight: 18,
                          color: palette['on-surface-variant'],
                        }}
                      >
                        {t('designer.fontSample')}
                      </Text>
                    </View>
                    <Icon
                      name={selected ? 'check_circle' : 'radio_button_unchecked'}
                      size={22}
                      color={selected ? 'primary' : 'outline'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </PanelHeading>
        ) : null}

        {tab === 'layout' ? (
          <PanelHeading title={t('designer.changeLayout')}>
            <View className="gap-4">
              <View className="flex-row gap-3">
                {LAYOUT_ORDER.map((layout) => {
                  const selected = design.layout === layout;
                  return (
                    <Pressable
                      key={layout}
                      onPress={() => updateDraftInvitation({ layout })}
                      accessibilityRole="button"
                      accessibilityLabel={t(`designer.layouts.${layout}`)}
                      accessibilityState={{ selected }}
                      className={[
                        'flex-1 items-center gap-2 rounded-xl border-2 bg-surface-container-lowest px-2 py-4 active:opacity-80',
                        selected ? 'border-primary' : 'border-surface-variant',
                      ].join(' ')}
                    >
                      <Icon
                        name={LAYOUT_ICONS[layout]}
                        size={28}
                        color={selected ? 'primary' : 'on-surface-variant'}
                      />
                      <Text
                        variant="label-md"
                        color={selected ? 'primary' : 'on-surface-variant'}
                        numberOfLines={2}
                        className="text-center"
                      >
                        {t(`designer.layouts.${layout}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* RSVP QR-code toggle (InvitationCard renders it when on). */}
              <Pressable
                onPress={() => updateDraftInvitation({ showQr: !design.showQr })}
                accessibilityRole="switch"
                accessibilityLabel={t('designer.addQr')}
                accessibilityState={{ checked: design.showQr }}
                className="flex-row items-center justify-between gap-3 rounded-xl border border-surface-variant bg-surface-container-lowest px-4 py-4 active:opacity-80"
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <Icon name="qr_code_2" size={24} color="on-surface-variant" />
                  <Text variant="body-md" color="on-surface" numberOfLines={1} className="flex-1">
                    {t('designer.addQr')}
                  </Text>
                </View>
                <Icon
                  name={design.showQr ? 'toggle_on' : 'toggle_off'}
                  size={36}
                  color={design.showQr ? 'primary' : 'outline'}
                />
              </Pressable>
            </View>
          </PanelHeading>
        ) : null}

        {tab === 'photo' ? (
          <PanelHeading title={t('designer.addPhoto')}>
            {design.photoUri ? (
              <View className="gap-3">
                <Button
                  label={t('common.edit')}
                  variant="secondary"
                  leftIcon="image"
                  onPress={handlePickPhoto}
                />
                <Button
                  label={t('common.delete')}
                  variant="ghost"
                  leftIcon="delete"
                  onPress={() => updateDraftInvitation({ photoUri: undefined })}
                />
              </View>
            ) : (
              <Button
                label={t('designer.addPhoto')}
                variant="secondary"
                leftIcon="add_a_photo"
                onPress={handlePickPhoto}
              />
            )}
          </PanelHeading>
        ) : null}

        {tab === 'text' ? (
          <PanelHeading title={t('designer.editText')}>
            <View className="gap-4">
              <Input
                label={t('designer.headlineLabel')}
                value={design.headline}
                onChangeText={(headline) => updateDraftInvitation({ headline })}
                placeholder={draft.title}
              />
              <Input
                label={t('designer.sublineLabel')}
                value={design.subline}
                onChangeText={(subline) => updateDraftInvitation({ subline })}
                placeholder={t('designer.sublinePlaceholder')}
              />
              <Input
                label={t('designer.bodyLabel')}
                value={design.body}
                onChangeText={(body) => updateDraftInvitation({ body })}
                placeholder={t('designer.bodyPlaceholder')}
                multiline
              />
            </View>
          </PanelHeading>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

/** Section wrapper with a headline above arbitrary panel content. */
function PanelHeading({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text variant="headline-md" className="mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Horizontal style chooser with mini previews. */
function StylePanel({
  current,
  heading,
  styleLabel,
  onSelect,
}: {
  current: InvitationStyle;
  heading: string;
  styleLabel: (s: InvitationStyle) => string;
  onSelect: (s: InvitationStyle) => void;
}) {
  return (
    <View>
      <Text variant="headline-md" className="mb-4">
        {heading}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingRight: 8 }}
      >
        {STYLE_ORDER.map((style) => {
          const preset = getStylePreset(style);
          const selected = current === style;
          return (
            <Pressable
              key={style}
              onPress={() => onSelect(style)}
              accessibilityRole="button"
              accessibilityLabel={styleLabel(style)}
              className="w-20 items-center gap-2 active:opacity-80"
            >
              <View
                className={[
                  'h-24 w-20 items-center justify-center overflow-hidden rounded-xl border-2',
                  selected ? 'border-primary' : 'border-transparent',
                ].join(' ')}
                style={{ backgroundColor: preset.bg }}
              >
                <View
                  style={{
                    width: 28,
                    height: 1,
                    backgroundColor: preset.accent,
                    opacity: 0.6,
                    marginBottom: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: preset.headlineFont,
                    fontSize: 16,
                    color: preset.text,
                  }}
                >
                  Aa
                </Text>
                <View
                  style={{
                    width: 18,
                    height: 1,
                    backgroundColor: preset.accent,
                    opacity: 0.4,
                    marginTop: 6,
                  }}
                />
              </View>
              <Text
                variant="label-md"
                color={selected ? 'primary' : 'on-surface-variant'}
                numberOfLines={2}
                className="text-center"
              >
                {styleLabel(style)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
