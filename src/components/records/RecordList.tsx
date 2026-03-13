import { useState } from 'react';
import { MedicalRecord, RecordType } from '../../types';
import { useRecordsStore } from '../../store/recordsStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';
import RecordBadge from './RecordBadge';
import RecordForm from './RecordForm';
import MarkDoneModal from './MarkDoneModal';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { Edit2, Trash2, Plus, ChevronDown, ChevronUp, MapPin, User, CheckCircle } from 'lucide-react';

interface RecordListProps {
  catId: string;
  type: RecordType;
  catBirthDate?: string;
}

const typeLabels: Record<RecordType, string> = {
  procedure: 'Лікування',
  vaccination: 'Вакцинації',
  appointment: 'Прийоми',
  treatment: 'Обробки',
  surgery: 'Операції',
};

const addTitles: Record<RecordType, string> = {
  procedure: 'Додати лікування',
  vaccination: 'Додати вакцинацію',
  appointment: 'Додати прийом',
  treatment: 'Додати обробку',
  surgery: 'Додати операцію',
};

const emptyMessages: Record<RecordType, { title: string; description: string }> = {
  procedure: { title: 'Лікування ще немає', description: 'Додайте записи про лікування: операції, процедури або огляди.' },
  vaccination: { title: 'Вакцинацій ще немає', description: 'Відстежуйте щеплення та нагадування про бустери.' },
  appointment: { title: 'Прийомів ще немає', description: 'Заплануйте майбутні візити до ветеринара.' },
  treatment: { title: 'Обробок ще немає', description: 'Додайте записи про обробки: від бліх, кліщів, глистів тощо.' },
  surgery: { title: 'Операцій ще немає', description: 'Додайте записи про хірургічні втручання.' },
};

export default function RecordList({ catId, type, catBirthDate }: RecordListProps) {
  const { getRecordsByCatAndType, getRecordsByCat, addRecord, updateRecord, deleteRecord } = useRecordsStore();
  const { canEdit } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [markDoneRecord, setMarkDoneRecord] = useState<MedicalRecord | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const records = getRecordsByCatAndType(catId, type);
  const empty = emptyMessages[type];

  const handleAdd = async (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => {
    await addRecord(data);
    // Auto-create a scheduled vaccination for the next due date
    if (data.type === 'vaccination' && data.nextDueDate) {
      await addRecord({
        catId: data.catId,
        type: 'vaccination',
        title: data.title,
        date: data.nextDueDate,
        status: 'scheduled',
      });
    }
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => {
    if (editRecord) {
      await updateRecord(editRecord.id, data);
      // Auto-create a scheduled vaccination for the next due date if it changed
      if (data.type === 'vaccination' && data.nextDueDate && data.nextDueDate !== editRecord.nextDueDate) {
        await addRecord({
          catId: data.catId,
          type: 'vaccination',
          title: data.title,
          date: data.nextDueDate,
          status: 'scheduled',
        });
      }
      setEditRecord(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити цей запис?')) return;
    const record = records.find((r) => r.id === id);
    await deleteRecord(id);
    // Also delete the linked scheduled vaccination if one exists with matching date
    if (record?.type === 'vaccination' && record.nextDueDate) {
      const allCatRecords = getRecordsByCat(catId);
      const linked = allCatRecords.find(
        (r) => r.type === 'vaccination' &&
               r.status === 'scheduled' &&
               r.date === record.nextDueDate &&
               r.title === record.title &&
               r.id !== id
      );
      if (linked) await deleteRecord(linked.id);
    }
  };

  const handleMarkDone = async (notes?: string, photoUrl?: string) => {
    if (markDoneRecord) {
      await updateRecord(markDoneRecord.id, { status: 'done', doneNotes: notes, photoUrl });
      setMarkDoneRecord(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{typeLabels[type]}</h3>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-1.5 px-3">
            <Plus size={15} /> Додати
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={
            canEdit ? (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                <Plus size={15} /> Додати перший запис
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const isOpen = expanded === record.id;
            return (
              <div key={record.id} className="card">
                <div
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isOpen ? null : record.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{record.title}</span>
                      <RecordBadge status={record.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {record.type === 'procedure'
                        ? <>
                            <span>Початок: {formatDate(record.date)}</span>
                            {record.dateEnd && <span className="ml-3">Кінець: {formatDate(record.dateEnd)}</span>}
                          </>
                        : record.type === 'appointment'
                        ? <>{formatDate(record.date)}{record.scheduledTime && <span className="ml-2 font-medium text-gray-500">{record.scheduledTime}</span>}</>
                        : formatDate(record.date)
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        {type === 'appointment' && record.status === 'scheduled' && (() => {
                          const today = new Date().toISOString().slice(0, 10);
                          const isToday = record.date === today;
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (isToday) setMarkDoneRecord(record); }}
                              disabled={!isToday}
                              className={`p-1.5 rounded-lg transition ${isToday ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-200 cursor-not-allowed'}`}
                              aria-label="Позначити виконаним"
                              title={isToday ? 'Позначити виконаним' : `Можна позначити виконаним лише в день запису (${formatDate(record.date)})`}
                            >
                              <CheckCircle size={15} />
                            </button>
                          );
                        })()}
                        {type === 'procedure' && record.status === 'ongoing' && (() => {
                          const today = new Date().toISOString().slice(0, 10);
                          const checkDate = record.dateEnd ?? record.date;
                          const canComplete = today >= checkDate;
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (canComplete) setMarkDoneRecord(record); }}
                              disabled={!canComplete}
                              className={`p-1.5 rounded-lg transition ${canComplete ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-200 cursor-not-allowed'}`}
                              aria-label="Позначити виконаним"
                              title={canComplete ? 'Позначити виконаним' : `Лікування завершується ${formatDate(checkDate)}`}
                            >
                              <CheckCircle size={15} />
                            </button>
                          );
                        })()}
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditRecord(record); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition"
                          aria-label="Редагувати"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          aria-label="Видалити"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-3 pt-0 border-t border-gray-100 text-sm text-gray-600 space-y-1">
                    {record.description && (
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{record.description}</p>
                    )}
                    {record.drug && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Препарат:</span> {record.drug}</p>
                    )}
                    {record.dosage && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Дозування:</span> {record.dosage}</p>
                    )}
                    {record.special && (
                      <p className="text-xs text-gray-500 whitespace-pre-wrap"><span className="font-medium">Особливості:</span> {record.special}</p>
                    )}
                    {record.vet && (
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        <span>{record.vet}</span>
                      </div>
                    )}
                    {record.clinic && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-gray-400" />
                        <span>{record.clinic}</span>
                      </div>
                    )}
                    {record.nextDueDate && (
                      <p className="text-xs text-amber-600">
                        Наступна вакцинація: {formatDate(record.nextDueDate)}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{record.notes}</p>
                    )}
                    {record.doneNotes && (
                      <div className="mt-1 bg-green-50 rounded-lg px-2 py-1.5">
                        <p className="text-xs font-semibold text-green-600 mb-0.5">Результати</p>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{record.doneNotes}</p>
                      </div>
                    )}
                    {record.photoUrl && (() => {
                      let src = record.photoUrl;
                      const match = src.match(/(?:\/d\/|id=|uc\?id=)([a-zA-Z0-9_-]{25,})/);
                      if (match) src = `https://lh3.googleusercontent.com/d/${match[1]}=s800`;
                      return (
                        <a href={record.photoUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                          <img
                            src={src}
                            alt="Фото"
                            className="rounded-lg max-h-48 object-cover border border-gray-100"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const link = document.createElement('a');
                              link.href = record.photoUrl!;
                              link.target = '_blank';
                              link.className = 'inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-1';
                              link.textContent = '📎 Фото';
                              img.parentElement?.appendChild(link);
                            }}
                          />
                        </a>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {markDoneRecord && (
        <MarkDoneModal
          recordTitle={markDoneRecord.title}
          initialNotes={markDoneRecord.notes}
          initialPhotoUrl={markDoneRecord.photoUrl}
          onConfirm={handleMarkDone}
          onClose={() => setMarkDoneRecord(null)}
        />
      )}

      {showForm && (
        <Modal title={addTitles[type]} onClose={() => setShowForm(false)}>
          <RecordForm
            catId={catId}
            defaultType={type}
            catBirthDate={catBirthDate}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editRecord && (
        <Modal title="Редагувати запис" onClose={() => setEditRecord(null)}>
          <RecordForm
            catId={catId}
            defaultType={type}
            catBirthDate={catBirthDate}
            initialData={editRecord}
            onSubmit={handleEdit}
            onCancel={() => setEditRecord(null)}
          />
        </Modal>
      )}
    </div>
  );
}
