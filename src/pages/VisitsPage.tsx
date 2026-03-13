import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVisitStore } from '../store/visitStore';
import { useCatsStore } from '../store/catsStore';
import { Visit } from '../types';
import { formatDate } from '../utils/dateUtils';
import { isOverdue, isDueToday, isDueSoon } from '../utils/dateUtils';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import {
  Users, Plus, List, CalendarDays, ChevronLeft, ChevronRight,
  AlertCircle, Clock, Calendar, Pencil, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday as isCalToday } from 'date-fns';
import { uk } from 'date-fns/locale';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const statusLabel: Record<Visit['status'], string> = {
  planned: 'Заплановано',
  done: 'Виконано',
  cancelled: 'Скасовано',
};
const statusClass: Record<Visit['status'], string> = {
  planned: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

// ── Visit form ───────────────────────────────────────────────────────────────

function VisitForm({
  initial,
  cats,
  onSubmit,
  onClose,
}: {
  initial?: Visit;
  cats: { id: string; name: string }[];
  onSubmit: (data: Omit<Visit, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initial?.time ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [visitor, setVisitor] = useState(initial?.visitor ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [catId, setCatId] = useState(initial?.catId ?? '');
  const [status, setStatus] = useState<Visit['status']>(initial?.status ?? 'planned');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSubmit({
      title: title.trim(),
      date,
      time: time || undefined,
      description: description.trim() || undefined,
      visitor: visitor.trim() || undefined,
      phone: phone.trim() || undefined,
      catId: catId || undefined,
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal title={initial ? 'Редагувати відвідування' : 'Нове відвідування'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Назва *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Дата *</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Час</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Відвідувач</label>
          <input className="input" value={visitor} onChange={(e) => setVisitor(e.target.value)} placeholder="Ім'я відвідувача" />
        </div>
        <div>
          <label className="label">Телефон</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." />
        </div>
        <div>
          <label className="label">Котик</label>
          <select className="input" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">— не вказано —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Опис</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Нотатки</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {initial && (
          <div>
            <label className="label">Статус</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Visit['status'])}>
              <option value="planned">Заплановано</option>
              <option value="done">Виконано</option>
              <option value="cancelled">Скасовано</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Скасувати</button>
          <button type="submit" className="btn-primary">
            {initial ? 'Зберегти' : 'Додати'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function VisitsPage() {
  const { visits, addVisit, updateVisit, deleteVisit } = useVisitStore();
  const { cats, getCatById } = useCatsStore();
  const { canEdit } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Visit | null>(null);

  const planned = visits
    .filter((v) => v.status === 'planned')
    .sort((a, b) => a.date.localeCompare(b.date));

  const all = [...visits].sort((a, b) => a.date.localeCompare(b.date));

  const overdue = planned.filter((v) => isOverdue(v.date));
  const today = planned.filter((v) => isDueToday(v.date));
  const soon = planned.filter((v) => isDueSoon(v.date, 7) && !isDueToday(v.date));
  const future = planned.filter((v) => !isOverdue(v.date) && !isDueToday(v.date) && !isDueSoon(v.date, 7));
  const done = visits.filter((v) => v.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
  const cancelled = visits.filter((v) => v.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = async (data: Omit<Visit, 'id' | 'createdAt'>) => {
    await addVisit(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Visit, 'id' | 'createdAt'>) => {
    if (editVisit) {
      await updateVisit(editVisit.id, data);
      setEditVisit(null);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteVisit(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const catList = cats
    .filter((c) => !c.adoption?.date)
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Card renderer ─────────────────────────────────────────────────────────

  const renderCard = (visit: Visit) => {
    const cat = visit.catId ? getCatById(visit.catId) : undefined;
    return (
      <div key={visit.id} className={`card flex items-center gap-4 px-4 py-3 ${
        visit.status === 'planned' && isOverdue(visit.date) ? 'border-red-200 bg-red-50/50' :
        visit.status === 'planned' && isDueToday(visit.date) ? 'border-amber-200 bg-amber-50/50' : ''
      }`}>
        {cat ? (
          <Link to={`/cats/${cat.id}`}>
            <CatAvatar cat={cat} size="sm" />
          </Link>
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
            <Users size={18} className="text-teal-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{visit.title}</p>
          {visit.visitor && <p className="text-xs text-gray-500">{visit.visitor}{visit.phone && ` · ${visit.phone}`}</p>}
          {cat && (
            <Link to={`/cats/${cat.id}`} className="text-xs text-teal-600 hover:underline">
              {cat.name}
            </Link>
          )}
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs text-gray-500">{formatDate(visit.date)}</p>
          {visit.time && <p className="text-xs font-medium text-gray-600">{visit.time}</p>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[visit.status]}`}>
          {statusLabel[visit.status]}
        </span>
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            {visit.status === 'planned' && (
              <button
                onClick={() => updateVisit(visit.id, { status: 'done' })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                title="Позначити виконаним"
              >
                <CheckCircle size={16} />
              </button>
            )}
            {visit.status === 'planned' && (
              <button
                onClick={() => updateVisit(visit.id, { status: 'cancelled' })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition"
                title="Скасувати"
              >
                <XCircle size={16} />
              </button>
            )}
            <button
              onClick={() => setEditVisit(visit)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Редагувати"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setConfirmDelete(visit)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Видалити"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Calendar ──────────────────────────────────────────────────────────────

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const visitsByDate = all.reduce<Record<string, Visit[]>>((acc, v) => {
    acc[v.date] = acc[v.date] ? [...acc[v.date], v] : [v];
    return acc;
  }, {});

  const calStatusDot: Record<Visit['status'], string> = {
    planned: 'bg-amber-400',
    done: 'bg-green-400',
    cancelled: 'bg-gray-300',
  };

  // ── Sections helper ───────────────────────────────────────────────────────

  const Section = ({
    title,
    items,
    icon,
    highlight,
  }: {
    title: string;
    items: Visit[];
    icon: React.ReactNode;
    highlight?: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${highlight ?? 'text-gray-600'}`}>
          {icon}
          {title}
          <span className="ml-1 text-xs font-normal opacity-70">({items.length})</span>
        </div>
        <div className="space-y-2">{items.map(renderCard)}</div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Графік відвідувань</h1>
          <p className="text-sm text-gray-400 mt-0.5">{planned.length} заплановано</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={15} /> Список
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays size={15} /> Календар
            </button>
          </div>
          {canEdit && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Додати
            </button>
          )}
        </div>
      </div>

      {visits.length === 0 ? (
        <EmptyState
          title="Відвідувань поки немає"
          description="Додайте перше відвідування, натиснувши кнопку «Додати»."
        />
      ) : view === 'list' ? (
        <>
          <Section title="Прострочені" items={overdue} icon={<AlertCircle size={16} />} highlight="text-red-600" />
          <Section title="Сьогодні" items={today} icon={<Clock size={16} />} highlight="text-amber-600" />
          <Section title="Цього тижня" items={soon} icon={<Calendar size={16} />} highlight="text-teal-600" />
          <Section title="Майбутні" items={future} icon={<Calendar size={16} />} />
          {done.length > 0 && <Section title="Виконані" items={done} icon={<CheckCircle size={16} />} highlight="text-green-600" />}
          {cancelled.length > 0 && <Section title="Скасовані" items={cancelled} icon={<XCircle size={16} />} highlight="text-gray-400" />}
        </>
      ) : (
        /* ── CALENDAR ── */
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
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

          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {calDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayVisits = visitsByDate[key] ?? [];
              const inMonth = isSameMonth(day, calMonth);
              const todayDay = isCalToday(day);
              return (
                <div key={key} className={`min-h-[80px] p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    todayDay ? 'bg-teal-500 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayVisits.map((v) => {
                      const cat = v.catId ? getCatById(v.catId) : undefined;
                      return (
                        <button
                          key={v.id}
                          onClick={() => canEdit ? setEditVisit(v) : undefined}
                          className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight truncate hover:opacity-80 transition text-left ${
                            v.status === 'done' ? 'bg-green-100 text-green-700' :
                            v.status === 'cancelled' ? 'bg-gray-100 text-gray-400 line-through' :
                            'bg-amber-100 text-amber-700'
                          }`}
                          title={`${v.title}${v.visitor ? ` — ${v.visitor}` : ''}${cat ? ` (${cat.name})` : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${calStatusDot[v.status]}`} />
                          <span className="truncate">
                            {v.time ? `${v.time} ` : ''}{v.title}
                            {cat ? ` · ${cat.name}` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <VisitForm cats={catList} onSubmit={handleAdd} onClose={() => setShowForm(false)} />
      )}

      {/* Edit form */}
      {editVisit && (
        <VisitForm initial={editVisit} cats={catList} onSubmit={handleEdit} onClose={() => setEditVisit(null)} />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Видалити відвідування?" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-sm text-gray-600 mb-4">
            Ви впевнені, що хочете видалити <strong>«{confirmDelete.title}»</strong>?
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
