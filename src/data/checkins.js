import { db } from './db';
import { todayISO } from '../lib/dates';

// A check-in is just the ISO date the user opened/used the app. Streak math
// lives in lib/streaks.js so it can be unit-reasoned without the DB.
export async function recordCheckin() {
  const date = todayISO();
  const existing = await db.checkins.get(date);
  if (!existing) {
    await db.checkins.put({ date, at: new Date().toISOString() });
  }
}

export async function allCheckinDates() {
  const rows = await db.checkins.toArray();
  return rows.map((r) => r.date);
}
