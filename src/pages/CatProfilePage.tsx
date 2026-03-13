import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatsStore } from '../store/catsStore';
import { useRecordsStore } from '../store/recordsStore';
import { useAuth } from '../hooks/useAuth';
import { Cat } from '../types';
import CatAvatar from '../components/cats/CatAvatar';
import CatForm from '../components/cats/CatForm';
import AdoptionForm from '../components/cats/AdoptionForm';
import RecordList from '../components/records/RecordList';
import WeightLog from '../components/cats/WeightLog';
import Modal from '../components/ui/Modal';
import { formatAge, formatDate, daysSince } from '../utils/dateUtils';
import { useWeightStore } from '../store/weightStore';
import { ArrowLeft, Edit2, Trash2, Stethoscope, Syringe, Calendar, HandHeart, Home, Bug, Scale, FolderOpen, Heart, Globe, ExternalLink } from 'lucide-react';

const locationLabel: Record<string, string> = {
  big_room: 'Велика кімната',
  quarantine: 'Карантин',
  kids_room: 'Дитяча кімната',
  foster_home: 'Домашня перетримка',
};

type Tab = 'procedures' | 'vaccinations' | 'appointments' | 'treatment' | 'weight';

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCatById, updateCat, updateCatAdoption, deleteCat } = useCatsStore();
  const allCats = useCatsStore((s) => s.cats);
  const { deleteRecordsByCat, getRecordsByCat, updateRecord } = useRecordsStore();
  const { deleteWeightsByCat } = useWeightStore();
  const { canEdit, canEditAdoption } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('procedures');
  const [showEdit, setShowEdit] = useState(false);
  const [showEditAdoption, setShowEditAdoption] = useState(false);

  const cat = getCatById(id!);

  if (!cat) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Кота не знайдено.</p>
        <Link to="/" className="btn-primary inline-flex">До каталогу</Link>
      </div>
    );
  }

  const handleUpdate = async (data: Omit<Cat, 'id' | 'createdAt'>) => {
    const wasAdopted = !!cat.adoption?.date;
    const nowAdopted = !!data.adoption?.date;

    await updateCat(cat.id, data);

    if (!wasAdopted && nowAdopted) {
      const records = getRecordsByCat(cat.id);
      const toCancel = records.filter(
        (r) => r.status === 'scheduled' || r.status === 'ongoing',
      );
      await Promise.all(
        toCancel.map((r) => updateRecord(r.id, { status: 'cancelled' })),
      );
    }

    setShowEdit(false);
  };

  const handleUpdateAdoption = async (data: { adoption: Cat['adoption']; adoptionNotes?: string }) => {
    const wasAdopted = !!cat.adoption?.date;
    const nowAdopted = !!data.adoption?.date;

    await updateCatAdoption(cat.id, data);

    if (!wasAdopted && nowAdopted) {
      const records = getRecordsByCat(cat.id);
      const toCancel = records.filter(
        (r) => r.status === 'scheduled' || r.status === 'ongoing',
      );
      await Promise.all(
        toCancel.map((r) => updateRecord(r.id, { status: 'cancelled' })),
      );
    }

    setShowEditAdoption(false);
  };

  const handleDelete = async () => {
    if (confirm(`Видалити ${cat.name} та всі записи? Цю дію не можна скасувати.`)) {
      await deleteRecordsByCat(cat.id);
      await deleteWeightsByCat(cat.id);
      await deleteCat(cat.id);
      navigate('/');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'procedures', label: 'Лікування', icon: <Stethoscope size={15} /> },
    { key: 'appointments', label: 'Прийоми', icon: <Calendar size={15} /> },
    { key: 'treatment', label: 'Обробки', icon: <Bug size={15} /> },
    { key: 'vaccinations', label: 'Вакцинація', icon: <Syringe size={15} /> },
    { key: 'weight', label: 'Вага', icon: <Scale size={15} /> },
  ];

  return (
    <div>
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
        <ArrowLeft size={16} /> До каталогу
      </Link>

      {/* Hero */}
      <div className="card mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CatAvatar cat={cat} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{cat.name}</h1>
                  {(cat.fiv || cat.felv || cat.sterilised !== undefined) && (
                    <div className="flex gap-1.5 mt-1.5">
                      {cat.fiv && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                          cat.fiv === 'positive' ? 'bg-red-100 text-red-700' :
                          cat.fiv === 'negative' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>FIV</span>
                      )}
                      {cat.felv && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                          cat.felv === 'positive' ? 'bg-red-100 text-red-700' :
                          cat.felv === 'negative' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>FeLV</span>
                      )}
                      {cat.sterilised !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${cat.sterilised ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.sterilised ? 'Стерилізовано' : 'Не стерилізовано'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
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
                {cat.birthDate && (
                  <span>
                    <span className="font-medium">Вік:</span> {formatAge(cat.birthDate)}
                  </span>
                )}
                {cat.birthDate && (
                  <span>
                    <span className="font-medium">Дата народження:</span> {formatDate(cat.birthDate)}
                  </span>
                )}
                {cat.arrivalDate && (
                  <span>
                    <span className="font-medium">Дата прибуття:</span> {formatDate(cat.arrivalDate)}
                    {' '}
                    <span className="text-teal-600 font-medium">({daysSince(cat.arrivalDate)} дн.)</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium">Стать:</span>
                  <span>{cat.sex === 'male' ? '♂ Кіт' : '♀ Киця'}</span>
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
              </div>

              {cat.history && (
                <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Історія</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{cat.history}</p>
                </div>
              )}

              {cat.adoptionNotes && (
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Особливості прилаштування</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{cat.adoptionNotes}</p>
                </div>
              )}

              {cat.notes && (
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Нотатки</p>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">{cat.notes}</p>
                </div>
              )}

              {cat.driveUrl && (
                <div className="mt-2">
                  <a
                    href={cat.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 hover:underline transition"
                  >
                    <FolderOpen size={15} /> Папка із фото
                  </a>
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
            <HandHeart size={15} className="text-pink-500" />
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
      ) : canEdit && (
        <div className="card mb-6 p-4 border-dashed border-2 border-gray-200 flex items-center gap-3 text-gray-400 text-sm">
          <Heart size={15} className="text-gray-300" />
          Патрон не призначений — натисніть «Редагувати», щоб додати
        </div>
      )}

      {/* Promotion */}
      {cat.promotion && (cat.promotion.website || cat.promotion.gladpet || cat.promotion.happyPaw || (cat.promotion.extraLinks && cat.promotion.extraLinks.length > 0)) ? (
        <div className="card mb-6 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Публікації на сайтах</h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            {cat.promotion.website !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.promotion.website ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                Сайт: {cat.promotion.website ? 'Так' : 'Ні'}
              </span>
            )}
            {cat.promotion.gladpet && (
              <a href={cat.promotion.gladpet} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:underline">
                <ExternalLink size={13} /> GladPet
              </a>
            )}
            {cat.promotion.happyPaw && (
              <a href={cat.promotion.happyPaw} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:underline">
                <ExternalLink size={13} /> Happy Paw
              </a>
            )}
            {cat.promotion.extraLinks?.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:underline">
                <ExternalLink size={13} /> {link.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* Adoption */}
      {cat.adoption?.date || cat.adoption?.from ? (
        <div className="card mb-6 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home size={15} className="text-teal-500" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Адопція</h2>
            </div>
            {canEditAdoption && (
              <button
                onClick={() => setShowEditAdoption(true)}
                className="btn-secondary text-xs py-1 px-2"
              >
                <Edit2 size={12} /> Редагувати
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
            {cat.adoption.date && (
              <span><span className="font-medium">Дата адопції:</span> {formatDate(cat.adoption.date)}</span>
            )}
            {cat.adoption.from && (
              <span><span className="font-medium">Звідки взяли:</span> {cat.adoption.from}</span>
            )}
            {cat.adoption.email && (
              <span><span className="font-medium">Email:</span>{' '}
                <a href={`mailto:${cat.adoption.email}`} className="text-teal-600 hover:underline">{cat.adoption.email}</a>
              </span>
            )}
            {cat.adoption.phone1 && (
              <span><span className="font-medium">Телефон 1:</span>{' '}
                <a href={`tel:${cat.adoption.phone1}`} className="text-teal-600 hover:underline">{cat.adoption.phone1}</a>
              </span>
            )}
            {cat.adoption.phone2 && (
              <span><span className="font-medium">Телефон 2:</span>{' '}
                <a href={`tel:${cat.adoption.phone2}`} className="text-teal-600 hover:underline">{cat.adoption.phone2}</a>
              </span>
            )}
            {cat.adoption.instagram && (
              <span><span className="font-medium">Instagram:</span>{' '}
                <a href={`https://instagram.com/${cat.adoption.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{cat.adoption.instagram}</a>
              </span>
            )}
          </div>
        </div>
      ) : canEditAdoption ? (
        <div className="card mb-6 p-4 border-dashed border-2 border-gray-200 flex items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center gap-3">
            <Home size={15} className="text-gray-300" />
            Адопція не заповнена
          </div>
          <button
            onClick={() => setShowEditAdoption(true)}
            className="btn-secondary text-xs py-1 px-2"
          >
            <Edit2 size={12} /> Додати
          </button>
        </div>
      ) : null}

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
        {activeTab === 'procedures' && <RecordList catId={cat.id} type="procedure" catBirthDate={cat.birthDate} />}
        {activeTab === 'appointments' && <RecordList catId={cat.id} type="appointment" catBirthDate={cat.birthDate} />}
        {activeTab === 'treatment' && <RecordList catId={cat.id} type="treatment" catBirthDate={cat.birthDate} />}
        {activeTab === 'vaccinations' && <RecordList catId={cat.id} type="vaccination" catBirthDate={cat.birthDate} />}
        {activeTab === 'weight' && <WeightLog catId={cat.id} />}
      </div>

      {canEdit && showEdit && (
        <Modal title={`Редагувати ${cat.name}`} onClose={() => setShowEdit(false)}>
          <CatForm initialData={cat} existingNames={allCats.map((c) => c.name)} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}

      {canEditAdoption && showEditAdoption && (
        <Modal title={`Адопція — ${cat.name}`} onClose={() => setShowEditAdoption(false)}>
          <AdoptionForm initialData={cat} onSubmit={handleUpdateAdoption} onCancel={() => setShowEditAdoption(false)} />
        </Modal>
      )}
    </div>
  );
}
