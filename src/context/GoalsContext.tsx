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

  useEffect(() => {
    localStorage.setItem('mwt_goal_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('mwt_daily_goals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  const updateSettings = (s: Partial<GoalSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  const goalRows = generateGoalTable(settings.startingBalance, settings.dailyGoalPercent, settings.horizon);

  const updateDailyGoal = (date: string, actualPnL: number) => {
    const row = goalRows.find((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (settings.horizon - 1) + i);
      return d.toISOString().split('T')[0] === date;
    });
    
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
    <GoalsContext.Provider value={{ settings, updateSettings, goalRows, dailyGoals, updateDailyGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error('useGoals must be used within a GoalsProvider');
  return context;
}
