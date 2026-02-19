import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { calculateTrade } from '../../utils/calculations';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import type { CalculatorState, CalculatorResults } from '../../types';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Info } from 'lucide-react';

const defaultState: CalculatorState = {
  accountBalance: '',
  riskType: 'percent',
  riskValue: '1',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  direction: 'long',
  riskReward: '1:3',
};

const rrOptions = ['1:3', '1:5', '1:10'];

export function TradingCalculator() {
  const [state, setState] = useState<CalculatorState>(defaultState);
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const { addTrade } = useTrades();
  const { user } = useAuth();

  const update = (key: keyof CalculatorState, value: string) => {
    setState(prev => ({ ...prev, [key]: value }));
    // Clear results when inputs change
    setResults(null);
  };

  const hasManualTP = state.takeProfit.trim() !== '' && !isNaN(parseFloat(state.takeProfit));
  const hasEntryPrice = state.entryPrice.trim() !== '' && !isNaN(parseFloat(state.entryPrice));

  const handleCalculate = () => {
    const r = calculateTrade(state);
    if (!r) {
      toast.error('Please fill in Account Balance, Entry Price, and Stop Loss');
      return;
    }
    setResults(r);
  };

  const handleSaveTrade = (status: 'planned' | 'open') => {
    if (!results) { toast.error('Calculate first'); return; }
    if (!user) return;

    addTrade({
      userId: user.uid,
      entryPrice: parseFloat(state.entryPrice),
      stopLoss: parseFloat(state.stopLoss),
      takeProfit: results.takeProfitPrice,
      direction: state.direction,
      riskReward: results.actualRiskReward,
      positionSize: results.positionSize,
      valueTraded: results.positionSize * parseFloat(state.entryPrice),
      token: '',
      assetCategory: 'crypto',
      timeframe: '4hr',
      leverage: 1,
      cause: '',
      status,
    });

    toast.success(
      status === 'open' ? 'Trade opened in Journal! 📗' : 'Trade saved to Journal! 💾',
      { style: { background: '#fff', color: '#2D2D2D', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } }
    );
  };

  const handleClear = () => {
    setState(defaultState);
    setResults(null);
  };

  const riskHighlight = results && results.riskPercent > 2;

  // Parse actual R:R for display in visual bar
  const rrForBar = results?.actualRiskReward || state.riskReward;
  const rrParts = rrForBar.split(':');
  const rewardPart = rrParts.length === 2 ? parseFloat(rrParts[1]) : 3;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-text-primary">Trade Calculator</h1>
        <p className="text-text-secondary text-sm">Calculate your position size & risk</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {/* Main Inputs Card */}
          <Card>
            <div className="flex flex-col gap-4">
              <Input
                label="Account Balance"
                prefix="$"
                type="number"
                placeholder="10,000"
                value={state.accountBalance}
                onChange={e => update('accountBalance', e.target.value)}
                inputMode="decimal"
              />

              {/* Risk Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Risk per Trade
                </label>
                <div className="flex gap-2">
                  <div className="flex rounded-input overflow-hidden border border-gray-200">
                    {(['percent', 'dollar'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => update('riskType', t)}
                        className={`px-4 py-2.5 text-sm font-medium transition-all ${
                          state.riskType === t
                            ? 'bg-text-primary text-white'
                            : 'bg-white text-text-secondary hover:bg-surface-dim'
                        }`}
                      >
                        {t === 'percent' ? '%' : '$'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={state.riskValue}
                    onChange={e => update('riskValue', e.target.value)}
                    className="flex-1 bg-surface-dim border border-gray-200 rounded-input px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder={state.riskType === 'percent' ? '1' : '100'}
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Direction</label>
                <div className="flex gap-2">
                  {(['long', 'short'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => update('direction', dir)}
                      className={`flex-1 py-3 rounded-input font-semibold text-sm transition-all ${
                        state.direction === dir
                          ? dir === 'long'
                            ? 'bg-accent-success text-white'
                            : 'bg-accent-error text-white'
                          : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
                      }`}
                    >
                      {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Entry Price"
                prefix="$"
                type="number"
                placeholder="43,250"
                value={state.entryPrice}
                onChange={e => update('entryPrice', e.target.value)}
                inputMode="decimal"
              />

              <Input
                label="Stop Loss"
                prefix="$"
                type="number"
                placeholder="42,500"
                value={state.stopLoss}
                onChange={e => update('stopLoss', e.target.value)}
                inputMode="decimal"
              />

              <Input
                label="Take Profit (optional)"
                prefix="$"
                type="number"
                placeholder="Enter to get exact R:R"
                value={state.takeProfit}
                onChange={e => update('takeProfit', e.target.value)}
                inputMode="decimal"
              />

              {/* Risk:Reward presets — optional helper when TP is not set */}
              {hasEntryPrice && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className={`text-sm font-medium ${hasManualTP ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                      R:R Preset
                    </label>
                    {hasManualTP && (
                      <span className="text-xs text-text-tertiary italic">(overridden by your Take Profit)</span>
                    )}
                    {!hasManualTP && (
                      <span className="text-xs text-text-tertiary flex items-center gap-0.5">
                        <Info size={11} /> sets TP automatically
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {rrOptions.map(rr => (
                      <button
                        key={rr}
                        onClick={() => !hasManualTP && update('riskReward', rr)}
                        disabled={hasManualTP}
                        className={`flex-1 py-2 rounded-pill text-sm font-medium border transition-all ${
                          hasManualTP
                            ? 'bg-surface-dim border-gray-100 text-text-tertiary cursor-not-allowed'
                            : state.riskReward === rr
                            ? 'bg-text-primary text-white border-text-primary'
                            : 'bg-white border-gray-200 text-text-secondary hover:border-text-primary'
                        }`}
                      >
                        {rr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Calculate Button */}
          <Button onClick={handleCalculate} size="lg" fullWidth>
            Calculate Position
          </Button>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-3"
              >
                {/* Risk warning */}
                {riskHighlight && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-accent-warning rounded-card p-3">
                    <AlertTriangle size={16} className="text-accent-warning flex-shrink-0" />
                    <p className="text-sm text-text-secondary">
                      Risk is <strong>{results.riskPercent.toFixed(1)}%</strong> of account — consider reducing position size
                    </p>
                  </div>
                )}

                <Card>
                  <h3 className="font-semibold text-text-primary mb-4">Results</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-text-secondary text-sm">Position Size</span>
                      <span className="font-semibold text-text-primary font-mono">{formatNumber(results.positionSize, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-text-secondary text-sm">Risk %</span>
                      <span className={`font-semibold font-mono ${riskHighlight ? 'text-accent-warning' : 'text-text-primary'}`}>
                        {results.riskPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-text-secondary text-sm">Potential Loss</span>
                      <span className="font-semibold text-accent-error font-mono">{formatCurrency(results.potentialLoss)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-text-secondary text-sm">Potential Profit</span>
                      <span className="font-semibold text-accent-success font-mono">{formatCurrency(results.potentialProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-text-secondary text-sm">Take Profit Price</span>
                      <span className="font-semibold text-text-primary font-mono">{formatCurrency(results.takeProfitPrice, 2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-text-secondary text-sm">Risk : Reward</span>
                      <span className="font-bold text-accent-primary font-mono">{results.actualRiskReward}</span>
                    </div>
                  </div>

                  {/* R:R Visual */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-none text-xs text-text-tertiary w-16">Risk</div>
                      <div
                        className="h-3 bg-accent-error rounded-full"
                        style={{
                          width: `${100 / (1 + rewardPart)}%`,
                          minWidth: '20px'
                        }}
                      />
                      <span className="text-xs text-accent-error font-medium">{formatCurrency(results.potentialLoss)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-none text-xs text-text-tertiary w-16">Reward</div>
                      <div
                        className="h-3 bg-accent-success rounded-full"
                        style={{
                          width: `${rewardPart * 100 / (1 + rewardPart)}%`,
                          minWidth: '20px'
                        }}
                      />
                      <span className="text-xs text-accent-success font-medium">{formatCurrency(results.potentialProfit)}</span>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleSaveTrade('open')} size="md" fullWidth variant="accent">
                    Take Trade 🚀
                  </Button>
                  <Button onClick={() => handleSaveTrade('planned')} size="md" fullWidth variant="secondary">
                    Save to Journal
                  </Button>
                  <button
                    onClick={handleClear}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
