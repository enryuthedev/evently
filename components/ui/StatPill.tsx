import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { ColorName } from '@/lib/theme/tokens';

export type StatPillTone = 'yes' | 'no' | 'maybe' | 'pending' | 'neutral';

export interface StatPillProps {
  value: number | string;
  label: string;
  /** Colorway. Default 'neutral'. */
  tone?: StatPillTone;
  className?: string;
}

interface ToneColors {
  bg: string;
  value: ColorName;
  label: ColorName;
}

/** Soft tinted colorways keyed by RSVP-style tone. */
const TONES: Record<StatPillTone, ToneColors> = {
  yes: { bg: 'bg-primary-container/20', value: 'primary', label: 'on-surface-variant' },
  no: { bg: 'bg-error-container/40', value: 'error', label: 'on-surface-variant' },
  maybe: { bg: 'bg-secondary-container/30', value: 'secondary', label: 'on-surface-variant' },
  pending: { bg: 'bg-surface-container', value: 'on-surface-variant', label: 'on-surface-variant' },
  neutral: { bg: 'bg-surface-container', value: 'on-surface', label: 'on-surface-variant' },
};

/**
 * Compact stat tile — a large value over a small caption label, tinted by the
 * RSVP-style `tone`. Used for guest/RSVP count summaries.
 */
export function StatPill({ value, label, tone = 'neutral', className }: StatPillProps) {
  const colors = TONES[tone];
  return (
    <View
      className={[
        'min-w-0 items-center justify-center rounded-2xl px-2 py-3',
        colors.bg,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Text
        variant="headline-md"
        color={colors.value}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        variant="label-sm"
        color={colors.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        className="mt-1 text-center uppercase"
      >
        {label}
      </Text>
    </View>
  );
}

export default StatPill;
