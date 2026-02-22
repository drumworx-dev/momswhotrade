import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

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
  return new Date(y, m - 1, d);
}

export interface LoginStreak {
  activeDays: number;
  denominator: number;
  percent: number;
  color: 'green' | 'yellow' | 'red';
}

/**
 * Derives the login-streak from the user's Firestore loginDates array.
 * Data is per-user and syncs across all browsers, devices, and the PWA.
 */
export function useLoginStreak(): LoginStreak {
  const { user } = useAuth();
  const today = localDateStr();

  return useMemo(() => {
    const dates: string[] = user?.loginDates ?? [today];

    const todayLocal     = parseLocalDate(today).getTime();
    const firstLocal     = parseLocalDate(dates[0]).getTime();
    const daysSinceFirst = Math.round((todayLocal - firstLocal) / 86_400_000) + 1;
    const denominator    = Math.min(daysSinceFirst, 7);

    // Build a set of the last `denominator` local days up to and including today
    const windowSet = new Set<string>();
    for (let i = 0; i < denominator; i++) {
      const d = new Date(todayLocal - i * 86_400_000);
      windowSet.add(localDateStr(d));
    }

    const activeDays = dates.filter(d => windowSet.has(d)).length;
    const percent    = denominator > 0 ? (activeDays / denominator) * 100 : 100;
    const color: LoginStreak['color'] =
      percent >= 80 ? 'green' : percent > 50 ? 'yellow' : 'red';

    return { activeDays, denominator, percent, color };
  }, [user?.loginDates, today]);
}
