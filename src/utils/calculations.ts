import type { CalculatorState, CalculatorResults } from '../types';

export function calculateTrade(state: CalculatorState): CalculatorResults | null {
  const accountBalance = parseFloat(state.accountBalance);
  const entryPrice = parseFloat(state.entryPrice);
  const stopLossPrice = parseFloat(state.stopLoss);
  const riskValue = parseFloat(state.riskValue);
  const manualTP = state.takeProfit ? parseFloat(state.takeProfit) : NaN;

  if (!accountBalance || !entryPrice || !stopLossPrice || !riskValue) return null;
  if (entryPrice === stopLossPrice) return null;

  const riskDistance = Math.abs(entryPrice - stopLossPrice);

  let riskPercent: number;
  let riskDollar: number;

  if (state.riskType === 'percent') {
    riskPercent = riskValue;
    riskDollar = accountBalance * (riskValue / 100);
  } else {
    riskDollar = riskValue;
    riskPercent = (riskValue / accountBalance) * 100;
  }

  const positionSize = riskDollar / riskDistance;
  const potentialLoss = positionSize * riskDistance;

  let takeProfitPrice: number;
  let rewardDistance: number;
  let actualRiskReward: string;

  if (!isNaN(manualTP) && manualTP > 0) {
    // User provided TP — calculate actual R:R from it
    takeProfitPrice = manualTP;
    rewardDistance = Math.abs(manualTP - entryPrice);
    const rrRatio = rewardDistance / riskDistance;
    actualRiskReward = `1:${rrRatio.toFixed(1)}`;
  } else {
    // No TP — derive from selected R:R preset
    const rrParts = state.riskReward.split(':');
    const rewardMultiplier = rrParts.length === 2 ? parseFloat(rrParts[1]) / parseFloat(rrParts[0]) : 3;
    rewardDistance = riskDistance * rewardMultiplier;
    takeProfitPrice = state.direction === 'long'
      ? entryPrice + rewardDistance
      : entryPrice - rewardDistance;
    actualRiskReward = state.riskReward;
  }

  const potentialProfit = positionSize * rewardDistance;

  return {
    positionSize,
    potentialLoss,
    potentialProfit,
    riskPercent,
    takeProfitPrice,
    actualRiskReward,
  };
}

export function calculateTradeResult(
  direction: 'long' | 'short',
  entryPrice: number,
  closePrice: number,
  positionSize: number,
  leverage: number = 1
) {
  // positionSize = dollar margin; leverage amplifies the effective position
  const priceChangePct = direction === 'long'
    ? (closePrice - entryPrice) / entryPrice
    : (entryPrice - closePrice) / entryPrice;

  const profitLoss = priceChangePct * positionSize * leverage;
  const profitLossPercent = priceChangePct * leverage * 100;
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
  days: number,
  overrides: Record<string, number> = {},
  startDate: Date = new Date()
) {
  const rows = [];
  let balance = startingBalance;
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Apply balance override for this date if set
    if (overrides[dateStr] !== undefined) {
      balance = overrides[dateStr];
    }

    const dailyGoalAmount = balance * (dailyGoalPercent / 100);
    const expectedEnd = balance + dailyGoalAmount;
    rows.push({
      day: i + 1,
      date: dateStr,
      startingBalance: balance,
      dailyGoalAmount,
      expectedEndingBalance: expectedEnd,
    });
    balance = expectedEnd;
  }
  return rows;
}
