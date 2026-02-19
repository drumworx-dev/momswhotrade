import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useGoals } from '../../context/GoalsContext';
import { useTrades } from '../../context/TradesContext';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../shared/Button';
import { toast } from 'react-hot-toast';

export function GoalTracker() {
  const { settings, updateSettings, goalRows, dailyGoals, updateDailyGoal } = useGoals();
  const { trades } = useTrades();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startBalance, setStartBalance] = useState(settings.startingBalance.toString());
  const [dailyPct, setDailyPct] = useState(settings.dailyGoalPercent.toString());

  const today = new Date().toISOString().split('T')[0];
  const todayGoal = goalRows[0];

  const todayPnL = trades
    .filter(t => {
      const d = t.updatedAt?.toDate?.()?.toISOString().split('T')[0];
      return d === today && (t.status === 'closed' || t.status === 'tp_reached' || t.status === 'sl_hit');
    })
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  const progress = todayGoal ? Math.min((todayPnL / todayGoal.dailyGoalAmount) * 100, 100) : 0;

  const handleSyncTrades = () => {
    const tradesByDate: Record<string, number> = {};
    trades.forEach(t => {
      if (t.profitLoss !== undefined && (t.status === 'closed' || t.status === 'tp_reached' || t.status === 'sl_hit')) {
        const d = t.updatedAt?.toDate?.()?.toISOString().split('T')[0] || today;
        tradesByDate[d] = (tradesByDate[d] || 0) + t.profitLoss;
      }
    });
    Object.entries(tradesByDate).forEach(([date, pnl]) => updateDailyGoal(date, pnl));
    toast.success('Journal synced!');
  };

  const handleSaveSettings = () => {
    updateSettings({
      startingBalance: parseFloat(startBalance) || 1000,
      dailyGoalPercent: parseFloat(dailyPct) || 1,
    });
    toast.success('Settings saved!');
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
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
            Sync
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {/* Today's Status Card */}
          {todayGoal && (
            <div className="bg-white rounded-card shadow-sm p-5">
              <div className="text-sm font-medium text-text-secondary mb-1">Today's Goal</div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {formatCurrency(todayGoal.dailyGoalAmount)} <span className="text-lg font-normal text-text-secondary">({settings.dailyGoalPercent}%)</span>
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
                  {formatCurrency(Math.max(todayGoal.dailyGoalAmount - todayPnL, 0))} away from today's goal
                </p>
              )}
            </div>
          )}

          {/* Settings */}
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
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Daily Goal %</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={dailyPct}
                      onChange={e => setDailyPct(e.target.value)}
                      step="0.1"
                      className="w-full bg-surface-dim border border-gray-200 rounded-input px-4 pr-8 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Time Horizon</label>
                  <div className="flex gap-2">
                    {[30, 60, 90].map(h => (
                      <button
                        key={h}
                        onClick={() => updateSettings({ horizon: h as 30 | 60 | 90 })}
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

          {/* Goal Table */}
          <div className="bg-white rounded-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-text-primary">
                {settings.horizon}-Day Projection
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Starting: {formatCurrency(settings.startingBalance)} at {settings.dailyGoalPercent}% daily
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-dim">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-text-tertiary font-medium">Day</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Start</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Goal $</th>
                    <th className="text-right px-3 py-2 text-xs text-text-tertiary font-medium">Actual</th>
                    <th className="text-center px-3 py-2 text-xs text-text-tertiary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goalRows.map((row) => {
                    const rowDate = new Date();
                    rowDate.setDate(rowDate.getDate() - (settings.horizon - 1) + (row.day - 1));
                    const dateStr = rowDate.toISOString().split('T')[0];
                    const actual = dailyGoals.find(g => g.date === dateStr);
                    const isToday = dateStr === today;
                    const isFuture = rowDate > new Date();

                    let rowBg = '';
                    if (actual?.status === 'beat') rowBg = 'bg-green-50';
                    else if (actual?.status === 'missed') rowBg = 'bg-red-50';
                    else if (isToday && !isFuture) rowBg = 'bg-yellow-50';

                    return (
                      <tr key={row.day} className={`border-t border-gray-50 ${rowBg}`}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-text-primary">
                            {isToday ? '→ Today' : rowDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-secondary font-mono text-xs">
                          {formatCurrency(row.startingBalance, 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-secondary font-mono text-xs">
                          {formatCurrency(row.dailyGoalAmount)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-xs font-medium ${
                          actual ? (actual.actualPnL! >= 0 ? 'text-accent-success' : 'text-accent-error') : 'text-text-tertiary'
                        }`}>
                          {actual ? (actual.actualPnL! >= 0 ? '+' : '') + formatCurrency(actual.actualPnL!) : isFuture ? '--' : '--'}
                        </td>
                        <td className="px-3 py-2.5 text-center text-base">
                          {actual?.status === 'beat' ? '✅' : actual?.status === 'missed' ? '❌' : isToday ? '🎯' : isFuture ? '·' : '⏸️'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-card shadow-sm p-4">
            <h3 className="font-semibold text-text-primary mb-3">Projected Outcome</h3>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">After {settings.horizon} days</span>
              <span className="font-bold text-accent-success text-lg">
                {formatCurrency(goalRows[goalRows.length - 1]?.expectedEndingBalance || settings.startingBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-text-secondary text-sm">Total Gain</span>
              <span className="font-semibold text-accent-success">
                +{formatCurrency((goalRows[goalRows.length - 1]?.expectedEndingBalance || settings.startingBalance) - settings.startingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
