/** US Federal Holiday calculator.
 *
 * Returns the *observed* date for each holiday — i.e. if it falls on a Saturday
 * it is observed the preceding Friday, and if it falls on a Sunday it is observed
 * the following Monday (the standard US government rule).
 */

type ISODate = string; // YYYY-MM-DD

function fmt(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shift a fixed-date holiday to its observed weekday if it falls on a weekend. */
function observed(year: number, month: number, day: number): ISODate {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() - 1); // Sat → Fri
  if (dow === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  return fmt(d);
}

/** Nth occurrence of a weekday (0=Sun … 6=Sat) in a given month. */
function nthWeekday(year: number, month: number, weekday: number, n: number): ISODate {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (count < n) {
    if (d.getDay() === weekday) count++;
    if (count < n) d.setDate(d.getDate() + 1);
  }
  return fmt(d);
}

/** Last occurrence of a weekday in a given month. */
function lastWeekday(year: number, month: number, weekday: number): ISODate {
  // Start from the last day and walk backward.
  const d = new Date(year, month, 0); // day 0 of next month = last day of this month
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
  return fmt(d);
}

/**
 * Returns all US federal holidays for the given year as an array of
 * YYYY-MM-DD strings (observed dates, sorted ascending).
 */
export function getUSFederalHolidays(year: number): ISODate[] {
  const holidays: ISODate[] = [
    observed(year, 1, 1),              // New Year's Day — Jan 1
    nthWeekday(year, 1, 1, 3),         // MLK Day — 3rd Monday in January
    nthWeekday(year, 2, 1, 3),         // Presidents' Day — 3rd Monday in February
    lastWeekday(year, 5, 1),           // Memorial Day — last Monday in May
    observed(year, 6, 19),             // Juneteenth — Jun 19
    observed(year, 7, 4),              // Independence Day — Jul 4
    nthWeekday(year, 9, 1, 1),         // Labor Day — 1st Monday in September
    nthWeekday(year, 10, 1, 2),        // Columbus Day — 2nd Monday in October
    observed(year, 11, 11),            // Veterans Day — Nov 11
    nthWeekday(year, 11, 4, 4),        // Thanksgiving — 4th Thursday in November
    observed(year, 12, 25),            // Christmas Day — Dec 25
  ];

  // Inauguration Day (Jan 20, every 4 years starting 2017: 2017, 2021, 2025 …)
  if ((year - 2017) % 4 === 0) {
    holidays.push(observed(year, 1, 20));
  }

  // Deduplicate (e.g. Inauguration Day could coincide with MLK Day) and sort.
  return [...new Set(holidays)].sort();
}

// Simple year-keyed cache so repeated calls within a session are free.
const _cache = new Map<number, Set<ISODate>>();

/** Returns true if the given YYYY-MM-DD string is a US federal holiday. */
export function isUSFederalHoliday(dateStr: ISODate): boolean {
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (!_cache.has(year)) {
    _cache.set(year, new Set(getUSFederalHolidays(year)));
  }
  return _cache.get(year)!.has(dateStr);
}
