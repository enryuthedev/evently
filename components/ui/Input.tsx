import { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  KeyboardTypeOptions,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/lib/theme/tokens';

export interface InputProps
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'multiline'> {
  /** Field label rendered above the input. */
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Optional leading Material Symbol icon name. */
  icon?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Error message; when set the border + text turn error color. */
  error?: string;
  className?: string;
}

/**
 * Themed text field — label above, rounded-xl surface, focus ring in primary,
 * optional leading icon, multiline support, and an error line below.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  keyboardType,
  autoCapitalize,
  error,
  className,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-error'
    : focused
      ? 'border-primary'
      : 'border-surface-variant';

  return (
    <View className={['w-full', className].filter(Boolean).join(' ')}>
      {label ? (
        <Text variant="label-md" color="on-surface-variant" className="mb-2">
          {label}
        </Text>
      ) : null}

      <View
        className={[
          'flex-row items-center rounded-xl border bg-surface-container-lowest px-4',
          multiline ? 'py-3 items-start' : 'h-14',
          borderClass,
        ].join(' ')}
      >
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? 'primary' : 'on-surface-variant'}
            style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette['outline']}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={
            label
              ? error
                ? `${label}, ${error}`
                : label
              : undefined
          }
          accessibilityState={{ disabled: rest.editable === false }}
          aria-invalid={error ? true : undefined}
          style={{
            flex: 1,
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            lineHeight: 24,
            color: palette['on-surface'],
            paddingVertical: 0,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          {...rest}
        />
      </View>

      {error ? (
        <Text variant="body-sm" color="error" className="mt-1.5">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default Input;
