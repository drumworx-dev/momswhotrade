import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { useGoals } from '../../context/GoalsContext';
import { useTrades } from '../../context/TradesContext';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../shared/Button';
import { toast } from 'react-hot-toast';

export function GoalTracker() {
  const { settings, updateSettings, goalRows, dailyGoals, updateDailyGoal, setStartBalanceOverride, clearProjection, projectionEndDate } = useGoals();
  const { trades } = useTrades();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startBalance, setStartBalance] = useState(settings.startingBalance.toString());
  const [dailyPct, setDailyPct] = useState(settings.dailyGoalPercent.toString());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Keep local settings state in sync when context resets (e.g. Start Over)
  useEffect(() => {
    setStartBalance(settings.startingBalance.toString());
    setDailyPct(settings.dailyGoalPercent.toString());
  }, [settings.startingBalance, settings.dailyGoalPercent]);

  const today = new Date().toISOString().split('T')[0];
  const todayRow = goalRows.find(r => r.date === today);

  // Use closedAt date if available, fall back to updatedAt
  const closedDateOf = (t: (typeof trades)[0]) =>
    t.closedAt ?? t.updatedAt?.toDate?.()?.toISOString().split('T')[0] ?? null;

  const todayPnL = trades
    .filter(t => {
      const d = closedDateOf(t);
      return d === today && (t.status === 'closed' || t.status === 'tp_reached' || t.status === 'sl_hit');
    })
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  const progress = todayRow ? Math.min((todayPnL / todayRow.dailyGoalAmount) * 100, 100) : 0;

  const projectedEnd = goalRows[goalRows.length - 1]?.expectedEndingBalance || settings.startingBalance;
  const totalGain = projectedEnd - settings.startingBalance;
  const gainMultiple = settings.startingBalance > 0 ? (projectedEnd / settings.startingBalance).toFixed(2) : '1.00';

  const handleSyncTrades = () => {
    const tradesByDate: Record<string, number> = {};
    trades.forEach(t => {
      if (t.profitLoss !== undefined && (t.status === 'closed' || t.status === 'tp_reached' || t.status === 'sl_hit')) {
        const d = closedDateOf(t) || today;
        tradesByDate[d] = (tradesByDate[d] || 0) + t.profitLoss;
      }
    });
    Object.entries(tradesByDate).forEach(([date, pnl]) => updateDailyGoal(date, pnl));
    toast.success('Trades synced to goals!');
  };

  const handleSaveSettings = () => {
    updateSettings({
      startingBalance: parseFloat(startBalance) || 1000,
      dailyGoalPercent: parseFloat(dailyPct) || 1,
    });
    setSettingsOpen(false);
    toast.success('Settings saved!');
  };

  const startRowEdit = (date: string, currentBalance: number) => {
    setEditingRow(date);
    setEditingValue(currentBalance.toFixed(2));
  };

  const commitRowEdit = (date: string) => {
    const val = parseFloat(editingValue);
    if (!isNaN(val) && val > 0) {
      setStartBalanceOverride(date, val);
      toast.success('Balance updated — projection recalculated');
    }
    setEditingRow(null);
  };

  const cancelRowEdit = () => setEditingRow(null);

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Daily Goal Tracker</h1>
            <p className="text-text-secondary text-sm">Track your {settings.horizon}-day journey</p>
          </div>
          <button
            onClick={handleSyncTrades}
            className="flex items-center gap-1.5 text-sm text-text-secondary bg-surface-dim px-3 py-2 rounded-pill hover:bg-bg-secondary transition-colors"
          >
            <RefreshCw size={14} />
            Sync Trades
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-lg mx-auto flex flex-col gap-4">

          {/* ── 1. PROJECTED OUTCOME ─────────────────────────────── */}
          <div className="bg-gradient-to-br from-text-primary to-gray-800 rounded-card shadow-md p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">
              {settings.horizon}-Day Projection
              {projectionEndDate && (
                <span className="ml-1 normal-case">
                  — by {projectionEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(projectedEnd)}</div>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <span>+{formatCurrency(totalGain)} gain</span>
              <span>·</span>
              <span>{gainMultiple}× your money</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-50">
                Starting {formatCurrency(settings.startingBalance)} at {settings.dailyGoalPercent}% daily
              </span>
              <button
                onClick={() => {
                  if (confirm('Reset to $1,000 starting capital, 30 days, 2% daily goal?')) {
                    clearProjection();
                    toast.success('Reset to defaults — save new settings to begin');
                  }
                }}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity underline ml-4 flex-shrink-0"
              >
                Start Over
              </button>
            </div>
          </div>

          {/* ── 2. SETTINGS (2nd from top) ────────────────────────── */}
          <div className="bg-white rounded-card shadow-sm overflow-hidden">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-text-primary">Settings</span>
              {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {settingsOpen && (
              <div className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-100">
                {/* Starting Balance */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Starting Balance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                    <input
                      type="number"
                      value={startBalance}
                      onChange={e => setStartBalance(e.target.value)}
                      className="w-full bg-surface-dim border border-gray-200 rounded-input pl-8 pr-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                </div>

                {/* Daily Goal % — slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-secondary">Daily Goal %</label>
                    <span className="text-lg font-bold text-text-primary">{parseFloat(dailyPct || '0').toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={dailyPct}
                    onChange={e => setDailyPct(e.target.value)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #2D2D2D ${((parseFloat(dailyPct) - 0.5) / 9.5) * 100}%, #e5e7eb ${((parseFloat(dailyPct) - 0.5) / 9.5) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-tertiary mt-1">
                    <span>0.5%</span>
                    <span>10%</span>
                  </div>
                </div>

                {/* Time Horizon */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Time Horizon</label>
                  <div className="flex gap-2">
                    {([30, 60, 90] as const).map(h => (
                      <button
                        key={h}
                        onClick={() => updateSettings({ horizon: h })}
                        className={`flex-1 py-2 rounded-pill text-sm font-medium border transition-all ${
                          settings.horizon === h
                            ? 'bg-text-primary text-white border-text-primary'
                            : 'bg-white border-gray-200 text-text-secondary hover:border-text-primary'
                        }`}
                      >
                        {h} days
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveSettings} fullWidth>Save Settings</Button>
              </div>
            )}
          </div>

          {/* ── 3. TODAY'S GOAL STATUS ────────────────────────────── */}
          {todayRow && (
            <div className="bg-white rounded-card shadow-sm p-5">
              <div className="text-sm font-medium text-text-secondary mb-1">Today's Goal</div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {formatCurrency(todayRow.dailyGoalAmount)}{' '}
                <span className="text-lg font-normal text-text-secondary">({settings.dailyGoalPercent}%)</span>
              </div>

              <div className="mt-4 mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Current P/L</span>
                  <span className={`font-semibold ${todayPnL >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                    {todayPnL >= 0 ? '+' : ''}{formatCurrency(todayPnL)}
                  </span>
                </div>
                <div className="h-3 bg-surface-dim rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 100 ? 'bg-accent-success' : progress >= 50 ? 'bg-accent-warning' : 'bg-accent-primary'
                    }`}
                    style={{ width: `${Math.max(progress, 3)}%` }}
                  />
                </div>
                <div className="text-right text-xs text-text-tertiary mt-1">{Math.round(progress)}%</div>
              </div>

              {progress >= 100 ? (
                <p className="text-accent-success text-sm font-medium">🎯 Goal achieved! Great trading today!</p>
              ) : (
                <p className="text-text-secondary text-sm">
                  {formatCurrency(Math.max(todayRow.dailyGoalAmount - todayPnL, 0))} away from today's goal
                </p>
              )}
            </div>
          )}

          {/* ── 4. PROJECTION TABLE ───────────────────────────────── */}
          <div className="bg-white rounded-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-text-primary">{settings.horizon}-Day Projection</h3>
              <p className="text-xs text-text-secondary mt-1">
                Tap the pencil icon on any row to override its starting balance.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-dim">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-text-tertiary font-medium">Date</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Start</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Goal $</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Actual</th>
                    <th className="text-center px-3 py-2 text-xs text-text-tertiary font-medium">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {goalRows.map((row) => {
                    const isToday = row.date === today;
                    const isPast = row.date < today;
                    const actual = dailyGoals.find(g => g.date === row.date);
                    const isEditing = editingRow === row.date;

                    let rowBg = '';
                    if (actual?.status === 'beat') rowBg = 'bg-green-50';
                    else if (actual?.status === 'missed') rowBg = 'bg-red-50';
                    else if (isToday) rowBg = 'bg-yellow-50';

                    const dateLabel = isToday
                      ? '→ Today'
                      : new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <tr key={row.date} className={`border-t border-gray-50 ${rowBg}`}>
                        <td className="px-4 py-2.5">
                          <div className={`font-medium ${isToday ? 'text-accent-primary' : 'text-text-primary'}`}>
                            {dateLabel}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                className="w-24 text-xs border border-accent-primary rounded px-1 py-0.5 text-right"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitRowEdit(row.date);
                                  if (e.key === 'Escape') cancelRowEdit();
                                }}
                              />
                              <button onClick={() => commitRowEdit(row.date)} className="text-accent-success"><Check size={12} /></button>
                              <button onClick={cancelRowEdit} className="text-accent-error"><X size={12} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 group">
                              <span className="text-text-secondary font-mono text-xs">{formatCurrency(row.startingBalance, 0)}</span>
                              <button
                                onClick={() => startRowEdit(row.date, row.startingBalance)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-accent-primary"
                                title="Override start balance for this day"
                              >
                                <Pencil size={11} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-secondary font-mono text-xs">
                          {formatCurrency(row.dailyGoalAmount)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-xs font-medium ${
                          actual ? (actual.actualPnL! >= 0 ? 'text-accent-success' : 'text-accent-error') : 'text-text-tertiary'
                        }`}>
                          {actual
                            ? (actual.actualPnL! >= 0 ? '+' : '') + formatCurrency(actual.actualPnL!)
                            : '--'}
                        </td>
                        <td className="px-3 py-2.5 text-center text-base">
                          {actual?.status === 'beat'
                            ? '✅'
                            : actual?.status === 'missed'
                            ? '❌'
                            : isToday
                            ? '🎯'
                            : isPast
                            ? '⏸️'
                            : '·'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
