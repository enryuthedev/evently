import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { typography, palette, TypographyVariant, ColorName } from '@/lib/theme/tokens';

export interface TextProps extends RNTextProps {
  /** Typography preset from the design system. Default: 'body-md'. */
  variant?: TypographyVariant;
  /** Theme color token. Default: 'on-surface'. Ignored if `style` sets color. */
  color?: ColorName;
  /** NativeWind classes (e.g. "text-center"). Layout/alignment only —
   *  font + color come from `variant`/`color`. */
  className?: string;
}

/**
 * Themed text. Always use this instead of RN <Text> so typography + fonts stay
 * consistent. See CONTRACT.md §Components.
 *
 *   <Text variant="headline-md">Titel</Text>
 *   <Text variant="body-sm" color="on-surface-variant">Untertitel</Text>
 */
export function Text({ variant = 'body-md', color = 'on-surface', style, ...rest }: TextProps) {
  const preset = typography[variant];
  return (
    <RNText
      style={[
        {
          fontFamily: preset.fontFamily,
          fontSize: preset.fontSize,
          lineHeight: preset.lineHeight,
          letterSpacing: preset.letterSpacing,
          color: palette[color],
        },
        style,
      ]}
      {...rest}
    />
  );
}

export default Text;
