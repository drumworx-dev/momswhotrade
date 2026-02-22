import { forwardRef } from 'react';
import type { Trade } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';

interface PnLShareCardProps {
  trade: Trade;
}

// All section heights are explicit so html2canvas renders identically
// to the live preview — no flex distribution that can drift at 3× scale.
const CARD   = 400;
const BAR_H  = 4;
const HEAD_H = 64;
const FOOT_H = 48;
const BODY_H = CARD - BAR_H - HEAD_H - FOOT_H; // 284

const categoryLabel: Record<Trade['assetCategory'], string> = {
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
};

function ArrowUp({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20 5L35 29H5L20 5Z" fill={color} />
    </svg>
  );
}

function ArrowDown({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20 35L5 11H35L20 35Z" fill={color} />
    </svg>
  );
}

function Pill({ children, style }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 24,
      borderRadius: 20,
      lineHeight: 1,
      ...style,
    }}>
      {children}
    </span>
  );
}

export const PnLShareCard = forwardRef<HTMLDivElement, PnLShareCardProps>(
  ({ trade }, ref) => {
    const isWin    = trade.winLoss === 'win';
    const pct      = trade.profitLossPercent ?? 0;
    const pnlColor = isWin ? '#7FB069' : '#E07A5F';
    const dirLabel = trade.direction === 'long' ? 'LONG' : 'SHORT';
    const levLabel = trade.leverage && trade.leverage > 1 ? `${trade.leverage}X` : '1X';
    const cat      = categoryLabel[trade.assetCategory] || '';

    return (
      <div
        ref={ref}
        style={{
          width: CARD,
          height: CARD,
          background: '#0F0B0A',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Rose glow ── */}
        <div style={{
          position: 'absolute',
          width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,165,165,0.20) 0%, rgba(184,139,139,0.07) 55%, transparent 75%)',
          bottom: -110, right: -110,
          pointerEvents: 'none',
        }} />

        {/* ── MWT icon — 45° watermark ── */}
        <img
          src="/icon.svg"
          crossOrigin="anonymous"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 320, height: 320,
            bottom: -80, right: -80,
            transform: 'rotate(45deg)',
            opacity: 0.25,
            borderRadius: 50,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* ── Top accent bar ── */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: BAR_H,
          background: 'linear-gradient(90deg, #D4A5A5 0%, #B88B8B 50%, #D4A5A5 100%)',
        }} />

        {/* ── Header ── */}
        <div style={{
          position: 'absolute',
          top: BAR_H, left: 0, right: 0,
          height: HEAD_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 22px',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: '#FFFFFF', lineHeight: 1 }}>
              MOMS WHO TRADE
            </span>
            <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#D4A5A5', fontWeight: 500, lineHeight: 1 }}>
              TRADE JOURNAL
            </span>
          </div>
          {cat && (
            <Pill style={{
              padding: '0 11px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#B88B8B',
              background: 'rgba(212,165,165,0.12)',
              border: '1px solid rgba(212,165,165,0.25)',
            }}>
              {cat.toUpperCase()}
            </Pill>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{
          position: 'absolute',
          top: BAR_H + HEAD_H,
          left: 0, right: 0,
          height: BODY_H,
          padding: '18px 22px 0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Asset name */}
          <div style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: -1,
            lineHeight: 1,
          }}>
            {(trade.token || 'Unknown').toUpperCase()}
          </div>

          {/* Direction + leverage pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <Pill style={{
              padding: '0 12px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              color: trade.direction === 'long' ? '#7FB069' : '#E07A5F',
              background: trade.direction === 'long' ? 'rgba(127,176,105,0.15)' : 'rgba(224,122,95,0.15)',
              border: `1px solid ${trade.direction === 'long' ? 'rgba(127,176,105,0.4)' : 'rgba(224,122,95,0.4)'}`,
            }}>
              {dirLabel}
            </Pill>
            <Pill style={{
              padding: '0 12px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              {levLabel} Leverage
            </Pill>
          </div>

          {/* P&L — pushed toward the middle with marginTop auto */}
          <div style={{ marginTop: 'auto', paddingBottom: 6 }}>
            {/* Arrow + big % on same row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isWin ? <ArrowUp color={pnlColor} /> : <ArrowDown color={pnlColor} />}
              <span style={{
                fontSize: 56,
                fontWeight: 900,
                color: pnlColor,
                letterSpacing: -2,
                lineHeight: 1,
              }}>
                {formatPercent(pct)}
              </span>
            </div>

            {/* Sub-label */}
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1,
              marginTop: 6,
              marginLeft: 2,
            }}>
              TOTAL {isWin ? 'PROFIT' : 'LOSS'}
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'rgba(255,255,255,0.09)',
              width: '55%',
              marginTop: 14,
            }} />

            {/* Entry / Close */}
            <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
              {[
                { label: 'ENTRY', value: formatPrice(trade.entryPrice, trade.assetCategory) },
                { label: 'CLOSE', value: formatPrice(trade.closePrice ?? 0, trade.assetCategory) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{
                    fontSize: 9, letterSpacing: 1.2,
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 600, lineHeight: 1, marginBottom: 5,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 1,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: FOOT_H,
          borderTop: '1px solid rgba(212,165,165,0.18)',
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.025)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              style={{ display: 'block', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#D4A5A5" strokeWidth="2" />
              <path d="M12 2C12 2 8 8 8 12s4 10 4 10M12 2c0 0 4 6 4 10s-4 10-4 10"
                stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 12h20" stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: '#D4A5A5', letterSpacing: 0.3, lineHeight: 1,
            }}>
              momswhotrade.co
            </span>
          </div>

          <Pill style={{
            height: 30,
            padding: '0 16px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: '#0F0B0A',
            background: '#D4A5A5',
          }}>
            Get Free App
          </Pill>
        </div>
      </div>
    );
  }
);

PnLShareCard.displayName = 'PnLShareCard';
