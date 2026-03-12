import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWeightStore } from '../../store/weightStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';
import { today } from '../../utils/dateUtils';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WeightEntry } from '../../types';

const schema = z.object({
  date: z.string().min(1, "Дата обов'язкова"),
  weightKg: z.coerce.number().positive('Вага має бути більше 0'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface WeightFormProps {
  catId: string;
  initialData?: WeightEntry;
  onSubmit: (data: Omit<WeightEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function WeightForm({ catId, initialData, onSubmit, onCancel }: WeightFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? { date: initialData.date, weightKg: initialData.weightKg, notes: initialData.notes ?? '' }
      : { date: today() },
  });

  return (
    <form onSubmit={handleSubmit((d) => onSubmit({ catId, date: d.date, weightKg: d.weightKg, notes: d.notes || undefined }))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Дата *</label>
          <input type="date" {...register('date')} className="input" />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="label">Вага (кг) *</label>
          <input type="number" step="0.01" min="0" {...register('weightKg')} className="input" placeholder="напр. 3.45" />
          {errors.weightKg && <p className="text-xs text-red-500 mt-1">{errors.weightKg.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Нотатки</label>
        <input {...register('notes')} className="input" placeholder="Додаткові нотатки..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Скасувати</button>
        <button type="submit" className="btn-primary">{initialData ? 'Зберегти зміни' : 'Додати запис'}</button>
      </div>
    </form>
  );
}

export default function WeightLog({ catId }: { catId: string }) {
  const { getWeightsByCat, addWeight, updateWeight, deleteWeight } = useWeightStore();
  const { canEdit } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<WeightEntry | null>(null);

  const entries = getWeightsByCat(catId);

  const handleAdd = async (data: Omit<WeightEntry, 'id' | 'createdAt'>) => {
    await addWeight(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<WeightEntry, 'id' | 'createdAt'>) => {
    if (editEntry) {
      await updateWeight(editEntry.id, data);
      setEditEntry(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Видалити цей запис ваги?')) await deleteWeight(id);
  };

  // Calculate trend between consecutive entries (sorted newest first)
  const getTrend = (index: number) => {
    if (index >= entries.length - 1) return null;
    return entries[index].weightKg - entries[index + 1].weightKg;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Вага</h3>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-1.5 px-3">
            <Plus size={15} /> Додати
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="Записів ваги ще немає"
          description="Відстежуйте динаміку ваги кота."
          action={canEdit ? (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus size={15} /> Додати перший запис
            </button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {/* Latest weight highlight */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <div className="text-3xl font-bold text-teal-600">{entries[0].weightKg} кг</div>
            <div className="text-xs text-teal-500">Остання відмітка<br />{formatDate(entries[0].date)}</div>
          </div>

          {entries.map((entry, index) => {
            const trend = getTrend(index);
            return (
              <div key={entry.id} className="card flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{entry.weightKg} кг</span>
                    {trend !== null && (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                        {trend > 0 ? '+' : ''}{trend.toFixed(2)} кг
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.date)}</p>
                  {entry.notes && <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditEntry(entry)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Додати вагу" onClose={() => setShowForm(false)}>
          <WeightForm catId={catId} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {editEntry && (
        <Modal title="Редагувати запис ваги" onClose={() => setEditEntry(null)}>
          <WeightForm catId={catId} initialData={editEntry} onSubmit={handleEdit} onCancel={() => setEditEntry(null)} />
        </Modal>
      )}
    </div>
  );
}
