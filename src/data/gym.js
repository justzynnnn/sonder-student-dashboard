import { db } from './db';
import { generateId } from '../lib/ids';
import { recordCheckin } from './checkins';
import { sanitizeText, sanitizeInt, sanitizeAmount } from '../lib/sanitize';
import { todayISO, weekDates } from '../lib/dates';

// ---------- Exercise library (free-form, user-defined) ----------
export async function addExercise(name) {
  const clean = sanitizeText(name, 40);
  if (!clean) return null;
  await db.exercises.put({ name: clean, createdAt: new Date().toISOString() });
  return clean;
}

export async function deleteExercise(name) {
  await db.exercises.delete(name);
}

// ---------- Custom workout plans ----------
// plan.exercises: [{ name, sets, reps, weight }] — defaults the user can tweak live.
export async function addPlan({ name, exercises }) {
  const clean = sanitizeText(name, 50);
  if (!clean) throw new Error('Name your workout');
  const plan = {
    id: generateId(),
    name: clean,
    exercises: (exercises || []).map((e) => ({
      name: sanitizeText(e.name, 40),
      sets: sanitizeInt(e.sets, { min: 1, max: 20 }) ?? 3,
      reps: sanitizeInt(e.reps, { min: 1, max: 100 }) ?? 10,
      weight: sanitizeAmount(e.weight, { allowZero: true }) ?? 0,
    })).filter((e) => e.name),
    createdAt: new Date().toISOString(),
  };
  await db.plans.add(plan);
  // remember any new exercises in the library
  await Promise.all(plan.exercises.map((e) => addExercise(e.name)));
  return plan;
}

export async function deletePlan(id) {
  await db.plans.delete(id);
}

// ---------- Sessions (a logged workout) ----------
// session.exercises: [{ name, sets: [{ reps, weight, done }] }]
export function buildSessionFromPlan(plan) {
  return {
    planId: plan?.id || null,
    name: plan?.name || 'Quick workout',
    exercises: (plan?.exercises || []).map((e) => ({
      name: e.name,
      sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: e.weight, done: false })),
    })),
  };
}

export async function saveSession(session) {
  const clean = {
    id: session.id || generateId(),
    planId: session.planId || null,
    name: sanitizeText(session.name, 50) || 'Workout',
    date: todayISO(),
    completedAt: new Date().toISOString(),
    exercises: (session.exercises || []).map((ex) => ({
      name: sanitizeText(ex.name, 40),
      sets: (ex.sets || []).map((s) => ({
        reps: sanitizeInt(s.reps, { min: 0, max: 100 }) ?? 0,
        weight: sanitizeAmount(s.weight, { allowZero: true }) ?? 0,
        done: !!s.done,
      })),
    })),
  };
  await db.sessions.put(clean);
  recordCheckin(); // logging a workout earns today's check-in
  return clean;
}

export async function deleteSession(id) {
  await db.sessions.delete(id);
}

// ---------- Derived stats ----------
// 7 booleans Mon..Sun: did a workout happen that day this week?
export function weekConsistency(sessions) {
  const week = weekDates();
  const set = new Set((sessions || []).map((s) => s.date));
  return week.map((d) => ({ date: d, done: set.has(d) }));
}

export function workoutsThisWeek(sessions) {
  return weekConsistency(sessions).filter((d) => d.done).length;
}

// Personal record = heaviest completed set per exercise across all sessions.
export function personalRecords(sessions) {
  const prs = new Map();
  for (const s of sessions || []) {
    for (const ex of s.exercises || []) {
      for (const set of ex.sets || []) {
        if (set.done && set.weight > (prs.get(ex.name)?.weight || 0)) {
          prs.set(ex.name, { weight: set.weight, reps: set.reps, date: s.date });
        }
      }
    }
  }
  return [...prs.entries()].map(([name, pr]) => ({ name, ...pr }));
}
