import { useState } from 'react';
import { useCatsStore } from '../store/catsStore';
import { useAuth } from '../hooks/useAuth';
import { Cat } from '../types';
import CatCard from '../components/cats/CatCard';
import CatForm from '../components/cats/CatForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Search } from 'lucide-react';

export default function CatalogPage() {
  const { cats, addCat } = useCatsStore();
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = cats.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.breed.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (data: Omit<Cat, 'id' | 'createdAt'>) => {
    addCat(data);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Каталог котів</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cats.length} котик{cats.length === 1 ? '' : cats.length >= 2 && cats.length <= 4 ? 'и' : 'ів'} зареєстровано</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} /> Додати кота
          </button>
        )}
      </div>

      {cats.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за іменем або породою..."
            className="input pl-9"
          />
        </div>
      )}

      {cats.length === 0 ? (
        <EmptyState
          title="Котів ще немає"
          description="Додайте першого кота, щоб розпочати відстеження його здоров'я."
          action={
            isAdmin ? (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={18} /> Додати першого кота
              </button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Котів не знайдено" description="Спробуйте інше ім'я або породу." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}

      {isAdmin && showForm && (
        <Modal title="Додати нового кота" onClose={() => setShowForm(false)}>
          <CatForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
