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
    res.json(item);
  });

  // PUT (replace one by id)
  app.put(`/api/${col}/:id`, (req, res) => {
    const items = readData(col) as Record<string, unknown>[];
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    items[idx] = { ...items[idx], ...req.body };
    writeData(col, items);
    res.json(items[idx]);
  });

  // DELETE one by id
  app.delete(`/api/${col}/:id`, (req, res) => {
    const items = readData(col) as Record<string, unknown>[];
    const filtered = items.filter((i) => i.id !== req.params.id);
    writeData(col, filtered);
    res.json({ ok: true });
  });
}

// Session endpoints (single object, not array)
app.get('/api/session', (_req, res) => {
  const file = dataFile('session');
  if (!fs.existsSync(file)) return res.json(null);
  try {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } catch {
    res.json(null);
  }
});

app.post('/api/session', (req, res) => {
  fs.writeFileSync(dataFile('session'), JSON.stringify(req.body, null, 2));
  res.json(req.body);
});

app.delete('/api/session', (_req, res) => {
  const file = dataFile('session');
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

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
];

if (readData('users').length === 0) {
  writeData('users', DEFAULT_USERS);
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Kotonosiki server running at http://localhost:${PORT}`);
});
