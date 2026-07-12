import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { MapView, type MapViewHandle } from '@/components/ui/MapView';
import { Text } from '@/components/ui/Text';
import { palette } from '@/lib/theme/tokens';
import type { EventLocation } from '@/lib/data/types';

/** Fallback center (Berlin) when there's no initial pin and no GPS permission. */
const DEFAULT_CENTER = { lat: 52.52, lng: 13.405 };

export interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: EventLocation) => void;
  initial?: EventLocation | null;
}

/** Compose a readable single-line address from a reverse-geocode result. */
function formatGeocode(r: Location.LocationGeocodedAddress): {
  name: string;
  address: string;
} {
  const street = [r.street, r.streetNumber].filter(Boolean).join(' ');
  const cityLine = [r.postalCode, r.city].filter(Boolean).join(' ');
  const name = r.name || street || r.city || '';
  const address = [street || r.name, cityLine, r.country].filter(Boolean).join(', ');
  return { name, address };
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  initial,
}: LocationPickerModalProps) {
  const { t } = useTranslation();
  const mapRef = useRef<MapViewHandle>(null);

  const [coords, setCoords] = useState({
    lat: initial?.lat ?? DEFAULT_CENTER.lat,
    lng: initial?.lng ?? DEFAULT_CENTER.lng,
  });
  const [query, setQuery] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // When opened without an existing pin, try to jump to the user's location.
  useEffect(() => {
    if (!visible) return;
    if (initial?.lat != null && initial?.lng != null) return;
    void locateMe(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const reverse = async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const { name, address: addr } = formatGeocode(results[0]);
        setAddress(addr);
        setQuery((q) => (q.trim() ? q : name));
      }
    } catch {
      // reverse geocoding is best-effort
    }
  };

  /** Move the pin to (lat,lng): update state, recenter the map, reverse geocode. */
  const moveTo = (lat: number, lng: number, recenter = true) => {
    setCoords({ lat, lng });
    if (recenter) mapRef.current?.setPin(lat, lng);
    void reverse(lat, lng);
  };

  const locateMe = async (announce = true) => {
    setBusy(true);
    setHint(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (announce) setHint(t('location.permissionDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      moveTo(pos.coords.latitude, pos.coords.longitude);
    } catch {
      if (announce) setHint(t('location.permissionDenied'));
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setHint(null);
    try {
      const results = await Location.geocodeAsync(query.trim());
      if (results.length > 0) {
        moveTo(results[0].latitude, results[0].longitude);
      } else {
        setHint(t('location.noResults'));
      }
    } catch {
      setHint(t('location.noResults'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    onSelect({
      name: query.trim() || t('location.pinnedPlace'),
      address: address.trim() || undefined,
      lat: coords.lat,
      lng: coords.lng,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-surface-variant px-4 pb-3 pt-14">
          <IconButton name="close" onPress={onClose} accessibilityLabel={t('common.close')} />
          <Text variant="headline-md" color="on-surface">
            {t('location.title')}
          </Text>
          <IconButton
            name="check"
            color="primary"
            onPress={confirm}
            accessibilityLabel={t('common.done')}
          />
        </View>

        {/* Map */}
        <View className="relative flex-1">
          <MapView
            ref={mapRef}
            lat={coords.lat}
            lng={coords.lng}
            interactive
            onChange={({ lat, lng }) => moveTo(lat, lng, false)}
            style={{ flex: 1, height: undefined }}
          />

          {/* Center hint + current-location FAB */}
          <View className="absolute left-4 right-4 top-4">
            <View className="flex-row items-center gap-2 self-start rounded-full bg-surface-container-lowest/95 px-3 py-2">
              <Icon name="touch_app" size={16} color="on-surface-variant" />
              <Text variant="label-sm" color="on-surface-variant">
                {t('location.dropHint')}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => void locateMe(true)}
            accessibilityRole="button"
            accessibilityLabel={t('location.currentLocation')}
            className="absolute bottom-4 right-4 h-14 w-14 items-center justify-center rounded-full bg-primary-container active:opacity-90"
            style={{
              shadowColor: '#2d2d2d',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {busy ? (
              <ActivityIndicator color={palette['on-primary-container']} />
            ) : (
              <Icon name="my_location" size={24} color="on-primary-container" />
            )}
          </Pressable>
        </View>

        {/* Bottom sheet: search + address + confirm */}
        <View className="gap-4 border-t border-surface-variant bg-surface-container-lowest px-5 pb-8 pt-4">
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                label={t('location.search')}
                value={query}
                onChangeText={setQuery}
                placeholder={t('location.searchPlaceholder')}
                icon="search"
                returnKeyType="search"
                onSubmitEditing={() => void search()}
              />
            </View>
            <Button
              label={t('common.search')}
              size="md"
              fullWidth={false}
              onPress={() => void search()}
            />
          </View>

          {hint ? (
            <Text variant="body-sm" color="error">
              {hint}
            </Text>
          ) : address ? (
            <View className="flex-row items-start gap-2">
              <Icon name="location_on" size={18} color="primary" />
              <Text variant="body-sm" color="on-surface-variant" className="flex-1">
                {address}
              </Text>
            </View>
          ) : null}

          <Button
            label={t('location.useThisLocation')}
            leftIcon="check_circle"
            onPress={confirm}
          />
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default LocationPickerModal;
