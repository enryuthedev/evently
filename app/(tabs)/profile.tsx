import { useState } from 'react';
import { Modal, Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { INVITATION_STYLES } from '@/components/invitation/stylePresets';
import { useProfile, usePremium } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { setAppLanguage } from '@/lib/i18n';
import { palette, shadows } from '@/lib/theme/tokens';
import type { InvitationStyle, Language } from '@/lib/data/types';

const APP_VERSION = '1.0.0';

const STYLE_ORDER: InvitationStyle[] = [
  'elegant',
  'floral',
  'modern',
  'minimal',
  'luxury',
  'casual',
];

const LANGUAGE_ORDER: Language[] = ['de', 'en', 'tr', 'fr', 'es'];

/** Native, untranslated language names (per spec). */
const LANGUAGE_NAMES: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  tr: 'Türkçe',
  fr: 'Français',
  es: 'Español',
};

interface PickerOption {
  value: string;
  label: string;
  swatch?: string;
}

interface PickerSheetProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/** Lightweight bottom-sheet single-choice picker. */
function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: PickerSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-surface-container-lowest rounded-t-3xl px-5 pt-3 pb-8"
          style={shadows.float}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pb-2">
            <View className="h-1 w-10 rounded-full bg-surface-variant" />
          </View>

          <Text variant="headline-md" color="on-surface" className="py-2">
            {title}
          </Text>

          <View className="mt-1">
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onSelect(opt.value)}
                  className="flex-row items-center gap-3 py-3.5"
                  accessibilityRole="button"
                >
                  {opt.swatch ? (
                    <View
                      className="h-7 w-7 rounded-full border border-surface-variant"
                      style={{ backgroundColor: opt.swatch }}
                    />
                  ) : null}
                  <Text
                    variant="body-lg"
                    color={active ? 'primary' : 'on-surface'}
                    className="flex-1"
                  >
                    {opt.label}
                  </Text>
                  {active ? (
                    <Icon name="check" size={22} color="primary" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chevron() {
  return <Icon name="chevron_right" size={22} color="on-surface-variant" />;
}

function ValueTrail({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text
        variant="body-md"
        color="on-surface-variant"
        numberOfLines={1}
        className="max-w-[140px]"
      >
        {label}
      </Text>
      <Chevron />
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-surface-variant ml-[52px]" />;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfile();
  const isPremium = usePremium();
  const updateProfile = useStore((s) => s.updateProfile);

  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  const handlePickStyle = (value: string) => {
    updateProfile({ defaultStyle: value as InvitationStyle });
    setStylePickerOpen(false);
  };

  const handlePickLanguage = (value: string) => {
    const lang = value as Language;
    void setAppLanguage(lang);
    updateProfile({ language: lang });
    setLangPickerOpen(false);
  };

  return (
    <Screen scroll contentClassName="pb-12">
      <AppHeader title={t('profile.title')} />

      {/* Identity */}
      <View className="items-center px-5 pt-4 pb-8">
        <Avatar name={profile.name} size={88} />
        <View className="w-full mt-6">
          <Input
            label={t('profile.nameLabel')}
            value={profile.name}
            onChangeText={(text) => updateProfile({ name: text })}
            icon="person"
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Preferences */}
      <View className="px-5">
        <Card padded={false} className="px-5">
          <ListRow
            title={t('profile.defaultStyle')}
            left={
              <View
                className="h-9 w-9 rounded-xl border border-surface-variant"
                style={{ backgroundColor: INVITATION_STYLES[profile.defaultStyle].bg }}
              />
            }
            right={
              <ValueTrail label={t(`designer.styles.${profile.defaultStyle}`)} />
            }
            onPress={() => setStylePickerOpen(true)}
          />
          <Divider />
          <ListRow
            title={t('profile.language')}
            left={<Icon name="translate" size={24} color="on-surface-variant" />}
            right={<ValueTrail label={LANGUAGE_NAMES[profile.language]} />}
            onPress={() => setLangPickerOpen(true)}
          />
          <Divider />
          <ListRow
            title={t('profile.notifications')}
            left={
              <Icon name="notifications" size={24} color="on-surface-variant" />
            }
            right={
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(v) => updateProfile({ notificationsEnabled: v })}
                accessibilityLabel={t('profile.notifications')}
                trackColor={{
                  false: palette['surface-variant'],
                  true: palette['primary-container'],
                }}
                thumbColor={
                  profile.notificationsEnabled
                    ? palette['primary']
                    : palette['surface-container-lowest']
                }
                ios_backgroundColor={palette['surface-variant']}
              />
            }
            onPress={() =>
              updateProfile({
                notificationsEnabled: !profile.notificationsEnabled,
              })
            }
          />
        </Card>
      </View>

      {/* Premium */}
      <View className="px-5 mt-4">
        <Card padded={false} className="px-5">
          <ListRow
            title={t('profile.premium')}
            left={
              <Icon
                name="workspace_premium"
                size={24}
                color={isPremium ? 'tertiary' : 'on-surface-variant'}
              />
            }
            right={
              isPremium ? (
                <View className="flex-row items-center gap-1.5">
                  <Icon name="check_circle" size={20} color="primary" />
                  <Text variant="label-md" color="primary">
                    {t('profile.premiumActive')}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Text variant="label-md" color="tertiary">
                    {t('profile.upgradeCta')}
                  </Text>
                  <Chevron />
                </View>
              )
            }
            onPress={() => router.push('/paywall')}
          />
        </Card>
      </View>

      {/* Library & info */}
      <View className="px-5 mt-4">
        <Card padded={false} className="px-5">
          <ListRow
            title={t('profile.templates')}
            left={
              <Icon name="grid_view" size={24} color="on-surface-variant" />
            }
            right={<Chevron />}
            onPress={() => router.push('/templates')}
          />
          <Divider />
          <ListRow
            title={t('profile.about')}
            left={<Icon name="info" size={24} color="on-surface-variant" />}
            right={
              <Text variant="body-md" color="on-surface-variant">
                {`${t('profile.version')} ${APP_VERSION}`}
              </Text>
            }
          />
        </Card>
      </View>

      <PickerSheet
        visible={stylePickerOpen}
        title={t('designer.chooseStyle')}
        selected={profile.defaultStyle}
        onSelect={handlePickStyle}
        onClose={() => setStylePickerOpen(false)}
        options={STYLE_ORDER.map((s) => ({
          value: s,
          label: t(`designer.styles.${s}`),
          swatch: INVITATION_STYLES[s].bg,
        }))}
      />

      <PickerSheet
        visible={langPickerOpen}
        title={t('profile.language')}
        selected={profile.language}
        onSelect={handlePickLanguage}
        onClose={() => setLangPickerOpen(false)}
        options={LANGUAGE_ORDER.map((l) => ({
          value: l,
          label: LANGUAGE_NAMES[l],
        }))}
      />
    </Screen>
  );
}
