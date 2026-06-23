// Central write-path sanitisation. IndexedDB is schemaless, so THIS is the
// app's constraint layer: every value persisted to Dexie passes through here so
// malformed input (NaN, Infinity, negatives, control chars, unbounded strings,
// invalid enums) can never reach storage.

const MAX_AMOUNT = 1_000_000_000;
const TEXT_MAX = 120;
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');
// Strips C0/C1 control chars but preserves tab (09) and newline (0A) for notes.
const MULTILINE_CONTROL = new RegExp('[\\u0000-\\u0008\\u000B-\\u001F\\u007F]', 'g');

export function sanitizeText(value, maxLen = TEXT_MAX) {
  return String(value ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

// Multi-line variant (notes) — keeps newlines, strips other control chars.
export function sanitizeMultiline(value, maxLen = 1000) {
  return String(value ?? '')
    .replace(MULTILINE_CONTROL, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeAmount(value, { allowNegative = false, max = MAX_AMOUNT, allowZero = false } = {}) {
  let n;
  if (typeof value === 'number') n = value;
  else n = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n)) return null;
  if (!allowNegative && n < 0) return null;
  if (!allowZero && n === 0) return null;
  if (Math.abs(n) > max) return null;
  return Math.round(n * 100) / 100;
}

// Bounded integer (sets, reps, etc.).
export function sanitizeInt(value, { min = 0, max = 100000 } = {}) {
  const n = parseInt(String(value ?? '').replace(/[^0-9-]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function sanitizeDate(value) {
  const today = new Date();
  const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!value) return fallback;
  const str = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return fallback;
  const d = new Date(str + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return fallback;
  const year = d.getFullYear();
  if (year < 1970 || year > 2200) return fallback;
  return str;
}

// Optional date — returns null when blank instead of defaulting to today.
export function sanitizeOptionalDate(value) {
  if (!value) return null;
  const str = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(str + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return str;
}

// Enum guard: returns value if in the allowed set, else the fallback.
export function sanitizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function sanitizeCategory(value, fallback = 'Other') {
  return sanitizeText(value, 30) || fallback;
}
