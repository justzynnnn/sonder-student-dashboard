import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeEnum } from '../lib/sanitize';
import { todayISO, toISO, fromISO } from '../lib/dates';
import { addTask } from './tasks';
import { addExpense, addIncome } from './money';

export const RECUR_KINDS = ['task', 'expense', 'income'];
export const CADENCES = ['daily', 'weekly', 'monthly'];

export const CADENCE_LABELS = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
};

// Advance an ISO date by one cadence step (monthly clamps to month length).
export function advanceDate(iso, cadence) {
  const d = fromISO(iso);
  if (!d) return iso;
  if (cadence === 'daily') d.setDate(d.getDate() + 1);
  else if (cadence === 'weekly') d.setDate(d.getDate() + 7);
  else if (cadence === 'monthly') {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
  }
  return toISO(d);
}

// Create a repeating template and immediately materialise anything already due
// (so the first occurrence appears the moment the user saves it).
export async function addRecurrence({ kind, cadence, template, startDate }) {
  const cleanKind = sanitizeEnum(kind, RECUR_KINDS, 'task');
  const cleanCadence = sanitizeEnum(cadence, CADENCES, 'weekly');
  const record = {
    id: generateId(),
    kind: cleanKind,
    cadence: cleanCadence,
    template: template || {},
    nextDate: startDate || todayISO(),
    lastDate: null,
    active: 1,
    createdAt: new Date().toISOString(),
  };
  await db.recurrences.add(record);
  await materializeRecurrences();
  return record;
}

export async function deleteRecurrence(id) {
  await db.recurrences.delete(id);
}

// Build the concrete item for one occurrence on `date`.
async function emit(rec, date) {
  const t = rec.template || {};
  if (rec.kind === 'task') {
    return addTask({ title: t.title, priority: t.priority, category: t.category, dueDate: date });
  }
  if (rec.kind === 'expense') {
    // activity:false — an auto-posted recurring item is not effort the user did today.
    return addExpense({ amount: t.amount, category: t.category, description: t.description, date, accountId: t.accountId || null }, { activity: false });
  }
  if (rec.kind === 'income') {
    return addIncome({ amount: t.amount, source: t.source, date, accountId: t.accountId || null }, { activity: false });
  }
  return null;
}

// Catch up every active template to today. Idempotent across app opens because
// nextDate is persisted after each emission.
export async function materializeRecurrences() {
  const today = todayISO();
  const active = await db.recurrences.filter((r) => r.active && (r.nextDate || '') <= today).toArray();
  for (const rec of active) {
    let cursor = rec.nextDate;
    let guard = 0;
    while (cursor && cursor <= today && guard < 400) {
      // eslint-disable-next-line no-await-in-loop
      await emit(rec, cursor);
      rec.lastDate = cursor;
      cursor = advanceDate(cursor, rec.cadence);
      guard += 1;
    }
    rec.nextDate = cursor;
    // eslint-disable-next-line no-await-in-loop
    await db.recurrences.update(rec.id, { nextDate: rec.nextDate, lastDate: rec.lastDate });
  }
}

export function recurrencesOfKind(recurrences, kind) {
  return (recurrences || []).filter((r) => r.active && r.kind === kind);
}
