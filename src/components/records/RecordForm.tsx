import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MedicalRecord, RecordType } from '../../types';
import { today } from '../../utils/dateUtils';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
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
        <label className="label">Type</label>
        <select {...register('type')} className="input">
          <option value="procedure">Procedure</option>
          <option value="vaccination">Vaccination</option>
          <option value="appointment">Appointment</option>
        </select>
      </div>

      <div>
        <label className="label">Title *</label>
        <input
          {...register('title')}
          className="input"
          placeholder={
            recordType === 'vaccination'
              ? 'e.g. Rabies vaccine'
              : recordType === 'appointment'
              ? 'e.g. Annual check-up'
              : 'e.g. Dental cleaning'
          }
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date *</label>
          <input type="date" {...register('date')} className="input" />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="done">Done</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Vet / Doctor</label>
          <input {...register('vet')} className="input" placeholder="Dr. Smith" />
        </div>
        <div>
          <label className="label">Clinic</label>
          <input {...register('clinic')} className="input" placeholder="Happy Paws Clinic" />
        </div>
      </div>

      {(recordType === 'vaccination' || recordType === 'appointment') && (
        <div>
          <label className="label">Next due date</label>
          <input type="date" {...register('nextDueDate')} className="input" />
        </div>
      )}

      <div>
        <label className="label">Notes</label>
        <textarea
          {...register('notes')}
          className="input resize-none"
          rows={3}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save changes' : 'Add record'}
        </button>
      </div>
    </form>
  );
}
