/**
 * RevenueCat purchases abstraction — SAFE in Expo Go (see CONTRACT.md §9).
 *
 * RevenueCat's native module (`react-native-purchases`) is NOT available in
 * Expo Go. This module detects the runtime and falls back to mock behavior so
 * the app runs end-to-end in Expo Go, while using the real SDK in dev/prod
 * builds. `react-native-purchases` is NEVER imported at module top-level — it
 * is only ever pulled in via a lazy `require()` inside the non-Expo-Go branch,
 * so Metro / Expo Go never attempt to load native code.
 */

import Constants from 'expo-constants';

export const PREMIUM_ENTITLEMENT = 'premium';

export type PaywallPackage = {
  id: 'monthly' | 'yearly';
  priceString: string;
  period: 'month' | 'year';
  highlighted?: boolean;
};

/** Mock packages used in Expo Go (and as a fallback when offerings fail). */
const MOCK_PACKAGES: PaywallPackage[] = [
  { id: 'monthly', priceString: '4,99 €', period: 'month' },
  { id: 'yearly', priceString: '39,99 €', period: 'year', highlighted: true },
];

/**
 * True when running inside Expo Go (no custom native modules available).
 */
export function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === 'storeClient' ||
    // appOwnership is 'expo' only in the classic Expo Go client.
    (Constants as unknown as { appOwnership?: string }).appOwnership === 'expo'
  );
}

/** Lazily resolve the native Purchases SDK. Only call outside Expo Go. */
function getPurchases(): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-purchases');
  return mod?.default ?? mod;
}

/**
 * Initialize the purchases SDK. No-op (logs) in Expo Go.
 */
export async function initPurchases(): Promise<void> {
  if (isExpoGo()) {
    console.log('[purchases] Expo Go detected — using mock purchases.');
    return;
  }

  try {
    const Purchases = getPurchases();
    const apiKey = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[
      'revenueCatApiKey'
    ] as string | undefined;

    if (!apiKey) {
      console.warn('[purchases] Missing revenueCatApiKey in expoConfig.extra.');
      return;
    }

    Purchases.configure({ apiKey });
  } catch (error) {
    console.warn('[purchases] initPurchases failed:', error);
  }
}

/**
 * Fetch the available paywall packages. Returns a mock pair in Expo Go, and a
 * best-effort mapping of the real offering otherwise (mock fallback on error).
 */
export async function getOfferings(): Promise<PaywallPackage[]> {
  if (isExpoGo()) {
    return MOCK_PACKAGES;
  }

  try {
    const Purchases = getPurchases();
    const offerings = await Purchases.getOfferings();
    const current = offerings?.current;
    const available: any[] = current?.availablePackages ?? [];

    const mapped: PaywallPackage[] = available
      .map((pkg): PaywallPackage | null => {
        const product = pkg?.product ?? {};
        const priceString: string = product?.priceString ?? '';
        // RevenueCat package types: MONTHLY / ANNUAL (or custom identifiers).
        const type: string = String(pkg?.packageType ?? pkg?.identifier ?? '').toUpperCase();

        if (type.includes('ANNUAL') || type.includes('YEAR')) {
          return { id: 'yearly', priceString, period: 'year', highlighted: true };
        }
        if (type.includes('MONTH')) {
          return { id: 'monthly', priceString, period: 'month' };
        }
        return null;
      })
      .filter((p): p is PaywallPackage => p !== null);

    return mapped.length > 0 ? mapped : MOCK_PACKAGES;
  } catch (error) {
    console.warn('[purchases] getOfferings failed, using mock:', error);
    return MOCK_PACKAGES;
  }
}

/**
 * Purchase a package by its logical id. Mock success in Expo Go.
 */
export async function purchasePackage(id: string): Promise<{ success: boolean }> {
  if (isExpoGo()) {
    return { success: true };
  }

  try {
    const Purchases = getPurchases();
    const offerings = await Purchases.getOfferings();
    const available: any[] = offerings?.current?.availablePackages ?? [];

    const target = available.find((pkg) => {
      const type = String(pkg?.packageType ?? pkg?.identifier ?? '').toUpperCase();
      return id === 'yearly'
        ? type.includes('ANNUAL') || type.includes('YEAR')
        : type.includes('MONTH');
    });

    if (!target) {
      return { success: false };
    }

    const { customerInfo } = await Purchases.purchasePackage(target);
    const success = Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT]);
    return { success };
  } catch (error) {
    console.warn('[purchases] purchasePackage failed:', error);
    return { success: false };
  }
}

/**
 * Restore previous purchases. Returns true in Expo Go; real restore otherwise.
 */
export async function restorePurchases(): Promise<boolean> {
  if (isExpoGo()) {
    return true;
  }

  try {
    const Purchases = getPurchases();
    const customerInfo = await Purchases.restorePurchases();
    return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT]);
  } catch (error) {
    console.warn('[purchases] restorePurchases failed:', error);
    return false;
  }
}

/**
 * Check whether the user currently has the premium entitlement.
 * Defaults to false in Expo Go.
 */
export async function checkPremium(): Promise<boolean> {
  if (isExpoGo()) {
    return false;
  }

  try {
    const Purchases = getPurchases();
    const customerInfo = await Purchases.getCustomerInfo();
    return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT]);
  } catch (error) {
    console.warn('[purchases] checkPremium failed:', error);
    return false;
  }
}
