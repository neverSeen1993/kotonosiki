import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
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

// ── Token store ────────────────────────────────────────────────────────────
interface TokenRecord {
  token: string;
  userId: string;
  userName: string;
  role: string;
  createdAt: string;
}

function readTokens(): TokenRecord[] {
  const file = dataFile('tokens');
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeTokens(tokens: TokenRecord[]): void {
  fs.writeFileSync(dataFile('tokens'), JSON.stringify(tokens, null, 2), 'utf-8');
}

function findByToken(token: string): TokenRecord | undefined {
  return readTokens().find((t) => t.token === token);
}

const COOKIE_NAME = 'kotonosiki_auth';

function getTokenFromReq(req: express.Request): string | null {
  // Try cookie first, then Authorization header as fallback
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
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
  const token = getTokenFromReq(req);
  if (!token) return null;
  const rec = findByToken(token);
  return rec ? { userId: rec.userId, name: rec.userName } : null;
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
  visits: 'Відвідування',
  shifts: 'Зміна',
  nannies: 'Котоняня',
};

// ── Role-based authorization middleware ─────────────────────────────────────
function getRoleFromReq(req: express.Request): string | null {
  const token = getTokenFromReq(req);
  if (!token) return null;
  const rec = findByToken(token);
  return rec ? rec.role : null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const role = getRoleFromReq(req);
  if (role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin access required' });
    return;
  }
  next();
}

function requireAdminOrHelper(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const role = getRoleFromReq(req);
  if (role !== 'admin' && role !== 'helper') {
    res.status(403).json({ error: 'Forbidden: admin or helper access required' });
    return;
  }
  next();
}

// Map collection names to the PagePermissions key that governs write access
const collectionPageMap: Record<string, string> = {
  cats: 'catalog',
  records: 'catProfile',
  weights: 'catProfile',
  visits: 'visits',
  shifts: 'shifts',
};

/**
 * Returns true if the user is allowed to write to the given collection.
 * Admins always can. Nannies can if they have 'edit' on the mapped page.
 */
function canWriteCollection(req: express.Request, collection: string): boolean {
  const role = getRoleFromReq(req);
  if (role === 'admin') return true;
  if (role !== 'nanny') return false;

  // Look up the nanny's permissions
  const token = getTokenFromReq(req);
  if (!token) return false;
  const tokenRec = findByToken(token);
  if (!tokenRec) return false;

  const users = readData('users') as Record<string, unknown>[];
  const user = users.find((u) => u.id === tokenRec.userId);
  if (!user || !user.nannyId) return false;

  const nannies = readData('nannies') as Record<string, unknown>[];
  const nanny = nannies.find((n) => n.id === user.nannyId);
  if (!nanny || !nanny.permissions) return false;

  const perms = nanny.permissions as Record<string, string>;
  const pageKey = collectionPageMap[collection];
  if (!pageKey) return false;  // unknown collection → deny
  return perms[pageKey] === 'edit';
}

function requireWrite(collection: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!canWriteCollection(req, collection)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

// ── Adoption-specific endpoint (admin + helper) ────────────────────────────
const ADOPTION_FIELDS = new Set([
  'adoption', 'adoptionNotes',
]);

app.put('/api/cats/:id/adoption', requireAdminOrHelper, (req, res) => {
  const items = readData('cats') as Record<string, unknown>[];
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  // Only allow adoption-related fields
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(req.body)) {
    if (ADOPTION_FIELDS.has(key)) {
      patch[key] = req.body[key];
    }
  }

  const before = items[idx] as Record<string, unknown>;
  const merged = { ...before, ...patch };
  for (const key of Object.keys(patch)) {
    if (patch[key] === '' || patch[key] === null) delete merged[key];
  }
  items[idx] = merged;
  writeData('cats', items);

  const label = collectionName['cats'] ?? 'cats';
  const name = (merged.name as string) || String(merged.id ?? '');
  const changes = buildDiff(before, patch);
  writeLog(req, 'update', 'cats', req.params.id, `${label} оновлено (адопція): ${name}`, { changes });
  res.json(items[idx]);
});

// ── Cats: unique name check on create and update ───────────────────────────
app.post('/api/cats', requireWrite('cats'), (req, res) => {
  const items = readData('cats') as Record<string, unknown>[];
  const item = req.body as Record<string, unknown>;
  const newName = ((item.name as string) ?? '').trim().toLowerCase();
  if (newName && items.some((c) => ((c.name as string) ?? '').trim().toLowerCase() === newName)) {
    return res.status(409).json({ error: `Кіт з іменем "${item.name}" вже існує` });
  }
  items.push(item);
  writeData('cats', items);
  const label = collectionName['cats'] ?? 'cats';
  const name = (item.name as string) || String(item.id ?? '');
  writeLog(req, 'create', 'cats', item.id as string, `${label} створено: ${name}`, { snapshot: item });
  res.json(item);
});

app.put('/api/cats/:id', requireWrite('cats'), (req, res) => {
  const items = readData('cats') as Record<string, unknown>[];
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const before = items[idx] as Record<string, unknown>;
  const newName = ((req.body.name as string) ?? '').trim().toLowerCase();
  if (newName && items.some((c, i) => i !== idx && ((c.name as string) ?? '').trim().toLowerCase() === newName)) {
    return res.status(409).json({ error: `Кіт з іменем "${req.body.name}" вже існує` });
  }
  const merged = { ...before, ...req.body };
  for (const key of Object.keys(req.body)) {
    if (req.body[key] === '' || req.body[key] === null) delete merged[key];
  }
  items[idx] = merged;
  writeData('cats', items);
  const label = collectionName['cats'] ?? 'cats';
  const name = (merged.name as string) || String(merged.id ?? '');
  const changes = buildDiff(before, req.body as Record<string, unknown>);
  writeLog(req, 'update', 'cats', req.params.id, `${label} оновлено: ${name}`, { changes });
  res.json(items[idx]);
});

// Generic CRUD routes for each collection
const collections = ['cats', 'records', 'weights', 'users', 'visits', 'shifts'];

for (const col of collections) {
  // GET all
  app.get(`/api/${col}`, (_req, res) => {
    res.json(readData(col));
  });

  // Users collection is always admin-only for writes
  const writeMiddleware = col === 'users' ? requireAdmin : requireWrite(col);

  // POST (add one) — cats have a dedicated handler above with unique-name check
  if (col !== 'cats') {
    app.post(`/api/${col}`, writeMiddleware, (req, res) => {
      const items = readData(col) as Record<string, unknown>[];
      const item = req.body as Record<string, unknown>;
      items.push(item);
      writeData(col, items);
      const label = collectionName[col] ?? col;
      const name = (item.name as string) || (item.title as string) || String(item.id ?? '');
      writeLog(req, 'create', col, item.id as string, `${label} створено: ${name}`, { snapshot: item });
      res.json(item);
    });
  }

  // PUT (replace one by id) — cats have a dedicated handler above with unique-name check
  if (col !== 'cats') {
    app.put(`/api/${col}/:id`, writeMiddleware, (req, res) => {
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
  }

  // DELETE one by id
  app.delete(`/api/${col}/:id`, writeMiddleware, (req, res) => {
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

// ── Nanny CRUD with user-account sync ──────────────────────────────────────

function syncNannyUser(nanny: Record<string, unknown>): void {
  const users = readData('users') as Record<string, unknown>[];
  const nannyUserId = `nanny-${nanny.id}`;
  const idx = users.findIndex((u) => u.id === nannyUserId);

  if (nanny.login && nanny.passwordHash) {
    // Create or update a user record for this nanny
    const userRec: Record<string, unknown> = {
      id: nannyUserId,
      name: nanny.name,
      login: nanny.login,
      passwordHash: nanny.passwordHash,
      role: 'nanny',
      nannyId: nanny.id,
      createdAt: idx >= 0 ? (users[idx] as Record<string, unknown>).createdAt : new Date().toISOString(),
    };
    if (idx >= 0) {
      users[idx] = userRec;
    } else {
      users.push(userRec);
    }
    writeData('users', users);
  } else if (idx >= 0) {
    // Nanny lost its login — remove user record
    writeData('users', users.filter((u) => u.id !== nannyUserId));
  }
}

function removeNannyUser(nannyId: string): void {
  const users = readData('users') as Record<string, unknown>[];
  const nannyUserId = `nanny-${nannyId}`;
  writeData('users', users.filter((u) => u.id !== nannyUserId));
  // Also remove any active tokens for this user
  const tokens = readTokens().filter((t) => t.userId !== nannyUserId);
  writeTokens(tokens);
}

// GET all nannies
app.get('/api/nannies', (_req, res) => {
  res.json(readData('nannies'));
});

// POST — create nanny (admin only)
app.post('/api/nannies', requireAdmin, (req, res) => {
  const items = readData('nannies') as Record<string, unknown>[];
  const item = req.body as Record<string, unknown>;
  items.push(item);
  writeData('nannies', items);
  syncNannyUser(item);
  const name = (item.name as string) || String(item.id ?? '');
  writeLog(req, 'create', 'nannies', item.id as string, `Котоняня створено: ${name}`, { snapshot: item });
  res.json(item);
});

// PUT — update nanny (admin only)
app.put('/api/nannies/:id', requireAdmin, (req, res) => {
  const items = readData('nannies') as Record<string, unknown>[];
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const before = items[idx] as Record<string, unknown>;
  const merged = { ...before, ...req.body };
  for (const key of Object.keys(req.body)) {
    if (req.body[key] === '' || req.body[key] === null) delete merged[key];
  }
  items[idx] = merged;
  writeData('nannies', items);
  syncNannyUser(merged);
  const name = (merged.name as string) || String(merged.id ?? '');
  const changes = buildDiff(before, req.body as Record<string, unknown>);
  writeLog(req, 'update', 'nannies', req.params.id, `Котоняня оновлено: ${name}`, { changes });
  res.json(items[idx]);
});

// DELETE — delete nanny (admin only)
app.delete('/api/nannies/:id', requireAdmin, (req, res) => {
  const items = readData('nannies') as Record<string, unknown>[];
  const item = items.find((i) => i.id === req.params.id) as Record<string, unknown> | undefined;
  const filtered = items.filter((i) => i.id !== req.params.id);
  writeData('nannies', filtered);
  removeNannyUser(req.params.id);
  const name = item ? ((item.name as string) || req.params.id) : req.params.id;
  writeLog(req, 'delete', 'nannies', req.params.id, `Котоняня видалено: ${name}`, { snapshot: item });
  res.json({ ok: true });
});

// Bulk migration endpoint — admin only
app.post('/api/migrate', requireAdmin, (req, res) => {
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

// ── Sync existing nanny accounts on startup ────────────────────────────────
// Ensures every nanny with login+password has a corresponding user record.
{
  const nannies = readData('nannies') as Record<string, unknown>[];
  let synced = 0;
  for (const nanny of nannies) {
    if (nanny.login && nanny.passwordHash) {
      const users = readData('users') as Record<string, unknown>[];
      const nannyUserId = `nanny-${nanny.id}`;
      if (!users.find((u) => u.id === nannyUserId)) {
        syncNannyUser(nanny);
        synced++;
      }
    }
  }
  if (synced > 0) {
    console.log(`🔄 Synced ${synced} nanny user account(s)`);
  }
}

// Logs endpoint — admin only
app.get('/api/logs', requireAdmin, (_req, res) => {
  res.json(readData('logs'));
});

// ── Auth endpoints ─────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { login, password } = req.body as { login?: string; password?: string };
  if (!login || !password) return res.status(400).json({ error: 'Login and password required' });

  const users = readData('users') as Record<string, unknown>[];
  const user = users.find(
    (u) => u.login === login && u.passwordHash === btoa(password)
  );
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex');
  const rec: TokenRecord = {
    token,
    userId: user.id as string,
    userName: (user.name as string) ?? login,
    role: user.role as string,
    createdAt: new Date().toISOString(),
  };

  const tokens = readTokens();
  tokens.push(rec);
  writeTokens(tokens);

  // Set HTTP-only cookie — the browser will send it automatically
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // If this user is a nanny, attach their permissions
  const responseData: Record<string, unknown> = {
    userId: rec.userId,
    name: rec.userName,
    role: rec.role,
  };

  if (user.role === 'nanny' && user.nannyId) {
    const nannies = readData('nannies') as Record<string, unknown>[];
    const nanny = nannies.find((n) => n.id === user.nannyId);
    if (nanny) {
      responseData.permissions = nanny.permissions;
      responseData.nannyId = nanny.id;
    }
  }

  res.json(responseData);
});

app.post('/api/logout', (req, res) => {
  const token = getTokenFromReq(req);
  if (token) {
    const tokens = readTokens().filter((t) => t.token !== token);
    writeTokens(tokens);
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const rec = findByToken(token);
  if (!rec) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Invalid token' });
  }

  const responseData: Record<string, unknown> = {
    userId: rec.userId,
    name: rec.userName,
    role: rec.role,
  };

  // If nanny, look up permissions
  if (rec.role === 'nanny') {
    const users = readData('users') as Record<string, unknown>[];
    const user = users.find((u) => u.id === rec.userId);
    if (user && user.nannyId) {
      const nannies = readData('nannies') as Record<string, unknown>[];
      const nanny = nannies.find((n) => n.id === user.nannyId);
      if (nanny) {
        responseData.permissions = nanny.permissions;
        responseData.nannyId = nanny.id;
      }
    }
  }

  res.json(responseData);
});

// ── Legacy session stubs (for any old cached client code) ──────────────────
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
