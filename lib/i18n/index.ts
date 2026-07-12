/**
 * i18n configuration for Evently (i18next + react-i18next).
 *
 * - `de` is the source of truth and the fallback language.
 * - 5 statically-bundled locales: de, en, tr, fr, es.
 * - `initI18n()` resolves the start language from AsyncStorage, else the device
 *   locale (when supported), else `de`.
 * - `setAppLanguage()` persists + switches the active language.
 *
 * See CONTRACT.md §8.
 */
import 'intl-pluralrules';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Language } from '@/lib/data/types';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import tr from './locales/tr.json';

/** AsyncStorage key for the user's persisted language choice. */
export const LANGUAGE_STORAGE_KEY = 'evently-lang';

/** Languages the app ships translations for. `de` is the source/fallback. */
export const SUPPORTED_LANGUAGES: readonly Language[] = ['de', 'en', 'tr', 'fr', 'es'];

export const DEFAULT_LANGUAGE: Language = 'de';

export const resources = {
  de: { translation: de },
  en: { translation: en },
  tr: { translation: tr },
  fr: { translation: fr },
  es: { translation: es },
} as const;

function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Best-effort device language, narrowed to a supported language or `de`. */
function getDeviceLanguage(): Language {
  try {
    const code = getLocales()[0]?.languageCode;
    return isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** Resolve the language to start with: saved → device → default. */
async function resolveInitialLanguage(): Promise<Language> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(saved)) {
      return saved;
    }
  } catch {
    // fall through to device locale
  }
  return getDeviceLanguage();
}

if (!i18n.isInitialized) {
  // Synchronous baseline init so `t()` is usable before `initI18n()` resolves.
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    returnNull: false,
    interpolation: { escapeValue: false },
  });
}

/**
 * Initialize i18n with the resolved start language. Call once at app start
 * (root layout) and await before rendering gated content.
 */
export async function initI18n(): Promise<typeof i18n> {
  const lng = await resolveInitialLanguage();
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
  return i18n;
}

/** Persist + activate a language. */
export async function setAppLanguage(lang: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore persistence failures; still switch in-memory
  }
  await i18n.changeLanguage(lang);
}

export { i18n };
export default i18n;
