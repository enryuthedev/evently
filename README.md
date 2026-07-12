# Evently

Eventplaner-App — von spontanen Freundestreffen bis zur Hochzeit. Events planen,
digitale Einladungskarten gestalten, Termine abstimmen, Gäste verwalten, Zusagen
sammeln und Karten drucken/exportieren.

Built with **Expo SDK 54** · expo-router · React Native 0.81 · NativeWind v4 ·
zustand · i18next (DE/EN/TR/FR/ES) · RevenueCat (abstrahiert).

---

## Schnellstart (Entwicklung am Handy via Expo Go)

> Expo Go SDK **54** auf dem Handy installieren (App Store / Play Store).

```bash
npm install
npx expo start
```

QR-Code mit der Kamera (iOS) bzw. der Expo-Go-App (Android) scannen. Die App lädt
direkt aufs Handy und reloadet bei jeder Änderung (Fast Refresh).

Nützlich:
- `npm run typecheck` — TypeScript prüfen (`tsc --noEmit`)
- `npx expo start -c` — mit geleertem Metro-Cache starten
- `npm run android` / `npm run ios` — direkt auf Emulator/Simulator

### Wichtig: RevenueCat & Expo Go
`react-native-purchases` ist ein natives Modul und läuft **nicht in Expo Go**.
`lib/purchases/index.ts` erkennt Expo Go automatisch und liefert dort einen
**Mock** (Käufe „funktionieren" zum Testen, schalten Premium frei). Echte Käufe
gibt es nur in einem **Dev-Client** oder **Production-Build** (siehe unten). Alle
übrigen Features (Druck/PDF, QR, Bildauswahl, Datumswahl) laufen in Expo Go.

---

## Projektstruktur

```
app/                      # expo-router Routen (file-based)
  _layout.tsx             # Root: Provider, Fonts, i18n, Store-Hydration, Stack
  index.tsx               # Redirect → Onboarding oder Tabs
  onboarding.tsx          # Willkommen
  (tabs)/                 # Home · Events · Vorlagen · Profil (Bottom-Tabs)
  create/                 # Event-Wizard: occasion → details → poll → design → review
  event/[id]/             # Host-Hub: guests · poll · checklist · timeline · bring · print
  rsvp/[id].tsx           # Gäste-Ansicht über Link (Deep Link / Web)
  paywall.tsx             # Premium
components/ui/            # Design-System-Primitive (Text, Button, Card, Icon, …)
components/invitation/    # InvitationCard + Stil-Presets
lib/theme/                # Design-Tokens (mirror von tailwind.config.js)
lib/store/                # zustand Store + Selektoren (AsyncStorage-persistiert)
lib/data/                # Typen + Seed-Daten
lib/i18n/                # i18next-Setup + Locales (de/en/tr/fr/es)
lib/purchases/           # RevenueCat-Abstraktion (Expo-Go-Mock)
lib/utils/               # format · share · print · occasions · ids
CONTRACT.md              # Interner Build-Vertrag (geteilte APIs)
```

## Design-System

Warme Sage/Champagner-Palette aus dem Stitch-Design. Tokens leben in
`lib/theme/tokens.ts` **und** `tailwind.config.js` (synchron halten). Schriften:
Hanken Grotesk (Headlines) + Inter (Body). Styling über NativeWind-Klassen,
Typografie/Icons über `<Text>` / `<Icon>`.

## Daten

Lokal-first: alles in zustand + AsyncStorage. Die Datenschicht ist über die
Store-Actions gekapselt — ein späterer Wechsel auf ein Backend (Supabase/Firebase)
für geräteübergreifendes Gäste-RSVP ersetzt nur diese Schicht. Beim ersten Start
werden Demo-Events geladen (`lib/data/seed.ts`).

## Sprachen

DE (Quelle), EN, TR, FR, ES. Umschaltbar unter Profil → Sprache. Erkennung der
Gerätesprache beim ersten Start.

---

## Builds & Store-Launch (EAS)

Für echte Käufe (RevenueCat) und Store-Releases werden native Builds gebraucht:

```bash
npm i -g eas-cli
eas login
eas build:configure              # einmalig
# Dev-Client mit RevenueCat zum Testen:
eas build --profile development --platform ios   # bzw. android
# Store-Builds:
eas build --profile production --platform all
eas submit --profile production --platform all
```

RevenueCat-API-Key in `app.json` unter `expo.extra.revenueCatApiKey` hinterlegen
(oder über EAS-Secrets), bevor ein nativer Build erstellt wird. Bundle-ID /
Package: `de.pakumedia.evently` (in `app.json` anpassbar).

Siehe `eas.json` für die Build-Profile.
