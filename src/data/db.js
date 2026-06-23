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
  // Tasks
  tasks: 'id, status, dueDate, priority, category, createdAt',
  // Gym
  exercises: 'name',
  plans: 'id, createdAt',
  sessions: 'id, date, completedAt, planId',
  // Goals
  goals: 'id, lifeCategory, createdAt, completedAt',
  milestones: 'id, goalId',
};

db.version(1).stores(STORES);

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
    for (const table of db.tables) {
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
