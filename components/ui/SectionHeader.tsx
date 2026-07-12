import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface SectionHeaderProps {
  title: string;
  /** Optional trailing action label (e.g. "Alle ansehen"). */
  actionLabel?: string;
  onActionPress?: () => void;
  className?: string;
}

/**
 * Section heading — `headline-md` title with an optional right-aligned action
 * ("Alle ansehen →") rendered with a forward arrow icon.
 */
export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={[
        'flex-row items-center justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Text variant="headline-md" color="on-surface" className="flex-1">
        {title}
      </Text>

      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="flex-shrink-0 flex-row items-center gap-1 pl-3"
        >
          <Text
            variant="label-md"
            color="primary"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {actionLabel}
          </Text>
          <Icon name="arrow_forward" size={16} color="primary" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default SectionHeader;
