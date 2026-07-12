import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { shadows } from '@/lib/theme/tokens';

/** Maps an expo-router tab route name → its Material Symbol + i18n nav key. */
const TAB_META: Record<string, { icon: string; navKey: string }> = {
  index: { icon: 'home', navKey: 'home' },
  events: { icon: 'calendar_today', navKey: 'events' },
  templates: { icon: 'dashboard_customize', navKey: 'templates' },
  profile: { icon: 'person', navKey: 'profile' },
};

/**
 * Custom bottom tab bar for expo-router `<Tabs tabBar={(p) => <BottomTabBar {...p} />}>`.
 * Active route = filled pill (`bg-primary-container`, on-primary-container icon+label);
 * inactive = `text-outline`. Rounded-top surface-container bar, respects bottom inset.
 * See CONTRACT.md §4 + dashboard Stitch (BottomNavBar).
 */
export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      className="flex-row items-center justify-around bg-surface-container rounded-t-xl px-4 pt-3"
      style={[{ paddingBottom: Math.max(insets.bottom, 12) }, shadows.float]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META[route.name] ?? { icon: 'circle', navKey: route.name };
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const label = t(`nav.${meta.navKey}`);

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.title ?? label}
            style={{ flexShrink: 1 }}
            className={`flex-col items-center justify-center rounded-full px-3 py-1 ${
              isFocused ? 'bg-primary-container' : ''
            }`}
          >
            <Icon
              name={meta.icon}
              size={24}
              color={isFocused ? 'on-primary-container' : 'outline'}
            />
            <Text
              variant="label-sm"
              color={isFocused ? 'on-primary-container' : 'outline'}
              className="mt-1 uppercase"
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default BottomTabBar;
