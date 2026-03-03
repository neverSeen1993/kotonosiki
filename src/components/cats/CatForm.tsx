import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cat, CatLocation } from '../../types';

const schema = z.object({
  name: z.string().min(1, "Ім'я обов'язкове"),
  breed: z.string().min(1, "Порода обов'язкова"),
  birthDate: z.string().min(1, "Дата народження обов'язкова"),
  sex: z.enum(['male', 'female']),
  color: z.string().min(1, "Колір обов'язковий"),
  photoUrl: z.string().optional(),
  arrivalDate: z.string().optional(),
  location: z.enum(['big_room', 'quarantine', 'kids_room', 'foster_home']).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CatFormProps {
  initialData?: Cat;
  onSubmit: (data: Omit<Cat, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function CatForm({ initialData, onSubmit, onCancel }: CatFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          breed: initialData.breed,
          birthDate: initialData.birthDate,
          sex: initialData.sex,
          color: initialData.color,
          photoUrl: initialData.photoUrl ?? '',
          arrivalDate: initialData.arrivalDate ?? '',
          location: initialData.location,
          notes: initialData.notes ?? '',
        }
      : { sex: 'female' },
  });

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      breed: data.breed,
      birthDate: data.birthDate,
      sex: data.sex,
      color: data.color,
      photoUrl: data.photoUrl || undefined,
      arrivalDate: data.arrivalDate || undefined,
      location: data.location as CatLocation | undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ім'я *</label>
          <input {...register('name')} className="input" placeholder="Луна" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Стать *</label>
          <select {...register('sex')} className="input">
            <option value="female">Кішка ♀</option>
            <option value="male">Кіт ♂</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Порода *</label>
        <input {...register('breed')} className="input" placeholder="Мейн-кун, Британська короткошерста..." />
        {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Дата народження *</label>
          <input type="date" {...register('birthDate')} className="input" />
          {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>}
        </div>
        <div>
          <label className="label">Колір *</label>
          <input {...register('color')} className="input" placeholder="Таббі, чорно-білий..." />
          {errors.color && <p className="text-xs text-red-500 mt-1">{errors.color.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Фото (URL)</label>
        <input
          {...register('photoUrl')}
          className="input"
          placeholder="https://... (необов'язково)"
        />
      </div>

      <div>
        <label className="label">Дата прибуття</label>
        <input
          type="date"
          {...register('arrivalDate')}
          className="input"
          placeholder="Дата прибуття кота (необов'язково)"
        />
      </div>

      <div>
        <label className="label">Місцезнаходження</label>
        <select {...register('location')} className="input">
          <option value="">— не вказано —</option>
          <option value="big_room">Велика кімната</option>
          <option value="quarantine">Карантин</option>
          <option value="kids_room">Дитяча кімната</option>
          <option value="foster_home">Домашня перетримка</option>
        </select>
      </div>

      <div>
        <label className="label">Нотатки</label>
        <textarea
          {...register('notes')}
          className="input resize-none"
          rows={3}
          placeholder="Особливі нотатки про цього кота..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Скасувати
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Зберегти зміни' : 'Додати кота'}
        </button>
      </div>
    </form>
  );
}
