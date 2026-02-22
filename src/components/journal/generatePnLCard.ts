import type { Trade } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';

const CARD = 400;
const BAR_H  = 4;
const HEAD_H = 64;
const FOOT_H = 48;
const BODY_Y  = BAR_H + HEAD_H;          // 68
const BODY_H  = CARD - BODY_Y - FOOT_H;  // 284
const FOOT_Y  = CARD - FOOT_H;           // 352
const PAD     = 22;

// ─── helpers ────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── main draw function ──────────────────────────────────────────────────────

/**
 * Draws the P&L share card onto a canvas and returns it.
 * scale=1 for modal preview, scale=3 for 1200×1200 export.
 */
export async function generatePnLCard(
  trade: Trade,
  scale: number = 3,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width  = CARD * scale;
  canvas.height = CARD * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const isWin    = trade.winLoss === 'win';
  const pct      = trade.profitLossPercent ?? 0;
  const pnlColor = isWin ? '#7FB069' : '#E07A5F';
  const dirLabel = trade.direction === 'long' ? 'LONG' : 'SHORT';
  const levLabel = trade.leverage && trade.leverage > 1 ? `${trade.leverage}X` : '1X';
  const token    = (trade.token || 'Unknown').toUpperCase();
  const pctText  = formatPercent(pct);
  const entryTxt = formatPrice(trade.entryPrice, trade.assetCategory);
  const closeTxt = formatPrice(trade.closePrice ?? 0, trade.assetCategory);
  const catMap: Record<Trade['assetCategory'], string> = {
    crypto: 'Crypto', stocks: 'Stocks',
    commodities: 'Commodities', forex: 'Forex',
  };
  const cat = catMap[trade.assetCategory] ?? '';

  // ── 1. Clip everything to rounded card shape ────────────────────────────
  roundRect(ctx, 0, 0, CARD, CARD, 24);
  ctx.clip();

  // ── 2. Background ───────────────────────────────────────────────────────
  ctx.fillStyle = '#0F0B0A';
  ctx.fillRect(0, 0, CARD, CARD);

  // ── 3. Rose radial glow (bottom-right) ─────────────────────────────────
  const glow = ctx.createRadialGradient(340, 340, 0, 340, 340, 190);
  glow.addColorStop(0,    'rgba(212,165,165,0.22)');
  glow.addColorStop(0.55, 'rgba(184,139,139,0.07)');
  glow.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD, CARD);

  // ── 4. MWT icon — rotated 45°, bottom-right, bleeding off edges ─────────
  // CSS: right:-80 bottom:-80 width:320 → center at (320, 320)
  try {
    const icon = await loadImg('/icon.svg');
    const iSz  = 320;
    const iCX  = 320;
    const iCY  = 320;
    ctx.save();
    ctx.translate(iCX, iCY);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = 0.25;
    ctx.save();                              // inner save for icon clip
    roundRect(ctx, -iSz / 2, -iSz / 2, iSz, iSz, 50);
    ctx.clip();
    ctx.drawImage(icon, -iSz / 2, -iSz / 2, iSz, iSz);
    ctx.restore();                           // restore icon clip
    ctx.globalAlpha = 1;
    ctx.restore();
  } catch { /* icon failed — just skip */ }

  // ── 5. Top accent bar ───────────────────────────────────────────────────
  const barGrd = ctx.createLinearGradient(0, 0, CARD, 0);
  barGrd.addColorStop(0,   '#D4A5A5');
  barGrd.addColorStop(0.5, '#B88B8B');
  barGrd.addColorStop(1,   '#D4A5A5');
  ctx.fillStyle = barGrd;
  ctx.fillRect(0, 0, CARD, BAR_H);

  // ── 6. Header ────────────────────────────────────────────────────────────
  // Header spans y=4 to y=68, vertical center at y=36
  // Two text lines stacked: brand at y≈26, sub at y≈46
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 12px system-ui,-apple-system,sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '2.5px';
  ctx.fillText('MOMS WHO TRADE', PAD, 26);

  ctx.fillStyle = '#D4A5A5';
  ctx.font = '500 9px system-ui,-apple-system,sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.2px';
  ctx.fillText('TRADE JOURNAL', PAD, 46);

  // Category pill (right side, center y=36)
  if (cat) {
    const pillLabel = cat.toUpperCase();
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1px';
    ctx.font = '700 9px system-ui,-apple-system,sans-serif';
    const tw  = ctx.measureText(pillLabel).width + (pillLabel.length - 1) * 1;
    const pH  = 22;
    const pPad = 11;
    const pW  = tw + pPad * 2;
    const pX  = CARD - PAD - pW;
    const pY  = 36 - pH / 2;

    roundRect(ctx, pX, pY, pW, pH, 11);
    ctx.fillStyle = 'rgba(212,165,165,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,165,165,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#B88B8B';
    ctx.fillText(pillLabel, pX + pPad, 36);
  }

  // ── 7. Body ──────────────────────────────────────────────────────────────
  // Layout constants (all absolute from top of canvas):
  // Asset name top:     86   (BODY_Y + 18)
  // Asset name center:  86 + 18 = 104  (font 36, textBaseline top → draw at y=86)
  // Pills top:          132  (86 + 36 + 10)
  // Pills center:       144  (132 + 12)
  // Pills bottom:       156  (132 + 24)
  // P&L block top:      211  (FOOT_Y - 141 = 352 - 141)
  //   arrow+% row center: 211 + 28 = 239  (row height 56)
  //   "TOTAL..." center:  239 + 28 + 6 + 5 = 278
  //   divider:            278 + 5 + 14 = 297
  //   price labels top:   297 + 1 + 12 = 310
  //   price values top:   310 + 9 + 5  = 324

  const NAME_Y  = BODY_Y + 18;          // 86
  const PILLS_Y = NAME_Y + 36 + 10;     // 132
  const ROW_CY  = FOOT_Y - 141 + 28;    // 239  (center of arrow+% row)
  const LABEL_Y = ROW_CY + 28 + 6 + 5;  // 278  (center of TOTAL label)
  const DIV_Y   = LABEL_Y + 5 + 14;     // 297  (divider)
  const PLBL_Y  = DIV_Y + 1 + 12;       // 310  (price labels top)
  const PVAL_Y  = PLBL_Y + 9 + 5;       // 324  (price values top)

  // Asset name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px system-ui,-apple-system,sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-1px';
  ctx.textBaseline = 'top';
  ctx.fillText(token, PAD, NAME_Y);

  // Pills helper
  function drawPill(
    text: string, x: number,
    textColor: string, bgColor: string, borderColor: string,
    ls = '1px',
  ): number {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = ls;
    ctx.font = '700 10px system-ui,-apple-system,sans-serif';
    const tw   = ctx.measureText(text).width + (text.length - 1) * parseFloat(ls);
    const pPad = 12;
    const pW   = tw + pPad * 2;
    const pH   = 24;

    roundRect(ctx, x, PILLS_Y, pW, pH, 12);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pPad, PILLS_Y + pH / 2);

    return pW + 8;
  }

  const dirColor  = trade.direction === 'long' ? '#7FB069' : '#E07A5F';
  const dirBg     = trade.direction === 'long' ? 'rgba(127,176,105,0.15)' : 'rgba(224,122,95,0.15)';
  const dirBorder = trade.direction === 'long' ? 'rgba(127,176,105,0.4)'  : 'rgba(224,122,95,0.4)';
  const nextX = PAD + drawPill(dirLabel, PAD, dirColor, dirBg, dirBorder);
  drawPill(`${levLabel} Leverage`, nextX,
    'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.12)', '0.8px');

  // Arrow triangle (center at x=PAD+18=40, y=ROW_CY=239)
  const aCX = PAD + 18;
  const aH  = 18; // half-height of triangle
  const aW  = 18; // half-width
  ctx.fillStyle = pnlColor;
  ctx.beginPath();
  if (isWin) {
    ctx.moveTo(aCX,      ROW_CY - aH);
    ctx.lineTo(aCX + aW, ROW_CY + aH);
    ctx.lineTo(aCX - aW, ROW_CY + aH);
  } else {
    ctx.moveTo(aCX,      ROW_CY + aH);
    ctx.lineTo(aCX + aW, ROW_CY - aH);
    ctx.lineTo(aCX - aW, ROW_CY - aH);
  }
  ctx.closePath();
  ctx.fill();

  // Big % text (baseline-centered with arrow)
  ctx.fillStyle = pnlColor;
  ctx.font = '900 56px system-ui,-apple-system,sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-2px';
  ctx.textBaseline = 'middle';
  ctx.fillText(pctText, PAD + 36 + 8, ROW_CY);

  // "TOTAL PROFIT / LOSS" label
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '600 10px system-ui,-apple-system,sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.5px';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TOTAL ${isWin ? 'PROFIT' : 'LOSS'}`, PAD + 2, LABEL_Y);

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fillRect(PAD, DIV_Y, 220, 1);

  // Price labels + values
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.2px';
  ctx.font = '600 9px system-ui,-apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textBaseline = 'top';
  ctx.fillText('ENTRY', PAD, PLBL_Y);
  ctx.fillText('CLOSE', PAD + 110, PLBL_Y);

  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-0.3px';
  ctx.font = '700 16px system-ui,-apple-system,sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top';
  ctx.fillText(entryTxt, PAD, PVAL_Y);
  ctx.fillText(closeTxt, PAD + 110, PVAL_Y);

  // ── 8. Footer ─────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.fillRect(0, FOOT_Y, CARD, FOOT_H);

  ctx.fillStyle = 'rgba(212,165,165,0.18)';
  ctx.fillRect(0, FOOT_Y, CARD, 1);

  const fCY = FOOT_Y + FOOT_H / 2; // 376 — vertical center of footer

  // Globe icon
  const gX = PAD + 6.5;
  const gY = fCY;
  const gR = 6.5;
  ctx.strokeStyle = '#D4A5A5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(gX, gY, gR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(gX, gY, gR * 0.45, gR, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gX - gR, gY);
  ctx.lineTo(gX + gR, gY);
  ctx.stroke();

  // URL
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.3px';
  ctx.fillStyle = '#D4A5A5';
  ctx.font = '600 11px system-ui,-apple-system,sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('momswhotrade.co', PAD + 13 + 6, fCY);

  // "Get Free App" pill
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.5px';
  ctx.font = '700 10px system-ui,-apple-system,sans-serif';
  const ctaTw  = ctx.measureText('Get Free App').width + 5;
  const ctaPad = 16;
  const ctaW   = ctaTw + ctaPad * 2;
  const ctaH   = 30;
  const ctaX   = CARD - PAD - ctaW;
  const ctaY   = fCY - ctaH / 2;

  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 15);
  ctx.fillStyle = '#D4A5A5';
  ctx.fill();

  ctx.fillStyle = '#0F0B0A';
  ctx.textBaseline = 'middle';
  ctx.fillText('Get Free App', ctaX + ctaPad, fCY);

  return canvas;
}
