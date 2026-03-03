import { useState } from 'react';
import { useCatsStore } from '../store/catsStore';
import { Cat } from '../types';
import CatCard from '../components/cats/CatCard';
import CatForm from '../components/cats/CatForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Search } from 'lucide-react';

export default function CatalogPage() {
  const { cats, addCat } = useCatsStore();
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
          <h1 className="text-2xl font-bold text-gray-800">Cat Catalog</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cats.length} cat{cats.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Add cat
        </button>
      </div>

      {cats.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or breed..."
            className="input pl-9"
          />
        </div>
      )}

      {cats.length === 0 ? (
        <EmptyState
          title="No cats yet"
          description="Add your first cat to start tracking their health records."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={18} /> Add your first cat
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No cats match your search" description="Try a different name or breed." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add a new cat" onClose={() => setShowForm(false)}>
          <CatForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
