import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Trade } from '../types';
import { mockTrades } from '../utils/mockData';

interface TradesContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => Trade;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const stored = localStorage.getItem('mwt_trades');
    return stored ? JSON.parse(stored) : mockTrades;
  });

  useEffect(() => {
    localStorage.setItem('mwt_trades', JSON.stringify(trades));
  }, [trades]);

  const addTrade = (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Trade => {
    const now = new Date();
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
      createdAt: { toDate: () => now } as any,
      updatedAt: { toDate: () => now } as any,
    };
    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    const now = new Date();
    setTrades(prev => prev.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: { toDate: () => now } as any }
        : t
    ));
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TradesContext.Provider value={{ trades, addTrade, updateTrade, deleteTrade }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradesContext);
  if (!context) throw new Error('useTrades must be used within a TradesProvider');
  return context;
}
