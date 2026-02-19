import { useState } from 'react';
import type { Trade } from '../../types';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { formatCurrency, formatPercent } from '../../utils/formatters';
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

  const handleUpdate = () => {
    const updates: Partial<Trade> = { status, cause, token };

    if (closePrice) {
      const cp = parseFloat(closePrice);
      const result = calculateTradeResult(trade.direction, trade.entryPrice, cp, trade.positionSize);
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

  return (
    <Modal open={open} onClose={onClose} title={`${trade.token || 'Trade'} ${trade.direction?.toUpperCase()}`}>
      <div className="flex flex-col gap-4">
        {/* Locked fields */}
        <div className="bg-surface-dim rounded-card p-4">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Trade Details (Locked)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Entry', formatCurrency(trade.entryPrice, 2)],
              ['Stop Loss', formatCurrency(trade.stopLoss, 2)],
              ['Take Profit', formatCurrency(trade.takeProfit, 2)],
              ['Direction', trade.direction?.toUpperCase()],
              ['R:R', trade.riskReward],
              ['Size', trade.positionSize?.toFixed(4)],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-text-tertiary text-xs">{label}</div>
                <div className="font-medium text-text-primary">{value}</div>
              </div>
            ))}
          </div>
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
          type="number"
          placeholder="Enter closing price"
          value={closePrice}
          onChange={e => setClosePrice(e.target.value)}
          inputMode="decimal"
        />

        {closePrice && !isNaN(parseFloat(closePrice)) && (
          <div className="bg-surface-dim rounded-card p-3">
            {(() => {
              const result = calculateTradeResult(trade.direction, trade.entryPrice, parseFloat(closePrice), trade.positionSize);
              return (
                <div className={`text-center font-bold text-lg ${result.winLoss === 'win' ? 'text-accent-success' : 'text-accent-error'}`}>
                  {result.profitLoss >= 0 ? '+' : ''}{formatCurrency(result.profitLoss)} ({formatPercent(result.profitLossPercent)})
                </div>
              );
            })()}
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
