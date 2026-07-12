import { ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading element (e.g. Avatar, Icon, Chip). */
  left?: ReactNode;
  /** Trailing element (e.g. Badge, chevron, value). */
  right?: ReactNode;
  onPress?: () => void;
  className?: string;
}

/**
 * Borderless list row — optional leading/trailing slots with a title +
 * subtitle column. Becomes pressable when `onPress` is provided.
 */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  className,
}: ListRowProps) {
  const content = (
    <View
      className={[
        'flex-row items-center gap-3 py-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {left ? <View>{left}</View> : null}

      <View className="flex-1">
        <Text variant="body-md" color="on-surface" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="body-sm"
            color="on-surface-variant"
            numberOfLines={1}
            className="mt-0.5"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View>{right}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        android_ripple={{ borderless: false }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default ListRow;
