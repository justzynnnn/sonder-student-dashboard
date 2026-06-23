// Multi-currency money formatting. Replaces the old peso-locked formatter.
// A single app-wide base currency lives in settings; FX is out of scope (MVP).

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export const DEFAULT_CURRENCY = 'USD';

const ZERO_DECIMAL = new Set(['JPY', 'IDR']);

export function currencySymbol(code = DEFAULT_CURRENCY) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || '$';
}

// Format a number as currency. `sign:true` forces a leading +/-.
export function formatMoney(value, code = DEFAULT_CURRENCY, { sign = false, compact = false } = {}) {
  const n = Number.isFinite(value) ? value : 0;
  const fractionDigits = ZERO_DECIMAL.has(code) ? 0 : 2;
  try {
    const fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: compact ? 0 : fractionDigits,
      maximumFractionDigits: fractionDigits,
      notation: compact ? 'compact' : 'standard',
      signDisplay: sign ? 'always' : 'auto',
    });
    return fmt.format(n);
  } catch {
    // Unknown ISO code — fall back to a plain symbol prefix.
    const sym = currencySymbol(code);
    const prefix = sign && n >= 0 ? '+' : n < 0 ? '-' : '';
    return `${prefix}${sym}${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  }
}
