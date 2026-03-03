import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatsStore } from '../store/catsStore';
import { useRecordsStore } from '../store/recordsStore';
import { Cat } from '../types';
import CatAvatar from '../components/cats/CatAvatar';
import CatForm from '../components/cats/CatForm';
import RecordList from '../components/records/RecordList';
import Modal from '../components/ui/Modal';
import { formatAge, formatDate } from '../utils/dateUtils';
import { ArrowLeft, Edit2, Trash2, Stethoscope, Syringe, Calendar } from 'lucide-react';

type Tab = 'procedures' | 'vaccinations' | 'appointments';

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCatById, updateCat, deleteCat } = useCatsStore();
  const { deleteRecordsByCat } = useRecordsStore();
  const [activeTab, setActiveTab] = useState<Tab>('procedures');
  const [showEdit, setShowEdit] = useState(false);

  const cat = getCatById(id!);

  if (!cat) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Cat not found.</p>
        <Link to="/" className="btn-primary inline-flex">Back to catalog</Link>
      </div>
    );
  }

  const handleUpdate = (data: Omit<Cat, 'id' | 'createdAt'>) => {
    updateCat(cat.id, data);
    setShowEdit(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete ${cat.name} and all their records? This cannot be undone.`)) {
      deleteRecordsByCat(cat.id);
      deleteCat(cat.id);
      navigate('/');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'procedures', label: 'Procedures', icon: <Stethoscope size={15} /> },
    { key: 'vaccinations', label: 'Vaccinations', icon: <Syringe size={15} /> },
    { key: 'appointments', label: 'Appointments', icon: <Calendar size={15} /> },
  ];

  return (
    <div>
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
        <ArrowLeft size={16} /> Back to catalog
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
                  <button
                    onClick={() => setShowEdit(true)}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-danger text-sm py-1.5 px-3"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                <span>
                  <span className="font-medium">Age:</span> {formatAge(cat.birthDate)}
                </span>
                <span>
                  <span className="font-medium">Born:</span> {formatDate(cat.birthDate)}
                </span>
                <span>
                  <span className="font-medium">Sex:</span> {cat.sex === 'male' ? '♂ Male' : '♀ Female'}
                </span>
                <span>
                  <span className="font-medium">Color:</span> {cat.color}
                </span>
              </div>

              {cat.notes && (
                <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{cat.notes}</p>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {showEdit && (
        <Modal title={`Edit ${cat.name}`} onClose={() => setShowEdit(false)}>
          <CatForm initialData={cat} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  );
}
