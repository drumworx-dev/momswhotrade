import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Trade } from '../../types';
import { TradeCard } from './TradeCard';
import { TradeDetailModal } from './TradeDetailModal';
import { NewTradeModal } from './NewTradeModal';
import { useTrades } from '../../context/TradesContext';
import { useAuth } from '../../context/AuthContext';

const filterTabs = ['All', 'Open', 'Closed', 'Wins', 'Losses'] as const;
type FilterTab = typeof filterTabs[number];


export function TradeJournal() {
  const { trades } = useTrades();
  useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [sortBy] = useState('newest');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showNewTrade, setShowNewTrade] = useState(false);

  const filtered = trades
    .filter(t => {
      if (activeFilter === 'Open') return t.status === 'open';
      if (activeFilter === 'Closed') return ['closed', 'tp_reached', 'sl_hit'].includes(t.status);
      if (activeFilter === 'Wins') return t.winLoss === 'win';
      if (activeFilter === 'Losses') return t.winLoss === 'loss';
      return true;
    })
    .sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      if (sortBy === 'newest') return bDate.getTime() - aDate.getTime();
      if (sortBy === 'oldest') return aDate.getTime() - bDate.getTime();
      if (sortBy === 'best') return (b.profitLoss || 0) - (a.profitLoss || 0);
      if (sortBy === 'worst') return (a.profitLoss || 0) - (b.profitLoss || 0);
      return 0;
    });

  const totalPnL = trades.filter(t => t.profitLoss !== undefined).reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const wins = trades.filter(t => t.winLoss === 'win').length;
  const total = trades.filter(t => t.winLoss).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
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

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map(tab => (
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
