import { useState } from 'react';
import { useCatsStore } from '../store/catsStore';
import CatCard from '../components/cats/CatCard';
import EmptyState from '../components/ui/EmptyState';
import { Search } from 'lucide-react';

export default function AdoptedPage() {
  const { cats } = useCatsStore();
  const [search, setSearch] = useState('');

  const adopted = cats
    .filter((c) => !!c.adoption?.date)
    .sort((a, b) => (b.adoption!.date).localeCompare(a.adoption!.date));

  const filtered = adopted.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Прилаштовані</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Всього прилаштовано: <span className="font-medium text-gray-600">{adopted.length}</span>
        </p>
      </div>

      {adopted.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за іменем..."
            className="input pl-9"
          />
        </div>
      )}

      {adopted.length === 0 ? (
        <EmptyState
          title="Прилаштованих котів ще немає"
          description="Коти з заповненою датою прилаштування з'являться тут."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Котів не знайдено" description="Спробуйте інше ім'я." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
