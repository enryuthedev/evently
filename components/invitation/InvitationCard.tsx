/**
 * InvitationCard — the single stylized invitation renderer used everywhere
 * (designer preview, review, guest RSVP view, print). See CONTRACT.md §5.
 *
 * Reads `design.style` to pick a preset from `stylePresets.ts`, applies the
 * preset colors + fonts, lays the content out per `design.layout`
 * (centered / topPhoto / framed), and draws lightweight `react-native-svg`
 * decorations (hairline frame, gold art-deco frame, or sage leaf accents).
 */

import { View, Image, type ViewStyle } from 'react-native';
import Svg, { Rect, Line, Path, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { palette, shadows } from '@/lib/theme/tokens';
import { formatDate } from '@/lib/utils/format';
import type { EventModel, Language } from '@/lib/data/types';
import { getFontPair } from '@/lib/theme/fontPairs';
import { getStylePreset } from './stylePresets';

export interface InvitationCardProps {
  design: EventModel['invitation'];
  event: Pick<EventModel, 'title' | 'date' | 'time' | 'location'> &
    Partial<Pick<EventModel, 'occasion'>>;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showQr?: boolean;
  qrValue?: string;
  /** Language for the rendered date. Defaults to 'de'. */
  lang?: Language;
  className?: string;
}

interface SizeSpec {
  width: number | '100%';
  pad: number;
  eyebrow: number;
  headline: number;
  meta: number;
  body: number;
  gap: number;
}

const SIZES: Record<NonNullable<InvitationCardProps['size']>, SizeSpec> = {
  sm: { width: 180, pad: 16, eyebrow: 8, headline: 20, meta: 9, body: 9, gap: 6 },
  md: { width: 260, pad: 24, eyebrow: 10, headline: 30, meta: 12, body: 12, gap: 10 },
  lg: { width: 320, pad: 30, eyebrow: 11, headline: 38, meta: 14, body: 14, gap: 12 },
  full: { width: '100%', pad: 28, eyebrow: 11, headline: 34, meta: 13, body: 13, gap: 12 },
};

/** SVG overlay drawn behind the content (frame / gold / floral). */
function Decoration({
  kind,
  accent,
}: {
  kind: 'floral' | 'frame' | 'gold' | 'none';
  accent: string;
}) {
  if (kind === 'none') return null;

  const fill: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  if (kind === 'frame') {
    return (
      <View pointerEvents="none" style={fill}>
        <Svg width="100%" height="100%" viewBox="0 0 100 133" preserveAspectRatio="none">
          <Rect
            x={5}
            y={5}
            width={90}
            height={123}
            rx={2}
            fill="none"
            stroke={accent}
            strokeOpacity={0.4}
            strokeWidth={0.4}
          />
        </Svg>
      </View>
    );
  }

  if (kind === 'gold') {
    return (
      <View pointerEvents="none" style={fill}>
        <Svg width="100%" height="100%" viewBox="0 0 100 133" preserveAspectRatio="none">
          {/* Double art-deco frame */}
          <Rect x={4} y={4} width={92} height={125} fill="none" stroke={accent} strokeWidth={0.6} />
          <Rect
            x={7}
            y={7}
            width={86}
            height={119}
            fill="none"
            stroke={accent}
            strokeOpacity={0.6}
            strokeWidth={0.3}
          />
          {/* Corner ticks */}
          <Line x1={4} y1={14} x2={14} y2={4} stroke={accent} strokeWidth={0.6} />
          <Line x1={86} y1={4} x2={96} y2={14} stroke={accent} strokeWidth={0.6} />
          <Line x1={4} y1={119} x2={14} y2={129} stroke={accent} strokeWidth={0.6} />
          <Line x1={86} y1={129} x2={96} y2={119} stroke={accent} strokeWidth={0.6} />
        </Svg>
      </View>
    );
  }

  // floral — a couple of delicate leaf sprigs in opposite corners
  return (
    <View pointerEvents="none" style={fill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 133" preserveAspectRatio="none">
        {/* top-left sprig */}
        <Path
          d="M8 8 C 18 14, 22 24, 20 34"
          fill="none"
          stroke={accent}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        <Path d="M12 14 q 6 -2 8 4 q -6 2 -8 -4 Z" fill={accent} fillOpacity={0.35} />
        <Path d="M16 22 q 6 -2 8 4 q -6 2 -8 -4 Z" fill={accent} fillOpacity={0.3} />
        <Circle cx={20} cy={34} r={1.4} fill={accent} fillOpacity={0.5} />
        {/* bottom-right sprig (mirrored) */}
        <Path
          d="M92 125 C 82 119, 78 109, 80 99"
          fill="none"
          stroke={accent}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        <Path d="M88 119 q -6 2 -8 -4 q 6 -2 8 4 Z" fill={accent} fillOpacity={0.35} />
        <Path d="M84 111 q -6 2 -8 -4 q 6 -2 8 4 Z" fill={accent} fillOpacity={0.3} />
        <Circle cx={80} cy={99} r={1.4} fill={accent} fillOpacity={0.5} />
      </Svg>
    </View>
  );
}

export function InvitationCard({
  design,
  event,
  size = 'md',
  showQr = false,
  qrValue,
  lang = 'de',
  className,
}: InvitationCardProps) {
  const { t } = useTranslation();
  const preset = getStylePreset(design.style);
  // The chosen font pair drives typography; the style preset drives colors +
  // decoration. This is what makes the designer's "Schrift" tab take effect.
  const fontPair = getFontPair(design.fontPair);
  const headlineFont = fontPair.headline;
  const bodyFont = fontPair.body;
  // The accent picker stores either a hex string or a palette token name; the
  // card renders standalone (also in print HTML) so resolve both to a hex.
  // Falls back to the style preset's accent when unset/unknown.
  const accent =
    design.accent && design.accent.startsWith('#')
      ? design.accent
      : palette[design.accent as keyof typeof palette] ?? preset.accent;
  const dims = SIZES[size];

  const headline = (design.headline || event.title || '').trim();
  const eyebrow = (design.subline || '').trim();
  const body = (design.body || '').trim();
  const dateLabel = event.date ? formatDate(event.date, lang) : '';
  const timeLabel = event.time ? event.time : '';
  const locationName = event.location?.name ?? '';

  const showQrCode = showQr && !!qrValue;
  const qrSize = size === 'sm' ? 44 : size === 'lg' ? 76 : 60;

  const headlineNode = (
    <Text
      numberOfLines={3}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={{
        fontFamily: headlineFont,
        fontSize: dims.headline,
        lineHeight: dims.headline * 1.12,
        color: preset.text,
        textAlign: 'center',
        letterSpacing: fontPair.headlineTracking ?? -0.3,
        maxWidth: '100%',
      }}
    >
      {headline}
    </Text>
  );

  const eyebrowNode = eyebrow ? (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      style={{
        fontFamily: bodyFont,
        fontSize: dims.eyebrow,
        lineHeight: dims.eyebrow * 1.4,
        color: accent,
        textAlign: 'center',
        letterSpacing: size === 'sm' ? 1 : 2,
        textTransform: 'uppercase',
        maxWidth: '100%',
      }}
    >
      {eyebrow}
    </Text>
  ) : null;

  const divider = (
    <View
      style={{
        width: dims.headline * 1.6,
        height: 1,
        backgroundColor: accent,
        opacity: 0.4,
        marginVertical: dims.gap,
      }}
    />
  );

  const metaNode = (
    <View style={{ alignItems: 'center', gap: dims.gap / 2, maxWidth: '100%' }}>
      {!!dateLabel && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            maxWidth: '100%',
          }}
        >
          <Icon name="calendar_today" size={dims.meta + 2} color={accent} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: bodyFont,
              fontSize: dims.meta,
              lineHeight: dims.meta * 1.4,
              color: preset.muted,
              flexShrink: 1,
            }}
          >
            {dateLabel}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
        </View>
      )}
      {!!locationName && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            maxWidth: '100%',
          }}
        >
          <Icon name="location_on" size={dims.meta + 2} color={accent} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: bodyFont,
              fontSize: dims.meta,
              lineHeight: dims.meta * 1.4,
              color: preset.muted,
              flexShrink: 1,
            }}
          >
            {locationName}
          </Text>
        </View>
      )}
    </View>
  );

  const bodyNode = body ? (
    <Text
      numberOfLines={4}
      style={{
        fontFamily: bodyFont,
        fontSize: dims.body,
        lineHeight: dims.body * 1.5,
        color: preset.muted,
        textAlign: 'center',
        marginTop: dims.gap,
      }}
    >
      {body}
    </Text>
  ) : null;

  const qrNode = showQrCode ? (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('print.withQr')}
      style={{
        marginTop: dims.gap,
        padding: 6,
        borderRadius: 12,
        backgroundColor: '#ffffff',
      }}
    >
      <QRCode value={qrValue} size={qrSize} color="#1b1c1c" backgroundColor="#ffffff" />
    </View>
  ) : null;

  const hasPhoto = !!design.photoUri;
  const photoLabel = (headline || event.title || '').trim();
  const isTopPhoto = design.layout === 'topPhoto' && hasPhoto;
  const isFramed = design.layout === 'framed' && hasPhoto;
  const isCentered = !isTopPhoto && !isFramed;

  return (
    <View
      className={className}
      style={[
        {
          width: dims.width,
          aspectRatio: 3 / 4,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: preset.bg,
        },
        shadows.card,
      ]}
    >
      {/* Framed layout: photo fills the card as a tinted background */}
      {isFramed && (
        <>
          <Image
            source={{ uri: design.photoUri }}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={photoLabel}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: preset.bg,
              opacity: 0.72,
            }}
          />
        </>
      )}

      <Decoration kind={preset.decoration} accent={accent} />

      {/* Top photo layout: image banner above the content */}
      {isTopPhoto && (
        <Image
          source={{ uri: design.photoUri }}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel={photoLabel}
          style={{ width: '100%', height: '42%' }}
        />
      )}

      <View
        style={{
          flex: 1,
          paddingHorizontal: dims.pad,
          paddingVertical: dims.pad,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Centered layout with a photo shows it as a rounded medallion */}
        {isCentered && hasPhoto && (
          <Image
            source={{ uri: design.photoUri }}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={photoLabel}
            style={{
              width: dims.headline * 2.4,
              height: dims.headline * 2.4,
              borderRadius: dims.headline * 1.2,
              marginBottom: dims.gap,
            }}
          />
        )}

        {eyebrowNode}
        <View style={{ height: dims.gap }} />
        {headlineNode}
        {divider}
        {metaNode}
        {bodyNode}
        {qrNode}
      </View>
    </View>
  );
}

export default InvitationCard;
