import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'facebook';
  experience: 'beginner' | 'intermediate' | 'advanced';
  monthlyGoal: number;
  dailyProfitGoalPercent: number;
  marketingConsent: boolean;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface Trade {
  id: string;
  userId: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: 'long' | 'short';
  riskReward: string;
  positionSize: number;
  valueTraded: number;
  token: string;
  timeframe: '1hr' | '4hr' | 'daily' | 'weekly';
  leverage: 1 | 2 | 5 | 10;
  cause: string;
  closePrice?: number;
  status: 'planned' | 'open' | 'closed' | 'tp_reached' | 'sl_hit';
  profitLoss?: number;
  profitLossPercent?: number;
  winLoss?: 'win' | 'loss';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyGoal {
  userId: string;
  date: string;
  startingBalance: number;
  expectedEndingBalance: number;
  dailyGoalAmount: number;
  actualPnL?: number;
  beatGoalBy?: number;
  status: 'pending' | 'beat' | 'missed';
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  feature_image: string;
  tag: string;
  reading_time: number;
  author: string;
  published_at: string;
  slug: string;
}

export interface CalculatorState {
  accountBalance: string;
  riskType: 'percent' | 'dollar';
  riskValue: string;
  entryPrice: string;
  stopLoss: string;
  direction: 'long' | 'short';
  riskReward: string;
}

export interface CalculatorResults {
  positionSize: number;
  potentialLoss: number;
  potentialProfit: number;
  riskPercent: number;
  takeProfitPrice: number;
}
