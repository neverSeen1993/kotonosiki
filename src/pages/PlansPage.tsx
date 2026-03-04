import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecordsStore } from '../store/recordsStore';
import { useCatsStore } from '../store/catsStore';
import { isOverdue, isDueToday, isDueSoon, formatDate } from '../utils/dateUtils';
import RecordBadge from '../components/records/RecordBadge';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';
import { ChevronLeft, ChevronRight, AlertCircle, LayoutList, CalendarDays, Clock, Calendar } from 'lucide-react';

const UA_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const UA_DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

function toYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ViewMode = 'list' | 'calendar';

export default function PlansPage() {
  const { records } = useRecordsStore();
  const { getCatById } = useCatsStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toYMD(today);

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const allPlanned = records
    .filter((r) =>
      (r.status === 'scheduled' && r.type !== 'appointment') ||
      (r.nextDueDate && (r.type === 'vaccination' || r.type === 'treatment'))
    )
    .map((r) => ({
      ...r,
      _planDate: r.nextDueDate && (r.type === 'vaccination' || r.type === 'treatment')
        ? r.nextDueDate
        : r.date,
    }))
    .sort((a, b) => a._planDate.localeCompare(b._planDate));

  const byDate: Record<string, typeof allPlanned> = {};
  for (const r of allPlanned) {
    if (!byDate[r._planDate]) byDate[r._planDate] = [];
    byDate[r._planDate].push(r);
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? new Date(year, month, dayNum) : null);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const overdueItems = allPlanned.filter((r) => isOverdue(r._planDate));

  const overdue = allPlanned.filter((r) => isOverdue(r._planDate));
  const todayItems = allPlanned.filter((r) => isDueToday(r._planDate));
  const soon = allPlanned.filter((r) => isDueSoon(r._planDate, 7) && !isDueToday(r._planDate));
  const future = allPlanned.filter((r) => !isOverdue(r._planDate) && !isDueToday(r._planDate) && !isDueSoon(r._planDate, 7));

  const ListSection = ({ title, items, icon, highlight }: {
    title: string;
    items: typeof allPlanned;
    icon: React.ReactNode;
    highlight?: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${highlight ?? 'text-gray-600'}`}>
          {icon}{title}
          <span className="ml-1 text-xs font-normal opacity-70">({items.length})</span>
        </div>
        <div className="space-y-2">
          {items.map((record) => {
            const cat = getCatById(record.catId);
            return (
              <div key={record.id} className={`card flex items-center gap-4 px-4 py-3 ${
                isOverdue(record._planDate) ? 'border-red-200 bg-red-50/50' :
                isDueToday(record._planDate) ? 'border-amber-200 bg-amber-50/50' : ''
              }`}>
                {cat ? (
                  <Link to={`/cats/${cat.id}`}><CatAvatar cat={cat} size="sm" /></Link>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{record.title}</p>
                  {cat && <Link to={`/cats/${cat.id}`} className="text-xs text-teal-600 hover:underline">{cat.name}</Link>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{formatDate(record._planDate)}</p>
                </div>
                <RecordBadge type={record.type} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">План процедур</h1>
          <p className="text-sm text-gray-400 mt-0.5">{allPlanned.length} запланован{allPlanned.length === 1 ? 'ий' : 'их'} запис{allPlanned.length === 1 ? '' : 'ів'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {overdueItems.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <AlertCircle size={15} /> Прострочено: {overdueItems.length}
            </div>
          )}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList size={15} /> Список
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays size={15} /> Календар
            </button>
          </div>
        </div>
      </div>

      {allPlanned.length === 0 ? (
        <EmptyState
          title="Запланованих процедур немає"
          description="Заплановані процедури, обробки та вакцинації з'являться тут автоматично."
        />
      ) : viewMode === 'list' ? (
        <>
          <ListSection title="Прострочені" items={overdue} icon={<AlertCircle size={16} />} highlight="text-red-600" />
          <ListSection title="Сьогодні" items={todayItems} icon={<Clock size={16} />} highlight="text-amber-600" />
          <ListSection title="Цього тижня" items={soon} icon={<Calendar size={16} />} highlight="text-teal-600" />
          <ListSection title="Майбутні" items={future} icon={<Calendar size={16} />} />
        </>
      ) : (
        <div>
          <div className="card p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronLeft size={18} /></button>
              <h2 className="font-semibold text-gray-800">{UA_MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronRight size={18} /></button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {UA_DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="min-h-[80px]" />;
                const ymd = toYMD(date);
                const events = byDate[ymd] ?? [];
                const isToday = ymd === todayStr;

                return (
                  <div
                    key={ymd}
                    className={`min-h-[80px] rounded-xl p-1.5 transition border ${
                      isToday
                        ? 'border-teal-200 bg-teal-50/50'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-teal-500 text-white' : 'text-gray-500'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {events.map((record) => {
                        const cat = getCatById(record.catId);
                        const typeColors: Record<string, string> = {
                          vaccination: 'bg-green-100 text-green-700',
                          treatment: 'bg-orange-100 text-orange-700',
                          appointment: 'bg-purple-100 text-purple-700',
                          procedure: 'bg-blue-100 text-blue-700',
                          surgery: 'bg-red-100 text-red-700',
                        };
                        const typeLabels: Record<string, string> = {
                          vaccination: 'Вакцинація',
                          treatment: 'Обробка',
                          appointment: 'Запис',
                          procedure: 'Лікування',
                          surgery: 'Операція',
                        };
                        const isRecordOverdue = isOverdue(record._planDate);
                        return (
                          <div
                            key={record.id}
                            className={`rounded-md px-1 py-0.5 text-xs leading-tight ${
                              isRecordOverdue
                                ? 'bg-red-100 text-red-700'
                                : typeColors[record.type] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <div className="font-medium truncate">{cat?.name ?? '—'}</div>
                            <div className="opacity-75 truncate">{typeLabels[record.type] ?? record.type}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded bg-green-100 border border-green-300" /> Вакцинація</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded bg-orange-100 border border-orange-300" /> Обробка</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded bg-purple-100 border border-purple-300" /> Запис</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded bg-blue-100 border border-blue-300" /> Лікування</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded bg-red-100 border border-red-300" /> Прострочено / Операція</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
