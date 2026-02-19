import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface NewTradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewTradeModal({ open, onClose }: NewTradeModalProps) {
  const { addTrade } = useTrades();
  const { user } = useAuth();
  const [form, setForm] = useState({
    token: '',
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskReward: '1:2',
    positionSize: '',
    timeframe: '4hr' as '1hr' | '4hr' | 'daily' | 'weekly',
    leverage: '1',
    cause: '',
  });

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.token || !form.entryPrice || !form.stopLoss) {
      toast.error('Please fill in token, entry price, and stop loss');
      return;
    }
    addTrade({
      userId: user?.uid || '',
      token: form.token.toUpperCase(),
      direction: form.direction,
      entryPrice: parseFloat(form.entryPrice),
      stopLoss: parseFloat(form.stopLoss),
      takeProfit: parseFloat(form.takeProfit) || 0,
      riskReward: form.riskReward,
      positionSize: parseFloat(form.positionSize) || 1,
      valueTraded: parseFloat(form.positionSize) * parseFloat(form.entryPrice) || 0,
      timeframe: form.timeframe,
      leverage: parseInt(form.leverage) as 1 | 2 | 5 | 10,
      cause: form.cause,
      status: 'planned',
    });
    toast.success('Trade added to journal! 📗');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Trade">
      <div className="flex flex-col gap-4">
        <Input
          label="Token / Asset *"
          placeholder="BITCOIN, SOLANA, AAPL..."
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
          <Input label="Position Size" type="number" placeholder="0.1" value={form.positionSize} onChange={e => update('positionSize', e.target.value)} inputMode="decimal" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Timeframe</label>
            <select value={form.timeframe} onChange={e => update('timeframe', e.target.value)} className="w-full bg-surface-dim border border-gray-200 rounded-input px-3 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
              <option value="1hr">1 Hour</option>
              <option value="4hr">4 Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Leverage</label>
            <select value={form.leverage} onChange={e => update('leverage', e.target.value)} className="w-full bg-surface-dim border border-gray-200 rounded-input px-3 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
              <option value="1">1x (No Leverage)</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
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
