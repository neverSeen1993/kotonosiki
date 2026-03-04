import { Link } from 'react-router-dom';
import { useRecordsStore } from '../store/recordsStore';
import { useCatsStore } from '../store/catsStore';
import { formatDate } from '../utils/dateUtils';
import RecordBadge from '../components/records/RecordBadge';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';

export default function TreatmentsPage() {
  const { records } = useRecordsStore();
  const { getCatById } = useCatsStore();

  const all = records
    .filter((r) => r.type === 'procedure')
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Лікування</h1>
        <p className="text-sm text-gray-400 mt-0.5">{all.length} запис{all.length === 1 ? '' : 'ів'}</p>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="Записів лікування немає"
          description="Записи лікування, додані у профілях котів, з'являться тут."
        />
      ) : (
        <div className="space-y-2">
          {all.map((record) => {
            const cat = getCatById(record.catId);
            const cardContent = (
              <>
                {cat ? (
                  <CatAvatar cat={cat} size="sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{record.title}</p>
                  {cat && (
                    <p className="text-xs text-teal-600">{cat.name}</p>
                  )}
                  {record.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{record.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Початок: {formatDate(record.date)}</p>
                  {record.dateEnd && <p className="text-xs text-gray-500">Кінець: {formatDate(record.dateEnd)}</p>}
                  {record.vet && <p className="text-xs text-gray-400">{record.vet}</p>}
                </div>
                <RecordBadge status={record.status} />
              </>
            );
            return cat ? (
              <Link
                key={record.id}
                to={`/cats/${cat.id}`}
                className="card flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
              >
                {cardContent}
              </Link>
            ) : (
              <div key={record.id} className="card flex items-center gap-4 px-4 py-3">
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
