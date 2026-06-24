import { db } from './db';
import { DEFAULT_CURRENCY } from '../lib/currency';
import { sanitizeText } from '../lib/sanitize';

const KEY = 'app';

// Which optional tabs are live. Home/Today is always on (the dashboard).
export const TOGGLEABLE_TABS = [
  { id: 'money', label: 'Money' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'time', label: 'Time' },
  { id: 'gym', label: 'Gym' },
  { id: 'goals', label: 'Goals' },
];

export const DEFAULT_TABS = { money: true, tasks: true, time: true, gym: true, goals: true };

export const DEFAULT_SETTINGS = {
  key: KEY,
  name: '',
  baseCurrency: DEFAULT_CURRENCY,
  tabs: { ...DEFAULT_TABS },
  reminderEnabled: false,
  reminderTime: '19:00',
  onboarded: false,
  createdAt: null,
};

export async function getSettings() {
  const s = await db.settings.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(s || {}), tabs: { ...DEFAULT_TABS, ...(s?.tabs || {}) } };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch, key: KEY };
  if (patch.tabs) next.tabs = { ...current.tabs, ...patch.tabs };
  if (!next.createdAt) next.createdAt = new Date().toISOString();
  await db.settings.put(next);
  return next;
}

// Onboarding writes name + currency + chosen tabs in one go.
export async function completeOnboarding({ name, baseCurrency, tabs }) {
  return saveSettings({
    name: sanitizeText(name, 40),
    baseCurrency: sanitizeText(baseCurrency, 5) || DEFAULT_CURRENCY,
    tabs: { ...DEFAULT_TABS, ...(tabs || {}) },
    onboarded: true,
  });
}

export async function setTabEnabled(id, enabled) {
  return saveSettings({ tabs: { [id]: !!enabled } });
}
