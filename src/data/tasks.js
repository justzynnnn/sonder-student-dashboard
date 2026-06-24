import { db } from './db';
import { generateId } from '../lib/ids';
import { recordCheckin } from './checkins';
import { sanitizeText, sanitizeMultiline, sanitizeEnum, sanitizeOptionalDate, sanitizeCategory } from '../lib/sanitize';
import { todayISO, startOfWeek, toISO } from '../lib/dates';

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
  if (done) recordCheckin(); // finishing a task earns today's check-in
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

// Tasks completed per ISO week for the last `weeks` weeks, oldest first.
export function completedPerWeek(tasks, weeks = 8) {
  const start = startOfWeek();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const ws = new Date(start);
    ws.setDate(start.getDate() - i * 7);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const from = toISO(ws);
    const to = toISO(we);
    const count = (tasks || []).filter((t) => {
      const d = (t.completedAt || '').slice(0, 10);
      return t.status === 'done' && d >= from && d < to;
    }).length;
    buckets.push({ weekStart: from, count });
  }
  return buckets;
}

export function searchTasks(tasks, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return tasks || [];
  return (tasks || []).filter((t) => (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
}
