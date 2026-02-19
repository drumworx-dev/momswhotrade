import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import type { Trade } from '../../types';

interface NewTradeModalProps {
  open: boolean;
  onClose: () => void;
}

type AssetCategory = Trade['assetCategory'];

const CATEGORY_OPTIONS: { value: AssetCategory; label: string; emoji: string }[] = [
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'stocks', label: 'Stocks', emoji: '📈' },
  { value: 'commodities', label: 'Commodities', emoji: '🛢️' },
  { value: 'forex', label: 'Forex', emoji: '💱' },
];

export function NewTradeModal({ open, onClose }: NewTradeModalProps) {
  const { addTrade } = useTrades();
  const { user } = useAuth();
  const [form, setForm] = useState({
    token: '',
    assetCategory: 'crypto' as AssetCategory,
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskReward: '1:3',
    positionSize: '',
    leverage: '1',
    timeframe: '4hr' as '1hr' | '4hr' | 'daily' | 'weekly',
    cause: '',
  });

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.token || !form.entryPrice || !form.stopLoss) {
      toast.error('Please fill in token, entry price, and stop loss');
      return;
    }
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit) || 0;
    const lev = parseInt(form.leverage) as 1 | 2 | 3 | 5 | 10;
    const size = parseFloat(form.positionSize) || 1;

    // Compute actual R:R if TP is provided
    let rr = form.riskReward;
    if (tp && entry && sl && entry !== sl) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      rr = `1:${(reward / risk).toFixed(1)}`;
    }

    addTrade({
      userId: user?.uid || '',
      token: form.token.toUpperCase(),
      assetCategory: form.assetCategory,
      direction: form.direction,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      riskReward: rr,
      positionSize: size,
      valueTraded: size * lev * entry,
      timeframe: form.timeframe,
      leverage: lev,
      cause: form.cause,
      status: 'planned',
    });
    toast.success('Trade added to journal! 📗');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Trade">
      <div className="flex flex-col gap-4">
        {/* Asset Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Asset Category *</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update('assetCategory', opt.value)}
                className={`flex flex-col items-center py-2 px-1 rounded-input text-xs font-medium border transition-all ${
                  form.assetCategory === opt.value
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'bg-surface-dim border-gray-200 text-text-secondary hover:border-text-primary'
                }`}
              >
                <span className="text-base mb-0.5">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Token / Asset *"
          placeholder="BITCOIN, SOLANA, AAPL, EURUSD..."
          value={form.token}
          onChange={e => update('token', e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Direction *</label>
          <div className="flex gap-2">
            {(['long', 'short'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => update('direction', dir)}
                className={`flex-1 py-3 rounded-input font-semibold text-sm transition-all ${
                  form.direction === dir
                    ? dir === 'long' ? 'bg-accent-success text-white' : 'bg-accent-error text-white'
                    : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
                }`}
              >
                {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Entry Price *" prefix="$" type="number" placeholder="43,250" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} inputMode="decimal" />
          <Input label="Stop Loss *" prefix="$" type="number" placeholder="42,500" value={form.stopLoss} onChange={e => update('stopLoss', e.target.value)} inputMode="decimal" />
          <Input label="Take Profit" prefix="$" type="number" placeholder="45,000" value={form.takeProfit} onChange={e => update('takeProfit', e.target.value)} inputMode="decimal" />
          <Input label="Position Size ($)" type="number" placeholder="100" value={form.positionSize} onChange={e => update('positionSize', e.target.value)} inputMode="decimal" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Leverage</label>
            <select value={form.leverage} onChange={e => update('leverage', e.target.value)} className="w-full bg-surface-dim border border-gray-200 rounded-input px-3 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
              <option value="1">1x (No Leverage)</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Timeframe</label>
            <select value={form.timeframe} onChange={e => update('timeframe', e.target.value)} className="w-full bg-surface-dim border border-gray-200 rounded-input px-3 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
              <option value="1hr">1 Hour</option>
              <option value="4hr">4 Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Why are you taking this trade?</label>
          <textarea
            value={form.cause}
            onChange={e => update('cause', e.target.value)}
            placeholder="Strong support level, bullish pattern..."
            className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} fullWidth>Add Trade to Journal</Button>
      </div>
    </Modal>
  );
}
