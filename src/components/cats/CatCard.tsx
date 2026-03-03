import { Link } from 'react-router-dom';
import { Cat } from '../../types';
import { useRecordsStore } from '../../store/recordsStore';
import { formatAge } from '../../utils/dateUtils';
import CatAvatar from './CatAvatar';
import { Calendar, Syringe, Stethoscope } from 'lucide-react';

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const { getRecordsByCat } = useRecordsStore();
  const records = getRecordsByCat(cat.id);
  const procedures = records.filter((r) => r.type === 'procedure').length;
  const vaccinations = records.filter((r) => r.type === 'vaccination').length;
  const appointments = records.filter((r) => r.type === 'appointment' && r.status === 'scheduled').length;

  return (
    <Link to={`/cats/${cat.id}`} className="card block hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <CatAvatar cat={cat} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg truncate">{cat.name}</h3>
            <p className="text-sm text-gray-500 truncate">{cat.breed}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{formatAge(cat.birthDate)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400 capitalize">{cat.sex === 'male' ? '♂' : '♀'} {cat.color}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-gray-50 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Stethoscope size={13} className="text-blue-400" />
            <span>{procedures}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Syringe size={13} className="text-green-400" />
            <span>{vaccinations}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={13} className="text-purple-400" />
            <span>{appointments} майбутніх</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
