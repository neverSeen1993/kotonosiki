import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cat, Adoption } from '../../types';

const schema = z.object({
  adoptionDate: z.string().optional(),
  adoptionFrom: z.string().optional(),
  adoptionEmail: z.string().optional(),
  adoptionPhone1: z.string().optional(),
  adoptionPhone2: z.string().optional(),
  adoptionInstagram: z.string().optional(),
  adoptionNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AdoptionFormProps {
  initialData: Cat;
  onSubmit: (data: { adoption: Adoption | null; adoptionNotes?: string }) => void;
  onCancel: () => void;
}

export default function AdoptionForm({ initialData, onSubmit, onCancel }: AdoptionFormProps) {
  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      adoptionDate: initialData.adoption?.date ?? '',
      adoptionFrom: initialData.adoption?.from ?? '',
      adoptionEmail: initialData.adoption?.email ?? '',
      adoptionPhone1: initialData.adoption?.phone1 ?? '',
      adoptionPhone2: initialData.adoption?.phone2 ?? '',
      adoptionInstagram: initialData.adoption?.instagram ?? '',
      adoptionNotes: initialData.adoptionNotes ?? '',
    },
  });

  const onFormSubmit = (data: FormData) => {
    const adoption: Adoption | null =
      data.adoptionDate || data.adoptionFrom
        ? {
            date: data.adoptionDate ?? '',
            from: data.adoptionFrom ?? '',
            email: data.adoptionEmail || undefined,
            phone1: data.adoptionPhone1 || undefined,
            phone2: data.adoptionPhone2 || undefined,
            instagram: data.adoptionInstagram || undefined,
          }
        : null;

    onSubmit({
      adoption,
      adoptionNotes: data.adoptionNotes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
      <div>
        <label className="label">Особливості прилаштування</label>
        <textarea
          {...register('adoptionNotes')}
          className="input resize-none"
          rows={3}
          placeholder="Умови передачі, побажання, особливості..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Скасувати
        </button>
        <button type="submit" className="btn-primary">
          Зберегти
        </button>
      </div>
    </form>
  );
}

