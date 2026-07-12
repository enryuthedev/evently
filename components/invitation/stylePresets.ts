/**
 * Invitation card style presets (CONTRACT.md §5).
 *
 * Each `InvitationStyle` maps to a refined, self-contained look: background,
 * text + accent + muted colors, a headline/body font (always one of the loaded
 * families from `lib/theme/tokens` — HankenGrotesk_* / Inter_*), and a
 * decoration hint consumed by `InvitationCard` to draw lightweight SVG accents.
 *
 * Colors are hex strings so the card can render independently of the NativeWind
 * theme (it must look right in print HTML / exported PDFs too). The palette is
 * drawn from the warm sage / champagne theme plus a few tasteful extras
 * (deep charcoal, champagne gold, blush, warm sand, terracotta).
 */

import { fonts } from '@/lib/theme/tokens';
import type { InvitationStyle } from '@/lib/data/types';

export type Decoration = 'floral' | 'frame' | 'gold' | 'none';

export interface StylePreset {
  /** Card background (hex). */
  bg: string;
  /** Primary text / headline color (hex). */
  text: string;
  /** Accent color for eyebrow, divider, decorations (hex). */
  accent: string;
  /** Muted color for secondary lines (date, location, body). */
  muted: string;
  /** Headline font family — one of the loaded Hanken Grotesk / Inter families. */
  headlineFont: string;
  /** Body font family — one of the loaded Hanken Grotesk / Inter families. */
  bodyFont: string;
  /** Decoration the card renderer should draw. */
  decoration: Decoration;
}

export const INVITATION_STYLES: Record<InvitationStyle, StylePreset> = {
  /** Timeless cream card, sage accent, thin gold-free frame. */
  elegant: {
    bg: '#fcf9f8',
    text: '#1b1c1c',
    accent: '#596244',
    muted: '#46483f',
    headlineFont: fonts.headline.semibold,
    bodyFont: fonts.body.regular,
    decoration: 'frame',
  },
  /** Soft blush ground with sage botanical leaf accents. */
  floral: {
    bg: '#f7ecec',
    text: '#43342f',
    accent: '#8e9775',
    muted: '#6f5f57',
    headlineFont: fonts.headline.medium,
    bodyFont: fonts.body.regular,
    decoration: 'floral',
  },
  /** Stark white, bold charcoal type, no ornament. */
  modern: {
    bg: '#ffffff',
    text: '#1b1c1c',
    accent: '#1b1c1c',
    muted: '#77786e',
    headlineFont: fonts.headline.bold,
    bodyFont: fonts.body.medium,
    decoration: 'none',
  },
  /** Off-white, near-black type, a single hairline frame. */
  minimal: {
    bg: '#faf8f6',
    text: '#111111',
    accent: '#1b1c1c',
    muted: '#77786e',
    headlineFont: fonts.headline.regular,
    bodyFont: fonts.body.regular,
    decoration: 'frame',
  },
  /** Deep charcoal with champagne-gold type and a gold art-deco frame. */
  luxury: {
    bg: '#1f1d1a',
    text: '#e7c268',
    accent: '#b08f3b',
    muted: '#c8bca0',
    headlineFont: fonts.headline.semibold,
    bodyFont: fonts.body.regular,
    decoration: 'gold',
  },
  /** Warm sand ground, friendly terracotta accents, no frame. */
  casual: {
    bg: '#f3e9dc',
    text: '#4a2f1a',
    accent: '#7d562d',
    muted: '#8a6f54',
    headlineFont: fonts.headline.bold,
    bodyFont: fonts.body.medium,
    decoration: 'none',
  },
};

export const getStylePreset = (style: InvitationStyle): StylePreset =>
  INVITATION_STYLES[style] ?? INVITATION_STYLES.elegant;
