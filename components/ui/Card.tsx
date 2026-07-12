import { ReactNode } from 'react';
import { AccessibilityRole, Pressable, View } from 'react-native';
import { shadows } from '@/lib/theme/tokens';

export interface CardProps {
  onPress?: () => void;
  children: ReactNode;
  className?: string;
  /** Apply internal padding. Default: true. */
  padded?: boolean;
  /** Apply the soft card shadow. Default: true. */
  elevated?: boolean;
  /** Screen-reader label. Announced when the card is pressable. */
  accessibilityLabel?: string;
  /** Override the accessibility role. Defaults to 'button' when `onPress` is set. */
  accessibilityRole?: AccessibilityRole;
}

/**
 * White surface card — rounded-3xl, hairline border, soft shadow when elevated.
 * Becomes pressable when `onPress` is provided. See CONTRACT.md §4.
 */
export function Card({
  onPress,
  children,
  className,
  padded = true,
  elevated = true,
  accessibilityLabel,
  accessibilityRole,
}: CardProps) {
  const classes = [
    'rounded-3xl bg-surface-container-lowest border border-surface-variant',
    padded ? 'p-5' : '',
    onPress ? 'active:opacity-90' : '',
    className ?? '',
  ].join(' ');

  const style = elevated ? shadows.card : undefined;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={classes}
        style={style}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} style={style}>
      {children}
    </View>
  );
}

export default Card;
