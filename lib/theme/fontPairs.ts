/**
 * Invitation font pairs — the typography the guest actually chooses in the
 * designer's "Schrift" tab. Each pair is a curated headline + body family combo.
 *
 * These families are loaded once in `app/_layout.tsx` (see FONT_PAIR_MODULES for
 * the exact @expo-google-fonts exports to register). `InvitationCard` resolves
 * `design.fontPair` through `getFontPair()` and applies the families — this is
 * what makes changing the font on the card actually take effect (the style
 * preset controls colors + decoration; the font pair controls typography).
 *
 * Font family strings MUST match the names registered with expo-font, which are
 * the export identifiers from each @expo-google-fonts package.
 */

import type { FontPair } from '@/lib/data/types';

export interface FontPairSpec {
  id: FontPair;
  /** Short human label shown in the picker (localized separately if needed). */
  label: string;
  /** Headline font family (registered via expo-font). */
  headline: string;
  /** Body / meta font family (registered via expo-font). */
  body: string;
  /** Extra letter-spacing tweak for the headline on the card (px). */
  headlineTracking?: number;
}

/**
 * Ordered list of every selectable font pair. Order = display order in the
 * designer. Keep `id`s in sync with the `FontPair` union in `lib/data/types.ts`.
 */
export const FONT_PAIRS: FontPairSpec[] = [
  {
    id: 'grotesk',
    label: 'Grotesk',
    headline: 'HankenGrotesk_700Bold',
    body: 'Inter_400Regular',
    headlineTracking: -0.4,
  },
  {
    id: 'classic',
    label: 'Classic',
    headline: 'CormorantGaramond_600SemiBold',
    body: 'Lora_400Regular',
  },
  {
    id: 'elegant',
    label: 'Elegant',
    headline: 'PlayfairDisplay_600SemiBold',
    body: 'Inter_400Regular',
  },
  {
    id: 'modern',
    label: 'Modern',
    headline: 'Montserrat_700Bold',
    body: 'Inter_400Regular',
    headlineTracking: -0.2,
  },
  {
    id: 'script',
    label: 'Script',
    headline: 'GreatVibes_400Regular',
    body: 'Lora_400Regular',
  },
  {
    id: 'playful',
    label: 'Verspielt',
    headline: 'DancingScript_700Bold',
    body: 'Poppins_400Regular',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    headline: 'Inter_600SemiBold',
    body: 'Inter_400Regular',
    headlineTracking: 0.2,
  },
  {
    id: 'bold',
    label: 'Kräftig',
    headline: 'Poppins_700Bold',
    body: 'Inter_400Regular',
    headlineTracking: -0.2,
  },
  {
    id: 'refined',
    label: 'Fein',
    headline: 'PlayfairDisplay_600SemiBold',
    body: 'Lora_400Regular',
  },
];

const BY_ID: Record<string, FontPairSpec> = Object.fromEntries(
  FONT_PAIRS.map((p) => [p.id, p]),
);

/** Resolve a font-pair id to its spec. Falls back to the first pair. */
export const getFontPair = (id: FontPair | undefined): FontPairSpec =>
  (id && BY_ID[id]) || FONT_PAIRS[0]!;
