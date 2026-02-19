import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, AlertTriangle, Info } from 'lucide-react';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { calculateTrade } from '../../utils/calculations';
import type { CalculatorState, CalculatorResults, CurrencyCode } from '../../types';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';

// ─── constants ─────────────────────────────────────────────────────────────
const CURRENCIES: { code: CurrencyCode; label: string; sym: string }[] = [
  { code: 'USD', sym: '$',  label: '$ USD' },
  { code: 'BTC', sym: '₿',  label: '₿ BTC' },
  { code: 'EUR', sym: '€',  label: '€ EUR' },
  { code: 'GBP', sym: '£',  label: '£ GBP' },
];

const RR_PRESETS = ['1:3', '1:5', '1:10'];

const LEVERAGE_PRESETS = ['1', '3', '5', '7', '10', '20'];
const TIMEFRAME_PRESETS = ['15M', '1H', '4H', '1D', '1W'];

// Map calculator timeframes to journal's allowed values
const toJournalTimeframe = (tf: string): '1hr' | '4hr' | 'daily' | 'weekly' => {
  if (tf === '4H') return '4hr';
  if (tf === '1D') return 'daily';
  if (tf === '1W') return 'weekly';
  return '1hr'; // 15M and 1H both map to 1hr
};

type AssetCategory = 'crypto' | 'stocks' | 'commodities' | 'forex';

const ASSET_CATEGORIES: { value: AssetCategory; label: string; emoji: string }[] = [
  { value: 'crypto',      label: 'Crypto',      emoji: '₿' },
  { value: 'stocks',      label: 'Stocks',      emoji: '📈' },
  { value: 'commodities', label: 'Commodities', emoji: '🛢️' },
  { value: 'forex',       label: 'Forex',       emoji: '💱' },
];

const DEFAULT: CalculatorState = {
  assetName:      '',
  assetCategory:  'crypto',
  currency:       'USD',
  accountBalance: '',
  riskType:       'dollar',
  riskValue:      '',
  leverage:       '1',
  entryPrice:     '',
  stopLoss:       '',
  takeProfit:     '',
  direction:      'long',
  riskReward:     '1:3',
  timeframe:      '4H',
};

// ─── helpers ───────────────────────────────────────────────────────────────
function getSym(code: CurrencyCode) {
  return CURRENCIES.find(c => c.code === code)?.sym ?? '$';
}

/** Format a raw number string with thousand-comma separators */
function displayNum(raw: string): string {
  if (!raw) return raw;
  const stripped = raw.replace(/,/g, '');
  const [int, dec] = stripped.split('.');
  const formatted = (int || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

/** Strip commas before storing in state */
function rawNum(v: string): string {
  return v.replace(/,/g, '');
}

function fmtAmt(n: number, sym: string, dec = 2): string {
  if (!isFinite(n)) return sym + '0.00';
  return sym + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function buildPDFHtml(state: CalculatorState, r: CalculatorResults): string {
  const sym  = getSym(state.currency);
  const now  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const f    = (n: number) => sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const acct = parseFloat(state.accountBalance) || 0;

  return (
    '<!DOCTYPE html><html><head>' +
    '<meta charset="utf-8"><title>Trade Report</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:48px;max-width:640px;margin:0 auto;color:#1a1a1a}' +
    'h1{font-size:28px;font-weight:800;margin:0 0 4px}' +
    '.sub{color:#888;font-size:13px;margin-bottom:36px}' +
    'h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#aaa;margin:28px 0 10px;border-top:1px solid #f0f0f0;padding-top:16px}' +
    '.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f7f7f7;font-size:14px}' +
    '.lbl{color:#888}.val{font-weight:600}' +
    '.profit{color:#16a34a}.loss{color:#dc2626}' +
    '.headline{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}' +
    '.card{border:1px solid #f0f0f0;border-radius:12px;padding:20px;text-align:center}' +
    '.card-label{font-size:12px;color:#888;margin-bottom:8px}' +
    '.card-value{font-size:28px;font-weight:800}' +
    'table{width:100%;border-collapse:collapse;font-size:14px}' +
    'th{text-align:left;padding:10px 14px;background:#f7f7f7;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#999}' +
    'td{padding:12px 14px;border-bottom:1px solid #f7f7f7}' +
    '.footer{margin-top:48px;text-align:center;font-size:11px;color:#ccc;border-top:1px solid #f0f0f0;padding-top:20px}' +
    '@media print{body{padding:20px}.no-print{display:none!important}}' +
    '</style></head><body>' +
    '<button class="no-print" onclick="window.close()" title="Close" style="position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:50%;background:#1a1a1a;color:#fff;border:none;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.25);z-index:999;display:flex;align-items:center;justify-content:center;">✕</button>' +
    '<h1>Trade Report</h1>' +
    '<div class="sub">' + (state.assetName || 'Unnamed Asset') + ' &middot; ' + state.direction.toUpperCase() + ' &middot; ' + now + '</div>' +
    '<div class="headline">' +
    '<div class="card"><div class="card-label">Potential Profit</div><div class="card-value profit">+' + f(r.potentialProfit) + '</div></div>' +
    '<div class="card"><div class="card-label">Risk Percentage</div><div class="card-value">' + r.riskPercent.toFixed(2) + '%</div></div>' +
    '</div>' +
    '<h2>Potential Outcomes</h2>' +
    '<table><thead><tr><th>Scenario</th><th>P&amp;L</th><th>New Balance</th></tr></thead><tbody>' +
    '<tr><td>Take Profit Hit &#127919;</td><td class="profit">+' + f(r.potentialProfit) + '</td><td>' + f(r.newBalanceIfTP) + '</td></tr>' +
    '<tr><td>Stop Loss Hit &#128721;</td><td class="loss">-' + f(r.potentialLoss) + '</td><td>' + f(r.newBalanceIfSL) + '</td></tr>' +
    '</tbody></table>' +
    '<h2>Key Metrics</h2>' +
    '<div class="row"><span class="lbl">Position Size</span><span class="val">' + f(r.effectivePosition) + '</span></div>' +
    '<div class="row"><span class="lbl">Risk / Reward Ratio</span><span class="val">' + r.actualRiskReward + '</span></div>' +
    '<div class="row"><span class="lbl">Leverage Used</span><span class="val">1:' + state.leverage + '</span></div>' +
    '<h2>Trade Setup</h2>' +
    '<div class="row"><span class="lbl">Account Size</span><span class="val">' + f(acct) + '</span></div>' +
    '<div class="row"><span class="lbl">Trade Size (Margin)</span><span class="val">' + f(r.tradeSize) + ' (' + r.riskPercent.toFixed(2) + '% of account)</span></div>' +
    '<div class="row"><span class="lbl">Leverage</span><span class="val">' + state.leverage + 'x (1:' + state.leverage + ')</span></div>' +
    '<div class="row"><span class="lbl">Effective Position</span><span class="val">' + f(r.effectivePosition) + '</span></div>' +
    '<div class="row"><span class="lbl">Direction</span><span class="val">' + state.direction.toUpperCase() + '</span></div>' +
    '<div class="row"><span class="lbl">Entry Price</span><span class="val">' + f(r.entryPrice) + '</span></div>' +
    '<div class="row"><span class="lbl">Stop Loss</span><span class="val">' + f(r.stopLossPrice) + '</span></div>' +
    '<div class="row"><span class="lbl">Take Profit</span><span class="val">' + f(r.takeProfitPrice) + '</span></div>' +
    '<div class="footer">Generated by Moms Who Trade &middot; momswhotrade.com &middot; ' + now + '</div>' +
    '</body></html>'
  );
}

const CALC_STORAGE_KEY = 'mwt_calc_state';

// ─── component ─────────────────────────────────────────────────────────────
export function TradingCalculator() {
  const [state, setState]       = useState<CalculatorState>(() => {
    try {
      const stored = localStorage.getItem(CALC_STORAGE_KEY);
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch { return DEFAULT; }
  });
  const [results, setResults]   = useState<CalculatorResults | null>(null);
  const [tpUserEdited, setTpUserEdited] = useState(false);
  const { addTrade }            = useTrades();
  const { user }                = useAuth();
  const resultsRef              = useRef<HTMLDivElement>(null);

  // Persist calculator state across tab switches
  useEffect(() => {
    localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const sym     = getSym(state.currency);
  const acct    = parseFloat(state.accountBalance) || 0;
  const levNum  = Math.max(1, parseFloat(state.leverage) || 1);

  const tradeSizePct = state.riskType === 'percent'
    ? parseFloat(state.riskValue) || 0
    : acct > 0 ? ((parseFloat(state.riskValue) || 0) / acct) * 100 : 0;
  const tradeSizeDollar = state.riskType === 'percent'
    ? acct * (tradeSizePct / 100)
    : parseFloat(state.riskValue) || 0;

  const hasEntryAndSL = state.entryPrice !== '' && !isNaN(parseFloat(state.entryPrice))
    && state.stopLoss !== '' && !isNaN(parseFloat(state.stopLoss));
  const hasTP = state.takeProfit !== '' && !isNaN(parseFloat(state.takeProfit));

  // Compute actual R:R from entry / SL / TP when all three are present
  const computedRR: number | null = hasEntryAndSL && hasTP ? (() => {
    const entry  = parseFloat(state.entryPrice);
    const sl     = parseFloat(state.stopLoss);
    const tp     = parseFloat(state.takeProfit);
    const risk   = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return risk > 0 ? reward / risk : null;
  })() : null;
  const rrWarning = computedRR !== null && computedRR < 3;

  const update = (key: keyof CalculatorState, value: string) => {
    setState(prev => ({ ...prev, [key]: value }));
    setResults(null);
  };

  /** Tapping an R:R preset auto-calculates and fills in the Take Profit */
  const handleRRClick = (rr: string) => {
    const entry = parseFloat(state.entryPrice);
    const sl    = parseFloat(state.stopLoss);
    if (!entry || !sl || entry === sl) {
      update('riskReward', rr);
      return;
    }
    const parts   = rr.split(':');
    const mult    = parseFloat(parts[1]) / parseFloat(parts[0]);
    const slDist  = Math.abs(entry - sl);
    const tp      = state.direction === 'long' ? entry + slDist * mult : entry - slDist * mult;
    setTpUserEdited(false);
    setState(prev => ({ ...prev, riskReward: rr, takeProfit: tp.toFixed(2) }));
    setResults(null);
  };

  const handleCalculate = () => {
    const r = calculateTrade(state);
    if (!r) { toast.error('Fill in Account Size, Entry Price, and Stop Loss'); return; }
    setResults(r);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const handleExportPDF = () => {
    if (!results) return;
    const html = buildPDFHtml(state, results);
    const win  = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups to export PDF'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleSaveTrade = (status: 'planned' | 'open') => {
    if (!results) { toast.error('Calculate first'); return; }
    if (!user)    return;
    addTrade({
      userId:        user.uid,
      entryPrice:    results.entryPrice,
      stopLoss:      results.stopLossPrice,
      takeProfit:    results.takeProfitPrice,
      direction:     state.direction,
      riskReward:    results.actualRiskReward,
      positionSize:  results.tradeSize,
      valueTraded:   results.effectivePosition,
      token:         state.assetName || '',
      assetCategory: state.assetCategory,
      timeframe:     toJournalTimeframe(state.timeframe),
      leverage:      levNum,
      cause:         '',
      status,
    });
    toast.success(status === 'open' ? 'Trade opened in Journal! 📗' : 'Trade saved to Journal! 💾', {
      style: { background: '#fff', color: '#2D2D2D', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
    });
  };

  // Visualization proportions
  const tpDist = results ? Math.abs(results.takeProfitPrice - results.entryPrice) : 1;
  const slDist = results ? Math.abs(results.entryPrice - results.stopLossPrice)   : 1;

  const riskHighlight = results && results.riskPercent > 25;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pb-4 sticky top-0 z-30 shadow-sm page-header">
        <h1 className="text-xl font-bold text-text-primary">Trade Calculator</h1>
        <p className="text-text-secondary text-sm">Size your position & visualise the trade</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        <div className="max-w-lg mx-auto flex flex-col gap-4">

          {/* ═══ SECTION: TRADE SETUP ══════════════════════════════════ */}
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1 mt-1">Trade Setup</p>

          <Card>
            <div className="flex flex-col gap-5">

              {/* Asset Name */}
              <Input
                label="Asset Name"
                placeholder="Bitcoin, Gold, AAPL, EUR/USD…"
                value={state.assetName}
                onChange={e => update('assetName', e.target.value)}
              />

              {/* Asset Category */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ASSET_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => update('assetCategory', cat.value)}
                      className={`py-2 rounded-pill text-xs font-semibold border transition-all ${
                        state.assetCategory === cat.value
                          ? 'bg-text-primary text-white border-text-primary'
                          : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Currency</label>
                <div className="flex gap-1.5">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => update('currency', c.code)}
                      className={`flex-1 py-2 rounded-input text-xs font-semibold border transition-all ${
                        state.currency === c.code
                          ? 'bg-text-primary text-white border-text-primary'
                          : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Size */}
              <Input
                label="Account Size"
                prefix={sym}
                type="text"
                placeholder="10,000"
                value={displayNum(state.accountBalance)}
                onChange={e => update('accountBalance', rawNum(e.target.value))}
                inputMode="decimal"
              />

              {/* Trade Size / Amount Risked */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-secondary">Trade Size / Amount Risked</label>
                  {acct > 0 && tradeSizePct > 0 && (
                    <span className="text-xs text-text-tertiary">({tradeSizePct.toFixed(2)}% of account)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex rounded-input overflow-hidden border border-gray-200 flex-none">
                    {(['percent', 'dollar'] as const).map(t => (
                      <button key={t} onClick={() => update('riskType', t)}
                        className={`px-4 py-2.5 text-sm font-medium transition-all ${
                          state.riskType === t ? 'bg-text-primary text-white' : 'bg-white text-text-secondary hover:bg-surface-dim'
                        }`}
                      >
                        {t === 'percent' ? '%' : sym}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={displayNum(state.riskValue)}
                    onChange={e => update('riskValue', rawNum(e.target.value))}
                    className="flex-1 bg-surface-dim border border-gray-200 rounded-input px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder={state.riskType === 'percent' ? '5' : '500'}
                    inputMode="decimal"
                  />
                </div>
                {acct > 0 && tradeSizeDollar > 0 && (
                  <p className="text-xs text-text-tertiary mt-1.5 pl-1">
                    = {fmtAmt(tradeSizeDollar, sym)} margin
                    {levNum > 1 && <> → {fmtAmt(tradeSizeDollar * levNum, sym)} position at {levNum}x</>}
                  </p>
                )}
              </div>

              {/* Leverage buttons */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Leverage</label>
                <div className="flex gap-1.5 flex-wrap">
                  {LEVERAGE_PRESETS.map(lev => (
                    <button
                      key={lev}
                      onClick={() => update('leverage', lev)}
                      className={`flex-1 py-2.5 rounded-input text-sm font-semibold border transition-all ${
                        state.leverage === lev
                          ? 'bg-text-primary text-white border-text-primary'
                          : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                      }`}
                    >
                      {lev}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Direction</label>
                <div className="flex gap-2">
                  {(['long', 'short'] as const).map(dir => (
                    <button key={dir} onClick={() => update('direction', dir)}
                      className={`flex-1 py-3 rounded-input font-semibold text-sm transition-all ${
                        state.direction === dir
                          ? dir === 'long' ? 'bg-accent-success text-white' : 'bg-accent-error text-white'
                          : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
                      }`}
                    >
                      {dir === 'long' ? '↑ LONG' : '↓ SHORT'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Timeframe</label>
                <div className="flex gap-1.5">
                  {TIMEFRAME_PRESETS.map(tf => (
                    <button
                      key={tf}
                      onClick={() => update('timeframe', tf)}
                      className={`flex-1 py-2.5 rounded-input text-sm font-semibold border transition-all ${
                        state.timeframe === tf
                          ? 'bg-text-primary text-white border-text-primary'
                          : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry / SL */}
              <Input label="Entry Price" prefix={sym} type="text" placeholder="45,000"
                value={displayNum(state.entryPrice)} onChange={e => update('entryPrice', rawNum(e.target.value))} inputMode="decimal" />

              <Input label="Stop Loss" prefix={sym} type="text" placeholder="43,000"
                value={displayNum(state.stopLoss)} onChange={e => update('stopLoss', rawNum(e.target.value))} inputMode="decimal" />

              {/* Quick R:R presets — ABOVE take profit so they can auto-fill it */}
              {hasEntryAndSL && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="text-sm font-medium text-text-secondary">Risk / Reward</label>
                    <span className="text-xs text-text-tertiary flex items-center gap-0.5">
                      <Info size={11} /> tap to auto-set Take Profit
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {RR_PRESETS.map(rr => (
                      <button key={rr}
                        onClick={() => handleRRClick(rr)}
                        className={`flex-1 py-2.5 rounded-pill text-sm font-semibold border transition-all ${
                          !tpUserEdited && state.riskReward === rr
                            ? 'bg-text-primary text-white border-text-primary'
                            : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                        }`}
                      >
                        {rr}
                      </button>
                    ))}
                  </div>
                  {/* Computed R:R warning / info */}
                  {computedRR !== null && (
                    <div className={`flex items-center gap-2 mt-2 rounded-lg px-3 py-2 text-sm ${
                      rrWarning ? 'bg-orange-50 border border-accent-warning' : 'bg-emerald-50'
                    }`}>
                      {rrWarning && <AlertTriangle size={14} className="text-accent-warning flex-shrink-0" />}
                      <span className={rrWarning ? 'text-text-secondary' : 'text-emerald-700'}>
                        Actual R:R: <strong>1:{computedRR.toFixed(2)}</strong>
                        {rrWarning && ' — consider aiming for at least 1:3'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Take Profit */}
              <Input label="Take Profit" prefix={sym} type="text" placeholder="55,000 (optional)"
                value={displayNum(state.takeProfit)}
                onChange={e => {
                  setTpUserEdited(true);
                  update('takeProfit', rawNum(e.target.value));
                }}
                inputMode="decimal" />
            </div>
          </Card>

          {/* Calculate */}
          <Button onClick={handleCalculate} size="lg" fullWidth>Calculate Position</Button>

          {/* ═══ RESULTS ═══════════════════════════════════════════════ */}
          <AnimatePresence>
            {results && (
              <motion.div ref={resultsRef}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
                className="flex flex-col gap-4"
              >
                {riskHighlight && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-accent-warning rounded-card p-3">
                    <AlertTriangle size={16} className="text-accent-warning flex-shrink-0" />
                    <p className="text-sm text-text-secondary">
                      Risking <strong>{results.riskPercent.toFixed(1)}%</strong> — consider keeping below 25%
                    </p>
                  </div>
                )}

                {/* ─ Visualising Success ─────────────────────────────── */}
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Visualising Success</p>

                <div className="rounded-card overflow-hidden shadow-sm border border-gray-100" style={{ height: '288px' }}>
                  <div className="flex flex-col h-full">

                    {/* TP zone */}
                    <div
                      className="relative flex flex-col justify-between px-5 py-4 overflow-hidden"
                      style={{
                        flex: Math.max(tpDist, slDist * 0.3),
                        minHeight: 96,
                        background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
                        borderBottom: '3px solid #86efac',
                      }}
                    >
                      {/* grid lines */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(5,150,105,.06) 0,rgba(5,150,105,.06) 1px,transparent 1px,transparent 36px)' }} />
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-0.5">Take Profit</div>
                          <div className="text-sm font-mono font-semibold text-emerald-600">{fmtAmt(results.takeProfitPrice, sym)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-600 leading-none">+{fmtAmt(results.potentialProfit, sym)}</div>
                          <div className="text-xs text-emerald-500 mt-0.5">potential profit</div>
                        </div>
                      </div>
                    </div>

                    {/* Entry bar */}
                    <div className="flex-none flex items-center justify-between px-5 bg-gray-900" style={{ height: '44px' }}>
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Entry Price</span>
                      <span className="font-mono font-bold text-white">{fmtAmt(results.entryPrice, sym)}</span>
                    </div>

                    {/* SL zone */}
                    <div
                      className="relative flex flex-col justify-end px-5 py-4 overflow-hidden"
                      style={{
                        flex: Math.max(slDist, tpDist * 0.3),
                        minHeight: 72,
                        background: 'linear-gradient(0deg, #fee2e2 0%, #fecaca 100%)',
                        borderTop: '3px solid #fca5a5',
                      }}
                    >
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(220,38,38,.06) 0,rgba(220,38,38,.06) 1px,transparent 1px,transparent 36px)' }} />
                      <div className="relative z-10 flex items-end justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-red-600 mb-0.5">Stop Loss</div>
                          <div className="text-sm font-mono font-semibold text-red-500">{fmtAmt(results.stopLossPrice, sym)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-500 leading-none">-{fmtAmt(results.potentialLoss, sym)}</div>
                          <div className="text-xs text-red-400 mt-0.5">potential loss</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─ Trade Summary ───────────────────────────────────── */}
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Trade Summary</p>

                <Card>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-text-primary text-base">Trade Summary</h3>
                    <button onClick={handleExportPDF}
                      className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-surface-dim hover:bg-bg-secondary border border-gray-200 rounded-pill px-3 py-1.5 transition-colors"
                    >
                      <FileDown size={13} /> Export PDF
                    </button>
                  </div>

                  {/* Headline stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <div className="text-xs text-emerald-600 font-medium mb-1">Potential Profit</div>
                      <div className="text-2xl font-black text-emerald-600">+{fmtAmt(results.potentialProfit, sym)}</div>
                    </div>
                    <div className="bg-surface-dim rounded-xl p-4 text-center">
                      <div className="text-xs text-text-tertiary font-medium mb-1">Risk Percentage</div>
                      <div className={`text-2xl font-black ${riskHighlight ? 'text-accent-warning' : 'text-text-primary'}`}>
                        {results.riskPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Potential Outcomes */}
                  <div className="mb-5">
                    <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Potential Outcomes</div>
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-dim">
                            <th className="text-left px-4 py-2.5 text-xs text-text-tertiary font-medium">Scenario</th>
                            <th className="text-right px-3 py-2.5 text-xs text-text-tertiary font-medium">P&L</th>
                            <th className="text-right px-4 py-2.5 text-xs text-text-tertiary font-medium">New Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-50 bg-emerald-50/50">
                            <td className="px-4 py-3 text-sm font-medium">Take Profit Hit 🎯</td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-600 font-mono">
                              +{fmtAmt(results.potentialProfit, sym)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-text-primary font-mono">
                              {fmtAmt(results.newBalanceIfTP, sym)}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-50 bg-red-50/30">
                            <td className="px-4 py-3 text-sm font-medium">Stop Loss Hit 🛑</td>
                            <td className="px-3 py-3 text-right font-bold text-red-500 font-mono">
                              -{fmtAmt(results.potentialLoss, sym)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-text-primary font-mono">
                              {fmtAmt(results.newBalanceIfSL, sym)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div>
                    <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Key Metrics</div>
                    <div className="flex flex-col">
                      {([
                        ['Position Size',        fmtAmt(results.effectivePosition, sym)],
                        ['Risk / Reward Ratio',  results.actualRiskReward],
                        ['Leverage Used',        `1:${state.leverage}`],
                        ['Trade Size (Margin)',  fmtAmt(results.tradeSize, sym)],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-text-secondary">{label}</span>
                          <span className="font-semibold text-text-primary font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleSaveTrade('open')} size="md" fullWidth variant="accent">
                    Take Trade 🚀
                  </Button>
                  <Button onClick={() => handleSaveTrade('planned')} size="md" fullWidth variant="secondary">
                    Save to Journal
                  </Button>
                  <button
                    onClick={() => { setState(DEFAULT); setResults(null); setTpUserEdited(false); }}
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
