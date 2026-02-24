import type { CalculatorState, CalculatorResults } from '../types';
import { isUSFederalHoliday } from './holidays';

export function calculateTrade(state: CalculatorState): CalculatorResults | null {
  const accountBalance = parseFloat(state.accountBalance);
  const entryPrice    = parseFloat(state.entryPrice);
  const slPrice       = parseFloat(state.stopLoss);
  const leverage      = Math.max(1, parseFloat(state.leverage) || 1);
  const manualTP      = state.takeProfit ? parseFloat(state.takeProfit) : NaN;

  if (!accountBalance || !entryPrice || !slPrice) return null;
  if (entryPrice === slPrice) return null;

  // --- Trade size (margin) ---
  let riskPercent: number;
  let tradeSize: number;

  if (state.riskType === 'percent') {
    riskPercent = parseFloat(state.riskValue) || 1;
    tradeSize   = accountBalance * (riskPercent / 100);
  } else {
    tradeSize   = parseFloat(state.riskValue) || 0;
    if (!tradeSize) return null;
    riskPercent = (tradeSize / accountBalance) * 100;
  }

  // --- Effective position (margin × leverage) ---
  const effectivePosition = tradeSize * leverage;

  // --- Price distances ---
  const slDistance = Math.abs(entryPrice - slPrice);

  let takeProfitPrice: number;
  let tpDistance: number;
  let actualRiskReward: string;

  if (!isNaN(manualTP) && manualTP > 0 && manualTP !== entryPrice) {
    // User supplied TP — derive real R:R
    takeProfitPrice  = manualTP;
    tpDistance       = Math.abs(manualTP - entryPrice);
    const rrRatio    = tpDistance / slDistance;
    actualRiskReward = `1:${rrRatio.toFixed(2)}`;
  } else {
    // No TP — compute from selected R:R preset
    const parts          = state.riskReward.split(':');
    const rewardMult     = parts.length === 2 ? parseFloat(parts[1]) / parseFloat(parts[0]) : 3;
    tpDistance           = slDistance * rewardMult;
    takeProfitPrice      = state.direction === 'long'
      ? entryPrice + tpDistance
      : entryPrice - tpDistance;
    actualRiskReward     = state.riskReward;
  }

  // P&L = effectivePosition × (priceMove / entryPrice)
  const potentialProfit = effectivePosition * (tpDistance / entryPrice);
  const potentialLoss   = effectivePosition * (slDistance / entryPrice);

  return {
    tradeSize,
    effectivePosition,
    positionSize: effectivePosition,   // journal compat alias
    potentialProfit,
    potentialLoss,
    riskPercent,
    entryPrice,
    takeProfitPrice,
    stopLossPrice: slPrice,
    actualRiskReward,
    newBalanceIfTP: accountBalance + potentialProfit,
    newBalanceIfSL: accountBalance - potentialLoss,
  };
}

export function calculateTradeResult(
  direction: 'long' | 'short',
  entryPrice: number,
  closePrice: number,
  positionSize: number,   // dollar margin
  leverage: number = 1,
  feePercent: number = 0  // closing fee as % of effective position
) {
  const effectivePosition = positionSize * leverage;
  const priceChangePct = direction === 'long'
    ? (closePrice - entryPrice) / entryPrice
    : (entryPrice - closePrice) / entryPrice;

  const rawPnL            = priceChangePct * effectivePosition;
  const fee               = effectivePosition * (feePercent / 100);
  const profitLoss        = rawPnL - fee;
  const profitLossPercent = positionSize > 0 ? (profitLoss / positionSize) * 100 : 0;
  const winLoss: 'win' | 'loss' = profitLoss >= 0 ? 'win' : 'loss';
  return { profitLoss, profitLossPercent, winLoss, fee };
}

export function compoundBalance(startBalance: number, dailyPercent: number, days: number): number {
  let balance = startBalance;
  for (let i = 0; i < days; i++) {
    balance = balance * (1 + dailyPercent / 100);
  }
  return balance;
}

export interface GoalTableOptions {
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
}

export function generateGoalTable(
  startingBalance: number,
  dailyGoalPercent: number,
  days: number,
  overrides: Record<string, number> = {},
  startDate: Date = new Date(),
  options: GoalTableOptions = {}
) {
  const { excludeWeekends = false, excludeHolidays = false } = options;

  const rows = [];
  let balance = startingBalance;
  let tradingDays = 0;
  let calendarOffset = 0;

  while (tradingDays < days) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + calendarOffset);
    calendarOffset++;

    // Skip weekends when requested (0 = Sun, 6 = Sat)
    if (excludeWeekends) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
    }

    const dateStr = d.toISOString().split('T')[0];

    // Skip US federal holidays when requested
    if (excludeHolidays && isUSFederalHoliday(dateStr)) continue;

    if (overrides[dateStr] !== undefined) {
      balance = overrides[dateStr];
    }

    const dailyGoalAmount    = balance * (dailyGoalPercent / 100);
    const expectedEnd        = balance + dailyGoalAmount;
    rows.push({ day: tradingDays + 1, date: dateStr, startingBalance: balance, dailyGoalAmount, expectedEndingBalance: expectedEnd });
    balance = expectedEnd;
    tradingDays++;
  }
  return rows;
}
