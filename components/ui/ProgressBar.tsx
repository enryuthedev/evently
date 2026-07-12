import { View } from 'react-native';

export interface ProgressBarProps {
  /** Progress from 0 to 1. */
  value: number;
  className?: string;
}

/**
 * Thin progress track — neutral rail, sage fill. See CONTRACT.md §4.
 */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      className={['h-1 w-full overflow-hidden rounded-full bg-surface-variant', className ?? ''].join(' ')}
    >
      <View className="h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
    </View>
  );
}

export default ProgressBar;
