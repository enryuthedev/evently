import { ReactNode } from 'react';
import { Pressable, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { ColorName, TypographyVariant, palette } from '@/lib/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Text label. Use this or `children`. */
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Material symbol name shown before the label. */
  leftIcon?: string;
  /** Material symbol name shown after the label. */
  rightIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: 'bg-primary-container',
  secondary: 'bg-surface-container',
  outline: 'bg-transparent border border-surface-variant',
  ghost: 'bg-transparent',
  danger: 'bg-error-container',
};

const VARIANT_FG: Record<ButtonVariant, ColorName> = {
  primary: 'on-primary-container',
  secondary: 'on-surface',
  outline: 'on-surface',
  ghost: 'primary',
  danger: 'on-error-container',
};

const SIZE_BOX: Record<ButtonSize, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
};

const SIZE_VARIANT: Record<ButtonSize, TypographyVariant> = {
  sm: 'label-sm',
  md: 'label-md',
  lg: 'label-md',
};

const SIZE_ICON: Record<ButtonSize, number> = { sm: 18, md: 20, lg: 22 };

/**
 * Themed button. Primary = sage container, label-md, h-14, rounded-xl.
 * See CONTRACT.md §4.
 */
export function Button({
  label,
  children,
  onPress,
  variant = 'primary',
  size = 'lg',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = true,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = VARIANT_FG[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={[
        'flex-row items-center justify-center rounded-xl active:opacity-80',
        VARIANT_BG[variant],
        SIZE_BOX[size],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : '',
        className ?? '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={palette[fg]} />
      ) : (
        <View className="flex-row items-center justify-center min-w-0 shrink">
          {leftIcon ? (
            <Icon name={leftIcon} size={SIZE_ICON[size]} color={fg} style={{ marginRight: 8 }} />
          ) : null}
          {label != null ? (
            <Text
              variant={SIZE_VARIANT[size]}
              color={fg}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flexShrink: 1 }}
            >
              {label}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? (
            <Icon name={rightIcon} size={SIZE_ICON[size]} color={fg} style={{ marginLeft: 8 }} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export default Button;
