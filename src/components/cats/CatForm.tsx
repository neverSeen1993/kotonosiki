import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cat, CatLocation, Patron, TestResult, Adoption } from '../../types';

const schema = z.object({
  name: z.string().min(1, "Ім'я обов'язкове"),
  breed: z.string().min(1, "Порода обов'язкова"),
  birthDate: z.string().min(1, "Дата народження обов'язкова"),
  sex: z.enum(['male', 'female']),
  color: z.string().min(1, "Колір обов'язковий"),
  photoUrl: z.string().optional(),
  arrivalDate: z.string().optional(),
  location: z.enum(['big_room', 'quarantine', 'kids_room', 'foster_home']).optional(),
  origin: z.string().optional(),
  history: z.string().optional(),
  fiv: z.enum(['positive', 'negative']).optional(),
  felv: z.enum(['positive', 'negative']).optional(),
  patronName: z.string().optional(),
  patronSince: z.string().optional(),
  patronOrigin: z.string().optional(),
  patronInstagram: z.string().optional(),
  patronPhone: z.string().optional(),
  adoptionDate: z.string().optional(),
  adoptionFrom: z.string().optional(),
  adoptionEmail: z.string().optional(),
  adoptionPhone1: z.string().optional(),
  adoptionPhone2: z.string().optional(),
  adoptionInstagram: z.string().optional(),
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
          origin: initialData.origin ?? '',
          history: initialData.history ?? '',
          fiv: initialData.fiv,
          felv: initialData.felv,
          patronName: initialData.patron?.name ?? '',
          patronSince: initialData.patron?.since ?? '',
          patronOrigin: initialData.patron?.origin ?? '',
          patronInstagram: initialData.patron?.instagram ?? '',
          patronPhone: initialData.patron?.phone ?? '',
          adoptionDate: initialData.adoption?.date ?? '',
          adoptionFrom: initialData.adoption?.from ?? '',
          adoptionEmail: initialData.adoption?.email ?? '',
          adoptionPhone1: initialData.adoption?.phone1 ?? '',
          adoptionPhone2: initialData.adoption?.phone2 ?? '',
          adoptionInstagram: initialData.adoption?.instagram ?? '',
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
      origin: data.origin || undefined,
      history: data.history || undefined,
      fiv: data.fiv as TestResult | undefined,
      felv: data.felv as TestResult | undefined,
      patron: data.patronName
        ? ({ name: data.patronName, since: data.patronSince ?? '', origin: data.patronOrigin ?? '', instagram: data.patronInstagram || undefined, phone: data.patronPhone || undefined } as Patron)
        : undefined,
      adoption: data.adoptionDate || data.adoptionFrom
        ? ({ date: data.adoptionDate ?? '', from: data.adoptionFrom ?? '', email: data.adoptionEmail || undefined, phone1: data.adoptionPhone1 || undefined, phone2: data.adoptionPhone2 || undefined, instagram: data.adoptionInstagram || undefined } as Adoption)
        : undefined,
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
            <option value="female">Киця ♀</option>
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
        <label className="label">Звідки</label>
        <input
          {...register('origin')}
          className="input"
          placeholder="Притулок, вулиця, інший розплідник..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">FIV</label>
          <select {...register('fiv')} className="input">
            <option value="">— не тестувався —</option>
            <option value="negative">Негативний</option>
            <option value="positive">Позитивний</option>
          </select>
        </div>
        <div>
          <label className="label">FeLV</label>
          <select {...register('felv')} className="input">
            <option value="">— не тестувався —</option>
            <option value="negative">Негативний</option>
            <option value="positive">Позитивний</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Історія</label>
        <textarea
          {...register('history')}
          className="input resize-none"
          rows={4}
          placeholder="Розкажіть про минуле кота, його характер, звички..."
        />
      </div>

      {/* Patron section */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Патрон</p>
        <div className="space-y-3">
          <div>
            <label className="label">Ім'я патрона</label>
            <input
              {...register('patronName')}
              className="input"
              placeholder="Ім'я та прізвище"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Під опікою з</label>
              <input type="date" {...register('patronSince')} className="input" />
            </div>
            <div>
              <label className="label">Звідки дізнались</label>
              <input
                {...register('patronOrigin')}
                className="input"
                placeholder="Соцмережі, знайомі..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Instagram</label>
              <input
                {...register('patronInstagram')}
                className="input"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                {...register('patronPhone')}
                className="input"
                placeholder="+380..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adoption section */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Адопція</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Дата адопції</label>
              <input type="date" {...register('adoptionDate')} className="input" />
            </div>
            <div>
              <label className="label">Звідки взяли</label>
              <input {...register('adoptionFrom')} className="input" placeholder="Притулок, виставка..." />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('adoptionEmail')} className="input" placeholder="adopter@email.com" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Телефон 1</label>
              <input {...register('adoptionPhone1')} className="input" placeholder="+380..." />
            </div>
            <div>
              <label className="label">Телефон 2</label>
              <input {...register('adoptionPhone2')} className="input" placeholder="+380..." />
            </div>
          </div>
          <div>
            <label className="label">Instagram</label>
            <input {...register('adoptionInstagram')} className="input" placeholder="@username" />
          </div>
        </div>
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
