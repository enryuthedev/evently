import { View, Image } from 'react-native';
import { Text } from '@/components/ui/Text';

export interface AvatarProps {
  /** Remote/local image uri. When absent, initials are shown. */
  uri?: string;
  /** Used to derive initials and for accessibility. */
  name?: string;
  /** Diameter in px. Default 40. */
  size?: number;
  className?: string;
}

function initialsOf(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/**
 * Circular avatar — renders the image when `uri` is present, otherwise a
 * primary-container circle with the person's initials.
 */
export function Avatar({ uri, name, size = 40, className }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityRole="image"
        accessibilityLabel={name ?? 'Avatar'}
        style={dimension}
        className={['bg-surface-container', className]
          .filter(Boolean)
          .join(' ')}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ?? 'Avatar'}
      style={dimension}
      className={[
        'items-center justify-center bg-primary-container',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Text
        variant="label-md"
        color="on-primary-container"
        style={{
          fontSize: Math.max(11, size * 0.4),
          lineHeight: Math.max(13, size * 0.46),
        }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

export default Avatar;
