import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { palette, shadows } from '@/lib/theme/tokens';
import { useStore } from '@/lib/store/useStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isExpoGo,
  type PaywallPackage,
} from '@/lib/purchases';

const FEATURE_KEYS = [
  'paywall.feature1',
  'paywall.feature2',
  'paywall.feature3',
  'paywall.feature4',
  'paywall.feature5',
  'paywall.feature6',
] as const;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const updateProfile = useStore((s) => s.updateProfile);

  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [selectedId, setSelectedId] = useState<PaywallPackage['id']>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const offerings = await getOfferings();
      if (!active) return;
      setPackages(offerings);
      const preferred = offerings.find((p) => p.highlighted) ?? offerings[0];
      if (preferred) setSelectedId(preferred.id);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePackage(selectedId);
      if (result.success) {
        updateProfile({ isPremium: true });
        router.back();
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const ok = await restorePurchases();
      if (ok) {
        updateProfile({ isPremium: true });
        router.back();
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-6"
      footer={
        <View className="border-t border-surface-variant bg-background px-5 pb-6 pt-4">
          <Button
            label={t('paywall.subscribe')}
            onPress={handleSubscribe}
            loading={purchasing}
            disabled={packages.length === 0}
            leftIcon="lock_open"
          />
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            accessibilityRole="button"
            className="mt-3 items-center py-2 active:opacity-70"
          >
            <Text variant="label-md" color="on-surface-variant">
              {t('paywall.restore')}
            </Text>
          </Pressable>
        </View>
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center justify-end pt-1">
        <IconButton
          name="close"
          onPress={() => router.back()}
          accessibilityLabel={t('common.close')}
        />
      </View>

      {/* Hero */}
      <View className="items-center pb-6 pt-2">
        <View
          className="h-16 w-16 items-center justify-center rounded-3xl bg-primary-container"
          style={shadows.card}
        >
          <Icon name="workspace_premium" size={34} color="on-primary-container" />
        </View>
        <Text variant="headline-lg" color="on-surface" className="mt-5 text-center">
          {t('paywall.title')}
        </Text>
        <Text
          variant="body-md"
          color="on-surface-variant"
          className="mt-2 text-center"
        >
          {t('paywall.subtitle')}
        </Text>
      </View>

      {/* Feature list */}
      <View
        className="rounded-3xl border border-surface-variant bg-surface-container-lowest p-5"
        style={shadows.card}
      >
        {FEATURE_KEYS.map((key, idx) => (
          <View
            key={key}
            className={`flex-row items-center ${idx === 0 ? '' : 'mt-4'}`}
          >
            <Icon name="check_circle" size={22} color="primary" />
            <Text variant="body-md" color="on-surface" className="ml-3 flex-1">
              {t(key)}
            </Text>
          </View>
        ))}
      </View>

      {/* Plan cards */}
      <View
        className="mt-6 flex-row gap-3"
        accessibilityRole="radiogroup"
        accessibilityLabel={t('paywall.title')}
      >
        {packages.length === 0
          ? [0, 1].map((i) => (
              <View
                key={i}
                className="flex-1 items-center justify-center rounded-3xl border-2 border-surface-variant bg-surface-container-lowest p-4"
                style={{ minHeight: 96 }}
              >
                <ActivityIndicator color={palette.primary} />
              </View>
            ))
          : null}
        {packages.map((pkg) => {
          const selected = pkg.id === selectedId;
          const periodLabel =
            pkg.period === 'year' ? t('paywall.perYear') : t('paywall.perMonth');
          return (
            <Pressable
              key={pkg.id}
              onPress={() => setSelectedId(pkg.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`flex-1 rounded-3xl border-2 p-4 active:opacity-90 ${
                selected
                  ? 'border-primary bg-primary-container/20'
                  : 'border-surface-variant bg-surface-container-lowest'
              }`}
              style={selected ? shadows.card : undefined}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  variant="label-md"
                  color="on-surface"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="flex-shrink mr-2"
                >
                  {pkg.period === 'year'
                    ? t('paywall.yearly')
                    : t('paywall.monthly')}
                </Text>
                <View className="flex-row items-center">
                  {pkg.highlighted ? (
                    <View className="mr-2 rounded-full bg-primary-container px-2 py-0.5">
                      <Text variant="label-sm" color="on-primary-container">
                        {t('paywall.mostPopular')}
                      </Text>
                    </View>
                  ) : null}
                  <Icon
                    name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    size={20}
                    color={selected ? 'primary' : 'on-surface-variant'}
                  />
                </View>
              </View>
              <View className="mt-4 flex-row items-baseline">
                <Text variant="headline-md" color="on-surface">
                  {pkg.priceString}
                </Text>
                <Text
                  variant="body-sm"
                  color="on-surface-variant"
                  className="ml-1"
                >
                  {periodLabel}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Expo Go note */}
      {isExpoGo() ? (
        <View className="mt-5 flex-row items-start rounded-2xl bg-surface-container p-4">
          <Icon name="info" size={18} color="on-surface-variant" />
          <Text
            variant="body-sm"
            color="on-surface-variant"
            className="ml-2 flex-1"
          >
            {t('paywall.expoGoNote')}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
