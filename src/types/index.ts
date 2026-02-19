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
  assetCategory: 'crypto' | 'stocks' | 'commodities' | 'forex';
  timeframe: '1hr' | '4hr' | 'daily' | 'weekly';
  leverage: number;
  cause: string;
  closePrice?: number;
  closedAt?: string; // ISO date string (YYYY-MM-DD) set when trade is closed
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

export type CurrencyCode = 'USD' | 'BTC' | 'EUR' | 'GBP';

export interface CalculatorState {
  assetName: string;
  currency: CurrencyCode;
  accountBalance: string;
  riskType: 'percent' | 'dollar';
  riskValue: string;          // trade size / amount risked
  leverage: string;           // stored as string for button binding
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  direction: 'long' | 'short';
  riskReward: string;
  timeframe: string;          // e.g. '15M', '1H', '4H', '1D', '1W'
}

export interface CalculatorResults {
  tradeSize: number;          // dollar margin the user is putting up
  effectivePosition: number;  // tradeSize × leverage (actual market exposure)
  positionSize: number;       // alias of effectivePosition (kept for journal compat)
  potentialProfit: number;
  potentialLoss: number;
  riskPercent: number;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  actualRiskReward: string;
  newBalanceIfTP: number;
  newBalanceIfSL: number;
}
