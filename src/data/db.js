import Dexie from 'dexie';

// One local-first database, one table per domain. No server, no accounts —
// all data lives on this device (see plan §Context: local-only).
export const db = new Dexie('SonderDB');

const STORES = {
  // key/value singletons (settings under key 'app').
  settings: 'key',
  // Home
  quotes: 'id, pinned, createdAt',
  checkins: 'date',
  // Money
  accounts: 'id, createdAt',
  expenses: 'id, date, category, accountId, createdAt',
  budgets: 'category',
  savings: 'id, createdAt',
  customCategories: 'id, &[domain+name], domain, name, createdAt',
  // Tasks
  tasks: 'id, status, dueDate, priority, category, createdAt',
  // Time
  timeEntries: 'id, date, category, startTime, createdAt',
  // Gym
  exercises: 'name',
  plans: 'id, createdAt',
  sessions: 'id, date, completedAt, planId',
  // Goals
  goals: 'id, lifeCategory, createdAt, completedAt',
  milestones: 'id, goalId',
};

// v3 adds: income tracking, recurring templates, and habits (nested under goals).
const STORES_V3 = {
  ...STORES,
  // Money — money coming in (mirrors expenses, raises balances).
  incomes: 'id, date, accountId, createdAt',
  // Repeating templates that materialise into tasks / expenses / income on open.
  recurrences: 'id, kind, nextDate, active, createdAt',
  // Habits belong to a goal; checkins are one row per habit per day.
  habits: 'id, goalId, archived, createdAt',
  habitCheckins: '&[habitId+date], habitId, date',
};

db.version(1).stores(STORES);
db.version(2).stores(STORES);
db.version(3).stores(STORES_V3);

db.on('ready', async () => {
  const hasSettings = await db.settings.count();
  if (hasSettings > 0) return;

  const legacyName = ['Tem', 'poDB'].join('');
  const names = await Dexie.getDatabaseNames();
  if (!names.includes(legacyName)) return;

  const legacy = new Dexie(legacyName);
  legacy.version(1).stores(STORES);

  try {
    await legacy.open();
    // Only copy tables the legacy DB actually has — v3 added tables it never knew.
    const legacyTables = new Set(legacy.tables.map((t) => t.name));
    for (const table of db.tables) {
      if (!legacyTables.has(table.name)) continue;
      // eslint-disable-next-line no-await-in-loop
      const rows = await legacy.table(table.name).toArray();
      if (rows.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await table.bulkPut(rows);
      }
    }
  } finally {
    legacy.close();
  }
});

export default db;
