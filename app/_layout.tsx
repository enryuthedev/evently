import '@/global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
// Invitation display fonts (designer "Schrift" tab — see lib/theme/fontPairs.ts).
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import {
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { initI18n } from '@/lib/i18n';
import { initPurchases } from '@/lib/purchases';
import { useStore } from '@/lib/store/useStore';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Invitation display fonts.
    PlayfairDisplay_600SemiBold,
    CormorantGaramond_600SemiBold,
    GreatVibes_400Regular,
    DancingScript_700Bold,
    Montserrat_700Bold,
    Lora_400Regular,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [i18nReady, setI18nReady] = useState(false);
  const hydrated = useStore((s) => s._hydrated);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initI18n();
      if (mounted) setI18nReady(true);
    })();
    initPurchases();
    return () => {
      mounted = false;
    };
  }, []);

  const ready = fontsLoaded && i18nReady && hydrated;

  if (!ready) {
    // Keep the native splash visible until everything is ready.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fcf9f8' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="create" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="rsvp/[id]" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
