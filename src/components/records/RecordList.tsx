import { useState } from 'react';
import { MedicalRecord, RecordType } from '../../types';
import { useRecordsStore } from '../../store/recordsStore';
import { formatDate } from '../../utils/dateUtils';
import RecordBadge from './RecordBadge';
import RecordForm from './RecordForm';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { Edit2, Trash2, Plus, ChevronDown, ChevronUp, MapPin, User } from 'lucide-react';

interface RecordListProps {
  catId: string;
  type: RecordType;
}

const typeLabels: Record<RecordType, string> = {
  procedure: 'Процедури',
  vaccination: 'Вакцинації',
  appointment: 'Прийоми',
};

const emptyMessages: Record<RecordType, { title: string; description: string }> = {
  procedure: { title: 'Процедур ще немає', description: 'Додайте медичні процедури: операції, лікування або огляди.' },
  vaccination: { title: 'Вакцинацій ще немає', description: 'Відстежуйте щеплення та нагадування про бустери.' },
  appointment: { title: 'Прийомів ще немає', description: 'Заплануйте майбутні візити до ветеринара.' },
};

export default function RecordList({ catId, type }: RecordListProps) {
  const { getRecordsByCatAndType, addRecord, updateRecord, deleteRecord } = useRecordsStore();
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const records = getRecordsByCatAndType(catId, type);
  const empty = emptyMessages[type];

  const handleAdd = (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => {
    addRecord(data);
    setShowForm(false);
  };

  const handleEdit = (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, data);
      setEditRecord(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Видалити цей запис?')) deleteRecord(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{typeLabels[type]}</h3>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-1.5 px-3">
          <Plus size={15} /> Додати
        </button>
      </div>

      {records.length === 0 ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus size={15} /> Додати перший запис
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const isOpen = expanded === record.id;
            return (
              <div key={record.id} className="card">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isOpen ? null : record.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{record.title}</span>
                      <RecordBadge status={record.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(record.date)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditRecord(record); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition"
                      aria-label="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-3 pt-0 border-t border-gray-100 text-sm text-gray-600 space-y-1">
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
                        Наступна дата: {formatDate(record.nextDueDate)}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{record.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={`Додати ${typeLabels[type].slice(0, -1).toLowerCase()}`} onClose={() => setShowForm(false)}>
          <RecordForm
            catId={catId}
            defaultType={type}
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
            initialData={editRecord}
            onSubmit={handleEdit}
            onCancel={() => setEditRecord(null)}
          />
        </Modal>
      )}
    </div>
  );
}
