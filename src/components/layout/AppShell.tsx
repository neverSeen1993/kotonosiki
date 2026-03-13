import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Cat, LayoutGrid, Calendar, Download, Upload, LogOut, ShieldCheck, Eye, FileSpreadsheet, Stethoscope, ClipboardList, ScrollText, Heart, Users, CalendarClock, Menu, X } from 'lucide-react';
import { useRecordsStore } from '../../store/recordsStore';
import { exportToExcel } from '../../utils/exportExcel';
import { useCatsStore } from '../../store/catsStore';
import { useWeightStore } from '../../store/weightStore';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { Cat as CatType, MedicalRecord, WeightEntry } from '../../types';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { getUpcomingAppointments, loadRecords, records } = useRecordsStore();
  const { cats, loadCats } = useCatsStore();
  const { loadWeights, weights } = useWeightStore();
  const { session, isAdmin, canEdit, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const upcoming = getUpcomingAppointments();
  const overdueCount = upcoming.filter((r) => {
    const d = new Date(r.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleExport = async () => {
    const [cats, records, weights] = await Promise.all([
      api.get<CatType[]>('/cats'),
      api.get<MedicalRecord[]>('/records'),
      api.get<WeightEntry[]>('/weights'),
    ]);
    const json = JSON.stringify({ cats, records, weights, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotonosiki-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data.cats)) {
            for (const cat of data.cats) await api.post('/cats', cat);
          }
          if (Array.isArray(data.records)) {
            for (const r of data.records) await api.post('/records', r);
          }
          if (Array.isArray(data.weights)) {
            for (const w of data.weights) await api.post('/weights', w);
          }
          await Promise.all([loadCats(), loadRecords(), loadWeights()]);
          alert('Імпорт успішний!');
        } catch {
          alert('Невірний файл резервної копії');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const navItems = [
    { to: '/', label: 'КОТО-табір', icon: <LayoutGrid size={18} />, exact: true },
    {
      to: '/appointments',
      label: 'Прийоми',
      icon: <Calendar size={18} />,
      badge: overdueCount > 0 ? overdueCount : null,
    },
    { to: '/treatments', label: 'Лікування', icon: <Stethoscope size={18} />, exact: false },
    { to: '/scheduled', label: 'Заплановані маніпуляції', icon: <ClipboardList size={18} />, exact: false },
    { to: '/adopted', label: 'Прилаштовані', icon: <Heart size={18} />, exact: false },
    { to: '/visits', label: 'Графік відвідувань', icon: <Users size={18} />, exact: false },
    { to: '/shifts', label: 'Графік котонянь', icon: <CalendarClock size={18} />, exact: false },
    ...(isAdmin ? [{ to: '/log', label: 'Історія', icon: <ScrollText size={18} />, exact: false }] : []),
  ];

  const RoleBadge = () => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isAdmin ? 'bg-teal-100 text-teal-700' : canEdit ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
      }`}
    >
      {isAdmin ? <ShieldCheck size={11} /> : <Eye size={11} />}
      {isAdmin ? 'Адмін' : canEdit ? 'Помічник' : 'Adoption Guard'}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — desktop only, unchanged */}
      <aside className="hidden md:flex md:flex-col md:w-56 bg-white border-r border-gray-100 px-3 py-6 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Link to="/" className="flex items-center gap-2 px-3 mb-8">
          <Cat size={28} className="text-teal-500" />
          <span className="text-xl font-bold text-gray-800">Котоносики</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-4 space-y-1">
          {/* User info */}
          <div className="px-3 mb-3">
            <p className="text-sm font-medium text-gray-700 truncate">{session?.name}</p>
            <div className="mt-1"><RoleBadge /></div>
          </div>

          <p className="text-xs text-gray-400 px-3 mb-2">{cats.length} котик{cats.length === 1 ? '' : cats.length >= 2 && cats.length <= 4 ? 'и' : 'ів'}</p>

          {isAdmin && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <Download size={16} /> Експорт копії (JSON)
              </button>
              <button
                onClick={() => exportToExcel(cats, records, weights)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <FileSpreadsheet size={16} /> Експорт в Excel
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <Upload size={16} /> Імпорт копії
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full transition"
          >
            <LogOut size={16} /> Вийти
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <Cat size={24} className="text-teal-500" />
          <span className="text-lg font-bold text-gray-800">Котоносики</span>
        </Link>
        <div className="flex items-center gap-2">
          <RoleBadge />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Меню"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col overflow-y-auto`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Cat size={22} className="text-teal-500" />
            <span className="text-lg font-bold text-gray-800">Меню</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-4 space-y-1">
          <div className="px-3 mb-3">
            <p className="text-sm font-medium text-gray-700 truncate">{session?.name}</p>
            <div className="mt-1"><RoleBadge /></div>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <Download size={16} /> Експорт копії (JSON)
              </button>
              <button
                onClick={() => { exportToExcel(cats, records, weights); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <FileSpreadsheet size={16} /> Експорт в Excel
              </button>
              <button
                onClick={() => { handleImport(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
              >
                <Upload size={16} /> Імпорт копії
              </button>
            </>
          )}

          <button
            onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full transition"
          >
            <LogOut size={16} /> Вийти
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
