import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MedicalRecord, RecordType } from '../../types';
import { today } from '../../utils/dateUtils';

const schema = z.object({
  title: z.string().min(1, "Назва обов'язкова"),
  date: z.string().min(1, "Дата обов'язкова"),
  type: z.enum(['procedure', 'vaccination', 'appointment']),
  status: z.enum(['done', 'scheduled', 'cancelled']),
  vet: z.string().optional(),
  clinic: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RecordFormProps {
  catId: string;
  defaultType?: RecordType;
  initialData?: MedicalRecord;
  onSubmit: (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function RecordForm({ catId, defaultType = 'procedure', initialData, onSubmit, onCancel }: RecordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          date: initialData.date,
          type: initialData.type,
          status: initialData.status,
          vet: initialData.vet ?? '',
          clinic: initialData.clinic ?? '',
          notes: initialData.notes ?? '',
          nextDueDate: initialData.nextDueDate ?? '',
        }
      : {
          type: defaultType,
          date: today(),
          status: defaultType === 'appointment' ? 'scheduled' : 'done',
        },
  });

  const recordType = watch('type');

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      catId,
      title: data.title,
      date: data.date,
      type: data.type,
      status: data.status,
      vet: data.vet || undefined,
      clinic: data.clinic || undefined,
      notes: data.notes || undefined,
      nextDueDate: data.nextDueDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="label">Тип</label>
        <select {...register('type')} className="input">
          <option value="procedure">Лікування</option>
          <option value="vaccination">Вакцинація</option>
          <option value="appointment">Прийом</option>
        </select>
      </div>

      <div>
        <label className="label">Назва *</label>
        <input
          {...register('title')}
          className="input"
          placeholder={
            recordType === 'vaccination'
              ? 'напр. Вакцина від сказу'
              : recordType === 'appointment'
              ? 'напр. Щорічний огляд'
              : 'напр. Чищення зубів'
          }
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Дата *</label>
          <input type="date" {...register('date')} className="input" />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="label">Статус</label>
          <select {...register('status')} className="input">
            <option value="done">Виконано</option>
            <option value="scheduled">Заплановано</option>
            <option value="cancelled">Скасовано</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ветеринар / Лікар</label>
          <input {...register('vet')} className="input" placeholder="Д-р Іваненко" />
        </div>
        <div>
          <label className="label">Клініка</label>
          <input {...register('clinic')} className="input" placeholder="Клініка Щасливі лапи" />
        </div>
      </div>

      {(recordType === 'vaccination' || recordType === 'appointment') && (
        <div>
          <label className="label">Наступна дата</label>
          <input type="date" {...register('nextDueDate')} className="input" />
        </div>
      )}

      <div>
        <label className="label">Нотатки</label>
        <textarea
          {...register('notes')}
          className="input resize-none"
          rows={3}
          placeholder="Додаткові нотатки..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Скасувати
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Зберегти зміни' : 'Додати запис'}
        </button>
      </div>
    </form>
  );
}
