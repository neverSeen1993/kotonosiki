import { Link } from 'react-router-dom';
import { Cat } from '../../types';
import { useRecordsStore } from '../../store/recordsStore';
import { formatAge, isOverdue, isDueSoon } from '../../utils/dateUtils';
import CatAvatar from './CatAvatar';
import { Calendar, Syringe, Stethoscope, Bug } from 'lucide-react';

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const day = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
}

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const { getRecordsByCat } = useRecordsStore();
  const records = getRecordsByCat(cat.id);
  const procedures = records.filter((r) => r.type === 'procedure' && (r.status === 'scheduled' || r.status === 'ongoing')).length;
  const appointments = records.filter((r) => r.type === 'appointment' && r.status === 'scheduled').length;

  // Show vaccination badge only if any vaccination has a nextDueDate that is overdue or within 7 days
  const urgentVaccination = records.filter(
    (r) => r.type === 'vaccination' && r.status === 'scheduled' && (isOverdue(r.date) || isDueSoon(r.date, 7))
  ).length;

  const treatmentThisWeek = records.filter(
    (r) => r.type === 'treatment' && r.status === 'scheduled' && isThisWeek(r.date)
  ).length;

  return (
    <Link to={`/cats/${cat.id}`} className="card block hover:shadow-md transition-shadow duration-200">
      <div className="px-3 py-3 relative">
        {(cat.fiv === 'positive' || cat.felv === 'positive') && (
          <div className="absolute top-2 right-2 flex gap-1">
            {cat.fiv === 'positive' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">FIV</span>
            )}
            {cat.felv === 'positive' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">FeLV</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <CatAvatar cat={cat} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-base truncate">
              {cat.name} <span className="text-gray-400">{cat.sex === 'male' ? '♂' : '♀'}</span>
            </h3>
            {cat.birthDate && <p className="text-xs text-gray-400 leading-tight">{formatAge(cat.birthDate)}</p>}
            {cat.color && <p className="text-xs text-gray-400 leading-tight">{cat.color}</p>}

            {(procedures > 0 || treatmentThisWeek > 0 || urgentVaccination > 0 || appointments > 0) && (
              <div className="flex items-center gap-2.5 mt-1.5">
                {procedures > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Stethoscope size={12} className="text-blue-400" />
                    <span>{procedures}</span>
                  </div>
                )}
                {treatmentThisWeek > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Bug size={12} className="text-blue-500" />
                    <span>{treatmentThisWeek}</span>
                  </div>
                )}
                {urgentVaccination > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Syringe size={12} className="text-green-500" />
                    <span>{urgentVaccination}</span>
                  </div>
                )}
                {appointments > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} className="text-purple-400" />
                    <span>{appointments}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
