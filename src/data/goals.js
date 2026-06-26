import { db } from './db';
import { generateId } from '../lib/ids';
import { recordCheckin } from './checkins';
import {
  sanitizeText, sanitizeMultiline, sanitizeAmount, sanitizeEnum, sanitizeOptionalDate,
} from '../lib/sanitize';
import { LIFE_CATEGORIES } from './categories';
import { totalBalance } from './money';

const LIFE_IDS = LIFE_CATEGORIES.map((c) => c.id);
export const LINK_TYPES = ['none', 'account', 'tasks'];

// A goal tracks progress either numerically (current/target) or by milestones.
// It can also LINK to live data (an account balance, or completed tasks in a
// category) so progress updates itself instead of being a manual slider.
export async function addGoal({ title, lifeCategory, target, unit, deadline, notes, linkType, linkRef }) {
  const clean = sanitizeText(title, 80);
  if (!clean) throw new Error('Name your goal');
  const link = sanitizeEnum(linkType, LINK_TYPES, 'none');
  const goal = {
    id: generateId(),
    title: clean,
    lifeCategory: sanitizeEnum(lifeCategory, LIFE_IDS, 'growth'),
    target: sanitizeAmount(target, { allowZero: true }) ?? 0, // 0 = milestone-only goal
    current: 0,
    unit: sanitizeText(unit, 16),
    deadline: sanitizeOptionalDate(deadline),
    notes: sanitizeMultiline(notes, 300),
    linkType: link === 'none' ? null : link,
    linkRef: link === 'none' ? null : (linkRef || null),
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  await db.goals.add(goal);
  return goal;
}

export async function updateGoal(id, patch) {
  const g = await db.goals.get(id);
  if (!g) return;
  const clean = {};
  if (patch.title !== undefined) {
    const t = sanitizeText(patch.title, 80);
    if (t) clean.title = t;
  }
  if (patch.lifeCategory !== undefined) clean.lifeCategory = sanitizeEnum(patch.lifeCategory, LIFE_IDS, g.lifeCategory);
  if (patch.target !== undefined) clean.target = sanitizeAmount(patch.target, { allowZero: true }) ?? 0;
  if (patch.unit !== undefined) clean.unit = sanitizeText(patch.unit, 16);
  if (patch.deadline !== undefined) clean.deadline = sanitizeOptionalDate(patch.deadline);
  if (patch.notes !== undefined) clean.notes = sanitizeMultiline(patch.notes, 300);
  if (patch.linkType !== undefined) {
    const link = sanitizeEnum(patch.linkType, LINK_TYPES, 'none');
    clean.linkType = link === 'none' ? null : link;
    clean.linkRef = link === 'none' ? null : (patch.linkRef ?? g.linkRef ?? null);
  } else if (patch.linkRef !== undefined) {
    clean.linkRef = patch.linkRef || null;
  }
  await db.goals.update(id, clean);
}

export async function updateGoalProgress(id, current) {
  const g = await db.goals.get(id);
  if (!g) return;
  const val = Math.max(0, sanitizeAmount(current, { allowZero: true }) ?? 0);
  const done = g.target > 0 && val >= g.target;
  await db.goals.update(id, { current: val, completedAt: done ? (g.completedAt || new Date().toISOString()) : null });
  recordCheckin(); // moving a goal forward earns today's check-in
}

export async function deleteGoal(id) {
  await db.transaction('rw', db.goals, db.milestones, db.habits, db.habitCheckins, async () => {
    await db.goals.delete(id);
    const ms = await db.milestones.where('goalId').equals(id).toArray();
    await Promise.all(ms.map((m) => db.milestones.delete(m.id)));
    // Cascade: a goal's habits (and their check-ins) go with it, otherwise they
    // linger as orphans and keep showing up on Home.
    const habits = await db.habits.where('goalId').equals(id).toArray();
    for (const h of habits) {
      // eslint-disable-next-line no-await-in-loop
      const logs = await db.habitCheckins.where('habitId').equals(h.id).toArray();
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(logs.map((l) => db.habitCheckins.delete([l.habitId, l.date])));
      // eslint-disable-next-line no-await-in-loop
      await db.habits.delete(h.id);
    }
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

// Live "current" value for a goal: linked goals read from real data, others use
// the stored manual value. ctx = { accounts, tasks }.
export function goalCurrent(goal, ctx = {}) {
  if (goal.linkType === 'account') {
    const accounts = ctx.accounts || [];
    if (!goal.linkRef || goal.linkRef === 'all') return totalBalance(accounts);
    const a = accounts.find((x) => x.id === goal.linkRef);
    return a ? (a.type === 'credit' ? 0 : (a.balance || 0)) : (goal.current || 0);
  }
  if (goal.linkType === 'tasks') {
    const tasks = ctx.tasks || [];
    return tasks.filter((t) => t.status === 'done' && (!goal.linkRef || t.category === goal.linkRef)).length;
  }
  return goal.current || 0;
}

export function isLinked(goal) {
  return goal.linkType === 'account' || goal.linkType === 'tasks';
}

// ---------- Progress (0..1) ----------
export function goalProgress(goal, milestones, ctx = {}) {
  if (goal.target > 0) return Math.min(1, goalCurrent(goal, ctx) / goal.target);
  const mine = (milestones || []).filter((m) => m.goalId === goal.id);
  if (mine.length === 0) return 0;
  return mine.filter((m) => m.done).length / mine.length;
}

export function overallGoalProgress(goals, milestones, ctx = {}) {
  if (!goals || goals.length === 0) return 0;
  const sum = goals.reduce((acc, g) => acc + goalProgress(g, milestones, ctx), 0);
  return sum / goals.length;
}
