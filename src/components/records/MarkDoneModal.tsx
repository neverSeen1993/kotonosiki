import { useForm, useWatch } from 'react-hook-form';
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
  driveUrl?: string;
  onConfirm: (notes?: string, photoUrl?: string) => void;
  onClose: () => void;
}

function getDriveImageSrc(url: string): string {
  // Extract file ID from any Drive URL format
  const match = url.match(/(?:\/d\/|id=|uc\?id=)([a-zA-Z0-9_-]{25,})/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s800`;
  }
  return url;
}

export default function MarkDoneModal({ recordTitle, initialPhotoUrl, driveUrl, onConfirm, onClose }: MarkDoneModalProps) {
  const { register, handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      notes: '',
      photoUrl: initialPhotoUrl ?? '',
    },
  });

  const photoUrl = useWatch({ control, name: 'photoUrl' });
  const previewSrc = photoUrl ? getDriveImageSrc(photoUrl) : null;

  const onSubmit = (data: FormData) => {
    onConfirm(data.notes || undefined, data.photoUrl || undefined);
  };

  return (
    <Modal title={`Виконано: ${recordTitle}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Результати</label>
          <textarea
            {...register('notes')}
            className="input resize-none"
            rows={3}
            placeholder="Результати, коментарі..."
          />
        </div>
        <div>
          <label className="label">Посилання на фото</label>
          <div className="flex gap-2">
            <input
              {...register('photoUrl')}
              className="input flex-1"
              placeholder="https://drive.google.com/file/d/..."
              type="url"
            />
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-3 shrink-0"
                title="Відкрити Google Drive папку"
              >
                📁
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Файл у Drive має бути відкритий для перегляду («Усі, хто має посилання»)
          </p>

          {/* Live preview */}
          {previewSrc && (
            <div className="mt-2">
              <img
                src={previewSrc}
                alt="Прев'ю"
                className="rounded-lg max-h-48 w-full object-cover border border-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Скасувати</button>
          <button type="submit" className="btn-primary">Позначити виконаним</button>
        </div>
      </form>
    </Modal>
  );
}
