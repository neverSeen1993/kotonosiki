import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecordsStore } from '../store/recordsStore';
import { useCatsStore } from '../store/catsStore';
import { MedicalRecord } from '../types';
import { formatDate } from '../utils/dateUtils';
import { isOverdue, isDueToday, isDueSoon } from '../utils/dateUtils';
import RecordBadge from '../components/records/RecordBadge';
import MarkDoneModal from '../components/records/MarkDoneModal';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';
import { Calendar, AlertCircle, Clock, CheckCircle, FolderOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AppointmentsPage() {
  const { records, updateRecord } = useRecordsStore();
  const { getCatById } = useCatsStore();
  const { canEdit } = useAuth();
  const [markDoneRecord, setMarkDoneRecord] = useState<MedicalRecord | null>(null);

  const handleMarkDone = async (notes?: string, photoUrl?: string) => {
    if (markDoneRecord) {
      await updateRecord(markDoneRecord.id, { status: 'done', doneNotes: notes, photoUrl });
      setMarkDoneRecord(null);
    }
  };

  // Include overdue (past scheduled appointments)
  const allScheduled = records
    .filter((r) => r.type === 'appointment' && r.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));

  const overdue = allScheduled.filter((r) => isOverdue(r.date));
  const today = allScheduled.filter((r) => isDueToday(r.date));
  const soon = allScheduled.filter((r) => isDueSoon(r.date, 7) && !isDueToday(r.date));
  const future = allScheduled.filter((r) => !isOverdue(r.date) && !isDueToday(r.date) && !isDueSoon(r.date, 7));

  const Section = ({
    title,
    items,
    icon,
    highlight,
  }: {
    title: string;
    items: typeof allScheduled;
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
        <div className="space-y-2">
          {items.map((record) => {
            const cat = getCatById(record.catId);
            return (
              <div
                key={record.id}
                className={`card flex items-center gap-4 px-4 py-3 ${
                  isOverdue(record.date) ? 'border-red-200 bg-red-50/50' : isDueToday(record.date) ? 'border-amber-200 bg-amber-50/50' : ''
                }`}
              >
                {cat ? (
                  <Link to={`/cats/${cat.id}`}>
                    <CatAvatar cat={cat} size="sm" />
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{record.title}</p>
                  {cat && (
                    <Link to={`/cats/${cat.id}`} className="text-xs text-teal-600 hover:underline">
                      {cat.name}
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDate(record.date)}
                    {record.scheduledTime && <span className="ml-1.5 font-medium text-gray-600">{record.scheduledTime}</span>}
                  </p>
                  {record.vet && <p className="text-xs text-gray-400">{record.vet}</p>}
                </div>
                <RecordBadge status={record.status} />
                {cat?.driveUrl && (
                  <a
                    href={cat.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition shrink-0"
                    title="Відкрити Google Drive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderOpen size={17} />
                  </a>
                )}
                {canEdit && (() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const isToday = record.date === today;
                  return (
                    <button
                      onClick={() => { if (isToday) setMarkDoneRecord(record); }}
                      disabled={!isToday}
                      className={`p-1.5 rounded-lg transition shrink-0 ${isToday ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-200 cursor-not-allowed'}`}
                      title={isToday ? 'Позначити виконаним' : `Можна позначити виконаним лише в день запису (${formatDate(record.date)})`}
                    >
                      <CheckCircle size={17} />
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Прийоми</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allScheduled.length} запланован{allScheduled.length === 1 ? 'ий' : 'их'} прийом{allScheduled.length === 1 ? '' : 'ів'}</p>
      </div>

      {allScheduled.length === 0 ? (
        <EmptyState
          title="Запланованих прийомів немає"
          description="Прийоми, додані у профілях котів, з'являться тут."
        />
      ) : (
        <>
          <Section
            title="Прострочені"
            items={overdue}
            icon={<AlertCircle size={16} />}
            highlight="text-red-600"
          />
          <Section
            title="Сьогодні"
            items={today}
            icon={<Clock size={16} />}
            highlight="text-amber-600"
          />
          <Section
            title="Цього тижня"
            items={soon}
            icon={<Calendar size={16} />}
            highlight="text-teal-600"
          />
          <Section
            title="Майбутні"
            items={future}
            icon={<Calendar size={16} />}
          />
        </>
      )}
      {markDoneRecord && (
        <MarkDoneModal
          recordTitle={markDoneRecord.title}
          initialNotes={markDoneRecord.notes}
          initialPhotoUrl={markDoneRecord.photoUrl}
          driveUrl={getCatById(markDoneRecord.catId)?.driveUrl}
          onConfirm={handleMarkDone}
          onClose={() => setMarkDoneRecord(null)}
        />
      )}
    </div>
  );
}
