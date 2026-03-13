import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Cat, CatLocation, Patron, TestResult, Adoption, Promotion, PromotionLink } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, "Ім'я обов'язкове"),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(['male', 'female', '']).optional(),
  color: z.string().optional(),
  photoUrl: z.string().optional(),
  arrivalDate: z.string().optional(),
  location: z.enum(['big_room', 'quarantine', 'kids_room', 'foster_home', '']).optional(),
  origin: z.string().optional(),
  history: z.string().optional(),
  fiv: z.enum(['positive', 'negative', 'not_tested', '']).optional(),
  felv: z.enum(['positive', 'negative', 'not_tested', '']).optional(),
  sterilised: z.enum(['yes', 'no', '']).optional(),
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
  adoptionNotes: z.string().optional(),
  driveUrl: z.string().optional(),
  notes: z.string().optional(),
  promotionWebsite: z.enum(['yes', 'no', '']).optional(),
  promotionGladpet: z.string().optional(),
  promotionHappyPaw: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CatFormProps {
  initialData?: Cat;
  existingNames?: string[];
  onSubmit: (data: Omit<Cat, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function CatForm({ initialData, existingNames = [], onSubmit, onCancel }: CatFormProps) {
  const [extraLinks, setExtraLinks] = useState<PromotionLink[]>(
    initialData?.promotion?.extraLinks ?? [],
  );
  const [duplicateError, setDuplicateError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          // ...existing code...
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
          sterilised: initialData.sterilised === true ? 'yes' : initialData.sterilised === false ? 'no' : undefined,
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
          adoptionNotes: initialData.adoptionNotes ?? '',
          driveUrl: initialData.driveUrl ?? '',
          notes: initialData.notes ?? '',
          promotionWebsite: initialData.promotion?.website === true ? 'yes' : initialData.promotion?.website === false ? 'no' : '',
          promotionGladpet: initialData.promotion?.gladpet ?? '',
          promotionHappyPaw: initialData.promotion?.happyPaw ?? '',
        }
      : { sex: 'female' },
  });

  const onFormSubmit = (data: FormData) => {
    setDuplicateError('');
    const trimmed = data.name.trim().toLowerCase();
    const currentName = initialData?.name?.trim().toLowerCase();
    if (trimmed !== currentName && existingNames.some((n) => n.trim().toLowerCase() === trimmed)) {
      setDuplicateError(`Кіт з іменем "${data.name}" вже існує`);
      return;
    }
    onSubmit({
      name: data.name,
      breed: data.breed || '',
      birthDate: data.birthDate || '',
      sex: (data.sex ?? 'female') as 'male' | 'female',
      color: data.color || '',
      photoUrl: data.photoUrl ?? '',
      arrivalDate: data.arrivalDate || undefined,
      location: data.location as CatLocation | undefined,
      origin: data.origin || undefined,
      history: data.history || undefined,
      fiv: data.fiv as TestResult | undefined,
      felv: data.felv as TestResult | undefined,
      sterilised: data.sterilised === 'yes' ? true : data.sterilised === 'no' ? false : undefined,
      patron: data.patronName
        ? ({ name: data.patronName, since: data.patronSince ?? '', origin: data.patronOrigin ?? '', instagram: data.patronInstagram || undefined, phone: data.patronPhone || undefined } as Patron)
        : null,
      adoption: data.adoptionDate || data.adoptionFrom
        ? ({ date: data.adoptionDate ?? '', from: data.adoptionFrom ?? '', email: data.adoptionEmail || undefined, phone1: data.adoptionPhone1 || undefined, phone2: data.adoptionPhone2 || undefined, instagram: data.adoptionInstagram || undefined } as Adoption)
        : null,
      adoptionNotes: data.adoptionNotes || undefined,
      promotion: data.promotionWebsite || data.promotionGladpet || data.promotionHappyPaw || extraLinks.length > 0
        ? {
            website: data.promotionWebsite === 'yes',
            gladpet: data.promotionGladpet || undefined,
            happyPaw: data.promotionHappyPaw || undefined,
            extraLinks: extraLinks.filter((l) => l.name && l.url).length > 0
              ? extraLinks.filter((l) => l.name && l.url)
              : undefined,
          } as Promotion
        : null,
      driveUrl: data.driveUrl ?? '',
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ім'я *</label>
          <input {...register('name', { onChange: () => setDuplicateError('') })} className="input" placeholder="Луна" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          {duplicateError && <p className="text-xs text-red-500 mt-1">{duplicateError}</p>}
        </div>
        <div>
          <label className="label">Стать</label>
          <select {...register('sex')} className="input">
            <option value="female">Киця ♀</option>
            <option value="male">Кіт ♂</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Порода</label>
        <input {...register('breed')} className="input" placeholder="Мейн-кун, Британська короткошерста..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Дата народження</label>
          <input type="date" {...register('birthDate')} className="input" />
        </div>
        <div>
          <label className="label">Колір</label>
          <input {...register('color')} className="input" placeholder="Таббі, чорно-білий..." />
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
        <label className="label">Папка із фото</label>
        <input
          {...register('driveUrl')}
          className="input"
          placeholder="https://drive.google.com/..."
          type="url"
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
            <option value="">— не вказано —</option>
            <option value="negative">Негативний</option>
            <option value="positive">Позитивний</option>
            <option value="not_tested">Не тестували</option>
          </select>
        </div>
        <div>
          <label className="label">FeLV</label>
          <select {...register('felv')} className="input">
            <option value="">— не вказано —</option>
            <option value="negative">Негативний</option>
            <option value="positive">Позитивний</option>
            <option value="not_tested">Не тестували</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Стерилізація</label>
        <select {...register('sterilised')} className="input">
          <option value="">— не вказано —</option>
          <option value="yes">Так</option>
          <option value="no">Ні</option>
        </select>
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

      <div>
        <label className="label">Особливості прилаштування</label>
        <textarea
          {...register('adoptionNotes')}
          className="input resize-none"
          rows={3}
          placeholder="Умови передачі, побажання, особливості..."
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

      {/* Promotion section */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Публікації на сайтах</p>
        <div className="space-y-3">
          <div>
            <label className="label">Сайт притулку</label>
            <select {...register('promotionWebsite')} className="input">
              <option value="">— не вказано —</option>
              <option value="yes">Так</option>
              <option value="no">Ні</option>
            </select>
          </div>
          <div>
            <label className="label">GladPet</label>
            <input
              {...register('promotionGladpet')}
              className="input"
              placeholder="https://gladpet.com/..."
              type="url"
            />
          </div>
          <div>
            <label className="label">Happy Paw</label>
            <input
              {...register('promotionHappyPaw')}
              className="input"
              placeholder="https://happypaw.ua/..."
              type="url"
            />
          </div>

          {extraLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="label">Назва</label>
                <input
                  value={link.name}
                  onChange={(e) => {
                    const updated = [...extraLinks];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setExtraLinks(updated);
                  }}
                  className="input"
                  placeholder="Назва сайту"
                />
              </div>
              <div className="flex-1">
                <label className="label">Посилання</label>
                <input
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...extraLinks];
                    updated[idx] = { ...updated[idx], url: e.target.value };
                    setExtraLinks(updated);
                  }}
                  className="input"
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <button
                type="button"
                onClick={() => setExtraLinks(extraLinks.filter((_, i) => i !== idx))}
                className="p-2 text-red-400 hover:text-red-600 transition"
                title="Видалити"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setExtraLinks([...extraLinks, { name: '', url: '' }])}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 transition"
          >
            <Plus size={14} /> Додати посилання
          </button>
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
