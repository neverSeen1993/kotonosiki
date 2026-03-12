import * as XLSX from 'xlsx';
import { Cat, MedicalRecord, WeightEntry } from '../types';
import { formatDate, daysSince } from './dateUtils';

const typeLabel: Record<string, string> = {
  procedure: 'Лікування',
  vaccination: 'Вакцинація',
  appointment: 'Прийом',
  treatment: 'Обробка',
  surgery: 'Операція',
};

const statusLabel: Record<string, string> = {
  done: 'Виконано',
  scheduled: 'Заплановано',
  cancelled: 'Скасовано',
  ongoing: 'Виконується',
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

const testResultLabel = (v?: string) =>
  v === 'positive' ? 'Позитивний' : v === 'negative' ? 'Негативний' : v === 'not_tested' ? 'Не тестували' : '';

export function exportToExcel(cats: Cat[], records: MedicalRecord[], weights: WeightEntry[] = []): void {
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  // ── Sheet 1: Коти ──────────────────────────────────────────────
  const catsRows = cats.map((c) => ({
    "Ім'я": c.name,
    'Стать': sexLabel[c.sex] ?? c.sex,
    'Дата народження': c.birthDate ? formatDate(c.birthDate) : '',
    'Колір': c.color,
    'Дата прибуття': c.arrivalDate ? formatDate(c.arrivalDate) : '',
    'Днів з прибуття': c.arrivalDate ? String(daysSince(c.arrivalDate)) : '',
    'Місцезнаходження': c.location ? (locationLabel[c.location] ?? c.location) : '',
    'Звідки': c.origin ?? '',
    'FIV': testResultLabel(c.fiv),
    'FeLV': testResultLabel(c.felv),
    'Стерилізація': c.sterilised === true ? 'Так' : c.sterilised === false ? 'Ні' : '',
    'Нотатки': c.notes ?? '',
    'Історія': c.history ?? '',
    'Особливості прилаштування': c.adoptionNotes ?? '',
    'Патрон': c.patron?.name ?? '',
    'Патрон — під опікою з': c.patron?.since ? formatDate(c.patron.since) : '',
    'Патрон — звідки дізнались': c.patron?.origin ?? '',
    'Патрон — Instagram': c.patron?.instagram ?? '',
    'Патрон — телефон': c.patron?.phone ?? '',
    'Адопція — дата': c.adoption?.date ? formatDate(c.adoption.date) : '',
    'Адопція — звідки': c.adoption?.from ?? '',
    'Адопція — email': c.adoption?.email ?? '',
    'Адопція — телефон 1': c.adoption?.phone1 ?? '',
    'Адопція — телефон 2': c.adoption?.phone2 ?? '',
    'Адопція — Instagram': c.adoption?.instagram ?? '',
    'Сайт притулку': c.promotion?.website ? 'Так' : c.promotion?.website === false ? 'Ні' : '',
    'GladPet': c.promotion?.gladpet ?? '',
    'Happy Paw': c.promotion?.happyPaw ?? '',
    'Інші сайти': c.promotion?.extraLinks?.map((l) => `${l.name}: ${l.url}`).join('; ') ?? '',
    'Google Drive': c.driveUrl ?? '',
    'Додано': formatDate(c.createdAt),
  }));

  // ── Sheet 2: Лікування (procedure) ────────────────────────────
  const procedures = records.filter((r) => r.type === 'procedure');
  const procedureRows = procedures.map((r) => ({
    'Кіт': catMap[r.catId] ?? r.catId,
    'Діагноз': r.title,
    'Дата початку': formatDate(r.date),
    'Дата закінчення': r.dateEnd ? formatDate(r.dateEnd) : '',
    'Статус': statusLabel[r.status] ?? r.status,
    'Опис': r.description ?? '',
    'Препарат': r.drug ?? '',
    'Дозування': r.dosage ?? '',
    'Особливості': r.special ?? '',
    'Результати': r.doneNotes ?? '',
    'Фото': r.photoUrl ?? '',
    'Додано': formatDate(r.createdAt),
  }));

  // ── Sheet 3: Вакцинація (vaccination) ──────────────────────────
  const vaccinations = records.filter((r) => r.type === 'vaccination');
  const vaccinationRows = vaccinations.map((r) => ({
    'Кіт': catMap[r.catId] ?? r.catId,
    'Назва': r.title,
    'Дата': formatDate(r.date),
    'Статус': statusLabel[r.status] ?? r.status,
    'Наступна вакцинація': r.nextDueDate ? formatDate(r.nextDueDate) : '',
    'Нотатки': r.notes ?? '',
    'Результати': r.doneNotes ?? '',
    'Фото': r.photoUrl ?? '',
    'Додано': formatDate(r.createdAt),
  }));

  // ── Sheet 4: Обробки (treatment) ──────────────────────────────
  const treatments = records.filter((r) => r.type === 'treatment');
  const treatmentRows = treatments.map((r) => ({
    'Кіт': catMap[r.catId] ?? r.catId,
    'Назва': r.title,
    'Дата': formatDate(r.date),
    'Статус': statusLabel[r.status] ?? r.status,
    'Нотатки': r.notes ?? '',
    'Результати': r.doneNotes ?? '',
    'Фото': r.photoUrl ?? '',
    'Додано': formatDate(r.createdAt),
  }));

  // ── Sheet 5: Прийоми (appointment) ────────────────────────────
  const appointments = records.filter((r) => r.type === 'appointment');
  const appointmentRows = appointments.map((r) => ({
    'Кіт': catMap[r.catId] ?? r.catId,
    'Назва': r.title,
    'Дата': formatDate(r.date),
    'Час': r.scheduledTime ?? '',
    'Статус': statusLabel[r.status] ?? r.status,
    'Ветеринар': r.vet ?? '',
    'Клініка': r.clinic ?? '',
    'Нотатки': r.notes ?? '',
    'Результати': r.doneNotes ?? '',
    'Фото': r.photoUrl ?? '',
    'Додано': formatDate(r.createdAt),
  }));

  // ── Sheet 6: Вага ──────────────────────────────────────────────
  const weightRows = weights.map((w) => ({
    'Кіт': catMap[w.catId] ?? w.catId,
    'Дата': formatDate(w.date),
    'Вага (кг)': w.weightKg,
    'Нотатки': w.notes ?? '',
    'Додано': formatDate(w.createdAt),
  }));

  // ── Build workbook ─────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Auto-width columns
  const autoWidth = (ws: XLSX.WorkSheet, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    ws['!cols'] = cols.map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
    }));
  };

  const addSheet = (name: string, rows: Record<string, unknown>[]) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    autoWidth(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet('Коти', catsRows);
  addSheet('Лікування', procedureRows);
  addSheet('Вакцинація', vaccinationRows);
  addSheet('Обробки', treatmentRows);
  addSheet('Прийоми', appointmentRows);
  addSheet('Вага', weightRows);

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `kotonosyky-${date}.xlsx`);
}
