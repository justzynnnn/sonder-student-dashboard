import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeText, sanitizeMultiline, sanitizeEnum, sanitizeOptionalDate, sanitizeCategory } from '../lib/sanitize';
import { todayISO } from '../lib/dates';

export const PRIORITIES = ['low', 'med', 'high'];

export async function addTask({ title, notes, priority, dueDate, category }) {
  const clean = sanitizeText(title, 100);
  if (!clean) throw new Error('What do you need to do?');
  const task = {
    id: generateId(),
    title: clean,
    notes: sanitizeMultiline(notes, 500),
    priority: sanitizeEnum(priority, PRIORITIES, 'med'),
    category: sanitizeCategory(category, 'School'),
    dueDate: sanitizeOptionalDate(dueDate),
    status: 'todo',
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  await db.tasks.add(task);
  return task;
}

export async function toggleTask(id) {
  const t = await db.tasks.get(id);
  if (!t) return null;
  const done = t.status !== 'done';
  await db.tasks.update(id, {
    status: done ? 'done' : 'todo',
    completedAt: done ? new Date().toISOString() : null,
  });
  return done;
}

export async function updateTask(id, patch) {
  const clean = {};
  if (patch.title !== undefined) clean.title = sanitizeText(patch.title, 100);
  if (patch.notes !== undefined) clean.notes = sanitizeMultiline(patch.notes, 500);
  if (patch.priority !== undefined) clean.priority = sanitizeEnum(patch.priority, PRIORITIES, 'med');
  if (patch.category !== undefined) clean.category = sanitizeCategory(patch.category, 'School');
  if (patch.dueDate !== undefined) clean.dueDate = sanitizeOptionalDate(patch.dueDate);
  await db.tasks.update(id, clean);
}

export async function deleteTask(id) {
  await db.tasks.delete(id);
}

// ---------- selectors over loaded rows ----------
const order = { high: 0, med: 1, low: 2 };
const byPriority = (a, b) => order[a.priority] - order[b.priority];

export function todayTasks(tasks) {
  const today = todayISO();
  return (tasks || [])
    .filter((t) => t.status !== 'done' && (!t.dueDate || t.dueDate <= today))
    .sort(byPriority);
}

export function upcomingTasks(tasks) {
  const today = todayISO();
  return (tasks || [])
    .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate > today)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function completedTasks(tasks) {
  return (tasks || [])
    .filter((t) => t.status === 'done')
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
}

export function todayProgress(tasks) {
  const today = todayISO();
  const due = (tasks || []).filter((t) => !t.dueDate || t.dueDate <= today);
  const done = due.filter((t) => t.status === 'done').length;
  return { done, total: due.length };
}
