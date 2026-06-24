import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeText, sanitizeEnum } from '../lib/sanitize';

// Spending categories (built-ins + palette) and the life-goal categories.

export const BUILT_IN_CATEGORIES = [
  { name: 'Food', color: '#0ea5e9' },
  { name: 'Transport', color: '#f59e0b' },
  { name: 'School', color: '#6366f1' },
  { name: 'Fun', color: '#ec4899' },
  { name: 'Shopping', color: '#a855f7' },
  { name: 'Health', color: '#f43f5e' },
  { name: 'Coffee', color: '#d97706' },
  { name: 'Other', color: '#64748b' },
];

export const CATEGORY_PALETTE = [
  '#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6',
  '#6366f1', '#64748b',
];

export function hashColor(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length];
}

export function categoryMeta(name) {
  return BUILT_IN_CATEGORIES.find((c) => c.name === name) || { name, color: hashColor(name) };
}

export const TASK_BUILT_IN_CATEGORIES = [
  { name: 'School', color: '#0ea5e9' },
  { name: 'Personal', color: '#a855f7' },
];

export const TIME_BUILT_IN_CATEGORIES = [
  { name: 'Study', color: '#0ea5e9' },
  { name: 'Work', color: '#6366f1' },
  { name: 'Commute', color: '#f59e0b' },
  { name: 'Exercise', color: '#f97316' },
  { name: 'Rest', color: '#14b8a6' },
  { name: 'Social', color: '#ec4899' },
  { name: 'Other', color: '#64748b' },
];

export const CATEGORY_DOMAINS = ['money', 'tasks', 'time'];

export function builtInCategoriesFor(domain) {
  if (domain === 'tasks') return TASK_BUILT_IN_CATEGORIES;
  if (domain === 'time') return TIME_BUILT_IN_CATEGORIES;
  return BUILT_IN_CATEGORIES;
}

export function mergeCategories(domain, custom = []) {
  const map = new Map();
  for (const category of builtInCategoriesFor(domain)) map.set(category.name, { ...category, builtin: true });
  for (const category of custom || []) {
    if (category.domain === domain && category.name) {
      map.set(category.name, { name: category.name, color: category.color || hashColor(category.name), builtin: false });
    }
  }
  return [...map.values()];
}

export async function addCustomCategory({ domain, name, color }) {
  const cleanDomain = sanitizeEnum(domain, CATEGORY_DOMAINS, 'money');
  const cleanName = sanitizeText(name, 30);
  if (!cleanName) throw new Error('Name the category');
  const existing = await db.customCategories.where('[domain+name]').equals([cleanDomain, cleanName]).first();
  if (existing) return existing;
  const category = {
    id: generateId(),
    domain: cleanDomain,
    name: cleanName,
    color: color || hashColor(cleanName),
    createdAt: new Date().toISOString(),
  };
  await db.customCategories.put(category);
  return category;
}

export async function deleteCustomCategory(id) {
  await db.customCategories.delete(id);
}

export function domainCategoryMeta(domain, name, custom = []) {
  return mergeCategories(domain, custom).find((c) => c.name === name) || { name, color: hashColor(name) };
}

// Life areas for the Goals tab — each maps to a domain accent / hue.
export const LIFE_CATEGORIES = [
  { id: 'money', label: 'Money', color: '#10b981' },
  { id: 'school', label: 'School', color: '#0ea5e9' },
  { id: 'fitness', label: 'Fitness', color: '#f97316' },
  { id: 'social', label: 'Social Life', color: '#ec4899' },
  { id: 'career', label: 'Career', color: '#6366f1' },
  { id: 'growth', label: 'Personal Growth', color: '#a855f7' },
];

export function lifeCategoryMeta(id) {
  return LIFE_CATEGORIES.find((c) => c.id === id) || LIFE_CATEGORIES[5];
}
