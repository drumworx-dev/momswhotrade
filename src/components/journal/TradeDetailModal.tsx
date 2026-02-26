import { useRef, useState } from 'react';
import type { Trade, PartialClose } from '../../types';
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
  const { goalRows, syncTrades, settings: goalSettings } = useGoals();
  const feePercent = goalSettings.tradingFeePercent ?? 1;
  const [closePrice, setClosePrice] = useState(trade.closePrice?.toString() || '');
  const [entryPrice, setEntryPrice] = useState(trade.entryPrice.toString());
  const [status, setStatus] = useState(trade.status);
  const [cause, setCause] = useState(trade.cause || '');
  const [token, setToken] = useState(trade.token || '');

  // Helpers for local-date strings (avoids UTC off-by-one for non-UTC users)
  const localDateStr = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Default close date to today; user can backdate
  const [closedDate, setClosedDate] = useState(trade.closedAt || localDateStr());

  // Confetti + P&L card flow for profitable closes
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPnLCard, setShowPnLCard] = useState(false);
  const [closedTrade, setClosedTrade] = useState<Trade | null>(null);

  // TP slot state — which slot is open for input, and its pending values
  const [activeTP, setActiveTP] = useState<number | null>(null);
  const [tpInputPercent, setTpInputPercent] = useState<25 | 50 | 75 | null>(null);
  const [tpInputPrice, setTpInputPrice] = useState('');

  // Tracks whether the current close price was auto-filled from TP/SL
  // so switching between the two statuses updates it, but manual entry is never overwritten
  const [closePriceAutoFilled, setClosePriceAutoFilled] = useState(false);
  const closePriceRef = useRef<HTMLDivElement>(null);

  const leverage = trade.leverage || 1;

  const CLOSED_STATUSES: Trade['status'][] = ['closed', 'tp_reached', 'sl_hit'];

  // Partial profit helpers
  const existingPartials = trade.partialCloses ?? [];
  const totalPartialPct = existingPartials.reduce((sum, pc) => sum + pc.percent, 0);
  const remainingFraction = Math.max(0, (100 - totalPartialPct) / 100);

  const openTP = (index: number) => {
    setActiveTP(index);
    setTpInputPercent(null);
    setTpInputPrice('');
  };

  const handleRecordTP = (tpIndex: number) => {
    if (!tpInputPercent || !tpInputPrice) return;
    const parsedEntry = parseFloat(entryPrice) || trade.entryPrice;
    const pp = parseFloat(tpInputPrice);
    if (isNaN(pp) || pp <= 0) return;

    const result = calculateTradeResult(
      trade.direction, parsedEntry, pp,
      trade.positionSize * (tpInputPercent / 100),
      leverage, feePercent,
    );

    const newPartial: PartialClose = {
      id: Date.now().toString(),
      percent: tpInputPercent,
      price: pp,
      pnl: result.profitLoss,
      fee: result.fee,
      date: localDateStr(),
    };

    const updatedPartials = [...existingPartials, newPartial];
    const updates: Partial<Trade> = { partialCloses: updatedPartials };
    updateTrade(trade.id, updates);
    syncTrades(trades.map(t => t.id === trade.id ? { ...t, ...updates } : t));

    toast.success(`TP${tpIndex + 1} banked — ${result.profitLoss >= 0 ? '+' : ''}${formatPrice(result.profitLoss)}`);
    setActiveTP(null);
    setTpInputPercent(null);
    setTpInputPrice('');
  };

  const handleUpdate = () => {
    const parsedEntry = parseFloat(entryPrice) || trade.entryPrice;
    const updates: Partial<Trade> = { status, cause, token, entryPrice: parsedEntry };

    // Set closedAt using the selected date (allows backdating)
    if (CLOSED_STATUSES.includes(status)) {
      updates.closedAt = closedDate;
    }

    let profitable = false;
    if (closePrice) {
      const cp = parseFloat(closePrice);
      // Use remaining position size after any partial closes
      const closingPositionSize = trade.positionSize * remainingFraction;
      const result = calculateTradeResult(trade.direction, parsedEntry, cp, closingPositionSize, leverage, feePercent);
      Object.assign(updates, {
        closePrice: cp,
        profitLoss: result.profitLoss,
        profitLossPercent: result.profitLossPercent,
        winLoss: result.winLoss,
        estimatedFee: result.fee,
      });
      profitable = result.profitLoss > 0 && CLOSED_STATUSES.includes(status);
    }

    updateTrade(trade.id, updates);

    if (CLOSED_STATUSES.includes(status)) {
      // Merge update in memory (state hasn't propagated yet) so P&L calc is accurate
      const mergedTrades = trades.map(t => t.id === trade.id ? { ...t, ...updates } : t);
      syncTrades(mergedTrades);

      // Compute progress for the close date against the daily goal and show inline feedback
      const today = closedDate;
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

  // Live P&L preview for the final close (on remaining position after any partials)
  const parsedEntryNum = parseFloat(entryPrice) || trade.entryPrice;
  const previewResult = closePrice && !isNaN(parseFloat(closePrice))
    ? calculateTradeResult(trade.direction, parsedEntryNum, parseFloat(closePrice), trade.positionSize * remainingFraction, leverage, feePercent)
    : null;

  // Live preview for the currently-open TP slot
  const tpParsedPrice = parseFloat(tpInputPrice);
  const tpPreview = activeTP !== null && tpInputPercent && tpInputPrice && !isNaN(tpParsedPrice)
    ? calculateTradeResult(trade.direction, parsedEntryNum, tpParsedPrice, trade.positionSize * (tpInputPercent / 100), leverage, feePercent)
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

        {CLOSED_STATUSES.includes(status) && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Close Date</label>
            <input
              type="date"
              value={closedDate}
              max={localDateStr()}
              onChange={e => setClosedDate(e.target.value)}
              className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
        )}

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
          <div className="bg-surface-dim rounded-card p-3 flex flex-col gap-1">
            <div className={`text-center font-bold text-lg ${previewResult.winLoss === 'win' ? 'text-accent-success' : 'text-accent-error'}`}>
              {previewResult.profitLoss >= 0 ? '+' : ''}{formatPrice(previewResult.profitLoss)}{' '}
              ({formatPercent(previewResult.profitLossPercent)})
            </div>
            <div className="text-center text-xs text-text-tertiary">
              Est. fee ({feePercent}%): −{formatPrice(previewResult.fee)}
            </div>
            {(leverage > 1 || remainingFraction < 1) && (
              <div className="text-center text-xs text-text-tertiary">
                {remainingFraction < 1
                  ? `On ${Math.round(remainingFraction * 100)}% remaining position${leverage > 1 ? ` · ${leverage}x leverage` : ''}`
                  : `Includes ${leverage}x leverage on ${formatPrice(trade.positionSize)} margin`}
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

        {/* ── PARTIAL PROFITS ────────────────────────────────────── */}
        {!CLOSED_STATUSES.includes(status) && (
          <div className="border border-gray-200 rounded-card overflow-hidden">
            {/* Header */}
            <div className="bg-surface-dim px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-text-primary">Partial Profits 💸</div>
                <div className="text-xs text-text-tertiary mt-0.5">Take the money and run — up to 3 exits</div>
              </div>
              {existingPartials.length > 0 && remainingFraction > 0 && (
                <div className="text-xs font-medium text-text-secondary bg-white border border-gray-200 rounded-pill px-2.5 py-1">
                  {Math.round(remainingFraction * 100)}% running
                </div>
              )}
            </div>

            {/* TP1 / TP2 / TP3 rows */}
            {[0, 1, 2].map((tpIndex) => {
              const label = `TP${tpIndex + 1}`;
              const recorded = existingPartials[tpIndex];
              const isLocked = tpIndex > 0 && !existingPartials[tpIndex - 1];
              const isActive = activeTP === tpIndex;
              const takenBefore = existingPartials.slice(0, tpIndex).reduce((s, p) => s + p.percent, 0);
              const slotOptions = ([25, 50, 75] as const).filter(p => takenBefore + p <= 100);
              const fullyTaken = totalPartialPct >= 100;

              // ── Recorded row ────────────────────────────────────
              if (recorded) {
                return (
                  <div key={tpIndex} className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-green-50/60">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-accent-success w-7">{label}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-text-primary">
                          {recorded.percent}% @ {formatPrice(recorded.price)}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(recorded.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' · '}fee −{formatPrice(recorded.fee)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${recorded.pnl >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                      {recorded.pnl >= 0 ? '+' : ''}{formatPrice(recorded.pnl)}
                    </span>
                  </div>
                );
              }

              // ── Locked row ──────────────────────────────────────
              if (isLocked || fullyTaken) {
                return (
                  <div key={tpIndex} className="border-t border-gray-100 px-4 py-3 flex items-center gap-2.5 opacity-35">
                    <span className="text-xs font-bold text-text-tertiary w-7">{label}</span>
                    <span className="text-xs text-text-tertiary">
                      {fullyTaken ? 'Position fully closed via partials' : `Record ${label.replace(/\d/, String(tpIndex))} first`}
                    </span>
                  </div>
                );
              }

              // ── Active (expanded) row ───────────────────────────
              if (isActive) {
                return (
                  <div key={tpIndex} className="border-t border-gray-100">
                    <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary w-7">{label}</span>
                      <span className="text-xs text-text-tertiary">
                        {slotOptions.length > 0
                          ? `Up to ${100 - takenBefore}% available`
                          : 'No more position to close'}
                      </span>
                    </div>

                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {/* Two-column: % pills left, price input right */}
                      <div className="flex gap-3 items-start">
                        {/* Left column — % pills stacked */}
                        <div className="flex flex-col gap-1.5 w-[72px] flex-shrink-0">
                          <div className="text-xs text-text-tertiary font-medium mb-0.5">% to close</div>
                          {slotOptions.map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTpInputPercent(tpInputPercent === p ? null : p)}
                              className={`py-2 rounded-pill text-sm font-semibold border transition-all ${
                                tpInputPercent === p
                                  ? 'bg-text-primary text-white border-text-primary'
                                  : 'bg-white border-gray-200 text-text-secondary hover:border-text-primary'
                              }`}
                            >
                              {p}%
                            </button>
                          ))}
                        </div>

                        {/* Right column — price input + preview */}
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="text-xs text-text-tertiary font-medium mb-0.5">Exit price</div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={displayNum(tpInputPrice)}
                              onChange={e => setTpInputPrice(normalizeInput(e.target.value))}
                              className="w-full bg-surface-dim border border-gray-200 rounded-input pl-7 pr-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                            />
                          </div>

                          {tpPreview && (
                            <div className={`rounded-lg px-3 py-2 text-center ${tpPreview.winLoss === 'win' ? 'bg-green-50' : 'bg-red-50'}`}>
                              <div className={`text-sm font-bold ${tpPreview.winLoss === 'win' ? 'text-accent-success' : 'text-accent-error'}`}>
                                {tpPreview.profitLoss >= 0 ? '+' : ''}{formatPrice(tpPreview.profitLoss)}
                              </div>
                              <div className="text-xs text-text-tertiary">fee −{formatPrice(tpPreview.fee)}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRecordTP(tpIndex)}
                        disabled={!tpInputPercent || !tpInputPrice}
                        className="w-full py-2.5 rounded-pill text-sm font-semibold bg-text-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                      >
                        Record {label} & Keep Running
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTP(null)}
                        className="text-xs text-center text-text-tertiary hover:text-text-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              // ── Tap-to-open row ─────────────────────────────────
              return (
                <button
                  key={tpIndex}
                  type="button"
                  onClick={() => openTP(tpIndex)}
                  className="w-full border-t border-gray-100 px-4 py-3.5 flex items-center justify-between hover:bg-surface-dim transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-text-tertiary w-7">{label}</span>
                    <span className="text-sm text-text-secondary">Tap to record partial</span>
                  </div>
                  <span className="text-lg text-text-tertiary leading-none">+</span>
                </button>
              );
            })}
          </div>
        )}

        <Button onClick={handleUpdate} fullWidth>
          {CLOSED_STATUSES.includes(status) ? `Finalise Trade${remainingFraction < 1 ? ` (${Math.round(remainingFraction * 100)}% remaining)` : ''}` : 'Save Changes'}
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
