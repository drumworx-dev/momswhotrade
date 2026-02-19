import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DailyGoal } from '../types';
import { generateGoalTable } from '../utils/calculations';
import { useAuth } from './AuthContext';

interface GoalSettings {
  startingBalance: number;
  dailyGoalPercent: number;
  horizon: 30 | 60 | 90;
  projectionStartDate: string; // ISO date string (YYYY-MM-DD) — set once when user first saves
}

interface GoalsContextType {
  settings: GoalSettings;
  updateSettings: (s: Partial<GoalSettings>) => void;
  goalRows: ReturnType<typeof generateGoalTable>;
  dailyGoals: DailyGoal[];
  updateDailyGoal: (date: string, actualPnL: number) => void;
  startBalanceOverrides: Record<string, number>;
  setStartBalanceOverride: (date: string, balance: number) => void;
  clearProjection: () => void;
  projectionEndDate: Date | null;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const todayISO = () => new Date().toISOString().split('T')[0];

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GoalSettings>(() => {
    const stored = localStorage.getItem('mwt_goal_settings');
    const defaults = { startingBalance: 1000, dailyGoalPercent: 1, horizon: 30 as const, projectionStartDate: '' };
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
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
    setSettings(prev => {
      // Lock in the start date the very first time the user saves their projection
      const startDate = prev.projectionStartDate || s.projectionStartDate || todayISO();
      return { ...prev, ...s, projectionStartDate: startDate };
    });
  };

  const setStartBalanceOverride = (date: string, balance: number) => {
    setStartBalanceOverrides(prev => ({ ...prev, [date]: balance }));
  };

  // Reset everything so the user can start a new projection from today
  const clearProjection = () => {
    setSettings(prev => ({ ...prev, projectionStartDate: '' }));
    setDailyGoals([]);
    setStartBalanceOverrides({});
    localStorage.removeItem('mwt_daily_goals');
    localStorage.removeItem('mwt_balance_overrides');
  };

  // Generate rows from projectionStartDate (or today if not yet set)
  const startDateStr = settings.projectionStartDate || todayISO();
  const startDate = new Date(startDateStr + 'T00:00:00');
  const goalRows = generateGoalTable(
    settings.startingBalance,
    settings.dailyGoalPercent,
    settings.horizon,
    startBalanceOverrides,
    startDate
  );

  // Compute the end date for display ("by May 18th")
  const projectionEndDate = goalRows.length > 0
    ? new Date(goalRows[goalRows.length - 1].date + 'T00:00:00')
    : null;

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
      startBalanceOverrides, setStartBalanceOverride, clearProjection, projectionEndDate,
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
