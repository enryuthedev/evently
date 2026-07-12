import { View } from 'react-native';

export interface DividerProps {
  /** Vertical divider instead of horizontal. */
  vertical?: boolean;
  className?: string;
}

/**
 * Hairline divider in the surface-variant tone. See CONTRACT.md §4.
 */
export function Divider({ vertical = false, className }: DividerProps) {
  return (
    <View
      className={[
        'bg-surface-variant',
        vertical ? 'w-px self-stretch' : 'h-px w-full',
        className ?? '',
      ].join(' ')}
    />
  );
}

export default Divider;
