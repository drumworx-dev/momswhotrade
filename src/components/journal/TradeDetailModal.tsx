import { useRef, useState } from 'react';
import type { Trade } from '../../types';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { formatPrice, formatPercent, displayNum, normalizeInput } from '../../utils/formatters';
import { calculateTradeResult } from '../../utils/calculations';
import { useTrades } from '../../context/TradesContext';
import { useGoals } from '../../context/GoalsContext';
import { ConfettiOverlay } from '../shared/ConfettiOverlay';
import { ShareCardModal } from './ShareCardModal';
import { toast } from 'react-hot-toast';

interface TradeDetailModalProps {
  trade: Trade;
  open: boolean;
  onClose: () => void;
}

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  const { trades, updateTrade, deleteTrade } = useTrades();
  const { goalRows, syncTrades } = useGoals();
  const [closePrice, setClosePrice] = useState(trade.closePrice?.toString() || '');
  const [entryPrice, setEntryPrice] = useState(trade.entryPrice.toString());
  const [status, setStatus] = useState(trade.status);
  const [cause, setCause] = useState(trade.cause || '');
  const [token, setToken] = useState(trade.token || '');

  // Confetti + P&L card flow for profitable closes
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPnLCard, setShowPnLCard] = useState(false);
  const [closedTrade, setClosedTrade] = useState<Trade | null>(null);

  // Tracks whether the current close price was auto-filled from TP/SL
  // so switching between the two statuses updates it, but manual entry is never overwritten
  const [closePriceAutoFilled, setClosePriceAutoFilled] = useState(false);
  const closePriceRef = useRef<HTMLDivElement>(null);

  const leverage = trade.leverage || 1;

  const CLOSED_STATUSES: Trade['status'][] = ['closed', 'tp_reached', 'sl_hit'];

  const handleUpdate = () => {
    const parsedEntry = parseFloat(entryPrice) || trade.entryPrice;
    const updates: Partial<Trade> = { status, cause, token, entryPrice: parsedEntry };

    // Set closedAt date the first time a trade transitions to a closed status
    if (CLOSED_STATUSES.includes(status) && !trade.closedAt) {
      updates.closedAt = new Date().toISOString().split('T')[0];
    }

    let profitable = false;
    if (closePrice) {
      const cp = parseFloat(closePrice);
      const result = calculateTradeResult(trade.direction, parsedEntry, cp, trade.positionSize, leverage);
      Object.assign(updates, {
        closePrice: cp,
        profitLoss: result.profitLoss,
        profitLossPercent: result.profitLossPercent,
        winLoss: result.winLoss,
      });
      profitable = result.profitLoss > 0 && CLOSED_STATUSES.includes(status);
    }

    updateTrade(trade.id, updates);

    if (CLOSED_STATUSES.includes(status)) {
      // Merge update in memory (state hasn't propagated yet) so P&L calc is accurate
      const mergedTrades = trades.map(t => t.id === trade.id ? { ...t, ...updates } : t);
      syncTrades(mergedTrades);

      // Compute today's progress against the daily goal and show inline feedback
      const today = new Date().toISOString().split('T')[0];
      const todayGoalRow = goalRows.find(r => r.date === today);
      const todayPnL = mergedTrades
        .filter(t => {
          const d = t.closedAt ?? today;
          return d === today && CLOSED_STATUSES.includes(t.status as Trade['status']);
        })
        .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

      if (todayGoalRow && todayGoalRow.dailyGoalAmount > 0) {
        const pct = Math.round((todayPnL / todayGoalRow.dailyGoalAmount) * 100);
        const goalHit = pct >= 100;
        toast.custom((t) => (
          <div className={`bg-white rounded-card shadow-lg px-4 py-3 flex flex-col gap-2 min-w-[220px] transition-opacity ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                {goalHit ? '🎯 Daily goal hit!' : '🎯 Today\'s goal'}
              </span>
              <span className={`text-sm font-bold ${goalHit ? 'text-accent-success' : 'text-text-primary'}`}>
                {Math.min(pct, 999)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${goalHit ? 'bg-accent-success' : 'bg-accent-primary'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-text-secondary">
              {goalHit
                ? `+${formatPrice(todayPnL - todayGoalRow.dailyGoalAmount)} over target`
                : `${formatPrice(Math.max(todayPnL, 0))} of ${formatPrice(todayGoalRow.dailyGoalAmount)} daily target`}
            </div>
          </div>
        ), { duration: 4000 });
      } else {
        toast.success('Trade closed!');
      }
    } else {
      toast.success('Trade updated!');
    }

    if (profitable) {
      // Trigger confetti → then auto-show P&L share card
      setClosedTrade({ ...trade, ...updates } as Trade);
      setShowConfetti(true);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    const remainingTrades = trades.filter(t => t.id !== trade.id);
    deleteTrade(trade.id);
    syncTrades(remainingTrades);
    toast.success('Trade deleted');
    onClose();
  };

  // Live P&L preview
  const previewResult = closePrice && !isNaN(parseFloat(closePrice))
    ? calculateTradeResult(trade.direction, parseFloat(entryPrice) || trade.entryPrice, parseFloat(closePrice), trade.positionSize, leverage)
    : null;

  return (
    <>
    <Modal open={open} onClose={onClose} title={`${trade.token || 'Trade'} ${trade.direction?.toUpperCase()}`}>
      <div className="flex flex-col gap-4">
        {/* Locked fields */}
        <div className="bg-surface-dim rounded-card p-4">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Trade Plan</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {([
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
          label="Entry Price"
          prefix="$"
          type="text"
          placeholder="Actual entry price"
          value={displayNum(entryPrice)}
          onChange={e => setEntryPrice(normalizeInput(e.target.value))}
          inputMode="decimal"
        />

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
            onChange={e => {
              const newStatus = e.target.value as Trade['status'];
              setStatus(newStatus);
              // Pre-fill close price from trade data when selecting a terminal status
              // Only replaces the price if the field is empty OR was previously auto-filled
              const canAutoFill = !closePrice || closePriceAutoFilled;
              if (newStatus === 'tp_reached' && trade.takeProfit && canAutoFill) {
                setClosePrice(trade.takeProfit.toString());
                setClosePriceAutoFilled(true);
                setTimeout(() => closePriceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
              } else if (newStatus === 'sl_hit' && trade.stopLoss && canAutoFill) {
                setClosePrice(trade.stopLoss.toString());
                setClosePriceAutoFilled(true);
                setTimeout(() => closePriceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
              }
            }}
            className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="planned">Planned</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="tp_reached">TP Reached ✅</option>
            <option value="sl_hit">SL Hit 🛑</option>
          </select>
        </div>

        <div ref={closePriceRef}>
          <Input
            label="Close Price (optional)"
            prefix="$"
            type="text"
            placeholder="Enter closing price"
            value={displayNum(closePrice)}
            onChange={e => {
              setClosePrice(normalizeInput(e.target.value));
              setClosePriceAutoFilled(false);
            }}
            inputMode="decimal"
          />
        </div>

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

        <Button onClick={handleUpdate} fullWidth>
          {CLOSED_STATUSES.includes(status) ? 'Finalise Trade' : 'Save Changes'}
        </Button>
        <button
          onClick={handleDelete}
          className="text-accent-error text-sm text-center hover:opacity-80 transition-opacity py-2"
        >
          Delete Trade
        </button>
      </div>
    </Modal>

    {/* Confetti fires when a trade is closed in profit */}
    <ConfettiOverlay
      visible={showConfetti}
      message="You're making money trading!"
      subtext={
        closedTrade
          ? `+${formatPrice(closedTrade.profitLoss ?? 0)} on ${closedTrade.token || 'trade'} ${(closedTrade.direction ?? '').toUpperCase()}`
          : undefined
      }
      onDone={() => { setShowConfetti(false); setShowPnLCard(true); }}
    />

    {/* P&L share card auto-appears after confetti clears */}
    {showPnLCard && closedTrade && (
      <ShareCardModal
        trade={closedTrade}
        onClose={() => { setShowPnLCard(false); onClose(); }}
      />
    )}
  </>
  );
}
