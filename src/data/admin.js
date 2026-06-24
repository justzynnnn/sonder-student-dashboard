import { db } from './db';

// Full local data export — true data ownership (privacy requirement).
export async function exportBackup() {
  const tables = db.tables.map((t) => t.name);
  const dump = {};
  for (const name of tables) {
    // eslint-disable-next-line no-await-in-loop
    dump[name] = await db.table(name).toArray();
  }
  return {
    app: 'Sonder',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: dump,
  };
}

// Restore from a previously exported backup. Replaces each known table with the
// backup's rows (a full restore, not a merge) so a reinstall / new phone can
// recover everything. Returns the number of rows imported.
export async function importBackup(payload) {
  const data = payload && payload.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('That file is not a Sonder backup.');
  }
  const known = new Set(db.tables.map((t) => t.name));
  let imported = 0;
  await db.transaction('rw', db.tables, async () => {
    for (const name of Object.keys(data)) {
      if (!known.has(name)) continue;
      const rows = data[name];
      if (!Array.isArray(rows)) continue;
      // eslint-disable-next-line no-await-in-loop
      await db.table(name).clear();
      if (rows.length) {
        // eslint-disable-next-line no-await-in-loop
        await db.table(name).bulkPut(rows);
        imported += rows.length;
      }
    }
  });
  return imported;
}

// Ask the browser to keep our IndexedDB from being evicted under storage
// pressure. Best-effort: unsupported / denied returns false. On native
// (Capacitor) data is already persistent, so this is a no-op there.
export async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      if (navigator.storage.persisted && (await navigator.storage.persisted())) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Erase EVERYTHING on this device, then reopen an empty DB so the app keeps
// working. Local-only app => this is the complete "delete my data" path.
export async function clearAllData() {
  await db.delete();
  try {
    localStorage.removeItem('sonder-theme');
  } catch {
    /* ignore */
  }
  await db.open();
}
