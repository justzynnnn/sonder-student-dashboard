import { db } from './db';
import { generateId } from '../lib/ids';
import {
  sanitizeText, sanitizeMultiline, sanitizeAmount, sanitizeEnum, sanitizeOptionalDate,
} from '../lib/sanitize';
import { LIFE_CATEGORIES } from './categories';

const LIFE_IDS = LIFE_CATEGORIES.map((c) => c.id);

// A goal tracks progress either numerically (current/target) or by milestones.
export async function addGoal({ title, lifeCategory, target, unit, deadline, notes }) {
  const clean = sanitizeText(title, 80);
  if (!clean) throw new Error('Name your goal');
  const goal = {
    id: generateId(),
    title: clean,
    lifeCategory: sanitizeEnum(lifeCategory, LIFE_IDS, 'growth'),
    target: sanitizeAmount(target, { allowZero: true }) ?? 0, // 0 = milestone-only goal
    current: 0,
    unit: sanitizeText(unit, 16),
    deadline: sanitizeOptionalDate(deadline),
    notes: sanitizeMultiline(notes, 300),
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  await db.goals.add(goal);
  return goal;
}

export async function updateGoalProgress(id, current) {
  const g = await db.goals.get(id);
  if (!g) return;
  const val = Math.max(0, sanitizeAmount(current, { allowZero: true }) ?? 0);
  const done = g.target > 0 && val >= g.target;
  await db.goals.update(id, { current: val, completedAt: done ? (g.completedAt || new Date().toISOString()) : null });
}

export async function deleteGoal(id) {
  await db.transaction('rw', db.goals, db.milestones, async () => {
    await db.goals.delete(id);
    const ms = await db.milestones.where('goalId').equals(id).toArray();
    await Promise.all(ms.map((m) => db.milestones.delete(m.id)));
  });
}

// ---------- Milestones ----------
export async function addMilestone(goalId, title) {
  const clean = sanitizeText(title, 80);
  if (!clean) return null;
  const m = { id: generateId(), goalId, title: clean, done: 0, createdAt: new Date().toISOString() };
  await db.milestones.add(m);
  return m;
}

export async function toggleMilestone(id) {
  const m = await db.milestones.get(id);
  if (!m) return;
  await db.milestones.update(id, { done: m.done ? 0 : 1 });
}

export async function deleteMilestone(id) {
  await db.milestones.delete(id);
}

// ---------- Progress (0..1) ----------
export function goalProgress(goal, milestones) {
  if (goal.target > 0) return Math.min(1, (goal.current || 0) / goal.target);
  const mine = (milestones || []).filter((m) => m.goalId === goal.id);
  if (mine.length === 0) return 0;
  return mine.filter((m) => m.done).length / mine.length;
}

export function overallGoalProgress(goals, milestones) {
  if (!goals || goals.length === 0) return 0;
  const sum = goals.reduce((acc, g) => acc + goalProgress(g, milestones), 0);
  return sum / goals.length;
}
