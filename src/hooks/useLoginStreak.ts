import { useMemo, useEffect } from 'react';

const KEY = 'mwt_login_dates';

/** Local-time date string — avoids UTC timezone drift */
function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC) */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight
}

function recordToday(): void {
  const today = localDateStr();
  const stored = localStorage.getItem(KEY);
  const dates: string[] = stored ? JSON.parse(stored) : [];
  if (!dates.includes(today)) {
    dates.push(today);
    dates.sort();
    localStorage.setItem(KEY, JSON.stringify(dates));
  }
}

export interface LoginStreak {
  activeDays: number;
  denominator: number;
  percent: number;
  color: 'green' | 'yellow' | 'red';
}

export function useLoginStreak(): LoginStreak {
  // Record synchronously so the memo below always sees today
  const today = localDateStr();
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(KEY);
    const dates: string[] = stored ? JSON.parse(stored) : [];
    if (!dates.includes(today)) {
      dates.push(today);
      dates.sort();
      localStorage.setItem(KEY, JSON.stringify(dates));
    }
  }

  // Keep recording in an effect for any subsequent visits within the same session
  useEffect(() => { recordToday(); }, []);

  return useMemo(() => {
    const stored = localStorage.getItem(KEY);
    const dates: string[] = stored ? JSON.parse(stored) : [today];

    const todayLocal   = parseLocalDate(today).getTime();      // local midnight ms
    const firstLocal   = parseLocalDate(dates[0]).getTime();   // local midnight ms
    const daysSinceFirst = Math.round((todayLocal - firstLocal) / 86_400_000) + 1; // inclusive
    const denominator    = Math.min(daysSinceFirst, 7);

    // Build window of the last `denominator` LOCAL days up to and including today
    const windowSet = new Set<string>();
    for (let i = 0; i < denominator; i++) {
      const d = new Date(todayLocal - i * 86_400_000); // subtract whole days in ms
      windowSet.add(localDateStr(d));
    }

    const activeDays = dates.filter(d => windowSet.has(d)).length;
    const percent    = denominator > 0 ? (activeDays / denominator) * 100 : 100;
    const color: LoginStreak['color'] =
      percent >= 80 ? 'green' : percent > 50 ? 'yellow' : 'red';

    return { activeDays, denominator, percent, color };
  }, [today]);
}
