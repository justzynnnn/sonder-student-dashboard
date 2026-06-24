import { db } from './db';
import { generateId } from '../lib/ids';
import { recordCheckin } from './checkins';
import { sanitizeText } from '../lib/sanitize';
import { todayISO, toISO, weekDates } from '../lib/dates';

// Habits are the day-to-day engine behind a goal. A goal holds the "why";
// its habits are the repeatable actions. `days` is the set of weekday indexes
// (0=Mon..6=Sun) the habit is meant for; empty/all = every day.
export async function addHabit({ goalId, title, days }) {
  const clean = sanitizeText(title, 60);
  if (!clean) throw new Error('Name the habit');
  const habit = {
    id: generateId(),
    goalId: goalId || null,
    title: clean,
    days: Array.isArray(days) && days.length ? days.filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
    archived: 0,
    createdAt: new Date().toISOString(),
  };
  await db.habits.add(habit);
  return habit;
}

export async function updateHabit(id, patch) {
  const clean = {};
  if (patch.title !== undefined) {
    const t = sanitizeText(patch.title, 60);
    if (t) clean.title = t;
  }
  if (patch.days !== undefined) {
    clean.days = Array.isArray(patch.days) && patch.days.length ? patch.days.filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6];
  }
  await db.habits.update(id, clean);
}

export async function deleteHabit(id) {
  await db.transaction('rw', db.habits, db.habitCheckins, async () => {
    await db.habits.delete(id);
    const logs = await db.habitCheckins.where('habitId').equals(id).toArray();
    await Promise.all(logs.map((l) => db.habitCheckins.delete([l.habitId, l.date])));
  });
}

// Toggle today's (or a given day's) completion. Returns the new done state.
export async function toggleHabit(habitId, date = todayISO()) {
  const key = [habitId, date];
  const existing = await db.habitCheckins.get(key);
  if (existing) {
    await db.habitCheckins.delete(key);
    return false;
  }
  await db.habitCheckins.put({ habitId, date, at: new Date().toISOString() });
  if (date === todayISO()) recordCheckin(); // checking a habit earns today's check-in
  return true;
}

const weekdayIndex = (iso) => ((new Date(iso + 'T00:00:00').getDay() + 6) % 7);

export function habitDueToday(habit, date = todayISO()) {
  const days = habit.days || [0, 1, 2, 3, 4, 5, 6];
  return days.includes(weekdayIndex(date));
}

// Habits scheduled for `date`, each tagged with whether it's checked off.
export function habitsForDay(habits, checkins, date = todayISO()) {
  const done = new Set((checkins || []).filter((c) => c.date === date).map((c) => c.habitId));
  return (habits || [])
    .filter((h) => !h.archived && habitDueToday(h, date))
    .map((h) => ({ ...h, done: done.has(h.id) }));
}

export function habitsForGoal(habits, goalId) {
  return (habits || []).filter((h) => !h.archived && h.goalId === goalId);
}

// This-week completion ratio for one habit (done days / scheduled days so far).
export function habitWeekProgress(habit, checkins) {
  const today = todayISO();
  const week = weekDates().filter((d) => d <= today);
  const scheduled = week.filter((d) => habitDueToday(habit, d));
  if (scheduled.length === 0) return 1;
  const done = new Set((checkins || []).filter((c) => c.habitId === habit.id).map((c) => c.date));
  return scheduled.filter((d) => done.has(d)).length / scheduled.length;
}

// Current daily streak for a habit: consecutive due-days completed, ending today
// (or yesterday — today being unchecked yet doesn't break it).
export function habitStreak(habit, checkins) {
  const done = new Set((checkins || []).filter((c) => c.habitId === habit.id).map((c) => c.date));
  const today = todayISO();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let guard = 0; guard < 400; guard += 1) {
    const iso = toISO(cursor);
    if (habitDueToday(habit, iso)) {
      if (done.has(iso)) streak += 1;
      else if (iso !== today) break; // a missed past due-day ends the streak
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Did the user check off any habit today? Powers the "earned" daily check-in.
export function anyHabitDoneToday(checkins) {
  return (checkins || []).some((c) => c.date === todayISO());
}
