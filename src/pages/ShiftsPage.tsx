import { useState, useMemo } from 'react';
import { useShiftStore } from '../store/shiftStore';
import { Shift, ShiftType } from '../types';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Clock,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
} from 'date-fns';
import { uk } from 'date-fns/locale';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const shiftLabel: Record<ShiftType, string> = { half: '½ зміни (4 год)', full: 'Повна зміна (8 год)' };
const shiftShort: Record<ShiftType, string> = { half: '½', full: '●' };
const shiftHours: Record<ShiftType, number> = { half: 4, full: 8 };

// Generate a stable color from a name string
function nannyColor(name: string): string {
  const colors = [
    'bg-teal-200 text-teal-800',
    'bg-amber-200 text-amber-800',
    'bg-rose-200 text-rose-800',
    'bg-indigo-200 text-indigo-800',
    'bg-lime-200 text-lime-800',
    'bg-purple-200 text-purple-800',
    'bg-sky-200 text-sky-800',
    'bg-orange-200 text-orange-800',
    'bg-pink-200 text-pink-800',
    'bg-emerald-200 text-emerald-800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Shift form ───────────────────────────────────────────────────────────────

function ShiftForm({
  initial,
  initialDate,
  knownNannies,
  onSubmit,
  onClose,
  onDelete,
}: {
  initial?: Shift;
  initialDate?: string;
  knownNannies: string[];
  onSubmit: (data: Omit<Shift, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [nannyName, setNannyName] = useState(initial?.nannyName ?? '');
  const [date, setDate] = useState(initial?.date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<ShiftType>(initial?.type ?? 'full');
  const [extraHours, setExtraHours] = useState(initial?.extraHours?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nannyName.trim() || !date) return;
    onSubmit({
      nannyName: nannyName.trim(),
      date,
      type,
      extraHours: extraHours ? parseFloat(extraHours) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal title={initial ? 'Редагувати зміну' : 'Додати зміну'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Котоняня *</label>
          <input
            list="nanny-list"
            className="input"
            value={nannyName}
            onChange={(e) => setNannyName(e.target.value)}
            placeholder="Ім'я котоняні"
            required
            autoFocus
          />
          <datalist id="nanny-list">
            {knownNannies.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>
        <div>
          <label className="label">Дата *</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Тип зміни</label>
          <div className="flex gap-3 mt-1">
            <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition ${type === 'half' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="type" value="half" checked={type === 'half'} onChange={() => setType('half')} className="sr-only" />
              <Clock size={16} className={type === 'half' ? 'text-teal-600' : 'text-gray-400'} />
              <div>
                <p className={`text-sm font-medium ${type === 'half' ? 'text-teal-700' : 'text-gray-600'}`}>½ зміни</p>
                <p className="text-xs text-gray-400">4 години</p>
              </div>
            </label>
            <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition ${type === 'full' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="type" value="full" checked={type === 'full'} onChange={() => setType('full')} className="sr-only" />
              <Clock size={16} className={type === 'full' ? 'text-teal-600' : 'text-gray-400'} />
              <div>
                <p className={`text-sm font-medium ${type === 'full' ? 'text-teal-700' : 'text-gray-600'}`}>Повна зміна</p>
                <p className="text-xs text-gray-400">8 годин</p>
              </div>
            </label>
          </div>
        </div>
        <div>
          <label className="label">Додаткові години</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input"
            value={extraHours}
            onChange={(e) => setExtraHours(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">Нотатки</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-between gap-3 pt-2">
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
            >
              <Trash2 size={15} /> Видалити
            </button>
          ) : <div />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Скасувати</button>
            <button type="submit" className="btn-primary">{initial ? 'Зберегти' : 'Додати'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { shifts, addShift, updateShift, deleteShift } = useShiftStore();
  const { canEdit } = useAuth();
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Shift | null>(null);
  const [formDate, setFormDate] = useState<string | undefined>();

  // Known nanny names for autocomplete
  const knownNannies = useMemo(() => {
    const set = new Set(shifts.map((s) => s.nannyName));
    return [...set].sort();
  }, [shifts]);

  // ── Calendar setup ────────────────────────────────────────────────────────

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of shifts) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [shifts]);

  // ── Monthly totals per nanny ──────────────────────────────────────────────

  const monthKey = format(calMonth, 'yyyy-MM');
  const monthShifts = shifts.filter((s) => s.date.startsWith(monthKey));

  const totals = useMemo(() => {
    const map: Record<string, { halfCount: number; fullCount: number; extraHours: number; totalHours: number }> = {};
    for (const s of monthShifts) {
      if (!map[s.nannyName]) map[s.nannyName] = { halfCount: 0, fullCount: 0, extraHours: 0, totalHours: 0 };
      const entry = map[s.nannyName];
      if (s.type === 'half') entry.halfCount++;
      else entry.fullCount++;
      entry.extraHours += s.extraHours ?? 0;
      entry.totalHours += shiftHours[s.type] + (s.extraHours ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1].totalHours - a[1].totalHours);
  }, [monthShifts]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (data: Omit<Shift, 'id' | 'createdAt'>) => {
    await addShift(data);
    setShowForm(false);
    setFormDate(undefined);
  };

  const handleEdit = async (data: Omit<Shift, 'id' | 'createdAt'>) => {
    if (editShift) {
      await updateShift(editShift.id, data);
      setEditShift(null);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteShift(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (!canEdit) return;
    setFormDate(dateStr);
    setShowForm(true);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Графік котонянь</h1>
          <p className="text-sm text-gray-400 mt-0.5">{monthShifts.length} змін у {format(calMonth, 'LLLL', { locale: uk })}</p>
        </div>
        {canEdit && (
          <button onClick={() => { setFormDate(undefined); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">Додати</span> зміну
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden mb-6">
        {/* Month nav */}
        <div className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-gray-100">
          <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 capitalize">
              {format(calMonth, 'LLLL yyyy', { locale: uk })}
            </span>
            <button
              onClick={() => setCalMonth(new Date())}
              className="text-xs px-2 py-0.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition font-medium"
            >
              Сьогодні
            </button>
          </div>
          <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] md:text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {calDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayShifts = shiftsByDate[key] ?? [];
            const inMonth = isSameMonth(day, calMonth);
            const todayDay = isToday(day);
            return (
              <div
                key={key}
                className={`min-h-[60px] md:min-h-[90px] p-1 md:p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50'} ${canEdit ? 'cursor-pointer hover:bg-gray-50/80' : ''} transition`}
                onClick={() => handleDayClick(key)}
              >
                <div className={`text-[10px] md:text-xs font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full mb-0.5 md:mb-1 ${
                  todayDay ? 'bg-teal-500 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayShifts.map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canEdit) setEditShift(s);
                      }}
                      className={`w-full flex items-center gap-0.5 md:gap-1 px-1 md:px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-medium leading-tight truncate hover:opacity-80 transition text-left ${nannyColor(s.nannyName)}`}
                      title={`${s.nannyName} — ${shiftLabel[s.type]}${s.extraHours ? ` +${s.extraHours} год` : ''}`}
                    >
                      <span className="font-bold shrink-0">{shiftShort[s.type]}</span>
                      <span className="truncate">{s.nannyName}</span>
                      {s.extraHours ? <span className="shrink-0 opacity-70 hidden md:inline">+{s.extraHours}г</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals per nanny */}
      {totals.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Підсумок за {format(calMonth, 'LLLL yyyy', { locale: uk })}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-3 md:px-4 py-2 font-medium">Котоняня</th>
                  <th className="text-center px-1 md:px-2 py-2 font-medium">½</th>
                  <th className="text-center px-1 md:px-2 py-2 font-medium">Повних</th>
                  <th className="text-center px-1 md:px-2 py-2 font-medium hidden sm:table-cell">Додатково</th>
                  <th className="text-right px-3 md:px-4 py-2 font-medium">Годин</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {totals.map(([name, t]) => (
                  <tr key={name} className="hover:bg-gray-50 transition">
                    <td className="px-3 md:px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${nannyColor(name).split(' ')[0]}`} />
                        <span className="font-medium text-gray-700 truncate">{name}</span>
                      </div>
                    </td>
                    <td className="text-center px-1 md:px-2 py-2.5 text-gray-600">{t.halfCount || '—'}</td>
                    <td className="text-center px-1 md:px-2 py-2.5 text-gray-600">{t.fullCount || '—'}</td>
                    <td className="text-center px-1 md:px-2 py-2.5 text-gray-500 hidden sm:table-cell">{t.extraHours ? `+${t.extraHours} год` : '—'}</td>
                    <td className="text-right px-3 md:px-4 py-2.5 font-semibold text-teal-600">{t.totalHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Змін поки немає"
          description="Натисніть на день у календарі або кнопку «Додати зміну», щоб додати першу зміну."
        />
      )}

      {/* Add form */}
      {showForm && (
        <ShiftForm
          initialDate={formDate}
          knownNannies={knownNannies}
          onSubmit={handleAdd}
          onClose={() => { setShowForm(false); setFormDate(undefined); }}
        />
      )}

      {/* Edit form */}
      {editShift && (
        <ShiftForm
          initial={editShift}
          knownNannies={knownNannies}
          onSubmit={handleEdit}
          onClose={() => setEditShift(null)}
          onDelete={() => { setConfirmDelete(editShift); setEditShift(null); }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Видалити зміну?" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-sm text-gray-600 mb-4">
            Видалити зміну <strong>{confirmDelete.nannyName}</strong> за {format(new Date(confirmDelete.date + 'T00:00'), 'd MMMM yyyy', { locale: uk })}?
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Скасувати</button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
              onClick={handleDelete}
            >
              Видалити
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
