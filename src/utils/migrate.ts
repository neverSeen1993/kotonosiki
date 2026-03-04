/**
 * One-time migration: reads data from localStorage and POSTs it to the server.
 * After a successful migration it clears the localStorage keys so it never runs again.
 */

const CATS_KEY = 'kotonosiki_cats';
const RECORDS_KEY = 'kotonosiki_records';
const WEIGHTS_KEY = 'kotonosiki_weights';
const MIGRATED_KEY = 'kotonosiki_migrated';

function readLS(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return;

  const cats = readLS(CATS_KEY);
  const records = readLS(RECORDS_KEY);
  const weights = readLS(WEIGHTS_KEY);

  if (cats.length === 0 && records.length === 0 && weights.length === 0) {
    localStorage.setItem(MIGRATED_KEY, 'true');
    return;
  }

  try {
    const res = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cats, records, weights }),
    });

    if (!res.ok) throw new Error('Migration request failed');

    const result = await res.json();
    console.log('✅ Migration complete:', result.imported);

    localStorage.removeItem(CATS_KEY);
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(WEIGHTS_KEY);
    localStorage.setItem(MIGRATED_KEY, 'true');
  } catch (e) {
    console.error('Migration failed:', e);
  }
}
