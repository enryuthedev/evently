import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Lightweight map built on Leaflet + OpenStreetMap tiles inside a WebView.
 *
 * Deliberately avoids `react-native-maps` (a native module that does NOT run in
 * Expo Go and needs a Google Maps key). This works in Expo Go with no API key.
 *
 * - `interactive`: tap the map or drag the pin to choose a spot; each change is
 *   reported via `onChange`.
 * - Imperative `setPin(lat, lng)` (via ref) recenters the map and moves the pin —
 *   used by "use my current location" / address search without remounting.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapViewHandle {
  setPin: (lat: number, lng: number) => void;
}

export interface MapViewProps {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
  onChange?: (coords: LatLng) => void;
  height?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const buildHtml = (lat: number, lng: number, zoom: number, interactive: boolean) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  #map, .leaflet-container { background: #f6f3f2; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var interactive = ${interactive ? 'true' : 'false'};
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  });
  var map = L.map('map', {
    zoomControl: interactive,
    attributionControl: false,
    dragging: interactive,
    tap: interactive,
    scrollWheelZoom: false,
    doubleClickZoom: interactive,
    touchZoom: interactive,
    keyboard: false
  }).setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  var marker = L.marker([${lat}, ${lng}], { draggable: interactive }).addTo(map);
  function send(ll) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: ll.lat, lng: ll.lng }));
    }
  }
  if (interactive) {
    map.on('click', function (e) { marker.setLatLng(e.latlng); send(e.latlng); });
    marker.on('dragend', function () { send(marker.getLatLng()); });
  }
  window.__setPin = function (la, ln) {
    marker.setLatLng([la, ln]);
    map.setView([la, ln], Math.max(map.getZoom(), 15));
    send({ lat: la, lng: ln });
  };
  // Leaflet sometimes needs a nudge after the webview lays out.
  setTimeout(function () { map.invalidateSize(); }, 250);
</script>
</body>
</html>`;

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { lat, lng, zoom = 15, interactive = false, onChange, height = 200, className, style },
  ref,
) {
  const webRef = useRef<WebView>(null);

  // Build the HTML once from the initial center; later moves go through setPin
  // so dragging doesn't remount and reset the map.
  const html = useMemo(
    () => buildHtml(lat, lng, zoom, interactive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useImperativeHandle(ref, () => ({
    setPin: (la: number, ln: number) => {
      webRef.current?.injectJavaScript(`window.__setPin(${la}, ${ln}); true;`);
    },
  }));

  return (
    <View
      className={className}
      style={[{ height, overflow: 'hidden', backgroundColor: '#f6f3f2' }, style]}
    >
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Keep the WebView transparent until tiles paint.
        style={{ backgroundColor: '#f6f3f2', opacity: 0.999 }}
        onMessage={(event) => {
          if (!onChange) return;
          try {
            const data = JSON.parse(event.nativeEvent.data) as LatLng;
            if (typeof data.lat === 'number' && typeof data.lng === 'number') onChange(data);
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
});

export default MapView;
