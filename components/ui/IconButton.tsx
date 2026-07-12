import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { ColorName } from '@/lib/theme/tokens';

export interface IconButtonProps {
  /** Material symbol name (snake_case). */
  name: string;
  onPress?: () => void;
  size?: number;
  color?: ColorName | (string & {});
  accessibilityLabel?: string;
  className?: string;
}

/**
 * Circular icon button with a comfortable hit area. See CONTRACT.md §4.
 */
export function IconButton({
  name,
  onPress,
  size = 24,
  color = 'on-surface-variant',
  accessibilityLabel,
  className,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className={[
        'h-11 w-11 items-center justify-center rounded-full active:opacity-70 active:bg-surface-container',
        className ?? '',
      ].join(' ')}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

export default IconButton;
