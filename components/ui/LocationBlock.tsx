import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MapView } from '@/components/ui/MapView';
import { Text } from '@/components/ui/Text';
import { openInMaps } from '@/lib/utils/maps';
import type { EventLocation } from '@/lib/data/types';

export interface LocationBlockProps {
  location: EventLocation;
  /** Show the embedded map preview when a GPS pin is set. Default: true. */
  showMap?: boolean;
}

/**
 * Displays an event location: name row, and (when a GPS pin exists) an embedded
 * map preview with an "open directions" button. Used on the event hub and the
 * guest RSVP view.
 */
export function LocationBlock({ location, showMap = true }: LocationBlockProps) {
  const { t } = useTranslation();
  const hasPin = location.lat != null && location.lng != null;
  const title = location.name || location.address || '';

  return (
    <View className="gap-3">
      {!!title && (
        <View className="flex-row items-center gap-2">
          <Icon name="location_on" size={18} color="primary" />
          <Text variant="body-md" color="on-surface" className="flex-1">
            {title}
          </Text>
        </View>
      )}

      {hasPin && showMap ? (
        <View className="overflow-hidden rounded-2xl border border-surface-variant">
          <MapView lat={location.lat!} lng={location.lng!} height={150} zoom={15} />
          <View className="gap-3 bg-surface-container-lowest px-4 py-3">
            {!!location.address && (
              <Text variant="body-sm" color="on-surface-variant" numberOfLines={2}>
                {location.address}
              </Text>
            )}
            <Button
              label={t('location.openInMaps')}
              variant="secondary"
              size="md"
              leftIcon="directions"
              onPress={() => openInMaps(location.lat!, location.lng!, location.name)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default LocationBlock;
