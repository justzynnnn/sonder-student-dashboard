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
