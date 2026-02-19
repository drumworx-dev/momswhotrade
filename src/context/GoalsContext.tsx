import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DailyGoal } from '../types';
import { generateGoalTable } from '../utils/calculations';
import { useAuth } from './AuthContext';

interface GoalSettings {
  startingBalance: number;
  dailyGoalPercent: number;
  horizon: 30 | 60 | 90;
}

interface GoalsContextType {
  settings: GoalSettings;
  updateSettings: (s: Partial<GoalSettings>) => void;
  goalRows: ReturnType<typeof generateGoalTable>;
  dailyGoals: DailyGoal[];
  updateDailyGoal: (date: string, actualPnL: number) => void;
  startBalanceOverrides: Record<string, number>;
  setStartBalanceOverride: (date: string, balance: number) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GoalSettings>(() => {
    const stored = localStorage.getItem('mwt_goal_settings');
    return stored ? JSON.parse(stored) : { startingBalance: 1000, dailyGoalPercent: 1, horizon: 30 };
  });
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
    const stored = localStorage.getItem('mwt_daily_goals');
    return stored ? JSON.parse(stored) : [];
  });
  const [startBalanceOverrides, setStartBalanceOverrides] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('mwt_balance_overrides');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('mwt_goal_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('mwt_daily_goals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  useEffect(() => {
    localStorage.setItem('mwt_balance_overrides', JSON.stringify(startBalanceOverrides));
  }, [startBalanceOverrides]);

  const updateSettings = (s: Partial<GoalSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  const setStartBalanceOverride = (date: string, balance: number) => {
    setStartBalanceOverrides(prev => ({ ...prev, [date]: balance }));
  };

  // Generate rows forward from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const goalRows = generateGoalTable(
    settings.startingBalance,
    settings.dailyGoalPercent,
    settings.horizon,
    startBalanceOverrides,
    today
  );

  const updateDailyGoal = (date: string, actualPnL: number) => {
    const row = goalRows.find(r => r.date === date);
    if (!row) return;

    const beatGoalBy = actualPnL - row.dailyGoalAmount;
    const status: DailyGoal['status'] = actualPnL >= row.dailyGoalAmount ? 'beat' : 'missed';

    setDailyGoals(prev => {
      const existing = prev.findIndex(g => g.date === date);
      const newGoal: DailyGoal = {
        userId: user?.uid || '',
        date,
        startingBalance: row.startingBalance,
        expectedEndingBalance: row.expectedEndingBalance,
        dailyGoalAmount: row.dailyGoalAmount,
        actualPnL,
        beatGoalBy,
        status,
      };
      if (existing >= 0) {
        return prev.map((g, i) => i === existing ? newGoal : g);
      }
      return [...prev, newGoal];
    });
  };

  return (
    <GoalsContext.Provider value={{
      settings, updateSettings, goalRows, dailyGoals, updateDailyGoal,
      startBalanceOverrides, setStartBalanceOverride,
    }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error('useGoals must be used within a GoalsProvider');
  return context;
}
