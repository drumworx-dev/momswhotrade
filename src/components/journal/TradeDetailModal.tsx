import { useState } from 'react';
import type { Trade } from '../../types';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { formatPrice, formatPercent, displayNum, normalizeInput } from '../../utils/formatters';
import { calculateTradeResult } from '../../utils/calculations';
import { useTrades } from '../../context/TradesContext';
import { toast } from 'react-hot-toast';

interface TradeDetailModalProps {
  trade: Trade;
  open: boolean;
  onClose: () => void;
}

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  const { updateTrade, deleteTrade } = useTrades();
  const [closePrice, setClosePrice] = useState(trade.closePrice?.toString() || '');
  const [status, setStatus] = useState(trade.status);
  const [cause, setCause] = useState(trade.cause || '');
  const [token, setToken] = useState(trade.token || '');

  const leverage = trade.leverage || 1;

  const CLOSED_STATUSES: Trade['status'][] = ['closed', 'tp_reached', 'sl_hit'];

  const handleUpdate = () => {
    const updates: Partial<Trade> = { status, cause, token };

    // Set closedAt date the first time a trade transitions to a closed status
    if (CLOSED_STATUSES.includes(status) && !trade.closedAt) {
      updates.closedAt = new Date().toISOString().split('T')[0];
    }

    if (closePrice) {
      const cp = parseFloat(closePrice);
      const result = calculateTradeResult(trade.direction, trade.entryPrice, cp, trade.positionSize, leverage);
      Object.assign(updates, {
        closePrice: cp,
        profitLoss: result.profitLoss,
        profitLossPercent: result.profitLossPercent,
        winLoss: result.winLoss,
      });
    }

    updateTrade(trade.id, updates);
    toast.success('Trade updated!');
    onClose();
  };

  const handleDelete = () => {
    deleteTrade(trade.id);
    toast.success('Trade deleted');
    onClose();
  };

  // Live P&L preview
  const previewResult = closePrice && !isNaN(parseFloat(closePrice))
    ? calculateTradeResult(trade.direction, trade.entryPrice, parseFloat(closePrice), trade.positionSize, leverage)
    : null;

  return (
    <Modal open={open} onClose={onClose} title={`${trade.token || 'Trade'} ${trade.direction?.toUpperCase()}`}>
      <div className="flex flex-col gap-4">
        {/* Locked fields */}
        <div className="bg-surface-dim rounded-card p-4">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Trade Details (Locked)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {([
              ['Entry', formatPrice(trade.entryPrice, trade.assetCategory)],
              ['Stop Loss', formatPrice(trade.stopLoss, trade.assetCategory)],
              ['Take Profit', formatPrice(trade.takeProfit, trade.assetCategory)],
              ['Direction', trade.direction?.toUpperCase()],
              ['R:R', trade.riskReward],
              ['Size ($)', formatPrice(trade.positionSize)],
              ['Leverage', `${leverage}x`],
              ...(trade.closedAt ? [['Closed', new Date(trade.closedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })]] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-text-tertiary text-xs">{label}</div>
                <div className="font-medium text-text-primary">{value}</div>
              </div>
            ))}
          </div>
          {leverage > 1 && (
            <div className="mt-2 text-xs text-text-tertiary bg-orange-50 rounded px-2 py-1">
              Effective position: {formatPrice(trade.positionSize * leverage)} ({leverage}x leverage)
            </div>
          )}
        </div>

        {/* Editable fields */}
        <Input
          label="Token / Asset"
          placeholder="BITCOIN, SOLANA, TESLA..."
          value={token}
          onChange={e => setToken(e.target.value.toUpperCase())}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Trade['status'])}
            className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="planned">Planned</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="tp_reached">TP Reached ✅</option>
            <option value="sl_hit">SL Hit 🛑</option>
          </select>
        </div>

        <Input
          label="Close Price (optional)"
          prefix="$"
          type="text"
          placeholder="Enter closing price"
          value={displayNum(closePrice)}
          onChange={e => setClosePrice(normalizeInput(e.target.value))}
          inputMode="decimal"
        />

        {previewResult && (
          <div className="bg-surface-dim rounded-card p-3">
            <div className={`text-center font-bold text-lg ${previewResult.winLoss === 'win' ? 'text-accent-success' : 'text-accent-error'}`}>
              {previewResult.profitLoss >= 0 ? '+' : ''}{formatPrice(previewResult.profitLoss)}{' '}
              ({formatPercent(previewResult.profitLossPercent)})
            </div>
            {leverage > 1 && (
              <div className="text-center text-xs text-text-tertiary mt-1">
                Includes {leverage}x leverage on {formatPrice(trade.positionSize)} margin
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Trade Notes</label>
          <textarea
            value={cause}
            onChange={e => setCause(e.target.value)}
            placeholder="Why did you take this trade? What happened?"
            className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            rows={3}
          />
        </div>

        <Button onClick={handleUpdate} fullWidth>Save Changes</Button>
        <button
          onClick={handleDelete}
          className="text-accent-error text-sm text-center hover:opacity-80 transition-opacity py-2"
        >
          Delete Trade
        </button>
      </div>
    </Modal>
  );
}
