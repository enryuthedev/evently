import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Icon name="sentiment_dissatisfied" size={48} color="on-surface-variant" />
        <Text variant="headline-md" className="mt-4 text-center">
          {t('errors.notFoundTitle')}
        </Text>
        <Text
          variant="body-md"
          color="on-surface-variant"
          className="mt-2 text-center"
        >
          {t('errors.notFoundMessage')}
        </Text>
        <Link href="/(tabs)" className="mt-6">
          <Text variant="label-md" color="primary">
            {t('errors.backHome')}
          </Text>
        </Link>
      </View>
    </>
  );
}
