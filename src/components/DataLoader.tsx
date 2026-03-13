import { useEffect, useState } from 'react';
import { useCatsStore } from '../store/catsStore';
import { useRecordsStore } from '../store/recordsStore';
import { useWeightStore } from '../store/weightStore';
import { useVisitStore } from '../store/visitStore';
import { useShiftStore } from '../store/shiftStore';
import { useNannyStore } from '../store/nannyStore';
import { useAuthStore } from '../store/authStore';
import { migrateFromLocalStorage } from '../utils/migrate';

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const { loadCats } = useCatsStore();
  const { loadRecords } = useRecordsStore();
  const { loadWeights } = useWeightStore();
  const { loadVisits } = useVisitStore();
  const { loadShifts } = useShiftStore();
  const { loadNannies } = useNannyStore();
  const { init } = useAuthStore();

  useEffect(() => {
    Promise.resolve()
      .then(() => migrateFromLocalStorage())
      .then(() => Promise.all([init(), loadCats(), loadRecords(), loadWeights(), loadVisits(), loadShifts(), loadNannies()]))
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-gray-700 font-medium mb-1">Не вдалося підключитись до сервера</p>
          <p className="text-gray-400 text-sm">Переконайтесь, що сервер запущений: <code className="bg-gray-100 px-1 rounded">npm run server</code></p>
          <button onClick={() => window.location.reload()} className="mt-4 btn-primary text-sm">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Завантаження...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
