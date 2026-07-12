/**
 * App-wide feature flags.
 *
 * ALL_FEATURES_FREE — while true, every feature that would normally sit behind
 * the Premium paywall is unlocked for all users (fonts, template/design styles,
 * PDF export, etc.). The paywall screen and purchase plumbing stay in the code
 * so Premium can be re-enabled later by flipping this to `false` and deciding
 * per-feature what is gated. See `usePremium()` in `lib/store/selectors.ts`.
 */
export const ALL_FEATURES_FREE = true;
