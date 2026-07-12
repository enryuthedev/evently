import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';

export interface AppHeaderProps {
  /** Plain title shown when `showLogo` is false. */
  title?: string;
  /** Logo variant: round avatar + "Evently" wordmark + notifications bell. */
  showLogo?: boolean;
  /** Avatar image uri (logo variant). */
  avatarUri?: string;
  /** Tap handler for the avatar (e.g. open profile). */
  onAvatarPress?: () => void;
  /**
   * Tap handler for the notifications bell (logo variant). When omitted, the
   * bell surfaces a "coming soon" notice instead of silently no-oping.
   */
  onNotificationsPress?: () => void;
  /** Custom right-side node. Overrides the default notifications bell. */
  right?: ReactNode;
}

/**
 * Top app bar for tab screens. Sticky, warm background, `px-5 py-4`.
 * See CONTRACT.md §4 + dashboard Stitch (TopAppBar).
 */
export function AppHeader({
  title,
  showLogo = false,
  avatarUri,
  onAvatarPress,
  onNotificationsPress,
  right,
}: AppHeaderProps) {
  const { t } = useTranslation();

  const handleNotifications =
    onNotificationsPress ??
    (() => Alert.alert(t('profile.notifications'), t('common.comingSoon')));

  return (
    <View className="bg-background px-5 py-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-4 flex-1 min-w-0">
        {showLogo ? (
          <>
            <Pressable
              onPress={onAvatarPress}
              disabled={!onAvatarPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('nav.profile')}
            >
              <Avatar uri={avatarUri} name="Evently" size={40} />
            </Pressable>
            <Text variant="headline-xl-mobile" color="primary" numberOfLines={1}>
              Evently
            </Text>
          </>
        ) : title ? (
          <Text
            variant="headline-md"
            color="on-background"
            numberOfLines={1}
            className="flex-1"
          >
            {title}
          </Text>
        ) : null}
      </View>

      {right !== undefined ? (
        right
      ) : showLogo ? (
        <IconButton
          name="notifications"
          onPress={handleNotifications}
          color="primary"
          accessibilityLabel={t('profile.notifications')}
        />
      ) : null}
    </View>
  );
}

export default AppHeader;
