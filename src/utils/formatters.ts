export function formatCurrency(value: number, decimals = 2): string {
  if (!isFinite(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Category-aware price formatter: 4dp for forex (pip precision), 2dp for everything else. */
export function formatPrice(value: number, category?: string): string {
  if (!isFinite(value)) return '$0.00';
  const decimals = category === 'forex' ? 4 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return '0.00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 4): string {
  if (!isFinite(value)) return '0';
  return value.toFixed(decimals);
}

/** Format a raw number string with thousand-comma separators while preserving decimals. */
export function displayNum(raw: string): string {
  if (!raw) return raw;
  const stripped = raw.replace(/,/g, '');
  const [int, dec] = stripped.split('.');
  const formatted = (int || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

/**
 * Normalise numeric keyboard input across locales:
 * - Trailing comma (European decimal key) → convert to period
 * - Otherwise → strip all commas (they are display thousands-separators injected by displayNum)
 */
export function normalizeInput(v: string): string {
  if (v.endsWith(',')) return v.slice(0, -1).replace(/,/g, '') + '.';
  return v.replace(/,/g, '');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
