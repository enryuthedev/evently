import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { ColorName } from '@/lib/theme/tokens';
import { RSVPStatus } from '@/lib/data/types';

export type BadgeStatus = RSVPStatus | 'neutral';

export interface BadgeProps {
  status: BadgeStatus;
  /** Override the displayed text. Defaults to the status name. */
  label?: string;
  className?: string;
}

const STATUS_STYLE: Record<BadgeStatus, { bg: string; fg: ColorName }> = {
  yes: { bg: 'bg-primary-container/20', fg: 'on-primary-container' },
  no: { bg: 'bg-error-container', fg: 'on-error-container' },
  maybe: { bg: 'bg-tertiary-container/30', fg: 'on-tertiary-container' },
  pending: { bg: 'bg-surface-container', fg: 'on-surface-variant' },
  neutral: { bg: 'bg-surface-container', fg: 'on-surface-variant' },
};

const DEFAULT_LABEL: Record<BadgeStatus, string> = {
  yes: 'Zugesagt',
  no: 'Abgesagt',
  maybe: 'Vielleicht',
  pending: 'Ausstehend',
  neutral: '',
};

/**
 * Status pill colored by RSVP status. See CONTRACT.md §4.
 */
export function Badge({ status, label, className }: BadgeProps) {
  const s = STATUS_STYLE[status];
  return (
    <View
      className={['self-start rounded-full border border-transparent px-3 py-1', s.bg, className ?? ''].join(
        ' ',
      )}
    >
      <Text variant="label-sm" color={s.fg} numberOfLines={1}>
        {label ?? DEFAULT_LABEL[status]}
      </Text>
    </View>
  );
}

export default Badge;
