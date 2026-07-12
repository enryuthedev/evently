/**
 * Occasion metadata (CONTRACT §10). Maps each OccasionType to a Material Symbol
 * icon and a sensible default planning mode for the wizard.
 *
 * Labels are NOT stored here — resolve them via i18n `t('occasions.<type>')`.
 */

import type { OccasionType, EventMode } from '@/lib/data/types';

export interface OccasionMeta {
  type: OccasionType;
  /** Material Symbols (snake_case) icon name for <Icon name=.. />. */
  icon: string;
  /** Default planning complexity pre-selected when this occasion is picked. */
  defaultMode: EventMode;
}

/** All 11 occasion types in wizard display order. Icons per CONTRACT §10. */
export const OCCASIONS: OccasionMeta[] = [
  { type: 'wedding', icon: 'favorite', defaultMode: 'wedding' },
  { type: 'birthday', icon: 'cake', defaultMode: 'special' },
  { type: 'dinner', icon: 'restaurant', defaultMode: 'quick' },
  { type: 'friends', icon: 'group', defaultMode: 'quick' },
  { type: 'corporate', icon: 'business_center', defaultMode: 'special' },
  { type: 'engagement', icon: 'diamond', defaultMode: 'special' },
  { type: 'baby_shower', icon: 'child_friendly', defaultMode: 'special' },
  { type: 'baptism', icon: 'water_drop', defaultMode: 'special' },
  { type: 'graduation', icon: 'school', defaultMode: 'special' },
  { type: 'anniversary', icon: 'celebration', defaultMode: 'special' },
  { type: 'custom', icon: 'add', defaultMode: 'quick' },
];

const OCCASION_BY_TYPE: Record<OccasionType, OccasionMeta> = OCCASIONS.reduce(
  (acc, meta) => {
    acc[meta.type] = meta;
    return acc;
  },
  {} as Record<OccasionType, OccasionMeta>
);

/** Look up metadata for a single occasion type. */
export function occasionMeta(type: OccasionType): OccasionMeta {
  return OCCASION_BY_TYPE[type] ?? OCCASION_BY_TYPE.custom;
}
