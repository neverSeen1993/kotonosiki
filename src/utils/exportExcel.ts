import * as XLSX from 'xlsx';
import { loadCats, loadRecords } from './localStorage';
import { formatDate, daysSince } from './dateUtils';

const typeLabel: Record<string, string> = {
  procedure: 'Процедура',
  vaccination: 'Вакцинація',
  appointment: 'Прийом',
};

const statusLabel: Record<string, string> = {
  done: 'Виконано',
  scheduled: 'Заплановано',
  cancelled: 'Скасовано',
};

const sexLabel: Record<string, string> = {
  male: 'Кіт ♂',
  female: 'Киця ♀',
};

const locationLabel: Record<string, string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
};

export function exportToExcel(): void {
  const cats = loadCats();
  const records = loadRecords();

  // ── Sheet 1: Коти ──────────────────────────────────────────────
  const catsRows = cats.map((c) => ({
    "Ім'я": c.name,
    'Порода': c.breed,
    'Стать': sexLabel[c.sex] ?? c.sex,
    'Дата народження': formatDate(c.birthDate),
    'Дата прибуття': c.arrivalDate ? formatDate(c.arrivalDate) : '',
    'Днів з прибуття': c.arrivalDate ? String(daysSince(c.arrivalDate)) : '',
    'Місцезнаходження': c.location ? (locationLabel[c.location] ?? c.location) : '',
    'Колір': c.color,
    'Нотатки': c.notes ?? '',
    'Додано': formatDate(c.createdAt),
  }));

  // ── Sheet 2: Записи ────────────────────────────────────────────
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  const recordsRows = records.map((r) => ({
    'Кіт': catMap[r.catId] ?? r.catId,
    'Тип': typeLabel[r.type] ?? r.type,
    'Назва': r.title,
    'Дата': formatDate(r.date),
    'Статус': statusLabel[r.status] ?? r.status,
    'Ветеринар': r.vet ?? '',
    'Клініка': r.clinic ?? '',
    'Наступна дата': r.nextDueDate ? formatDate(r.nextDueDate) : '',
    'Нотатки': r.notes ?? '',
    'Додано': formatDate(r.createdAt),
  }));

  // ── Build workbook ─────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const wsCats = XLSX.utils.json_to_sheet(catsRows.length ? catsRows : [{}]);
  const wsRecords = XLSX.utils.json_to_sheet(recordsRows.length ? recordsRows : [{}]);

  // Auto-width columns
  const autoWidth = (ws: XLSX.WorkSheet, rows: Record<string, string>[]) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    ws['!cols'] = cols.map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
    }));
  };

  autoWidth(wsCats, catsRows);
  autoWidth(wsRecords, recordsRows);

  XLSX.utils.book_append_sheet(wb, wsCats, 'Коти');
  XLSX.utils.book_append_sheet(wb, wsRecords, 'Записи');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `kotonosyky-${date}.xlsx`);
}
