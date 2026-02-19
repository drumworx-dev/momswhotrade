import type { Trade } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';

interface TradeCardProps {
  trade: Trade;
  onClick: () => void;
}

const statusEmoji: Record<string, string> = {
  open: '🟢',
  planned: '🔵',
  closed: '✅',
  tp_reached: '🎯',
  sl_hit: '🛑',
};

const categoryBadge: Record<Trade['assetCategory'], { label: string; bg: string; text: string }> = {
  crypto: { label: '₿ Crypto', bg: 'bg-orange-50', text: 'text-orange-500' },
  stocks: { label: '📈 Stocks', bg: 'bg-blue-50', text: 'text-blue-500' },
  commodities: { label: '🛢️ Commodities', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  forex: { label: '💱 Forex', bg: 'bg-purple-50', text: 'text-purple-500' },
};

export function TradeCard({ trade, onClick }: TradeCardProps) {
  const isOpen = trade.status === 'open';
  const isClosed = ['closed', 'tp_reached', 'sl_hit'].includes(trade.status);
  const isWin = trade.winLoss === 'win';
  const isLoss = trade.winLoss === 'loss';

  const pnlColor = isWin ? 'text-accent-success' : isLoss ? 'text-accent-error' : 'text-text-secondary';
  const cat = trade.assetCategory || 'crypto';
  const badge = categoryBadge[cat];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-card shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-text-primary">{trade.token || 'Unknown'}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trade.direction === 'long' ? 'bg-green-50 text-accent-success' : 'bg-red-50 text-accent-error'
          }`}>
            {trade.direction?.toUpperCase()}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          <span className="text-xs text-text-tertiary">{trade.timeframe}</span>
        </div>
        <span className="text-lg">{statusEmoji[trade.status] || '⚪'}</span>
      </div>

      {/* Price info */}
      {isClosed && trade.closePrice ? (
        <div className="mb-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>Entry: {formatPrice(trade.entryPrice, trade.assetCategory)}</span>
            <span>→</span>
            <span>Close: {formatPrice(trade.closePrice, trade.assetCategory)}</span>
          </div>
          <div className={`font-semibold ${pnlColor} mt-1`}>
            {trade.profitLoss !== undefined ? (
              <>
                {trade.profitLoss >= 0 ? '↑' : '↓'} {trade.profitLoss >= 0 ? '+' : ''}{formatPrice(trade.profitLoss)}
                {trade.profitLossPercent !== undefined && (
                  <span className="text-sm font-normal ml-1">({formatPercent(trade.profitLossPercent)})</span>
                )}
              </>
            ) : null}
          </div>
        </div>
      ) : isOpen ? (
        <div className="mb-2 text-sm text-text-secondary">
          <div>Entry: {formatPrice(trade.entryPrice, trade.assetCategory)}</div>
          <div className="flex gap-3 mt-1 text-xs">
            <span>TP: {formatPrice(trade.takeProfit, trade.assetCategory)}</span>
            <span>SL: {formatPrice(trade.stopLoss, trade.assetCategory)}</span>
          </div>
        </div>
      ) : (
        <div className="mb-2 text-sm text-text-secondary">
          Entry: {formatPrice(trade.entryPrice, trade.assetCategory)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary pt-2 border-t border-gray-50">
        <span>{trade.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Today'}</span>
        <span>•</span>
        <span>R:R {trade.riskReward}</span>
        {trade.leverage && trade.leverage > 1 && (
          <>
            <span>•</span>
            <span>{trade.leverage}x</span>
          </>
        )}
      </div>
    </div>
  );
}
