import { Linking, Platform } from 'react-native';

/**
 * Open the device's maps app with directions / a marker for the given pin.
 * Uses the platform-native scheme, falling back to a Google Maps web URL.
 */
export async function openInMaps(lat: number, lng: number, label?: string): Promise<void> {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const url =
    Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${q})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    }) ?? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  }
}
