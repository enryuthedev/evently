import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { InvitationCard } from '@/components/invitation/InvitationCard';
import { useStore } from '@/lib/store/useStore';
import { shadows } from '@/lib/theme/tokens';
import type { EventModel, InvitationDesign } from '@/lib/data/types';

/** Sample design + event used purely for the hero card preview. */
const SAMPLE_DESIGN: InvitationDesign = {
  style: 'elegant',
  accent: 'primary',
  fontPair: 'classic',
  layout: 'centered',
  headline: 'Anna & Lukas',
  subline: 'Save the Date',
  body: 'Wir feiern unsere Hochzeit und freuen uns auf dich.',
  showQr: false,
};

const SAMPLE_EVENT: Pick<EventModel, 'title' | 'date' | 'time' | 'location' | 'occasion'> = {
  title: 'Anna & Lukas',
  date: '2026-09-12',
  time: '15:00',
  location: { name: 'Schloss Belvedere' },
  occasion: 'wedding',
};

/** A round, gently floating decorative badge anchored around the hero card. */
function FloatingBadge({
  icon,
  iconColor,
  delay,
  duration,
  style,
}: {
  icon: string;
  iconColor: string;
  delay: number;
  duration: number;
  style: object;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay, duration]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { position: 'absolute', transform: [{ translateY }] },
        style,
      ]}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest border border-surface-variant"
        style={shadows.float}
      >
        <Icon name={icon} size={26} color={iconColor} />
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete);

  const handlePrimary = () => {
    setOnboardingComplete(true);
    router.replace('/create/occasion');
  };

  const handleSecondary = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)/templates');
  };

  return (
    <Screen edges={['top', 'bottom']} contentClassName="px-5">
      {/* Hero visual — invitation card with floating badges */}
      <View className="flex-1 items-center justify-center">
        <View className="relative items-center justify-center">
          <View style={{ transform: [{ rotate: '-2deg' }] }}>
            <InvitationCard design={SAMPLE_DESIGN} event={SAMPLE_EVENT} size="md" />
          </View>

          <FloatingBadge
            icon="calendar_today"
            iconColor="primary"
            delay={0}
            duration={2000}
            style={{ top: -20, right: -8 }}
          />
          <FloatingBadge
            icon="favorite"
            iconColor="secondary-fixed-dim"
            delay={800}
            duration={2500}
            style={{ top: '46%', left: -16 }}
          />
          <FloatingBadge
            icon="location_on"
            iconColor="primary-container"
            delay={1500}
            duration={3000}
            style={{ bottom: -12, right: -4 }}
          />
        </View>
      </View>

      {/* Content & actions */}
      <View className="items-center pb-10">
        <Text
          variant="label-sm"
          color="primary"
          className="uppercase tracking-widest mb-5 text-center"
        >
          {t('onboarding.brand')}
        </Text>

        <View className="mb-8 items-center">
          <Text variant="headline-xl-mobile" color="on-surface" className="text-center">
            {t('onboarding.titleLine1')}
          </Text>
          <Text variant="headline-xl-mobile" color="primary" className="text-center">
            {t('onboarding.titleLine2')}
          </Text>
          <Text variant="headline-xl-mobile" color="on-surface" className="text-center">
            {t('onboarding.titleLine3')}
          </Text>
        </View>

        <View className="w-full max-w-sm gap-3">
          <Button label={t('onboarding.ctaPrimary')} variant="primary" onPress={handlePrimary} />
          <Button
            label={t('onboarding.ctaSecondary')}
            variant="secondary"
            onPress={handleSecondary}
          />
        </View>
      </View>
    </Screen>
  );
}
