import { Cat, MedicalRecord, User, AuthSession, WeightEntry } from '../types';

const CATS_KEY = 'kotonosiki_cats';
const RECORDS_KEY = 'kotonosiki_records';
const WEIGHTS_KEY = 'kotonosiki_weights';
const USERS_KEY = 'kotonosiki_users';
const SESSION_KEY = 'kotonosiki_session';

// Seed default users if none exist
const DEFAULT_USERS: User[] = [
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

export function loadCats(): Cat[] {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCats(cats: Cat[]): void {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats));
}

export function loadRecords(): MedicalRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: MedicalRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function loadWeights(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWeights(weights: WeightEntry[]): void {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export function exportData(): string {
  return JSON.stringify(
    {
      cats: loadCats(),
      records: loadRecords(),
      weights: loadWeights(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data.cats)) saveCats(data.cats);
    if (Array.isArray(data.records)) saveRecords(data.records);
    if (Array.isArray(data.weights)) saveWeights(data.weights);
    return true;
  } catch {
    return false;
  }
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: User[] = raw ? JSON.parse(raw) : [];
    if (users.length === 0) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return users;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}
