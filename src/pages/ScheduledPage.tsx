import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecordsStore } from '../store/recordsStore';
import { useCatsStore } from '../store/catsStore';
import { formatDate } from '../utils/dateUtils';
import RecordBadge from '../components/records/RecordBadge';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';
import { CatLocation, MedicalRecord } from '../types';
import { Syringe, Bug, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';
import { uk } from 'date-fns/locale';

const locationLabel: Record<CatLocation | 'unknown', string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
  unknown: 'Місце невідоме',
};

const locationOrder: (CatLocation | 'unknown')[] = [
  'big_room', 'quarantine', 'kids_room', 'foster_home', 'unknown',
];

const typeIcon: Record<string, React.ReactNode> = {
  vaccination: <Syringe size={13} className="text-green-500 shrink-0" />,
  treatment: <Bug size={13} className="text-blue-500 shrink-0" />,
};

const typeLabel: Record<string, string> = {
  vaccination: 'Вакцинація',
  treatment: 'Обробка',
};

const typeChipClass: Record<string, string> = {
  vaccination: 'bg-green-100 text-green-700',
  treatment: 'bg-blue-100 text-blue-700',
};

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export default function ScheduledPage() {
  const { records } = useRecordsStore();
  const { getCatById } = useCatsStore();
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [calMonth, setCalMonth] = useState(() => new Date());

  const all = records
    .filter((r) => ['vaccination', 'treatment'].includes(r.type) && r.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  const grouped = locationOrder.reduce<Record<string, typeof all>>((acc, loc) => {
    acc[loc] = all.filter((r) => (getCatById(r.catId)?.location ?? 'unknown') === loc);
    return acc;
  }, {});

  const renderCard = (record: MedicalRecord) => {
    const cat = getCatById(record.catId);
    const cardContent = (
      <>
        {cat ? <CatAvatar cat={cat} size="sm" /> : <div className="w-10 h-10 rounded-full bg-gray-100" />}
        <div className="flex-1 min-w-0">
          {cat && <p className="font-medium text-gray-800 text-sm">{cat.name}</p>}
          <div className="flex items-center gap-1.5 mt-0.5">
            {typeIcon[record.type]}
            <p className="text-xs text-teal-600">{record.title}</p>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
          <p className="text-xs text-gray-400">{typeLabel[record.type]}</p>
        </div>
        <RecordBadge status={record.status} />
      </>
    );
    return cat ? (
      <Link key={record.id} to={`/cats/${cat.id}`} className="card flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-gray-50 transition">
        {cardContent}
      </Link>
    ) : (
      <div key={record.id} className="card flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3">{cardContent}</div>
    );
  };

  // ── CALENDAR VIEW ──────────────────────────────────────────────────────────

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const recordsByDate = all.reduce<Record<string, MedicalRecord[]>>((acc, r) => {
    acc[r.date] = acc[r.date] ? [...acc[r.date], r] : [r];
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Заплановані маніпуляції</h1>
          <p className="text-sm text-gray-400 mt-0.5">{all.length} запис{all.length === 1 ? '' : 'ів'}</p>
        </div>
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
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="Запланованих маніпуляцій немає"
          description="Заплановані вакцинації та обробки з'являться тут."
        />
      ) : view === 'list' ? (
        // ── LIST ──
        <div className="space-y-6">
          {locationOrder.map((loc) => {
            const group = grouped[loc];
            if (!group || group.length === 0) return null;
            return (
              <div key={loc}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {locationLabel[loc]}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{group.length}</span>
                </div>
                <div className="space-y-2">{group.map(renderCard)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        // ── CALENDAR ──
        <div className="card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
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
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
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
              const dayRecords = recordsByDate[key] ?? [];
              const inMonth = isSameMonth(day, calMonth);
              const todayDay = isToday(day);
              return (
                <div key={key} className={`min-h-[60px] md:min-h-[80px] p-1 md:p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className={`text-[10px] md:text-xs font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full mb-0.5 md:mb-1 ${
                    todayDay ? 'bg-teal-500 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayRecords.map((r) => {
                      const cat = getCatById(r.catId);
                      return (
                        <Link
                          key={r.id}
                          to={cat ? `/cats/${cat.id}` : '#'}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight truncate ${typeChipClass[r.type] ?? 'bg-gray-100 text-gray-600'} hover:opacity-80 transition`}
                          title={`${cat?.name ?? ''} — ${r.title}`}
                        >
                          {typeIcon[r.type]}
                          <span className="truncate">{cat?.name ?? r.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
