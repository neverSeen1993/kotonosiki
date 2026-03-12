import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function dataFile(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readData(name: string): unknown[] {
  const file = dataFile(name);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeData(name: string, data: unknown[]): void {
  fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2), 'utf-8');
}

// ── Logging ────────────────────────────────────────────────────────────────

interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  entityId?: string;
  details: string;
  changes?: FieldChange[];   // field-level diff for updates
  snapshot?: Record<string, unknown>; // full object for create/delete
}

function getSessionFromReq(req: express.Request): { userId: string; name: string } | null {
  const header = req.headers['x-session'];
  if (!header || typeof header !== 'string') return null;
  try {
    const s = JSON.parse(header);
    return s?.userId ? { userId: s.userId, name: s.name ?? s.userId } : null;
  } catch {
    return null;
  }
}

// Fields to skip in diffs (noisy / not human-readable)
const SKIP_FIELDS = new Set(['createdAt', 'id', 'catId']);

function buildDiff(before: Record<string, unknown>, patch: Record<string, unknown>): FieldChange[] {
  return Object.keys(patch)
    .filter((k) => !SKIP_FIELDS.has(k))
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(patch[k] === '' ? undefined : patch[k]))
    .map((k) => ({
      field: k,
      before: before[k] ?? null,
      after: patch[k] === '' ? null : patch[k],
    }));
}

function writeLog(
  req: express.Request,
  action: LogEntry['action'],
  collection: string,
  entityId: string | undefined,
  details: string,
  extra: { changes?: FieldChange[]; snapshot?: Record<string, unknown> } = {}
) {
  const session = getSessionFromReq(req);
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: session?.userId ?? 'unknown',
    userName: session?.name ?? 'Невідомий',
    action,
    collection,
    entityId,
    details,
    ...extra,
  };
  const logs = readData('logs') as LogEntry[];
  logs.unshift(entry);
  writeData('logs', logs);
}

const collectionName: Record<string, string> = {
  cats: 'Кіт',
  records: 'Запис',
  weights: 'Вага',
  users: 'Користувач',
};

// Generic CRUD routes for each collection
const collections = ['cats', 'records', 'weights', 'users'];

for (const col of collections) {
  // GET all
  app.get(`/api/${col}`, (_req, res) => {
    res.json(readData(col));
  });

  // POST (add one)
  app.post(`/api/${col}`, (req, res) => {
    const items = readData(col) as Record<string, unknown>[];
    const item = req.body as Record<string, unknown>;
    items.push(item);
    writeData(col, items);
    const label = collectionName[col] ?? col;
    const name = (item.name as string) || (item.title as string) || String(item.id ?? '');
    writeLog(req, 'create', col, item.id as string, `${label} створено: ${name}`, { snapshot: item });
    res.json(item);
  });

  // PUT (replace one by id)
  app.put(`/api/${col}/:id`, (req, res) => {
    const items = readData(col) as Record<string, unknown>[];
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const before = items[idx] as Record<string, unknown>;
    const merged = { ...before, ...req.body };
    for (const key of Object.keys(req.body)) {
      if (req.body[key] === '' || req.body[key] === null) delete merged[key];
    }
    items[idx] = merged;
    writeData(col, items);
    const label = collectionName[col] ?? col;
    const name = (merged.name as string) || (merged.title as string) || String(merged.id ?? '');
    const changes = buildDiff(before, req.body as Record<string, unknown>);
    writeLog(req, 'update', col, req.params.id, `${label} оновлено: ${name}`, { changes });
    res.json(items[idx]);
  });

  // DELETE one by id
  app.delete(`/api/${col}/:id`, (req, res) => {
    const items = readData(col) as Record<string, unknown>[];
    const item = items.find((i) => i.id === req.params.id) as Record<string, unknown> | undefined;
    const filtered = items.filter((i) => i.id !== req.params.id);
    writeData(col, filtered);
    const label = collectionName[col] ?? col;
    const name = item ? ((item.name as string) || (item.title as string) || req.params.id) : req.params.id;
    writeLog(req, 'delete', col, req.params.id, `${label} видалено: ${name}`, { snapshot: item });
    res.json({ ok: true });
  });
}

// Bulk migration endpoint — imports data from localStorage export, skips duplicates
app.post('/api/migrate', (req, res) => {
  const { cats = [], records = [], weights = [] } = req.body as {
    cats?: Record<string, unknown>[];
    records?: Record<string, unknown>[];
    weights?: Record<string, unknown>[];
  };

  let imported = { cats: 0, records: 0, weights: 0 };

  const merge = (name: string, incoming: Record<string, unknown>[]) => {
    const existing = readData(name) as Record<string, unknown>[];
    const existingIds = new Set(existing.map((i) => i.id));
    const toAdd = incoming.filter((i) => !existingIds.has(i.id));
    if (toAdd.length > 0) writeData(name, [...existing, ...toAdd]);
    return toAdd.length;
  };

  imported.cats = merge('cats', cats);
  imported.records = merge('records', records);
  imported.weights = merge('weights', weights);

  res.json({ ok: true, imported });
});

// Seed default users if none exist
const DEFAULT_USERS = [
  {
    id: 'user-admin',
    name: 'Адміністратор',
    login: 'admin',
    passwordHash: btoa('admin123'),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-helper',
    name: 'Помічник',
    login: 'helper',
    passwordHash: btoa('helper123'),
    role: 'helper',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-viewer',
    name: 'Adoption Guard',
    login: 'adoption',
    passwordHash: btoa('adoption123'),
    role: 'viewer',
    createdAt: new Date().toISOString(),
  },
];

if (readData('users').length === 0) {
  writeData('users', DEFAULT_USERS);
}

// Logs endpoint
app.get('/api/logs', (_req, res) => {
  res.json(readData('logs'));
});

// ── Session stubs (auth is now per-browser via localStorage) ───────────────
// These exist only so that old cached client code doesn't break.
// They always return null / no-op — no shared server-side session.
app.get('/api/session', (_req, res) => { res.json(null); });
app.post('/api/session', (_req, res) => { res.json(null); });
app.delete('/api/session', (_req, res) => { res.json({ ok: true }); });

// Clean up old session file if it exists
const oldSessionFile = dataFile('session');
if (fs.existsSync(oldSessionFile)) {
  try { fs.unlinkSync(oldSessionFile); } catch { /* ignore */ }
}

// ── Serve frontend in production ───────────────────────────────────────────
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — serve index.html for any non-API route
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Kotonosiki server running at http://localhost:${PORT}`);
});
