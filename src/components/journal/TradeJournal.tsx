import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Trade } from '../../types';
import { TradeCard } from './TradeCard';
import { TradeDetailModal } from './TradeDetailModal';
import { NewTradeModal } from './NewTradeModal';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';

type AssetCategory = Trade['assetCategory'];
const CATEGORIES: AssetCategory[] = ['crypto', 'stocks', 'commodities', 'forex'];
const CATEGORY_LABELS: Record<AssetCategory, string> = {
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
};

const statusFilterTabs = ['All', 'Open', 'Closed', 'Wins', 'Losses'] as const;
type StatusFilter = typeof statusFilterTabs[number];

function categoryWinRate(trades: Trade[], cat: AssetCategory) {
  const catTrades = trades.filter(t => t.assetCategory === cat && t.winLoss);
  if (catTrades.length === 0) return null;
  const wins = catTrades.filter(t => t.winLoss === 'win').length;
  return { winRate: Math.round((wins / catTrades.length) * 100), count: catTrades.length };
}

export function TradeJournal() {
  const { trades } = useTrades();
  useAuth();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showNewTrade, setShowNewTrade] = useState(false);

  const filtered = trades
    .filter(t => {
      if (activeCategory !== 'all' && t.assetCategory !== activeCategory) return false;
      if (activeFilter === 'Open') return t.status === 'open';
      if (activeFilter === 'Closed') return ['closed', 'tp_reached', 'sl_hit'].includes(t.status);
      if (activeFilter === 'Wins') return t.winLoss === 'win';
      if (activeFilter === 'Losses') return t.winLoss === 'loss';
      return true;
    })
    .sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

  const totalPnL = trades.filter(t => t.profitLoss !== undefined).reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const wins = trades.filter(t => t.winLoss === 'win').length;
  const total = trades.filter(t => t.winLoss).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Best / worst category by win rate
  const categoryStats = CATEGORIES
    .map(cat => ({ cat, stats: categoryWinRate(trades, cat) }))
    .filter(x => x.stats !== null) as { cat: AssetCategory; stats: { winRate: number; count: number } }[];

  const bestCat = categoryStats.length > 0
    ? categoryStats.reduce((best, x) => x.stats.winRate > best.stats.winRate ? x : best)
    : null;
  const worstCat = categoryStats.length > 0
    ? categoryStats.reduce((worst, x) => x.stats.winRate < worst.stats.winRate ? x : worst)
    : null;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Trade Journal</h1>
            <p className="text-text-secondary text-sm">Track your paper trades</p>
          </div>
          <button
            onClick={() => setShowNewTrade(true)}
            className="w-10 h-10 bg-text-primary rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 bg-surface-dim rounded-card p-3">
            <div className="text-xs text-text-tertiary">Total P&L</div>
            <div className={`font-bold text-base ${totalPnL >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="flex-1 bg-surface-dim rounded-card p-3">
            <div className="text-xs text-text-tertiary">Win Rate</div>
            <div className="font-bold text-base text-text-primary">{winRate}%</div>
          </div>
          <div className="flex-1 bg-surface-dim rounded-card p-3">
            <div className="text-xs text-text-tertiary">Trades</div>
            <div className="font-bold text-base text-text-primary">{trades.length}</div>
          </div>
        </div>

        {/* Best / Worst category badges */}
        {(bestCat || worstCat) && (
          <div className="flex gap-2 mb-3">
            {bestCat && (
              <div className="flex-1 bg-green-50 border border-green-100 rounded-card px-3 py-2">
                <div className="text-xs text-text-tertiary mb-0.5">Best category</div>
                <div className="font-semibold text-accent-success text-sm">
                  {CATEGORY_LABELS[bestCat.cat]} — {bestCat.stats.winRate}% WR
                </div>
              </div>
            )}
            {worstCat && bestCat?.cat !== worstCat.cat && (
              <div className="flex-1 bg-red-50 border border-red-100 rounded-card px-3 py-2">
                <div className="text-xs text-text-tertiary mb-0.5">Needs work</div>
                <div className="font-semibold text-accent-error text-sm">
                  {CATEGORY_LABELS[worstCat.cat]} — {worstCat.stats.winRate}% WR
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-none px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-text-primary text-white'
                : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-none px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-none px-4 py-1.5 rounded-pill text-sm font-medium transition-all ${
                activeFilter === tab
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-semibold text-text-primary mb-2">No trades yet</h3>
              <p className="text-text-secondary text-sm mb-6">
                Use the Calculator to calculate a trade, then save it here
              </p>
              <button
                onClick={() => setShowNewTrade(true)}
                className="text-accent-dark text-sm font-medium underline"
              >
                Add trade manually
              </button>
            </div>
          ) : (
            filtered.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TradeCard trade={trade} onClick={() => setSelectedTrade(trade)} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          open={!!selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}

      {/* New Trade Modal */}
      <NewTradeModal open={showNewTrade} onClose={() => setShowNewTrade(false)} />
    </div>
  );
}
