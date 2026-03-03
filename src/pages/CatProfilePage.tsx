import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatsStore } from '../store/catsStore';
import { useRecordsStore } from '../store/recordsStore';
import { useAuth } from '../hooks/useAuth';
import { Cat } from '../types';
import CatAvatar from '../components/cats/CatAvatar';
import CatForm from '../components/cats/CatForm';
import RecordList from '../components/records/RecordList';
import Modal from '../components/ui/Modal';
import { formatAge, formatDate, daysSince } from '../utils/dateUtils';
import { ArrowLeft, Edit2, Trash2, Stethoscope, Syringe, Calendar, Heart } from 'lucide-react';

const locationLabel: Record<string, string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
};

type Tab = 'procedures' | 'vaccinations' | 'appointments';

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCatById, updateCat, deleteCat } = useCatsStore();
  const { deleteRecordsByCat } = useRecordsStore();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('procedures');
  const [showEdit, setShowEdit] = useState(false);

  const cat = getCatById(id!);

  if (!cat) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Кота не знайдено.</p>
        <Link to="/" className="btn-primary inline-flex">До каталогу</Link>
      </div>
    );
  }

  const handleUpdate = (data: Omit<Cat, 'id' | 'createdAt'>) => {
    updateCat(cat.id, data);
    setShowEdit(false);
  };

  const handleDelete = () => {
    if (confirm(`Видалити ${cat.name} та всі записи? Цю дію не можна скасувати.`)) {
      deleteRecordsByCat(cat.id);
      deleteCat(cat.id);
      navigate('/');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'procedures', label: 'Процедури', icon: <Stethoscope size={15} /> },
    { key: 'vaccinations', label: 'Вакцинації', icon: <Syringe size={15} /> },
    { key: 'appointments', label: 'Записи', icon: <Calendar size={15} /> },
  ];

  return (
    <div>
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
        <ArrowLeft size={16} /> До каталогу
      </Link>

      {/* Hero */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex items-start gap-5">
            <CatAvatar cat={cat} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{cat.name}</h1>
                  <p className="text-gray-500">{cat.breed}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setShowEdit(true)}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        <Edit2 size={14} /> Редагувати
                      </button>
                      <button
                        onClick={handleDelete}
                        className="btn-danger text-sm py-1.5 px-3"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                <span>
                  <span className="font-medium">Вік:</span> {formatAge(cat.birthDate)}
                </span>
                <span>
                  <span className="font-medium">Дата народження:</span> {formatDate(cat.birthDate)}
                </span>
                {cat.arrivalDate && (
                  <span>
                    <span className="font-medium">Дата прибуття:</span> {formatDate(cat.arrivalDate)}
                    {' '}
                    <span className="text-teal-600 font-medium">({daysSince(cat.arrivalDate)} дн.)</span>
                  </span>
                )}
                <span>
                  <span className="font-medium">Стать:</span> {cat.sex === 'male' ? '♂ Кіт' : '♀ Киця'}
                </span>
                <span>
                  <span className="font-medium">Колір:</span> {cat.color}
                </span>
                {cat.location && (
                  <span>
                    <span className="font-medium">Місцезнаходження:</span> {locationLabel[cat.location] ?? cat.location}
                  </span>
                )}
                {cat.origin && (
                  <span>
                    <span className="font-medium">Звідки:</span> {cat.origin}
                  </span>
                )}
                {cat.fiv && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.fiv === 'positive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    FIV {cat.fiv === 'positive' ? 'позитивний' : 'негативний'}
                  </span>
                )}
                {cat.felv && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.felv === 'positive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    FeLV {cat.felv === 'positive' ? 'позитивний' : 'негативний'}
                  </span>
                )}
              </div>

              {cat.history && (
                <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Історія</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{cat.history}</p>
                </div>
              )}

              {cat.notes && (
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Нотатки</p>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">{cat.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patron */}
      {cat.patron?.name ? (
        <div className="card mb-6 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={15} className="text-pink-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Патрон</h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
            <span><span className="font-medium">Ім'я:</span> {cat.patron.name}</span>
            {cat.patron.since && (
              <span><span className="font-medium">Під опікою з:</span> {formatDate(cat.patron.since)}</span>
            )}
            {cat.patron.origin && (
              <span><span className="font-medium">Звідки дізнались:</span> {cat.patron.origin}</span>
            )}
            {cat.patron.instagram && (
              <span><span className="font-medium">Instagram:</span>{' '}
                <a href={`https://instagram.com/${cat.patron.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{cat.patron.instagram}</a>
              </span>
            )}
            {cat.patron.phone && (
              <span><span className="font-medium">Телефон:</span>{' '}
                <a href={`tel:${cat.patron.phone}`} className="text-teal-600 hover:underline">{cat.patron.phone}</a>
              </span>
            )}
          </div>
        </div>
      ) : isAdmin && (
        <div className="card mb-6 p-4 border-dashed border-2 border-gray-200 flex items-center gap-3 text-gray-400 text-sm">
          <Heart size={15} className="text-gray-300" />
          Патрон не призначений — натисніть «Редагувати», щоб додати
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {activeTab === 'procedures' && <RecordList catId={cat.id} type="procedure" />}
        {activeTab === 'vaccinations' && <RecordList catId={cat.id} type="vaccination" />}
        {activeTab === 'appointments' && <RecordList catId={cat.id} type="appointment" />}
      </div>

      {isAdmin && showEdit && (
        <Modal title={`Редагувати ${cat.name}`} onClose={() => setShowEdit(false)}>
          <CatForm initialData={cat} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  );
}
