import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeCategory, sanitizeDate, sanitizeText } from '../lib/sanitize';
import { startOfWeek, todayISO, toISO } from '../lib/dates';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function minutesFromTime(value) {
  const match = TIME_RE.exec(String(value || ''));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function durationMinutes(startTime, endTime) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  if (start == null || end == null) return null;
  const duration = end > start ? end - start : end + 1440 - start;
  return duration > 0 && duration <= 1440 ? duration : null;
}

export function formatDuration(minutes) {
  const mins = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function addTimeEntry({ date, startTime, endTime, description, category }) {
  const cleanText = sanitizeText(description, 100);
  if (!cleanText) throw new Error('What did you spend time on?');
  const minutes = durationMinutes(startTime, endTime);
  if (!minutes) throw new Error('Choose a valid time range');
  const entry = {
    id: generateId(),
    date: sanitizeDate(date),
    startTime: String(startTime || '').slice(0, 5),
    endTime: String(endTime || '').slice(0, 5),
    minutes,
    description: cleanText,
    category: sanitizeCategory(category, ''),
    createdAt: new Date().toISOString(),
  };
  await db.timeEntries.add(entry);
  return entry;
}

export async function deleteTimeEntry(id) {
  await db.timeEntries.delete(id);
}

export function entriesInWeek(entries) {
  const weekStart = toISO(startOfWeek());
  return (entries || []).filter((entry) => (entry.date || '') >= weekStart);
}

export function entriesToday(entries) {
  const today = todayISO();
  return (entries || []).filter((entry) => entry.date === today);
}

export function totalMinutes(entries) {
  return (entries || []).reduce((sum, entry) => sum + (entry.minutes || 0), 0);
}

export function timeByCategory(entries) {
  const map = new Map();
  for (const entry of entries || []) {
    const key = entry.category || 'Uncategorized';
    map.set(key, (map.get(key) || 0) + (entry.minutes || 0));
  }
  return [...map.entries()]
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}
