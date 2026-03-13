import { useState } from 'react';
import { useCatsStore } from '../store/catsStore';
import { useAuth } from '../hooks/useAuth';
import { Cat, CatLocation } from '../types';
import CatCard from '../components/cats/CatCard';
import CatForm from '../components/cats/CatForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Search, SlidersHorizontal, X, Bug, Syringe, Calendar, Stethoscope, Info } from 'lucide-react';

type PatronFilter = 'all' | 'with' | 'without';
type FivFilter = 'all' | 'positive' | 'negative' | 'unknown';
type LocationFilter = CatLocation | 'all';

const locationLabel: Record<CatLocation, string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
};

export default function CatalogPage() {
  const { cats, addCat } = useCatsStore();
  const { canEdit } = useAuth();
  const [showLegend, setShowLegend] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [patronFilter, setPatronFilter] = useState<PatronFilter>('all');
  const [fivFilter, setFivFilter] = useState<FivFilter>('all');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');

  const activeFilterCount = [
    patronFilter !== 'all',
    fivFilter !== 'all',
    locationFilter !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setPatronFilter('all');
    setFivFilter('all');
    setLocationFilter('all');
  };

  const activeCats = cats.filter((c) => !c.adoption?.date);

  const filtered = activeCats.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (patronFilter === 'with' && !c.patron?.name) return false;
    if (patronFilter === 'without' && c.patron?.name) return false;
    if (fivFilter === 'positive' && c.fiv !== 'positive') return false;
    if (fivFilter === 'negative' && c.fiv !== 'negative') return false;
    if (fivFilter === 'unknown' && c.fiv != null) return false;
    if (locationFilter !== 'all' && c.location !== locationFilter) return false;
    return true;
  });

  const handleAdd = async (data: Omit<Cat, 'id' | 'createdAt'>) => {
    await addCat(data);
    setShowForm(false);
  };

  const inBigRoom = activeCats.filter((c) => c.location === 'big_room').length;
  const inKidsRoom = activeCats.filter((c) => c.location === 'kids_room').length;
  const inQuarantine = activeCats.filter((c) => c.location === 'quarantine').length;
  const inFoster = activeCats.filter((c) => c.location === 'foster_home').length;
  const inCampTotal = inBigRoom + inKidsRoom + inQuarantine;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">КОТО-табір</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-400">
            <span>Всього в таборі: <span className="font-medium text-gray-600">{inCampTotal}</span></span>
            <span>Велика кімната: <span className="font-medium text-gray-600">{inBigRoom}</span></span>
            <span>Дитяча кімната: <span className="font-medium text-gray-600">{inKidsRoom}</span></span>
            <span>Карантин: <span className="font-medium text-gray-600">{inQuarantine}</span></span>
            <span>Домашня перетримка: <span className="font-medium text-gray-600">{inFoster}</span></span>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} /> Додати кота
          </button>
        )}
      </div>

      {activeCats.length > 0 && (
        <>
          {/* Badge legend */}
          <div className="mb-4">
            <button
              onClick={() => setShowLegend((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              <Info size={12} />
              Позначки
              <span className="text-gray-300">{showLegend ? '▲' : '▼'}</span>
            </button>
            {showLegend && (
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                <span className="flex items-center gap-1"><Bug size={12} className="text-blue-500" /> — обробка цього тижня</span>
                <span className="flex items-center gap-1"><Syringe size={12} className="text-green-500" /> — вакцинація цього тижня / прострочена</span>
                <span className="flex items-center gap-1"><Stethoscope size={12} className="text-blue-400" /> — активне лікування</span>
                <span className="flex items-center gap-1"><Calendar size={12} className="text-purple-400" /> — заплановані записи</span>
                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">FIV</span> / <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">FeLV</span> — позитивний тест</span>
              </div>
            )}
          </div>
          {/* Search + filter toggle */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за іменем..."
                className="input pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition ${showFilters || activeFilterCount > 0 ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal size={15} />
              Фільтри
              {activeFilterCount > 0 && (
                <span className="bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Фільтри</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition">
                    <X size={12} /> Скинути всі
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Patron filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Патрон</label>
                  <div className="flex flex-wrap gap-1.5">
                    {([['all', 'Всі'], ['with', 'Є патрон'], ['without', 'Без патрона']] as [PatronFilter, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPatronFilter(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${patronFilter === val ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FIV filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">FIV</label>
                  <div className="flex flex-wrap gap-1.5">
                    {([['all', 'Всі'], ['negative', 'Негативний'], ['positive', 'Позитивний'], ['unknown', 'Не тестувався']] as [FivFilter, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setFivFilter(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${fivFilter === val ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Місцезнаходження</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setLocationFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${locationFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Всі
                    </button>
                    {(Object.entries(locationLabel) as [CatLocation, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setLocationFilter(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${locationFilter === val ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeCats.length === 0 ? (
        <EmptyState
          title="Котів ще немає"
          description="Додайте першого кота, щоб розпочати відстеження його здоров'я."
          action={
            canEdit ? (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={18} /> Додати першого кота
              </button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Котів не знайдено" description="Спробуйте інше ім'я, породу або змініть фільтри." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}

      {canEdit && showForm && (
        <Modal title="Додати нового кота" onClose={() => setShowForm(false)}>
          <CatForm existingNames={cats.map((c) => c.name)} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
