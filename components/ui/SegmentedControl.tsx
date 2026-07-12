import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Pill-track segmented control. The selected segment gets a white raised chip;
 * the track itself sits on `surface-container`.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <View
      className={[
        'flex-row rounded-full bg-surface-container p-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            className={[
              'min-w-0 flex-1 items-center justify-center rounded-full py-2.5',
              selected ? 'bg-surface-container-lowest' : 'bg-transparent',
            ].join(' ')}
          >
            <Text
              variant="label-md"
              color={selected ? 'primary' : 'on-surface-variant'}
              numberOfLines={1}
              adjustsFontSizeToFit
              className="text-center"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
