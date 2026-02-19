import { useMemo, useEffect } from 'react';

const KEY = 'mwt_login_dates';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function recordToday(): string[] {
  const today = todayISO();
  const stored = localStorage.getItem(KEY);
  const dates: string[] = stored ? JSON.parse(stored) : [];
  if (!dates.includes(today)) {
    dates.push(today);
    dates.sort(); // keep in ascending order
    localStorage.setItem(KEY, JSON.stringify(dates));
  }
  return dates;
}

export interface LoginStreak {
  activeDays: number;
  denominator: number;
  percent: number;
  color: 'green' | 'yellow' | 'red';
}

export function useLoginStreak(): LoginStreak {
  const today = todayISO();

  // Record today's visit on mount
  useEffect(() => {
    recordToday();
  }, []);

  return useMemo(() => {
    const stored = localStorage.getItem(KEY);
    const allDates: string[] = stored ? JSON.parse(stored) : [];

    // Ensure today is included for calculation even before the effect runs
    const dates = allDates.includes(today)
      ? allDates
      : [...allDates, today].sort();

    if (dates.length === 0) {
      return { activeDays: 1, denominator: 1, percent: 100, color: 'green' };
    }

    const todayMs   = new Date(today + 'T00:00:00').getTime();
    const firstMs   = new Date(dates[0] + 'T00:00:00').getTime();
    const daysSinceFirst = Math.floor((todayMs - firstMs) / 86_400_000) + 1; // inclusive
    const denominator    = Math.min(daysSinceFirst, 7);

    // Build the set of dates within the window (last `denominator` days up to and including today)
    const windowSet = new Set<string>();
    for (let i = 0; i < denominator; i++) {
      const d = new Date(todayMs - i * 86_400_000);
      windowSet.add(d.toISOString().split('T')[0]);
    }

    const activeDays = dates.filter(d => windowSet.has(d)).length;
    const percent    = (activeDays / denominator) * 100;
    const color: LoginStreak['color'] =
      percent >= 80 ? 'green' : percent > 50 ? 'yellow' : 'red';

    return { activeDays, denominator, percent, color };
  }, [today]);
}
