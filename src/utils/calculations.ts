import type { CalculatorState, CalculatorResults } from '../types';

export function calculateTrade(state: CalculatorState): CalculatorResults | null {
  const accountBalance = parseFloat(state.accountBalance);
  const entryPrice = parseFloat(state.entryPrice);
  const stopLossPrice = parseFloat(state.stopLoss);
  const riskValue = parseFloat(state.riskValue);

  if (!accountBalance || !entryPrice || !stopLossPrice || !riskValue) return null;
  if (entryPrice === stopLossPrice) return null;

  const priceDiff = Math.abs(entryPrice - stopLossPrice);

  let riskPercent: number;
  let riskDollar: number;

  if (state.riskType === 'percent') {
    riskPercent = riskValue;
    riskDollar = accountBalance * (riskValue / 100);
  } else {
    riskDollar = riskValue;
    riskPercent = (riskValue / accountBalance) * 100;
  }

  const positionSize = riskDollar / priceDiff;

  const rrParts = state.riskReward.split(':');
  const rewardMultiplier = rrParts.length === 2 ? parseFloat(rrParts[1]) / parseFloat(rrParts[0]) : 2;

  const potentialLoss = positionSize * priceDiff;
  const potentialProfit = potentialLoss * rewardMultiplier;

  let takeProfitPrice: number;
  if (state.direction === 'long') {
    takeProfitPrice = entryPrice + priceDiff * rewardMultiplier;
  } else {
    takeProfitPrice = entryPrice - priceDiff * rewardMultiplier;
  }

  return {
    positionSize,
    potentialLoss,
    potentialProfit,
    riskPercent,
    takeProfitPrice,
  };
}

export function calculateTradeResult(
  direction: 'long' | 'short',
  entryPrice: number,
  closePrice: number,
  positionSize: number
) {
  let profitLoss: number;
  if (direction === 'long') {
    profitLoss = (closePrice - entryPrice) * positionSize;
  } else {
    profitLoss = (entryPrice - closePrice) * positionSize;
  }
  const profitLossPercent = (profitLoss / (entryPrice * positionSize)) * 100;
  const winLoss: 'win' | 'loss' = profitLoss >= 0 ? 'win' : 'loss';
  return { profitLoss, profitLossPercent, winLoss };
}

export function compoundBalance(startBalance: number, dailyPercent: number, days: number): number {
  let balance = startBalance;
  for (let i = 0; i < days; i++) {
    balance = balance * (1 + dailyPercent / 100);
  }
  return balance;
}

export function generateGoalTable(
  startingBalance: number,
  dailyGoalPercent: number,
  days: number
) {
  const rows = [];
  let balance = startingBalance;
  for (let i = 0; i < days; i++) {
    const dailyGoalAmount = balance * (dailyGoalPercent / 100);
    const expectedEnd = balance + dailyGoalAmount;
    rows.push({
      day: i + 1,
      startingBalance: balance,
      dailyGoalAmount,
      expectedEndingBalance: expectedEnd,
    });
    balance = expectedEnd;
  }
  return rows;
}
