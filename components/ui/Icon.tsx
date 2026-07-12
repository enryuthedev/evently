import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, ColorName } from '@/lib/theme/tokens';

/**
 * Icon — accepts Material *Symbols* names (the same strings used in the Stitch
 * HTML, e.g. "calendar_today", "favorite", "diversity_3"). Internally resolves
 * to @expo/vector-icons MaterialIcons, falling back to MaterialCommunityIcons,
 * then to a neutral glyph. Pass the snake_case symbol name verbatim from the
 * design and it will render. See CONTRACT.md §Icons.
 */

type Resolved = { set: 'mi' | 'mci'; name: string };

// Symbols that don't map cleanly by snake→kebab transform.
const OVERRIDES: Record<string, Resolved> = {
  diversity_3: { set: 'mci', name: 'account-group' },
  drafts: { set: 'mi', name: 'drafts' },
  qr_code: { set: 'mi', name: 'qr-code' },
  qr_code_2: { set: 'mi', name: 'qr-code-2' },
  restaurant_menu: { set: 'mi', name: 'restaurant-menu' },
  text_fields: { set: 'mi', name: 'text-fields' },
  format_size: { set: 'mi', name: 'format-size' },
  workspace_premium: { set: 'mi', name: 'workspace-premium' },
  sports_esports: { set: 'mi', name: 'sports-esports' },
  local_bar: { set: 'mi', name: 'local-bar' },
  music_note: { set: 'mi', name: 'music-note' },
  celebration: { set: 'mi', name: 'celebration' },
  redeem: { set: 'mi', name: 'redeem' },
  brush: { set: 'mci', name: 'brush-variant' },
  wallpaper: { set: 'mi', name: 'wallpaper' },
  account_balance_wallet: { set: 'mi', name: 'account-balance-wallet' },
  done_all: { set: 'mi', name: 'done-all' },
  schedule_send: { set: 'mi', name: 'schedule-send' },
};

const miGlyphs = MaterialIcons.glyphMap as Record<string, number>;
const mciGlyphs = MaterialCommunityIcons.glyphMap as Record<string, number>;

function resolve(symbol: string): Resolved {
  if (OVERRIDES[symbol]) return OVERRIDES[symbol];
  const kebab = symbol.replace(/_/g, '-');
  if (miGlyphs[kebab] != null) return { set: 'mi', name: kebab };
  if (mciGlyphs[kebab] != null) return { set: 'mci', name: kebab };
  if (miGlyphs[symbol] != null) return { set: 'mi', name: symbol };
  return { set: 'mi', name: 'help-outline' };
}

export interface IconProps {
  /** Material Symbols name (snake_case), e.g. "calendar_today". */
  name: string;
  size?: number;
  /** Theme token name OR a raw hex string. Default 'on-surface'. */
  color?: ColorName | (string & {});
  style?: any;
}

export function Icon({ name, size = 24, color = 'on-surface', style }: IconProps) {
  const resolved = resolve(name);
  const tint = (palette as Record<string, string>)[color as string] ?? (color as string);
  const Cmp = resolved.set === 'mci' ? MaterialCommunityIcons : MaterialIcons;
  return <Cmp name={resolved.name as never} size={size} color={tint} style={style} />;
}

export default Icon;
