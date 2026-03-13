import { Link } from 'react-router-dom';
import { useRecordsStore } from '../store/recordsStore';
import { useCatsStore } from '../store/catsStore';
import { formatDate } from '../utils/dateUtils';
import RecordBadge from '../components/records/RecordBadge';
import CatAvatar from '../components/cats/CatAvatar';
import EmptyState from '../components/ui/EmptyState';
import { CatLocation } from '../types';

const locationLabel: Record<CatLocation | 'unknown', string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
  unknown: 'Місце невідоме',
};

const locationOrder: (CatLocation | 'unknown')[] = [
  'big_room',
  'quarantine',
  'kids_room',
  'foster_home',
  'unknown',
];

export default function TreatmentsPage() {
  const { records } = useRecordsStore();
  const { getCatById } = useCatsStore();

  const all = records
    .filter((r) => r.type === 'procedure' && r.status !== 'done')
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group by location
  const grouped = locationOrder.reduce<Record<string, typeof all>>((acc, loc) => {
    acc[loc] = all.filter((r) => {
      const cat = getCatById(r.catId);
      const catLoc = cat?.location ?? 'unknown';
      return catLoc === loc;
    });
    return acc;
  }, {});

  const renderCard = (record: (typeof all)[0]) => {
    const cat = getCatById(record.catId);
    const cardContent = (
      <>
        {cat ? (
          <CatAvatar cat={cat} size="sm" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100" />
        )}
        <div className="flex-1 min-w-0">
          {cat && (
            <p className="font-medium text-gray-800 text-sm">{cat.name}</p>
          )}
          <p className="text-xs text-teal-600">{record.title}</p>
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
        className="card flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-gray-50 transition"
      >
        {cardContent}
      </Link>
    ) : (
      <div key={record.id} className="card flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3">
        {cardContent}
      </div>
    );
  };

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
        <div className="space-y-6">
          {locationOrder.map((loc) => {
            const group = grouped[loc];
            if (!group || group.length === 0) return null;
            return (
              <div key={loc}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {locationLabel[loc]}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
