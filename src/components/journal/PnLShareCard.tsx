import { forwardRef } from 'react';
import type { Trade } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';

interface PnLShareCardProps {
  trade: Trade;
}

const CARD_SIZE = 400;

const categoryLabel: Record<Trade['assetCategory'], string> = {
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
};

function ArrowUp({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M22 6L38 30H6L22 6Z" fill={color} />
    </svg>
  );
}

function ArrowDown({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M22 38L6 14H38L22 38Z" fill={color} />
    </svg>
  );
}

export const PnLShareCard = forwardRef<HTMLDivElement, PnLShareCardProps>(
  ({ trade }, ref) => {
    const isWin = trade.winLoss === 'win';
    const pct = trade.profitLossPercent ?? 0;
    const pnlColor  = isWin ? '#7FB069' : '#E07A5F';
    const dirLabel  = trade.direction === 'long' ? 'LONG' : 'SHORT';
    const levLabel  = trade.leverage && trade.leverage > 1 ? `${trade.leverage}X` : '1X';
    const cat       = categoryLabel[trade.assetCategory] || '';

    return (
      <div
        ref={ref}
        style={{
          width: CARD_SIZE,
          height: CARD_SIZE,
          background: '#0F0B0A',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Rose glow behind the icon ── */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,165,165,0.22) 0%, rgba(184,139,139,0.08) 55%, transparent 75%)',
            bottom: -100,
            right: -100,
            pointerEvents: 'none',
          }}
        />

        {/* ── Large MWT icon — tilted 45 deg, bleeding off bottom-right ── */}
        <img
          src="/icon.svg"
          crossOrigin="anonymous"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 340,
            height: 340,
            bottom: -90,
            right: -90,
            transform: 'rotate(45deg)',
            opacity: 0.28,
            borderRadius: 54,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* ── Top accent line ── */}
        <div
          style={{
            height: 4,
            background: 'linear-gradient(90deg, #D4A5A5 0%, #B88B8B 50%, #D4A5A5 100%)',
            flexShrink: 0,
          }}
        />

        {/* ── Header: wordmark + category ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px 10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: '#FFFFFF' }}>
              MOMS WHO TRADE
            </span>
            <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#D4A5A5', fontWeight: 500 }}>
              TRADE JOURNAL
            </span>
          </div>
          {cat && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                color: '#B88B8B',
                background: 'rgba(212,165,165,0.12)',
                border: '1px solid rgba(212,165,165,0.25)',
                padding: '3px 10px',
                borderRadius: 20,
              }}
            >
              {cat.toUpperCase()}
            </span>
          )}
        </div>

        {/* ── Main body ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 22px',
            gap: 10,
          }}
        >
          {/* Asset name */}
          <div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {(trade.token || 'Unknown').toUpperCase()}
            </div>

            {/* Direction + leverage row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: trade.direction === 'long' ? '#7FB069' : '#E07A5F',
                  background: trade.direction === 'long'
                    ? 'rgba(127,176,105,0.15)'
                    : 'rgba(224,122,95,0.15)',
                  border: `1px solid ${trade.direction === 'long' ? 'rgba(127,176,105,0.4)' : 'rgba(224,122,95,0.4)'}`,
                  padding: '3px 11px',
                  borderRadius: 20,
                }}
              >
                {dirLabel}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '3px 11px',
                  borderRadius: 20,
                }}
              >
                {levLabel} Leverage
              </span>
            </div>
          </div>

          {/* Big P&L number */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            {isWin
              ? <ArrowUp color={pnlColor} />
              : <ArrowDown color={pnlColor} />
            }
            <span
              style={{
                fontSize: 58,
                fontWeight: 900,
                color: pnlColor,
                letterSpacing: -2.5,
                lineHeight: 1,
              }}
            >
              {formatPercent(pct)}
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: 'rgba(255,255,255,0.35)',
              marginTop: -6,
            }}
          >
            TOTAL {isWin ? 'PROFIT' : 'LOSS'}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.08)',
              width: '60%',
              marginTop: 2,
            }}
          />

          {/* Entry / Close prices */}
          <div style={{ display: 'flex', gap: 28 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 3 }}>
                ENTRY
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>
                {formatPrice(trade.entryPrice, trade.assetCategory)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 3 }}>
                CLOSE
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>
                {formatPrice(trade.closePrice ?? 0, trade.assetCategory)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            borderTop: '1px solid rgba(212,165,165,0.2)',
            padding: '11px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#D4A5A5" strokeWidth="2" />
              <path d="M12 2C12 2 8 8 8 12s4 10 4 10M12 2c0 0 4 6 4 10s-4 10-4 10"
                stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 12h20" stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D4A5A5', letterSpacing: 0.3 }}>
              momswhotrade.co
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: '#0F0B0A',
              background: '#D4A5A5',
              padding: '5px 14px',
              borderRadius: 20,
            }}
          >
            Get Free App
          </span>
        </div>
      </div>
    );
  }
);

PnLShareCard.displayName = 'PnLShareCard';
