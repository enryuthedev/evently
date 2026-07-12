import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { ColorName } from '@/lib/theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading material symbol. */
  icon?: string;
  className?: string;
}

/**
 * Pill chip for filters/selection. Selected = sage tint, unselected = neutral.
 * See CONTRACT.md §4.
 */
export function Chip({ label, selected = false, onPress, icon, className }: ChipProps) {
  const fg: ColorName = selected ? 'on-primary-container' : 'on-surface-variant';

  const content = (
    <View className="flex-row items-center flex-shrink">
      {icon ? <Icon name={icon} size={16} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text variant="label-sm" color={fg} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
    </View>
  );

  const classes = [
    'flex-row items-center self-start rounded-full px-4 py-2',
    selected ? 'bg-primary-container/20' : 'bg-surface-container',
    onPress ? 'active:opacity-70' : '',
    className ?? '',
  ].join(' ');

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className={classes}>
        {content}
      </Pressable>
    );
  }

  return <View className={classes}>{content}</View>;
}

export default Chip;
