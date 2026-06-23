// Date helpers shared across domains. All ISO dates are YYYY-MM-DD (local).
const DAY_MS = 86_400_000;

export function todayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return toISO(x);
}

export function toISO(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(value) {
  if (!value) return null;
  const d = new Date(String(value).length <= 10 ? value + 'T00:00:00' : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Monday-start week. Returns Date at 00:00 of the week's Monday.
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

export function endOfWeek(date = new Date()) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return e;
}

// Days remaining in the current week, including today (1..7).
export function daysLeftInWeek(date = new Date()) {
  const day = (new Date(date).getDay() + 6) % 7; // 0..6, Mon..Sun
  return 7 - day;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysLeftInMonth(date = new Date()) {
  const d = new Date(date);
  const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return total - d.getDate() + 1;
}

export function monthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function diffDays(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return Math.round((da - db) / DAY_MS);
}

// The 7 ISO dates of the current week (Mon..Sun) — used by streak/consistency dots.
export function weekDates(date = new Date()) {
  const s = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    return toISO(d);
  });
}

// Reader-friendly relative label.
export function humanDate(value) {
  const d = fromISO(value);
  if (!d) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const dd = Math.round((today - target) / DAY_MS);
  if (dd === 0) return 'Today';
  if (dd === 1) return 'Yesterday';
  if (dd === -1) return 'Tomorrow';
  if (dd > 1 && dd < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  if (dd < -1 && dd > -7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  if (d.getFullYear() === today.getFullYear())
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
