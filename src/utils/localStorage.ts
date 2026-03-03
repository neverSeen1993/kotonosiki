import { Cat, MedicalRecord } from '../types';

const CATS_KEY = 'kotonosiki_cats';
const RECORDS_KEY = 'kotonosiki_records';

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

export function exportData(): string {
  return JSON.stringify(
    {
      cats: loadCats(),
      records: loadRecords(),
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
    return true;
  } catch {
    return false;
  }
}
