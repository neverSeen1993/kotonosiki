import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cat } from '../../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  breed: z.string().min(1, 'Breed is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
  sex: z.enum(['male', 'female']),
  color: z.string().min(1, 'Color is required'),
  photoUrl: z.string().optional(),
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
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          <input {...register('name')} className="input" placeholder="Luna" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Sex *</label>
          <select {...register('sex')} className="input">
            <option value="female">Female ♀</option>
            <option value="male">Male ♂</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Breed *</label>
        <input {...register('breed')} className="input" placeholder="Maine Coon, British Shorthair..." />
        {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Birth date *</label>
          <input type="date" {...register('birthDate')} className="input" />
          {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>}
        </div>
        <div>
          <label className="label">Color *</label>
          <input {...register('color')} className="input" placeholder="Tabby, Black & White..." />
          {errors.color && <p className="text-xs text-red-500 mt-1">{errors.color.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Photo URL</label>
        <input
          {...register('photoUrl')}
          className="input"
          placeholder="https://... (optional)"
        />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          {...register('notes')}
          className="input resize-none"
          rows={3}
          placeholder="Special notes about this cat..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save changes' : 'Add cat'}
        </button>
      </div>
    </form>
  );
}
