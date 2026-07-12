import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { WizardHeader } from '@/components/ui/WizardHeader';
import { useDraft } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import { occasionMeta } from '@/lib/utils/occasions';
import type { OccasionType } from '@/lib/data/types';

/** The 6 primary occasions shown on wizard step 1 (Stitch: anlass_waehlen). */
const PRIMARY_OCCASIONS: OccasionType[] = [
  'wedding',
  'birthday',
  'dinner',
  'friends',
  'corporate',
  'custom',
];

export default function OccasionScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const startDraft = useStore((s) => s.startDraft);
  const updateDraft = useStore((s) => s.updateDraft);
  const cancelDraft = useStore((s) => s.cancelDraft);

  // Ensure a draft exists when entering the wizard.
  useEffect(() => {
    if (!draft) startDraft();
  }, [draft, startDraft]);

  const handleCancel = () => {
    cancelDraft();
    router.replace('/(tabs)');
  };

  const handleSelect = (type: OccasionType) => {
    const meta = occasionMeta(type);
    updateDraft({ occasion: type, mode: meta.defaultMode });
    router.push('/create/details');
  };

  return (
    <Screen scroll contentClassName="px-5 pb-16">
      <WizardHeader onCancel={handleCancel} />

      {/* Progress */}
      <View className="mt-2 mb-12">
        <View className="mb-2 flex-row items-center justify-between">
          <Text variant="label-sm" color="primary" className="uppercase">
            {t('wizard.stepOf', { current: 1, total: 4 })}
          </Text>
          <Text variant="label-sm" color="on-surface-variant" className="uppercase">
            {t('wizard.step1')}
          </Text>
        </View>
        <ProgressBar value={0.25} />
      </View>

      {/* Title */}
      <View className="mb-10 items-center">
        <Text
          variant="headline-xl-mobile"
          color="on-background"
          className="mb-4 text-center"
        >
          {t('wizard.occasionTitle')}
        </Text>
        <Text variant="body-lg" color="on-surface-variant" className="text-center">
          {t('wizard.occasionSubtitle')}
        </Text>
      </View>

      {/* 2-col grid of occasion cards */}
      <View className="flex-row flex-wrap justify-between">
        {PRIMARY_OCCASIONS.map((type) => {
          const meta = occasionMeta(type);
          const isSelected = draft?.occasion === type;
          return (
            <Card
              key={type}
              onPress={() => handleSelect(type)}
              padded={false}
              className={`mb-4 w-[48%] items-center justify-center py-8 ${
                isSelected ? 'border-2 border-primary bg-primary-container/20' : ''
              }`}
            >
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
                <Icon name={meta.icon} size={30} color="primary" />
              </View>
              <Text
                variant="label-md"
                color="on-background"
                numberOfLines={1}
                adjustsFontSizeToFit
                className="w-full px-2 text-center"
              >
                {t(`occasions.${type}`)}
              </Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
