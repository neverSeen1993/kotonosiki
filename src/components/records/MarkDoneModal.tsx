import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../ui/Modal';

const schema = z.object({
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MarkDoneModalProps {
  recordTitle: string;
  initialNotes?: string;
  initialPhotoUrl?: string;
  onConfirm: (notes?: string, photoUrl?: string) => void;
  onClose: () => void;
}

export default function MarkDoneModal({ recordTitle, initialNotes, initialPhotoUrl, onConfirm, onClose }: MarkDoneModalProps) {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      notes: initialNotes ?? '',
      photoUrl: initialPhotoUrl ?? '',
    },
  });

  const onSubmit = (data: FormData) => {
    onConfirm(data.notes || undefined, data.photoUrl || undefined);
  };

  return (
    <Modal title={`Виконано: ${recordTitle}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Нотатки</label>
          <textarea
            {...register('notes')}
            className="input resize-none"
            rows={3}
            placeholder="Результати, коментарі..."
          />
        </div>
        <div>
          <label className="label">Посилання на фото</label>
          <input
            {...register('photoUrl')}
            className="input"
            placeholder="https://drive.google.com/... або інше посилання"
            type="url"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Скасувати</button>
          <button type="submit" className="btn-primary">Позначити виконаним</button>
        </div>
      </form>
    </Modal>
  );
}
