/**
 * Print & PDF export for invitation cards (CONTRACT §10).
 *
 * - buildInvitationHtml: produces a clean, print-ready HTML document styled in
 *   the warm sage/champagne theme (inline CSS + Google Fonts), showing
 *   title/date/time/location and an optional QR placeholder area.
 * - printInvitation: opens the system print dialog (expo-print).
 * - exportInvitationPdf: renders to a PDF file and returns its uri (the caller
 *   is responsible for sharing it, e.g. via shareImageOrPdf).
 */

import * as Print from 'expo-print';

import type {
  EventModel,
  InvitationDesign,
  PrintFormat,
} from '@/lib/data/types';
import { palette } from '@/lib/theme/tokens';
import { formatDate, formatTime } from '@/lib/utils/format';
import { buildRsvpUrl } from '@/lib/utils/share';

export interface BuildInvitationHtmlOptions {
  /** Page/canvas format. Defaults to 'a6'. */
  format?: PrintFormat;
  /** Render the QR placeholder block. Defaults to design.showQr. */
  withQr?: boolean;
  /**
   * Full RSVP url to encode in the QR (should carry the server share_token so a
   * scanned printed/PDF card resolves on other devices). Falls back to the
   * local-id url, which only works in host preview.
   */
  qrValue?: string;
}

/** Physical/visual page dimensions per print format (CSS units). */
const FORMAT_DIMENSIONS: Record<PrintFormat, { width: string; height: string }> = {
  a6: { width: '105mm', height: '148mm' },
  a5: { width: '148mm', height: '210mm' },
  square: { width: '148mm', height: '148mm' },
  story: { width: '108mm', height: '192mm' },
};

/** Minimal HTML escaping for interpolated user content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a self-contained, print-ready HTML string for an invitation.
 */
export function buildInvitationHtml(
  event: EventModel,
  design: InvitationDesign,
  opts?: BuildInvitationHtmlOptions
): string {
  const format = opts?.format ?? 'a6';
  const showQr = opts?.withQr ?? design.showQr;
  const dims = FORMAT_DIMENSIONS[format] ?? FORMAT_DIMENSIONS.a6;

  const accent = design.accent?.startsWith('#')
    ? design.accent
    : palette.primary;

  const bg = palette['surface-container-lowest'];
  const ink = palette['on-surface'];
  const muted = palette['on-surface-variant'];
  const border = palette['surface-variant'];

  const headline = escapeHtml(design.headline?.trim() || event.title || '');
  const subline = escapeHtml(design.subline?.trim() || '');
  const body = escapeHtml(design.body?.trim() || event.description || '');

  const dateStr = event.date ? escapeHtml(formatDate(event.date, 'de', { weekday: true })) : '';
  const timeStr = event.time ? escapeHtml(formatTime(event.time, 'de')) : '';
  const locationName = event.location?.name ? escapeHtml(event.location.name) : '';
  const locationAddr = event.location?.address ? escapeHtml(event.location.address) : '';

  const qrUrl = opts?.qrValue ?? buildRsvpUrl(event.shareToken ?? event.id);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(qrUrl)}`;

  const photoBlock = design.photoUri
    ? `<div class="photo"><img src="${escapeHtml(design.photoUri)}" alt="" /></div>`
    : '';

  const qrBlock = showQr
    ? `<div class="qr">
         <img src="${qrSrc}" alt="QR" width="96" height="96" />
         <span class="qr-label">RSVP</span>
       </div>`
    : '';

  const detailRows = [
    dateStr
      ? `<div class="row"><span class="row-label">Datum</span><span class="row-value">${dateStr}</span></div>`
      : '',
    timeStr
      ? `<div class="row"><span class="row-label">Uhrzeit</span><span class="row-value">${timeStr}</span></div>`
      : '',
    locationName
      ? `<div class="row"><span class="row-label">Ort</span><span class="row-value">${locationName}${
          locationAddr ? `<br/><span class="row-sub">${locationAddr}</span>` : ''
        }</span></div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: ${dims.width} ${dims.height}; margin: 0; }
  html, body { background: ${palette.background}; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: ${ink};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12mm;
  }
  .card {
    width: ${dims.width};
    min-height: ${dims.height};
    background: ${bg};
    border: 1px solid ${border};
    border-radius: 16px;
    padding: 14mm 12mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: ${accent};
  }
  .photo { width: 100%; margin-bottom: 8mm; }
  .photo img { width: 100%; height: 42mm; object-fit: cover; border-radius: 12px; }
  .eyebrow {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${accent};
    margin-bottom: 6mm;
  }
  .headline {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 600;
    font-size: 30px;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: ${ink};
    margin-bottom: 4mm;
  }
  .subline {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 400;
    font-size: 16px;
    color: ${muted};
    margin-bottom: 6mm;
  }
  .body {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: ${muted};
    margin-bottom: 8mm;
    max-width: 80mm;
  }
  .divider {
    width: 40px;
    height: 2px;
    background: ${accent};
    opacity: 0.5;
    margin: 0 auto 8mm;
  }
  .details { width: 100%; margin-top: auto; }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid ${border};
    text-align: left;
  }
  .row:last-child { border-bottom: 1px solid ${border}; }
  .row-label {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${accent};
    white-space: nowrap;
  }
  .row-value {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: ${ink};
    text-align: right;
  }
  .row-sub { font-weight: 400; font-size: 11px; color: ${muted}; }
  .qr {
    margin-top: 8mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .qr img { border: 1px solid ${border}; border-radius: 8px; padding: 4px; background: #fff; }
  .qr-label {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${muted};
  }
</style>
</head>
<body>
  <div class="card">
    ${photoBlock}
    <div class="eyebrow">Einladung</div>
    <h1 class="headline">${headline}</h1>
    ${subline ? `<div class="subline">${subline}</div>` : ''}
    <div class="divider"></div>
    ${body ? `<p class="body">${body}</p>` : ''}
    ${detailRows ? `<div class="details">${detailRows}</div>` : ''}
    ${qrBlock}
  </div>
</body>
</html>`;
}

/** Open the system print dialog for an event's invitation. */
export async function printInvitation(
  event: EventModel,
  opts?: BuildInvitationHtmlOptions
): Promise<void> {
  const html = buildInvitationHtml(event, event.invitation, opts);
  await Print.printAsync({ html });
}

/**
 * Render the invitation to a PDF file and return its local uri. The caller can
 * then share it (e.g. via shareImageOrPdf).
 */
export async function exportInvitationPdf(
  event: EventModel,
  opts?: BuildInvitationHtmlOptions
): Promise<string> {
  const html = buildInvitationHtml(event, event.invitation, opts);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}
