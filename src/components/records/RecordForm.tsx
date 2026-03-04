import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MedicalRecord, RecordType } from '../../types';
import { today } from '../../utils/dateUtils';

const schema = z.object({
  title: z.string().min(1, "Назва обов'язкова"),
  date: z.string().min(1, "Дата обов'язкова"),
  type: z.enum(['procedure', 'vaccination', 'appointment', 'treatment', 'surgery']),
  status: z.enum(['done', 'scheduled', 'cancelled', 'ongoing']),
  vet: z.string().optional(),
  clinic: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  // treatment-specific
  description: z.string().optional(),
  drug: z.string().optional(),
  dosage: z.string().optional(),
  dateEnd: z.string().optional(),
  special: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RecordFormProps {
  catId: string;
  defaultType?: RecordType;
  catBirthDate?: string;
  initialData?: MedicalRecord;
  onSubmit: (data: Omit<MedicalRecord, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function RecordForm({ catId, defaultType = 'procedure', initialData, onSubmit, onCancel }: RecordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
          scheduledTime: initialData.scheduledTime ?? '',
          description: initialData.description ?? '',
          drug: initialData.drug ?? '',
          dosage: initialData.dosage ?? '',
          dateEnd: initialData.dateEnd ?? '',
          special: initialData.special ?? '',
        }
      : {
          type: defaultType,
          date: today(),
          status: defaultType === 'appointment' ? 'scheduled' : 'done',
        },
  });

  const recordType = watch('type');
  const vaccinationDate = watch('date');

  const calcNextDue = (days?: number, years?: number) => {
    const base = vaccinationDate || today();
    const d = new Date(base);
    if (days) d.setDate(d.getDate() + days);
    if (years) d.setFullYear(d.getFullYear() + years);
    setValue('nextDueDate', d.toISOString().slice(0, 10));
  };


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
      scheduledTime: data.scheduledTime || undefined,
      description: data.description || undefined,
      drug: data.drug || undefined,
      dosage: data.dosage || undefined,
      dateEnd: data.dateEnd || undefined,
      special: data.special || undefined,
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
          <option value="treatment">Обробка</option>
          <option value="surgery">Операція</option>
        </select>
      </div>

      <div>
        <label className="label">{recordType === 'procedure' ? 'Діагноз' : 'Назва'} *</label>
        <input
          {...register('title')}
          className="input"
          placeholder={
            recordType === 'procedure'
              ? 'напр. Отит'
              : recordType === 'vaccination'
              ? 'напр. Вакцина від сказу'
              : recordType === 'appointment'
              ? 'напр. Щорічний огляд'
              : 'напр. Обробка від бліх'
          }
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {recordType !== 'treatment' && recordType !== 'procedure' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Дата *</label>
            <input type="date" {...register('date')} className="input" />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>
          {recordType === 'appointment' ? (
            <div>
              <label className="label">Час</label>
              <input type="time" {...register('scheduledTime')} className="input" />
            </div>
          ) : (
            <div>
              <label className="label">Статус</label>
              <select {...register('status')} className="input">
                <option value="done">Виконано</option>
                <option value="scheduled">Заплановано</option>
                <option value="cancelled">Скасовано</option>
              </select>
            </div>
          )}
        </div>
      )}
      {recordType === 'appointment' && (
        <div>
          <label className="label">Статус</label>
          <select {...register('status')} className="input">
            <option value="scheduled">Заплановано</option>
            <option value="done">Виконано</option>
            <option value="cancelled">Скасовано</option>
          </select>
        </div>
      )}

      {recordType === 'procedure' ? (
        <>
          <div>
            <label className="label">Опис</label>
            <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Опис лікування..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Назва препарату</label>
              <input {...register('drug')} className="input" placeholder="напр. Амоксицилін" />
            </div>
            <div>
              <label className="label">Дозування</label>
              <input {...register('dosage')} className="input" placeholder="напр. 0.5 мл" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Дата початку *</label>
              <input type="date" {...register('date')} className="input" />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Дата кінця</label>
              <input type="date" {...register('dateEnd')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Статус</label>
            <select {...register('status')} className="input">
              <option value="ongoing">Виконується</option>
              <option value="done">Виконано</option>
              <option value="scheduled">Заплановано</option>
              <option value="cancelled">Скасовано</option>
            </select>
          </div>

          <div>
            <label className="label">Особливості</label>
            <textarea {...register('special')} className="input resize-none" rows={2} placeholder="Особливості лікування..." />
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
        </>
      ) : recordType === 'treatment' ? (
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
      ) : (
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
      )}

      {recordType === 'vaccination' && (
        <div>
          <label className="label">Наступна дата</label>
          <input
            type="date"
            {...register('nextDueDate')}
            className="input"
          />
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => calcNextDue(14)}
              className="text-xs px-2.5 py-1 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition"
            >
              + 14 днів
            </button>
            <button
              type="button"
              onClick={() => calcNextDue(undefined, 1)}
              className="text-xs px-2.5 py-1 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition"
            >
              + 1 рік
            </button>
          </div>
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
