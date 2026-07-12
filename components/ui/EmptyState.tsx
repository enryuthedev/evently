import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  /** Material Symbol icon name shown in the soft circle. */
  icon: string;
  title: string;
  message?: string;
  /** When both action props are set, a primary Button is rendered. */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Centered empty/placeholder state — a soft primary circle with an icon, a
 * title, an optional supporting message, and an optional primary action.
 */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View
      className={[
        'items-center justify-center px-8 py-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-container/20">
        <Icon name={icon} size={36} color="primary" />
      </View>

      <Text
        variant="headline-md"
        color="on-surface"
        className="mt-5 text-center"
      >
        {title}
      </Text>

      {message ? (
        <Text
          variant="body-md"
          color="on-surface-variant"
          className="mt-2 text-center"
        >
          {message}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View className="mt-6 w-full">
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export default EmptyState;
