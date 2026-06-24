import { startOfWeek, toISO } from './dates';
import { spendingByCategory } from '../data/money';
import { totalMinutes } from '../data/time';

// Aggregate the current week into a shareable "Weekly Life Recap".
export function buildRecap({ expenses, tasks, sessions, timeEntries }) {
  const weekStart = toISO(startOfWeek());

  const weekExpenses = (expenses || []).filter((e) => (e.date || '') >= weekStart);
  const spent = weekExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const topCategory = spendingByCategory(weekExpenses, 'week')[0]?.category || null;

  const tasksDone = (tasks || []).filter(
    (t) => t.status === 'done' && (t.completedAt || '').slice(0, 10) >= weekStart,
  ).length;

  const workouts = (sessions || []).filter((s) => (s.date || '') >= weekStart).length;

  const timeMinutes = totalMinutes((timeEntries || []).filter((entry) => (entry.date || '') >= weekStart));

  return { weekStart, spent, topCategory, tasksDone, workouts, timeMinutes };
}

// A friendly headline for the recap card.
export function recapHeadline({ tasksDone, workouts }) {
  if (tasksDone >= 5 && workouts >= 3) return 'What a week — you showed up everywhere.';
  if (workouts >= 3) return 'Strong week in the gym.';
  if (tasksDone >= 5) return 'You knocked out a lot this week.';
  return 'Your week at a glance.';
}
