import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';

export interface WizardHeaderProps {
  /** Back handler (left arrow). Hidden when omitted. */
  onBack?: () => void;
  /** Cancel handler (right close). Hidden when omitted. */
  onCancel?: () => void;
  /** Center brand/title. Default: "Evently". */
  title?: string;
}

/**
 * Wizard top bar: back (left) + centered brand + close (right). `px-5 py-6`.
 * See CONTRACT.md §4 + anlass_waehlen Stitch (wizard header).
 */
export function WizardHeader({ onBack, onCancel, title = 'Evently' }: WizardHeaderProps) {
  return (
    <View className="bg-background px-5 py-6 flex-row items-center justify-between">
      <View className="w-12 items-start">
        {onBack ? (
          <IconButton
            name="arrow_back"
            onPress={onBack}
            color="on-surface-variant"
            accessibilityLabel="Zurück"
          />
        ) : null}
      </View>

      <Text variant="headline-xl-mobile" color="primary">
        {title}
      </Text>

      <View className="w-12 items-end">
        {onCancel ? (
          <IconButton
            name="close"
            onPress={onCancel}
            color="on-surface-variant"
            accessibilityLabel="Abbrechen"
          />
        ) : null}
      </View>
    </View>
  );
}

export default WizardHeader;
